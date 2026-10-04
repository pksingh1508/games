import { describe, expect, it } from "vitest";
import { BEAT_PX, CLIP_TICKS, GLITCH, JUMP, PANIC_TICKS, RUNNER_H, SLIDE, SLIDE_H, TILE } from "./constants";
import { cuesOf, search } from "./reference";
import { createRun, metres, multiplierOf, step, type Run, type RunConfig, type RunEvent, type Scan } from "./run";
import { parseChunk, Track } from "./track";

/** A track from a few rows drawn above the ground (the last one is row 11; rows 12–16 are ground), padded with flat track. */
function track(...drawn: string[]): Track {
  const cols = Math.ceil((drawn[0]!.length + 24) / 6) * 6;
  const above = drawn.map((row) => row.padEnd(cols, "."));
  const rows = Array.from({ length: 17 }, (_, r) => {
    if (r >= 12) return "#".repeat(cols);
    const i = r - (12 - above.length);
    return i >= 0 ? above[i]! : ".".repeat(cols);
  });
  const t = new Track();
  t.append(parseChunk({ id: "t", difficulty: 1, rows }));
  return t;
}

/** Flat ground with some columns drawn into the ground row (pits are "." in all ground rows). */
function withPit(cols: number, from: number, width: number): Track {
  const rows = Array.from({ length: 17 }, (_, r) => {
    if (r < 12) return ".".repeat(cols);
    return Array.from({ length: cols }, (_, c) => (c >= from && c < from + width ? "." : "#")).join("");
  });
  const t = new Track();
  t.append(parseChunk({ id: "pit", difficulty: 1, rows }));
  return t;
}

const config = (t: Track, extra: Partial<RunConfig> = {}): RunConfig => ({ track: t, tempo: [{ beat: 0, ticks: 30 }], finishCol: null, ...extra });

function run(r: Run, bits: number | ((tick: number) => number), ticks: number) {
  const events: RunEvent[] = [];
  for (let i = 0; i < ticks && r.status === "run"; i++) events.push(...step(r, typeof bits === "number" ? bits : bits(r.tick)));
  return events;
}

const flat = (beats: number) => track(".".repeat(beats * 6));

describe("running", () => {
  it("runs a beat of track (six tiles) every beat, exactly, at any tempo", () => {
    for (const ticks of [30, 27, 25, 24, 22]) {
      const r = createRun(config(flat(40), { tempo: [{ beat: 0, ticks }] }));
      run(r, 0, ticks * 10);
      expect(r.runner.x).toBe(10 * BEAT_PX);
      expect(r.beat).toBe(10);
      expect(r.beatTick).toBe(0);
    }
  });

  it("follows tempo changes on the beat", () => {
    const r = createRun(config(flat(40), { tempo: [{ beat: 0, ticks: 30 }, { beat: 4, ticks: 24 }] }));
    run(r, 0, 4 * 30 + 4 * 24);
    expect(r.beat).toBe(8);
    expect(r.runner.x).toBe(8 * BEAT_PX);
  });

  it("a full jump goes about 58 px up and lasts about 33 ticks; a tap is a hop", () => {
    const high = (bits: (t: number) => number) => {
      const r = createRun(config(flat(10)));
      run(r, 0, 2);
      const ground = r.runner.y;
      let top = ground;
      let air = 0;
      for (let i = 0; i < 80; i++) {
        step(r, bits(i));
        top = Math.min(top, r.runner.y);
        if (!r.runner.grounded) air++;
      }
      return { height: ground - top, air };
    };
    const full = high(() => JUMP);
    expect(full.height).toBeGreaterThanOrEqual(55);
    expect(full.height).toBeLessThanOrEqual(62);
    expect(full.air).toBeGreaterThanOrEqual(30);
    expect(full.air).toBeLessThanOrEqual(38);
    const hop = high((i) => (i < 4 ? JUMP : 0));
    expect(hop.height).toBeLessThan(full.height * 0.6);
  });

  it("slides under a firewall bar, and crashes into it standing", () => {
    const bar = () => track("......=.....", "............");
    const stood = createRun(config(bar()));
    expect(run(stood, 0, 60)).toContainEqual({ type: "death", cause: "wall" });
    const slid = createRun(config(bar()));
    run(slid, SLIDE, 50);
    expect(slid.status).toBe("run");
    expect(slid.runner.h).toBe(SLIDE_H);
    // Let go after the bar: stand up again.
    run(slid, 0, 5);
    expect(slid.runner.h).toBe(RUNNER_H);
  });

  it("can't stand up under a bar: keeps sliding until there's room", () => {
    const r = createRun(config(track("..====......", "............")));
    run(r, SLIDE, 12);
    run(r, 0, 6);
    expect(r.runner.sliding).toBe(true);
    run(r, 0, 30);
    expect(r.runner.sliding).toBe(false);
    expect(r.status).toBe("run");
  });

  it("walls stop you dead; jumping clears a two-tile wall", () => {
    const wall = () => track("......#.....", "......#.....");
    expect(run(createRun(config(wall())), 0, 60)).toContainEqual({ type: "death", cause: "wall" });
    const r = createRun(config(wall()));
    run(r, (t) => (t >= 14 && t < 30 ? JUMP : 0), 80);
    expect(r.status).toBe("run");
  });

  it("spikes patch you; a pit drops you into the void", () => {
    expect(run(createRun(config(track("....^^......"))), 0, 60)).toContainEqual({ type: "death", cause: "spikes" });
    expect(run(createRun(config(withPit(24, 6, 3))), 0, 120)).toContainEqual({ type: "death", cause: "void" });
    const r = createRun(config(withPit(24, 6, 3)));
    run(r, (t) => (t >= 22 && t < 40 ? JUMP : 0), 120);
    expect(r.status).toBe("run");
  });

  it("near misses score: some hop over a spike brushes past it", () => {
    let near = false;
    for (let t = 10; t < 60 && !near; t++) {
      const r = createRun(config(track("..........^....")));
      const events = run(r, (tick) => (tick >= t && tick < t + 4 ? JUMP : 0), 100);
      near = r.status === "run" && events.some((e) => e.type === "nearMiss");
    }
    expect(near).toBe(true);
  });
});

