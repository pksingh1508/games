import { describe, expect, it } from "vitest";
import { FAKE_FLOOR_ACHIEVEMENTS } from "./fake-floor/achievements";
import { ROOM_IDS } from "./fake-floor/rooms";
import { defaultFakeFloorSave, emptyRoomRecord } from "./fake-floor/save";
import { NOPE_ACHIEVEMENTS } from "./nope/achievements";
import { defaultNopeSave } from "./nope/save";
import { OTC_ACHIEVEMENTS } from "./one-tap-chaos/achievements";
import { MICROGAME_IDS, unlockedMicrogames } from "./one-tap-chaos/microgames";
import { defaultOtcSave } from "./one-tap-chaos/save";
import { summarizeProgress } from "./progress";
import { TRAPSPRINT_ACHIEVEMENTS } from "./trapsprint/achievements";
import { MAIN_LEVELS } from "./trapsprint/levels";
import { defaultTrapSprintSave, emptyLevelRecord } from "./trapsprint/save";

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

  it("summarizes a TrapSprint save (Remix levels don't count toward the 30)", () => {
    const save = defaultTrapSprintSave();
    save.levels["1-01"] = { ...emptyLevelRecord(), clears: 3, medal: "dev" };
    save.levels["1-02"] = { ...emptyLevelRecord(), clears: 1, medal: "gold" };
    save.levels["1-03"] = { ...emptyLevelRecord(), clears: 1, medal: "silver" };
    save.levels["1-04"] = { ...emptyLevelRecord(), deaths: 9 };
    save.levels["R1-01"] = { ...emptyLevelRecord(), clears: 1, medal: "gold" };
    save.deaths = 4321;
    save.achievements = { "fresh-meat": 1 };
    expect(summarizeProgress("trapsprint", JSON.stringify(save))).toEqual([
      { label: "Levels cleared", value: `3/${MAIN_LEVELS.length}` },
      { label: "Gold medals", value: `2/${MAIN_LEVELS.length}` },
      { label: "Deaths", value: "4,321" },
      { label: "Trophies", value: `1/${TRAPSPRINT_ACHIEVEMENTS.length}` },
    ]);
  });

  it("summarizes a Fake Floor save (three medals a room)", () => {
    const save = defaultFakeFloorSave();
    save.rooms["1-01"] = { ...emptyRoomRecord(), clears: 2, clean: true, barefoot: true, quick: true };
    save.rooms["1-02"] = { ...emptyRoomRecord(), clears: 1, barefoot: true };
    save.rooms["6-01"] = { ...emptyRoomRecord(), clears: 1 };
    save.rooms["1-03"] = { ...emptyRoomRecord(), falls: 12 };
    save.falls = 2048;
    save.achievements = { "trust-issues": 1, grounded: 2 };
    expect(summarizeProgress("fake-floor", JSON.stringify(save))).toEqual([
      { label: "Rooms crossed", value: `3/${ROOM_IDS.length}` },
      { label: "Medals", value: `4/${ROOM_IDS.length * 3}` },
      { label: "Falls", value: "2,048" },
      { label: "Trophies", value: `2/${FAKE_FLOOR_ACHIEVEMENTS.length}` },
    ]);
  });

  it("has nothing to say about games without a summary", () => {
    expect(summarizeProgress("glitch-run", "{}")).toBeNull();
  });
});
