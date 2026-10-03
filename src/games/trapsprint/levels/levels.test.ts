import { describe, expect, it } from "vitest";
import type { TrapKind } from "../core/level";
import { ALL_LEVELS, getLevel, isUnlocked, MAIN_LEVELS, nextInZone, nextLevelId, REMIX_LEVELS, ZONES } from "./index";

describe("levels", () => {
  it("are three zones of ten, plus Remix", () => {
    expect(ZONES.map((z) => z.levels.length)).toEqual([10, 10, 10, 30]);
    expect(new Set(ALL_LEVELS).size).toBe(60);
  });

  it("all parse, in both directions", () => {
    for (const id of ALL_LEVELS) {
      const level = getLevel(id);
      expect(level.id).toBe(id);
      expect(level.remix).toBe(id.startsWith("R"));
    }
  });

  it("use every trap in the table at least once (Plan §3)", () => {
    const used = new Set<TrapKind>();
    for (const id of MAIN_LEVELS) for (const t of getLevel(id).traps) used.add(t.kind);
    expect(used.size).toBe(19);
    expect(MAIN_LEVELS.some((id) => getLevel(id).secondTry)).toBe(true);
    expect(MAIN_LEVELS.some((id) => getLevel(id).ghostTrap)).toBe(true);
  });

  it("move at most one trap after a death per zone, always marked (Plan §10.6)", () => {
    for (const zone of ZONES.slice(0, 3)) {
      expect(zone.levels.filter((id) => getLevel(id).secondTry)).toHaveLength(1);
    }
  });

  it("have unique names", () => {
    const names = MAIN_LEVELS.map((id) => getLevel(id).name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("open one after another; Remix after 3-10", () => {
    const cleared = new Set(["1-01", "1-02"]);
    const done = (id: string) => cleared.has(id);
    expect(isUnlocked("1-01", done)).toBe(true);
    expect(isUnlocked("1-03", done)).toBe(true);
    expect(isUnlocked("1-04", done)).toBe(false);
    expect(isUnlocked(REMIX_LEVELS[0]!, done)).toBe(false);
    expect(isUnlocked(REMIX_LEVELS[0]!, (id) => id === "3-10")).toBe(true);
    expect(nextLevelId("1-10")).toBe("2-01");
    expect(nextInZone("1-10")).toBeNull();
    expect(nextLevelId("R3-10")).toBeNull();
  });
});
