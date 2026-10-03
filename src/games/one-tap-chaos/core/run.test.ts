import { describe, expect, it } from "vitest";
import { MICROGAMES, MICROGAME_IDS, STARTERS, newlyUnlocked, unlockedMicrogames } from "../microgames";
import { CARD_ORDER, compatible, RULES } from "../rules";
import { dailyFor, dayKey, shareText } from "./daily";
import { applyResult, bpmFor, LIVES, newRunState, pointsFor, RunPlanner, type RunOptions } from "./run";
import { TIERS, windowMs } from "./timing";

const options = (patch: Partial<RunOptions> = {}): RunOptions => ({
  seed: 1234,
  pool: STARTERS,
  cardsUnlocked: 0,
  daily: false,
  reducedSpeed: false,
  ...patch,
});

describe("a run", () => {
  it("speeds up every 5 rounds and tops out at tier 5", () => {
    const planner = new RunPlanner(options());
    expect([1, 5, 6, 10, 11, 16, 21, 40].map((i) => planner.round(i).bpm)).toEqual([100, 100, 115, 115, 130, 145, 160, 160]);
    expect(bpmFor(25, true)).toBe(120);
  });

  it("flips a card from round 6, then every 5 rounds; bosses every 10", () => {
    const planner = new RunPlanner(options());
    const flips = Array.from({ length: 30 }, (_, i) => planner.round(i + 1)).filter((r) => r.card).map((r) => r.index);
    expect(flips).toEqual([6, 11, 16, 21, 26]);
    expect([10, 20, 30].map((i) => planner.round(i).game)).toEqual(["conductor", "liar", "final-tap"]);
    expect(planner.round(40).game).toBe("conductor");
    expect(planner.round(10).rules).toEqual([]);
    expect(planner.round(10).beats).toBe(16);
  });

  it("brings in new cards in order the first time you reach them", () => {
    const planner = new RunPlanner(options({ cardsUnlocked: 0 }));
    const cards = [6, 11, 16, 21].map((i) => planner.round(i));
    expect(cards.map((r) => r.card)).toEqual(CARD_ORDER.slice(0, 4));
    expect(cards.every((r) => r.newCard)).toBe(true);
    // Somebody who has seen two cards gets a known one first, then the third is new.
    const veteran = new RunPlanner(options({ cardsUnlocked: 2 }));
    expect(veteran.round(6).newCard).toBe(false);
    expect(veteran.round(16).card).toBe("simonSays");
    expect(veteran.round(16).newCard).toBe(true);
  });

  it("never has more than 2 rules, and never two that clash", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const planner = new RunPlanner(options({ seed, cardsUnlocked: 8, pool: MICROGAME_IDS }));
      for (let i = 1; i <= 80; i++) {
        const round = planner.round(i);
        expect(round.rules.length).toBeLessThanOrEqual(2);
        if (round.rules.length === 2) expect(compatible(round.rules[0]!, round.rules[1]!)).toBe(true);
        if (i < 6 || round.boss) expect(round.rules).toEqual([]);
        if (!round.boss) {
          const game = MICROGAMES[round.game as keyof typeof MICROGAMES];
          for (const rule of round.rules) expect(RULES[rule].allows(game), `${game.id} under ${rule}`).toBe(true);
        }
        if (round.red) expect(round.rules).toContain("redMeansNo");
        if (round.crown !== null) expect(round.rules).toContain("simonSays");
      }
    }
  });

  it("two rules at once from the third card on", () => {
    let doubles = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const planner = new RunPlanner(options({ seed, cardsUnlocked: 8 }));
      if (planner.round(16).rules.length === 2) doubles++;
      expect(planner.round(11).rules).toHaveLength(1);
    }
    expect(doubles).toBeGreaterThan(14);
  });

  it("doesn't deal the same card twice within three slots", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const planner = new RunPlanner(options({ seed, cardsUnlocked: 8 }));
      const cards = Array.from({ length: 12 }, (_, i) => planner.card(i + 1));
      cards.forEach((card, i) => expect(cards.slice(Math.max(0, i - 2), i)).not.toContain(card));
    }
  });

  it("doesn't repeat a microgame within three rounds", () => {
    const planner = new RunPlanner(options({ pool: MICROGAME_IDS, cardsUnlocked: 8 }));
    for (let i = 4; i <= 60; i++) {
      const round = planner.round(i);
      if (round.boss || round.rules.includes("opposite")) continue;
      const before = [1, 2, 3].map((k) => planner.round(i - k).game);
      expect(before).not.toContain(round.game);
    }
  });

  it("only plays unlocked microgames", () => {
    const planner = new RunPlanner(options());
    for (let i = 1; i <= 50; i++) {
      const round = planner.round(i);
      if (!round.boss) expect(STARTERS).toContain(round.game);
    }
  });

  it("is the same run for the same seed", () => {
    const a = new RunPlanner(options({ seed: 77 }));
    const b = new RunPlanner(options({ seed: 77 }));
    for (let i = 1; i <= 40; i++) expect(a.round(i)).toEqual(b.round(i));
  });

  it("windows start at ±120 ms and never get tighter than ±60 ms", () => {
    expect(windowMs(0)).toBe(120);
    expect(windowMs(1)).toBe(60);
    expect(windowMs(5)).toBe(60);
    const planner = new RunPlanner(options());
    const late = planner.round(80);
    expect((late.window / late.bpm) * 60 * 1000).toBeCloseTo(60, 5);
    expect(late.bpm).toBe(TIERS[4]);
  });
});

