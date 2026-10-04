import { describe, expect, it } from "vitest";
import { BUSY_TICKS, CLOSE_BUTTON, CRASH_TICKS, IBEAM_HALF, TIP_R, WARN_TICKS } from "./constants";
import { segmentSegment2, sweepBox, sweepRoundRect } from "./geometry";
import type { Hazard, LevelSource, Panel } from "./level";
import { Session } from "./session";
import { compile, FOUND_PX, HOP_SHIVER, OPEN_TICKS, scanLine, STILL, World, type Input, type SimEvent } from "./sim";

/** A level with nothing in it but what's given: the start at (100, 200), an opening under the [X]. */
function course(extra: Partial<LevelSource> = {}) {
  return compile({
    id: "T-01",
    drive: "C",
    name: "Test",
    hint: "",
    start: { x: 100, y: 200 },
    gaps: [[592, 624]],
    walls: [],
    medals: { gold: 600, silver: 900, bronze: 1200 },
    ...extra,
  });
}

const input = (dx: number, dy: number, click = false): Input => ({ dx, dy, click });

/** Move by (dx, dy) a tick for `ticks` ticks; every event. */
function run(w: World, dx: number, dy: number, ticks: number, click = false): SimEvent[] {
  const all: SimEvent[] = [];
  for (let i = 0; i < ticks && w.status !== "crashed" && w.status !== "won"; i++) all.push(...w.step(input(dx, dy, click && i === ticks - 1)));
  return all;
}

/** Go to (x, y) in steps of at most 2 px. */
function goTo(w: World, x: number, y: number) {
  for (let guard = 0; guard < 2000 && w.status !== "crashed"; guard++) {
    const dx = x - w.x;
    const dy = y - w.y;
    const d = Math.hypot(dx, dy);
    if (d < 0.01) return;
    const k = Math.min(1, 2 / d);
    w.step(input(dx * k, dy * k));
  }
}

const types = (events: SimEvent[]) => events.map((e) => e.type);

describe("swept collision", () => {
  it("catches a flick straight through a thin wall, at the wall", () => {
    const w = new World(course({ walls: [{ x: 300, y: 32, w: 4, h: 336 }] }));
    w.step(input(400, 0));
    expect(w.status).toBe("crashed");
    expect(w.crash!.cause).toBe("wall");
    expect(w.crash!.x).toBeCloseTo(300 - TIP_R, 5);
  });

  it("grazing isn't touching, and corners are round", () => {
    // A rect, and a circle that passes exactly its radius away from a face: no hit.
    expect(sweepRoundRect(0, 10 - TIP_R, 100, 0, TIP_R, { x: 40, y: 10, w: 10, h: 10 })).toBe(Infinity);
    expect(sweepRoundRect(0, 10 - TIP_R + 0.1, 100, 0, TIP_R, { x: 40, y: 10, w: 10, h: 10 })).toBeLessThan(1);
    // Diagonally past a corner, 3.5 px from it (inside the square grown by 3, outside the rounded one).
    const off = 3.5 / Math.SQRT2;
    expect(sweepRoundRect(40 - off - 20, 10 - off + 20, 40, -40, TIP_R, { x: 40, y: 10, w: 10, h: 10 })).toBe(Infinity);
    expect(sweepBox(5, 5, 0, 0, 0, 0, 10, 10)).toBe(0);
    expect(segmentSegment2(0, 0, 10, 10, 0, 10, 10, 0)).toBe(0);
  });

  it("never lets a fast hand tunnel: wild flicks across thin walls always crash at the first one in the way", () => {
    // Full-height walls: any move that ends past one must have crashed at it.
    const walls = Array.from({ length: 12 }, (_, i) => ({ x: 60 + i * 45, y: 32, w: 3, h: 336 }));
    let seed = 7;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) * 2 - 1;
    for (let trial = 0; trial < 300; trial++) {
      const start = 30 + Math.floor(Math.abs(rnd()) * 12) * 45;
      const w = new World(course({ start: { x: start, y: 200 }, walls }));
      const dx = rnd() * 900;
      w.step(input(dx, rnd() * 100));
      const first = dx > 0 ? walls.find((wall) => wall.x > start) : [...walls].reverse().find((wall) => wall.x + wall.w < start);
      if (!first) continue;
      const reach = dx > 0 ? first.x - TIP_R : first.x + first.w + TIP_R;
      if (Math.abs(dx) > Math.abs(reach - start)) {
        expect(w.crash, `flick ${dx.toFixed(0)} from ${start}`).not.toBeNull();
        expect(w.crash!.x).toBeCloseTo(reach, 6);
      } else expect(w.crash).toBeNull();
    }
  });
});

