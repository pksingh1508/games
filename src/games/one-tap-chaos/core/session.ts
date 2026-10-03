// The live game (Plan/09-one-tap-chaos.md §12): one run as a timeline of segments on the clock
// (count-in → [card] → [boss intro] → microgame → break → …). It reads the one input, plays the
// rounds through their rule wrappers, draws the canvas, schedules the music a little ahead on the
// audio clock, and publishes a small HUD state that React renders. React stays out of the hot path.
import { getAudio, type AudioEngine } from "@/engine/audio/engine";
import { createRng } from "@/engine/rng";
import { botPresses } from "../bots/harness";
import { getGame } from "../microgames";
import type { BossId, Cue, Microgame, MicrogameContext, MicrogameId, Scene, View } from "../microgames/types";
import { playBeat, type MusicPart } from "../music";
import { line, onBeat } from "../render/draw";
import { drawLobby } from "../render/lobby";
import { DARK_BEATS, type RuleId } from "../rules";
import { isTrap, Round, wantsNoTap } from "../rules/round";
import { playCount, playSfx, playWin, type SfxName } from "../sfx";
import { AudioClock, eventSeconds } from "./clock";
import { Store } from "@/games/shared/store";
import type { Planner } from "./practice";
import { applyResult, isOver, newRunState, pointsFor, type RoundPlan, type RunState } from "./run";
import { BREAK_BEATS, CARD_BEATS, BOSS_INTRO_BEATS, COUNT_IN_BEATS, RESUME_COUNT_IN_BEATS } from "./timing";

export type SessionMode = "run" | "daily" | "practice" | "demo";

export interface SessionSettings {
  /** Calibrated tap offset, in seconds. */
  offset: number;
  reducedMotion: boolean;
  reduceFlashing: boolean;
  holdMode: boolean;
  visualBeat: boolean;
}

export interface RoundReport {
  plan: RoundPlan;
  won: boolean;
  /** Red Means No / no crown. */
  trap: boolean;
  /** The right answer was not to tap. */
  noTap: boolean;
  /** At least one action reached the microgame. */
  tapped: boolean;
  state: RunState;
}

export interface RunSummary {
  mode: SessionMode;
  state: RunState;
  playedMs: number;
}

export interface SessionEvents {
  onRoundResult?(report: RoundReport): void;
  onCard?(rule: RuleId, isNew: boolean): void;
  onGameOver?(summary: RunSummary): void;
  onPauseChange?(paused: boolean): void;
}

export interface Instruction {
  text: string;
  game: MicrogameId | BossId;
  red: boolean;
  /** Crown shown (true), empty crown slot (false), no crown slot (null). */
  crown: boolean | null;
  silent: boolean;
  caption: string;
  /** A rule the scene announces ("OPPOSITE!"). */
  rule: string | null;
  boss: boolean;
}

export interface RoundResultView {
  won: boolean;
  trap: boolean;
  /** Which trap it was: a red instruction, or a missing crown. */
  red: boolean;
  crownless: boolean;
  points: number;
  lifeLost: boolean;
  game: MicrogameId | BossId;
}

export interface HudState {
  phase: "countin" | "game" | "break" | "card" | "boss" | "over";
  paused: boolean;
  lives: number;
  score: number;
  streak: number;
  /** The round being played (or just played). */
  index: number;
  /** Count-in: 3, 2, 1… then 0 for GO. Null otherwise. */
  count: number | null;
  /** 0-based beat within the segment, and how many it has. */
  beat: number;
  beats: number;
  bpm: number;
  tier: number;
  instruction: Instruction | null;
  /** Rules shown as badges: this round's (or the next round's, between rounds). */
  rules: RuleId[];
  mirror: boolean;
  dark: boolean;
  result: RoundResultView | null;
  speedUp: boolean;
  card: { rule: RuleId; isNew: boolean } | null;
  boss: BossId | null;
  /** Bumps on every press (for the tap ripple). */
  presses: number;
  /** Waiting for the second tap of a Double Tap. */
  half: boolean;
  /** Lagged taps on their way. */
  inFlight: number;
  /** The current round's verdict, as soon as it's decided. */
  decided: "win" | "lose" | null;
  practice: { wins: number; losses: number } | null;
  mode: SessionMode;
}

