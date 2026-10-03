import { describe, expect, it } from "vitest";
import { readSaveValue } from "./save/define-save";
import { DEFAULT_SETTINGS, settingsDefinition } from "./settings";

describe("settings", () => {
  it("upgrades a v1 save and keeps every choice", () => {
    const v1: Record<string, unknown> = { ...DEFAULT_SETTINGS, v: 1, sound: false, textSize: "xl", colorblind: "tritanopia" };
    delete v1.tapOffsetMs;
    const { value, problem } = readSaveValue(settingsDefinition, JSON.stringify(v1));
    expect(problem).toBeUndefined();
    expect(value).toEqual({ ...DEFAULT_SETTINGS, sound: false, textSize: "xl", colorblind: "tritanopia", tapOffsetMs: null });
  });

  it("accepts a calibrated tap offset and rejects a silly one", () => {
    const ok = readSaveValue(settingsDefinition, JSON.stringify({ ...DEFAULT_SETTINGS, tapOffsetMs: 42 }));
    expect(ok.value.tapOffsetMs).toBe(42);
    const silly = readSaveValue(settingsDefinition, JSON.stringify({ ...DEFAULT_SETTINGS, tapOffsetMs: 9000 }));
    expect(silly.problem).toBeDefined();
    expect(silly.value).toEqual(DEFAULT_SETTINGS);
  });
});
