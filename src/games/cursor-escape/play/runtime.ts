// A level in the browser: the 120 Hz loop, your hand (locked pointer or trackpad), the session (crash,
// restart at once), the sounds, the notifications (every sabotage announced a second ahead, and when it
// ends) and the taskbar's numbers. The play screen owns one per visit; everything here runs outside React.
import { getAudio } from "@/engine/audio/engine";
import { createLoop, type Loop } from "@/engine/loop";
import { Store } from "@/games/shared/store";
import { loadSfx, playSfx } from "../audio/sfx";
import { HZ } from "../core/constants";
import type { EffectType, LevelSource, Mode } from "../core/level";
import { noticeOf } from "../core/sabotage";
import { Session } from "../core/session";
import { compile, type Input, type SimEvent } from "../core/sim";
import { inputsOf } from "../core/solver";
import { Renderer } from "../render/draw";
import { PointerInput, type HandMode } from "./pointer";

export interface Notice {
  id: number;
  title: string;
  body: string;
  kind: "warn" | "end" | "info";
  /** performance.now() when it goes. */
  until: number;
}

export interface Hud {
  ready: boolean;
  /** Waiting for your first move (the clock hasn't started). */
  waiting: boolean;
  status: "ready" | "run" | "crashed" | "won";
  /** The clock (ticks). */
  ticks: number;
  crashes: number;
  attempts: number;
  mode: Mode;
  notices: Notice[];
  /** Sabotage in force (the tray's icons). */
  effects: EffectType[];
  /** For screen readers. */
  message: string;
  uninstall: number | null;
}

export const initialHud = (): Hud => ({ ready: false, waiting: true, status: "ready", ticks: 0, crashes: 0, attempts: 1, mode: "arrow", notices: [], effects: [], message: "", uninstall: null });

export interface LevelResult {
  ticks: number;
  crashes: number;
  attempts: number;
  /** Turned stretches got through (Ambidextrous). */
  turnedClean: number;
  /** Identity Crisis. */
  found: boolean;
}

export interface RuntimeOptions {
  level: LevelSource;
  steady: boolean;
  assist: boolean;
  sensitivity: number;
  hand: HandMode;
  /** Screen px per desktop px. */
  scale: () => number;
  reduceMotion: () => boolean;
}

export interface RuntimeEvents {
  onWin(result: LevelResult): void;
  onCrash(): void;
  /** Turned stretches survived and Identity Crisis, as they happen (for trophies mid-level). */
  onStat?(kind: "turned" | "found"): void;
}

/** How long a notification stays up (ms). */
const NOTICE_MS = 3200;
/** The window's closing animation (s). */
const CLOSING_S = 0.55;

export class Runtime {
  session: Session;
  readonly renderer: Renderer;
  readonly input: PointerInput;
  private readonly loop: Loop;
  private paused = false;
  private destroyed = false;
  private born = performance.now();
  private crashAt = 0;
  private closing = 0;
  private notices: Notice[] = [];
  private noticeId = 0;
  private message = "";
  private messages = 0;
  private reported = false;
  private prefs: { steady: boolean; assist: boolean; sensitivity: number; hand: HandMode };

  constructor(
    canvas: HTMLCanvasElement,
    area: HTMLElement,
    private readonly options: RuntimeOptions,
    private readonly hud: Store<Hud>,
    private readonly events: RuntimeEvents,
  ) {
    this.prefs = { steady: options.steady, assist: options.assist, sensitivity: options.sensitivity, hand: options.hand };
    this.session = new Session(compile(options.level), { steady: options.steady, assist: options.assist });
    this.renderer = new Renderer(canvas);
    this.input = new PointerInput(area, {
      mode: () => this.prefs.hand,
      sensitivity: () => this.prefs.sensitivity,
      scale: options.scale,
      live: () => !this.paused && !this.destroyed,
      onActivity: () => {
        getAudio();
        void loadSfx();
      },
    });
    this.loop = createLoop({ update: () => this.update(), render: () => this.render(), step: 1 / HZ });
  }

  start() {
    this.input.attach();
    this.render();
    this.loop.start();
    this.publish();
  }

  pause() {
    if (this.paused || this.destroyed) return;
    this.paused = true;
    this.loop.stop();
    this.input.clear();
    this.publish();
  }

  resume() {
    if (this.destroyed) return;
    this.paused = false;
    this.input.clear();
    this.loop.start();
    this.publish();
  }

  get isPaused() {
    return this.paused;
  }

  /** The same level again, after escaping it (Retry): a fresh session, paused until you're ready. */
  again() {
    this.closing = 0;
    this.reported = false;
    this.notices = [];
    this.session = new Session(compile(this.options.level), { steady: this.prefs.steady, assist: this.prefs.assist });
    this.paused = true;
    this.input.clear();
    this.render();
    this.publish();
  }

  /** R: back to the start (it counts as an attempt, not a crash). */
  restart() {
    if (this.session.won) return;
    this.session.restart();
    this.input.clear();
    this.notices = [];
    this.publish();
  }

  setPrefs(prefs: Partial<Runtime["prefs"]>) {
    const before = this.prefs;
    this.prefs = { ...before, ...prefs };
    // Steady mode and the assist change the rules: a fresh start.
    if (prefs.steady !== undefined && prefs.steady !== before.steady) this.rebuild();
    else if (prefs.assist !== undefined && prefs.assist !== before.assist) this.rebuild();
  }

  private rebuild() {
    this.session = new Session(compile(this.options.level), { steady: this.prefs.steady, assist: this.prefs.assist });
    this.publish();
  }

