import { describe, expect, it } from "vitest";
import { seconds } from "./constants";
import { Sim, topOf } from "./sim";
import { run, TEST_LEVEL } from "./testkit";

/** A sim with an endless belt of bricks and no clock; nothing drops off the belt (Zen) unless asked. */
const fresh = (over: Partial<typeof TEST_LEVEL> = {}, zen = true) => new Sim({ level: { ...TEST_LEVEL, ...over }, seed: 1, zen });

describe("stable physics (§10 rule 4, §14)", () => {
  it("a tower of honest bricks stands for 60 seconds with no events", () => {
    const sim = fresh();
    const bricks = Array.from({ length: 14 }, (_, k) => sim.drop("brick", { x: (k % 2 ? 0.05 : -0.05), y: 0.2 + k * 0.42 }));
    run(sim, seconds(2));
    const start = bricks.map((b) => ({ x: b.body.getPosition().x, y: b.body.getPosition().y }));
    const top = sim.top;
    run(sim, seconds(60));
    expect(sim.falls).toBe(0);
    expect(sim.items).toHaveLength(14);
    bricks.forEach((b, k) => {
      expect(Math.abs(b.body.getPosition().x - start[k]!.x)).toBeLessThan(0.005);
      expect(Math.abs(b.body.getPosition().y - start[k]!.y)).toBeLessThan(0.005);
    });
    expect(top).toBeGreaterThan(5.8);
    expect(Math.abs(sim.top - top)).toBeLessThan(0.005);
  });

  it("a staggered tower of mixed honest items stands still too", () => {
    const sim = fresh();
    const kinds = ["crate", "brick", "plate", "anvil", "block", "loaf", "brick", "crate", "plate", "statue"] as const;
    let y = 0;
    kinds.forEach((kind, k) => {
      const h = kind === "statue" ? 0.9 : kind === "crate" ? 0.7 : kind === "anvil" ? 0.5 : kind === "block" ? 0.5 : kind === "plate" ? 0.14 : 0.4;
      sim.drop(kind, { x: (k % 3) * 0.06 - 0.06, y: y + h / 2 + 0.01 });
      y += h + 0.015;
    });
    run(sim, seconds(3));
    const tops = sim.items.map((i) => topOf(i.body));
    run(sim, seconds(30));
    expect(sim.falls).toBe(0);
    sim.items.forEach((i, k) => expect(Math.abs(topOf(i.body) - tops[k]!)).toBeLessThan(0.01));
  });

  it("is deterministic: the same inputs build the same tower", () => {
    const build = () => {
      const sim = fresh({}, false);
      const positions: number[] = [];
      for (let t = 0; t < seconds(20); t++) {
        const commands = [];
        if (t % seconds(4) === 10 && sim.belt.length && !sim.hand) commands.push({ type: "grab" as const, uid: sim.belt[0]!.uid, at: sim.beltPoint(sim.belt[0]!.pos) });
        if (t % seconds(4) === seconds(3)) commands.push({ type: "release" as const });
        sim.step({ aim: { x: Math.sin(t / 40) * 0.3, y: 1.5 + sim.top }, commands });
      }
      for (const i of sim.items) positions.push(i.body.getPosition().x, i.body.getPosition().y, i.body.getAngle());
      return positions;
    };
    expect(build()).toEqual(build());
  });
});

describe("the rules", () => {
  it("wins after three still seconds above the goal line", () => {
    const sim = fresh({ goal: 1.5 });
    for (let k = 0; k < 4; k++) sim.drop("brick", { x: 0, y: 0.2 + k * 0.42 });
    const events = run(sim, seconds(5));
    expect(sim.status).toBe("won");
    const stable = events.filter((e) => e.type === "stable").map((e) => (e as { left: number }).left);
    expect(stable).toEqual([3, 2, 1, 0]);
  });

  it("three falls lose (outside Zen), and Zen never loses", () => {
    const sim = fresh({}, false);
    for (let k = 0; k < 3; k++) sim.drop("brick", { x: 3 + k, y: 1 });
    run(sim, seconds(2));
    expect(sim.falls).toBe(3);
    expect(sim.status).toBe("lost");
    expect(sim.lost).toBe("falls");

    const zen = fresh({}, true);
    for (let k = 0; k < 3; k++) zen.drop("brick", { x: 3 + k, y: 1 });
    run(zen, seconds(2));
    expect(zen.status).toBe("play");
  });

  it("items ride off the end of the belt and count as fallen; Zen's belt waits", () => {
    const sim = fresh({ belt: 3 }, false);
    const events = run(sim, seconds(8));
    expect(events.filter((e) => e.type === "fall" && e.why === "belt").length).toBe(3);
    expect(sim.status).toBe("lost");

    const zen = fresh({ belt: 3 }, true);
    run(zen, seconds(20));
    expect(zen.falls).toBe(0);
    expect(zen.belt.length).toBeGreaterThan(0);
    expect(Math.max(...zen.belt.map((b) => b.pos))).toBeLessThan(1);
  });

  it("runs out of time", () => {
    const sim = fresh({ time: 5, more: ["brick"] }, false);
    run(sim, seconds(5) + 2);
    expect(sim.status).toBe("lost");
    expect(sim.lost).toBe("time");
  });
});
