import { describe, expect, it } from "vitest";
import { compile } from "../engine/course";
import type { LevelDef } from "../engine/types";
import { FINAL_LEVEL, getLevel, LEVEL_IDS, LEVELS, nextLevelId, parFor, stepsOf, WORLDS } from "./index";
import { SOLUTIONS } from "./solutions";

const has = (l: LevelDef, ch: string) => l.map.some((r) => r.includes(ch));
/** The first level (in order) where `test` holds. */
const first = (test: (l: LevelDef) => boolean) => LEVELS.find(test)?.id;

describe("the levels", () => {
  it("are five worlds of eight, then the finale: 41, every one named", () => {
    expect(WORLDS.map((w) => w.levels.length)).toEqual([8, 8, 8, 8, 8, 1]);
    expect(LEVEL_IDS).toHaveLength(41);
    expect(new Set(LEVEL_IDS).size).toBe(41);
    expect(new Set(LEVELS.map((l) => l.name)).size).toBe(41);
    expect(FINAL_LEVEL).toBe("6-1");
    expect(nextLevelId("5-8")).toBe("6-1");
    expect(nextLevelId("6-1")).toBeNull();
  });

  it.each(LEVEL_IDS)("%s: a tidy grid (every row as wide as the rest, walled in), one of you, a way out", (id) => {
    const l = getLevel(id);
    const w = l.map[0]!.length;
    expect(l.map.every((r) => r.length === w)).toBe(true);
    expect(l.map[0]).toMatch(/^[#D]+$/);
    expect(l.map[l.map.length - 1]).toMatch(/^[#D]+$/);
    expect(l.map.every((r) => /^[#DP]/.test(r) && /[#D]$/.test(r))).toBe(true);
    expect(l.map.join("").split("P")).toHaveLength(2);
    expect(has(l, "E") || has(l, "B") || has(l, "h")).toBe(true);
    const c = compile(l);
    // Grids grow from 7 × 3 to about 12 × 12.
    expect(c.w * c.h).toBeLessThanOrEqual(13 * 13);
    expect(l.narrator?.some((n) => n.at === "start")).toBe(true);
  });

  it("brings each idea in where the plan says (§5)", () => {
    expect(first((l) => has(l, "~"))).toBe("1-4");
    expect(first((l) => has(l, "x") || has(l, "X"))).toBe("1-6");
    expect(first((l) => /[<>^v]/.test(l.map.join("")))).toBe("2-2");
    expect(first((l) => has(l, "D"))).toBe("2-4");
    expect(first((l) => !!l.echoDelay)).toBe("3-1");
    expect(first((l) => has(l, "_"))).toBe("3-2");
    expect(first((l) => has(l, "T"))).toBe("4-1");
    expect(first((l) => has(l, "S"))).toBe("4-3");
    expect(first((l) => has(l, "Z") || has(l, "z"))).toBe("5-1");
    expect(first((l) => l.door === "brave")).toBe("5-2");
    expect(first((l) => has(l, "B"))).toBe("5-3");
    expect(first((l) => !!l.noUndo)).toBe("5-4");
    expect(first((l) => !!l.wave)).toBe("5-5");
    expect(first((l) => !!l.fog)).toBe("5-6");
    expect(first((l) => l.narrator?.some((n) => n.lie) ?? false)).toBe("5-3");
    // World 5's betrayals stay in World 5.
    for (const l of LEVELS.filter((x) => x.world < 5)) {
      expect(l.noUndo || l.fog || l.door === "brave" || l.wave || has(l, "B") || has(l, "Z") || has(l, "z") || l.narrator?.some((n) => n.lie)).toBeFalsy();
    }
  });

  it("keeps the no-undo levels short (12 steps or fewer), and there are two (§10 rule 5)", () => {
    const noUndo = LEVELS.filter((l) => l.noUndo);
    expect(noUndo.map((l) => l.id)).toEqual(["5-4", "5-8"]);
    for (const l of noUndo) expect(SOLUTIONS[l.id]!.steps).toBeLessThanOrEqual(12);
  });

  it("keeps fog levels small, and echoes no more than 6 ticks behind (§12 risks)", () => {
    for (const l of LEVELS) {
      if (l.fog) expect(compile(l).w * compile(l).h).toBeLessThanOrEqual(9 * 5);
      expect(l.echoDelay ?? 0).toBeLessThanOrEqual(6);
    }
  });

  it("sets par a little above the shortest solution", () => {
    for (const id of LEVEL_IDS) {
      const { optimal, par } = stepsOf(id);
      expect(par).toBeGreaterThan(optimal);
      expect(par).toBe(parFor(optimal));
    }
    expect(stepsOf("1-1")).toEqual({ optimal: 6, par: 8 });
  });

  it("ends with a finale you win by not stepping at all", () => {
    expect(SOLUTIONS[FINAL_LEVEL]!.moves).toMatch(/^\.+$/);
  });
});
