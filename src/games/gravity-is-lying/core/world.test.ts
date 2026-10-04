import { describe, expect, it } from "vitest";
import { FLIP, HUM_TICKS, JUMP, LEFT, NEWT, RIGHT, TILE } from "./constants";
import { along, DIRS, toLocal, toWorld, VEC, vecToLocal, vecToWorld, type Dir } from "./gravity";
import { buildRoom, type RoomSource } from "./room";
import { ORBITAL_REST_TICKS } from "./orbit";
import { createWorld, step, type World, type WorldEvent } from "./world";

/** A 30 × 17 room: walls all round, the inside drawn by the test. */
function room(draw: (put: (row: number, col: number, text: string) => void) => void, extra: Partial<RoomSource> = {}) {
  const grid: string[][] = Array.from({ length: 17 }, (_, r) => Array.from({ length: 30 }, (_, c) => (r === 0 || r === 16 || c === 0 || c === 29 ? "#" : ".")));
  const put = (row: number, col: number, text: string) => {
    for (let i = 0; i < text.length; i++) grid[row]![col + i] = text[i]!;
  };
  put(14, 27, "O");
  put(1, 1, "aaa");
  draw(put);
  return buildRoom({ id: "t", name: "Test", gravity: "down", ...extra, map: grid.map((r) => r.join("")) }, 1, 0);
}

const run = (w: World, bits: number, ticks: number) => {
  const events: WorldEvent[] = [];
  for (let i = 0; i < ticks; i++) events.push(...step(w, bits));
  return events;
};

describe("gravity frames", () => {
  const size = { w: 480, h: 272 };
  it.each(DIRS)("%s: down and along the floor come back right, and boxes go there and back", (d: Dir) => {
    expect(vecToWorld(d, { x: 0, y: 1 })).toEqual(VEC[d]);
    expect(vecToWorld(d, { x: 1, y: 0 })).toEqual(along(d));
    for (const v of [{ x: 3, y: -2 }, { x: -1.5, y: 0.25 }]) expect(vecToWorld(d, vecToLocal(d, v))).toEqual(v);
    const box = { x: 37, y: 101, w: 12, h: 12 };
    expect(toWorld(d, toLocal(d, box, size), size)).toEqual(box);
    // Moving along local "down" moves the box the way gravity pulls.
    const local = toLocal(d, box, size);
    const moved = toWorld(d, { ...local, y: local.y + 1 }, size);
    expect({ x: moved.x - box.x, y: moved.y - box.y }).toEqual(VEC[d]);
  });
});

describe("Newt", () => {
  it.each([
    ["down", (w: World) => w.newt.y + NEWT === 16 * TILE],
    ["up", (w: World) => w.newt.y === TILE],
    ["left", (w: World) => w.newt.x === TILE],
    ["right", (w: World) => w.newt.x + NEWT === 29 * TILE],
  ] as const)("falls %s until it lands", (dir, landed) => {
    const w = createWorld(room((put) => put(8, 14, "S"), { gravity: dir as Dir }));
    run(w, 0, 120);
    expect(landed(w)).toBe(true);
    expect(w.newt.grounded).toBe(true);
    expect(w.newt.gravity).toBe(dir);
  });

  it("walks along whatever it stands on (right is a quarter turn clockwise from its up)", () => {
    for (const dir of DIRS) {
      const w = createWorld(room((put) => put(8, 14, "S"), { gravity: dir }));
      run(w, 0, 100);
      const x0 = w.newt.x;
      const y0 = w.newt.y;
      run(w, RIGHT, 20);
      const a = along(dir);
      expect(Math.sign(w.newt.x - x0)).toBe(a.x);
      expect(Math.sign(w.newt.y - y0)).toBe(a.y);
    }
  });

  it("jumps away from the floor, about three tiles", () => {
    for (const dir of DIRS) {
      const w = createWorld(room((put) => put(8, 14, "S"), { gravity: dir }));
      run(w, 0, 100);
      const start = { x: w.newt.x, y: w.newt.y };
      let far = 0;
      for (let i = 0; i < 60; i++) {
        step(w, JUMP);
        far = Math.max(far, -(w.newt.x - start.x) * VEC[dir].x - (w.newt.y - start.y) * VEC[dir].y);
      }
      expect(far).toBeGreaterThan(2.6 * TILE);
      expect(far).toBeLessThan(3.6 * TILE);
    }
  });
});

