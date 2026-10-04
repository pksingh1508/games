// A run in the browser: the fixed 60 Hz loop, the keys (through the input layer, where Input Swap
// lives), the run itself, the glitch director and the screen's lies, the sounds (scheduled on the
// audio clock from the run's own ticks, so cues land exactly on the beat whatever the screen does),
// and the HUD. The play screen owns one per attempt; everything here runs outside React.
import { getAudio } from "@/engine/audio/engine";
import { Input, type Bindings } from "@/engine/input";
import { createLoop, type Loop } from "@/engine/loop";
import { Store } from "@/games/shared/store";
import { music } from "../audio/music";
import { CUE_SOUND, loadSfx, playSfx } from "../audio/sfx";
import { GLITCH, JUMP, PANIC_TICKS, RUNNER_W, SLIDE } from "../core/constants";
import { PathPlayer, type Cue } from "../core/reference";
import { beatStart, createRun, metres, multiplierOf, step, ticksAt, type Run, type RunEvent } from "../core/run";
import { EndlessTrack } from "../gen/endless";
import type { Daily } from "../gen/generator";
import { Director, type RunView } from "../glitches/director";
import { endAt, GLITCHES, onAt, type GlitchKind } from "../glitches/kinds";
import { CALM, lookAt, type Look } from "../glitches/present";
import { Renderer, type Snapshot } from "../render/draw";
import type { Stage } from "../stages/build";
import { BeatBar } from "./beatbar";
import { AudioClock } from "./clock";

export type Action = "jump" | "slide" | "glitch" | "pause" | "restart";
export const REMAPPABLE: readonly Action[] = ["jump", "slide", "glitch", "restart"];

export const DEFAULT_KEYS: Record<Action, string[]> = {
  jump: ["Space", "ArrowUp", "KeyW"],
  slide: ["ArrowDown", "KeyS"],
  glitch: ["ShiftLeft", "ShiftRight", "KeyJ"],
  pause: ["Escape", "KeyP"],
  restart: ["KeyR"],
};

export function bindingsFor(keys: Partial<Record<string, string[]>> | null): Bindings<Action> {
  const k = (a: Action) => (a !== "pause" && keys?.[a]?.length ? keys[a]! : DEFAULT_KEYS[a]);
  return {
    jump: { keys: k("jump"), buttons: [0, 12] },
    slide: { keys: k("slide"), buttons: [1, 13] },
    glitch: { keys: k("glitch"), buttons: [2, 5, 7] },
    pause: { keys: k("pause"), buttons: [9] },
    restart: { keys: k("restart"), buttons: [3] },
  };
}

export type Mode = { kind: "stage"; stage: Stage } | { kind: "endless"; seed: number; daily: Daily | null };

export interface Hud {
  ready: boolean;
  status: Run["status"];
  metres: number;
  score: number;
  corruption: number;
  multiplier: number;
  charges: number;
  bits: number;
  panic: boolean;
  /** Input Swap: the HUD's control icons flip too (the HUD never lies). */
  swap: boolean;
  warnings: GlitchKind[];
  active: GlitchKind[];
  flicker: boolean;
  notResponding: boolean;
  /** For screen readers: what just happened. */
  message: string;
  attempt: number;
}

export const initialHud = (): Hud => ({
  ready: false,
  status: "run",
  metres: 0,
  score: 0,
  corruption: 0,
  multiplier: 1,
  charges: 0,
  bits: 0,
  panic: false,
  swap: false,
  warnings: [],
  active: [],
  flicker: false,
  notResponding: false,
  message: "",
  attempt: 1,
});

