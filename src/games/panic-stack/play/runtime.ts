// A level in the browser (Plan/11-panic-stack.md §12): the 60 Hz loop, your hands, the simulation, the drawing,
// the sounds (every item's true sound, landings, events, the music's panic tempo) and the HUD's numbers. Pure
// TypeScript outside React: React only reads the HUD store.
import { getAudio } from "@/engine/audio/engine";
import { createLoop, type Loop } from "@/engine/loop";
import { Store } from "@/games/shared/store";
import { Bot } from "../core/bot";
import { music } from "../audio/music";
import { loadSfx, playSfx, type SfxName } from "../audio/sfx";
import { HZ, MAX_FALLS, STABLE_TICKS } from "../core/constants";
import { EVENTS } from "../core/events";
import type { Vec } from "../core/geometry";
import { ITEMS, TAP_SOUNDS, type ItemId } from "../core/items";
import type { BeltKind, EventKind, LevelDef } from "../core/level";
import { Sim, type LoseReason, type Mode, type SimEvent, type Status } from "../core/sim";
import { Renderer } from "../render/draw";
import { canvasFont } from "../render/sprites";
import { StackInput } from "./input";

export interface HudEvent {
  kind: EventKind;
  phase: "warn" | "hit";
  /** What the warning or the event says. */
  text: string;
  /** Seconds until it hits (warnings). */
  left: number;
  siren: "real" | "fake" | null;
}

export interface Hud {
  ready: boolean;
  status: Status;
  /** Seconds left (null: no clock). */
  timeLeft: number | null;
  falls: number;
  panic: number;
  top: number;
  best: number;
  /** The stability countdown: 3, 2, 1 (0 when it isn't counting). */
  holding: number;
  event: HudEvent | null;
  holdingItem: string | null;
  canOops: boolean;
  oopsUsed: boolean;
  xray: boolean;
  paused: boolean;
  /** A tap test's caption, over its belt item (CSS px). */
  caption: { text: string; x: number; y: number } | null;
  /** For screen readers. */
  message: string;
  /** Just under the conveyor (CSS px): where warnings go, so they never hide the belt. */
  beltBottom: number;
  /** What's on the belt, nearest the end first, by what it looks like (for screen readers: keys 1–3 pick these). */
  beltNames: string;
}

export const initialHud = (): Hud => ({
  ready: false,
  status: "play",
  timeLeft: null,
  falls: 0,
  panic: 0,
  top: 0,
  best: 0,
  holding: 0,
  event: null,
  holdingItem: null,
  canOops: false,
  oopsUsed: false,
  xray: false,
  paused: true,
  caption: null,
  message: "",
  beltBottom: 0,
  beltNames: "",
});

export interface RunResult {
  status: Status;
  lost: LoseReason | null;
  ticks: number;
  limit: number;
  falls: number;
  oopsUsed: boolean;
  breaks: number;
  zen: boolean;
  best: number;
  catOnTop: boolean;
  safeBase: boolean;
}

export interface RuntimeOptions {
  level: LevelDef;
  mode: Mode;
  seed: number;
  zen: boolean;
  slowBelt: boolean;
  holdToDrop: () => boolean;
  shake: () => boolean;
  reduceMotion: () => boolean;
  reduceFlashing: () => boolean;
}

export interface RuntimeEvents {
  onEnd(result: RunResult): void;
  /** Met an item or event (seen), or found a liar out (known). */
  onMeet(what: string, known: boolean): void;
  onStat(stat: "placed" | "fallen" | "broken" | "fakePanics" | "taps" | "oopses"): void;
}

const WARN_SOUND: Partial<Record<EventKind, SfxName>> = {
  earthquake: "rumble",
  wind: "whoosh",
  cat: "meow",
  tilt: "whine",
  lowGravity: "sparkle",
  iceAge: "crackle",
  bird: "chirp",
  platformShrink: "drill",
  lightsOut: "flicker",
  reskin: "shimmer",
  conveyorRush: "whine",
};

