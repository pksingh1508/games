import { describe, expect, it } from "vitest";
import { defaultNopeSave, MAX_HEARTS, QUESTIONS_PER_EPISODE } from "../save";
import {
  addTime,
  clearEpisode,
  failEpisode,
  failQuestion,
  formatTime,
  grantSkip,
  isEpisodeComplete,
  isOutOfHearts,
  PAR_MS,
  passQuestion,
  restartRun,
  scoreRun,
  shareGrid,
  shareText,
  startRun,
} from "./run";
import { visibleStamps, wallLayout, WALL_SLOTS } from "./wall";

describe("a NOPE! run", () => {
  it("starts with full hearts, no skip and an empty wall", () => {
    const run = startRun(2, 99);
    expect(run).toMatchObject({ episode: 2, seed: 99, hearts: MAX_HEARTS, skip: false, index: 0, wall: 0, nopes: 0, attempt: 0 });
  });

  it("costs a heart and adds a stamp for every NOPE", () => {
    let run = startRun(1, 1);
    run = failQuestion(run, "e1-q01");
    run = failQuestion(run, "e1-q01");
    expect(run.hearts).toBe(1);
    expect(run.wall).toBe(2);
    expect(run.nopes).toBe(2);
    expect(run.fails["e1-q01"]).toBe(2);
    expect(isOutOfHearts(run)).toBe(false);
    expect(isOutOfHearts(failQuestion(run, "e1-q01"))).toBe(true);
  });

  it("never goes below zero hearts", () => {
    let run = startRun(1, 1);
    for (let i = 0; i < 5; i++) run = failQuestion(run, "x");
    expect(run.hearts).toBe(0);
  });

  it("records first tries, retries and skips", () => {
    let run = startRun(1, 1);
    run = passQuestion(run, "a");
    run = failQuestion(run, "b");
    run = passQuestion(run, "b");
    run = grantSkip(run);
    run = passQuestion(run, "c", true);
    expect(run.results).toEqual(["first", "retry", "skip"]);
    expect(run.index).toBe(3);
    expect(run.skip).toBe(false);
  });

  it("is complete after 15 answers, and the index never runs past the last question", () => {
    let run = startRun(1, 1);
    for (let i = 0; i < QUESTIONS_PER_EPISODE; i++) run = passQuestion(run, `q${i}`);
    expect(isEpisodeComplete(run)).toBe(true);
    expect(run.index).toBe(QUESTIONS_PER_EPISODE - 1);
  });

  it("keeps the stamps but refills the hearts on a restart", () => {
    let run = failQuestion(failQuestion(failQuestion(startRun(3, 7), "a"), "a"), "a");
    run = restartRun(run);
    expect(run).toMatchObject({ episode: 3, seed: 7, attempt: 1, hearts: MAX_HEARTS, wall: 3, nopes: 0, index: 0, results: [] });
  });
});

describe("scoring", () => {
  it("is 1000 + 250 per heart + 100 for an unused skip", () => {
    expect(scoreRun({ hearts: 3, skip: true, elapsedMs: 60_000 })).toEqual({ base: 1000, hearts: 750, skip: 100, time: 0, total: 1850 });
  });

  it("takes 2 points per second over par, at most 500", () => {
    expect(scoreRun({ hearts: 1, skip: false, elapsedMs: PAR_MS + 10_000 }).time).toBe(-20);
    expect(scoreRun({ hearts: 1, skip: false, elapsedMs: PAR_MS + 3_600_000 }).time).toBe(-500);
  });

  it("adds play time to the run", () => {
    expect(addTime(startRun(1, 1), 1234.4).elapsedMs).toBe(1234);
  });
});

describe("sharing", () => {
  it("draws a Wordle-style grid", () => {
    expect(shareGrid(["first", "retry", "skip"])).toBe("✅❌⏭️");
  });

  it("formats the time", () => {
    expect(formatTime(402_000)).toBe("06:42");
    expect(formatTime(59_999)).toBe("00:59");
  });

  it("writes the share text", () => {
    expect(shareText({ episode: 2, name: "Brain Freeze", grid: "✅", nopes: 3, elapsedMs: 402_000, score: 2140 })).toBe(
      "NOPE! Episode 2: Brain Freeze — cleared\n✅\nNOPE'd 3 times · 06:42 · 2,140 pts",
    );
    expect(shareText({ episode: 1, name: "X", grid: "", nopes: 1, elapsedMs: 0, score: 0 })).toContain("NOPE'd once");
  });
});

describe("ending an attempt", () => {
  it("records a clear, unlocks the next episode and ends the run", () => {
    let run = startRun(1, 5);
    run = failQuestion(run, "e1-q02");
    for (let i = 0; i < QUESTIONS_PER_EPISODE; i++) run = passQuestion(run, `e1-q${i}`);
    const { save, summary } = clearEpisode({ ...defaultNopeSave(), run }, run);
    expect(save.run).toBeNull();
    expect(save.unlocked).toBe(2);
    expect(save.episodes["1"]).toMatchObject({ clears: 1, attempts: 1, perfect: false });
    expect(save.episodes["1"].bestScore).toBe(summary.score.total);
    expect(summary).toMatchObject({ episode: 1, hearts: 2, perfect: false, firstClear: true, newBest: true, episodeNopes: 1 });
  });

  it("only replaces the best score when it's beaten", () => {
    const base = defaultNopeSave();
    const fast = { ...startRun(1, 1), results: Array(15).fill("first"), elapsedMs: 1000 };
    const slow = { ...fast, hearts: 1 };
    const first = clearEpisode(base, fast).save;
    const second = clearEpisode(first, slow);
    expect(second.summary.newBest).toBe(false);
    expect(second.save.episodes["1"].bestScore).toBe(first.episodes["1"].bestScore);
    expect(second.save.episodes["1"]).toMatchObject({ clears: 2, perfect: true });
  });

  it("never unlocks past episode 4", () => {
    const run = { ...startRun(4, 1), results: Array(15).fill("first") };
    expect(clearEpisode({ ...defaultNopeSave(), unlocked: 4 }, run).save.unlocked).toBe(4);
  });

  it("counts a failed attempt and lines up the next one", () => {
    const run = failQuestion(startRun(2, 3), "e2-q01");
    const save = failEpisode({ ...defaultNopeSave(), unlocked: 2, run }, run);
    expect(save.episodes["2"].attempts).toBe(1);
    expect(save.run).toMatchObject({ episode: 2, attempt: 1, wall: 1, hearts: MAX_HEARTS });
  });
});

describe("the stamp wall", () => {
  it("places the same stamps for the same seed", () => {
    expect(wallLayout(42, 6, false)).toEqual(wallLayout(42, 6, false));
  });

  it("shows at most 20 stamps, never two in one slot", () => {
    const stamps = wallLayout(9, 33, true);
    expect(stamps).toHaveLength(WALL_SLOTS);
    expect(stamps[0]?.n).toBe(13);
    const cells = new Set(stamps.map((s) => `${Math.round(s.x / 5)}:${Math.round(s.y / 5)}`));
    expect(cells.size).toBe(stamps.length);
    expect(visibleStamps(33)).toBe(20);
    expect(visibleStamps(4)).toBe(4);
  });

  it("keeps stamps on the stage, above the card area", () => {
    for (const portrait of [true, false]) {
      for (const stamp of wallLayout(3, 20, portrait)) {
        expect(stamp.x).toBeGreaterThan(0);
        expect(stamp.x).toBeLessThan(100);
        expect(stamp.y).toBeGreaterThan(10);
        expect(stamp.y).toBeLessThan(portrait ? 56 : 74);
      }
    }
  });
});