describe("what changes gravity", () => {
  it("a lever sets the room's gravity when you walk into it (once per touch)", () => {
    const w = createWorld(room((put) => put(15, 3, "S..L"), { levers: ["up"] }));
    const events = run(w, RIGHT, 60);
    expect(events.filter((e) => e.type === "lever")).toEqual([{ type: "lever", index: 0, dir: "up" }]);
    run(w, 0, 90);
    expect(w.newt.gravity).toBe("up");
    expect(w.newt.y).toBe(TILE);
  });

  it("a zone pulls its own way while you're in it", () => {
    const w = createWorld(room((put) => put(15, 3, "S"), { zones: [{ area: [6, 1, 8, 15], dir: "up" }] }));
    run(w, RIGHT, 30);
    run(w, 0, 60);
    expect(w.newt.gravity).toBe("up");
    expect(w.newt.y).toBe(TILE);
    expect(w.gravity).toBe("down");
  });

  it("the player's flip: only standing on something, outside zones", () => {
    const w = createWorld(room((put) => put(15, 4, "S"), { flip: true, zones: [{ area: [20, 1, 4, 15], dir: "left" }] }));
    run(w, 0, 10);
    const flipped = run(w, FLIP, 1);
    expect(flipped.some((e) => e.type === "flip")).toBe(true);
    expect(w.gravity).toBe("up");
    // In the air: no flip.
    run(w, 0, 6);
    expect(run(w, FLIP, 1).some((e) => e.type === "noFlip")).toBe(true);
    run(w, 0, 80);
    expect(w.newt.y).toBe(TILE);
  });

  it("timed turns are announced by the hum at least 0.75 s before", () => {
    const w = createWorld(room((put) => put(15, 4, "S"), { rotate: { every: 180, turn: "cw" } }));
    const events: Array<WorldEvent & { tick: number }> = [];
    for (let i = 0; i < 400; i++) for (const e of step(w, 0)) events.push({ ...e, tick: w.tick });
    const hums = events.filter((e) => e.type === "hum");
    const turns = events.filter((e) => e.type === "turn");
    expect(turns.map((t) => t.tick)).toEqual([180, 360]);
    expect(hums.map((h) => h.tick)).toEqual([180 - HUM_TICKS, 360 - HUM_TICKS]);
    expect(turns.map((t) => (t as { to: Dir }).to)).toEqual(["left", "up"]);
  });

  it("never pushes Newt into a wall, whatever changes", () => {
    const w = createWorld(
      room((put) => {
        put(15, 3, "S..L.L..L");
        put(10, 10, "####");
        put(5, 18, "#..#");
      }, { levers: ["left", "up", "right"], flip: true, zones: [{ area: [14, 3, 5, 6], dir: "right" }], rotate: { every: 97, turn: "ccw" } }),
    );
    const grid = w.room;
    const solid = (x: number, y: number) => grid.cells[Math.floor(y / TILE) * grid.cols + Math.floor(x / TILE)] === 1;
    for (let i = 0; i < 3000 && w.status === "play"; i++) {
      const bits = [RIGHT, RIGHT | JUMP, LEFT, FLIP, JUMP, 0, LEFT | JUMP][Math.floor(i / 23) % 7]!;
      step(w, bits);
      const n = w.newt;
      for (const [x, y] of [
        [n.x, n.y],
        [n.x + NEWT - 1, n.y],
        [n.x, n.y + NEWT - 1],
        [n.x + NEWT - 1, n.y + NEWT - 1],
      ] as const)
        expect(solid(x, y)).toBe(false);
    }
  });
});

