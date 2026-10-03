import { describe, expect, it } from "vitest";
import { DEV_RUNS } from "../levels/dev-runs";
import { defaultTrapSprintSave } from "../save";
import { medalTimes } from "./medals";
import { DEADLY, packMark, recordClear, recordDeath, recordFakeHop, recordZoneRun, unpackMark } from "./progress";

const clear = (levelId: string, ticks: number, extra: Partial<Parameters<typeof recordClear>[1]> = {}) => ({
  levelId,
  ticks,
  coins: 0,
  deaths: 0,
  assisted: false,
  fromCheckpoint: false,
  ...extra,
});

describe("progress", () => {
  it("counts deaths per level and per cause, and keeps where they happened", () => {
    let save = defaultTrapSprintSave();
    save = recordDeath(save, "1-01", "popSpikes", 100, 200).save;
    save = recordDeath(save, "1-01", "pit", 300, 400).save;
    expect(save.deaths).toBe(2);
    expect(save.causes).toEqual({ popSpikes: 1, pit: 1 });
    expect(save.levels["1-01"]!.deaths).toBe(2);
    expect(save.levels["1-01"]!.marks.map(unpackMark)).toEqual([
      { x: 100, y: 200 },
      { x: 300, y: 271 },
    ]);
    expect(unpackMark(packMark(479, 0))).toEqual({ x: 479, y: 0 });
  });

  it("unlocks the death achievements", () => {
    let save = defaultTrapSprintSave();
    let unlocked: string[] = [];
    for (let i = 0; i < 10; i++) {
      const result = recordDeath(save, "1-01", "spikes", 0, 0);
      save = result.save;
      unlocked = result.unlock;
    }
    expect(unlocked).toContain("fresh-meat");
    for (const kind of DEADLY) save = recordDeath(save, "1-01", kind, 0, 0).save;
    expect(recordDeath(save, "1-01", "pit", 0, 0).unlock).toContain("collector");
  });

  it("awards medals, keeps the best one and spots a first-try clear", () => {
    const dev = DEV_RUNS["1-01"]!.ticks;
    const first = recordClear(defaultTrapSprintSave(), clear("1-01", medalTimes("1-01").silver));
    expect(first.medal).toBe("silver");
    expect(first.newBest).toBe(true);
    expect(first.unlock).toContain("read-the-room");
    const second = recordClear(first.save, clear("1-01", dev, { deaths: 3 }));
    expect(second.medal).toBe("dev");
    expect(second.unlock).toEqual(["speed-demon"]);
    const third = recordClear(second.save, clear("1-01", dev + 100));
    expect(third.newBest).toBe(false);
    expect(third.save.levels["1-01"]!.medal).toBe("dev");
    expect(third.save.levels["1-01"]!.best).toBe(dev);
  });

  it("doesn't give medals to assisted or checkpoint runs, but still counts the clear", () => {
    const assisted = recordClear(defaultTrapSprintSave(), clear("1-02", 100, { assisted: true }));
    expect(assisted.medal).toBeNull();
    expect(assisted.newBest).toBe(false);
    expect(assisted.save.levels["1-02"]).toMatchObject({ clears: 1, best: null, assisted: true });
    const checkpoint = recordClear(defaultTrapSprintSave(), clear("3-02", 100, { fromCheckpoint: true }));
    expect(checkpoint.eligible).toBe(false);
  });

  it("counts painted-spike hops for Paranoid", () => {
    let save = defaultTrapSprintSave();
    let unlock: string[] = [];
    for (let i = 0; i < 20; i++) ({ save, unlock } = recordFakeHop(save));
    expect(unlock).toEqual(["paranoid"]);
  });

  it("keeps the best zone speedrun and its splits", () => {
    const first = recordZoneRun(defaultTrapSprintSave(), { zone: "1", total: 4000, splits: [400, 800], deaths: 2, assisted: false });
    expect(first.newBest).toBe(true);
    expect(first.unlock).toEqual([]);
    const second = recordZoneRun(first.save, { zone: "1", total: 3000, splits: [300, 600], deaths: 0, assisted: false });
    expect(second.unlock).toEqual(["untouchable"]);
    expect(second.save.zoneRuns["1"]).toEqual({ runs: 2, best: 3000, splits: [300, 600], deathless: true });
  });
});
