// Every level has at least one tested solution (Plan/11-panic-stack.md §10 rule 6, §14): the careful stacker
// (core/bot.ts) plays each one through the real simulation, panic events and all, and builds its tower.
import { describe, expect, it } from "vitest";
import { Bot } from "../core/bot";
import { HZ, seconds } from "../core/constants";
import { Sim } from "../core/sim";
import { LEVELS, LOCATIONS } from ".";
import { dailyFor } from "../progress";
import { dailyLevel, endlessLevel } from "./modes";

function play(sim: Sim, ticks: number) {
  const bot = new Bot(sim);
  let t = 0;
  for (; t < ticks && sim.status === "play"; t++) sim.step(bot.next());
  return t;
}

describe("every level can be built (§14)", () => {
  it.each(LEVELS.map((l) => [l.id, l] as const))("%s: the careful stacker clears it", (_, level) => {
    const sim = new Sim({ level, seed: 1 });
    const t = play(sim, seconds(level.time) + 10);
    expect(sim.status, `${level.id} ended ${sim.lost} at ${(t / HZ).toFixed(1)} s, top ${sim.top.toFixed(2)} of ${level.goal}`).toBe("won");
    // With time to spare: a person is slower than the bot, so the bot needs well under the limit.
    expect(t / HZ).toBeLessThan(level.time * 0.6);
  });

  it("with other seeds too (the random events and the belt's extra items change)", () => {
    const failures: string[] = [];
    for (const level of LEVELS.filter((l) => l.random)) {
      for (const seed of [2, 3]) {
        const sim = new Sim({ level, seed });
        play(sim, seconds(level.time) + 10);
        if (sim.status !== "won") failures.push(`${level.id}#${seed}: ${sim.lost}`);
      }
    }
    expect(failures).toEqual([]);
  });
});

describe("a first-timer (§10 rule 2: liars are introduced in low-stakes levels)", () => {
  it("someone who believes what things look like, and is a bit sloppy, still clears each location's first two levels", () => {
    for (const loc of LOCATIONS) {
      for (const level of loc.levels.slice(0, 2)) {
        let wins = 0;
        for (const seed of [1, 2, 3, 4]) {
          const sim = new Sim({ level, seed });
          const bot = new Bot(sim, { speed: 2, settle: 0.8, naive: { seed: seed * 7, sloppy: 0.12, drop: 0.12 } });
          for (let t = 0; t < seconds(level.time) + 10 && sim.status === "play"; t++) sim.step(bot.next());
          if (sim.status === "won") wins++;
        }
        expect(wins, `${level.id}: ${wins} of 4`).toBeGreaterThanOrEqual(3);
      }
    }
  });
});

describe("Zen mode (§11, §14: start to finish without any pressure)", () => {
  it("every level clears in Zen, with no clock, no events, no falls counted", () => {
    for (const level of LEVELS) {
      const sim = new Sim({ level, seed: 1, zen: true });
      const bot = new Bot(sim);
      let events = 0;
      for (let t = 0; t < seconds(level.time * 2) && sim.status === "play"; t++) {
        for (const e of sim.step(bot.next())) if (e.type === "warn" || e.type === "panic") events++;
      }
      expect(sim.status, level.id).toBe("won");
      expect(events, level.id).toBe(0);
      expect(sim.falls).toBe(0);
      expect(sim.panic).toBe(0);
      expect(sim.timeLimited).toBe(false);
    }
  });
});

describe("the Daily Stack and the Endless Tower", () => {
  it("a week of daily stacks: everyone gets the same tower, and it can be built high", () => {
    for (let d = 0; d < 7; d++) {
      const date = new Date(Date.UTC(2026, 9, 5 + d, 12));
      const { seed } = dailyFor(date);
      const level = dailyLevel(seed);
      expect(dailyLevel(seed)).toEqual(level);
      const sim = new Sim({ level, seed, mode: "daily" });
      play(sim, seconds(level.time) + 10);
      expect(sim.status).toBe("over");
      expect(sim.best, `day ${d}`).toBeGreaterThan(3);
    }
  });

  it("endless: the careful stacker builds high (with the first two locations' liars about)", () => {
    const known = new Set(["box", "jelly", "safe", "feather", "earthquake", "wind", "conveyorRush"]);
    for (const seed of [9, 10]) {
      const sim = new Sim({ level: endlessLevel((what) => known.has(what)), seed, mode: "endless" });
      play(sim, seconds(240));
      expect(sim.best, `seed ${seed}`).toBeGreaterThan(5);
    }
  });

  it("endless: deep, still things are set in place, so a tall tower stays quick and steady", () => {
    const sim = new Sim({ level: endlessLevel(() => false), seed: 1, mode: "endless" });
    const bricks = Array.from({ length: 16 }, (_, k) => sim.drop("brick", { x: 0, y: 0.2 + k * 0.42 }));
    for (let t = 0; t < seconds(5); t++) sim.step({ aim: null, commands: [] });
    const set = bricks.filter((b) => b.set);
    expect(set.length).toBeGreaterThan(3);
    expect(set.every((b) => b.body.isStatic())).toBe(true);
    // The top ones aren't.
    expect(bricks[15]!.set).toBe(false);
    expect(sim.best).toBeGreaterThan(6.5);
    // Up past 10 m: a medal.
    const more = Array.from({ length: 10 }, (_, k) => sim.drop("brick", { x: 0, y: sim.top + 0.22 + k * 0.42 }));
    let medal = 0;
    for (let t = 0; t < seconds(6); t++) for (const e of sim.step({ aim: null, commands: [] })) if (e.type === "milestone") medal = e.metres;
    expect(more.every((b) => b.body.getPosition().y > 6)).toBe(true);
    expect(medal).toBe(10);
  });

  it("endless only brings in the liars and events you've met", () => {
    const fresh = endlessLevel(() => false);
    expect(fresh.random).toBeUndefined();
    expect(fresh.more.filter((k) => k !== "xray").every((k) => ["brick", "crate", "plate", "block", "loaf", "cargo", "anvil", "statue", "bowling"].includes(k))).toBe(true);
    const some = endlessLevel((what) => what === "safe" || what === "wind");
    expect(some.more).toContain("safe");
    expect(some.more).not.toContain("feather");
    expect(some.random?.kinds).toEqual(["wind"]);
  });
});
