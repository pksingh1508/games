import { describe, expect, it } from "vitest";
import { createRng } from "@/engine/rng";
import { FULL } from "./constants";
import { Coverage } from "./coverage";

const grid = (w: number, h: number, fn: (x: number, y: number) => number = () => 1) => {
  const r = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) r[y * w + x] = fn(x, y);
  return r;
};

/** The count, the slow way. */
const scan = (c: Coverage) => {
  let n = 0;
  for (let i = 0; i < c.size; i++) if (c.region[i] && c.amount[i] === FULL) n++;
  return n;
};

describe("the coverage grid", () => {
  it("counts each cell the moment it fills, and the running count always matches a full scan", () => {
    const c = new Coverage(30, 20, grid(30, 20), ["paint"]);
    c.guard = false;
    const rng = createRng("cov");
    for (let n = 0; n < 4000; n++) {
      const i = Math.floor(rng() * c.size);
      if (rng() < 0.15) c.set(i, Math.floor(rng() * 256));
      else c.add(i, rng() * 200, "paint");
      if (n % 97 === 0) expect(c.covered).toBe(scan(c));
    }
    expect(c.covered).toBe(scan(c));
  });

  it("only takes paint for its own job: other jobs' cells, and cells that aren't the job, don't change or count", () => {
    // Left half: paint; right half: wipe; the top row isn't the job at all.
    const c = new Coverage(10, 4, grid(10, 4, (x, y) => (y === 0 ? 0 : x < 5 ? 1 : 2)), ["paint", "wipe"]);
    expect(c.total).toBe(30);
    expect(c.amount[3]).toBe(FULL);
    expect(c.add(3, 999, "paint")).toBe(0);
    expect(c.add(10 + 7, 999, "paint")).toBe(0);
    expect(c.add(10 + 2, 999, "paint")).toBe(FULL);
    expect(c.add(10 + 7, 100, "wipe")).toBe(100);
    expect(c.covered).toBe(1);
    expect(c.taskAt(17)).toBe("wipe");
    expect(c.taskAt(3)).toBeNull();
  });

  it("won't let the last cell go: covering everything at once leaves exactly one (that's Pix)", () => {
    const c = new Coverage(8, 8, grid(8, 8), ["paint"]);
    for (let i = 0; i < c.size; i++) c.add(i, FULL, "paint");
    expect(c.covered).toBe(c.total - 1);
    expect(c.survivor).toBe(63);
    expect(c.amount[63]).toBe(FULL - 1);
    expect(c.remaining()).toEqual([63]);
    // Once Pix is awake, the guard's off.
    c.guard = false;
    c.add(63, FULL, "paint");
    expect(c.covered).toBe(c.total);
  });

  it("can be un-done (Pix's trail, a pile of snow) and done again, counting both ways", () => {
    const c = new Coverage(4, 4, grid(4, 4), ["paint"]);
    c.fill();
    expect(c.covered).toBe(16);
    c.set(5, 0);
    c.set(6, 120);
    expect(c.covered).toBe(14);
    c.set(6, FULL);
    expect(c.covered).toBe(15);
    expect(c.progress).toBeCloseTo(15 / 16);
  });

  it("tells the renderer what changed, as a box", () => {
    const c = new Coverage(20, 10, grid(20, 10), ["paint"]);
    expect(c.takeDirty()).toEqual({ x0: 0, y0: 0, x1: 19, y1: 9 });
    expect(c.takeDirty()).toBeNull();
    c.add(2 * 20 + 3, 50, "paint");
    c.add(7 * 20 + 11, 50, "paint");
    expect(c.takeDirty()).toEqual({ x0: 3, y0: 2, x1: 11, y1: 7 });
  });
});
