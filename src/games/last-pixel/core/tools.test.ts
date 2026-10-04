import { describe, expect, it } from "vitest";
import { FULL, HZ } from "./constants";
import { Coverage } from "./coverage";
import type { Vec } from "./geometry";
import type { Task, ToolId } from "./level";
import { Painter, SHOVEL_CAP } from "./tools";

function setup(tool: ToolId, task: Task, w = 60, h = 30, region?: (x: number, y: number) => number) {
  const r = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) r[y * w + x] = region ? region(x, y) : 1;
  const cov = new Coverage(w, h, r, [task]);
  cov.guard = false;
  return { cov, painter: new Painter([tool], w, h), w, h };
}

/** One stroke along `points`, `perTick` points a tick. */
function stroke(s: ReturnType<typeof setup>, points: Vec[], perTick = 1) {
  for (let k = 0; k < points.length; k += perTick) {
    const path = points.slice(k, k + perTick);
    s.painter.apply(s.cov, path, true, k === 0, false);
  }
  s.painter.apply(s.cov, [], false, false, true);
}

const line = (a: Vec, b: Vec, n: number) => Array.from({ length: n + 1 }, (_, k) => ({ x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n }));
const at = (s: { cov: Coverage; w: number }, x: number, y: number) => s.cov.amount[y * s.w + x]!;

