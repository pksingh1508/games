import { describe, expect, it } from "vitest";
import { BEAT_TILES, GROUND_ROW, ROWS } from "../core/constants";
import { search } from "../core/reference";
import { createRun } from "../core/run";
import { HIDDEN, parseChunk, SOLID, Track, type Chunk, type ChunkSource } from "../core/track";
import { CHUNKS, VARIANTS } from "./chunks";
import { ENDLESS_TEMPO, hasHidden } from "./generator";

const FLAT: ChunkSource = { id: "flat", difficulty: 1, rows: Array.from({ length: ROWS }, (_, r) => (r >= GROUND_ROW ? "#" : ".").repeat(BEAT_TILES * 2)) };
const TEMPOS = [...new Set(ENDLESS_TEMPO.map((t) => t.ticks))];

/** Can the chunk be got through at this tempo, from flat ground into flat ground, without glitch power? */
function passable(chunk: Chunk, ticks: number): boolean {
  const track = new Track();
  track.append(parseChunk(FLAT));
  track.append({ ...chunk, cells: chunk.cells.slice() });
  track.append(parseChunk(FLAT));
  const run = createRun({ track, tempo: [{ beat: 0, ticks }], finishCol: null });
  return search(run, BEAT_TILES * 2 + chunk.cols + BEAT_TILES) !== null;
}

const withoutHidden = (chunk: Chunk): Chunk => ({ ...chunk, cells: chunk.cells.map((c) => (c === HIDDEN ? 0 : c)) });

const ALL = [...CHUNKS, ...Object.values(VARIANTS)];

describe("the chunk library", () => {
  it("has short stretches of whole beats, with the ground where a run comes in and goes out", () => {
    for (const src of ALL) {
      const chunk = parseChunk(src);
      expect(chunk.cols % BEAT_TILES, src.id).toBe(0);
      expect(chunk.cols / BEAT_TILES, src.id).toBeGreaterThanOrEqual(1);
      expect(chunk.cols / BEAT_TILES, src.id).toBeLessThanOrEqual(6);
      // Chunks join on solid ground: the first and last columns are floor at the ground row.
      expect(chunk.cells[GROUND_ROW]!, `${src.id} starts on ground`).toBe(SOLID);
      expect(chunk.cells[(chunk.cols - 1) * ROWS + GROUND_ROW]!, `${src.id} ends on ground`).toBe(SOLID);
    }
  });

  it("has unique names, every difficulty, and one déjà vu variant per base chunk", () => {
    const ids = CHUNKS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (let d = 1; d <= 5; d++) expect(CHUNKS.some((c) => c.difficulty === d), `difficulty ${d}`).toBe(true);
    for (const [base, variant] of Object.entries(VARIANTS)) {
      const original = CHUNKS.find((c) => c.id === base);
      expect(original, base).toBeDefined();
      expect(variant.id).toBe(`${base}*`);
      const a = parseChunk(original!);
      const b = parseChunk(variant);
      // The same length, but not the same chunk ("with one change").
      expect(b.cols).toBe(a.cols);
      expect(b.cells.some((c, i) => c !== a.cells[i])).toBe(true);
    }
  });

  // Plan §10.5: every chunk is checked to be passable with normal moves (no glitch power), at every
  // endless speed, and hidden platforms are only ever a shortcut (the way through doesn't need them).
  it.each(ALL.map((c) => [c.id, c] as const))("%s can be passed at every speed, without Clip", (_, src) => {
    const chunk = parseChunk(src);
    for (const ticks of TEMPOS) {
      expect(passable(chunk, ticks), `${src.id} at ${ticks} ticks a beat`).toBe(true);
      if (hasHidden(chunk)) expect(passable(withoutHidden(chunk), ticks), `${src.id} without its hidden platforms at ${ticks}`).toBe(true);
    }
  });
});
