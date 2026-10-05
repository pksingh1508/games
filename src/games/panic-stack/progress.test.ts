import { describe, expect, it } from "vitest";
import { readSaveValue } from "@/engine/save";
import { LEVEL_IDS, LOCATIONS } from "./levels";
import { countStars, dailyFor, FAKE_PANICS, isOpen, medalsFor, recordClear, recordDaily, recordEndless, recordStats, remember, shareText, SKYSCRAPER, starsFor, starTotals, type Clear } from "./progress";
import { defaultPanicStackSave, panicStackSaveDefinition } from "./save";

const clear = (over: Partial<Clear> = {}): Clear => ({ ticks: 1800, limit: 6000, falls: 0, oopsUsed: false, breaks: 0, zen: false, catOnTop: false, safeBase: false, ...over });

describe("stars (§7)", () => {
  it("★ cleared, ★★ nothing fell, ★★★ more than half the time left; Zen clears earn the first", () => {
    expect(starsFor(clear())).toBe(7);
    expect(starsFor(clear({ falls: 1 }))).toBe(5);
    expect(starsFor(clear({ ticks: 3000 }))).toBe(3);
    expect(starsFor(clear({ ticks: 2999 }))).toBe(7);
    expect(starsFor(clear({ zen: true }))).toBe(1);
    expect(countStars(7)).toBe(3);
  });

  it("keeps the best stars and time, and counts clears", () => {
    let save = defaultPanicStackSave();
    save = recordClear(save, "1-1", clear({ falls: 2, ticks: 2400 })).save;
    const r = recordClear(save, "1-1", clear({ ticks: 4000 }));
    // The first earned the time star, the second the no-falls star: the best is all three.
    expect(r.save.levels["1-1"]).toMatchObject({ clears: 2, stars: 7, best: 2400 });
    expect(r.newBest).toBe(false);
    // A Zen clear never sets a best time.
    const zen = recordClear(defaultPanicStackSave(), "1-1", clear({ zen: true }));
    expect(zen.save.levels["1-1"]!.best).toBeNull();
    expect(zen.stars).toBe(1);
  });

  it("opens levels one after another; Zen clears open the next too", () => {
    const save = defaultPanicStackSave();
    expect(isOpen(save, "1-1")).toBe(true);
    expect(isOpen(save, "1-2")).toBe(false);
    const after = recordClear(save, "1-1", clear({ zen: true })).save;
    expect(isOpen(after, "1-2")).toBe(true);
    expect(starTotals(after)).toEqual({ got: 1, of: 108 });
  });
});

describe("trophies (§7)", () => {
  it("Cat Person and Floating Foundation come from the clear itself", () => {
    const r = recordClear(defaultPanicStackSave(), "3-3", clear({ catOnTop: true, safeBase: true }));
    expect(r.unlock).toEqual(expect.arrayContaining(["cat-person", "floating-foundation"]));
    expect(recordClear(defaultPanicStackSave(), "3-3", clear({ safeBase: true, zen: true })).unlock).not.toContain("floating-foundation");
  });

  it("Never Oops: a whole location without Oops; Steady Hands: every Museum level without a break", () => {
    let save = defaultPanicStackSave();
    const kitchen = LOCATIONS[0]!.levels.map((l) => l.id);
    for (const id of kitchen.slice(0, 5)) save = recordClear(save, id, clear()).save;
    expect(recordClear(save, kitchen[5]!, clear({ oopsUsed: true })).unlock).not.toContain("never-oops");
    expect(recordClear(save, kitchen[5]!, clear()).unlock).toContain("never-oops");

    let museum = defaultPanicStackSave();
    const ids = LOCATIONS[3]!.levels.map((l) => l.id);
    for (const id of ids.slice(0, 5)) museum = recordClear(museum, id, clear({ oopsUsed: true })).save;
    expect(recordClear(museum, ids[5]!, clear({ breaks: 1 })).unlock).not.toContain("steady-hands");
    const steady = recordClear(museum, ids[5]!, clear());
    expect(steady.unlock).toContain("steady-hands");
    expect(steady.unlock).not.toContain("never-oops");
  });

  it("Didn't Fall For It after ten fake panics; Skyscraper at 50 m", () => {
    let save = defaultPanicStackSave();
    for (let k = 1; k < FAKE_PANICS; k++) {
      const r = recordStats(save, { fakePanics: 1 });
      expect(r.unlock).toEqual([]);
      save = r.save;
    }
    expect(recordStats(save, { fakePanics: 1 }).unlock).toEqual(["didnt-fall-for-it"]);
    expect(recordEndless(defaultPanicStackSave(), SKYSCRAPER - 0.1).unlock).toEqual([]);
    expect(recordEndless(defaultPanicStackSave(), SKYSCRAPER).unlock).toEqual(["skyscraper"]);
  });
});

