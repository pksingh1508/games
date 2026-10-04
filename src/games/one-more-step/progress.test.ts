import { describe, expect, it } from "vitest";
import { FINAL_LEVEL, LEVEL_IDS, stepsOf, WORLDS } from "./levels";
import { countStars, DOCTORS_ORDERS, ECHO_CHAMBER, isOpen, recordClear, recordStats, starsFor, starTotals, UNDO_NE, type Clear } from "./progress";
import { defaultOmsSave, type OmsSave } from "./save";

const clear = (steps: number, over: Partial<Clear> = {}): Clear => ({ steps, quick: false, architect: false, ...over });

const cleared = (ids: readonly string[], stars = 1): OmsSave => {
  const save = defaultOmsSave();
  for (const id of ids) save.levels[id] = { clears: 1, stars, best: 99 };
  return save;
};

describe("progress", () => {
  it("gives a star for the clear, one within par, and one for the fewest steps", () => {
    expect(stepsOf("1-1")).toEqual({ optimal: 6, par: 8 });
    expect(starsFor("1-1", 6)).toBe(7);
    expect(starsFor("1-1", 8)).toBe(3);
    expect(starsFor("1-1", 9)).toBe(1);
    expect(countStars(5)).toBe(2);
  });

  it("keeps the best stars and steps across clears", () => {
    let r = recordClear(defaultOmsSave(), "1-1", clear(12));
    expect(r).toMatchObject({ stars: 1, newBest: true });
    r = recordClear(r.save, "1-1", clear(6));
    expect(r.newBest).toBe(true);
    r = recordClear(r.save, "1-1", clear(8));
    expect(r.newBest).toBe(false);
    expect(r.save.levels["1-1"]).toEqual({ clears: 3, stars: 7, best: 6 });
    expect(starTotals(r.save)).toEqual({ got: 3, of: LEVEL_IDS.length * 3 });
  });

  it("earns the trophies", () => {
    const save = defaultOmsSave();
    expect(recordClear(save, "2-1", clear(20, { quick: true })).unlock).toContain("catch-me");
    expect(recordClear(save, "2-3", clear(20, { architect: true })).unlock).toContain("architect");
    expect(recordClear(save, "2-3", clear(20)).unlock).toEqual([]);
    const finale = recordClear(save, FINAL_LEVEL, clear(10));
    expect(finale.unlock).toContain("zero-steps");
    expect(finale.save.finished).toBe(true);
    // Perfectionist: the last three stars of a world.
    const world1 = WORLDS[0]!.levels.map((l) => l.id);
    const last = world1.at(-1)!;
    const allBut = cleared(world1.slice(0, -1), 7);
    expect(recordClear(allBut, last, clear(stepsOf(last).optimal)).unlock).toContain("perfectionist");
    expect(recordClear(allBut, last, clear(stepsOf(last).par)).unlock).not.toContain("perfectionist");
  });

  it("counts the lifetime stats (the finale's resets: the most it ever went round)", () => {
    let r = recordStats(defaultOmsSave(), { steps: 3, undos: 1 });
    r = recordStats(r.save, { steps: 2, resets: 4 });
    r = recordStats(r.save, { resets: 2 });
    expect(r.save.stats).toEqual({ steps: 5, undos: 1, deaths: 0, echoDeaths: 0, resets: 4 });
    expect(r.unlock).toEqual([]);
    const near = { ...defaultOmsSave(), stats: { steps: DOCTORS_ORDERS - 1, undos: UNDO_NE - 1, deaths: 0, echoDeaths: ECHO_CHAMBER - 1, resets: 0 } };
    expect(recordStats(near, { steps: 1 }).unlock).toEqual(["doctors-orders"]);
    expect(recordStats(near, { undos: 1 }).unlock).toEqual(["undo-ne"]);
    expect(recordStats(near, { deaths: 1, echoDeaths: 1 }).unlock).toEqual(["echo-chamber"]);
  });

  it("opens the levels one after another, the finale last", () => {
    expect(isOpen(defaultOmsSave(), "1-1")).toBe(true);
    expect(isOpen(defaultOmsSave(), "1-2")).toBe(false);
    expect(isOpen(cleared(["1-1"]), "1-2")).toBe(true);
    expect(isOpen(cleared(LEVEL_IDS.slice(0, -2)), FINAL_LEVEL)).toBe(false);
    expect(isOpen(cleared(LEVEL_IDS.slice(0, -1)), FINAL_LEVEL)).toBe(true);
  });
});