const nameOf = (kind: BeltKind) => (kind === "xray" ? "X-ray glasses" : ITEMS[kind].name);

export class Runtime {
  sim: Sim;
  readonly renderer: Renderer;
  readonly input: StackInput;
  private readonly loop: Loop;
  private paused = true;
  private destroyed = false;
  private attempt = 0;
  private message = "";
  private messages = 0;
  private reported = false;
  private born = performance.now();
  private taps = new Map<number, number>();
  private caption: { text: string; uid: number; at: number } | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private lastWarnBeep = -1;
  /** QA: the careful stacker playing through the live loop. */
  private bot: Bot | null = null;

  constructor(
    private readonly stage: HTMLElement,
    private readonly canvas: HTMLCanvasElement,
    /** Kept in step with the belt: one element per item, where it's drawn (for tests and tools). */
    private readonly beltLayer: HTMLElement | null,
    private readonly options: RuntimeOptions,
    private readonly hud: Store<Hud>,
    private readonly events: RuntimeEvents,
  ) {
    this.sim = this.newSim();
    this.renderer = new Renderer(canvas);
    this.input = new StackInput(stage, {
      beltAt: (x, y, touch) => this.renderer.beltAt(x, y, touch),
      beltCentre: (uid) => this.renderer.beltCentre(uid),
      beltOrder: () => [...this.sim.belt].sort((a, b) => b.pos - a.pos).map((b) => b.uid),
      toWorld: (x, y) => this.renderer.toWorld(x, y),
      heldAt: () => {
        const h = this.sim.held;
        if (!h) return null;
        const p = h.body.getPosition();
        return { x: p.x, y: p.y };
      },
      live: () => !this.paused && !this.destroyed && this.sim.status === "play",
      holdToDrop: () => this.options.holdToDrop(),
      onActivity: () => {
        getAudio();
        void loadSfx();
      },
    });
    this.loop = createLoop({ update: () => this.update(), render: () => this.render() });
  }

  private newSim() {
    const o = this.options;
    return new Sim({ level: o.level, seed: o.seed + this.attempt * 7919, mode: o.mode, zen: o.zen, slowBelt: o.slowBelt });
  }

  start() {
    this.input.attach();
    this.resizeObserver = new ResizeObserver(() => this.measure());
    this.resizeObserver.observe(this.stage);
    // A canvas can't use CSS variables for fonts: read the family once.
    const family = getComputedStyle(this.canvas).getPropertyValue("--font-g-rubik").trim();
    if (family) canvasFont.family = `${family}, system-ui, sans-serif`;
    this.measure();
    this.render();
    this.publish(true);
  }

  pause() {
    if (this.paused || this.destroyed) return;
    this.paused = true;
    this.loop.stop();
    this.input.clear();
    // Whatever was in your hand stays where it is (the hand holds still).
    music.stop();
    this.publish(true);
  }

  resume() {
    if (this.destroyed) return;
    this.paused = false;
    this.measure();
    this.loop.start();
    if (this.sim.status === "play") music.start();
    this.publish(true);
  }

  get isPaused() {
    return this.paused;
  }

  /** From the start again (a fresh tower, a fresh belt, the same level). */
  restart() {
    this.attempt++;
    this.sim = this.newSim();
    if (this.bot) this.devAutoplay(true);
    this.reported = false;
    this.taps.clear();
    this.caption = null;
    this.input.clear();
    this.render();
    this.publish(true);
  }

  destroy() {
    this.destroyed = true;
    this.loop.stop();
    this.input.detach();
    this.resizeObserver?.disconnect();
    music.stop();
  }

  measure = () => {
    if (this.destroyed) return;
    const r = this.stage.getBoundingClientRect();
    if (r.width < 2) return;
    this.renderer.resize(r.width, r.height, Math.min(2, window.devicePixelRatio || 1));
    // Paused (the start card), nothing redraws by itself.
    if (this.paused) this.render();
  };