describe("records", () => {
  it("Endless keeps the best height; the Daily Stack keeps the day's best and counts tries", () => {
    let save = recordEndless(defaultPanicStackSave(), 12.3).save;
    const lower = recordEndless(save, 8);
    expect(lower.save.endless).toEqual({ best: 12.3, runs: 2 });
    expect(lower.newBest).toBe(false);
    save = recordDaily(save, "2026-10-05", 6.2).save;
    const again = recordDaily(save, "2026-10-05", 4);
    expect(again.save.daily["2026-10-05"]).toEqual({ height: 6.2, tries: 2 });
    expect(again.newBest).toBe(false);
  });

  it("Endless medals at 10, 25, 50 and 100 m", () => {
    expect(medalsFor(9.9)).toEqual([]);
    expect(medalsFor(25)).toEqual([10, 25]);
    expect(medalsFor(120)).toEqual([10, 25, 50, 100]);
  });

  it("the daily seed is the same for everyone on a UTC day, and numbered from 1 October 2026", () => {
    const a = dailyFor(new Date(Date.UTC(2026, 9, 5, 1)));
    const b = dailyFor(new Date(Date.UTC(2026, 9, 5, 23)));
    expect(a).toEqual(b);
    expect(a.number).toBe(5);
    expect(dailyFor(new Date(Date.UTC(2026, 9, 6))).seed).not.toBe(a.seed);
  });

  it("the share card says the height, and nothing else about you", () => {
    const text = shareText("daily", 7.42, 5, "https://example.com/games/panic-stack");
    expect(text).toContain("Panic Stack Daily #5");
    expect(text).toContain("7.4 m");
    expect(text.split("\n")).toHaveLength(4);
  });

  it("remembers what you've met, and which liars you've found out", () => {
    const save = defaultPanicStackSave();
    const seen = remember(save, "safe");
    expect(seen.seen.safe).toBeTruthy();
    expect(seen.known.safe).toBeUndefined();
    expect(remember(seen, "safe")).toBe(seen);
    expect(remember(seen, "safe", true).known.safe).toBeTruthy();
  });
});

describe("the save", () => {
  it("starts empty, with honest defaults", () => {
    const save = defaultPanicStackSave();
    expect(save.levels).toEqual({});
    expect(save.endless).toEqual({ best: 0, runs: 0 });
    expect(save.prefs).toEqual({ zen: false, slowBelt: false, holdToDrop: false, rotateButtons: "auto", reduceShake: false });
  });

  it("accepts a played save (stars and records survive a reload), and refuses a broken one", () => {
    const played = recordDaily(recordEndless(recordClear(defaultPanicStackSave(), LEVEL_IDS[0]!, clear()).save, 9.5).save, "2026-10-05", 4.2).save;
    const read = (value: unknown) => readSaveValue(panicStackSaveDefinition, JSON.stringify(value));
    expect(read(played)).toEqual({ value: played });
    expect(read({ ...played, levels: { "1-1": { ...played.levels["1-1"], stars: 9 } } }).problem).toBeDefined();
    expect(read({ ...played, prefs: { ...played.prefs, rotateButtons: "sometimes" } }).problem).toBeDefined();
  });
});
