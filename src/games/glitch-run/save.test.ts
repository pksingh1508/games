import { describe, expect, it } from "vitest";
import { readSaveValue } from "@/engine/save";
import { defaultGlitchSave, emptyStage, glitchSaveDefinition } from "./save";

describe("the save", () => {
  it("starts empty, with the beat bar on and nothing gentle", () => {
    const save = defaultGlitchSave();
    expect(save.stages).toEqual({});
    expect(save.warned).toBe(false);
    expect(save.ending).toBeNull();
    expect(save.prefs).toEqual({ gentle: false, beatBar: true, touchSwap: false, keys: null });
  });

  it("accepts a played save, and refuses a broken one", () => {
    const played = {
      ...defaultGlitchSave(),
      stages: { "01": { ...emptyStage(), clears: 2, best: 4200, clean: true } },
      daily: { "2026-10-04": { best: 1200, metres: 300, runs: 3 } },
      warned: true,
      ending: "wontfix" as const,
    };
    const read = (value: unknown) => readSaveValue(glitchSaveDefinition, JSON.stringify(value));
    expect(read(played)).toEqual({ value: played });
    expect(read({ ...played, stages: { "01": { ...emptyStage(), clears: -1 } } }).problem).toBeDefined();
    expect(read({ ...played, ending: "deleted" }).problem).toBeDefined();
    expect(read({ ...played, prefs: { ...played.prefs, gentle: "yes" } }).problem).toBeDefined();
  });
});
