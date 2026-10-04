import { describe, expect, it } from "vitest";
import { Accumulator } from "@/engine/loop";
import { logFromText, Player } from "@/engine/replay";
import { getMountain } from "../world";
import { ROUTES } from "../world/routes";
import { collapseSummit, CHECKPOINTS_PER_ZONE, newClimb, plantCheckpoint, resumeClimb, returnToCheckpoint, tickClimb, type Climb, type ClimbEvent } from "./climb";
import { ENGINE_VERSION, JUMP, PIP_H, RIGHT, TILE } from "./constants";
import { rowY, standAt, testMountain } from "./test-mountain";

const ticks = (m: Parameters<typeof tickClimb>[0], c: Climb, bits: number, n: number) => {
  const events: ClimbEvent[] = [];
  for (let i = 0; i < n; i++) events.push(...tickClimb(m, c, bits));
  return events;
};

describe("the climb's stats", () => {
  it("count jumps, falls and the metres lost", () => {
    const m = testMountain((put) => put(12, 20, "######"));
    const c = newClimb(m);
    standAt(c.sim, 21, 12);
    ticks(m, c, JUMP, 6);
    ticks(m, c, 0, 1);
    expect(c.stats.jumps).toBe(1);
    ticks(m, c, 0, 60);
    // Walk off the edge: 14 tiles down.
    const events = ticks(m, c, RIGHT, 160);
    const fell = events.find((e) => e.type === "fell");
    expect(fell).toMatchObject({ type: "fell", drop: 14 * TILE });
    expect(c.stats.falls).toBe(1);
    expect(c.stats.fallen).toBe(14 * TILE);
    expect(c.stats.biggest).toBe(14 * TILE);
  });

  it("little drops aren't falls", () => {
    const m = testMountain((put) => put(22, 20, "######"));
    const c = newClimb(m);
    standAt(c.sim, 21, 22);
    ticks(m, c, RIGHT, 80);
    expect(c.sim.pip.y + PIP_H).toBe(rowY(26));
    expect(c.stats.falls).toBe(0);
  });

  it("the summit's collapse is the mountain's doing, not your fall", () => {
    const m = testMountain((put) => put(10, 20, "ZZZZZZ"));
    const c = newClimb(m);
    standAt(c.sim, 21, 10);
    c.story = "credits";
    collapseSummit(c);
    expect(c.story).toBe("fallen");
    const events = ticks(m, c, 0, 200);
    expect(c.sim.pip.y + PIP_H).toBe(rowY(26));
    expect(events.some((e) => e.type === "fell")).toBe(false);
    expect(c.stats.falls).toBe(0);
    expect(c.stats.fallen).toBe(0);
    // The next fall counts again.
    expect(c.scripted).toBe(false);
  });
});

/** (A function, so TypeScript doesn't think the story can't have changed.) */
const atSummit = (c: Climb) => c.story === "summit";

describe("the whole climb", () => {
  const m = getMountain();
  const route = ROUTES.normal;

  it("splits each zone as it's first reached, in climbing order", () => {
    const c = newClimb(m);
    for (const [bits, n] of logFromText(route.up)) ticks(m, c, bits, n);
    expect(c.story).toBe("credits");
    collapseSummit(c);
    ticks(m, c, 0, route.fell);
    for (const [bits, n] of logFromText(route.down)) ticks(m, c, bits, n);
    expect(c.story).toBe("summit");
    const order = ["foothills", "rooftops", "clocktower", "cliffs", "ice", "fake-summit", "inside", "sky", "summit"] as const;
    expect(Object.keys(c.splits)).toEqual([...order]);
    const times = order.map((z) => c.splits[z]!);
    expect([...times].sort((a, b) => a - b)).toEqual(times);
    expect(c.best).toBeLessThan(m.realFlag.y + m.realFlag.h + 1);
  });

  it("a reload mid-fall carries on the very same fall", () => {
    const flat: number[] = [];
    for (const [bits, n] of logFromText(route.up)) for (let i = 0; i < n; i++) flat.push(bits);
    let checked = 0;
    for (const at of [700, 2400, 4100, 6900, 9300, 11800]) {
      const c = newClimb(m);
      for (let i = 0; i < at; i++) tickClimb(m, c, flat[i]!);
      // Find the next moment Pip is in the air, falling.
      let i = at;
      while (i < flat.length && (c.sim.pip.grounded || c.sim.pip.vy <= 0 || c.sim.pip.latch)) tickClimb(m, c, flat[i++]!);
      if (i >= flat.length) continue;
      const reloaded = resumeClimb(m, JSON.parse(JSON.stringify(c)) as Climb);
      expect(reloaded.sim).toEqual(c.sim);
      for (let k = i; k < Math.min(flat.length, i + 600); k++) {
        tickClimb(m, c, flat[k]!);
        tickClimb(m, reloaded, flat[k]!);
      }
      expect(reloaded).toEqual(c);
      checked++;
    }
    expect(checked).toBeGreaterThanOrEqual(5);
  });

  it("plays identically at 60, 120 and 144 Hz", () => {
    const playAt = (hz: number) => {
      const c = newClimb(m);
      const inputs = new Player([...logFromText(route.up), ...logFromText(route.down)]);
      const acc = new Accumulator();
      let fell = -1;
      for (let frame = 0; frame < hz * 60 * 10 && c.story !== "summit"; frame++) {
        for (let t = acc.advance(1 / hz); t > 0; t--) {
          if (c.story === "credits") {
            collapseSummit(c);
            fell = route.fell;
          }
          // The fall from the summit takes no input.
          const bits = fell > 0 ? (fell--, 0) : inputs.next();
          if (bits === null || atSummit(c)) break;
          tickClimb(m, c, bits);
        }
      }
      return c;
    };
    const results = [60, 120, 144].map(playAt);
    expect(results[0]!.story).toBe("summit");
    expect(results[1]).toEqual(results[0]);
    expect(results[2]).toEqual(results[0]);
  });
});

