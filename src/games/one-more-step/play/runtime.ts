// A level in the browser (Plan/01-one-more-step.md §12). The rules are instant; this plays them back: each
// action is applied at once and its result animated for a short step (up to two more actions wait their
// turn, so a quick player isn't held up). Undo is a stack of whole states (they're tiny). It plays the
// footstep melody and the sounds, keeps the narrator talking, and counts the stats. Runs outside React.
import { getAudio } from "@/engine/audio/engine";
import { Store } from "@/games/shared/store";
import { Melody } from "../audio/melody";
import { loadSfx, playSfx } from "../audio/sfx";
import { compile, initialState } from "../engine/course";
import { isBroken, step, waveIn } from "../engine/rules";
import { Cell, DIRS, DELTA, samePos, type Action, type Cause, type Course, type GameEvent, type LevelDef, type State, type Status } from "../engine/types";
import { stepsOf } from "../levels";
import type { Clear } from "../progress";
import { Renderer, STEP_MS } from "../render/draw";
import { Narrator, type Said } from "./narrator";

export interface Hud {
  levelId: string;
  status: Status;
  steps: number;
  par: number;
  optimal: number;
  /** The finale's "6-2, 6-3…". */
  sub: number;
  said: Said | null;
  canUndo: boolean;
  noUndo: boolean;
  /** "Steps left" (it's really the spike wave). */
  wave: number;
  cause: Cause | null;
}

export const initialHud = (levelId: string): Hud => ({ levelId, status: "play", steps: 0, par: 0, optimal: 0, sub: 1, said: null, canUndo: false, noUndo: false, wave: 0, cause: null });

/** Lifetime stats to add, as they happen. */
export type StatsAdd = { steps?: number; undos?: number; deaths?: number; echoDeaths?: number; resets?: number };

export interface RuntimeEvents {
  onWin(steps: number, clear: Clear): void;
  onStats(add: StatsAdd): void;
}

export interface RuntimeOptions {
  reduceMotion: () => boolean;
  coords: () => boolean;
}

export class Runtime {
  readonly course: Course;
  state: State;
  private history: State[] = [];
  private anim: { from: State; to: State; events: readonly GameEvent[]; start: number };
  private queue: Action[] = [];
  private raf = 0;
  private destroyed = false;
  private readonly melody: Melody;
  private readonly narrator: Narrator;
  private said: Said | null = null;
  private sub = 1;
  private reported = false;
  readonly renderer: Renderer;
  private readonly born = performance.now();

  constructor(
    canvas: HTMLCanvasElement,
    readonly level: LevelDef,
    private readonly hud: Store<Hud>,
    private readonly events: RuntimeEvents,
    private readonly options: RuntimeOptions,
  ) {
    this.course = compile(level);
    this.state = initialState(this.course);
    this.anim = { from: this.state, to: this.state, events: [], start: 0 };
    this.melody = new Melody(level.id, level.world);
    this.narrator = new Narrator(level);
    this.renderer = new Renderer(canvas);
    this.said = this.narrator.start();
  }

  start() {
    const frame = (now: number) => {
      if (this.destroyed) return;
      this.raf = requestAnimationFrame(frame);
      this.frame(now);
    };
    this.raf = requestAnimationFrame(frame);
    this.publish();
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
  }

  resize(cssW: number, cssH: number, dpr: number) {
    this.renderer.resize(cssW, cssH, dpr);
  }

  get busy() {
    return performance.now() - this.anim.start < STEP_MS;
  }

  /** A step or a wait (queued, two at most, while the last one's still moving). */
  act(action: Action) {
    getAudio();
    void loadSfx();
    if (this.state.status !== "play") return;
    if (this.busy || this.queue.length) {
      if (this.queue.length < 2) this.queue.push(action);
      return;
    }
    this.apply(action);
  }

  undo() {
    if (this.level.noUndo || !this.history.length) return;
    this.queue = [];
    const from = this.state;
    this.state = this.history.pop()!;
    this.melody.undo(Math.max(1, from.tick));
    this.anim = { from, to: this.state, events: [], start: performance.now() };
    this.said = this.narrator.undo();
    this.events.onStats({ undos: 1 });
    this.publish();
  }

  restart() {
    this.queue = [];
    this.history = [];
    this.state = initialState(this.course);
    this.anim = { from: this.state, to: this.state, events: [], start: 0 };
    this.reported = false;
    this.said = this.narrator.restarted();
    this.publish();
  }

  /** Where the grid is (css px), for taps on your blob. */
  get layout() {
    return this.renderer.layout;
  }

  // -----------------------------------------------------------------------------------------------