  // -- From the buttons ------------------------------------------------------------------------------

  rotate(steps: number) {
    this.input.push({ type: "rotate", steps });
  }

  drop() {
    this.input.push({ type: "release" });
  }

  /** Oops (§10 rule 5): straight away, even from the fail card. */
  oops(): boolean {
    if (!this.sim.canOops()) return false;
    const was = this.sim.status;
    const ok = this.sim.oops();
    if (ok) {
      this.reported = false;
      this.input.clear();
      playSfx("oops");
      this.events.onStat("oopses");
      this.announce("Oops! Back to just before that drop. That was your one Oops.");
      if (was !== "play" && !this.paused) music.start();
      this.publish(true);
    }
    return ok;
  }

  // -- The loop --------------------------------------------------------------------------------------

  private update() {
    const before = this.sim.status;
    const input = this.bot ? this.bot.next() : this.input.take(1 / HZ);
    const events = this.sim.step(input);
    this.react(events);
    music.panic = this.sim.panic / 100;
    if (before === "play" && this.sim.status !== "play" && !this.reported) this.finish();
    // The HUD redraws a page of React: 15 times a second is plenty, sooner when something that matters changed.
    const urgent = events.some((e) => e.type !== "land" && e.type !== "bump" && e.type !== "height" && e.type !== "weld" && e.type !== "squish");
    if (urgent || ++this.hudTick % 4 === 0) this.publish();
  }

  private hudTick = 0;

  private announce(text: string) {
    this.messages++;
    this.message = this.messages % 2 ? text : `${text}​`;
  }

  private now() {
    return (performance.now() - this.born) / 1000;
  }