/** How a run went (for the save, the trophies and the cards). */
export interface RunResult {
  won: boolean;
  score: number;
  metres: number;
  cause: Run["cause"];
  clips: number;
  panics: number;
  panicsSurvived: number;
  /** Ticks spent above 80% corruption (Living Dangerously). */
  above80: number;
  tearsSurvived: number;
  /** Not Responding, all the way through, still running (Blind Faith). */
  blindRuns: number;
  /** Glitch power used at all (Clean Code is a stage without it). */
  glitched: boolean;
  /** The highest the score multiplier got (the share card). */
  peak: number;
  ticks: number;
}

export interface RuntimeOptions {
  mode: Mode;
  gentle: boolean;
  keys: Partial<Record<string, string[]>> | null;
  reduceFlashing: () => boolean;
  reduceMotion: () => boolean;
}

export interface RuntimeEvents {
  /** The run ended (patched, or out of the stage). */
  onEnd(result: RunResult): void;
  onPauseToggle(): void;
}

/** The history kept for Audio Desync and Ghost Double (ticks). */
const HISTORY = 48;
/** Sounds are scheduled this far ahead (ticks). */
const LOOKAHEAD = 10;

export class Runtime {
  run!: Run;
  director!: Director;
  readonly input: Input<Action>;
  readonly renderer: Renderer;
  private readonly loop: Loop;
  private readonly clock = new AudioClock();
  private beatBar: BeatBar | null = null;
  private endless: EndlessTrack | null = null;
  private history: Snapshot[] = [];
  private look: Look = CALM;
  private born = performance.now();
  private paused = false;
  private destroyed = false;
  private ended = false;
  /** How far into the finale the announcements have got. */
  private finalePhase = 0;
  private padTimer: ReturnType<typeof setInterval> | null = null;
  private unsubscribe: Array<() => void> = [];
  private scheduledTo = 0;
  private stats!: Omit<RunResult, "won" | "score" | "metres" | "cause" | "ticks">;
  private seenWarnings = new Set<number>();
  private message = "";
  private messages = 0;
  private attempt = 0;
  private gentle: boolean;
  /** The quality fallback: frame times since the last look, and how many slow stretches in a row. */
  private frameTimes: number[] = [];
  private lastFrame = 0;
  private slowStretches = 0;
  /** QA: a stage playing itself (its reference run, exactly as the cues say). */
  private autoplayOn = false;
  private autoplay: PathPlayer | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    private readonly options: RuntimeOptions,
    private readonly hud: Store<Hud>,
    private readonly events: RuntimeEvents,
  ) {
    this.gentle = options.gentle;
    this.renderer = new Renderer(canvas);
    this.input = new Input<Action>(bindingsFor(options.keys));
    this.loop = createLoop({ update: () => this.update(), render: (alpha) => this.render(alpha) });
    this.newAttempt();
  }

  /** A fresh attempt: the stage from the start (or a new endless run: the daily keeps its seed). */
  newAttempt(seed?: number) {
    const { mode } = this.options;
    this.attempt++;
    if (mode.kind === "stage") {
      const s = mode.stage;
      this.run = createRun({ ...s.config, track: s.config.track.clone() });
      this.director = new Director({ plan: s.plan, gentle: this.gentle });
      this.endless = null;
    } else {
      const runSeed = seed ?? mode.seed;
      this.endless = new EndlessTrack(runSeed);
      this.run = createRun(this.endless.config());
      this.director = new Director({ plan: { seed: runSeed }, marks: this.endless.generator.marks, gentle: this.gentle });
    }
    this.autoplay = this.autoplayOn && mode.kind === "stage" ? new PathPlayer(mode.stage.moves) : null;
    this.history = [];
    this.look = CALM;
    this.ended = false;
    this.finalePhase = 0;
    this.seenWarnings.clear();
    this.scheduledTo = 0;
    this.stats = { clips: 0, panics: 0, panicsSurvived: 0, above80: 0, tearsSurvived: 0, blindRuns: 0, glitched: false, peak: multiplierOf(this.run.corruption) };
    this.renderer.fx.clear();
    this.born = performance.now();
    this.remember();
    this.publish();
  }

  /** The cues to announce (story: worked out with the stage; endless: as the track is built). */
  private cues(): readonly Cue[] {
    return this.endless ? this.endless.cues : this.options.mode.kind === "stage" ? this.options.mode.stage.cues : [];
  }

  bindBeatBar(canvas: HTMLCanvasElement | null) {
    this.beatBar = canvas ? new BeatBar(canvas) : null;
  }

  start() {
    void loadSfx();
    const mode = this.options.mode;
    music.start(mode.kind === "stage" ? Math.floor((Number(mode.stage.source.id) - 1) / 5) : 1);
    // Once the run's over, the keys (and the gamepad's buttons) belong to the card on screen.
    this.input.attach(window, () => !this.paused && !this.ended);
    this.unsubscribe.push(
      this.input.onPress((action) => {
        if (this.ended) return;
        if (action === "pause") this.events.onPauseToggle();
        else if (action === "restart" && this.run.status === "run") this.retry();
      }),
    );
    const hidden = () => {
      if (document.visibilityState === "hidden" && !this.paused && this.run.status === "run") this.events.onPauseToggle();
    };
    document.addEventListener("visibilitychange", hidden);
    this.unsubscribe.push(() => document.removeEventListener("visibilitychange", hidden));
    this.render(0);
    this.loop.start();
    this.publish();
  }

  /** Straight back in (after a crash, or R mid-run). */
  retry() {
    if (this.paused) return;
    const mode = this.options.mode;
    this.newAttempt(mode.kind === "endless" && !mode.daily ? (Math.random() * 2 ** 32) >>> 0 : undefined);
    music.resume();
  }

  setPrefs(prefs: { gentle: boolean; keys: Partial<Record<string, string[]>> | null }) {
    this.gentle = prefs.gentle;
    this.input.setBindings(bindingsFor(prefs.keys));
  }

  pause() {
    if (this.paused || this.destroyed) return;
    this.paused = true;
    this.loop.stop();
    this.input.clear();
    music.pause();
    this.publish();
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
    this.scheduledTo = this.run.tick;
    this.loop.start();
    this.publish();
  }

  get isPaused() {
    return this.paused;
  }

  /** On-screen buttons. */
  press(action: Action) {
    if (action === "pause") this.events.onPauseToggle();
    else this.input.press(action);
  }

  release(action: Action) {
    this.input.release(action);
  }

  destroy() {
    this.destroyed = true;
    this.loop.stop();
    this.input.detach();
    music.stop();
    if (this.padTimer) clearInterval(this.padTimer);
    this.unsubscribe.forEach((off) => off());
  }

  /** QA: run some ticks with these (already mapped) input bits (or the autoplay's), then draw. */
  devStep(bits: number | null, ticks: number) {
    for (let i = 0; i < ticks; i++) this.update(bits ?? undefined);
    this.render(1);
  }

  /** QA: from a fresh attempt, the stage plays itself (its reference run). */
  devAutoplay(on: boolean) {
    this.autoplayOn = on;
    this.newAttempt();
  }

  // -------------------------------------------------------------------------------------------

  private view(): RunView {
    const run = this.run;
    return {
      tick: run.tick,
      beat: run.beat,
      beatTick: run.beatTick,
      corruption: run.corruption,
      panic: run.panic,
      beatStart: (b) => beatStart(run.config, b),
      ticksAt: (b) => ticksAt(run.config, b),
    };
  }

  private snapshot(): Snapshot {
    const r = this.run.runner;
    return { tick: this.run.tick, x: r.x, y: r.y, h: r.h, sliding: r.sliding, grounded: r.grounded, vy: r.vy, clip: r.clip, status: this.run.status };
  }

  private remember() {
    this.history.push(this.snapshot());
    if (this.history.length > HISTORY) this.history.shift();
  }

  private ago(ticks: number): Snapshot {
    return this.history[Math.max(0, this.history.length - 1 - ticks)]!;
  }

  private announce(text: string) {
    this.messages++;
    this.message = this.messages % 2 ? text : `${text}​`;
  }

  private update(forced?: number) {
    this.input.pollGamepads();
    if (this.run.status !== "run") return;
    let bits: number;
    if (forced !== undefined) bits = forced;
    else if (this.autoplay) bits = this.autoplay.next(this.run);
    else {
      // The input layer: Input Swap trades jump and slide (the simulation never knows).
      const jump = this.input.sample("jump");
      const slide = this.input.sample("slide");
      const glitch = this.input.sample("glitch");
      const [j, s] = this.look.swap ? [slide, jump] : [jump, slide];
      bits = (j ? JUMP : 0) | (s ? SLIDE : 0) | (glitch ? GLITCH : 0);
    }
    const events = step(this.run, bits);
    this.director.update(this.view());
    this.look = lookAt(this.director.at(this.run.tick), this.run.tick, { corruption: this.run.corruption, panic: this.run.panic > 0 }, { reduceFlashing: this.options.reduceFlashing(), reduceMotion: this.options.reduceMotion() });
    this.remember();
    this.renderer.fx.tick();
    this.react(events);
    this.finaleNews();
    if (this.run.corruption > 80) this.stats.above80++;
    this.stats.peak = Math.max(this.stats.peak, multiplierOf(this.run.corruption));
    music.setCorruption(this.run.corruption, this.run.panic > 0);
    if (this.run.status !== "run" && !this.ended) this.finish();
    this.publish();
  }

  private react(events: readonly RunEvent[]) {
    const r = this.run.runner;
    const feet = { x: r.x + RUNNER_W / 2, y: r.y + r.h };
    for (const e of events) {
      switch (e.type) {
        case "jump":
          playSfx("jump");
          break;
        case "land":
          if (e.impact > 3) {
            playSfx("land", { volume: Math.min(1, e.impact / 8) });
            this.renderer.fx.dust(feet.x, feet.y, Math.min(2, e.impact / 4));
          }
          break;
        case "slide":
          playSfx("slide");
          break;
        case "clip":
          playSfx("clip");
          this.stats.clips++;
          this.stats.glitched = true;
          this.announce("Clip! Intangible for a moment.");
          break;
        case "noCharge":
          playSfx("noCharge");
          break;
        case "phased":
          playSfx("phased");
          break;
        case "bit":
          playSfx("bit", { rate: 1 + (e.bits % 10) * 0.05 });
          this.renderer.fx.sparkle(feet.x, r.y + 4, "#00F5D4", e.bits % 2 ? "1" : "0");
          break;
        case "charge":
          playSfx("charge");
          this.announce(`Glitch charge ${e.charges} of 3.`);
          break;
        case "patch":
          playSfx("patch");
          this.renderer.fx.sparkle(feet.x, r.y + 6, "#7CFF6B");
          this.announce("Patch: corruption down.");
          break;
        case "nearMiss":
          playSfx("nearMiss");
          break;
        case "scanFire":
          playSfx("scan");
          break;
        case "panic":
          playSfx("panic");
          this.stats.panics++;
          this.announce("Kernel Panic! Survive ten seconds.");
          break;
        case "panicSurvived":
          playSfx("panicSurvived");
          this.stats.panicsSurvived++;
          this.announce("Kernel Panic survived.");
          break;
        case "death":
          playSfx("patched");
          this.renderer.fx.shatter(feet.x, r.y + r.h / 2);
          this.renderer.bump(5);
          this.announce(e.cause === "scan" ? "Patched by The Debugger's scan." : e.cause === "void" ? "Lost in the void." : e.cause === "spikes" ? "Patched by corrupted spikes." : "Crashed into a wall.");
          break;
        case "win":
          playSfx("exit");
          this.announce("Out of the stage!");
          break;
        default:
          break;
      }
    }
    // Glitch warnings (a crackle, and the name for screen readers), and glitches survived.
    for (const { event, phase } of this.director.at(this.run.tick)) {
      if (phase === "warning" && !this.seenWarnings.has(event.id)) {
        this.seenWarnings.add(event.id);
        playSfx("crackle", { volume: 0.7 });
        this.announce(`Glitch coming: ${GLITCHES[event.kind].name}. ${GLITCHES[event.kind].tell}`);
      }
    }
    for (const e of this.director.events) {
      if (endAt(e) === this.run.tick && this.run.status === "run") {
        if (e.kind === "screenTear") this.stats.tearsSurvived++;
        if (e.kind === "notResponding" && onAt(e) < this.run.tick) this.stats.blindRuns++;
      }
    }
  }

  private finish() {
    this.ended = true;
    const run = this.run;
    const result: RunResult = {
      won: run.status === "won",
      score: Math.floor(run.score),
      metres: metres(run),
      cause: run.cause,
      ticks: run.tick,
      ...this.stats,
    };
    // A beat for the "PATCHED" stamp (or the exit) to land.
    setTimeout(() => {
      if (!this.destroyed && this.run === run) this.events.onEnd(result);
    }, run.status === "won" ? 500 : 650);
  }

  /** The last stage's finale, as it stands: the deletion behind you, the white void, the console. */
  private finale(): { deleting: number | null; whiteout: number; caption: string | null } {
    const mode = this.options.mode;
    const fin = mode.kind === "stage" ? mode.stage.finale : null;
    if (!fin) return { deleting: null, whiteout: 0, caption: null };
    const run = this.run;
    const at = run.beat + run.beatTick / ticksAt(run.config, run.beat);
    const clamp = (v: number) => Math.max(0, Math.min(1, v));
    const deleting = at >= fin.deleteFrom ? clamp((at - fin.deleteFrom) / 2) : null;
    // White from two beats before the void's first obstacle, back to normal a beat after its last.
    const whiteout = clamp((at - (fin.voidFrom - 2)) / 2) * clamp(1 - (at - fin.voidTo));
    const caption = at >= fin.voidTo ? null : at >= fin.voidFrom - 2 ? "> debugger --reformat /dev/screen" : deleting !== null ? "> debugger --delete ./ground" : null;
    return { deleting, whiteout, caption };
  }

  /** For screen readers: the finale's phases as they start. */
  private finaleNews() {
    const { deleting, whiteout } = this.finale();
    const phase = whiteout > 0 ? 2 : deleting !== null ? 1 : 0;
    if (phase <= this.finalePhase) return;
    this.finalePhase = phase;
    this.announce(phase === 1 ? "The Debugger is deleting the ground behind you. Keep running." : "The screen is being reformatted into a white void. Run by the sound and the beat bar.");
  }

  private publish() {
    const run = this.run;
    const look = this.look;
    const next: Hud = {
      ready: this.loop?.running ?? false,
      status: run.status,
      metres: metres(run),
      score: Math.floor(run.score),
      corruption: Math.round(run.corruption),
      multiplier: Math.round(multiplierOf(run.corruption) * 10) / 10,
      charges: run.charges,
      bits: run.bits,
      panic: run.panic > 0,
      swap: look.swap,
      warnings: look.warnings,
      active: look.active,
      flicker: look.flicker,
      notResponding: look.notResponding,
      message: this.message,
      attempt: this.attempt,
    };
    const now = this.hud.get();
    const same = (Object.keys(next) as Array<keyof Hud>).every((k) => (Array.isArray(next[k]) ? (next[k] as unknown[]).join() === (now[k] as unknown[]).join() : now[k] === next[k]));
    if (!same) this.hud.set(next);
  }

  /** Two slow stretches in a row (two seconds under about 45 fps): the renderer steps its quality down. */
  private watchFrames() {
    const now = performance.now();
    const dt = now - this.lastFrame;
    this.lastFrame = now;
    // Not while paused, between runs, or after the tab was away.
    if (this.paused || this.run.status !== "run" || dt > 250) return;
    this.frameTimes.push(dt);
    if (this.frameTimes.length < 120) return;
    const average = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.frameTimes = [];
    if (average <= 22) this.slowStretches = 0;
    else if (++this.slowStretches >= 2 && this.renderer.degrade()) this.slowStretches = 0;
  }

  /** The tick the screen shows: earlier under Audio Desync. */
  private render(alpha: number) {
    this.watchFrames();
    const look = this.look;
    const live = this.ago(0);
    const livePrev = this.ago(1);
    const shown = this.ago(look.lag);
    const shownPrev = this.ago(look.lag + 1);
    const chaseFrom = this.options.mode.kind === "stage" ? this.options.mode.stage.chaseFrom : null;
    const run = this.run;
    let presence = 0;
    let charge = 0;
    if (chaseFrom !== null) {
      presence = Math.max(0, Math.min(1, (run.beat + run.beatTick / ticksAt(run.config, run.beat) - (chaseFrom - 2)) / 2));
      for (const s of run.config.scans ?? []) {
        const until = beatStart(run.config, s.beat) - run.tick;
        if (until >= 0 && until < ticksAt(run.config, s.beat)) charge = Math.max(charge, 1 - until / ticksAt(run.config, s.beat));
      }
    }
    this.renderer.draw({
      shown,
      shownPrev,
      live,
      livePrev,
      ghost: look.ghost ? this.ago(10) : null,
      run,
      look,
      time: (performance.now() - this.born) / 1000,
      alpha: run.status === "run" ? alpha : 1,
      debugger: presence,
      charge,
      panic: run.panic > 0 && run.panic < PANIC_TICKS,
      reduceMotion: this.options.reduceMotion(),
      ...this.finale(),
      exitLabel: this.options.mode.kind === "stage" && this.options.mode.stage.finale ? "/root" : "EXIT",
    });
    this.beatBar?.draw(this.cues(), run, alpha, look.flicker);
    this.schedule(alpha);
  }

  /** Sounds ahead of time, on the audio clock: the music's sixteenths and every cue (a beat early). */
  private schedule(alpha: number) {
    const audio = getAudio();
    this.clock.sync(audio);
    if (!audio || this.paused || this.run.status !== "run") return;
    const run = this.run;
    const nowTick = run.tick + alpha;
    const perf = performance.now() / 1000;
    const timeOf = (tick: number) => this.clock.toAudio(perf + (tick - nowTick) / 60);
    const until = run.tick + LOOKAHEAD;
    const from = Math.max(this.scheduledTo, run.tick);
    if (until <= from) return;
    // Music: every sixteenth that starts in [from, until).
    for (let beat = run.beat; beat <= run.beat + 1; beat++) {
      const start = beatStart(run.config, beat);
      const ticks = ticksAt(run.config, beat);
      for (let n = 0; n < 4; n++) {
        const tick = start + Math.floor((n * ticks) / 4);
        if (tick < from || tick >= until) continue;
        const t = timeOf(tick);
        if (t !== null && t > audio.ctx.currentTime - 0.02) music.step(beat, n, Math.max(audio.ctx.currentTime, t), ticks / 4 / 60);
      }
    }
    // Cues: a beat before each move.
    for (const cue of this.cues()) {
      const ticks = ticksAt(run.config, run.beat);
      const at = cue.tick - ticks;
      if (at < from || at >= until) continue;
      const t = timeOf(at);
      if (t !== null) playSfx(CUE_SOUND[cue.move], { at: Math.max(audio.ctx.currentTime, t), volume: 0.8 });
    }
    this.scheduledTo = until;
  }
}

export const glitchName = (kind: GlitchKind) => GLITCHES[kind].name;