describe("the basics", () => {
  it("nothing happens until you first move: then the clock starts", () => {
    const w = new World(course({ hazards: [{ kind: "chaser", shape: "spinner", at: { x: 400, y: 200 }, r: 8, w: 0, h: 0, speed: 1, delay: 0 }] }));
    for (let i = 0; i < 50; i++) w.step(STILL);
    expect(w.status).toBe("ready");
    expect(w.tick).toBe(0);
    expect(w.hz[0]!.x).toBe(400);
    expect(types(w.step(input(1, 0)))).toContain("start");
    expect(w.status).toBe("run");
    expect(w.hz[0]!.x).toBeLessThan(400);
  });

  it("escape: up through the opening, onto the [X], click", () => {
    const w = new World(course({ start: { x: 610, y: 60 } }));
    goTo(w, 610, 20);
    goTo(w, CLOSE_BUTTON.x + 8, 20);
    expect(w.status).toBe("run");
    expect(types(w.step(input(0, 0, true)))).toContain("win");
    expect(w.status).toBe("won");
  });

  it("the bar under the title bar is solid except its openings; [_] and [□] are solid", () => {
    const shut = new World(course({ start: { x: 300, y: 60 } }));
    goTo(shut, 300, 20);
    expect(shut.crash?.cause).toBe("wall");
    const min = new World(course({ start: { x: 610, y: 60 } }));
    goTo(min, 610, 20);
    goTo(min, 580, 20);
    expect(min.crash?.cause).toBe("wall");
  });

  it("clicking anywhere else is just a click", () => {
    const w = new World(course());
    w.step(input(1, 0));
    expect(w.step(input(0, 0, true))).toEqual([{ type: "click", hit: false }]);
  });

  it("is deterministic", () => {
    const make = () => new World(course({ hazards: [{ kind: "chaser", shape: "spinner", at: { x: 400, y: 200 }, r: 8, w: 0, h: 0, speed: 0.7, delay: 30 }], sabotage: [{ at: 150, ticks: 300, effect: { type: "lag", follow: 0.2 } }] }));
    const a = make();
    const b = make();
    for (let i = 0; i < 600; i++) {
      const dx = Math.sin(i / 17) * 2;
      const dy = Math.cos(i / 23) * 2;
      a.step(input(dx, dy));
      b.step(input(dx, dy));
    }
    expect([a.x, a.y, a.status, a.hz[0]!.x]).toEqual([b.x, b.y, b.status, b.hz[0]!.x]);
  });
});

