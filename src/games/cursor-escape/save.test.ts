import { describe, expect, it } from "vitest";
import { readSaveValue } from "@/engine/save";
import { cursorSaveDefinition, defaultCursorSave, emptyLevel } from "./save";

describe("the save", () => {
  it("starts empty, uncalibrated, with honest defaults", () => {
    const save = defaultCursorSave();
    expect(save.levels).toEqual({});
    expect(save.calibrated).toBe(false);
    expect(save.prefs).toEqual({ sensitivity: 1, trackpadSensitivity: 1.2, trackpad: false, raw: false, steady: false, assist: false });
  });

  it("accepts a played save, and refuses a broken one", () => {
    const played = { ...defaultCursorSave(), levels: { "C-01": { ...emptyLevel(), clears: 2, best: 312, medal: "gold" as const, clean: true } }, crashes: 41, calibrated: true, finished: true };
    const read = (value: unknown) => readSaveValue(cursorSaveDefinition, JSON.stringify(value));
    expect(read(played)).toEqual({ value: played });
    expect(read({ ...played, levels: { "C-01": { ...emptyLevel(), medal: "platinum" } } }).problem).toBeDefined();
    expect(read({ ...played, prefs: { ...played.prefs, sensitivity: 50 } }).problem).toBeDefined();
  });
});
