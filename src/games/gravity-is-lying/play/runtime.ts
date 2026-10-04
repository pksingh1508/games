// A room being played, in the browser: the fixed 60 Hz loop, keyboard, gamepad and touch, the room
// session, the camera, the truth anchors, the renderer, Isaac's lines and the sounds. The play
// screen owns one per room and listens to it; everything here runs outside React.
import { Input, type Bindings } from "@/engine/input";
import { createLoop, type Loop } from "@/engine/loop";
import { Store } from "@/games/shared/store";
import { hum } from "../audio/hum";
import { music, songForWorld } from "../audio/music";
import { babblePlan, loadSfx, playSfx } from "../audio/sfx";
import { FLIP, HUM_TICKS, JUMP, NEWT } from "../core/constants";
import { along, TURN, type Vec } from "../core/gravity";
import { orbitDown } from "../core/orbit";
import { formatTime } from "../core/progress";
import type { IsaacLine, Room } from "../core/room";
import { RoomSession, type SessionEvent } from "../core/session";
import { newtCentre, ticksToTurn, type World } from "../core/world";
import { Anchors, trueDown } from "../render/anchors";
import { Camera, roomToScreen, viewAngle, wrap } from "../render/camera";
import { Renderer } from "../render/draw";
import { SCARF } from "../render/palette";
import type { Assist, ControlMode } from "../save";
import { walk, type WalkLatch } from "./controls";

export type Action = "left" | "right" | "up" | "down" | "jump" | "flip" | "restart" | "pause";

/** The actions you can remap, for each control mode (in Newt mode, up and down are jump and flip). */
export const remappable = (mode: ControlMode): readonly Action[] =>
  mode === "screen" ? ["left", "right", "up", "down", "jump", "flip", "restart"] : ["left", "right", "jump", "flip", "restart"];

export function defaultKeys(mode: ControlMode): Record<Action, string[]> {
  const shared = { left: ["ArrowLeft", "KeyA"], right: ["ArrowRight", "KeyD"], restart: ["KeyR"], pause: ["Escape", "KeyP"] };
  return mode === "screen"
    ? { ...shared, up: ["ArrowUp", "KeyW"], down: ["ArrowDown", "KeyS"], jump: ["Space", "KeyK"], flip: ["KeyF", "KeyJ"] }
    : { ...shared, up: [], down: [], jump: ["Space", "ArrowUp", "KeyW"], flip: ["KeyF", "ArrowDown", "KeyS"] };
}

/** Keys (remapped or default) plus the standard gamepad layout (Plan §2). */
export function bindingsFor(mode: ControlMode, keys: Partial<Record<string, string[]>> | null): Bindings<Action> {
  const defaults = defaultKeys(mode);
  const k = (a: Action) => (a !== "pause" && keys?.[a]?.length && (mode === "screen" || (a !== "up" && a !== "down")) ? keys[a]! : defaults[a]);
  const screen = mode === "screen";
  return {
    left: { keys: k("left"), buttons: [14], axis: { index: 0, dir: -1 } },
    right: { keys: k("right"), buttons: [15], axis: { index: 0, dir: 1 } },
    up: screen ? { keys: k("up"), buttons: [12], axis: { index: 1, dir: -1 } } : { keys: [] },
    down: screen ? { keys: k("down"), buttons: [13], axis: { index: 1, dir: 1 } } : { keys: [] },
    jump: { keys: k("jump"), buttons: [0] },
    flip: { keys: k("flip"), buttons: [1, 2] },
    restart: { keys: k("restart"), buttons: [3] },
    pause: { keys: k("pause"), buttons: [9] },
  };
}

/** Where a bubble points, in percent of the screen. */
export interface Bubble {
  key: number;
  text: string;
  x: number;
  y: number;
}

