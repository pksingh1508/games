// The glitch director (Plan/07-glitch-run.md §3, §10, §12): decides when each glitch happens. In a
// story stage the stage says (a timeline of beats); in endless mode a seeded die is rolled on every
// beat, more often the higher the corruption, with Kernel Panic letting more through at once. It
// only ever reads the run: it hands its decisions to the screen and the input layer, never back.
import { createRng, type Rng } from "@/engine/rng";
import { TELEGRAPH_MIN } from "../core/constants";
import type { Mark } from "../gen/generator";
import { endAt, GLITCH_KINDS, phaseOf, type GlitchEvent, type GlitchKind } from "./kinds";

/** What the director may look at (read only). */
export interface RunView {
  tick: number;
  beat: number;
  beatTick: number;
  corruption: number;
  panic: number;
  /** The tick a beat starts on. */
  beatStart: (beat: number) => number;
  /** Ticks per beat at a beat. */
  ticksAt: (beat: number) => number;
}

/** A story stage's glitch: it's on from `beat` for `beats` beats (its warning comes before). */
export interface Planned {
  beat: number;
  kind: GlitchKind;
  beats: number;
}

/** At most two at once (Kernel Panic lets four through). */
export const MAX_AT_ONCE = 2;
export const MAX_IN_PANIC = 4;
/** Warnings last two beats (never under 0.6 s, at any tempo used). */
export const WARNING_BEATS = 2;

export interface DirectorOptions {
  /** Story: the stage's timeline. Endless: a seed. */
  plan: readonly Planned[] | { seed: number; kinds?: readonly GlitchKind[] };
  /** Endless: the generator's notes (déjà vu, hidden platforms). */
  marks?: readonly Mark[];
  /** Gentle glitches (comfort): everything at 30%. */
  gentle?: boolean;
}

export class Director {
  readonly events: GlitchEvent[] = [];
  private nextId = 1;
  private rng: Rng | null = null;
  private kinds: readonly GlitchKind[] = GLITCH_KINDS;
  private lastBeat = -1;
  private planned: readonly Planned[] = [];
  private nextPlanned = 0;
  private usedMarks = 0;

  constructor(private readonly options: DirectorOptions) {
    if (Array.isArray(options.plan)) this.planned = [...options.plan].sort((a, b) => a.beat - b.beat);
    else {
      const p = options.plan as { seed: number; kinds?: readonly GlitchKind[] };
      this.rng = createRng(p.seed);
      if (p.kinds) this.kinds = p.kinds;
    }
  }

  private add(kind: GlitchKind, onTick: number, duration: number, intensity: number, view: RunView): GlitchEvent {
    const telegraph = Math.max(TELEGRAPH_MIN, WARNING_BEATS * view.ticksAt(view.beat));
    const e: GlitchEvent = {
      id: this.nextId++,
      kind,
      start: onTick - telegraph,
      telegraph,
      duration,
      intensity: Math.max(0.2, Math.min(1, intensity)) * (this.options.gentle ? 0.3 : 1),
      seed: (this.nextId * 2654435761) >>> 0,
    };
    this.events.push(e);
    return e;
  }

  /** How many glitches are warning or on at a tick. */
  busy(tick: number): number {
    return this.events.filter((e) => phaseOf(e, tick) !== null).length;
  }

  /**
   * Once a tick, after the run's step. Decisions are made on beats: a story glitch goes on the
   * timeline as its warning is due (two beats before it's on); an endless one is decided now for two
   * beats from now, so its warning starts straight away.
   */
  update(view: RunView) {
    if (view.beat === this.lastBeat) return;
    this.lastBeat = view.beat;
    const intensityOf = (c: number) => 0.45 + c / 180;
    const span = (beat: number, beats: number) => {
      let ticks = 0;
      for (let b = beat; b < beat + beats; b++) ticks += view.ticksAt(b);
      return ticks;
    };

    if (!this.rng) {
      while (this.nextPlanned < this.planned.length && this.planned[this.nextPlanned]!.beat <= view.beat + WARNING_BEATS) {
        const p = this.planned[this.nextPlanned++]!;
        // Too late for a full warning (the very start of a stage): it waits until there's time.
        const onBeat = Math.max(p.beat, view.beat + WARNING_BEATS);
        this.add(p.kind, view.beatStart(onBeat), span(onBeat, p.beats), intensityOf(view.corruption), view);
      }
      return;
    }

    // Endless. A glitch's window runs from its warning to its end; at most `cap` windows may overlap.
    const cap = view.panic > 0 ? MAX_IN_PANIC : MAX_AT_ONCE;
    const marks = this.options.marks ?? [];
    const overlapping = (from: number, to: number) => this.events.filter((e) => e.start < to && endAt(e) > from).length;
    const warnFor = (onBeat: number) => view.beatStart(onBeat) - Math.max(TELEGRAPH_MIN, WARNING_BEATS * view.ticksAt(view.beat));
    // The generator's notes first (a déjà vu, hidden platforms to show), if there's room.
    while (this.usedMarks < marks.length && marks[this.usedMarks]!.beat <= view.beat + WARNING_BEATS) {
      const m = marks[this.usedMarks++]!;
      if (m.beat < view.beat + WARNING_BEATS) continue;
      const on = view.beatStart(m.beat);
      const duration = span(m.beat, m.beats);
      if (overlapping(warnFor(m.beat), on + duration) >= cap) continue;
      this.add(m.kind === "dejaVu" ? "dejaVu" : "invert", on, duration, intensityOf(view.corruption), view);
    }
    if (view.beat < 8) return;
    const chance = view.panic > 0 ? 0.5 : 0.05 + view.corruption * 0.004;
    if (this.rng() >= chance) return;
    const onBeat = view.beat + WARNING_BEATS;
    // Three to six seconds, in whole beats.
    const seconds = 3 + this.rng() * 3;
    const beats = Math.max(1, Math.round((seconds * 60) / view.ticksAt(onBeat)));
    const from = warnFor(onBeat);
    const to = view.beatStart(onBeat) + span(onBeat, beats);
    // Count the notes still to come in that window too: they've got the track behind them.
    const upcoming = marks.slice(this.usedMarks).filter((m) => warnFor(m.beat) < to && view.beatStart(m.beat) + span(m.beat, m.beats) > from).length;
    if (overlapping(from, to) + upcoming >= cap) return;
    const busy = new Set(this.events.filter((e) => e.start < to && endAt(e) > from).map((e) => e.kind));
    // Déjà vu and Invert come from the track (they need a repeat, or hidden platforms to show).
    const options = this.kinds.filter((k) => !busy.has(k) && k !== "dejaVu");
    if (!options.length) return;
    const kind = options[Math.floor(this.rng() * options.length)]!;
    this.add(kind, view.beatStart(onBeat), span(onBeat, beats), intensityOf(view.corruption) + (view.panic > 0 ? 0.3 : 0), view);
  }

  /** The glitches warning or on at a tick, with their phase. */
  at(tick: number): Array<{ event: GlitchEvent; phase: "warning" | "on" }> {
    const out: Array<{ event: GlitchEvent; phase: "warning" | "on" }> = [];
    for (const e of this.events) {
      const phase = phaseOf(e, tick);
      if (phase) out.push({ event: e, phase });
    }
    return out;
  }
}