describe("cursor shapes", () => {
  /** A band of wall across the window, with a narrow upright channel through it at x 300–304. */
  const band = [
    { x: 16, y: 200, w: 284, h: 16 },
    { x: 304, y: 200, w: 320, h: 16 },
  ];

  it("the I-beam fits a narrow upright slot; the arrow doesn't", () => {
    const zone = { rect: { x: 270, y: 150, w: 64, h: 110 }, mode: "ibeam" as const };
    const beam = new World(course({ start: { x: 302, y: 175 }, walls: band, zones: [zone] }));
    beam.step(input(0, 0.5));
    expect(beam.mode).toBe("ibeam");
    run(beam, 0, 1, 60);
    expect(beam.status).toBe("run");
    expect(beam.y).toBeGreaterThan(216 + IBEAM_HALF.h);
    const arrow = new World(course({ start: { x: 302, y: 175 }, walls: band }));
    run(arrow, 0, 1, 60);
    expect(arrow.crash?.cause).toBe("wall");
  });

  it("…and a low, wide slot lets the arrow through but not the I-beam", () => {
    const wall = [
      { x: 300, y: 32, w: 16, h: 168 },
      { x: 300, y: 208, w: 16, h: 160 },
    ];
    const arrow = new World(course({ start: { x: 270, y: 204 }, walls: wall }));
    run(arrow, 1, 0, 80);
    expect(arrow.status).toBe("run");
    const beam = new World(course({ start: { x: 270, y: 204 }, walls: wall, zones: [{ rect: { x: 240, y: 150, w: 120, h: 100 }, mode: "ibeam" }] }));
    run(beam, 1, 0, 80);
    expect(beam.crash?.cause).toBe("wall");
  });

  it("resize edges lock you to one axis", () => {
    const w = new World(course({ zones: [{ rect: { x: 50, y: 150, w: 200, h: 100 }, mode: "resizeH" }] }));
    run(w, 0, 3, 10);
    expect(w.y).toBe(200);
    expect(w.mode).toBe("resizeH");
    run(w, 3, 0, 10);
    expect(w.x).toBe(130);
    const v = new World(course({ zones: [{ rect: { x: 50, y: 150, w: 200, h: 100 }, mode: "resizeV" }] }));
    run(v, 3, 0, 10);
    expect(v.x).toBe(100);
  });

  it("precision zones halve your speed", () => {
    const w = new World(course({ zones: [{ rect: { x: 50, y: 150, w: 200, h: 100 }, mode: "crosshair" }] }));
    run(w, 4, 0, 10);
    expect(w.x).toBe(120);
  });

  it("loading zones freeze you once a visit (the world keeps going)", () => {
    const w = new World(course({ start: { x: 100, y: 200 }, zones: [{ rect: { x: 110, y: 150, w: 60, h: 100 }, mode: "busy" }] }));
    // Your shape (and its rules) changes on the tick after you cross into a zone.
    const events = run(w, 2, 0, 7);
    expect(types(events)).toContain("freeze");
    const at = w.x;
    run(w, 2, 0, BUSY_TICKS - 2);
    expect(w.x).toBe(at);
    run(w, 2, 0, 5);
    expect(w.x).toBeGreaterThan(at);
    // Still inside: no second freeze.
    expect(types(run(w, 2, 0, 10))).not.toContain("freeze");
  });

  it("links pull you in, the hand over them", () => {
    const w = new World(course({ links: [{ rect: { x: 200, y: 195, w: 40, h: 10 }, text: "click here", reach: 120, pull: 1 }] }));
    run(w, 0, 0.001, 300);
    expect(w.x).toBeGreaterThan(195);
    expect(w.mode).toBe("hand");
  });

  it("restricted zones push you out", () => {
    const w = new World(course({ start: { x: 105, y: 200 }, zones: [{ rect: { x: 100, y: 150, w: 100, h: 100 }, mode: "forbidden" }] }));
    run(w, 0, 0.001, 20);
    expect(w.x).toBeLessThan(100);
  });

  it("drag a window by its title bar; click to let go; it can't be dragged into a wall", () => {
    const panel: Panel = { id: "w", rect: { x: 200, y: 150, w: 120, h: 80 }, title: "Notepad", look: "window", closeable: false, draggable: true };
    const w = new World(course({ start: { x: 230, y: 120 }, panels: [panel], walls: [{ x: 400, y: 32, w: 10, h: 336 }] }));
    goTo(w, 230, 156);
    expect(w.mode).toBe("grab");
    expect(w.grab).toBe(0);
    goTo(w, 260, 156);
    expect(w.panels[0]!.x).toBeCloseTo(230, 5);
    w.step(input(0, 0, true));
    expect(w.grab).toBe(-1);
    goTo(w, 240, 156);
    expect(w.panels[0]!.x).toBeCloseTo(230, 5);
    // Away and back: grab again, then push it into the wall: you let go.
    goTo(w, 240, 120);
    goTo(w, 240, 158);
    w.step(input(0, 0.1));
    expect(w.grab).toBe(0);
    goTo(w, 330, 156);
    expect(w.grab).toBe(-1);
    expect(w.panels[0]!.x + 120).toBeLessThanOrEqual(400);
  });
});

