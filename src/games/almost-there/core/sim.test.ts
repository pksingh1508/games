import { describe, expect, it } from "vitest";
import { BOUNCE, CHARGE_MAX, CRUMBLE_TICKS, ICE_FRICTION, JUMP, JUMP_VX, LEFT, MUSHROOM_VY, PIP_H, RESPAWN_TICKS, RIGHT, SNOW, STUN_TICKS } from "./constants";
import { isSolidTile, T, tileAt } from "./mountain";
import { cloneClimb, collapse, createClimb, step, type ClimbState, type SimEvent } from "./sim";
import { rowY, standAt, testMountain } from "./test-mountain";
import type { Mountain } from "./mountain";

const run = (m: Mountain, s: ClimbState, bits: number, ticks: number) => {
  const events: SimEvent[] = [];
  for (let i = 0; i < ticks; i++) events.push(...step(m, s, bits));
  return events;
};

/** Charge for `charge` ticks and let go holding `dir` (a full charge goes by itself on the next tick). */
const jump = (m: Mountain, s: ClimbState, charge: number, dir = 0) => {
  run(m, s, JUMP | dir, charge);
  return step(m, s, charge < CHARGE_MAX ? dir : JUMP | dir);
};

const untilGrounded = (m: Mountain, s: ClimbState, limit = 600) => {
  let peak = s.pip.y + s.pip.h;
  const events: SimEvent[] = [];
  for (let i = 0; i < limit && !s.pip.grounded; i++) {
    events.push(...step(m, s, 0));
    peak = Math.min(peak, s.pip.y + s.pip.h);
  }
  return { peak, events };
};

describe("charge jumps", () => {
  const m = testMountain(() => {});

  it("go higher the longer you charge: about one tile to nine and a half", () => {
    const heights = [1, 18, CHARGE_MAX].map((charge) => {
      const s = createClimb(m);
      standAt(s, 20, 26);
      jump(m, s, charge);
      const { peak } = untilGrounded(m, s);
      return rowY(26) - peak;
    });
    expect(heights[0]).toBeGreaterThanOrEqual(7);
    expect(heights[0]).toBeLessThanOrEqual(10);
    expect(heights[1]).toBeGreaterThan(heights[0]!);
    expect(heights[2]).toBeGreaterThan(heights[1]!);
    expect(heights[2]).toBeGreaterThanOrEqual(72);
    expect(heights[2]).toBeLessThanOrEqual(78);
  });

  it("a full charge goes by itself", () => {
    const s = createClimb(m);
    standAt(s, 20, 26);
    const events = run(m, s, JUMP, CHARGE_MAX + 1);
    expect(events.some((e) => e.type === "jump")).toBe(true);
    expect(s.pip.grounded).toBe(false);
    // Still holding jump after landing doesn't charge again: let go first.
    run(m, s, JUMP, 150);
    expect(s.pip.grounded).toBe(true);
    expect(s.pip.charge).toBe(0);
    run(m, s, 0, 1);
    run(m, s, JUMP, 3);
    expect(s.pip.charge).toBeGreaterThan(0);
  });

  it("go the way you hold as you let go (or straight up)", () => {
    const s = createClimb(m);
    standAt(s, 20, 26);
    run(m, s, JUMP, 10);
    step(m, s, RIGHT);
    expect(s.pip.vx).toBe(JUMP_VX);
    const t = createClimb(m);
    standAt(t, 20, 26);
    run(m, t, JUMP | LEFT, 10);
    step(m, t, 0);
    expect(t.pip.vx).toBe(0);
    expect(t.pip.facing).toBe(-1);
  });

  it("can't be steered in the air", () => {
    const s = createClimb(m);
    standAt(s, 20, 26);
    jump(m, s, 20, RIGHT);
    run(m, s, LEFT, 10);
    expect(s.pip.vx).toBe(JUMP_VX);
  });
});

