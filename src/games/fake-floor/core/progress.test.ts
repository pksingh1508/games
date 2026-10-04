import { describe, expect, it } from "vitest";
import { HIDDEN_ROOMS, ROOM_IDS } from "../rooms";
import { DEV_RUNS } from "../rooms/dev-runs";
import { defaultFakeFloorSave } from "../save";
import { formatClock, formatTime, parFor, parTicks } from "./medals";
import { medalCount, recordClear, recordFall, recordHidden, recordThrow, recordTrial, worldStats } from "./progress";

describe("falls and pebbles", () => {
  it("counts falls, and which floors lied", () => {
    let save = defaultFakeFloorSave();
    save = recordFall(save, "1-01", "fake").save;
    save = recordFall(save, "1-01", "gap").save;
    save = recordFall(save, "1-04", "crumble").save;
    expect(save.falls).toBe(3);
    expect(save.fakeFalls).toBe(1);
    expect(save.causes).toEqual({ fake: 1, gap: 1, crumble: 1 });
    expect(save.rooms["1-01"]!.falls).toBe(2);
  });

  it("Gravity Tourist at 500 falls, Trust Issues at 100 pebbles", () => {
    const save = { ...defaultFakeFloorSave(), falls: 499, thrown: 99 };
    expect(recordFall(save, "1-01", "gap").unlock).toEqual(["gravity-tourist"]);
    expect(recordThrow(save, "1-03").unlock).toEqual(["trust-issues"]);
    expect(recordThrow(defaultFakeFloorSave(), "1-03").save.rooms["1-03"]!.thrown).toBe(1);
  });

  it("Floor Inspector when every hidden pebble is found", () => {
    let save = defaultFakeFloorSave();
    expect(HIDDEN_ROOMS).toHaveLength(10);
    for (const [i, id] of HIDDEN_ROOMS.entries()) {
      const result = recordHidden(save, id);
      save = result.save;
      expect(result.unlock).toEqual(i === HIDDEN_ROOMS.length - 1 ? ["floor-inspector"] : []);
    }
  });
});

describe("clearing a room", () => {
  const par = parTicks("1-05");

  it("earns Clean (no falls), Barefoot (no pebbles) and Quick (under par), each kept once earned", () => {
    let result = recordClear(defaultFakeFloorSave(), { roomId: "1-05", ticks: par + 60, falls: 0, thrown: 2, assisted: false });
    expect(result.earned).toEqual({ clean: true, barefoot: false, quick: false });
    expect(result.fresh).toEqual(["clean"]);
    expect(result.firstClear).toBe(true);
    expect(result.save.last).toBe("1-05");
    result = recordClear(result.save, { roomId: "1-05", ticks: par, falls: 3, thrown: 0, assisted: false });
    expect(result.earned).toEqual({ clean: false, barefoot: true, quick: true });
    expect(result.fresh).toEqual(["barefoot", "quick"]);
    expect(result.save.rooms["1-05"]).toMatchObject({ clears: 2, clean: true, barefoot: true, quick: true, best: par });
    expect(medalCount(result.save, ["1-05"])).toBe(3);
  });

  it("with assist on: the room counts, but no medals or best time", () => {
    const result = recordClear(defaultFakeFloorSave(), { roomId: "1-05", ticks: 60, falls: 0, thrown: 0, assisted: true });
    expect(result.eligible).toBe(false);
    expect(result.earned).toEqual({ clean: false, barefoot: false, quick: false });
    expect(result.save.rooms["1-05"]).toMatchObject({ clears: 1, best: null, assisted: true });
  });

  it("crossing The Floor is Grounded", () => {
    expect(recordClear(defaultFakeFloorSave(), { roomId: "6-01", ticks: 2000, falls: 9, thrown: 3, assisted: false }).unlock).toEqual(["grounded"]);
  });

  it("world totals", () => {
    let save = defaultFakeFloorSave();
    save = recordFall(save, "2-01", "fake").save;
    save = recordClear(save, { roomId: "2-01", ticks: 300, falls: 1, thrown: 0, assisted: false }).save;
    expect(worldStats(save, 2)).toMatchObject({ cleared: 1, falls: 1, thrown: 0, medals: 2, best: null });
  });
});

describe("time trials", () => {
  const trial = { world: 1, total: 3600, splits: [300, 700], falls: 0, thrown: 0, assisted: false };

  it("keep the best total and its splits", () => {
    let result = recordTrial(defaultFakeFloorSave(), trial);
    expect(result.newBest).toBe(true);
    result = recordTrial(result.save, { ...trial, total: 4000, splits: [1, 2] });
    expect(result.newBest).toBe(false);
    expect(result.previous).toBe(3600);
    expect(result.save.trials["1"]).toMatchObject({ runs: 2, best: 3600, splits: [300, 700] });
  });

  it("Barefoot Champion without a pebble; Eagle Eye for the Hall of Mirrors without a fall", () => {
    expect(recordTrial(defaultFakeFloorSave(), trial).unlock).toEqual(["barefoot-champion"]);
    expect(recordTrial(defaultFakeFloorSave(), { ...trial, world: 4, thrown: 2 }).unlock).toEqual(["eagle-eye"]);
    expect(recordTrial(defaultFakeFloorSave(), { ...trial, world: 4, falls: 1, thrown: 2 }).unlock).toEqual([]);
    expect(recordTrial(defaultFakeFloorSave(), { ...trial, assisted: true }).unlock).toEqual([]);
  });
});

describe("par times", () => {
  it("a third more than the solver's run plus a second and a half, rounded up to half a second", () => {
    expect(parFor(300)).toBe(510);
    expect(parFor(301)).toBe(510);
    expect(parFor(320)).toBe(540);
  });

  it.each(ROOM_IDS)("%s has a par time comfortably above its solver run", (id) => {
    expect(parTicks(id)).toBeGreaterThan(DEV_RUNS[id]!.time + 60);
  });

  it("formats times", () => {
    expect(formatTime(498)).toBe("8.3 s");
    expect(formatClock(498)).toBe("8.3");
    expect(formatClock(3743)).toBe("1:02.4");
  });
});