describe("glitch power", () => {
  it("ten bits make a charge (three at most); Clip spends one and raises corruption", () => {
    const r = createRun(config(track(".ooooooooooooooooooooooooooooooooooo...........")));
    run(r, 0, 200);
    expect(r.charges).toBe(3);
    expect(r.bits).toBe(5);
    const events = run(r, GLITCH, 3);
    expect(events).toContainEqual({ type: "clip" });
    expect(r.charges).toBe(2);
    expect(r.corruption).toBe(10);
    expect(r.runner.clip).toBeGreaterThan(CLIP_TICKS - 5);
    expect(run(r, GLITCH, 1)).not.toContainEqual({ type: "clip" });
  });

  it("Clip phases through a wall (and scores), but not through the floor", () => {
    const t = track("......#.....", "......#.....", "......#.....");
    const r = createRun(config(t));
    r.charges = 1;
    const events = run(r, (tick) => (tick === 8 ? GLITCH : 0), 60);
    expect(r.status).toBe("run");
    expect(events).toContainEqual({ type: "phased" });
    expect(r.runner.y).toBe(12 * TILE - RUNNER_H);
  });

  it("a Clip that ends inside a long wall holds on a little, then gives up", () => {
    const r = createRun(config(track("......" + "#".repeat(30) + "......", "......" + "#".repeat(30) + "......")));
    r.charges = 1;
    expect(run(r, (tick) => (tick === 6 ? GLITCH : 0), 200)).toContainEqual({ type: "death", cause: "wall" });
  });

  it("no charge: nothing happens (but it's heard)", () => {
    const r = createRun(config(flat(4)));
    expect(run(r, GLITCH, 2)).toContainEqual({ type: "noCharge" });
  });

  it("patches lower corruption; the multiplier follows it", () => {
    const r = createRun(config(track("....+......."), { corruption: 40 }));
    run(r, 0, 40);
    expect(r.corruption).toBe(25);
    expect(multiplierOf(0)).toBe(1);
    expect(multiplierOf(100)).toBe(5);
  });

  it("Kernel Panic at 100%: survive ten seconds for a bonus, and it calms to 50%", () => {
    const r = createRun(config(flat(80), { corruption: 99, drift: 1 }));
    const events = run(r, 0, 31);
    expect(events).toContainEqual({ type: "panic" });
    const score = r.score;
    const later = run(r, 0, PANIC_TICKS + 5);
    expect(later).toContainEqual({ type: "panicSurvived" });
    expect(r.corruption).toBeLessThanOrEqual(51);
    expect(r.score - score).toBeGreaterThan(5000);
  });
});

describe("The Debugger's scan lines", () => {
  const chase = (scan: Scan) => createRun(config(flat(10), { scans: [scan] }));

  it("reach you exactly a beat after they're fired", () => {
    const r = chase({ beat: 2, kind: "full" });
    const events = run(r, 0, 200);
    expect(events).toContainEqual({ type: "death", cause: "scan" });
    expect(r.tick).toBeGreaterThanOrEqual(3 * 30 - 1);
    expect(r.tick).toBeLessThanOrEqual(3 * 30 + 1);
  });

  it("full: Clip through; low: jump over; high: slide under", () => {
    const full = chase({ beat: 2, kind: "full" });
    full.charges = 1;
    run(full, (t) => (t === 85 ? GLITCH : 0), 200);
    expect(full.status).toBe("run");
    const low = chase({ beat: 2, kind: "low" });
    run(low, (t) => (t >= 76 && t < 92 ? JUMP : 0), 200);
    expect(low.status).toBe("run");
    const high = chase({ beat: 2, kind: "high" });
    run(high, (t) => (t >= 80 && t < 100 ? SLIDE : 0), 200);
    expect(high.status).toBe("run");
    expect(run(chase({ beat: 2, kind: "high" }), 0, 200)).toContainEqual({ type: "death", cause: "scan" });
  });
});

describe("the reference run", () => {
  it("finds the moves through a stretch, acting only on half-beats", () => {
    // A wall hanging down to a bar: no way over, only under.
    const t = track(
      "............#...........................................",
      "............#...........................................",
      "............#...........................................",
      "............#...........................................",
      "............#...........................................",
      "............=.........................#.................",
      ".................^^.................................^^..",
    );
    const r = createRun(config(t));
    const found = search(r, 54);
    expect(found).not.toBeNull();
    const cues = cuesOf(found!.moves);
    expect(cues.map((c) => c.move)).toContain("slide");
    expect(cues.some((c) => c.move === "jump" || c.move === "hop")).toBe(true);
    for (const c of cues) expect((c.tick - 1) % 15).toBe(0);
  });

  it("says when there's no way through", () => {
    const t = track("......#.....", "......#.....", "......#.....", "......#.....");
    expect(search(createRun(config(t)), 11)).toBeNull();
  });

  it("the same inputs always give the same run", () => {
    const make = () => {
      const r = createRun(config(track(".o..^...=...o..#....o.....")));
      run(r, (t) => (t % 40 < 12 ? JUMP : t % 40 > 30 ? SLIDE : 0), 300);
      return { x: r.runner.x, y: r.runner.y, score: r.score, status: r.status, bits: r.bits, tick: r.tick, metres: metres(r) };
    };
    expect(make()).toEqual(make());
  });
});
