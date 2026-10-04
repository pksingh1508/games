import { describe, expect, it } from "vitest";
import { readSaveValue } from "@/engine/save";
import { defaultLastPixelSave, emptyLevel, lastPixelSaveDefinition } from "./save";

describe("the save", () => {
  it("starts empty, the logo incomplete, with honest defaults", () => {
    const save = defaultLastPixelSave();
    expect(save.levels).toEqual({});
    expect(save.finished).toBe(false);
    expect(save.prefs).toEqual({ assist: false, zoom: 3, beeps: true });
  });

  it("accepts a played save (progress and stars survive a reload), and refuses a broken one", () => {
    const played = { ...defaultLastPixelSave(), levels: { "1-01": { ...emptyLevel(), clears: 2, stars: 7, bestClean: 1500, bestHunt: 240 } }, finished: true };
    const read = (value: unknown) => readSaveValue(lastPixelSaveDefinition, JSON.stringify(value));
    expect(read(played)).toEqual({ value: played });
    expect(read({ ...played, levels: { "1-01": { ...emptyLevel(), stars: 9 } } }).problem).toBeDefined();
    expect(read({ ...played, prefs: { ...played.prefs, zoom: 7 } }).problem).toBeDefined();
  });
});