describe("scoring and lives", () => {
  it("scores 1, 2 with two rules, 6 for a boss", () => {
    expect(pointsFor({ boss: false, rules: [] })).toBe(1);
    expect(pointsFor({ boss: false, rules: ["lag", "mirror"] })).toBe(2);
    expect(pointsFor({ boss: true, rules: [] })).toBe(6);
  });

  it("takes a life per loss and remembers what got you", () => {
    const planner = new RunPlanner(options());
    let state = newRunState();
    expect(state.lives).toBe(LIVES);
    state = applyResult(state, planner.round(1), true);
    state = applyResult(state, planner.round(2), true);
    expect(state).toMatchObject({ score: 2, streak: 2, next: 3 });
    for (let i = 3; i <= 6; i++) state = applyResult(state, planner.round(i), false);
    expect(state.lives).toBe(0);
    expect(state.diedTo).toBe(planner.round(6).game);
    expect(state.streak).toBe(0);
    expect(state.bestStreak).toBe(2);
  });

  it("practice never runs out of lives", () => {
    const planner = new RunPlanner(options());
    const state = applyResult(newRunState(), planner.round(1), false, { infinite: true });
    expect(state.lives).toBe(LIVES);
  });
});

describe("unlocks", () => {
  it("starts with 12 and unlocks the rest by 50", () => {
    expect(unlockedMicrogames(0)).toHaveLength(12);
    expect(unlockedMicrogames(10)).toHaveLength(15);
    expect(unlockedMicrogames(50)).toHaveLength(24);
    expect(newlyUnlocked(8, 21)).toEqual(["count", "dodge", "loading", "beat", "match", "swat"]);
    expect(newlyUnlocked(21, 25)).toEqual([]);
  });
});

describe("Daily Chaos", () => {
  it("is the same run all day, on every device", () => {
    const morning = dailyFor(new Date(2026, 9, 3, 7, 0));
    const night = dailyFor(new Date(2026, 9, 3, 23, 59));
    expect(morning).toEqual(night);
    expect(morning.key).toBe("2026-10-03");
    expect(dailyFor(new Date(2026, 9, 4, 0, 1)).seed).not.toBe(morning.seed);
    const a = new RunPlanner({ seed: morning.seed, pool: MICROGAME_IDS, cardsUnlocked: 8, daily: true, reducedSpeed: false });
    const b = new RunPlanner({ seed: night.seed, pool: MICROGAME_IDS, cardsUnlocked: 8, daily: true, reducedSpeed: false });
    for (let i = 1; i <= 30; i++) expect(a.round(i)).toEqual(b.round(i));
  });

  it("numbers days from the opening", () => {
    expect(dailyFor(new Date(2026, 9, 1)).number).toBe(1);
    expect(dailyFor(new Date(2026, 9, 3)).number).toBe(3);
    expect(dayKey(new Date(2027, 0, 9))).toBe("2027-01-09");
  });

  it("writes the share card", () => {
    const text = shareText({ daily: dailyFor(new Date(2026, 9, 3)), score: 37, bosses: 3, diedTo: "dont", url: "https://example.com/games/one-tap-chaos" });
    expect(text).toBe(
      ["ONE TAP CHAOS · Daily #3", "Score 37 🔥 · Bosses beaten: 3", "Died to: “DON'T!” (of course)", "https://example.com/games/one-tap-chaos"].join("\n"),
    );
  });
});
