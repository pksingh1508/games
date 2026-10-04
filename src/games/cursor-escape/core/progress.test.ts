import { describe, expect, it } from "vitest";
import { DRIVES, LEVEL_IDS } from "../levels";
import type { LevelResult } from "../play/runtime";
import { defaultCursorSave } from "../save";
import { isCleared, isOpen, medalFor, recordCrash, recordTurned, recordWin, SPEED_TICKS, TURNED_GOAL } from "./progress";

const medals = { gold: 600, silver: 900, bronze: 1400 };
const result = (r: Partial<LevelResult> = {}): LevelResult => ({ ticks: 700, crashes: 0, attempts: 1, turnedClean: 0, found: false, ...r });

describe("progress", () => {
  it("gives medals by time", () => {
    expect(medalFor(medals, 600)).toBe("gold");
    expect(medalFor(medals, 601)).toBe("silver");
    expect(medalFor(medals, 1400)).toBe("bronze");
    expect(medalFor(medals, 1401)).toBeNull();
  });

  it("records a clear: the best time, the best medal, a clean clear", () => {
    let save = recordCrash(defaultCursorSave(), "C-02");
    expect(save.levels["C-02"]).toMatchObject({ crashes: 1, clears: 0 });
    expect(save.crashes).toBe(1);
    const first = recordWin(save, "C-02", medals, result({ ticks: 1000, crashes: 1 }), false);
    expect(first.medal).toBe("bronze");
    expect(first.newBest).toBe(true);
    save = first.save;
    expect(save.levels["C-02"]).toEqual({ clears: 1, crashes: 1, best: 1000, medal: "bronze", clean: false });
    const better = recordWin(save, "C-02", medals, result({ ticks: 550 }), false);
    expect(better.medal).toBe("gold");
    expect(better.save.levels["C-02"]).toEqual({ clears: 2, crashes: 1, best: 550, medal: "gold", clean: true });
    // A slower clear later keeps the best and the gold.
    const slower = recordWin(better.save, "C-02", medals, result({ ticks: 1300 }), false);
    expect(slower.save.levels["C-02"]).toMatchObject({ best: 550, medal: "gold" });
    expect(slower.newBest).toBe(false);
  });

  it("gives no medal (and no best time) with the forgiving hitbox on", () => {
    const u = recordWin(defaultCursorSave(), "C-03", medals, result({ ticks: 300 }), true);
    expect(u.medal).toBeNull();
    expect(u.save.levels["C-03"]).toMatchObject({ clears: 1, best: null, medal: null, clean: false });
  });

  it("opens the windows one after another", () => {
    let save = defaultCursorSave();
    expect(isOpen(save, LEVEL_IDS[0]!)).toBe(true);
    expect(isOpen(save, LEVEL_IDS[1]!)).toBe(false);
    save = recordWin(save, LEVEL_IDS[0]!, medals, result(), false).save;
    expect(isCleared(save, LEVEL_IDS[0]!)).toBe(true);
    expect(isOpen(save, LEVEL_IDS[1]!)).toBe(true);
    expect(isOpen(save, "Z-99")).toBe(false);
  });

  it("earns the trophies", () => {
    const save = defaultCursorSave();
    expect(recordWin(save, "C-01", medals, result({ ticks: SPEED_TICKS - 1 }), false).unlock).toContain("speed-clicker");
    expect(recordWin(save, "C-01", medals, result({ ticks: SPEED_TICKS }), false).unlock).not.toContain("speed-clicker");
    expect(recordWin(save, "C-01", medals, result({ ticks: 100 }), true).unlock).not.toContain("speed-clicker");
    expect(recordWin(save, "F-02", medals, result({ found: true }), false).unlock).toContain("identity-crisis");
    expect(recordWin(save, "X-01", medals, result(), false).unlock).toContain("uninstall-denied");
    // Steady Hand: every window of a drive, each cleared without a crash.
    let s = save;
    const c = DRIVES[0]!.levels;
    c.forEach((l, i) => {
      const u = recordWin(s, l.id, medals, result(), false);
      if (i < c.length - 1) expect(u.unlock).not.toContain("steady-hand");
      else expect(u.unlock).toContain("steady-hand");
      s = u.save;
    });
    // Ambidextrous: five turned stretches.
    let t = save;
    for (let i = 1; i <= TURNED_GOAL; i++) {
      const u = recordTurned(t);
      expect(u.unlock.includes("ambidextrous")).toBe(i === TURNED_GOAL);
      t = u.save;
    }
  });
});
