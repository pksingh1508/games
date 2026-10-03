import { describe, expect, it } from "vitest";
import { STARTERS } from "../microgames";
import { defaultOtcSave } from "../save";
import { measureOffset, tapErrors } from "./calibration";
import { dailyFor } from "./daily";
import { newTracker, recordRound, recordRun } from "./progress";
import { applyResult, newRunState, RunPlanner, type RoundPlan } from "./run";
import type { RoundReport } from "./session";

const planner = new RunPlanner({ seed: 5, pool: STARTERS, cardsUnlocked: 8, daily: false, reducedSpeed: false });
const plan = (patch: Partial<RoundPlan>): RoundPlan => ({ ...planner.round(3), ...patch });
const report = (p: RoundPlan, won: boolean, extra: Partial<RoundReport> = {}): RoundReport => ({
  plan: p,
  won,
  trap: false,
  noTap: false,
  tapped: won,
  state: applyResult(newRunState(), p, won),
  ...extra,
});

describe("recording rounds", () => {
  it("counts fly swats on DON'T! and unlocks Couldn't Resist at 5", () => {
    let save = defaultOtcSave();
    let tracker = newTracker();
    const dont = plan({ game: "dont", rules: [], boss: false });
    let unlocked: string[] = [];
    for (let i = 0; i < 5; i++) {
      const r = recordRound(save, tracker, report(dont, false, { tapped: true }), "run");
      save = r.save;
      tracker = r.tracker;
      unlocked = r.unlock;
    }
    expect(save.stats.flySwats).toBe(5);
    expect(unlocked).toContain("couldnt-resist");
  });

  it("Self Control needs 10 don't-tap rounds in a row", () => {
    let save = defaultOtcSave();
    let tracker = newTracker();
    const sleep = plan({ game: "sleep", rules: [], boss: false });
    const results = [true, true, true, false, ...Array(10).fill(true)];
    const unlocks: string[][] = [];
    for (const won of results) {
      const r = recordRound(save, tracker, report(sleep, won, { noTap: true, tapped: !won }), "run");
      save = r.save;
      tracker = r.tracker;
      unlocks.push(r.unlock);
    }
    expect(unlocks.slice(0, 13).flat()).not.toContain("self-control");
    expect(unlocks[13]).toContain("self-control");
  });

  it("Simon Who? and Double Trouble count within a run", () => {
    let save = defaultOtcSave();
    let tracker = newTracker();
    const simon = plan({ game: "jump", rules: ["simonSays", "lag"], crown: true, boss: false });
    let last: string[] = [];
    for (let i = 0; i < 5; i++) {
      const r = recordRound(save, tracker, report(simon, true), "run");
      save = r.save;
      tracker = r.tracker;
      last = r.unlock;
    }
    expect(last).toEqual(expect.arrayContaining(["simon-who", "double-trouble"]));
  });

  it("practice keeps its own score and earns nothing", () => {
    const dont = plan({ game: "dont", rules: [], boss: false });
    const r = recordRound(defaultOtcSave(), newTracker(), report(dont, false, { tapped: true }), "practice");
    expect(r.save.practice.dont).toEqual({ wins: 0, losses: 1 });
    expect(r.save.stats.flySwats).toBe(0);
    expect(r.unlock).toEqual([]);
  });

  it("the demo changes nothing", () => {
    const save = defaultOtcSave();
    expect(recordRound(save, newTracker(), report(plan({}), true), "demo").save).toBe(save);
  });
});

describe("recording runs", () => {
  it("raises the best score and unlocks microgames", () => {
    const state = { ...newRunState(), score: 23, lives: 0, bestStreak: 9 };
    const end = recordRun(defaultOtcSave(), { mode: "run", state, playedMs: 120_000 }, null);
    expect(end.save.best).toBe(23);
    expect(end.newBest).toBe(true);
    expect(end.unlocked).toEqual(["count", "dodge", "loading", "beat", "match", "swat"]);
    expect(end.save.runs).toBe(1);
    expect(end.save.stats.playMs).toBe(120_000);
  });

  it("keeps today's best daily, and starts over the next day", () => {
    const today = dailyFor(new Date(2026, 9, 3));
    let save = defaultOtcSave();
    const run = (score: number, d = today) =>
      recordRun(save, { mode: "daily", state: { ...newRunState(), score, lives: 0, diedTo: "dont" }, playedMs: 1 }, d);
    save = run(12).save;
    let end = run(8);
    expect(end.dailyBest).toBe(false);
    save = end.save;
    expect(save.daily).toMatchObject({ key: today.key, best: 12, attempts: 2 });
    end = run(3, dailyFor(new Date(2026, 9, 4)));
    expect(end.save.daily).toMatchObject({ best: 3, attempts: 1 });
    // Daily scores don't unlock microgames.
    expect(end.save.best).toBe(0);
  });
});

describe("calibration", () => {
  const beats = Array.from({ length: 12 }, (_, i) => 10 + i * 0.6);

  it("measures how late taps land", () => {
    const taps = beats.map((b, i) => b + 0.045 + (i % 2 ? 0.01 : -0.01));
    const result = measureOffset(taps, beats)!;
    expect(result.offsetMs).toBeGreaterThanOrEqual(43);
    expect(result.offsetMs).toBeLessThanOrEqual(47);
    expect(result.spreadMs).toBeLessThan(15);
  });

  it("shrugs off a stray tap", () => {
    const taps = [...beats.map((b) => b - 0.02), 12.68];
    expect(measureOffset(taps, beats)!.offsetMs).toBe(-20);
  });

  it("asks for more taps when there aren't enough", () => {
    expect(measureOffset(beats.slice(0, 3), beats)).toBeNull();
    expect(tapErrors([100], beats)).toEqual([]);
  });

  it("handles Bluetooth-sized delays", () => {
    const taps = beats.map((b) => b + 0.22);
    expect(measureOffset(taps, beats)!.offsetMs).toBe(220);
  });
});
