// The track (Plan/07-glitch-run.md §5, §12): columns of 17 tiles, built from hand-made chunks. A
// chunk is a whole number of beats long (six columns a beat) and drawn as text:
//
//   .  nothing       #  data (solid ground and walls)     =  a firewall bar (solid; slide under it)
//   ^  corrupted spikes (patched on touch)               h  a hidden platform (solid, but you only
//   o  a bit (10 make a glitch charge)                       see it when the colours invert)
//   +  a patch (lowers corruption)
//
// Endless mode keeps adding chunks ahead of you; story stages are built in one go.
import { GROUND_ROW, ROWS, TILE } from "./constants";
import type { Solids } from "@/engine/platformer/physics";

export const AIR = 0;
export const SOLID = 1;
export const BAR = 2;
export const HIDDEN = 3;
export const SPIKES = 4;
export const BIT = 5;
export const PATCH = 6;

const CODES: Record<string, number> = { ".": AIR, "#": SOLID, "=": BAR, h: HIDDEN, "^": SPIKES, o: BIT, "+": PATCH };

/** Solid to the runner (Clip aside). */
export const isSolid = (cell: number) => cell === SOLID || cell === BAR || cell === HIDDEN;

export interface ChunkSource {
  id: string;
  /** 1 (gentle) to 5 (hard): endless mode picks harder chunks as it goes. */
  difficulty: 1 | 2 | 3 | 4 | 5;
  /** 17 rows, top to bottom, all the same length: a whole number of beats (six columns each). */
  rows: readonly string[];
}

export interface Chunk {
  id: string;
  difficulty: number;
  cols: number;
  /** Column-major: cells[col * ROWS + row]. */
  cells: Uint8Array;
}

export function parseChunk(src: ChunkSource): Chunk {
  const { rows } = src;
  if (rows.length !== ROWS) throw new Error(`${src.id}: ${rows.length} rows (a chunk has ${ROWS})`);
  const cols = rows[0]!.length;
  if (rows.some((r) => r.length !== cols)) throw new Error(`${src.id}: rows of different lengths`);
  if (cols % 6 !== 0) throw new Error(`${src.id}: ${cols} columns (a chunk is a whole number of beats: six columns each)`);
  const cells = new Uint8Array(cols * ROWS);
  rows.forEach((row, r) => {
    for (let c = 0; c < cols; c++) {
      const code = CODES[row[c]!];
      if (code === undefined) throw new Error(`${src.id}: unknown "${row[c]}" at ${c},${r}`);
      cells[c * ROWS + r] = code;
    }
  });
  return { id: src.id, difficulty: src.difficulty, cols, cells };
}

/** A run's track: it grows as chunks are added (endless) and is changed as pickups are collected. */
export class Track implements Solids {
  cols = 0;
  private data = new Uint8Array(ROWS * 256);
  /** Where each chunk starts (for drawing and for déjà vu). */
  readonly starts: Array<{ col: number; id: string }> = [];

  append(chunk: Chunk) {
    const need = (this.cols + chunk.cols) * ROWS;
    if (need > this.data.length) {
      const bigger = new Uint8Array(Math.max(need, this.data.length * 2));
      bigger.set(this.data);
      this.data = bigger;
    }
    this.data.set(chunk.cells, this.cols * ROWS);
    this.starts.push({ col: this.cols, id: chunk.id });
    this.cols += chunk.cols;
  }

  /** Take the last chunk off again (it didn't fit). */
  pop() {
    const last = this.starts.pop();
    if (!last) return;
    this.data.fill(0, last.col * ROWS, this.cols * ROWS);
    this.cols = last.col;
  }

  /** A cell. Before the start there's flat ground; past the end and below the screen, nothing. */
  cell(col: number, row: number): number {
    if (row < 0 || row >= ROWS) return AIR;
    if (col < 0) return row >= GROUND_ROW ? SOLID : AIR;
    if (col >= this.cols) return AIR;
    return this.data[col * ROWS + row]!;
  }

  set(col: number, row: number, value: number) {
    if (col < 0 || col >= this.cols || row < 0 || row >= ROWS) return;
    this.data[col * ROWS + row] = value;
  }

  solidAt(x: number, y: number, w: number, h: number): boolean {
    const c0 = Math.floor(x / TILE);
    const c1 = Math.floor((x + w - 1) / TILE);
    const r0 = Math.floor(y / TILE);
    const r1 = Math.floor((y + h - 1) / TILE);
    for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) if (isSolid(this.cell(c, r))) return true;
    return false;
  }

  /** Any cell of this kind under a rectangle? */
  anyAt(x: number, y: number, w: number, h: number, kind: number): boolean {
    if (w <= 0 || h <= 0) return false;
    const c0 = Math.floor(x / TILE);
    const c1 = Math.floor((x + w - 1) / TILE);
    const r0 = Math.floor(y / TILE);
    const r1 = Math.floor((y + h - 1) / TILE);
    for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) if (this.cell(c, r) === kind) return true;
    return false;
  }

  clone(): Track {
    const t = new Track();
    t.cols = this.cols;
    t.data = this.data.slice();
    t.starts.push(...this.starts);
    return t;
  }
}