describe("sabotage", () => {
  it("is announced a second before it starts, and again when it ends", () => {
    const w = new World(course({ sabotage: [{ at: 300, ticks: 240, effect: { type: "invert", axes: "x" } }] }));
    const seen: Array<[string, number]> = [];
    for (let i = 0; i < 700; i++) {
      const t = w.tick;
      for (const e of w.step(input(i % 2 ? 0.2 : -0.2, 0))) seen.push([e.type, t]);
    }
    expect(seen).toContainEqual(["warn", 300 - WARN_TICKS]);
    expect(seen).toContainEqual(["begin", 300]);
    expect(seen).toContainEqual(["end", 540]);
  });

  it("invert: right goes left (and back again after)", () => {
    const w = new World(course({ start: { x: 300, y: 200 }, sabotage: [{ at: 150, ticks: 120, effect: { type: "invert", axes: "x" } }] }));
    run(w, 0.01, 0, 150);
    const at = w.x;
    run(w, 1, 0, 50);
    expect(w.x).toBeCloseTo(at - 50, 5);
    expect(w.rules.turned).toBe(true);
    run(w, 0, 0, 80);
    const after = w.x;
    run(w, 1, 0, 10);
    expect(w.x).toBeCloseTo(after + 10, 5);
  });

  it("rotate 90: right goes down", () => {
    const w = new World(course({ start: { x: 300, y: 100 }, sabotage: [{ at: 130, ticks: 400, effect: { type: "rotate", degrees: 90 } }] }));
    run(w, 0.001, 0, 131);
    const [x, y] = [w.x, w.y];
    run(w, 1, 0, 40);
    expect(w.x).toBeCloseTo(x, 3);
    expect(w.y).toBeCloseTo(y + 40, 3);
  });

  it("lag: the cursor trails your hand", () => {
    const w = new World(course({ start: { x: 100, y: 200 }, sabotage: [{ at: 130, ticks: 400, effect: { type: "lag", follow: 0.2 } }] }));
    run(w, 0.001, 0, 131);
    const x = w.x;
    w.step(input(10, 0));
    expect(w.x - x).toBeCloseTo(2, 3);
    expect(w.hx - x).toBeCloseTo(10, 2);
  });

  it("sensitivity, drift", () => {
    const fast = new World(course({ start: { x: 100, y: 200 }, sabotage: [{ at: 130, ticks: 400, effect: { type: "sensitivity", multiplier: 3 } }] }));
    run(fast, 0.001, 0, 131);
    const x = fast.x;
    run(fast, 1, 0, 10);
    expect(fast.x - x).toBeCloseTo(30, 3);
    const drift = new World(course({ start: { x: 100, y: 200 }, sabotage: [{ at: 130, ticks: 400, effect: { type: "drift", vx: 0, vy: 0.5 } }] }));
    run(drift, 0.001, 0, 131);
    const y = drift.y;
    run(drift, 0, 0, 20);
    expect(drift.y - y).toBeCloseTo(10, 3);
  });

  it("a large cursor's big hitbox doesn't fit where the arrow does", () => {
    const walls = [
      { x: 200, y: 32, w: 10, h: 163 },
      { x: 200, y: 205, w: 10, h: 163 },
    ];
    const small = new World(course({ start: { x: 150, y: 200 }, walls }));
    run(small, 1, 0, 100);
    expect(small.status).toBe("run");
    const big = new World(course({ start: { x: 150, y: 200 }, walls, sabotage: [{ at: 125, ticks: 400, effect: { type: "largeCursor", scale: 3 } }] }));
    run(big, 0.001, 0, 126);
    run(big, 1, 0, 100);
    expect(big.crash?.cause).toBe("wall");
  });

  it("a solid trail: cross your own path and you crash (its newest bit is safe)", () => {
    const w = new World(course({ start: { x: 200, y: 200 }, sabotage: [{ at: 125, ticks: 2000, effect: { type: "solidTrail", trail: 600 } }] }));
    run(w, 0.001, 0, 126);
    run(w, 1, 0, 60);
    run(w, 0, 1, 20);
    run(w, -1, 0, 30);
    expect(w.status).toBe("run");
    run(w, 0, -1, 40);
    expect(w.crash?.cause).toBe("trail");
  });

  it("recentre: for your convenience, back home", () => {
    const w = new World(course({ start: { x: 100, y: 200 }, home: { x: 320, y: 200 }, sabotage: [{ at: 130, ticks: 0, effect: { type: "recentre" } }] }));
    run(w, 0.5, 0, 130);
    w.step(STILL);
    expect([w.x, w.y]).toEqual([320, 200]);
  });

  it("decoys appear around you, and finding yourself fast counts", () => {
    const w = new World(course({ start: { x: 300, y: 200 }, sabotage: [{ at: 130, ticks: 600, effect: { type: "decoys", count: 3 } }] }));
    run(w, 0.001, 0, 131);
    expect(w.decoys.length).toBe(6);
    const events = run(w, 2, 0, Math.ceil(FOUND_PX / 2) + 1);
    expect(types(events)).toContain("found");
    // The first decoy is mirrored: it went left.
    expect(w.decoys[0]).toBeLessThan(330);
  });

  it("steady mode turns an inversion into a gentle rotation", () => {
    const w = new World(course({ start: { x: 300, y: 200 }, sabotage: [{ at: 130, ticks: 400, effect: { type: "invert", axes: "x" } }] }), { steady: true });
    run(w, 0.001, 0, 131);
    const [x, y] = [w.x, w.y];
    run(w, 1, 0, 10);
    expect(w.x - x).toBeGreaterThan(8.5);
    expect(Math.abs(w.y - y)).toBeGreaterThan(3);
  });
});