export interface Hud {
  /** The loop is running and listening. */
  ready: boolean;
  status: World["status"];
  deaths: number;
  /** Golden apples found this visit (bitmask). */
  apples: number;
  started: boolean;
  /** What Isaac is saying, and whether it's a lie (his leaf droops). */
  isaac: (Bubble & { lying: boolean }) | null;
  /** The sign Newt is reading. */
  sign: Bubble | null;
  /** Reduce motion: how the room would be turned (degrees), shown as a little frame. */
  frame: number | null;
  /** For screen readers: what just happened. */
  message: string;
}

export const initialHud = (): Hud => ({ ready: false, status: "play", deaths: 0, apples: 0, started: false, isaac: null, sign: null, frame: null, message: "" });

export interface LivePrefs {
  assist: Assist;
  controls: ControlMode;
  keys: Partial<Record<string, string[]>> | null;
  truthMode: boolean;
}

export interface RuntimeOptions extends LivePrefs {
  room: Room;
  reducedMotion: () => boolean;
}

export interface RuntimeEvents {
  onDeath(): void;
  onOrbital(): void;
  /** Through the portal, after a moment. */
  onWin(session: RoomSession): void;
  /** Esc / Start / a hidden tab: the screen should show (or close) its pause menu. */
  onPauseToggle(): void;
}

const WIN_DELAY_MS = 750;
/** Isaac's lines stay up this long (ticks): a beat to read, more for longer lines. */
const lineTicks = (text: string) => Math.max(110, Math.min(460, 80 + text.length * 3.4));