interface Live {
  plan: RoundPlan;
  game: Microgame<MicrogameId | BossId>;
  ctx: MicrogameContext;
  scene: Scene;
  round: Round;
  segment: Segment | null;
  lastBeat: number;
  finalized: boolean;
  decided: "win" | "lose" | null;
  bot: number[] | null;
  botIndex: number;
  sprungHeard: boolean;
}

interface Segment {
  kind: "countin" | "game" | "break" | "card" | "boss" | "end";
  start: number;
  bpm: number;
  beats: number;
  tier: number;
  /** The round it belongs to (break: the round just played). */
  plan: RoundPlan | null;
  live?: Live;
  /** A resume count-in draws the paused round, frozen. */
  frozen?: { live: Live; beat: number };
}

const segmentEnd = (s: Segment) => s.start + (s.beats * 60) / s.bpm;
const beatIn = (s: Segment, t: number) => ((t - s.start) * s.bpm) / 60;
/** A round is judged a moment after its last beat: a tap can arrive a frame late. */
const GRACE = 0.1;
/** How far ahead the music is scheduled. */
const LOOKAHEAD = 0.25;

/** What the HUD shows before the first frame. */
export function initialHud(mode: SessionMode): HudState {
  return {
    phase: "countin",
    paused: false,
    lives: 4,
    score: 0,
    streak: 0,
    index: 1,
    count: null,
    beat: 0,
    beats: COUNT_IN_BEATS,
    bpm: 100,
    tier: 1,
    instruction: null,
    rules: [],
    mirror: false,
    dark: false,
    result: null,
    speedUp: false,
    card: null,
    boss: null,
    presses: 0,
    half: false,
    inFlight: 0,
    decided: null,
    practice: mode === "practice" ? { wins: 0, losses: 0 } : null,
    mode,
  };
}

/** The display font's family, for canvas text (Bungee via next/font's CSS variable). */
export function showFontFamily(): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue("--font-g-bungee").trim();
  return value || "sans-serif";
}

export class Session {

  private segments: Segment[] = [];
  private cur = 0;
  private state: RunState = newRunState();
  private active: Live | null = null;
  private next: Live | null = null;
  private lastResult: RoundResultView | null = null;
  private practice = { wins: 0, losses: 0 };
  private presses = 0;
  private paused = false;
  private pausedAt = 0;
  private over = false;
  private started = false;
  private startedAt = 0;
  private playedMs = 0;
  private lastFrame = 0;

  private readonly clock = new AudioClock();
  private musicOut: GainNode | null = null;
  private sfxOut: GainNode | null = null;
  private scheduledUntil = 0;
  private scheduledCues = new WeakSet<Cue>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private raf = 0;