  private react(events: readonly SimEvent[]) {
    const sim = this.sim;
    const r = this.renderer;
    for (const e of events) {
      switch (e.type) {
        case "grab":
          playSfx("grab");
          this.events.onMeet(e.kind, false);
          break;
        case "release":
          this.events.onStat("placed");
          this.events.onMeet(e.kind, true);
          break;
        case "land": {
          const def = ITEMS[e.kind];
          const k = Math.min(1, e.impulse / (def.mass * 3));
          playSfx(def.tap, { volume: 0.25 + 0.75 * k, rate: 0.9 + 0.2 * k });
          r.burst("dust", { x: e.at.x, y: e.at.y - def.size.h / 2 }, Math.round(2 + 8 * k), "rgba(120,110,140,0.6)", 0.8 + k);
          break;
        }
        case "bump": {
          const def = ITEMS[e.kind];
          playSfx(def.tap, { volume: 0.3, rate: 1.1 });
          break;
        }
        case "fall":
          this.events.onStat("fallen");
          if (e.why === "belt") {
            playSfx("bin");
            this.announce(`The ${nameOf(e.kind)} fell off the end of the belt. ${this.fallsLeft()}`);
          } else if (e.why === "floated") {
            this.announce(`The ${nameOf(e.kind)} floated away. ${this.fallsLeft()}`);
          } else this.announce(`The ${nameOf(e.kind)} fell. ${this.fallsLeft()}`);
          break;
        case "gone":
          playSfx("poof", { volume: 0.5 });
          r.burst("dust", e.at, 8, "rgba(255,255,255,0.8)", 1.2);
          break;
        case "break":
          playSfx("shatter");
          r.burst("shard", e.at, 22, "#F7F4EF", 3);
          r.burst("shard", e.at, 10, "#2F5DA8", 3);
          this.events.onStat("broken");
          this.announce("Crash! The vase broke.");
          break;
        case "pop":
          playSfx("pop");
          r.burst("confetti", e.at, 16, "#E63946", 3);
          this.announce("Pop! The balloon burst.");
          break;
        case "melted":
          playSfx("drip");
          r.burst("puddle", { x: e.at.x, y: e.at.y - 0.05 }, 1, "rgba(140,203,242,0.8)", 0);
          this.announce("The ice cube melted into a puddle.");
          break;
        case "weld":
          playSfx("goo", { volume: 0.6 });
          r.burst("goo", e.at, 6, "rgba(220,240,255,0.9)", 0.6);
          break;
        case "squish":
          playSfx("pff");
          break;
        case "tap": {
          this.events.onStat("taps");
          this.taps.set(e.uid, this.now());
          if (e.kind === "xray") break;
          const def = ITEMS[e.kind];
          playSfx(def.tap);
          this.caption = { text: TAP_SOUNDS[def.tap].caption, uid: e.uid, at: this.now() };
          this.events.onMeet(e.kind, false);
          this.announce(`Tap: ${TAP_SOUNDS[def.tap].caption}.`);
          break;
        }
        case "xray":
          playSfx("xray");
          this.announce("X-ray glasses! Every item's true shape and weight, for five seconds.");
          break;
        case "warn": {
          const ev = e.event;
          this.events.onMeet(ev.kind, false);
          if (ev.siren === "fake") playSfx("sirenFake");
          else if (ev.siren === "real") playSfx("siren");
          else {
            const s = WARN_SOUND[ev.kind];
            if (s) playSfx(s);
          }
          const what = ev.siren ? `PANIC! ${EVENTS[ev.pretends ?? ev.kind].name}!` : EVENTS[ev.kind].warning;
          this.announce(`${what} (in two seconds)`);
          break;
        }
        case "eventHit": {
          const ev = e.event;
          if (ev.kind === "earthquake") playSfx("rumble", { volume: 1.2 });
          if (ev.kind === "wind") playSfx("whoosh", { volume: 1.2 });
          if (ev.kind === "reskin") playSfx("shimmer");
          if (ev.kind === "fakePanic") break;
          this.announce(EVENTS[ev.kind].doing);
          break;
        }
        case "eventEnd":
          if (e.event.kind === "fakePanic") this.announce("…nothing happened. That siren was cardboard.");
          break;
        case "fakeSurvived":
          this.events.onStat("fakePanics");
          break;
        case "panic":
          playSfx("alarm");
          break;
        case "creature":
          if (e.kind === "cat" && (e.what === "arrive" || e.what === "bump")) playSfx("meow");
          if (e.kind === "cat" && e.what === "sit") {
            playSfx("meowHappy");
            this.announce("The cat's sitting on top of your tower.");
          }
          if (e.kind === "bird") playSfx("chirp");
          break;
        case "stable":
          if (e.left > 0) {
            playSfx("ding", { rate: 1 + (3 - e.left) * 0.12 });
            this.announce(`Holding… ${e.left}`);
          }
          break;
        case "milestone":
          playSfx("win");
          r.burst("confetti", { x: 0, y: sim.top + 0.3 }, 30, "#FFD23F", 4);
          this.announce(`★ ${e.metres} m medal!`);
          break;
        case "height":
          if (Math.floor(e.metres) > Math.floor(this.lastHeight)) playSfx("ding", { volume: 0.5, rate: 1.4 });
          this.lastHeight = e.metres;
          break;
        case "oops":
          break;
        case "won":
          playSfx("win");
          setTimeout(() => playSfx("cheer"), 250);
          r.burst("confetti", { x: 0, y: sim.top + 0.3 }, 40, "#FFD23F", 4);
          r.burst("confetti", { x: 0, y: sim.top + 0.3 }, 30, "#2B7FFF", 4);
          this.announce("It held! Level cleared.");
          break;
        case "lost":
          playSfx("fail");
          this.announce(e.why === "time" ? "Time's up." : e.why === "broke" ? "Something fragile broke." : "Three things fell.");
          break;
        case "over":
          playSfx("fail");
          break;
        default:
          break;
      }
    }
    // A warning ticks down with soft beeps.
    const ev = sim.event;
    if (ev && ev.phase === "warn") {
      const left = Math.ceil((120 - ev.t) / 60);
      if (left !== this.lastWarnBeep && left > 0) {
        this.lastWarnBeep = left;
        if (ev.siren !== "fake") playSfx("ding", { volume: 0.25, rate: 0.7 });
      }
    } else this.lastWarnBeep = -1;
  }