describe("hazards and windows", () => {
  it("a bouncing pop-up crashes you; its [X] sits in a notch you can reach from outside", () => {
    const ad: Panel = { id: "ad", rect: { x: 300, y: 150, w: 80, h: 50 }, title: "YOU WON!!!", look: "ad", closeable: true, motion: { kind: "bounce", vx: 1, vy: 0, bounds: { x: 16, y: 32, w: 608, h: 336 } } };
    const hit = new World(course({ start: { x: 340, y: 120 }, panels: [ad] }));
    run(hit, 0, 1, 40);
    expect(hit.crash?.cause).toBe("window");
    // Down into the notch at its top right, from above: click, and it's gone.
    const close = new World(course({ start: { x: 380, y: 120 }, panels: [{ ...ad, motion: undefined }] }));
    goTo(close, 373, 157);
    expect(close.status).toBe("run");
    expect(close.step(input(0, 0, true))).toContainEqual({ type: "close", panel: "ad" });
  });

  it("a pop-up's [X] closes it; ads that must go in order refuse to close early", () => {
    const panels: Panel[] = [
      { id: "a", rect: { x: 100, y: 100, w: 80, h: 50 }, title: "1", look: "ad", closeable: true, order: 1 },
      { id: "b", rect: { x: 300, y: 100, w: 80, h: 50 }, title: "2", look: "ad", closeable: true, order: 2 },
    ];
    const w = new World(course({ start: { x: 373, y: 80 }, panels }));
    goTo(w, 373, 106);
    expect(types(w.step(input(0, 0, true)))).toEqual(["wrongOrder"]);
    goTo(w, 373, 80);
    goTo(w, 173, 80);
    goTo(w, 173, 106);
    expect(types(w.step(input(0, 0, true)))).toEqual(["close"]);
    goTo(w, 173, 80);
    goTo(w, 373, 80);
    goTo(w, 373, 106);
    expect(types(w.step(input(0, 0, true)))).toEqual(["close"]);
  });

  it("a spinner chases; a download bar chases; touch either and you crash", () => {
    const w = new World(course({ start: { x: 100, y: 200 }, hazards: [{ kind: "chaser", shape: "spinner", at: { x: 160, y: 200 }, r: 8, w: 0, h: 0, speed: 1, delay: 0 }] }));
    run(w, 0.001, 0, 100);
    expect(w.crash?.cause).toBe("spinner");
  });

  it("the Recycle Bin pulls you in and deletes you", () => {
    const w = new World(course({ start: { x: 100, y: 200 }, hazards: [{ kind: "bin", at: { x: 180, y: 200 }, core: 10, reach: 120, pull: 1.2 }] }));
    run(w, 0.001, 0, 200);
    expect(w.crash?.cause).toBe("bin");
  });

  it("a selection box selects (deletes) you if you're inside when it closes", () => {
    const marquee: Hazard = { kind: "marquee", rect: { x: 50, y: 150, w: 120, h: 100 }, corner: "tl", period: 300, draw: 120, offset: 0 };
    const inside = new World(course({ hazards: [marquee] }));
    run(inside, 0.001, 0, 130);
    expect(inside.crash?.cause).toBe("marquee");
    const outside = new World(course({ start: { x: 300, y: 200 }, hazards: [marquee] }));
    run(outside, 0.001, 0, 400);
    expect(outside.status).toBe("run");
  });

  it("the scan line deletes you unless you're inside a safe file", () => {
    const scan: Hazard = { kind: "scan", axis: "x", from: 16, to: 624, speed: 4, period: 600, offset: 0, safe: [{ x: 280, y: 180, w: 40, h: 40 }] };
    const exposed = new World(course({ start: { x: 400, y: 200 }, hazards: [scan] }));
    run(exposed, 0.001, 0, 400);
    expect(exposed.crash?.cause).toBe("scan");
    const safe = new World(course({ start: { x: 300, y: 200 }, hazards: [scan] }));
    run(safe, 0.0001, 0, 400);
    expect(safe.status).toBe("run");
    expect(scanLine(scan as Extract<Hazard, { kind: "scan" }>, 50)).toBeNull();
  });

  it("“Are you sure?”: its buttons shiver and swap as you come near; the right one closes it, the wrong one crashes", () => {
    const dialog: Hazard = { kind: "dialog", rect: { x: 250, y: 120, w: 140, h: 70 }, text: "Delete cursor?", yes: { x: 270, y: 176, w: 40, h: 14 }, no: { x: 330, y: 176, w: 40, h: 14 }, answer: "no" };
    const w = new World(course({ start: { x: 350, y: 260 }, hazards: [dialog] }));
    const events = (() => {
      const all: SimEvent[] = [];
      for (let i = 0; i < 200 && w.y > 184; i++) all.push(...w.step(input(0, -0.5)));
      for (let i = 0; i < 60; i++) all.push(...w.step(STILL));
      return all;
    })();
    expect(types(events)).toContain("swap");
    // Swapped: "No" is now on the left button.
    goTo(w, 350, 220);
    goTo(w, 290, 220);
    goTo(w, 290, 183);
    for (let i = 0; i < 60; i++) w.step(STILL);
    const label = w.hz[0]!.flag ? "no" : "yes";
    const result = types(w.step(input(0, 0, true)));
    if (label === "no") expect(result).toContain("close");
    else expect(result).toContain("crash");
  });

  it("an icon you touch opens a window (solid once it's open)", () => {
    const popup: Panel = { id: "readme", rect: { x: 250, y: 120, w: 140, h: 100 }, title: "readme.txt", look: "window", closeable: true, byIcon: true };
    const w = new World(course({ start: { x: 100, y: 200 }, panels: [popup], hazards: [{ kind: "icon", rect: { x: 120, y: 190, w: 20, h: 20 }, label: "readme", opens: "readme" }] }));
    expect(w.panels[0]!.open).toBe(false);
    const events = run(w, 1, 0, 20);
    expect(events).toContainEqual({ type: "open", panel: "readme" });
    expect(w.panelSolidAt(0)).toEqual([]);
    run(w, 0, 0.001, OPEN_TICKS);
    expect(w.panelSolidAt(0).length).toBeGreaterThan(0);
  });

  it("“I'm not a robot” hops away twice, then ticks; with every target clicked, its window closes", () => {
    const gate: Panel = { id: "gate", rect: { x: 400, y: 40, w: 200, h: 100 }, title: "Verify", look: "captcha", closeable: false };
    const hazards: Hazard[] = [
      { kind: "robot", spots: [{ x: 120, y: 195, w: 10, h: 10 }, { x: 200, y: 255, w: 10, h: 10 }, { x: 300, y: 195, w: 10, h: 10 }], panel: "gate" },
      { kind: "target", rect: { x: 100, y: 300, w: 12, h: 12 }, panel: "gate", label: "cursor 1" },
    ];
    const w = new World(course({ start: { x: 100, y: 200 }, panels: [gate], hazards }));
    goTo(w, 110, 200);
    for (let i = 0; i < HOP_SHIVER + 2; i++) w.step(STILL);
    expect(w.hz[0]!.n).toBe(1);
    goTo(w, 190, 260);
    for (let i = 0; i < HOP_SHIVER + 2; i++) w.step(STILL);
    expect(w.hz[0]!.n).toBe(2);
    goTo(w, 305, 200);
    expect(types(w.step(input(0, 0, true)))).toContain("check");
    goTo(w, 106, 306);
    expect(w.step(input(0, 0, true))).toContainEqual({ type: "close", panel: "gate" });
  });

  it("the [X] can hop along the title bar, and shrink as you come near", () => {
    const w = new World(course({ start: { x: 610, y: 60 }, exit: { hops: [400], shrink: true }, gaps: [[384, 624]] }));
    goTo(w, 610, 22);
    for (let i = 0; i < HOP_SHIVER + 2; i++) w.step(STILL);
    expect(w.exitRect().x).toBeLessThan(420);
    // Round the [_] and [□] buttons, through the client area.
    goTo(w, 610, 60);
    goTo(w, 408, 60);
    goTo(w, 408, 20);
    expect(w.status).toBe("run");
    const shrunk = w.exitRect();
    expect(shrunk.w).toBeLessThan(CLOSE_BUTTON.w);
    expect(types(w.step(input(0, 0, true)))).toContain("win");
  });

  it("a checkbox in Mouse Properties sets its sabotage off (announced first)", () => {
    const w = new World(course({ checkboxes: [{ rect: { x: 120, y: 195, w: 10, h: 10 }, label: "Swap left and right", effect: { type: "invert", axes: "x" }, ticks: 600 }] }));
    const events = run(w, 1, 0, 20);
    expect(types(events)).toContain("check");
    expect(types(events)).toContain("warn");
    expect(types(run(w, 0, 0.001, WARN_TICKS + 2))).toContain("begin");
  });
});

describe("a session", () => {
  it("crashes, counts it, and starts again a moment later; a win keeps the time", () => {
    const s = new Session(course({ start: { x: 610, y: 60 }, walls: [{ x: 300, y: 32, w: 4, h: 336 }] }));
    s.step(input(-400, 0));
    expect(s.crashed).toBe(true);
    expect(s.crashes).toBe(1);
    for (let i = 0; i < CRASH_TICKS; i++) s.step(STILL);
    expect(s.crashed).toBe(false);
    expect(s.attempts).toBe(2);
    for (let i = 0; i < 20; i++) s.step(input(0, -2));
    for (let i = 0; i < 6; i++) s.step(input(1, 0));
    s.step(input(0, 0, true));
    expect(s.won).toBe(true);
    expect(s.time).toBe(27);
  });
});
