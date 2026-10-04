// A room being played, in the browser: the fixed 60 Hz loop, keyboard, gamepad, touch and mouse,
// the room session, the camera, the renderer and the sounds. The play screen owns one per room
// and listens to it; everything here runs outside React.
import { Input, type Bindings } from "@/engine/input";
import { createLoop, type Loop } from "@/engine/loop";
import { Store } from "@/games/shared/store";
import { ambience } from "../audio/ambience";
import { music, songForRoom } from "../audio/music";
import { loadSfx, playSfx, stepSound } from "../audio/sfx";
import { JUMP, LEFT, RIGHT, ROWS, TILE, VIEW_W } from "../core/constants";
import { formatClock } from "../core/medals";
import { cellAt, LOOKS_SOLID, ROCK, type Room } from "../core/room";
import { RoomSession, type SessionEvent } from "../core/session";
import type { FallCause, GameEvent, World } from "../core/world";
import { Renderer } from "../render/draw";
import { Camera } from "./camera";

export type Action = "left" | "right" | "jump" | "throw" | "look" | "restart" | "pause";
export const REMAPPABLE: readonly Action[] = ["left", "right", "jump", "throw", "look", "restart"];

export const DEFAULT_KEYS: Record<Action, string[]> = {
  left: ["ArrowLeft", "KeyA"],
  right: ["ArrowRight", "KeyD"],
  jump: ["Space", "ArrowUp", "KeyW"],
  throw: ["KeyF"],
  look: ["ShiftLeft", "ShiftRight"],
  restart: ["KeyR"],
  pause: ["Escape", "KeyP"],
};

/** Keys (remapped or default) plus the standard gamepad layout (Plan §2). */
export function bindingsFor(keys: Partial<Record<string, string[]>> | null): Bindings<Action> {
  const k = (a: Action) => (a !== "pause" && keys?.[a]?.length ? keys[a]! : DEFAULT_KEYS[a]);
  return {
    left: { keys: k("left"), buttons: [14], axis: { index: 0, dir: -1 } },
    right: { keys: k("right"), buttons: [15], axis: { index: 0, dir: 1 } },
    jump: { keys: k("jump"), buttons: [0, 1] },
    throw: { keys: k("throw"), buttons: [2, 5, 7] },
    look: { keys: k("look"), buttons: [4, 6] },
    restart: { keys: k("restart"), buttons: [3] },
    pause: { keys: k("pause"), buttons: [9] },
  };
}

export interface Hud {
  /** The loop is running and listening. */
  ready: boolean;
  falls: number;
  pebbles: number;
  unlimited: boolean;
  status: World["status"];
  started: boolean;
  hasKey: boolean;
  /** For screen readers: what the pebble said, the sign you're at, what just happened. */
  message: string;
}

export const initialHud = (): Hud => ({ ready: false, falls: 0, pebbles: 0, unlimited: false, status: "play", started: false, hasKey: false, message: "" });

const FELL_THROUGH: Record<FallCause, string> = {
  fake: "a fake floor",
  mimic: "a mimic",
  painted: "a painted floor",
  crumble: "a crumbling floor",
  returnTrip: "a floor that only held you once",
  flip: "a floor that flipped",
  gap: "the gap",
};

export interface RuntimeAssist {
  speed: 1 | 0.75;
  unlimited: boolean;
  nets: boolean;
}

export interface LivePrefs {
  assist: RuntimeAssist;
  highContrast: boolean;
  keys: Partial<Record<string, string[]>> | null;
}

export interface RuntimeOptions extends LivePrefs {
  room: Room;
  reducedMotion: () => boolean;
  /** Time trials: the clock runs from the moment you arrive, and it's shown. */
  trial: { base: number } | null;
  /** Show the clock (an option; always on in time trials). */
  showClock: boolean;
}

export interface RuntimeEvents {
  onFall(cause: FallCause): void;
  onThrow(): void;
  onHidden(index: number): void;
  onLeap(): void;
  /** Through the door, after a moment. */
  onWin(session: RoomSession): void;
  /** Esc / Start / a hidden tab: the screen should show (or close) its pause menu. */
  onPauseToggle(): void;
}

const WIN_DELAY_MS = 700;
/** Keyboard aiming: the target walks out a tile every this many ticks while the key is held. */
const AIM_STEP = 8;
const AIM_NEAR = 2;
const AIM_FAR = 8;
/** You can lob a pebble this far. */
const MAX_THROW = 230;