describe("tools", () => {
  it("a flick across the whole canvas in one tick leaves no gaps", () => {
    const s = setup("brush", "paint");
    stroke(s, [{ x: 1, y: 15 }, { x: 59, y: 15 }]);
    for (let x = 1; x < 59; x++) expect(at(s, x, 15), `x ${x}`).toBe(FULL);
  });

  it("how much paint a cell gets depends on the path, never on the hand's speed", () => {
    const slow = setup("sponge", "wipe");
    const fast = setup("sponge", "wipe");
    const path = line({ x: 5, y: 10 }, { x: 50, y: 18 }, 90);
    stroke(slow, path, 1);
    stroke(fast, path, 45);
    expect(Array.from(fast.cov.amount)).toEqual(Array.from(slow.cov.amount));
  });

  it("the roller's edges only part-paint, so strokes want to overlap", () => {
    const s = setup("roller", "paint");
    stroke(s, line({ x: 2, y: 15 }, { x: 58, y: 15 }, 20));
    expect(at(s, 30, 15)).toBe(FULL);
    expect(at(s, 30, 12)).toBe(FULL);
    const edge = at(s, 30, 19);
    expect(edge).toBeGreaterThan(0);
    expect(edge).toBeLessThan(FULL);
    expect(at(s, 30, 21)).toBe(0);
    // An overlapping stroke finishes the edge.
    stroke(s, line({ x: 2, y: 22 }, { x: 58, y: 22 }, 20));
    expect(at(s, 30, 19)).toBe(FULL);
  });

  it("the sponge wipes a little at a time; circling and scrubbing clean much faster than plain strokes", () => {
    const plain = setup("sponge", "wipe");
    stroke(plain, line({ x: 5, y: 15 }, { x: 55, y: 15 }, 50));
    const once = at(plain, 30, 15);
    expect(once).toBeGreaterThan(40);
    expect(once).toBeLessThan(FULL);
    // The same distance, scrubbing back and forth along the row.
    const scrub = setup("sponge", "wipe");
    const zig: Vec[] = [];
    for (let k = 0; k <= 25; k++) zig.push({ x: 5 + k * 2, y: 15 + (k % 2 ? 1.5 : -1.5) });
    stroke(scrub, zig);
    expect(at(scrub, 30, 15)).toBe(FULL);
    // And in circles.
    const circle = setup("sponge", "wipe");
    const loop: Vec[] = [];
    for (let k = 0; k <= 60; k++) loop.push({ x: 30 + Math.cos((k / 20) * Math.PI * 2) * 3, y: 15 + Math.sin((k / 20) * Math.PI * 2) * 3 });
    stroke(circle, loop);
    expect(at(circle, 30, 15)).toBe(FULL);
  });

  it("the scratch coin reveals in specks: cells along a stroke come up unevenly", () => {
    const s = setup("scratch", "scratch");
    stroke(s, line({ x: 5, y: 15 }, { x: 55, y: 15 }, 50));
    const row = Array.from({ length: 40 }, (_, k) => at(s, 10 + k, 16));
    expect(new Set(row).size).toBeGreaterThan(5);
    expect(Math.min(...row)).toBeLessThan(FULL);
  });

  it("the washer's jet is narrow and full; its mist only dampens", () => {
    const s = setup("washer", "wash");
    stroke(s, line({ x: 5, y: 15 }, { x: 55, y: 15 }, 50));
    expect(at(s, 30, 15)).toBe(FULL);
    expect(at(s, 30, 16)).toBe(FULL);
    expect(at(s, 30, 17)).toBeLessThan(FULL);
    expect(at(s, 30, 17)).toBeGreaterThan(0);
    expect(at(s, 30, 19)).toBe(0);
  });

  it("the mower drives itself towards your pointer: momentum, a turning circle, and it coasts when you let go", () => {
    const s = setup("mower", "mow", 80, 40);
    const m = s.painter.mower;
    m.x = 10;
    m.y = 20;
    // Hold the pointer far ahead: it speeds up gradually.
    const speeds: number[] = [];
    for (let t = 0; t < HZ; t++) {
      s.painter.apply(s.cov, [{ x: 70, y: 20 }], true, t === 0, false);
      speeds.push(m.speed);
    }
    expect(speeds[1]!).toBeLessThan(6);
    expect(speeds.at(-1)!).toBeGreaterThan(15);
    expect(m.x).toBeGreaterThan(20);
    // Behind it now: it can't spin round on the spot at speed.
    const heading = m.heading;
    s.painter.apply(s.cov, [{ x: 0, y: 20 }], true, false, false);
    expect(Math.abs(m.heading - heading)).toBeLessThan(0.2);
    // Let go: it rolls on a bit, then stops.
    const x = m.x;
    for (let t = 0; t < HZ * 2; t++) s.painter.apply(s.cov, [], false, false, t === 0);
    expect(m.x).not.toBe(x);
    expect(m.speed).toBe(0);
    // Mown cells, striped the way it went.
    expect(at(s, 15, 20)).toBe(FULL);
    expect(s.cov.variant[20 * 80 + 15]).toBe(0);
  });

  it("the mower's stripes go the other way when it comes back", () => {
    const s = setup("mower", "mow", 80, 40);
    const m = s.painter.mower;
    m.x = 70;
    m.y = 10;
    m.heading = Math.PI;
    for (let t = 0; t < HZ * 2; t++) s.painter.apply(s.cov, [{ x: 2, y: 10 }], true, t === 0, false);
    expect(at(s, 40, 10)).toBe(FULL);
    expect(s.cov.variant[10 * 80 + 40]).toBe(1);
  });

  it("the shovel clears snow into a load: off the drive it's gone, let go on the drive it's a pile", () => {
    // The drive is rows 5–24; the rest is lawn.
    const drive = (x: number, y: number) => (y >= 5 && y < 25 ? 1 : 0);
    const off = setup("shovel", "shovel", 60, 30, drive);
    stroke(off, line({ x: 20, y: 6 }, { x: 20, y: 28 }, 22));
    expect(at(off, 20, 15)).toBe(FULL);
    expect(off.painter.load).toBe(0);
    expect(off.cov.covered).toBeGreaterThan(100);

    const on = setup("shovel", "shovel", 60, 30, drive);
    stroke(on, line({ x: 20, y: 6 }, { x: 20, y: 22 }, 16));
    // The pile where it stopped.
    expect(at(on, 20, 22)).toBe(0);
    expect(at(on, 20, 10)).toBe(FULL);
    expect(on.painter.load).toBe(0);
  });

  it("a full shovel can't take any more snow", () => {
    const s = setup("shovel", "shovel", 200, 30);
    const points = line({ x: 2, y: 15 }, { x: 198, y: 15 }, 196);
    for (let k = 0; k < points.length; k++) s.painter.apply(s.cov, [points[k]!], true, k === 0, false);
    expect(s.painter.load).toBeGreaterThanOrEqual(SHOVEL_CAP);
    expect(at(s, 20, 15)).toBe(FULL);
    expect(at(s, 180, 15)).toBe(0);
  });
});