describe("walls and ceilings", () => {
  it("a wall sends you back at half speed", () => {
    const m = testMountain((put) => {
      for (let r = 10; r <= 25; r++) put(r, 26, "#");
    });
    const s = createClimb(m);
    standAt(s, 22, 26);
    jump(m, s, 12, RIGHT);
    const { events } = untilGrounded(m, s);
    expect(events.some((e) => e.type === "bounce")).toBe(true);
    expect(s.pip.x).toBeLessThan(26 * 8 - 8);
  });

  it("the bounce is half the speed you hit with", () => {
    const m = testMountain((put) => {
      for (let r = 10; r <= 25; r++) put(r, 26, "#");
    });
    const s = createClimb(m);
    standAt(s, 22, 26);
    jump(m, s, 12, RIGHT);
    for (let i = 0; i < 60; i++) {
      const events = step(m, s, 0);
      if (events.some((e) => e.type === "bounce")) break;
    }
    expect(s.pip.vx).toBeCloseTo(-JUMP_VX * BOUNCE);
  });

  it("a ceiling stops you", () => {
    const m = testMountain((put) => put(22, 15, "########"));
    const s = createClimb(m);
    standAt(s, 17, 26);
    const events = [...jump(m, s, CHARGE_MAX - 1)];
    for (let i = 0; i < 20; i++) events.push(...step(m, s, 0));
    expect(events.some((e) => e.type === "bonk")).toBe(true);
    expect(s.pip.y).toBeGreaterThanOrEqual(rowY(23));
  });
});

describe("surfaces", () => {
  it("ice keeps you sliding after you let go", () => {
    const m = testMountain((put) => put(26, 4, "~".repeat(40)));
    const s = createClimb(m);
    standAt(s, 10, 26);
    run(m, s, RIGHT, 40);
    const speed = s.pip.vx;
    expect(speed).toBeGreaterThan(0.5);
    const x = s.pip.x;
    run(m, s, 0, 10);
    expect(s.pip.x).toBeGreaterThan(x + 3);
    expect(s.pip.vx).toBeCloseTo(Math.max(0, speed - 10 * ICE_FRICTION), 5);
    // On rock you stop at once.
    const rock = testMountain(() => {});
    const t = createClimb(rock);
    standAt(t, 10, 26);
    run(rock, t, RIGHT, 40);
    run(rock, t, 0, 1);
    expect(t.pip.vx).toBe(0);
  });

  it("snow makes a charged jump 15% weaker", () => {
    const snow = testMountain((put) => put(26, 4, "*".repeat(40)));
    const rock = testMountain(() => {});
    const speeds = [snow, rock].map((m) => {
      const s = createClimb(m);
      standAt(s, 20, 26);
      run(m, s, JUMP, CHARGE_MAX + 1);
      return s.pip.vy - 0.2;
    });
    expect(speeds[0]! / speeds[1]!).toBeCloseTo(SNOW, 5);
  });

  it("crumbling ledges go a second after you land, and come back three seconds later", () => {
    const m = testMountain((put) => put(20, 10, "%%%%%%"));
    const s = createClimb(m);
    standAt(s, 11, 20);
    const at = 20 * m.tileCols + 11 + (rowY(0) / 8) * m.tileCols;
    run(m, s, 0, CRUMBLE_TICKS - 2);
    expect(s.pip.grounded).toBe(true);
    const events = run(m, s, 0, 4);
    expect(events.some((e) => e.type === "crumble" && e.phase === "break")).toBe(true);
    expect(s.pip.grounded).toBe(false);
    untilGrounded(m, s);
    expect(s.pip.y + PIP_H).toBe(rowY(26));
    const back = run(m, s, 0, RESPAWN_TICKS + 5);
    expect(back.some((e) => e.type === "crumble" && e.phase === "back")).toBe(true);
    expect(s.crumbles.find(([tile]) => tile === at)).toBeUndefined();
  });

  it("clouds hold you from above only, then vanish", () => {
    const m = testMountain((put) => put(20, 15, "cccccc"));
    const s = createClimb(m);
    standAt(s, 17, 26);
    jump(m, s, CHARGE_MAX - 1);
    untilGrounded(m, s);
    // Through it from below, and onto it from above.
    expect(s.pip.y + PIP_H).toBe(rowY(20));
    run(m, s, 0, CRUMBLE_TICKS + 2);
    expect(s.pip.grounded).toBe(false);
  });

  it("a mushroom throws you up once (land on it again and you stay)", () => {
    const m = testMountain((put) => put(26, 20, "mmm"));
    const s = createClimb(m);
    s.pip.x = 20 * 8 + 4;
    s.pip.y = rowY(18);
    s.pip.grounded = false;
    const events: SimEvent[] = [];
    for (let i = 0; i < 400; i++) events.push(...step(m, s, 0));
    expect(events.filter((e) => e.type === "mushroom")).toHaveLength(1);
    expect(s.pip.grounded).toBe(true);
    expect(s.pip.y + PIP_H).toBe(rowY(26));
    // A jump from it bounces again when it lands back on it.
    const again = [...jump(m, s, 6)];
    for (let i = 0; i < 60; i++) again.push(...step(m, s, 0));
    expect(again.some((e) => e.type === "mushroom")).toBe(true);
    expect(s.pip.vy === 0 || s.pip.vy < MUSHROOM_VY).toBe(true);
  });
});