export class Runtime {
  readonly session: RoomSession;
  readonly input: Input<Action>;
  readonly camera: Camera;
  private readonly renderer: Renderer;
  private readonly loop: Loop;
  private prev = { x: 0, y: 0 };
  private readonly born = performance.now();
  private wonAt: number | null = null;
  private winSent = false;
  private paused = false;
  private destroyed = false;
  private padTimer: ReturnType<typeof setInterval> | null = null;
  private unsubscribe: Array<() => void> = [];
  private clockEl: HTMLElement | null = null;
  private clockText = "";
  private prefs: LivePrefs;
  /** Ticks since the last throw (the arm stays out a moment). */
  private sinceThrow = 99;
  /** Keyboard / gamepad aiming: held ticks (-1: not aiming). */
  private aimTicks = -1;
  /** The mouse over the room (canvas pixels: the aim follows it as the view scrolls), and when it last moved. */
  private pointer: { x: number; y: number } | null = null;
  private pointerAt = 0;
  private stickAim: { x: number; y: number } | null = null;
  private looking = false;
  private message = "";
  private messages = 0;
  /** The sign you're standing at (-1: none). */
  private atSign = -1;
  /** Assist was on at some point during this visit (no medals for it). */
  assisted: boolean;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly options: RuntimeOptions,
    private readonly hud: Store<Hud>,
    private readonly events: RuntimeEvents,
  ) {
    const { room } = options;
    this.prefs = { assist: options.assist, highContrast: options.highContrast, keys: options.keys };
    this.assisted = assistOn(options.assist);
    this.session = new RoomSession(room, { unlimited: options.assist.unlimited, nets: options.assist.nets, clockFromStart: options.trial !== null && options.trial.base > 0 });
    this.renderer = new Renderer(canvas, options.reducedMotion);
    this.renderer.setRoom(room);
    this.camera = new Camera(room);
    this.camera.snap(this.session.world.p);
    this.prev = { x: this.session.world.p.x, y: this.session.world.p.y };
    this.input = new Input<Action>(bindingsFor(options.keys));
    this.loop = createLoop({
      update: () => this.update(),
      render: (alpha) => this.render(alpha),
      speed: () => this.prefs.assist.speed,
    });
    this.publish();
  }

  /** Options changed mid-room: they apply straight away. */
  setPrefs(prefs: LivePrefs) {
    this.prefs = prefs;
    if (assistOn(prefs.assist)) this.assisted = true;
    this.session.setAssist({ unlimited: prefs.assist.unlimited, nets: prefs.assist.nets });
    this.input.setBindings(bindingsFor(prefs.keys));
    this.publish();
    if (this.paused) this.render(1);
  }

  start() {
    void loadSfx();
    const song = songForRoom(this.options.room.id);
    music.play(song, { fast: this.options.trial !== null });
    ambience.start(this.options.room.env);
    this.input.attach(window, () => !this.paused);
    this.unsubscribe.push(
      this.input.onPress((action) => {
        if (action === "pause") this.events.onPauseToggle();
        else if (action === "restart") this.restart();
        else if (action === "throw") this.aimTicks = 0;
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

  pause() {
    if (this.paused || this.destroyed) return;
    this.paused = true;
    this.loop.stop();
    this.input.clear();
    this.aimTicks = -1;
    music.pause();
    ambience.pause();
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
    ambience.resume();
    this.loop.start();
    this.publish();
  }

  get isPaused() {
    return this.paused;
  }

  /** Quick restart (R): the room from the start. Not a fall. */
  restart() {
    if (this.session.won || this.paused) return;
    this.session.restart();
    this.afterReset();
    playSfx("respawn", { volume: 0.6 });
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

  /** The mouse moved over the room (canvas pixels). */
  pointerMove(cx: number, cy: number) {
    this.pointer = { x: cx, y: cy };
    this.pointerAt = performance.now();
  }

  pointerLeave() {
    this.pointer = null;
  }

  /** A click or a tap on the room: throw there (canvas pixels). */
  throwAt(cx: number, cy: number) {
    if (this.paused) return;
    const target = this.clampAim(cx + this.camera.x, cy);
    this.doThrow(target.x, target.y);
  }

  destroy() {
    this.destroyed = true;
    this.loop.stop();
    this.input.detach();
    ambience.stop();
    if (this.padTimer) clearInterval(this.padTimer);
    this.unsubscribe.forEach((off) => off());
  }

  // -------------------------------------------------------------------------------------------

  private afterReset() {
    const p = this.session.world.p;
    this.camera.snap(p);
    this.prev = { x: p.x, y: p.y };
    this.renderer.fx.clear();
    this.aimTicks = -1;
    this.publish();
  }

  private clampAim(x: number, y: number): { x: number; y: number } {
    const p = this.session.world.p;
    const hx = p.x + p.w / 2;
    const hy = p.y + 3;
    const dx = x - hx;
    const dy = y - hy;
    const d = Math.hypot(dx, dy);
    if (d <= MAX_THROW) return { x, y };
    return { x: hx + (dx / d) * MAX_THROW, y: hy + (dy / d) * MAX_THROW };
  }

  /** Keyboard aim: the floor some tiles ahead (the first thing that looks like floor near your feet). */
  private keyboardAim(): { x: number; y: number } {
    const w = this.session.world;
    const p = w.p;
    const span = AIM_FAR - AIM_NEAR;
    const t = Math.floor(Math.max(0, this.aimTicks) / AIM_STEP) % (span * 2);
    const tiles = AIM_NEAR + (t <= span ? t : span * 2 - t);
    const room = w.room;
    const col = Math.max(0, Math.min(room.cols - 1, Math.floor((p.x + p.w / 2) / TILE) + p.facing * tiles));
    const feetRow = Math.floor((p.y + p.h) / TILE);
    // What you can see: rock and anything that looks like floor (a crumble that has fallen doesn't).
    const looksSolid = (c: number, r: number) => {
      const v = cellAt(room, c, r);
      if (v === ROCK) return true;
      if (v < 0) return false;
      const kind = room.floors[v]!.kind;
      return LOOKS_SOLID.has(kind) && !(kind === "crumble" && w.fs.phase[v] === 2);
    };
    let best: number | null = null;
    for (let r = Math.max(1, feetRow - 3); r < Math.min(ROWS, feetRow + 5); r++) {
      if (looksSolid(col, r) && !looksSolid(col, r - 1) && (best === null || Math.abs(r - feetRow) < Math.abs(best - feetRow))) best = r;
    }
    return this.clampAim(col * TILE + TILE / 2, (best ?? feetRow) * TILE + 3);
  }

  private doThrow(x: number, y: number) {
    if (this.session.throw(x, y)) {
      this.sinceThrow = 0;
      playSfx("throw");
      this.events.onThrow();
    } else if (this.session.world.status === "play") {
      playSfx("empty");
    }
    this.publish();
  }

  /** Say something to screen readers (the same words twice still get read). */
  private announce(text: string) {
    this.messages++;
    this.message = this.messages % 2 ? text : `${text}\u200b`;
  }

  private publish() {
    const s = this.session;
    const w = s.world;
    const next: Hud = {
      ready: this.loop?.running ?? false,
      falls: s.falls,
      pebbles: w.pebbles,
      unlimited: w.unlimited,
      status: w.status,
      started: s.started,
      hasKey: w.key,
      message: this.message,
    };
    const now = this.hud.get();
    if ((Object.keys(next) as Array<keyof Hud>).some((k) => now[k] !== next[k])) this.hud.set(next);
  }

  private stickTarget(): { x: number; y: number } | null {
    if (typeof navigator.getGamepads !== "function") return null;
    for (const pad of navigator.getGamepads()) {
      if (!pad) continue;
      const ax = pad.axes[2] ?? 0;
      const ay = pad.axes[3] ?? 0;
      if (Math.hypot(ax, ay) > 0.35) {
        const p = this.session.world.p;
        return this.clampAim(p.x + p.w / 2 + ax * 160, p.y + 3 + ay * 120);
      }
    }
    return null;
  }

  private update() {
    this.input.pollGamepads();
    const bits = (this.input.sample("left") ? LEFT : 0) | (this.input.sample("right") ? RIGHT : 0) | (this.input.sample("jump") ? JUMP : 0);
    this.looking = this.input.isDown("look");
    this.stickAim = this.stickTarget();

    // Aiming with a key or a button: hold to reach further, let go to throw.
    const throwHeld = this.input.isDown("throw");
    this.input.sample("throw");
    if (this.aimTicks >= 0) {
      if (this.stickAim) {
        this.doThrow(this.stickAim.x, this.stickAim.y);
        this.aimTicks = -1;
      } else if (throwHeld) this.aimTicks++;
      else {
        const target = this.keyboardAim();
        this.doThrow(target.x, target.y);
        this.aimTicks = -1;
      }
    }

    const before = this.session.world;
    this.prev = { x: before.p.x, y: before.p.y };
    const events = this.session.tick(bits);
    const w = this.session.world;
    if (w !== before) {
      // A new attempt (after a fall).
      this.afterReset();
    } else this.camera.update(w.p, this.looking && w.status === "play");

    const gameEvents = events.filter((e): e is GameEvent => e.type !== "start" && e.type !== "respawn");
    this.renderer.onEvents(before, gameEvents);
    this.renderer.tick(w, this.camera.x, this.seconds(), this.prefs.highContrast);
    this.sounds(events, before);
    this.sinceThrow++;
    this.readSigns(w);

    if (w.status === "won" && this.wonAt === null) this.wonAt = performance.now();
    if (this.wonAt !== null && !this.winSent && performance.now() - this.wonAt > WIN_DELAY_MS) {
      this.winSent = true;
      this.events.onWin(this.session);
    }
    this.publish();
  }

  private seconds() {
    return (performance.now() - this.born) / 1000;
  }

  /** Reach a sign: its words go to screen readers too (they're drawn in the room). */
  private readSigns(w: World) {
    const p = w.p;
    const cx = p.x + p.w / 2;
    const at = w.room.signs.findIndex((sign) => Math.abs(cx - sign.x) <= 56 && Math.abs(p.y + p.h - sign.y) <= 40);
    if (at !== this.atSign) {
      this.atSign = at;
      if (at >= 0) this.announce(`A sign: ${w.room.signs[at]!.text}`);
    }
  }

  private sounds(events: readonly SessionEvent[], w: World) {
    const look = w.room.env.look;
    const pan = (x: number) => Math.max(-0.8, Math.min(0.8, (x - this.camera.x - VIEW_W / 2) / (VIEW_W / 2)));
    for (const e of events) {
      switch (e.type) {
        case "jump":
          playSfx("jump");
          break;
        case "land":
          playSfx(stepSound(look, e.surface), { volume: Math.min(1, 0.5 + e.impact / 6) });
          break;
        case "step":
          playSfx(stepSound(look, e.surface), { volume: 0.55 });
          break;
        case "bonk":
          playSfx("bonk");
          break;
        case "tok":
          playSfx(e.soft ? "tokSoft" : "tok", { pan: pan(e.x) });
          if (!e.soft) this.announce("Tok: that floor is real.");
          break;
        case "tink":
          playSfx("tink", { pan: pan(e.x) });
          this.announce("Tink: an invisible floor. It glows for a moment.");
          break;
        case "fwip":
          playSfx("fwip", { pan: pan(e.x), volume: 0.5 });
          this.announce("Silence: there's no floor there.");
          break;
        case "crumble":
          playSfx(e.phase === "shake" ? "creak" : "crumble");
          break;
        case "crack":
          playSfx("crack", { volume: 0.5 });
          break;
        case "flip":
          playSfx("flip", { volume: 0.4, rate: e.solid ? 1.2 : 0.85 });
          break;
        case "pickup":
          playSfx(e.hidden ? "hidden" : "pickup");
          this.announce(e.hidden ? "You found a hidden pebble!" : "One more pebble.");
          if (e.hidden) this.events.onHidden(e.index);
          break;
        case "key":
          playSfx("key");
          this.announce("You have the key.");
          break;
        case "locked":
          playSfx("locked");
          this.announce("The door is locked. Find the key.");
          break;
        case "leap":
          this.events.onLeap();
          break;
        case "net":
          playSfx("net");
          this.announce(`You fell through ${FELL_THROUGH[e.cause]}, into a safety net.`);
          this.events.onFall(e.cause);
          break;
        case "netReturn":
          playSfx("land", { volume: 0.6 });
          break;
        case "fall":
          playSfx("fall");
          this.announce(`You fell through ${FELL_THROUGH[e.cause]}. The room starts again.`);
          this.events.onFall(e.cause);
          break;
        case "respawn":
          playSfx("respawn", { volume: 0.5 });
          break;
        case "win":
          playSfx("door");
          music.jingle();
          break;
        default:
          break;
      }
    }
  }

  private render(alpha: number) {
    const s = this.session;
    const w = s.world;
    const fresh = performance.now() - this.pointerAt < 2500;
    let aim: { x: number; y: number } | null = null;
    if (this.aimTicks >= 0 && !this.stickAim) aim = this.keyboardAim();
    else if (this.stickAim) aim = this.stickAim;
    else if (this.pointer && fresh) aim = this.clampAim(this.pointer.x + this.camera.at(alpha), this.pointer.y);
    if (w.status !== "play" || (!w.unlimited && w.pebbles <= 0)) aim = null;
    const seconds = this.seconds();
    this.renderer.draw({
      world: w,
      prev: this.prev,
      alpha: w.status === "play" ? alpha : 1,
      time: seconds,
      cam: this.camera.at(alpha),
      looking: this.looking,
      sinceThrow: this.sinceThrow,
      aim,
      highContrast: this.prefs.highContrast,
      hero: w.status !== "fell" || w.p.y < 300,
    });
    ambience.update(seconds);
    if (this.clockEl) {
      const ticks = this.options.trial ? this.options.trial.base + s.elapsed : s.clock;
      const text = formatClock(ticks);
      if (text !== this.clockText) {
        this.clockText = text;
        this.clockEl.textContent = text;
      }
    }
  }
}

export const assistOn = (a: RuntimeAssist) => a.speed < 1 || a.unlimited || a.nets;
