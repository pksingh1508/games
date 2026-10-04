import { describe, expect, it } from "vitest";
import type { RunResult } from "../play/runtime";
import { defaultGlitchSave } from "../save";
import { STAGE_IDS } from "../stages";
import { DANGER_TICKS, endlessOpen, isCleared, isOpen, recordEndless, recordEnding, recordStage, TEARS_GOAL } from "./progress";

const result = (r: Partial<RunResult> = {}): RunResult => ({
  won: false,
  score: 0,
  metres: 0,
  cause: null,
  clips: 0,
  panics: 0,
  panicsSurvived: 0,
  above80: 0,
  tearsSurvived: 0,
  blindRuns: 0,
  glitched: false,
  peak: 1,
  ticks: 600,
  ...r,
});

describe("progress", () => {
  it("records a stage: deaths, clears, the best score, and a clean clear", () => {
    let save = defaultGlitchSave();
    save = recordStage(save, "01", result({ cause: "spikes", metres: 40 })).save;
    expect(save.stages["01"]).toEqual({ clears: 0, deaths: 1, best: 0, clean: false });
    expect(isCleared(save, "01")).toBe(false);
    const first = recordStage(save, "01", result({ won: true, score: 900, metres: 200, glitched: true, clips: 1 }));
    expect(first.newBest).toBe(true);
    expect(first.unlock).not.toContain("clean-code");
    save = first.save;
    expect(save.stages["01"]).toEqual({ clears: 1, deaths: 1, best: 900, clean: false });
    const clean = recordStage(save, "01", result({ won: true, score: 700, metres: 200 }));
    expect(clean.newBest).toBe(false);
    expect(clean.unlock).toContain("clean-code");
    expect(clean.save.stages["01"]).toEqual({ clears: 2, deaths: 1, best: 900, clean: true });
    expect(clean.save.totals).toEqual({ runs: 3, deaths: 1, metres: 440, clips: 1, panics: 0, tears: 0 });
  });

  it("opens stages one after another, and endless after the first", () => {
    let save = defaultGlitchSave();
    expect(isOpen(save, STAGE_IDS[0]!)).toBe(true);
    expect(isOpen(save, STAGE_IDS[1]!)).toBe(false);
    expect(endlessOpen(save)).toBe(false);
    save = recordStage(save, STAGE_IDS[0]!, result({ won: true, score: 10 })).save;
    expect(isOpen(save, STAGE_IDS[1]!)).toBe(true);
    expect(isOpen(save, STAGE_IDS[2]!)).toBe(false);
    expect(endlessOpen(save)).toBe(true);
    expect(isOpen(save, "99")).toBe(false);
  });

  it("keeps endless and daily bests apart", () => {
    let save = defaultGlitchSave();
    const run = recordEndless(save, result({ score: 5000, metres: 300 }), null);
    expect(run.newBest).toBe(true);
    save = run.save;
    expect(save.endless).toEqual({ runs: 1, best: 5000, metres: 300 });
    const daily = recordEndless(save, result({ score: 2000, metres: 150 }), "2026-10-04");
    expect(daily.newBest).toBe(true);
    save = daily.save;
    expect(save.daily["2026-10-04"]).toEqual({ best: 2000, metres: 150, runs: 1 });
    expect(save.endless.best).toBe(5000);
    const again = recordEndless(save, result({ score: 1500, metres: 180 }), "2026-10-04");
    expect(again.newBest).toBe(false);
    expect(again.save.daily["2026-10-04"]).toEqual({ best: 2000, metres: 180, runs: 2 });
  });

  it("earns the run trophies", () => {
    const save = defaultGlitchSave();
    expect(recordEndless(save, result({ above80: DANGER_TICKS - 1 }), null).unlock).toEqual([]);
    expect(recordEndless(save, result({ above80: DANGER_TICKS }), null).unlock).toContain("living-dangerously");
    expect(recordEndless(save, result({ panics: 1 }), null).unlock).not.toContain("kernel-survivor");
    expect(recordEndless(save, result({ panics: 1, panicsSurvived: 1 }), null).unlock).toContain("kernel-survivor");
    expect(recordEndless(save, result({ blindRuns: 1 }), null).unlock).toContain("blind-faith");
    // Shadow Reader counts tears survived across runs.
    let s = save;
    for (let i = 0; i < TEARS_GOAL - 1; i++) {
      const u = recordEndless(s, result({ tearsSurvived: 1 }), null);
      expect(u.unlock).not.toContain("shadow-reader");
      s = u.save;
    }
    expect(recordEndless(s, result({ tearsSurvived: 1 }), null).unlock).toContain("shadow-reader");
  });

  it("remembers the ending: Wontfix sticks, and earns its trophy", () => {
    const fixed = recordEnding(defaultGlitchSave(), "fixed");
    expect(fixed.save.ending).toBe("fixed");
    expect(fixed.unlock).toEqual([]);
    const wontfix = recordEnding(fixed.save, "wontfix");
    expect(wontfix.save.ending).toBe("wontfix");
    expect(wontfix.unlock).toEqual(["wontfix"]);
    expect(recordEnding(wontfix.save, "fixed").save.ending).toBe("wontfix");
  });
});
