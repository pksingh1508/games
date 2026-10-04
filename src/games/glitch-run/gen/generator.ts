// Endless mode's track (Plan/07-glitch-run.md §5, §12): hand-made chunks joined by a seeded generator.
// The tempo (and so the speed) and the difficulty rise as you go; now and then a chunk comes round
// again with one change (déjà vu), and chunks with hidden platforms get an Invert to show them.
// The same seed always makes the same track: that's how the daily run is everyone's run.
import { createRng, hashString, type Rng } from "@/engine/rng";
import { BEAT_TILES } from "../core/constants";
import { HIDDEN, parseChunk, type Chunk } from "../core/track";
import { CHUNKS, VARIANTS } from "./chunks";

const LIBRARY = CHUNKS.map(parseChunk);
const BY_ID = new Map(LIBRARY.map((c) => [c.id, c]));
const VARIANT_OF = new Map(Object.entries(VARIANTS).map(([base, src]) => [base, parseChunk(src)]));
const WARM_UP = BY_ID.get("flat")!;

/** The tempo schedule: 120 bpm, a little faster every 24 beats, up to about 164 bpm. */
export const ENDLESS_TEMPO: ReadonlyArray<{ beat: number; ticks: number }> = Array.from({ length: 9 }, (_, i) => ({ beat: i * 24, ticks: 30 - i }));

/** How hard the chunks get: 1 to start, 5 after about two minutes. */
export const difficultyAt = (beat: number) => Math.min(5, 1 + Math.floor(beat / 28));

export interface Mark {
  kind: "dejaVu" | "hidden";
  /** The beat the chunk starts on, and how many beats it lasts. */
  beat: number;
  beats: number;
}

export const hasHidden = (chunk: Chunk) => chunk.cells.some((c) => c === HIDDEN);

export class Generator {
  private rng: Rng;
  private recent: string[] = [];
  /** Things the glitch director should know about (a déjà vu, hidden platforms). */
  readonly marks: Mark[] = [];

  constructor(seed: number) {
    this.rng = createRng(seed);
  }

  /** The next chunk to try at a beat (not one of `skip`: they didn't fit). */
  choose(beat: number, skip: ReadonlySet<string> = new Set()): Chunk {
    // A few quiet beats to start.
    if (beat < 4) return WARM_UP;
    // Déjà vu: the chunk you just ran, again, with one change (not too early, and not too often).
    const last = this.recent[0];
    const variant = last ? VARIANT_OF.get(last) : undefined;
    if (beat > 40 && variant && !skip.has(variant.id) && this.rng() < 0.3) return variant;
    const target = difficultyAt(beat);
    const options = LIBRARY.filter(
      (c) => c.difficulty <= target && c.difficulty >= Math.max(1, target - 2) && !this.recent.includes(c.id) && c.id !== "flat" && !skip.has(c.id),
    );
    if (!options.length) return WARM_UP;
    // Weighted toward the target difficulty.
    const weights = options.map((c) => 1 + (c.difficulty === target ? 2 : 0));
    let roll = this.rng() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < options.length; i++) {
      roll -= weights[i]!;
      if (roll < 0) return options[i]!;
    }
    return options[options.length - 1]!;
  }

  /** The chunk went in at this beat. */
  accept(chunk: Chunk, beat: number) {
    if (chunk.id.endsWith("*")) this.marks.push({ kind: "dejaVu", beat, beats: chunk.cols / BEAT_TILES });
    else if (hasHidden(chunk)) this.marks.push({ kind: "hidden", beat, beats: chunk.cols / BEAT_TILES });
    this.recent = [chunk.id.replace("*", ""), ...this.recent].slice(0, 3);
  }
}

/** The daily run's seed: the same for everyone on a UTC day. */
export interface Daily {
  key: string;
  number: number;
  seed: number;
}

/** Daily Corruption #1 was the day the cabinet opened. */
const FIRST_DAY = Date.UTC(2026, 9, 1);

export function dailyFor(date: Date): Daily {
  const key = date.toISOString().slice(0, 10);
  const [y, m, d] = key.split("-").map(Number) as [number, number, number];
  return { key, number: Math.round((Date.UTC(y, m - 1, d) - FIRST_DAY) / 86_400_000) + 1, seed: hashString(`glitch-run:daily:${key}`) };
}

export const chunkById = (id: string) => BY_ID.get(id) ?? (id.endsWith("*") ? VARIANT_OF.get(id.slice(0, -1)) : undefined);
export const LIBRARY_IDS = LIBRARY.map((c) => c.id);
