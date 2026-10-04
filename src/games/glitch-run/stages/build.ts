// A story stage (Plan/07-glitch-run.md §5): a run through hand-picked chunks at the stage's tempo, its
// glitches on a timeline, and at the end The Debugger's chase (its scan lines on the beat), then the
// exit. The last stage has a finale too. Built in one go; the reference run proves it can be cleared
// (with Clip only where a full scan line needs it) and its moves are the cues.
import { BEAT_TILES, ROWS } from "../core/constants";
import { cuesOf, search, type Cue, type Step } from "../core/reference";
import { createRun, type RunConfig, type Scan } from "../core/run";
import { parseChunk, Track, type Chunk, type ChunkSource } from "../core/track";
import type { Planned } from "../glitches/director";
import type { GlitchKind } from "../glitches/kinds";
import { chunkById } from "../gen/generator";

export interface StageSource {
  /** "01" to "20". */
  id: string;
  name: string;
  /** What it teaches (the stage card). */
  teaches: string;
  /** Ticks per beat (30 is 120 bpm). */
  ticks: number;
  /** The chunks, in order (ids from the library, or a stage's own). */
  chunks: readonly string[];
  /** Glitches on the timeline: on from `beat` (counted from the stage's first beat) for `beats`. */
  glitches?: ReadonlyArray<{ beat: number; kind: GlitchKind; beats: number }>;
  /** The Debugger's chase after the chunks: scan lines on beats counted from the chase's start. */
  chase?: readonly Scan[];
  /** How long the chase runs (beats). */
  chaseBeats?: number;
  corruption?: number;
  drift?: number;
  /** Glitch charges to start with (the last stage hands you all three). */
  charges?: number;
  /**
   * The last stage's finale, after the chase (chunk ids): The Debugger deletes the ground behind
   * you, then reformats the screen into a white void you cross by sound (and the beat bar).
   */
  finale?: { deleting: readonly string[]; reformat: readonly string[] };
}

export interface Stage {
  source: StageSource;
  config: RunConfig;
  plan: Planned[];
  cues: Cue[];
  /** The reference run's way through, move by move (the cues come from it). */
  moves: Step[];
  /** The beat The Debugger shows up on (null: no chase). */
  chaseFrom: number | null;
  /** Beats from the start to the exit. */
  beats: number;
  /** The finale's beats (null: none): the ground goes from `deleteFrom`; the white void covers `voidFrom` to `voidTo`. */
  finale: { deleteFrom: number; voidFrom: number; voidTo: number } | null;
}

/** A stage's own chunks (not in the endless library). */
const STAGE_CHUNKS = new Map<string, Chunk>();
export function addStageChunks(sources: readonly ChunkSource[]) {
  for (const s of sources) STAGE_CHUNKS.set(s.id, parseChunk(s));
}

function flat(beats: number): Chunk {
  const cols = beats * BEAT_TILES;
  const cells = new Uint8Array(cols * ROWS);
  for (let c = 0; c < cols; c++) for (let r = 12; r < ROWS; r++) cells[c * ROWS + r] = 1;
  return { id: "flat", difficulty: 1, cols, cells };
}

const LEAD_IN = 3;
const EXIT = 4;

export function buildStage(src: StageSource): Stage {
  const track = new Track();
  const add = (ids: readonly string[]) => {
    for (const id of ids) {
      const chunk = STAGE_CHUNKS.get(id) ?? chunkById(id);
      if (!chunk) throw new Error(`stage ${src.id}: no chunk "${id}"`);
      track.append({ ...chunk, cells: chunk.cells.slice() });
    }
  };
  const beat = () => track.cols / BEAT_TILES;
  track.append(flat(LEAD_IN));
  add(src.chunks);
  const chaseFrom = src.chase ? beat() : null;
  if (src.chase) track.append(flat(src.chaseBeats ?? 12));
  let finale: Stage["finale"] = null;
  if (src.finale) {
    const deleteFrom = beat();
    add(src.finale.deleting);
    const voidFrom = beat();
    add(src.finale.reformat);
    finale = { deleteFrom, voidFrom, voidTo: beat() };
  }
  const exitCol = track.cols + BEAT_TILES;
  track.append(flat(EXIT));
  const scans = (src.chase ?? []).map((s) => ({ ...s, beat: s.beat + chaseFrom! }));
  const config: RunConfig = {
    track,
    tempo: [{ beat: 0, ticks: src.ticks }],
    finishCol: exitCol,
    scans,
    corruption: src.corruption ?? 0,
    drift: src.drift ?? 0,
    charges: src.charges ?? 0,
  };
  const plan: Planned[] = (src.glitches ?? []).map((p) => ({ ...p, beat: p.beat + LEAD_IN }));
  const found = search(createRun({ ...config, track: track.clone() }), exitCol, { allowClip: scans.some((s) => s.kind === "full") });
  if (!found) throw new Error(`stage ${src.id} (${src.name}) can't be cleared`);
  return { source: src, config, plan, cues: cuesOf(found.moves), moves: found.moves, chaseFrom, beats: exitCol / BEAT_TILES, finale };
}
