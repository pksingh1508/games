// A climb being played, in the browser (Plan/08-almost-there.md §3, §12): the fixed 60 Hz loop,
// keyboard, gamepad and touch, the camera that cuts from screen to screen, Chirp, the sounds, the
// fake summit's credits and the real summit, and the autosave that makes every fall stick.
// Everything here runs outside React; the play screen owns one and listens to it.
import { Input, type Bindings } from "@/engine/input";
import { createLoop, type Loop } from "@/engine/loop";
import { Store } from "@/games/shared/store";
import { chargeTone, ambience, whoosh } from "../audio/live";
import { music } from "../audio/music";
import { babble, loadSfx, playSfx, stepSound } from "../audio/sfx";
import { chirpFor, lineMs, type Cue, type Mood } from "../core/chirp";
import { collapseSummit, pipScreen, pipZone, plantCheckpoint, returnToCheckpoint, tickClimb, type Climb, type ClimbEvent, type Story } from "../core/climb";
import { AUTOSAVE_TICKS, CHARGE_MAX, JUMP, LEFT, RIGHT, TILE, VIEW_H, VIEW_W } from "../core/constants";
import { isSolidTile, rowTop, screenOf, T, tileAt, type Mountain, type ZoneId } from "../core/mountain";
import { formatClock, shownProgress, type Shown } from "../core/progress";
import { cloneClimb, step, windOn } from "../core/sim";
import { Renderer, type ChirpView } from "../render/draw";
import { writeClimb } from "../save";

export type Action = "left" | "right" | "jump" | "checkpoint" | "back" | "pause";
export const REMAPPABLE: readonly Action[] = ["left", "right", "jump", "checkpoint", "back"];

export const DEFAULT_KEYS: Record<Action, string[]> = {
  left: ["ArrowLeft", "KeyA"],
  right: ["ArrowRight", "KeyD"],
  jump: ["Space", "ArrowUp", "KeyW"],
  checkpoint: ["KeyC"],
  back: ["KeyR"],
  pause: ["Escape", "KeyP"],
};

/** Keys (remapped or default) plus the standard gamepad layout. */
export function bindingsFor(keys: Partial<Record<string, string[]>> | null): Bindings<Action> {
  const k = (a: Action) => (a !== "pause" && keys?.[a]?.length ? keys[a]! : DEFAULT_KEYS[a]);
  return {
    left: { keys: k("left"), buttons: [14], axis: { index: 0, dir: -1 } },
    right: { keys: k("right"), buttons: [15], axis: { index: 0, dir: 1 } },
    jump: { keys: k("jump"), buttons: [0, 1] },
    checkpoint: { keys: k("checkpoint"), buttons: [2] },
    back: { keys: k("back"), buttons: [3] },
    pause: { keys: k("pause"), buttons: [9] },
  };
}

/** The fake summit's credits (Plan §5): flag, THE END, the credits… and halfway, the camera looks up. */
export type CreditsPhase = "plant" | "end" | "roll" | "kidding" | "shake";

export interface Hud {
  /** The loop is running and listening. */
  ready: boolean;
  story: Story;
  progress: Shown;
  zone: ZoneId;
  chirp: { text: string; mood: Mood; id: number } | null;
  sign: { text: string; warning: boolean; id: number } | null;
  credits: CreditsPhase | null;
  /** The credits can be skipped (you've seen them before). */
  skippable: boolean;
  /** Assist checkpoints planted in this zone. */
  checkpoints: number;
  feathers: number;
  /** For screen readers: what just happened. */
  message: string;
}

export const initialHud = (): Hud => ({
  ready: false,
  story: "climbing",
  progress: { kind: "bar", value: 0 },
  zone: "foothills",
  chirp: null,
  sign: null,
  credits: null,
  skippable: false,
  checkpoints: 0,
  feathers: 0,
  message: "",
});

export interface RuntimeAssist {
  checkpoints: boolean;
  preview: boolean;
  speed: 1 | 0.75;
}

export interface LivePrefs {
  assist: RuntimeAssist;
  keys: Partial<Record<string, string[]>> | null;
  hat: number | null;
  vibrate: boolean;
}