  private readonly g: CanvasRenderingContext2D;
  private size = { width: 1, height: 1, dpr: 1 };
  private stageRect = { x: 0, y: 0, w: 1, h: 1 };
  private observer: ResizeObserver | null = null;
  private readonly font: string;
  private gamepadDown = false;
  private gamepadStart = false;
  private cleanups: Array<() => void> = [];

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly stage: HTMLElement,
    private readonly area: HTMLElement,
    private readonly planner: Planner,
    readonly mode: SessionMode,
    private settings: SessionSettings,
    private readonly hud: Store<HudState>,
    private readonly events: SessionEvents = {},
  ) {
    this.g = canvas.getContext("2d", { alpha: false })!;
    this.font = showFontFamily();
    this.observer = new ResizeObserver(() => this.measure());
    this.observer.observe(canvas);
    this.observer.observe(stage);
    this.measure();
    this.bindInput();
    this.raf = requestAnimationFrame(this.frame);
    // Development only: lets QA scripts see the bot's moments and play real key presses at them.
    if (process.env.NODE_ENV !== "production") (window as unknown as { __otcSession?: Session }).__otcSession = this;
  }

  /**
   * Development: when the bot would press in the current (or next) round, as performance.now()
   * milliseconds, plus that round's id. Lets a test drive real input through the whole pipeline.
   */
  debugPlan(): { index: number; game: string; presses: number[]; rules: string[] } | null {
    const live = this.active && !this.active.finalized ? this.active : this.next;
    const seg = live?.segment;
    if (!live || !seg) return null;
    const spb = 60 / seg.bpm;
    const presses = botPresses(live.scene.plan(), live.plan, live.plan.bpm).map((b) => (seg.start + b * spb + this.settings.offset) * 1000);
    return { index: live.plan.index, game: live.plan.game, presses, rules: live.plan.rules };
  }

  // -------------------------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------------------------

  /** Start the run with a count-in. Call from a tap or key press, so audio may start. */
  start() {
    if (this.started) return;
    this.started = true;
    getAudio();
    const first = this.planner.round(1);
    const now = this.gameNow();
    this.segments.push({ kind: "countin", start: now + 0.35, bpm: first.bpm, beats: COUNT_IN_BEATS, tier: first.tier, plan: first });
    this.appendRound(first);
    this.startedAt = performance.now();
    this.lastFrame = this.startedAt;
    this.scheduledUntil = performance.now() / 1000;
    this.timer = setInterval(this.schedule, 25);
    this.schedule();
  }

  pause() {
    if (!this.started || this.paused || this.over) return;
    this.paused = true;
    this.pausedAt = this.gameNow();
    this.cutAudio();
    this.publish(this.pausedAt, true);
    this.events.onPauseChange?.(true);
  }

  /** Back to the run, after a 3-beat count-in (Plan §10.7). */
  resume() {
    if (!this.paused || this.over) return;
    getAudio();
    const now = this.gameNow();
    const seg = this.segments[this.cur]!;
    const countBpm = seg.bpm;
    const countStart = now + 0.3;
    const countEnd = countStart + (RESUME_COUNT_IN_BEATS * 60) / countBpm;
    const shift = countEnd - this.pausedAt;
    for (let i = this.cur; i < this.segments.length; i++) this.segments[i]!.start += shift;
    const frozen = this.active && this.active.segment === seg ? { live: this.active, beat: Math.max(0, beatIn(seg, this.pausedAt + shift)) } : undefined;
    this.segments.splice(this.cur, 0, {
      kind: "countin",
      start: countStart,
      bpm: countBpm,
      beats: RESUME_COUNT_IN_BEATS,
      tier: seg.tier,
      plan: seg.plan,
      frozen,
    });
    this.paused = false;
    this.lastFrame = performance.now();
    this.scheduledUntil = performance.now() / 1000;
    this.events.onPauseChange?.(false);
  }

  get isPaused() {
    return this.paused;
  }

  setSettings(next: Partial<SessionSettings>) {
    this.settings = { ...this.settings, ...next };
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    if (this.timer) clearInterval(this.timer);
    this.cutAudio();
    this.observer?.disconnect();
    this.cleanups.forEach((fn) => fn());
  }

  // -------------------------------------------------------------------------------------------
  // Input: one button. Pointer, keyboard and gamepad all become the same press.
  // -------------------------------------------------------------------------------------------

  /** A press at `seconds` on the performance clock. */
  press(seconds: number) {
    if (!this.started || this.paused || this.over || this.mode === "demo") return;
    this.presses++;
    this.pressAt(seconds - this.settings.offset);
  }

  release(seconds: number) {
    if (!this.started || this.paused || this.over || this.mode === "demo") return;
    const live = this.active;
    if (!live || live.finalized || !live.segment) return;
    const t = seconds - this.settings.offset;
    if (t < live.segment.start || t > segmentEnd(live.segment)) return;
    live.round.release(beatIn(live.segment, t));
  }

  private pressAt(t: number) {
    const live = this.active;
    const seg = live?.segment;
    if (!live || !seg || live.finalized) return;
    // Taps during a count-in (or between rounds) don't count.
    if (this.segments[this.cur]?.kind === "countin") return;
    if (t < seg.start || t > segmentEnd(seg)) return;
    const b = beatIn(seg, t);
    if (b <= live.lastBeat - 0.5) return;
    const result = live.round.press(b);
    if (result !== "action") playSfx("tap");
    if (live.round.trap && live.round.sprungAt !== null && !live.sprungHeard) {
      live.sprungHeard = true;
      playSfx("fail");
    }
  }

  private bindInput() {
    const ignore = (target: EventTarget | null) => target instanceof Element && target.closest("[data-no-tap]") !== null;
    const isTyping = (target: EventTarget | null) => target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

    const onPointerDown = (event: PointerEvent) => {
      if (ignore(event.target) || (event.pointerType === "mouse" && event.button !== 0)) return;
      event.preventDefault();
      this.press(eventSeconds(event.timeStamp));
    };
    const onPointerUp = (event: PointerEvent) => {
      if (ignore(event.target)) return;
      this.release(eventSeconds(event.timeStamp));
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTyping(event.target) || document.querySelector("[role=dialog]")) return;
      if (event.code === "Escape" || event.code === "KeyP") {
        if (this.started && !this.over) {
          event.preventDefault();
          this.pause();
        }
        return;
      }
      if (event.code === "Space" || event.code === "Enter" || event.code === "NumpadEnter") {
        if (!this.started || this.over) return;
        event.preventDefault();
        if (!event.repeat) this.press(eventSeconds(event.timeStamp));
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space" || event.code === "Enter" || event.code === "NumpadEnter") this.release(eventSeconds(event.timeStamp));
    };
    const onHidden = () => {
      if (document.visibilityState === "hidden") this.pause();
    };
    const noMenu = (event: Event) => event.preventDefault();

    this.area.addEventListener("pointerdown", onPointerDown);
    this.area.addEventListener("pointerup", onPointerUp);
    this.area.addEventListener("pointercancel", onPointerUp);
    this.area.addEventListener("contextmenu", noMenu);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", onHidden);
    this.cleanups.push(() => {
      this.area.removeEventListener("pointerdown", onPointerDown);
      this.area.removeEventListener("pointerup", onPointerUp);
      this.area.removeEventListener("pointercancel", onPointerUp);
      this.area.removeEventListener("contextmenu", noMenu);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", onHidden);
    });
  }

  /** Gamepads have no events for buttons: poll them once a frame. */
  private pollGamepad() {
    if (typeof navigator.getGamepads !== "function") return;
    let down = false;
    let start = false;
    for (const pad of navigator.getGamepads()) {
      if (!pad) continue;
      down ||= Boolean(pad.buttons[0]?.pressed);
      start ||= Boolean(pad.buttons[9]?.pressed);
    }
    const now = performance.now() / 1000;
    if (down && !this.gamepadDown) this.press(now);
    if (!down && this.gamepadDown) this.release(now);
    if (start && !this.gamepadStart) {
      if (this.paused) this.resume();
      else this.pause();
    }
    this.gamepadDown = down;
    this.gamepadStart = start;
  }

  // -------------------------------------------------------------------------------------------
  // The timeline
  // -------------------------------------------------------------------------------------------

  private gameNow() {
    return performance.now() / 1000 - this.settings.offset;
  }

  /** Queue a round after whatever is already queued: [card] [boss intro] game, break. */
  private appendRound(plan: RoundPlan) {
    const last = this.segments[this.segments.length - 1];
    let start = last ? segmentEnd(last) : this.gameNow() + 0.35;
    const push = (seg: Omit<Segment, "start">) => {
      const full = { ...seg, start } as Segment;
      this.segments.push(full);
      start = segmentEnd(full);
      return full;
    };
    if (plan.card) push({ kind: "card", bpm: plan.bpm, beats: CARD_BEATS, tier: plan.tier, plan });
    if (plan.boss) push({ kind: "boss", bpm: plan.bpm, beats: BOSS_INTRO_BEATS, tier: plan.tier, plan });
    const live = this.createLive(plan);
    const game = push({ kind: "game", bpm: plan.bpm, beats: plan.beats, tier: plan.tier, plan, live });
    live.segment = game;
    const following = this.planner.round(plan.index + 1);
    push({ kind: "break", bpm: following.bpm, beats: BREAK_BEATS, tier: following.tier, plan });
    this.next = live;
  }

  private createLive(plan: RoundPlan): Live {
    const game = getGame(plan.game);
    const rules = plan.rules;
    const ctx: MicrogameContext = {
      bpm: plan.bpm,
      beats: plan.beats,
      rng: createRng(plan.seed),
      difficulty: plan.difficulty,
      window: plan.window,
      inverted: rules.includes("opposite"),
      dark: rules.includes("lightsOut") ? DARK_BEATS : [],
      holdMode: this.settings.holdMode,
      emit: (sound: SfxName) => {
        if (this.active?.ctx === ctx) playSfx(sound);
      },
    };
    const scene = game.create(ctx);
    const round = new Round(scene, plan, plan.bpm);
    let bot: number[] | null = null;
    if (this.mode === "demo") {
      // The demo bot plays well, and fluffs one now and then so you see what failing looks like.
      const fluff = createRng(plan.seed ^ 0x5eed)() < 0.12;
      const presses = botPresses(scene.plan(), plan, plan.bpm);
      bot = fluff ? (presses.length ? [] : [3]) : presses;
    }
    return { plan, game, ctx, scene, round, segment: null, lastBeat: -Infinity, finalized: false, decided: null, bot, botIndex: 0, sprungHeard: false };
  }

  private advance(t: number) {
    // Move through segments whose time is up.
    while (this.cur < this.segments.length - 1 && t >= segmentEnd(this.segments[this.cur]!)) {
      this.cur++;
      this.enter(this.segments[this.cur]!);
    }
    const seg = this.segments[this.cur];
    if (seg?.kind === "game" && seg.live && this.active !== seg.live) this.active = seg.live;

    const live = this.active;
    if (live && live.segment && !live.finalized) {
      const gs = live.segment;
      const b = Math.min(gs.beats, beatIn(gs, t));
      const counting = this.segments[this.cur]?.kind === "countin";
      if (!counting && b >= 0) {
        // Demo presses.
        if (live.bot) {
          while (live.botIndex < live.bot.length && live.bot[live.botIndex]! <= b) {
            this.presses++;
            live.round.press(live.bot[live.botIndex++]!);
          }
        }
        if (b > live.lastBeat) {
          live.round.update(b);
          live.lastBeat = b;
        }
        const now = live.round.outcome(false);
        if (now !== "pending" && !live.decided) live.decided = now;
      }
      if (t >= segmentEnd(gs) + GRACE) this.finalize(live);
    }
  }

  private enter(seg: Segment) {
    switch (seg.kind) {
      case "card":
        if (seg.plan?.card) {
          playSfx("card");
          this.events.onCard?.(seg.plan.card, seg.plan.newCard);
        }
        break;
      case "boss":
        playSfx("gong");
        break;
      case "game":
        this.lastResult = null;
        break;
      case "end":
        this.finish();
        break;
    }
  }

  private finalize(live: Live) {
    live.finalized = true;
    const plan = live.plan;
    const won = live.round.outcome(true) === "win";
    const before = this.state;
    const practice = this.mode === "practice";
    this.state = applyResult(this.state, plan, won, { infinite: practice });
    if (practice) this.practice = { wins: this.practice.wins + (won ? 1 : 0), losses: this.practice.losses + (won ? 0 : 1) };
    const lifeLost = this.state.lives < before.lives;
    this.lastResult = {
      won,
      trap: live.round.trap,
      red: plan.red && plan.rules.includes("redMeansNo"),
      crownless: plan.crown === false && plan.rules.includes("simonSays"),
      points: won ? pointsFor(plan) : 0,
      lifeLost,
      game: plan.game,
    };

    if (won) playWin(this.state.streak);
    else {
      if (!live.sprungHeard) playSfx("fail");
      if (lifeLost) setTimeout(() => playSfx("smash"), 160);
    }

    this.events.onRoundResult?.({
      plan,
      won,
      trap: isTrap(plan),
      noTap: wantsNoTap(live.game, plan),
      tapped: live.round.actions > 0,
      state: this.state,
    });

    if (isOver(this.state) && !practice) {
      const last = this.segments[this.segments.length - 1]!;
      this.segments.push({ kind: "end", start: segmentEnd(last), bpm: last.bpm, beats: 1, tier: last.tier, plan: null });
      return;
    }
    const next = this.planner.round(plan.index + 1);
    if (next.tier > plan.tier) playSfx("speedup");
    this.appendRound(next);
  }

  private finish() {
    if (this.over) return;
    this.over = true;
    this.cutAudio();
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (this.mode !== "demo") playSfx("gameover");
    this.events.onGameOver?.({ mode: this.mode, state: this.state, playedMs: this.playedMs });
  }

  // -------------------------------------------------------------------------------------------
  // Music and cues, scheduled a little ahead on the audio clock.
  // -------------------------------------------------------------------------------------------

  private outputs(audio: AudioEngine) {
    if (!this.musicOut) {
      this.musicOut = audio.ctx.createGain();
      // The music sits under the cues: under Silent, a cue is the only clue you get.
      this.musicOut.gain.value = 0.55;
      this.musicOut.connect(audio.buses.music);
    }
    if (!this.sfxOut) {
      this.sfxOut = audio.ctx.createGain();
      this.sfxOut.connect(audio.buses.sfx);
    }
    return { music: this.musicOut, sfx: this.sfxOut };
  }

  /** Silence everything already queued (pause, game over, leaving). */
  private cutAudio() {
    for (const node of [this.musicOut, this.sfxOut]) {
      if (!node) continue;
      try {
        node.gain.cancelScheduledValues(0);
        node.gain.value = 0;
        node.disconnect();
      } catch {
        // Already gone.
      }
    }
    this.musicOut = null;
    this.sfxOut = null;
  }

  private schedule = () => {
    if (!this.started || this.paused || this.over) return;
    const now = performance.now() / 1000;
    const audio = getAudio();
    if (!audio) {
      // Muted: keep the cursor moving, so unmuting doesn't play a backlog.
      this.scheduledUntil = now;
      return;
    }
    this.clock.sync(audio);
    const out = this.outputs(audio);
    const from = Math.max(this.scheduledUntil, now);
    const horizon = now + LOOKAHEAD;
    if (horizon <= from) return;

    for (let i = Math.max(0, this.cur - 1); i < this.segments.length; i++) {
      const seg = this.segments[i]!;
      if (seg.start >= horizon) break;
      if (segmentEnd(seg) <= from || seg.kind === "end") continue;
      const spb = 60 / seg.bpm;
      const part: MusicPart = seg.kind === "game" ? (seg.plan?.boss ? "boss" : "game") : seg.kind === "boss" ? "boss-intro" : seg.kind;
      const firstBeat = Math.max(0, Math.ceil((from - seg.start) / spb - 1e-6));
      for (let k = firstBeat; k < seg.beats; k++) {
        const at = seg.start + k * spb;
        if (at >= horizon) break;
        if (at < from) continue;
        const when = this.clock.toAudio(at);
        if (when === null) continue;
        playBeat(audio, out.music, when, spb, part, seg.tier, k, seg.beats);
        if (seg.kind === "countin") playCount(k === seg.beats - 1, when, out.sfx);
        // Every microgame starts with its sound signature (under Silent, it's the only clue).
        if (seg.kind === "game" && k === 0 && seg.live) playSfx(seg.live.game.cue, when, out.sfx);
      }
      if (seg.kind === "game" && seg.live?.scene.cues) {
        for (const cue of seg.live.scene.cues) {
          const at = seg.start + cue.beat * spb;
          if (at < from || at >= horizon || this.scheduledCues.has(cue)) continue;
          const when = this.clock.toAudio(at);
          if (when === null) continue;
          this.scheduledCues.add(cue);
          playSfx(cue.sound, when, out.sfx);
        }
      }
    }
    this.scheduledUntil = horizon;
  };

  // -------------------------------------------------------------------------------------------
  // Drawing
  // -------------------------------------------------------------------------------------------

  private measure() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (this.canvas.width !== width) this.canvas.width = width;
    if (this.canvas.height !== height) this.canvas.height = height;
    this.size = { width: rect.width, height: rect.height, dpr };
    const stage = this.stage.getBoundingClientRect();
    this.stageRect = { x: stage.left - rect.left, y: stage.top - rect.top, w: Math.max(1, stage.width), h: Math.max(1, stage.height) };
  }

  private frame = (time: number) => {
    this.raf = requestAnimationFrame(this.frame);
    this.pollGamepad();
    if (this.started && !this.paused && !this.over) {
      this.playedMs += Math.min(250, time - this.lastFrame);
    }
    this.lastFrame = time;
    this.clock.sync(getAudio());
    const t = this.paused ? this.pausedAt : this.gameNow();
    if (this.started && !this.paused && !this.over) this.advance(t);
    this.draw(t);
    this.publish(t);
  };

  private draw(t: number) {
    const g = this.g;
    const { width, height, dpr } = this.size;
    const { x, y, w, h } = this.stageRect;
    // The scene's square may reach a little under the beat dots (that's floor in every scene).
    const side = Math.min(w, h * 1.12);
    const scale = side / 1000;
    const ox = x + (w - side) / 2;
    const oy = side > h ? y : y + (h - side) / 2;

    const seg = this.segments[this.cur];
    const live = seg?.kind === "game" ? seg.live : seg?.kind === "countin" && seg.frozen ? seg.frozen.live : null;
    const beat = seg ? beatIn(seg, t) : 0;
    const mirror = Boolean(live?.plan.rules.includes("mirror"));
    let view: View = {
      left: -ox / scale,
      top: -oy / scale,
      right: (width - ox) / scale,
      bottom: (height - oy) / scale,
      font: this.font,
      reducedMotion: this.settings.reducedMotion,
      reduceFlashing: this.settings.reduceFlashing,
      showVerdict: !live?.round.trap,
    };

    g.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * ox, dpr * oy);
    if (mirror) {
      g.translate(1000, 0);
      g.scale(-1, 1);
      view = { ...view, left: 1000 - view.right, right: 1000 - view.left };
    }

    if (live && seg) {
      const b = seg.kind === "countin" && seg.frozen ? seg.frozen.beat : Math.max(0, Math.min(live.plan.beats, beatIn(live.segment!, t)));
      g.save();
      live.scene.draw(g, b, view);
      g.restore();
      // Lights Out: beats 3 and 6 go dark (a dim, not black, when flashing is reduced).
      if (live.plan.rules.includes("lightsOut")) {
        const dark = this.darkness(b);
        if (dark > 0) {
          g.fillStyle = `rgba(8, 8, 12, ${dark})`;
          g.fillRect(view.left, view.top, view.right - view.left, view.bottom - view.top);
        }
      }
    } else {
      drawLobby(g, view, beat);
    }

    // Visual beat: a ring around the screen that pulses on every beat.
    if (this.settings.visualBeat && seg && !this.paused) {
      const pulse = onBeat(beat, 5);
      if (pulse > 0) {
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        g.globalAlpha = pulse * 0.85;
        const inset = 6;
        line(g, inset, inset, width - inset, inset, 12, "#FFFFFF");
        line(g, inset, height - inset, width - inset, height - inset, 12, "#FFFFFF");
        line(g, inset, inset, inset, height - inset, 12, "#FFFFFF");
        line(g, width - inset, inset, width - inset, height - inset, 12, "#FFFFFF");
        g.globalAlpha = 1;
      }
    }
  }

  /** How dark Lights Out is at beat `b` (0–1). */
  private darkness(b: number) {
    const soft = this.settings.reduceFlashing;
    const fade = soft ? 0.2 : 0.06;
    const max = soft ? 0.6 : 0.94;
    let amount = 0;
    for (const [from, to] of DARK_BEATS) {
      const inside = Math.min(1, Math.max(0, (b - from) / fade), Math.max(0, (to - b) / fade));
      amount = Math.max(amount, inside);
    }
    return amount * max;
  }

  // -------------------------------------------------------------------------------------------
  // HUD
  // -------------------------------------------------------------------------------------------

  private publish(t: number, force = false) {
    const seg = this.segments[this.cur];
    if (!seg) return;
    const beat = Math.max(0, Math.floor(beatIn(seg, t)));
    const live = seg.kind === "game" ? seg.live : seg.kind === "countin" && seg.frozen ? seg.frozen.live : null;
    const plan = seg.plan;
    const upcoming = seg.kind === "break" ? (this.next?.plan ?? null) : plan;
    let instruction: Instruction | null = null;
    if (live) {
      const b = seg.kind === "game" ? beatIn(seg, t) : (seg.frozen?.beat ?? 0);
      const label = live.scene.label?.(b) ?? null;
      const silent = live.plan.rules.includes("silent");
      instruction = {
        text: label?.text ?? live.game.instruction,
        game: live.plan.game,
        red: live.plan.red && live.plan.rules.includes("redMeansNo"),
        crown: label?.crown !== undefined ? label.crown : live.plan.crown,
        silent,
        caption: live.game.caption,
        rule: label?.rule ?? null,
        boss: live.plan.boss,
      };
    }
    const dark = Boolean(live && seg.kind === "game" && live.plan.rules.includes("lightsOut") && this.darkness(beatIn(seg, t)) > 0.3);
    const next: HudState = {
      phase: seg.kind === "end" ? "over" : seg.kind,
      paused: this.paused,
      lives: this.state.lives,
      score: this.state.score,
      streak: this.state.streak,
      index: plan?.index ?? this.state.next,
      count: seg.kind === "countin" ? Math.max(0, seg.beats - 1 - beat) : null,
      beat: Math.min(beat, seg.beats - 1),
      beats: seg.beats,
      bpm: seg.bpm,
      tier: seg.tier,
      instruction,
      rules: upcoming && !upcoming.boss ? upcoming.rules : [],
      mirror: Boolean(live?.plan.rules.includes("mirror")),
      dark,
      result: seg.kind === "break" ? this.lastResult : null,
      speedUp: seg.kind === "break" && Boolean(this.next && plan && this.next.plan.tier > plan.tier),
      card: seg.kind === "card" && plan?.card ? { rule: plan.card, isNew: plan.newCard } : null,
      boss: seg.kind === "boss" && plan?.boss ? (plan.game as BossId) : null,
      presses: this.presses,
      half: Boolean(live?.round.halfPressed),
      inFlight: live?.round.inFlight ?? 0,
      decided: live?.decided ?? null,
      practice: this.mode === "practice" ? { ...this.practice } : null,
      mode: this.mode,
    };
    if (force || changed(this.hud.get(), next)) this.hud.set(next);
  }
}

function changed(a: HudState, b: HudState): boolean {
  for (const key of Object.keys(b) as Array<keyof HudState>) {
    const x = a[key];
    const y = b[key];
    if (x === y) continue;
    if (x && y && typeof x === "object" && typeof y === "object") {
      if (JSON.stringify(x) !== JSON.stringify(y)) return true;
      continue;
    }
    return true;
  }
  return false;
}