describe("hazards and the way out", () => {
  it("spikes end the attempt; a safety net puts you back where you stood", () => {
    const w = createWorld(room((put) => put(15, 3, "S...^^^")));
    const events = run(w, RIGHT, 80);
    expect(events.some((e) => e.type === "death" && e.cause === "spikes")).toBe(true);
    expect(w.status).toBe("dead");
    const n = createWorld(room((put) => put(15, 3, "S...^^^"), { net: true }));
    const caught = run(n, RIGHT, 30);
    expect(caught.some((e) => e.type === "net")).toBe(true);
    expect(n.status).toBe("play");
  });

  it("falling out of the room ends the attempt", () => {
    const w = createWorld(room((put) => {
      put(16, 2, "......");
      put(15, 3, "S");
    }));
    const events = run(w, 0, 120);
    expect(events.some((e) => e.type === "death" && e.cause === "out")).toBe(true);
  });

  it("apples, then the portal", () => {
    const w = createWorld(room((put) => put(15, 1, "S")));
    const got: WorldEvent[] = [];
    for (const a of w.room.apples) {
      w.newt.x = a.x;
      w.newt.y = a.y;
      got.push(...step(w, 0));
    }
    expect(got.filter((e) => e.type === "apple")).toHaveLength(3);
    w.newt.x = 27 * TILE;
    w.newt.y = 14 * TILE;
    expect(run(w, 0, 2).some((e) => e.type === "win")).toBe(true);
    expect(w.status).toBe("won");
  });
});

describe("planets", () => {
  const space = (planets: RoomSource["planets"], extra: Partial<RoomSource> = {}) =>
    buildRoom(
      { id: "o", name: "Orbit", gravity: "down", planets, spawn: { x: 240, y: 90 }, portal: { x: 460, y: 20 }, apples: [{ x: 20, y: 20 }, { x: 30, y: 20 }, { x: 40, y: 20 }], ...extra },
      5,
      0,
    );

  it("pull you to their surface, and you can walk all the way round", () => {
    const r = space([{ x: 240, y: 150, r: 40 }]);
    const w = createWorld(r);
    run(w, 0, 90);
    expect(w.orbit!.standing).toBe(0);
    expect(Math.hypot(w.orbit!.x - 240, w.orbit!.y - 150)).toBeCloseTo(46, 0);
    let swept = 0;
    let last = Math.atan2(w.orbit!.y - 150, w.orbit!.x - 240);
    for (let i = 0; i < 600; i++) {
      step(w, RIGHT);
      const a = Math.atan2(w.orbit!.y - 150, w.orbit!.x - 240);
      let d = a - last;
      if (d > Math.PI) d -= 2 * Math.PI;
      if (d < -Math.PI) d += 2 * Math.PI;
      swept += d;
      last = a;
      expect(w.orbit!.standing).toBe(0);
    }
    expect(Math.abs(swept)).toBeGreaterThan(2 * Math.PI);
  });

  it("Orbital: a third different planet in a row, hopping (lingering on one starts the count again)", () => {
    const planets = [
      { x: 80, y: 150, r: 20 },
      { x: 240, y: 150, r: 20 },
      { x: 400, y: 150, r: 20 },
    ];
    // Two planets already, then a drop onto the third.
    const hop = createWorld(space(planets, { spawn: { x: 400, y: 115 } }));
    hop.orbit!.chain = [0, 1];
    expect(run(hop, 0, 60).some((e) => e.type === "orbital")).toBe(true);
    // The same, but a rest on the second planet first: no Orbital.
    const rest = createWorld(space(planets, { spawn: { x: 240, y: 115 } }));
    rest.orbit!.chain = [0];
    run(rest, 0, 40 + ORBITAL_REST_TICKS);
    expect(rest.orbit!.chain).toEqual([1]);
  });

  it("painted planets pull nothing (you drift past them)", () => {
    const w = createWorld(space([{ x: 240, y: 150, r: 40, fake: true }]));
    const events = run(w, 0, 200);
    expect(w.orbit!.standing).toBe(-1);
    expect(events.some((e) => e.type === "death" && e.cause === "out")).toBe(false);
    expect(w.orbit!.y).toBe(90);
  });
});