export interface RuntimeOptions extends LivePrefs {
  mountain: Mountain;
  climb: Climb;
  /** Picked up a saved climb (Chirp says hello again). */
  resumed: boolean;
  /** Seen the fake credits before (they can be skipped). */
  seenCredits: boolean;
  reducedMotion: () => boolean;
}

export interface RuntimeEvents {
  onPauseToggle(): void;
  onJump(): void;
  /** A fall (px lost), counted in the stats. */
  onFall(drop: number): void;
  onFeather(index: number): void;
  onFakeSummit(): void;
  /** The flag is planted on the real summit: show the ending. */
  onSummit(climb: Climb): void;
}

// The fake credits' timeline, in ticks.
const CREDITS = { end: 150, roll: 270, pan: 600, panEnd: 840, kidding: 900, back: 1020, fall: 1080 } as const;
const SUMMIT_ENDING = 330;
const IDLE_TICKS = 60 * 20;
/** Signs you can read from this close (px). */
const SIGN_NEAR = { x: 40, y: 36 };
const LIES = ["Last jump!", "This is the hard part.", "Express to the Top!"];

export class Runtime {
  readonly m: Mountain;
  climb: Climb;
  readonly input: Input<Action>;
  private readonly renderer: Renderer;
  private readonly loop: Loop;
  private prev = { x: 0, y: 0 };
  private readonly born = performance.now();
  private paused = false;
  private destroyed = false;
  private padTimer: ReturnType<typeof setInterval> | null = null;
  private unsubscribe: Array<() => void> = [];
  private prefs: LivePrefs;
  private clockEl: HTMLElement | null = null;
  private clockText = "";
  private chirpEl: HTMLElement | null = null;
  private signEl: HTMLElement | null = null;
  private creditsEl: HTMLElement | null = null;
  private sinceSave = 0;
  private message = "";
  private messages = 0;
  /** Chirp: where it is (world), and the line it's saying. */
  private chirpPos = { x: 0, y: 0 };
  private line: { text: string; mood: Mood; id: number; until: number } | null = null;
  private lineIds = 0;
  private idle = 0;
  private atSign = -1;
  private signLine: { text: string; warning: boolean; id: number; until: number } | null = null;
  private onElevator = false;
  private fallTicks = 0;
  private credits = -1;
  private summitT = -1;
  private flags = { fake: -1, real: -1 };
  private cam = { x: 0, y: 0 };
  private wakeLock: { release(): Promise<void> } | null = null;
  private lastZone: ZoneId | null = null;
  private resumeCue: number;
  /** Dev builds: input bits forced by a QA script (null: the real input). */
  private forced: number | null = null;
  /** The real summit's ending has been shown: the climb is over. */
  private finished = false;
  /** Chirp hasn't said hello yet (a new climb). */
  private greet = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly options: RuntimeOptions,
    private readonly hud: Store<Hud>,
    private readonly events: RuntimeEvents,
  ) {
    this.m = options.mountain;
    this.climb = options.climb;
    this.prefs = { assist: options.assist, keys: options.keys, hat: options.hat, vibrate: options.vibrate };
    if (assistOn(options.assist)) this.climb.assisted = true;
    this.renderer = new Renderer(canvas);
    this.renderer.setMountain(this.m);
    const p = this.climb.sim.pip;
    this.prev = { x: p.x, y: p.y };
    this.chirpPos = { x: p.x - 14, y: p.y - 16 };
    this.input = new Input<Action>(bindingsFor(options.keys));
    this.loop = createLoop({
      update: () => this.update(),
      render: (alpha) => this.render(alpha),
      speed: () => this.prefs.assist.speed,
    });
    // Picked up mid-credits: they start again. Mid-ending: straight to it.
    if (this.climb.story === "credits") this.credits = 0;
    if (this.climb.story === "summit") this.summitT = SUMMIT_ENDING - 1;
    if (this.climb.sim.collapsed) this.flags.fake = -1;
    this.resumeCue = options.resumed ? 45 : -1;
    this.placeCamera();
    this.publish();
  }

  /** Options changed mid-climb: they apply straight away. */
  setPrefs(prefs: LivePrefs) {
    this.prefs = prefs;
    if (assistOn(prefs.assist)) this.climb.assisted = true;
    this.input.setBindings(bindingsFor(prefs.keys));
    this.publish();
    if (this.paused) this.render(1);
  }

  start() {
    void loadSfx();
    const zone = pipZone(this.m, this.climb);
    this.lastZone = zone;
    if (this.credits >= 0) music.play("credits");
    else music.play(zone);
    ambience.start(zone);
    this.input.attach(window, () => !this.paused);
    this.unsubscribe.push(
      this.input.onPress((action) => {
        if (action === "pause") this.events.onPauseToggle();
        else if (action === "checkpoint") this.plant();
        else if (action === "back") this.back();
        else if (action === "jump" && this.credits >= 0 && this.options.seenCredits && this.credits < CREDITS.back) this.credits = CREDITS.back;
      }),
    );
    const visibility = () => {
      if (document.visibilityState === "hidden") {
        this.save();
        if (!this.paused) this.events.onPauseToggle();
      } else if (!this.paused) void this.lockScreen();
    };
    const pagehide = () => this.save();
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", pagehide);
    this.unsubscribe.push(() => document.removeEventListener("visibilitychange", visibility));
    this.unsubscribe.push(() => window.removeEventListener("pagehide", pagehide));
    // A new climb: Chirp speaks up on the first jump (the first sign does the explaining).
    this.greet = this.climb.stats.jumps === 0 && !this.options.resumed;
    this.render(0);
    this.loop.start();
    void this.lockScreen();
    this.publish();
  }

  /** Where the clock, Chirp's bubble, the sign's bubble and the credits are shown (written every frame). */
  bind(els: { clock?: HTMLElement | null; chirp?: HTMLElement | null; sign?: HTMLElement | null; credits?: HTMLElement | null }) {
    if (els.clock !== undefined) {
      this.clockEl = els.clock;
      this.clockText = "";
    }
    if (els.chirp !== undefined) this.chirpEl = els.chirp;
    if (els.sign !== undefined) this.signEl = els.sign;
    if (els.credits !== undefined) this.creditsEl = els.credits;
  }

  pause() {
    if (this.paused || this.destroyed) return;
    this.paused = true;
    this.loop.stop();
    this.input.clear();
    chargeTone.set(null);
    whoosh.set(0);
    music.pause();
    this.save();
    void this.releaseScreen();
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
    void this.lockScreen();
    this.publish();
  }

  get isPaused() {
    return this.paused;
  }

  /** On-screen buttons. */
  press(action: Action) {
    if (action === "pause") this.events.onPauseToggle();
    else if (action === "checkpoint") this.plant();
    else if (action === "back") this.back();
    else {
      if (action === "jump" && this.credits >= 0 && this.options.seenCredits && this.credits < CREDITS.back) this.credits = CREDITS.back;
      this.input.press(action);
    }
  }

  release(action: Action) {
    this.input.release(action);
  }

  /** Assist: plant a checkpoint flag here. */
  plant() {
    if (!this.prefs.assist.checkpoints || this.paused) return;
    if (plantCheckpoint(this.m, this.climb)) {
      playSfx("checkpoint");
      this.announce("Checkpoint planted.");
      this.save();
      this.publish();
    }
  }

  /** Assist: back to the last checkpoint. */
  back() {
    if (!this.prefs.assist.checkpoints || this.paused) return;
    if (returnToCheckpoint(this.climb)) {
      playSfx("warp");
      this.afterJump();
      this.announce("Back to your checkpoint.");
      this.save();
      this.publish();
    }
  }

  /** Save the climb now (refreshing can't undo a fall: it's always saved). Not once it's over. */
  save() {
    if (this.destroyed || this.finished) return;
    writeClimb(this.climb);
    this.sinceSave = 0;
  }

  destroy() {
    this.save();
    this.destroyed = true;
    this.loop.stop();
    this.input.detach();
    chargeTone.set(null);
    whoosh.set(0);
    ambience.stop();
    void this.releaseScreen();
    if (this.padTimer) clearInterval(this.padTimer);
    this.unsubscribe.forEach((off) => off());
  }

  /** Dev builds: run ticks with these input bits (QA scripts drive the climb exactly). */
  devStep(bits: number, ticks = 1) {
    this.forced = bits;
    for (let i = 0; i < ticks && !this.destroyed; i++) this.update();
    this.forced = null;
    this.render(1);
  }

  /** Dev builds: swap in another climb (a fresh one, to replay a recorded route from its first tick). */
  devSetClimb(climb: Climb) {
    this.climb = climb;
    this.credits = climb.story === "credits" ? 0 : -1;
    this.summitT = -1;
    this.flags = { fake: -1, real: -1 };
    this.afterJump();
    this.render(1);
  }

  /** Dev builds: put Pip somewhere (QA scripts). */
  devTeleport(x: number, y: number) {
    const p = this.climb.sim.pip;
    Object.assign(p, { x, y, vx: 0, vy: 0, rx: 0, ry: 0, grounded: false, charge: 0, stun: 0, takeoff: y + p.h, peak: y + p.h });
    this.afterJump();
  }

  // -------------------------------------------------------------------------------------------

  private afterJump() {
    const p = this.climb.sim.pip;
    this.prev = { x: p.x, y: p.y };
    this.placeCamera();
    this.chirpPos = { x: p.x - 14, y: p.y - 16 };
  }

  private async lockScreen() {
    try {
      const nav = navigator as Navigator & { wakeLock?: { request(type: "screen"): Promise<{ release(): Promise<void> }> } };
      if (!nav.wakeLock || this.wakeLock || document.visibilityState !== "visible") return;
      this.wakeLock = await nav.wakeLock.request("screen");
    } catch {
      // Not allowed (battery saver, an iframe): the screen may dim.
    }
  }

  private async releaseScreen() {
    const lock = this.wakeLock;
    this.wakeLock = null;
    try {
      await lock?.release();
    } catch {
      // Already gone.
    }
  }

  private announce(text: string) {
    this.messages++;
    this.message = this.messages % 2 ? text : `${text}​`;
  }

  private say(cue: Cue) {
    const line = chirpFor(this.climb, cue);
    if (!line) return;
    this.line = { ...line, id: ++this.lineIds, until: performance.now() + lineMs(line) };
    babble(line.text, line.mood);
    this.announce(`Chirp: ${line.text}`);
  }

  private publish() {
    const c = this.climb;
    const zone = pipZone(this.m, c);
    const now = performance.now();
    if (this.line && now > this.line.until) this.line = null;
    if (this.signLine && now > this.signLine.until) this.signLine = null;
    const sign = this.signLine ?? (this.atSign >= 0 ? { ...this.m.signs[this.atSign]!, id: this.atSign } : null);
    const phase = this.creditsPhase();
    const next: Hud = {
      ready: this.loop?.running ?? false,
      story: c.story,
      progress: shownProgress(this.m, c),
      zone,
      chirp: this.line ? { text: this.line.text, mood: this.line.mood, id: this.line.id } : null,
      sign: sign ? { text: sign.text, warning: sign.warning, id: sign.id } : null,
      credits: phase,
      skippable: this.options.seenCredits,
      checkpoints: c.checkpoints.filter((k) => k.zone === zone).length,
      feathers: countBits(c.sim.feathers),
      message: this.message,
    };
    const was = this.hud.get();
    const same =
      was.ready === next.ready &&
      was.story === next.story &&
      sameShown(was.progress, next.progress) &&
      was.zone === next.zone &&
      was.chirp?.id === next.chirp?.id &&
      was.sign?.id === next.sign?.id &&
      was.sign?.text === next.sign?.text &&
      was.credits === next.credits &&
      was.skippable === next.skippable &&
      was.checkpoints === next.checkpoints &&
      was.feathers === next.feathers &&
      was.message === next.message;
    if (!same) this.hud.set(next);
  }

  private creditsPhase(): CreditsPhase | null {
    const t = this.credits;
    if (t < 0) return null;
    if (t < CREDITS.end) return "plant";
    if (t < CREDITS.roll) return "end";
    if (t < CREDITS.kidding) return "roll";
    if (t < CREDITS.back) return "kidding";
    return "shake";
  }

  private placeCamera() {
    const { col, row } = pipScreen(this.climb);
    this.cam = { x: col * VIEW_W, y: rowTop(row) };
  }

  private bits(): number {
    const sampled = (this.input.sample("left") ? LEFT : 0) | (this.input.sample("right") ? RIGHT : 0) | (this.input.sample("jump") ? JUMP : 0);
    return this.forced ?? sampled;
  }

  private update() {
    this.input.pollGamepads();
    const c = this.climb;
    const p = c.sim.pip;
    this.prev = { x: p.x, y: p.y };
    this.renderer.fx.tick();

    if (this.credits >= 0) {
      this.bits();
      this.updateCredits();
      this.publish();
      return;
    }
    if (this.summitT >= 0) {
      this.bits();
      this.summitT++;
      this.flags.real = Math.min(1, this.summitT / 60);
      if (this.summitT === 70) this.say("summit");
      if (this.summitT === SUMMIT_ENDING) {
        // The climb is over: the page records it and clears the slot (nothing saves it again).
        this.finished = true;
        this.events.onSummit(c);
      }
      this.updateChirp();
      this.publish();
      return;
    }

    const bits = this.bits();
    if (bits) this.idle = 0;
    else this.idle++;
    const before = { story: c.story, grounded: p.grounded, charge: p.charge, x: p.x, vx: p.vx };
    const events = tickClimb(this.m, c, bits);
    this.sinceSave++;
    this.handle(events, before);

    // The camera cuts to whichever screen Pip's middle is in.
    this.placeCamera();
    this.updateChirp();
    this.readSigns();

    // Sounds that last: the charge's tone, a fall's whoosh.
    if (p.grounded && p.charge > 0) chargeTone.set((p.charge - 1) / (CHARGE_MAX - 1));
    else chargeTone.set(null);
    if (!p.grounded && p.vy > 0) this.fallTicks++;
    else this.fallTicks = 0;
    whoosh.set(this.fallTicks > 24 ? Math.min(1, (this.fallTicks - 24) / 70) : 0, this.options.reducedMotion());
    for (const w of this.m.wind) if (w.pattern.kind === "gusts" && w.screen === `${pipScreen(c).col}:${pipScreen(c).row}`) ambience.gust(windOn(w.pattern, c.sim.tick));

    // Chirp gets bored.
    if (this.idle === IDLE_TICKS && p.grounded) this.say("idle");
    if (this.resumeCue > 0 && --this.resumeCue === 0) this.say("resume");

    // Save four times a second while anything moves (and on every jump and landing, in handle()).
    const moving = !p.grounded || p.vx !== 0 || c.sim.crumbles.length > 0 || c.sim.elevators.some((e) => e.phase !== "idle");
    if (moving && this.sinceSave >= AUTOSAVE_TICKS) this.save();
    this.publish();
  }

  private handle(events: readonly ClimbEvent[], before: { story: Story; grounded: boolean; charge: number; x: number; vx: number }) {
    const c = this.climb;
    const p = c.sim.pip;
    const zone = pipZone(this.m, c);
    for (const e of events) {
      switch (e.type) {
        case "jump":
          if (this.greet) {
            this.greet = false;
            this.say("start");
          }
          chargeTone.set(null);
          playSfx("jump", { rate: 0.8 + e.power * 0.6, volume: 0.6 + e.power * 0.4 });
          this.events.onJump();
          this.save();
          break;
        case "land": {
          const hard = e.fell >= 100;
          playSfx(hard ? "thud" : "land", { volume: Math.min(1, 0.35 + e.fell / 160) });
          if (e.surface !== "mushroom") this.renderer.fx.dust(p.x + p.w / 2, p.y + p.h, Math.min(1, e.fell / 140));
          if (this.prefs.vibrate && typeof navigator.vibrate === "function" && e.fell > 24) {
            try {
              navigator.vibrate(hard ? 35 : 12);
            } catch {
              // Not allowed: no buzz.
            }
          }
          if (e.drop <= -48 && e.surface !== "cloud") this.say("niceJump");
          this.save();
          break;
        }
        case "fell": {
          this.events.onFall(e.drop);
          const screens = e.screens;
          this.announce(`You fell ${Math.round(e.drop / 20)} metres.`);
          this.say(screens >= 3 ? "hugeFall" : screens >= 1 ? "bigFall" : "fall");
          break;
        }
        case "stun":
          playSfx("oof");
          this.renderer.fx.stars(p.x + p.w / 2, p.y);
          break;
        case "bonk":
          playSfx("bonk");
          this.renderer.fx.stars(p.x + p.w / 2, p.y);
          if (Math.random() < 0.3) this.say("bonk");
          break;
        case "bounce":
          playSfx("bounce", { volume: 0.7 });
          if (this.nearMiss(before.vx)) this.say("nearMiss");
          break;
        case "mushroom":
          playSfx("boing");
          break;
        case "step":
          playSfx(stepSound(e.surface, zone), { volume: 0.5 });
          break;
        case "crumble": {
          const tx = e.tile % this.m.tileCols;
          const ty = Math.floor(e.tile / this.m.tileCols);
          const cloud = tileAt(this.m, tx, ty) === T.CLOUD;
          if (e.phase === "shake") playSfx(cloud ? "stepCloud" : "creak", { volume: 0.6 });
          else if (e.phase === "break") {
            playSfx(cloud ? "poof" : "crumble", { volume: 0.7 });
            if (cloud) this.renderer.fx.poof(tx * TILE, ty * TILE);
            else this.renderer.fx.debris(tx * TILE, ty * TILE, "#ab947a");
          } else playSfx("back", { volume: 0.4 });
          break;
        }
        case "feather":
          playSfx("feather");
          this.renderer.fx.sparkle(p.x + p.w / 2, p.y + 2);
          this.say("feather");
          this.announce("You found a Lost Feather: a new hat.");
          this.events.onFeather(e.index);
          this.save();
          break;
        case "joke":
          playSfx("joke");
          this.signLine = { text: "Checkpoints are for quitters.", warning: false, id: 1000 + e.index, until: performance.now() + 3200 };
          this.say("joke");
          break;
        case "elevator":
          if (e.phase === "down") {
            playSfx("ding");
            setTimeout(() => playSfx("descend"), 250);
          } else if (e.phase === "bottom" && this.onElevator) this.say("elevatorDown");
          break;
        case "fakeSummit":
          this.credits = 0;
          this.flags.fake = 0;
          playSfx("plant");
          music.fanfare();
          this.events.onFakeSummit();
          this.announce("You planted your flag on the summit.");
          this.save();
          break;
        case "summit":
          this.summitT = 0;
          this.flags.real = 0;
          playSfx("plant");
          music.fanfare(true);
          this.announce("You planted your flag on the real summit.");
          this.save();
          break;
        case "screen":
          this.save();
          break;
        case "zone":
          this.say(`zone:${e.zone}`);
          break;
        default:
          break;
      }
    }
    // Riding the elevator?
    const on = this.m.elevators.some((el, i) => {
      const r = { ...el.rect, y: el.rect.y + Math.round(c.sim.elevators[i]!.offset) };
      return p.grounded && p.y + p.h === r.y && p.x + p.w > r.x && p.x < r.x + r.w;
    });
    if (on && !this.onElevator) this.say("elevator");
    this.onElevator = on;
    // A new zone: its music and its air (the music carries on, it doesn't restart).
    if (zone !== this.lastZone) {
      this.lastZone = zone;
      music.play(zone);
      ambience.start(zone);
    }
    if (before.story !== c.story) this.publish();
  }

  /** A wall bounce right at a ledge's lip (just short of making it). */
  private nearMiss(vx: number): boolean {
    const p = this.climb.sim.pip;
    const side = vx > 0 ? Math.floor((p.x + p.w) / TILE) : Math.floor((p.x - 1) / TILE);
    const feet = p.y + p.h;
    for (let ty = Math.floor((feet - 12) / TILE); ty <= Math.floor(feet / TILE); ty++) {
      const solid = isSolidTile(tileAt(this.m, side, ty), this.climb.sim.collapsed);
      const above = isSolidTile(tileAt(this.m, side, ty - 1), this.climb.sim.collapsed);
      if (solid && !above && ty * TILE > feet - 14) return true;
    }
    return false;
  }

  private readSigns() {
    const p = this.climb.sim.pip;
    const cx = p.x + p.w / 2;
    const feet = p.y + p.h;
    const at = this.m.signs.findIndex((s) => Math.abs(cx - s.x) <= SIGN_NEAR.x && Math.abs(feet - s.y) <= SIGN_NEAR.y);
    if (at !== this.atSign) {
      this.atSign = at;
      if (at >= 0) {
        const sign = this.m.signs[at]!;
        this.announce(`A sign: ${sign.text}`);
        if (sign.warning) this.say("warningSign");
        else if (LIES.includes(sign.text) && sign.text !== "Express to the Top!") this.say("lyingSign");
      }
    }
  }

  private updateChirp() {
    const p = this.climb.sim.pip;
    const facing = p.facing;
    const t = (performance.now() - this.born) / 1000;
    const bob = this.options.reducedMotion() ? 0 : Math.sin(t * 3) * 3;
    const target = { x: p.x + p.w / 2 - facing * 16, y: p.y - 14 + bob };
    this.chirpPos.x += (target.x - this.chirpPos.x) * 0.08;
    this.chirpPos.y += (target.y - this.chirpPos.y) * 0.08;
    // Always on screen.
    this.chirpPos.x = Math.max(this.cam.x + 8, Math.min(this.cam.x + VIEW_W - 8, this.chirpPos.x));
    this.chirpPos.y = Math.max(this.cam.y + 10, Math.min(this.cam.y + VIEW_H - 10, this.chirpPos.y));
  }

  private updateCredits() {
    const c = this.climb;
    this.credits++;
    const t = this.credits;
    this.flags.fake = Math.min(1, t / 60);
    this.updateChirp();
    if (t === 40) this.say("fakeSummit");
    if (t === CREDITS.end) {
      music.play("credits");
      this.announce("THE END.");
    }
    if (t === CREDITS.roll) this.announce("The credits roll. Thanks for playing… so far.");
    // Halfway through the credits, the camera looks up.
    const base = rowTop(26);
    if (t >= CREDITS.pan && t < CREDITS.back) {
      const k = Math.min(1, (t - CREDITS.pan) / (CREDITS.panEnd - CREDITS.pan));
      const ease = k * k * (3 - 2 * k);
      this.cam = { x: this.cam.x, y: base - ease * VIEW_H * 2 };
    }
    if (t === CREDITS.kidding) {
      music.cut();
      this.announce("…just kidding.");
    }
    if (t === CREDITS.back) {
      this.cam = { x: this.cam.x, y: base };
      playSfx("rumble");
      this.announce("The ground shakes.");
    }
    if (t > CREDITS.back && t < CREDITS.fall && !this.options.reducedMotion()) {
      // Shake the summit's ledge.
      this.cam = { x: this.cam.x, y: base + ((t % 4) - 1.5) };
    }
    if (t >= CREDITS.fall) {
      this.credits = -1;
      this.cam = { x: this.cam.x, y: base };
      for (const at of this.m.collapse) {
        const tx = at % this.m.tileCols;
        const ty = Math.floor(at / this.m.tileCols);
        if (screenOf(this.m, Math.floor((tx * TILE) / VIEW_W), 39 - Math.floor((ty * TILE) / VIEW_H))?.zone === "fake-summit") this.renderer.fx.debris(tx * TILE, ty * TILE, "#ffffff");
      }
      playSfx("collapse");
      collapseSummit(c);
      this.flags.fake = -1;
      this.save();
      this.watchForLanding();
    }
  }

  /** After the summit falls: when Pip lands, Chirp has something to say, and the music comes back. */
  private watchForLanding() {
    const check = setInterval(() => {
      if (this.destroyed) {
        clearInterval(check);
        return;
      }
      const p = this.climb.sim.pip;
      if (p.grounded && p.stun === 0) {
        clearInterval(check);
        this.say("collapsed");
        music.unsilence();
        music.play(pipZone(this.m, this.climb));
      }
    }, 100);
  }

  private seconds() {
    return (performance.now() - this.born) / 1000;
  }

  /** Assist: where a jump released right now would go. */
  private preview(): Array<{ x: number; y: number }> | null {
    const c = this.climb;
    const p = c.sim.pip;
    if (!this.prefs.assist.preview || !p.grounded || p.charge === 0) return null;
    const s = cloneClimb(c.sim);
    const dir = (this.input.isDown("right") ? RIGHT : 0) | (this.input.isDown("left") ? LEFT : 0);
    step(this.m, s, dir);
    const out: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < 300 && !s.pip.grounded; i++) {
      step(this.m, s, 0);
      out.push({ x: s.pip.x + s.pip.w / 2, y: s.pip.y + s.pip.h });
    }
    return out;
  }

  private render(alpha: number) {
    const c = this.climb;
    const seconds = this.seconds();
    const line = this.line && performance.now() < this.line.until ? this.line : null;
    const chirp: ChirpView | null = c.mirrored
      ? null
      : { x: this.chirpPos.x, y: this.chirpPos.y, mood: line?.mood ?? "sincere", right: c.sim.pip.x + c.sim.pip.w / 2 > this.chirpPos.x };
    this.renderer.draw({
      climb: c,
      prev: this.prev,
      alpha: this.paused ? 1 : alpha,
      time: seconds,
      cam: this.cam,
      chirp,
      hat: this.prefs.hat,
      preview: this.preview(),
      flags: this.flags,
      hidePip: false,
      reducedMotion: this.options.reducedMotion(),
    });
    // The page's bubbles follow Chirp and the sign.
    if (this.chirpEl && chirp) anchorBubble(this.chirpEl, chirp.x - this.cam.x, chirp.y - this.cam.y - 6);
    if (this.signEl) {
      const at = this.signLine ? this.m.jokes[this.signLine.id - 1000] : this.atSign >= 0 ? this.m.signs[this.atSign] : null;
      if (at) anchorBubble(this.signEl, at.x - this.cam.x + (this.signLine ? 3 : 0), at.y - this.cam.y - 14);
    }
    if (this.creditsEl && this.credits >= CREDITS.roll) {
      const k = Math.min(1, (this.credits - CREDITS.roll + alpha) / (CREDITS.kidding - CREDITS.roll));
      this.creditsEl.style.transform = `translateY(${(1 - k * 1.15) * 100}%)`;
    }
    if (this.clockEl) {
      const text = formatClock(c.stats.ticks);
      if (text !== this.clockText) {
        this.clockText = text;
        this.clockEl.textContent = text;
      }
    }
  }
}

