import { describe, expect, it } from "vitest";
import { NOPE_ACHIEVEMENTS } from "./nope/achievements";
import { defaultNopeSave } from "./nope/save";
import { OTC_ACHIEVEMENTS } from "./one-tap-chaos/achievements";
import { MICROGAME_IDS, unlockedMicrogames } from "./one-tap-chaos/microgames";
import { defaultOtcSave } from "./one-tap-chaos/save";
import { summarizeProgress } from "./progress";

describe("cabinet progress", () => {
  it("summarizes a NOPE! save", () => {
    const save = defaultNopeSave();
    save.episodes["1"] = { ...save.episodes["1"], clears: 2, bestScore: 1750 };
    save.episodes["2"] = { ...save.episodes["2"], clears: 1, bestScore: 2100 };
    save.stats.nopes = 1234;
    save.achievements = { nightmare: 1 };
    expect(summarizeProgress("nope", JSON.stringify(save))).toEqual([
      { label: "Episodes cleared", value: "2/4" },
      { label: "Best score", value: "2,100" },
      { label: "NOPE'd", value: "1,234×" },
      { label: "Trophies", value: `1/${NOPE_ACHIEVEMENTS.length}` },
    ]);
  });

  it("copes with a fresh, damaged or missing save", () => {
    expect(summarizeProgress("nope", JSON.stringify(defaultNopeSave()))?.[1]).toEqual({ label: "Best score", value: "—" });
    expect(summarizeProgress("nope", "{nope")).toBeNull();
    expect(summarizeProgress("nope", null)).toBeNull();
    expect(summarizeProgress("nope", JSON.stringify({ episodes: 7 }))?.[0]).toEqual({ label: "Episodes cleared", value: "0/4" });
  });

  it("summarizes a One Tap Chaos save, with unlocks matching the game's own", () => {
    for (const best of [0, 9, 10, 25, 49, 50, 120]) {
      const save = { ...defaultOtcSave(), best, cardsUnlocked: 3, achievements: { fifty: 1, conductor: 2 } };
      expect(summarizeProgress("one-tap-chaos", JSON.stringify(save))).toEqual([
        { label: "Best score", value: best ? best.toLocaleString("en-US") : "—" },
        { label: "Microgames", value: `${unlockedMicrogames(best).length}/${MICROGAME_IDS.length}` },
        { label: "Chaos cards", value: "3/8" },
        { label: "Trophies", value: `2/${OTC_ACHIEVEMENTS.length}` },
      ]);
    }
  });

  it("has nothing to say about games without a summary", () => {
    expect(summarizeProgress("trapsprint", "{}")).toBeNull();
  });
});