export class Runtime {
  readonly session: RoomSession;
  readonly input: Input<Action>;
  readonly camera: Camera;
  readonly anchors = new Anchors();
  private readonly renderer: Renderer;
  private readonly loop: Loop;
  private readonly born = performance.now();
  private prev: Vec = { x: 0, y: 0 };
  private newtTurn = 0;
  private sinceLand = 99;
  private arrowAngle: number | null = 0;
  private arrowEl: HTMLElement | SVGElement | null = null;
  private arrowText = "";
  private clockEl: HTMLElement | null = null;
  private clockText = "";
  private wonAt: number | null = null;
  private winSent = false;
  private paused = false;
  private destroyed = false;
  private padTimer: ReturnType<typeof setInterval> | null = null;
  private timers: Array<ReturnType<typeof setTimeout>> = [];
  private unsubscribe: Array<() => void> = [];
  private prefs: LivePrefs;
  /** The direction a held key walks, kept through flips and round planets until you let go. */
  private latch: WalkLatch | null = null;
  private speech: { line: number; text: string; lying: boolean; from: number; until: number; key: number } | null = null;
  private queue: number[] = [];
  private speechKey = 0;
  private message = "";
  private messages = 0;
  /** The sign Newt is at (-1: none). */
  private atSign = -1;
  /** Assist was on at some point during this visit (no apples or best time for it). */
  assisted: boolean;
  /** The camera turned freely all visit (reduce motion stayed off). */
  rotated: boolean;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly options: RuntimeOptions,
    private readonly hud: Store<Hud>,
    private readonly events: RuntimeEvents,
  ) {
    const { room } = options;
    this.prefs = { assist: options.assist, controls: options.controls, keys: options.keys, truthMode: options.truthMode };
    this.assisted = assistOn(options.assist);
    this.rotated = !options.reducedMotion();
    this.session = new RoomSession(room, { invincible: options.assist.invincible });
    this.renderer = new Renderer(canvas, options.reducedMotion);
    this.renderer.setRoom(room);
    this.camera = new Camera(options.reducedMotion);
    this.camera.snap(room, 0);
    this.afterReset();
    this.input = new Input<Action>(bindingsFor(options.controls, options.keys));
    this.loop = createLoop({
      update: () => this.update(),
      render: (alpha) => this.render(alpha),
      speed: () => (this.prefs.assist.slow ? 0.75 : 1),
    });
    this.publish();
  }

  /** Options changed mid-room: they apply straight away. */
  setPrefs(prefs: LivePrefs) {
    this.prefs = prefs;
    if (assistOn(prefs.assist)) this.assisted = true;
    this.session.setAssist({ invincible: prefs.assist.invincible });
    this.input.setBindings(bindingsFor(prefs.controls, prefs.keys));
    this.latch = null;
    this.publish();
    if (this.paused) this.render(1);
  }

  start() {
    void loadSfx();
    music.play(songForWorld(this.options.room.world));
    this.input.attach(window, () => !this.paused);
    this.unsubscribe.push(
      this.input.onPress((action) => {
        if (action === "pause") this.events.onPauseToggle();
        else if (action === "restart") this.restart();
      }),
    );
    const hidden = () => {
      if (document.visibilityState === "hidden" && !this.paused && !this.session.won) this.events.onPauseToggle();
    };
    document.addEventListener("visibilitychange", hidden);
    this.unsubscribe.push(() => document.removeEventListener("visibilitychange", hidden));
    this.render(0);
    this.loop.start();
    this.publish();
  }

  /** Where the clock is shown (written directly: it changes every frame). */
  bindClock(el: HTMLElement | null) {
    this.clockEl = el;
    this.clockText = "";
  }

  /** The HUD's gravity arrow (turned directly: it can turn every frame round a planet). */
  bindArrow(el: HTMLElement | SVGElement | null) {
    this.arrowEl = el;
    this.arrowText = "";
  }

  pause() {
    if (this.paused || this.destroyed) return;
    this.paused = true;
    this.loop.stop();
    this.input.clear();
    this.latch = null;
    music.pause();
    hum.stop();
    this.publish();
    // A gamepad's Start button still un-pauses.
    let wasDown = true;
    this.padTimer = setInterval(() => {
      const pads = typeof navigator.getGamepads === "function" ? navigator.getGamepads() : [];
      const down = pads.some((p) => p?.buttons[9]?.pressed);
      if (down && !wasDown) this.events.onPauseToggle();
      wasDown = down;
    }, 50);
  }

  resume() {
    if (!this.paused || this.destroyed) return;
    this.paused = false;
    if (this.padTimer) clearInterval(this.padTimer);
    this.padTimer = null;
    this.input.clear();
    music.resume();
    this.loop.start();
    this.publish();
  }

  get isPaused() {
    return this.paused;
  }

  /** Quick restart (R): the room from the start. Not a death. */
  restart() {
    if (this.session.won || this.paused) return;
    this.session.restart();
    this.afterReset();
    hum.stop();
    playSfx("respawn", { volume: 0.6 });
    this.publish();
  }

  /** On-screen buttons. */
  press(action: Action) {
    if (action === "pause") this.events.onPauseToggle();
    else if (action === "restart") this.restart();
    else this.input.press(action);
  }

  release(action: Action) {
    this.input.release(action);
  }

  destroy() {
    this.destroyed = true;
    this.loop.stop();
    this.input.detach();
    hum.stop();
    music.setInverted(false);
    if (this.padTimer) clearInterval(this.padTimer);
    this.timers.forEach((t) => clearTimeout(t));
    this.unsubscribe.forEach((off) => off());
  }

  // -------------------------------------------------------------------------------------------

  /** A new attempt (or a safety net): no streaks, Newt the right way up, the scarf where Newt is. */
  private afterReset() {
    const w = this.session.world;
    this.prev = newtCentre(w);
    this.newtTurn = this.targetTurn(w);
    this.anchors.reset(w);
    this.latch = null;
    this.renderer.fx.clear();
  }

  /** Newt's floor, along which "right" walks (room space), or null out in deep space. */
  private tangent(w: World): Vec | null {
    if (w.orbit) {
      const o = w.orbit;
      if (o.planet < 0) return null;
      const p = w.room.planets[o.planet]!;
      const d = Math.hypot(o.x - p.x, o.y - p.y) || 1;
      return { x: -(o.y - p.y) / d, y: (o.x - p.x) / d };
    }
    return along(w.newt.gravity);
  }

  /** Which way Newt is turned (radians): its feet toward its gravity. */
  private targetTurn(w: World): number {
    if (w.orbit) return w.orbit.planet >= 0 ? w.orbit.turn : this.newtTurn;
    return TURN[w.newt.gravity];
  }

  /** Walking (see controls.ts): the keys held, mapped along Newt's floor. */
  private moveBits(w: World): number {
    const screen = this.prefs.controls === "screen";
    const held = {
      left: this.input.sample("left"),
      right: this.input.sample("right"),
      up: screen && this.input.sample("up"),
      down: screen && this.input.sample("down"),
    };
    const next = walk(this.prefs.controls, held, this.tangent(w), this.camera.angle, this.latch);
    this.latch = next.latch;
    return next.bit;
  }

  /** Say something to screen readers (the same words twice still get read). */
  private announce(text: string) {
    this.messages++;
    this.message = this.messages % 2 ? text : `${text}​`;
  }

  private screenPoint(p: Vec): { x: number; y: number } {
    const s = roomToScreen(this.session.room, this.camera.angle, p);
    return { x: (s.x / 480) * 100, y: (s.y / 272) * 100 };
  }

  private publish() {
    const s = this.session;
    const w = s.world;
    const room = w.room;
    const isaac = this.speech && room.isaac ? { key: this.speech.key, text: this.speech.text, lying: this.speech.lying, ...this.screenPoint(room.isaac) } : null;
    const sign = this.atSign >= 0 ? { key: this.atSign, text: room.signs[this.atSign]!.text, ...this.screenPoint(room.signs[this.atSign]!) } : null;
    const frame = this.options.reducedMotion() && Math.abs(viewAngle(room)) > 0.01 ? Math.round((viewAngle(room) * 180) / Math.PI) : null;
    const next: Hud = {
      ready: this.loop?.running ?? false,
      status: w.status,
      deaths: s.deaths,
      apples: s.apples | w.apples,
      started: s.started,
      isaac,
      sign,
      frame,
      message: this.message,
    };
    const now = this.hud.get();
    const same = (Object.keys(next) as Array<keyof Hud>).every((k) => {
      const a = now[k];
      const b = next[k];
      if (a && b && typeof a === "object" && typeof b === "object") return JSON.stringify(a) === JSON.stringify(b);
      return a === b;
    });
    if (!same) this.hud.set(next);
  }

  /** QA scripts: run some ticks with these input bits (the room's own bits, not keys), then draw. */
  devStep(bits: number, ticks: number) {
    for (let i = 0; i < ticks; i++) this.update(bits);
    this.render(1);
  }

  private update(forced?: number) {
    this.input.pollGamepads();
    const before = this.session.world;
    const bits = forced ?? this.moveBits(before) | (this.input.sample("jump") ? JUMP : 0) | (this.input.sample("flip") ? FLIP : 0);
    this.prev = newtCentre(before);
    const events = this.session.tick(bits);
    const w = this.session.world;
    if (w !== before) this.afterReset();
    if (this.options.reducedMotion()) this.rotated = false;
    if (assistOn(this.prefs.assist)) this.assisted = true;

    this.camera.update(w.room, w.tick);
    this.anchors.step(w);
    // Newt turns to its new up quickly, but never in a single frame.
    const diff = wrap(this.targetTurn(w) - this.newtTurn);
    this.newtTurn = Math.abs(diff) < 0.02 ? this.targetTurn(w) : wrap(this.newtTurn + diff * 0.3);
    this.sinceLand++;
    this.renderer.fx.tick();

    this.react(events, w);
    this.stepSpeech(w);
    this.readSigns(w);
    this.stepArrow(w);
    // The tune turns upside down with Newt (as the screen shows it).
    music.setInverted(Math.abs(wrap(this.newtTurn + this.camera.angle)) > 2.3);

    if (w.status === "won" && this.wonAt === null) this.wonAt = performance.now();
    if (this.wonAt !== null && !this.winSent && performance.now() - this.wonAt > WIN_DELAY_MS) {
      this.winSent = true;
      this.events.onWin(this.session);
    }
    this.publish();
  }

  private react(events: readonly SessionEvent[], w: World) {
    const c = newtCentre(w);
    const down = trueDown(w, c.x, c.y);
    const up = down ? { x: -down.x, y: -down.y } : { x: 0, y: -1 };
    const feet = { x: c.x - up.x * (NEWT / 2), y: c.y - up.y * (NEWT / 2) };
    const fx = this.renderer.fx;
    const changed = events.some((e) => e.type === "flip" || e.type === "lever" || e.type === "turn");
    for (const e of events) {
      switch (e.type) {
        case "jump":
          playSfx("jump");
          fx.dust(feet.x, feet.y, up, 4, 0.8, "rgba(22,50,56,0.35)");
          break;
        case "land":
          this.sinceLand = 0;
          playSfx("land", { volume: Math.min(1, 0.4 + e.impact / 7) });
          if (e.impact > 2.5) fx.dust(feet.x, feet.y, up, 6, Math.min(2, e.impact / 3), "rgba(22,50,56,0.35)");
          break;
        case "step":
          playSfx("step", { rate: 0.9 + Math.random() * 0.2 });
          break;
        case "bonk":
          playSfx("bonk", { volume: 0.6 });
          break;
        case "shift":
          if (!changed) playSfx("shift");
          break;
        case "flip":
          playSfx("whoomp");
          fx.ring(c.x, c.y, "#7B2CBF", 20);
          this.announce("Flipped.");
          break;
        case "noFlip":
          playSfx("noFlip", { volume: 0.7 });
          break;
        case "lever": {
          const l = w.room.levers[e.index]!;
          playSfx("lever");
          playSfx("whoomp", { volume: 0.6, rate: 1.2 });
          fx.ring(l.x + l.w / 2, l.y + l.h / 2, "#2A9D8F", 22);
          this.announce("A lever: gravity changed.");
          break;
        }
        case "hum":
          hum.start(HUM_TICKS / 60 / (this.prefs.assist.slow ? 0.75 : 1));
          this.announce("A hum: gravity is about to turn.");
          break;
        case "turn":
          hum.stop();
          playSfx("turn");
          fx.ring(c.x, c.y, "#7B2CBF", 34, 30);
          break;
        case "apple": {
          const a = w.room.apples[e.index]!;
          playSfx("apple", { rate: 1 + e.index * 0.12 });
          fx.sparkle(a.x + a.w / 2, a.y + a.h / 2, "#F4B400", 12);
          this.announce("A golden apple!");
          break;
        }
        case "death":
          playSfx("death");
          hum.stop();
          fx.burst(c.x, c.y, down, ["#2A9D8F", SCARF, "#163238"]);
          this.announce(e.cause === "spikes" ? "Spikes! The room starts again." : e.cause === "asteroid" ? "An asteroid! The room starts again." : "Lost to the void. The room starts again.");
          this.events.onDeath();
          break;
        case "net":
          playSfx("net");
          fx.ring(c.x, c.y, "#FFB703", 26, 30);
          this.prev = newtCentre(w);
          this.newtTurn = this.targetTurn(w);
          this.anchors.reset(w);
          this.announce("Caught by the safety net.");
          this.events.onDeath();
          break;
        case "respawn":
          playSfx("respawn", { volume: 0.5 });
          break;
        case "isaac":
          this.queue.push(e.line);
          break;
        case "orbital":
          if (!this.prefs.assist.invincible) this.events.onOrbital();
          playSfx("orbital");
          break;
        case "win":
          hum.stop();
          playSfx("portal");
          music.jingle();
          fx.confetti(w.room.portal.x + w.room.portal.w / 2, w.room.portal.y + w.room.portal.h / 2, down);
          this.announce("Through the portal!");
          break;
        default:
          break;
      }
    }
  }

  /** Isaac speaks his lines one at a time (in Truth Mode, the honest version). */
  private stepSpeech(w: World) {
    const lines = w.room.isaac?.lines ?? [];
    if (this.speech && w.tick >= this.speech.until) this.speech = null;
    const next = this.queue[0];
    if (next === undefined) return;
    // A line on a clock (a countdown) cuts in at once; others wait until the last one's been read a while.
    const timed = typeof lines[next]?.at === "number";
    const read = !this.speech || w.tick - this.speech.from >= Math.min(90, (this.speech.until - this.speech.from) / 2);
    if (!timed && !read) return;
    this.queue.shift();
    const said = this.lineFor(lines[next]!);
    this.speech = { line: next, text: said.text, lying: said.lying, from: w.tick, until: w.tick + lineTicks(said.text), key: ++this.speechKey };
    this.announce(`Isaac: ${said.text}`);
    for (const s of babblePlan(said.text, said.lying)) {
      this.timers.push(setTimeout(() => !this.paused && !this.destroyed && playSfx(s.name, { rate: s.rate, volume: 0.8 }), s.at));
    }
  }

  private lineFor(line: IsaacLine): { text: string; lying: boolean } {
    if (line.lie && this.prefs.truthMode) return { text: line.truth ?? line.text, lying: false };
    return { text: line.text, lying: line.lie };
  }

  /** Reach a sign: its words show above it (and go to screen readers). */
  private readSigns(w: World) {
    const c = newtCentre(w);
    const at = w.room.signs.findIndex((s) => Math.hypot(c.x - s.x, c.y - s.y) <= 26);
    if (at !== this.atSign) {
      this.atSign = at;
      if (at >= 0) this.announce(`A sign: ${w.room.signs[at]!.text}`);
    }
  }

  /** Which way gravity really pulls on Newt, as an arrow's turn in the room (null: none, deep space). */
  private trueAngle(w: World): number | null {
    if (!w.orbit) return TURN[w.newt.gravity];
    const d = orbitDown(w.room, w.orbit.x, w.orbit.y);
    return d ? Math.atan2(-d.x, d.y) : null;
  }

  /** The HUD arrow: the truth, unless this room's arrow lies (and the true-arrow assist is off). */
  private stepArrow(w: World) {
    const cam = this.camera.angle;
    const lie = this.prefs.assist.trueArrow ? null : w.room.arrowLie;
    const truth = this.trueAngle(w);
    let target: number | null;
    if (lie === "camera") target = 0;
    else if (lie === "mirror") target = truth === null ? null : -truth + cam;
    else if (lie) target = TURN[lie] + cam;
    else target = truth === null ? null : truth + cam;
    if (target === null) {
      this.arrowAngle = null;
      return;
    }
    if (this.arrowAngle === null) this.arrowAngle = target;
    const diff = wrap(target - this.arrowAngle);
    this.arrowAngle = Math.abs(diff) < 0.01 ? target : this.arrowAngle + diff * 0.25;
  }

  private seconds() {
    return (performance.now() - this.born) / 1000;
  }

  private render(alpha: number) {
    const s = this.session;
    const w = s.world;
    const toTurn = ticksToTurn(w.room, w.tick);
    this.renderer.draw({
      world: w,
      prev: this.prev,
      alpha: w.status === "play" ? alpha : 1,
      time: this.seconds(),
      angle: this.camera.at(alpha),
      newtTurn: this.newtTurn,
      anchors: this.anchors,
      apples: s.apples | w.apples,
      isaac: { talking: Boolean(this.speech), lying: this.speech?.lying ?? false },
      sinceLand: this.sinceLand,
      hum: w.status === "play" && toTurn <= HUM_TICKS ? 1 - toTurn / HUM_TICKS : 0,
    });
    if (this.arrowEl) {
      const text = this.arrowAngle === null ? "none" : `rotate(${((this.arrowAngle * 180) / Math.PI).toFixed(1)}deg)`;
      if (text !== this.arrowText) {
        this.arrowText = text;
        this.arrowEl.dataset.gravity = text === "none" ? "none" : "";
        this.arrowEl.style.transform = text === "none" ? "" : text;
      }
    }
    if (this.clockEl) {
      const text = formatTime(s.clock);
      if (text !== this.clockText) {
        this.clockText = text;
        this.clockEl.textContent = text;
      }
    }
  }
}

export const assistOn = (a: Assist) => a.trueArrow || a.slow || a.invincible;