/**
 * Put a speech bubble's tail at a point on the canvas (canvas pixels), keeping the bubble inside the
 * frame: it slides sideways (the tail still points at the speaker) and never goes off the top.
 */
function anchorBubble(el: HTMLElement, x: number, y: number) {
  const frame = el.offsetParent as HTMLElement | null;
  if (!frame) return;
  const w = frame.clientWidth;
  const h = frame.clientHeight;
  const ax = (x / VIEW_W) * w;
  const ay = (y / VIEW_H) * h;
  const half = el.offsetWidth / 2;
  const left = Math.max(half + 6, Math.min(w - half - 6, ax));
  el.style.left = `${Math.round(left)}px`;
  el.style.top = `${Math.round(Math.max(el.offsetHeight + 14, ay))}px`;
  el.style.setProperty("--tail", `${Math.round(Math.max(-half + 10, Math.min(half - 10, ax - left)))}px`);
  el.style.visibility = "visible";
}

const sameShown = (a: Shown, b: Shown) => a.kind === b.kind && (a.kind !== "bar" || b.kind !== "bar" || Math.abs(a.value - b.value) < 0.0005);

const countBits = (n: number) => {
  let k = 0;
  for (let v = n; v; v &= v - 1) k++;
  return k;
};

export const assistOn = (a: RuntimeAssist) => a.checkpoints || a.preview || a.speed < 1;