  private apply(action: Action) {
    const prev = this.state;
    const { state, events } = step(this.course, prev, action);
    if (!this.level.noUndo) this.history.push(prev);
    this.state = state;
    this.anim = { from: prev, to: state, events, start: performance.now() };
    this.events.onStats({ steps: 1 });
    this.sounds(prev, state, events, action);
    const said = this.narrator.after(prev, state, events);
    if (said) this.said = said;
    if (state.status === "dead") this.events.onStats({ deaths: 1, echoDeaths: state.cause === "echo" ? 1 : 0 });
    this.publish();
  }

  private sounds(prev: State, next: State, events: readonly GameEvent[], action: Action) {
    const bump = events.some((e) => e.type === "bump");
    this.melody.step(next.tick, action.type === "wait" ? "wait" : bump ? "bump" : "step");
    for (const e of events) {
      switch (e.type) {
        case "door":
          playSfx("squeak");
          break;
        case "cornered":
          playSfx("sweat");
          break;
        case "crumble":
          playSfx("crumble");
          break;
        case "reveal":
          playSfx("reveal");
          break;
        case "push":
          playSfx("push");
          break;
        case "plate":
          playSfx("plate");
          break;
        case "gates":
          playSfx("gate");
          break;
        case "sentinel":
          playSfx("thud", { volume: 0.6 });
          break;
        case "sentinelFall":
          playSfx("fall");
          break;
        case "charge":
          playSfx("squeak", { rate: 0.6 });
          break;
        case "die":
          this.melody.sour();
          if (e.cause === "door") playSfx("slam");
          break;
        case "fall":
          playSfx("fall");
          break;
        case "win":
          this.melody.home();
          break;
        case "reset":
          playSfx("reset");
          break;
        default:
          break;
      }
    }
    // Spikes moving under you.
    if (this.course.cells.some((c) => c === Cell.Spikes || c === Cell.Wave) && next.tick !== prev.tick) playSfx("spikes", { volume: 0.4 });
  }

  private frame(now: number) {
    const t = Math.min(1, (now - this.anim.start) / STEP_MS);
    this.renderer.draw({
      course: this.course,
      from: this.anim.from,
      to: this.anim.to,
      events: this.anim.events,
      t,
      time: (now - this.born) / 1000,
      reduceMotion: this.options.reduceMotion(),
      coords: this.options.coords(),
    });
    if (t < 1) return;
    const s = this.state;
    if (s.status === "won" && !this.reported) {
      this.reported = true;
      this.events.onWin(s.tick, this.clearOf());
      return;
    }
    if (s.status === "reset") {
      // The finale: "the next level" (it's the same one).
      this.sub++;
      this.events.onStats({ resets: this.sub - 1 });
      this.queue = [];
      this.history = [];
      this.state = initialState(this.course);
      this.anim = { from: this.state, to: this.state, events: [], start: now };
      this.said = this.narrator.reset(this.sub);
      this.publish();
      return;
    }
    const next = this.queue.shift();
    if (next) this.apply(next);
  }

  /** What the catch was like (for the trophies). */
  private clearOf(): Clear {
    const s = this.state;
    const c = this.course;
    const quick = c.behavior === "shy" && s.ran >= 0 && s.tick - s.ran <= 3;
    // Architect: every way out of where Doory was caught is a hole you made (or where you came from).
    const prev = this.history[this.history.length - 1];
    let architect = false;
    if (prev && c.behavior === "shy" && prev.doors[0]) {
      const door = prev.doors[0];
      let holes = 0;
      architect = DIRS.every((d) => {
        const p = { x: door.x + DELTA[d].x, y: door.y + DELTA[d].y };
        if (samePos(p, prev.player)) return true;
        if (p.x < 0 || p.y < 0 || p.x >= c.w || p.y >= c.h) return false;
        const i = p.y * c.w + p.x;
        const made = c.cells[i] === Cell.Crumble && isBroken(c, prev, i);
        if (made) holes++;
        return made;
      });
      architect = architect && holes >= 2;
    }
    return { steps: s.tick, quick, architect };
  }

  private publish() {
    const { optimal, par } = stepsOf(this.level.id);
    this.hud.set({
      levelId: this.level.id,
      status: this.state.status,
      steps: this.state.tick,
      par,
      optimal,
      sub: this.sub,
      said: this.said,
      canUndo: !this.level.noUndo && this.history.length > 0,
      noUndo: !!this.level.noUndo,
      wave: this.course.wave ? waveIn(this.course, this.state) : 0,
      cause: this.state.cause,
    });
  }

  // -- QA ------------------------------------------------------------------------------------------

  /** QA: play a solution (letters) instantly. */
  devPlay(moves: string) {
    const map: Record<string, Action> = { U: { type: "move", dir: "up" }, R: { type: "move", dir: "right" }, D: { type: "move", dir: "down" }, L: { type: "move", dir: "left" }, ".": { type: "wait" } };
    for (const m of moves) {
      if (this.state.status !== "play") break;
      this.apply(map[m]!);
      this.anim.start = 0;
    }
  }
}
