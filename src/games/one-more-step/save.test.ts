import { describe, expect, it } from "vitest";
import { readSaveValue } from "@/engine/save";
import { defaultOmsSave, emptyLevel, omsSaveDefinition } from "./save";

describe("the save", () => {
  it("starts empty, with the Start button yet to hop", () => {
    const save = defaultOmsSave();
    expect(save.levels).toEqual({});
    expect(save.hopped).toBe(false);
    expect(save.finished).toBe(false);
    expect(save.prefs).toEqual({ dpad: false, swipe: 24, coords: false });
  });

  it("accepts a played save (stars, best steps and stats survive a reload), and refuses a broken one", () => {
    const played = { ...defaultOmsSave(), levels: { "1-1": { ...emptyLevel(), clears: 2, stars: 7, best: 6 } }, hopped: true, stats: { steps: 1234, undos: 3, deaths: 2, echoDeaths: 1, resets: 7 } };
    const read = (value: unknown) => readSaveValue(omsSaveDefinition, JSON.stringify(value));
    expect(read(played)).toEqual({ value: played });
    expect(read({ ...played, levels: { "1-1": { ...emptyLevel(), stars: 9 } } }).problem).toBeDefined();
    expect(read({ ...played, prefs: { ...played.prefs, swipe: 80 } }).problem).toBeDefined();
    expect(read({ ...played, stats: { ...played.stats, steps: -1 } }).problem).toBeDefined();
  });
});