  destroy() {
    this.destroyed = true;
    this.loop.stop();
    this.input.detach();
  }

  /** QA: run ticks with this input, then draw. */
  devStep(input: Input, ticks: number) {
    for (let i = 0; i < ticks; i++) this.update(input);
    this.render();
  }

  /** QA: play a solver's run through this level from a fresh start, up to `ticks` ticks (all of it by default). */
  devReplay(moves: string, ticks = Infinity) {
    this.restart();
    let n = 0;
    for (const input of inputsOf(moves)) {
      if (n++ >= ticks || this.session.won) break;
      this.update(input);
    }
    this.render();
    return this.session.world.status;
  }

  // -----------------------------------------------------------------------------------------------

  private announce(text: string) {
    this.messages++;
    this.message = this.messages % 2 ? text : `${text}​`;
  }

  private notify(title: string, body: string, kind: Notice["kind"]) {
    this.notices = [...this.notices.slice(-2), { id: ++this.noticeId, title, body, kind, until: performance.now() + NOTICE_MS }];
    playSfx(kind === "end" ? "restored" : "notify");
    this.announce(`${title}: ${body}`);
  }

  private update(forced?: Input) {
    if (this.closing > 0) return;
    const input = forced ?? this.input.take();
    const events = this.session.step(input);
    this.react(events);
    if (this.session.won && !this.reported) {
      this.reported = true;
      this.closing = 0.0001;
    }
    this.publish();
  }

  private react(events: readonly SimEvent[]) {
    for (const e of events) {
      switch (e.type) {
        case "warn": {
          const n = noticeOf(e.effect);
          this.notify(n.title, n.body, "warn");
          break;
        }
        case "end":
          if (e.effect.type !== "recentre") this.notify("Settings restored", "Back to normal ✓", "end");
          if (e.effect.type === "invert" || e.effect.type === "rotate") this.events.onStat?.("turned");
          break;
        case "found":
          playSfx("found");
          this.events.onStat?.("found");
          break;
        case "crash":
          playSfx("error");
          this.crashAt = performance.now();
          this.renderer.bump(3);
          this.events.onCrash();
          this.announce(
            e.cause === "trail"
              ? "Crashed into your own trail."
              : e.cause === "scan"
                ? "Caught by the antivirus scan."
                : e.cause === "marquee"
                  ? "Selected, and deleted."
                  : e.cause === "dialog"
                    ? "Wrong button."
                    : e.cause === "uninstalled"
                      ? "Uninstalled. Try again."
                      : e.cause === "bin"
                        ? "Deleted by the Recycle Bin."
                        : "Crashed.",
          );
          break;
        case "win":
          playSfx("escape");
          this.announce("Window closed. Escaped!");
          break;
        case "open":
          playSfx("open");
          break;
        case "close":
          playSfx("close");
          break;
        case "wrongOrder":
          playSfx("wrong");
          this.notify("Can't close that yet", "Close the oldest one first", "info");
          break;
        case "locked":
          playSfx("wrong");
          this.notify("Can't close the window", "Close everything else in it first", "info");
          break;
        case "freeze":
          playSfx("freeze");
          this.announce("Loading. You're frozen for a moment.");
          break;
        case "swap":
          playSfx("swap");
          break;
        case "hop":
          playSfx("hop");
          break;
        case "grab":
          playSfx("grab");
          break;
        case "drop":
          playSfx("drop");
          break;
        case "check":
          playSfx("check");
          break;
        case "click":
          playSfx("click");
          break;
        default:
          break;
      }
    }
  }

  private publish() {
    const s = this.session;
    const w = s.world;
    const now = performance.now();
    this.notices = this.notices.filter((n) => n.until > now);
    const effects: EffectType[] = [];
    for (const t of w.schedule) if (t.effect.type !== "recentre" && t.at <= w.tick && w.tick < t.at + t.ticks && !effects.includes(t.effect.type)) effects.push(t.effect.type);
    const next: Hud = {
      ready: this.loop?.running ?? false,
      waiting: w.status === "ready",
      status: w.status,
      ticks: w.tick,
      crashes: s.crashes,
      attempts: s.attempts,
      mode: w.mode,
      notices: this.notices,
      effects,
      message: this.message,
      uninstall: null,
    };
    const now2 = this.hud.get();
    const same =
      now2.ready === next.ready &&
      now2.waiting === next.waiting &&
      now2.status === next.status &&
      Math.floor(now2.ticks / 12) === Math.floor(next.ticks / 12) &&
      now2.crashes === next.crashes &&
      now2.attempts === next.attempts &&
      now2.mode === next.mode &&
      now2.notices === next.notices &&
      now2.effects.join() === next.effects.join() &&
      now2.message === next.message;
    if (!same) this.hud.set(next);
  }

  private render() {
    const now = performance.now();
    if (this.closing > 0) {
      this.closing += 1 / 60 / CLOSING_S;
      if (this.closing >= 1 && !this.destroyed) {
        this.closing = 1;
        this.loop.stop();
        const s = this.session;
        this.events.onWin({ ticks: s.time ?? s.world.tick, crashes: s.crashes, attempts: s.attempts, turnedClean: s.turnedClean, found: s.found });
      }
    }
    this.renderer.draw({
      world: this.session.world,
      time: (now - this.born) / 1000,
      crashAge: (now - this.crashAt) / 1000,
      reduceMotion: this.options.reduceMotion(),
      uninstall: this.session.course.src.boss ? this.session.world.uninstall : null,
      closing: this.closing,
    });
  }
}
