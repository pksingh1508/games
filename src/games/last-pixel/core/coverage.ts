// The coverage grid (Plan/10-last-pixel.md §12): how done each cell is, 0 to FULL. Tools add to the cells
// of their own job; a running count goes up the moment a cell fills (and down if it's un-done), so the
// progress never needs a scan of the grid, let alone of the canvas's pixels.
//
// The last cell is special: no tool can finish it. When a stroke would cover the last two (or ten) cells
// at once, the last of them refuses. That one is Pix.
import { FULL } from "./constants";
import type { Task } from "./level";

export class Coverage {
  readonly size: number;
  /** How done each cell is (0–FULL). Cells that aren't part of the job start (and stay) FULL. */
  readonly amount: Uint8Array;
  /** A second look per cell (mown stripes): 0 or 1. */
  readonly variant: Uint8Array;
  /** Cells that are part of the job. */
  readonly total: number;
  covered = 0;
  /** The last cell can't be covered by a tool (it's Pix). Off once Pix is awake. */
  guard = true;
  /** The cell that refused to be covered, once one has. */
  survivor = -1;
  // The changed box since the renderer last looked.
  private dx0 = Infinity;
  private dy0 = Infinity;
  private dx1 = -1;
  private dy1 = -1;

  constructor(
    readonly w: number,
    readonly h: number,
    /** Per cell: 0 not part of the job, k the k-th task. */
    readonly region: Uint8Array,
    readonly tasks: readonly Task[],
  ) {
    this.size = w * h;
    this.amount = new Uint8Array(this.size);
    this.variant = new Uint8Array(this.size);
    let total = 0;
    for (let i = 0; i < this.size; i++) {
      if (region[i]) total++;
      else this.amount[i] = FULL;
    }
    this.total = total;
    this.touchAll();
  }

  taskAt(i: number): Task | null {
    const r = this.region[i]!;
    return r ? this.tasks[r - 1]! : null;
  }

  /** How much is done, 0–1. */
  get progress(): number {
    return this.total ? this.covered / this.total : 1;
  }

  /**
   * Add `amt` to cell i for `task` (cells of other jobs, and cells that aren't the job, don't change).
   * Returns how much was added.
   */
  add(i: number, amt: number, task: Task, variant = -1): number {
    const r = this.region[i]!;
    if (!r || this.tasks[r - 1] !== task) return 0;
    const before = this.amount[i]!;
    if (variant >= 0 && this.variant[i] !== variant && (before > 0 || amt > 0)) {
      this.variant[i] = variant;
      this.touch(i);
    }
    if (before >= FULL || amt <= 0) return 0;
    let next = Math.min(FULL, before + Math.round(amt));
    if (next === FULL) {
      if (this.guard && this.covered === this.total - 1) {
        // The last one: it won't go.
        next = FULL - 1;
        this.survivor = i;
      } else this.covered++;
    }
    this.amount[i] = next;
    this.touch(i);
    return next - before;
  }

  /** Set a cell's paint outright (Pix un-painting, a pile of snow, the finale). */
  set(i: number, value: number) {
    if (!this.region[i]) return;
    const before = this.amount[i]!;
    value = Math.max(0, Math.min(FULL, Math.round(value)));
    if (before === value) return;
    if (before === FULL) this.covered--;
    if (value === FULL) this.covered++;
    this.amount[i] = value;
    this.touch(i);
  }

  /** Every cell of the job done (the finale starts finished). */
  fill() {
    for (let i = 0; i < this.size; i++) if (this.region[i]) this.amount[i] = FULL;
    this.covered = this.total;
    this.touchAll();
  }

  /** The cells still to do (a scan: for the switch and for tests, never per frame). */
  remaining(): number[] {
    const out: number[] = [];
    for (let i = 0; i < this.size; i++) if (this.region[i] && this.amount[i]! < FULL) out.push(i);
    return out;
  }

  /** What changed since the last call (a box of cells), or null. */
  takeDirty(): { x0: number; y0: number; x1: number; y1: number } | null {
    if (this.dx1 < 0) return null;
    const box = { x0: this.dx0, y0: this.dy0, x1: this.dx1, y1: this.dy1 };
    this.dx0 = this.dy0 = Infinity;
    this.dx1 = this.dy1 = -1;
    return box;
  }

  touchAll() {
    this.dx0 = this.dy0 = 0;
    this.dx1 = this.w - 1;
    this.dy1 = this.h - 1;
  }

  private touch(i: number) {
    const x = i % this.w;
    const y = (i - x) / this.w;
    if (x < this.dx0) this.dx0 = x;
    if (x > this.dx1) this.dx1 = x;
    if (y < this.dy0) this.dy0 = y;
    if (y > this.dy1) this.dy1 = y;
  }
}