describe("the express elevator", () => {
  it("waits half a second, then takes you down (and comes back for the next one)", () => {
    const m = testMountain((put) => put(20, 30, "EEEE"), { elevatorDrop: 40 });
    const s = createClimb(m);
    standAt(s, 31, 20);
    const events = run(m, s, 0, 31);
    expect(events.some((e) => e.type === "elevator" && e.phase === "down")).toBe(true);
    run(m, s, 0, 40);
    expect(s.elevators[0]!.phase).toBe("bottom");
    expect(s.pip.y + PIP_H).toBe(rowY(20) + 40);
    expect(s.pip.grounded).toBe(true);
    // Step off: after two seconds it goes back up.
    run(m, s, RIGHT, 40);
    run(m, s, 0, 150);
    expect(s.elevators[0]!.offset).toBe(0);
  });
});

describe("falling", () => {
  it("a long fall ends in a faceplant (no jumping until you're up)", () => {
    const m = testMountain(() => {});
    const s = createClimb(m);
    s.pip.x = 100;
    s.pip.y = rowY(1);
    s.pip.grounded = false;
    s.pip.takeoff = s.pip.y + PIP_H;
    s.pip.peak = s.pip.y + PIP_H;
    const { events } = untilGrounded(m, s);
    expect(events.some((e) => e.type === "stun")).toBe(true);
    expect(events.find((e) => e.type === "fall")).toMatchObject({ drop: rowY(26) - rowY(1) - PIP_H });
    expect(s.pip.stun).toBe(STUN_TICKS - 0);
    run(m, s, JUMP, 5);
    expect(s.pip.charge).toBe(0);
    run(m, s, 0, STUN_TICKS);
    run(m, s, JUMP, 3);
    expect(s.pip.charge).toBeGreaterThan(0);
  });
});

describe("the summit's fall", () => {
  it("takes its ledge and the cave's seal with it", () => {
    const m = testMountain((put) => {
      put(20, 10, "ZZZZZZ");
      put(10, 30, "XX");
    });
    const s = createClimb(m);
    standAt(s, 11, 20);
    run(m, s, 0, 5);
    expect(s.pip.grounded).toBe(true);
    const z = tileAt(m, 11, rowY(20) / 8);
    expect(z).toBe(T.SUMMIT);
    expect(isSolidTile(z, false)).toBe(true);
    collapse(s);
    expect(isSolidTile(z, true)).toBe(false);
    expect(isSolidTile(T.SEAL, true)).toBe(false);
    untilGrounded(m, s);
    expect(s.pip.y + PIP_H).toBe(rowY(26));
  });
});

describe("things to touch", () => {
  it("a feather once, a flag once", () => {
    const m = testMountain((put) => put(25, 12, "F"));
    const s = createClimb(m);
    standAt(s, 9, 26);
    const events = run(m, s, RIGHT, 40);
    expect(events.filter((e) => e.type === "feather")).toHaveLength(1);
    expect(s.feathers).toBe(1);
  });
});

describe("determinism", () => {
  it("the same inputs give the same climb, and a copy carries on the same", () => {
    const m = testMountain((put) => {
      put(20, 10, "%%%%%%");
      put(15, 25, "######");
      put(26, 30, "~~~~~~");
    });
    const inputs = Array.from({ length: 900 }, (_, i) => [0, RIGHT, JUMP, JUMP | RIGHT, LEFT, JUMP | LEFT][Math.floor((i * 7919) / 37) % 6]!);
    const a = createClimb(m);
    const b = createClimb(m);
    for (const bits of inputs.slice(0, 450)) {
      step(m, a, bits);
      step(m, b, bits);
    }
    const c = JSON.parse(JSON.stringify(cloneClimb(a))) as ClimbState;
    for (const bits of inputs.slice(450)) {
      step(m, a, bits);
      step(m, b, bits);
      step(m, c, bits);
    }
    expect(b).toEqual(a);
    expect(c).toEqual(a);
  });
});