  private lastHeight = 0;

  private fallsLeft() {
    const s = this.sim;
    if (s.zen) return "";
    const left = MAX_FALLS - s.falls;
    return left > 0 ? `${left} more and it's over.` : "";
  }

  private finish() {
    this.reported = true;
    music.stop();
    this.input.clear();
    this.publish(true);
    const sim = this.sim;
    const tower = sim.tower();
    const cat = sim.creatures.find((c) => c.kind === "cat" && c.phase === "sit");
    const result: RunResult = {
      status: sim.status,
      lost: sim.lost,
      ticks: sim.played,
      limit: sim.timeLimited ? sim.level.time * HZ : 0,
      falls: sim.falls,
      oopsUsed: sim.oopsUsed,
      breaks: sim.breaks,
      zen: sim.zen,
      best: sim.best,
      catOnTop: !!cat && tower.creatures.includes(cat),
      safeBase: tower.items.some((i) => i.kind === "safe" && i.body.getPosition().y < 0.5),
    };
    // A moment to see it happen before the card.
    setTimeout(
      () => {
        if (!this.destroyed && this.sim === sim && sim.status !== "play") this.events.onEnd(result);
      },
      sim.status === "won" ? 900 : 1300,
    );
  }

  private lastFrame = 0;

  private render() {
    const now = this.now();
    if (!this.paused && this.lastFrame) this.renderer.frameTook((now - this.lastFrame) * 1000);
    this.lastFrame = this.paused ? 0 : now;
    if (this.caption && now - this.caption.at > 1.8) this.caption = null;
    this.renderer.draw({
      sim: this.sim,
      t: now,
      pointer: this.bot ? this.bot.aimPoint() : this.input.pointer,
      touch: this.input.touch,
      grip: this.input.grip,
      hover: this.input.hover,
      taps: this.taps,
      reduceMotion: this.options.reduceMotion(),
      reduceFlashing: this.options.reduceFlashing(),
      shake: this.options.shake(),
    });
    // The cursor tells you what a press will do.
    const want = this.sim.held ? "grabbing" : this.input.hover !== null ? "grab" : "default";
    if (this.canvas.style.cursor !== want) this.canvas.style.cursor = want;
    this.syncLayer();
  }

  /** The belt items' boxes, and the camera, as data on the page (cheap: only what changed). */
  private syncLayer() {
    const cam = this.renderer.cam;
    const camKey = `${cam.scale.toFixed(2)},${cam.ox.toFixed(1)},${cam.oy.toFixed(1)}`;
    if (this.stage.dataset.camera !== camKey) this.stage.dataset.camera = camKey;
    const layer = this.beltLayer;
    if (!layer) return;
    const slots = this.renderer.slots;
    while (layer.children.length < slots.length) layer.appendChild(document.createElement("span"));
    while (layer.children.length > slots.length) layer.lastElementChild!.remove();
    slots.forEach((slot, k) => {
      const el = layer.children[k] as HTMLElement;
      const b = this.sim.belt.find((x) => x.uid === slot.uid);
      const uid = String(slot.uid);
      if (el.dataset.uid !== uid) {
        el.dataset.uid = uid;
        el.dataset.kind = b?.kind ?? "";
        el.dataset.beltItem = "";
      }
      const box = `${Math.round(slot.x - slot.w / 2)},${Math.round(slot.y - slot.h / 2)},${Math.round(slot.w)},${Math.round(slot.h)}`;
      if (el.dataset.box !== box) {
        el.dataset.box = box;
        const [x, y, w, h] = box.split(",");
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.width = `${w}px`;
        el.style.height = `${h}px`;
      }
    });
  }