describe("picking a climb up again", () => {
  it("lets go of a charge in progress (that was your thumb, not Pip)", () => {
    const m = testMountain(() => {});
    const c = newClimb(m);
    ticks(m, c, JUMP, 12);
    expect(c.sim.pip.charge).toBeGreaterThan(0);
    const back = resumeClimb(m, JSON.parse(JSON.stringify(c)) as Climb);
    expect(back.sim.pip.charge).toBe(0);
    expect(back.sim.pip.grounded).toBe(true);
  });

  it("a climb from older physics goes back to where Pip last stood (nothing lost)", () => {
    const m = testMountain((put) => put(14, 20, "######"));
    const c = newClimb(m);
    standAt(c.sim, 21, 14);
    ticks(m, c, 0, 2);
    const stand = { ...c.stand };
    ticks(m, c, JUMP, 10);
    ticks(m, c, RIGHT, 8);
    expect(c.sim.pip.grounded).toBe(false);
    const old = { ...JSON.parse(JSON.stringify(c)), engine: ENGINE_VERSION - 1 } as Climb;
    const back = resumeClimb(m, old);
    expect(back.engine).toBe(ENGINE_VERSION);
    expect({ x: back.sim.pip.x, y: back.sim.pip.y }).toEqual(stand);
    expect(back.stats).toEqual(c.stats);
  });

  it("gets Pip out of rock if the map changed under it", () => {
    const m = testMountain((put) => put(20, 20, "######"));
    const c = newClimb(m);
    c.sim.pip.x = 21 * TILE;
    c.sim.pip.y = rowY(20);
    c.stand = { x: c.sim.pip.x, y: c.sim.pip.y };
    const back = resumeClimb(m, c);
    ticks(m, back, 0, 120);
    expect(back.sim.pip.grounded).toBe(true);
    expect(back.sim.pip.y + PIP_H).toBe(rowY(20));
  });
});

describe("assist checkpoints", () => {
  it("three per zone (the oldest goes), and back to the newest", () => {
    const m = testMountain(() => {});
    const c = newClimb(m);
    const spots = [6, 12, 18, 24];
    for (const col of spots) {
      standAt(c.sim, col, 26);
      ticks(m, c, 0, 1);
      expect(plantCheckpoint(m, c)).toBe(true);
    }
    expect(c.checkpoints).toHaveLength(CHECKPOINTS_PER_ZONE);
    expect(c.checkpoints.map((k) => k.x)).toEqual(spots.slice(1).map((col) => col * TILE));
    expect(c.assisted).toBe(true);
    standAt(c.sim, 40, 26);
    expect(returnToCheckpoint(c)).toBe(true);
    ticks(m, c, 0, 5);
    expect(c.sim.pip.x).toBe(24 * TILE);
  });

  it("can't be planted in the air", () => {
    const m = testMountain(() => {});
    const c = newClimb(m);
    ticks(m, c, JUMP, 20);
    ticks(m, c, 0, 5);
    expect(plantCheckpoint(m, c)).toBe(false);
  });
});
