// A level being played, in the browser: the fixed 60 Hz loop, keyboard, gamepad and touch input,
// the level session, the renderer and the sounds. The play screen owns one per level and listens
// to it; everything here runs outside React.
import { Input, type Bindings } from "@/engine/input";
import { createLoop, type Loop } from "@/engine/loop";
import { Store } from "@/games/shared/store";
import { FOLLOW_DELAY, JUMP, LEFT, RIGHT } from "../core/constants";
import type { Level } from "../core/level";
import { formatClock } from "../core/medals";
import { LevelSession, type GhostRun, type SessionEvent } from "../core/session";
import type { DeathCause, GameEvent, World } from "../core/world";
import { music, songForLevel } from "../audio/music";
import { loadSfx, playSfx, type SfxName } from "../audio/sfx";
import { Renderer } from "../render/draw";
import { assistOn, type Assist } from "../save";

export type Action = "left" | "right" | "jump" | "restart" | "pause";
export const ACTIONS: readonly Action[] = ["left", "right", "jump", "restart", "pause"];
export const REMAPPABLE: readonly Action[] = ["left", "right", "jump", "restart"];

export const DEFAULT_KEYS: Record<Action, string[]> = {
  left: ["ArrowLeft", "KeyA"],
  right: ["ArrowRight", "KeyD"],
  jump: ["Space", "ArrowUp", "KeyW"],
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
    restart: { keys: k("restart"), buttons: [3] },
    pause: { keys: k("pause"), buttons: [9] },
  };
}

export interface Hud {
  /** The loop is running and listening (the ghost loads first). */
  ready: boolean;
  deaths: number;
  started: boolean;
  status: World["status"];
  /** Assist's trap outlines are showing. */
  revealing: boolean;
}

export interface RuntimeOptions {
  level: Level;
  ghost: GhostRun | null;
  ghostTrap: Int16Array | null;
  assist: Assist;
  /** Deaths on this level before this visit (the reveal starts at 10). */
  priorDeaths: number;
  markers: ReadonlyArray<{ x: number; y: number }>;
  showMarkers: boolean;
  keys: Partial<Record<string, string[]>> | null;
  reducedMotion: () => boolean;
  /** Zone speedrun: ticks already on the clock before this level (null: a single level). */
  zoneBase: number | null;
  /** Speedrun mode plays the music a little faster. */
  fastMusic: boolean;
}

export interface RuntimeEvents {
  onDeath(cause: DeathCause, x: number, y: number): void;
  onFakeHop(): void;
  onJump(): void;
  /** The door, after a short celebration. */
  onWin(session: LevelSession): void;
  /** Esc / Start / a hidden tab: the screen should show (or close) its pause menu. */
  onPauseToggle(): void;
}

const REVEAL_AFTER = 10;
const WIN_DELAY_MS = 950;

const TRAP_SOUNDS: Partial<Record<string, SfxName>> = {
  "popSpikes:fire": "pop",
  "returnTrap:fire": "pop",
  "jumpPunisher:fire": "pop",
  "coinBait:fire": "pop",
  "dropFloor:warn": "crack",
  "dropFloor:fire": "drop",
  "crusher:warn": "rumble",
  "crusher:rest": "slam",
  "runawayDoor:fire": "wheels",
  "fakeDoor:fire": "reveal",
  "invisibleBlock:fire": "reveal",
  "saw:warn": "shing",
  "saw:fire": "whirr",
  "stalactite:warn": "crack",
  "stalactite:done": "slam",
  "wallSqueeze:fire": "squeeze",
  "fakeCheckpoint:fire": "launch",
  "conveyorFlip:fire": "flip",
  "victoryBanner:warn": "crack",
  "victoryBanner:fire": "whoosh",
  "victoryBanner:rest": "slam",
  "risingFloor:fire": "hiss",
};

export const initialHud = (): Hud => ({ ready: false, deaths: 0, started: false, status: "play", revealing: false });

export interface LivePrefs {
  assist: Assist;
  showMarkers: boolean;
  showGhost: boolean;
  keys: Partial<Record<string, string[]>> | null;
}

export class Runtime {
  readonly session: LevelSession;
  readonly input: Input<Action>;
  private readonly renderer: Renderer;
  private readonly loop: Loop;
  private prev = { x: 0, y: 0 };
  private ghostPrev: { x: number; y: number } | null = null;
  private markers: Array<{ x: number; y: number }>;
  private readonly born = performance.now();
  private wonAt: number | null = null;
  private winSent = false;
  private paused = false;
  private destroyed = false;
  private timerEl: HTMLElement | null = null;
  private timerText = "";
  private padTimer: ReturnType<typeof setInterval> | null = null;
  private unsubscribe: Array<() => void> = [];
  private assist: Assist;
  private showMarkers: boolean;
  private showGhost = true;
  /** Assist was on at some point during this visit (no medals for it). */
  assisted: boolean;

  constructor(
    canvas: HTMLCanvasElement,
    private readonly options: RuntimeOptions,
    private readonly hud: Store<Hud>,
    private readonly events: RuntimeEvents,
  ) {
    const { level } = options;
    this.assist = options.assist;
    this.assisted = assistOn(options.assist);
    this.showMarkers = options.showMarkers;
    this.session = new LevelSession(level, { ghost: options.ghost, ghostTrap: options.ghostTrap, invincible: options.assist.invincible });
    this.renderer = new Renderer(canvas, options.reducedMotion);
    this.renderer.setLevel(level);
    this.markers = [...options.markers];
    this.prev = { x: this.session.world.p.x, y: this.session.world.p.y };
    this.input = new Input<Action>(bindingsFor(options.keys));
    this.loop = createLoop({
      update: () => this.update(),
      render: (alpha) => this.render(alpha),
      speed: () => this.assist.speed,
    });
    this.publish();
  }