  /** Where the tap-test caption goes: just above its item on the belt. */
  private captionAt(): Hud["caption"] {
    const c = this.caption;
    if (!c) return null;
    const slot = this.renderer.slots.find((x) => x.uid === c.uid);
    if (!slot) return null;
    return { text: c.text, x: Math.round(slot.x), y: Math.round(slot.y - slot.h / 2 - 8) };
  }

  private publish(force = false) {
    const sim = this.sim;
    const ev = sim.status === "play" ? sim.event : null;
    const event: HudEvent | null = ev
      ? {
          kind: ev.kind,
          phase: ev.phase,
          text: ev.siren ? `PANIC! ${EVENTS[ev.pretends ?? ev.kind].name}!` : ev.phase === "warn" ? EVENTS[ev.kind].warning : EVENTS[ev.kind].doing,
          left: ev.phase === "warn" ? Math.max(0, Math.ceil((120 - ev.t) / 60)) : 0,
          siren: ev.siren,
        }
      : null;
    const held = sim.held;
    const next: Hud = {
      ready: true,
      status: sim.status,
      timeLeft: sim.timeLimited ? Math.ceil(sim.ticksLeft / HZ) : null,
      falls: sim.falls,
      panic: Math.round(sim.panic),
      top: Math.round(sim.top * 10) / 10,
      best: Math.round(sim.best * 10) / 10,
      holding: sim.stableTicks > 0 && sim.mode === "level" ? Math.max(1, Math.ceil((STABLE_TICKS - sim.stableTicks) / HZ)) : 0,
      event: event && (ev!.phase === "warn" || ev!.kind !== "fakePanic" || ev!.t < 150) ? event : null,
      holdingItem: held ? ITEMS[held.skin as ItemId].name : null,
      canOops: sim.canOops(),
      oopsUsed: sim.oopsUsed,
      xray: sim.xray > 0,
      paused: this.paused,
      caption: this.captionAt(),
      message: this.message,
      beltBottom: Math.round(this.renderer.beltBottom()),
      beltNames: [...sim.belt]
        .sort((a, b) => b.pos - a.pos)
        .map((b, k) => `${k + 1}: ${b.kind === "xray" ? "X-ray glasses" : ITEMS[sim.skinOf(b.kind)].name}`)
        .join(", "),
    };
    const now = this.hud.get();
    const same = (Object.keys(next) as Array<keyof Hud>).every((k) => (k === "event" || k === "caption" ? JSON.stringify(now[k]) === JSON.stringify(next[k]) : now[k] === next[k]));
    if (!force && same) return;
    this.hud.set(next);
  }

  // -- QA ----------------------------------------------------------------------------------------------

  /** QA: a pile of things on the platform, for measuring speed. */
  devPile(n: number) {
    const kinds = ["brick", "crate", "plate", "block", "loaf", "cargo"] as const;
    for (let k = 0; k < n; k++) this.sim.drop(kinds[k % kinds.length]!, { x: ((k % 5) - 2) * 0.82, y: 0.5 + Math.floor(k / 5) * 0.75 });
  }

  /** QA: a panic event now (with its warning), whatever the level. */
  devEvent(kind: EventKind) {
    this.sim.scheduler.inject(kind);
  }

  /** QA: let the careful stacker (the tests' bot) play this level through the live loop. */
  devAutoplay(on: boolean) {
    this.bot = on ? new Bot(this.sim, { beltAt: (uid) => this.renderer.beltCentre(uid) }) : null;
  }

  /** QA: run ticks (the bot's input if it's playing), then draw. */
  devStep(ticks: number) {
    for (let i = 0; i < ticks; i++) {
      const before = this.sim.status;
      this.react(this.sim.step(this.bot ? this.bot.next() : this.input.take(1 / HZ)));
      if (before === "play" && this.sim.status !== "play" && !this.reported) this.finish();
    }
    this.render();
    this.publish(true);
  }
}

export type { Vec };
