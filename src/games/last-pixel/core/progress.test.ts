import { describe, expect, it } from "vitest";
import { getLevel, LEVEL_IDS, WORLDS } from "../levels";
import { defaultLastPixelSave, type LastPixelSave } from "../save";
import { seconds } from "./constants";
import { countStars, isOpen, NET_WORTH, recordWin, starBits, starTotals } from "./progress";
import type { LevelResult } from "./world";

const result = (over: Partial<LevelResult> = {}): LevelResult => ({ ticks: seconds(40), cleanTicks: seconds(30), huntTicks: seconds(8), caughtBy: "click", netCatches: 0, outed: false, tabbed: false, assisted: false, ...over });

const cleared = (ids: readonly string[], stars = 1): LastPixelSave => {
  const save = defaultLastPixelSave();
  for (const id of ids) save.levels[id] = { clears: 1, stars, bestClean: 100, bestHunt: 100 };
  return save;
};

describe("progress", () => {
  it("keeps stars as bits, best ever", () => {
    expect(starBits([true, false, true])).toBe(5);
    expect(countStars(7)).toBe(3);
    let save = defaultLastPixelSave();
    save = recordWin(save, "1-01", result(), [true, true, false]).save;
    save = recordWin(save, "1-01", result(), [true, false, true]).save;
    expect(save.levels["1-01"]!.stars).toBe(7);
    expect(save.levels["1-01"]!.clears).toBe(2);
    expect(starTotals(save)).toEqual({ got: 3, of: LEVEL_IDS.length * 3 });
  });

  it("records the best clean-up and hunt (the hunt's best only without the assist)", () => {
    let update = recordWin(defaultLastPixelSave(), "1-02", result({ cleanTicks: 900, huntTicks: 300 }), [true, true, true]);
    expect(update.newBestClean && update.newBestHunt).toBe(true);
    update = recordWin(update.save, "1-02", result({ cleanTicks: 1200, huntTicks: 100, assisted: true }), [true, true, false]);
    expect(update.newBestClean).toBe(false);
    expect(update.newBestHunt).toBe(false);
    expect(update.save.levels["1-02"]).toMatchObject({ bestClean: 900, bestHunt: 300 });
  });

  it("earns the trophies", () => {
    const save = defaultLastPixelSave();
    expect(recordWin(save, "1-01", result({ huntTicks: seconds(1.5) }), [true, true, true]).unlock).toContain("gotcha");
    expect(recordWin(save, "1-01", result({ huntTicks: seconds(1.5), assisted: true }), [true, true, false]).unlock).not.toContain("gotcha");
    expect(recordWin(save, "3-03", result({ outed: true }), [true, false, false]).unlock).toContain("not-my-monitor");
    expect(recordWin({ ...save, stats: { ...save.stats, netCatches: NET_WORTH - 1 } }, "2-01", result({ netCatches: 1, caughtBy: "net" }), [true, true, true]).unlock).toContain("net-worth");
    expect(recordWin(save, "5-01", result(), [true, false, false]).unlock).toContain("logo-complete");
    expect(recordWin(save, "4-10", result({ tabbed: true }), [true, false, false]).unlock).toContain("tab-hunter");
    // Perfectionist: the last three stars of a world.
    const world1 = WORLDS[0]!.levels.map((l) => l.id);
    const nine = cleared(world1.slice(0, 9), 7);
    expect(recordWin(nine, world1[9]!, result(), [true, true, true]).unlock).toContain("perfectionist");
    expect(recordWin(nine, world1[9]!, result(), [true, true, false]).unlock).not.toContain("perfectionist");
  });

  it("opens the levels one after another; the finale only needs 4-09 (the tab escape's a bonus)", () => {
    expect(isOpen(defaultLastPixelSave(), "1-01")).toBe(true);
    expect(isOpen(defaultLastPixelSave(), "1-02")).toBe(false);
    expect(isOpen(cleared(["1-01"]), "1-02")).toBe(true);
    const upTo409 = cleared(LEVEL_IDS.slice(0, LEVEL_IDS.indexOf("4-09") + 1));
    expect(isOpen(upTo409, "4-10")).toBe(true);
    expect(isOpen(upTo409, "5-01")).toBe(true);
    expect(getLevel("4-10").bonus).toBe(true);
    expect(isOpen(cleared(LEVEL_IDS.slice(0, LEVEL_IDS.indexOf("4-08") + 1)), "5-01")).toBe(false);
  });
});