  /** Options changed mid-level: they apply straight away. */
  setPrefs(prefs: LivePrefs) {
    this.assist = prefs.assist;
    if (assistOn(prefs.assist)) this.assisted = true;
    this.session.setInvincible(prefs.assist.invincible);
    this.showMarkers = prefs.showMarkers;
    this.showGhost = prefs.showGhost;
    this.input.setBindings(bindingsFor(prefs.keys));
    this.publish();
    if (this.paused) this.render(1);
  }

  start() {
    void loadSfx();
    const song = songForLevel(this.options.level.id);
    music.play(song.id, { fast: this.options.fastMusic, transpose: song.transpose });
    // Keys go to the game except while its pause menu is open (the menu has its own keys).
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
  bindTimer(el: HTMLElement | null) {
    this.timerEl = el;
    this.timerText = "";
  }

  pause() {
    if (this.paused || this.destroyed) return;
    this.paused = true;
    this.loop.stop();
    this.input.clear();
    music.pause();
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

  /** Quick restart (R): back to the start. Doesn't count as a death. */
  restart() {
    if (this.session.won || this.paused) return;
    this.session.restart();
    this.prev = { x: this.session.world.p.x, y: this.session.world.p.y };
    this.ghostPrev = null;
    playSfx("respawn");
    this.publish();
  }

  /** On-screen buttons. */
  press(action: Action) {
    if (action === "pause") this.events.onPauseToggle();
    else if (action === "restart") this.restart();
    else this.input.press(action);
  }

  release(action: Action) {
    if (action === "left" || action === "right" || action === "jump") this.input.release(action);
  }

  destroy() {
    this.destroyed = true;
    this.loop.stop();
    this.input.detach();
    if (this.padTimer) clearInterval(this.padTimer);
    this.unsubscribe.forEach((off) => off());
  }

  private revealing(): boolean {
    return this.assist.reveal && this.options.priorDeaths + this.session.deaths >= REVEAL_AFTER;
  }

  private publish() {
    const s = this.session;
    const next: Hud = { ready: this.loop?.running ?? false, deaths: s.deaths, started: s.started, status: s.world.status, revealing: this.revealing() };
    const now = this.hud.get();
    if ((Object.keys(next) as Array<keyof Hud>).some((k) => now[k] !== next[k])) this.hud.set(next);
  }

  private update() {
    this.input.pollGamepads();
    const bits = (this.input.sample("left") ? LEFT : 0) | (this.input.sample("right") ? RIGHT : 0) | (this.input.sample("jump") ? JUMP : 0);
    const before = this.session.world;
    this.prev = { x: before.p.x, y: before.p.y };
    const ghost = this.session.ghost;
    this.ghostPrev = ghost ? { x: ghost.p.x, y: ghost.p.y } : null;

    const events = this.session.tick(bits);
    const w = this.session.world;
    if (w !== before) this.prev = { x: w.p.x, y: w.p.y };

    const gameEvents = events.filter((e): e is GameEvent => e.type !== "start" && e.type !== "respawn");
    this.renderer.onEvents(before, gameEvents);
    this.renderer.tick(w);
    this.sounds(events);

    if (before.level.traps.some((t) => t.kind === "follower") && w.status === "play" && w.tick === FOLLOW_DELAY) playSfx("wake");
    if (w.status === "won" && this.wonAt === null) this.wonAt = performance.now();
    if (this.wonAt !== null && !this.winSent && performance.now() - this.wonAt > WIN_DELAY_MS) {
      this.winSent = true;
      this.events.onWin(this.session);
    }
    this.publish();
  }

  private sounds(events: readonly SessionEvent[]) {
    for (const e of events) {
      switch (e.type) {
        case "jump":
          playSfx("jump");
          this.events.onJump();
          break;
        case "land":
          if (e.impact > 2.5) playSfx("land", { volume: Math.min(1, e.impact / 5) });
          break;
        case "bonk":
          playSfx("bonk");
          break;
        case "spring":
          playSfx(e.sideways ? "launch" : "boing");
          break;
        case "coin":
          playSfx("coin");
          break;
        case "checkpoint":
          playSfx("checkpoint");
          break;
        case "die":
          playSfx("splat");
          setTimeout(() => playSfx("tick"), 160);
          this.markers.push({ x: e.x, y: e.y });
          this.events.onDeath(e.cause, e.x, e.y);
          break;
        case "win":
          music.jingle();
          break;
        case "fakeHop":
          this.events.onFakeHop();
          break;
        case "respawn":
          playSfx("respawn", { volume: 0.5 });
          break;
        case "trap": {
          const sound = TRAP_SOUNDS[`${e.kind}:${e.phase}`];
          // Stalactites crash softer than presses.
          if (sound) playSfx(sound, { volume: e.kind === "stalactite" || e.kind === "victoryBanner" ? 0.6 : 1 });
          break;
        }
        default:
          break;
      }
    }
  }

  private render(alpha: number) {
    const s = this.session;
    const w = s.world;
    this.renderer.draw({
      world: w,
      prev: this.prev,
      alpha: s.started && w.status === "play" ? alpha : 1,
      time: (performance.now() - this.born) / 1000,
      ghost: this.showGhost ? s.ghost : null,
      ghostPrev: this.ghostPrev,
      markers: this.showMarkers ? this.markers : [],
      reveal: this.revealing(),
      hero: w.status !== "dead",
    });
    if (this.timerEl) {
      const ticks = this.options.zoneBase !== null ? this.options.zoneBase + s.elapsed : w.tick;
      const text = formatClock(ticks);
      if (text !== this.timerText) {
        this.timerText = text;
        this.timerEl.textContent = text;
      }
    }
  }
}
