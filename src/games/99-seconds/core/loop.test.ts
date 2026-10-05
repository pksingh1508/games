// The loop itself (Plan/03-99-seconds.md §3 "Time", §10 rule 3, §14): game time, chronostasis, timed events at the
// same second every loop, actions that take time, and a clock that stays right however time arrives.
import { describe, expect, it } from "vitest";
import { CHAPTER_DEFS } from "../rooms";
import { goldenPath } from "../rooms/solutions";
import { Loop, STRETCH_MAX_MS, STRETCH_MS } from "./loop";
import { play } from "./script";

const loop = (id: keyof typeof CHAPTER_DEFS = "waiting-room", seconds = 99) => new Loop(CHAPTER_DEFS[id], { seconds, known: new Set() });

describe("the loop clock", () => {
  it("counts 99 down to 0 in real seconds, then resets", () => {
    const l = loop();
    expect(l.display).toBe(99);
    l.tick(1000);
    expect(l.display).toBe(98);
    l.tick(97_500);
    expect(l.display).toBe(1);
    expect(l.status).toBe("play");
    l.tick(600);
    expect(l.status).toBe("over");
    expect(l.result).toBe("reset");
  });

  it("stays right however the time arrives: one big jump or many small ticks, the same events in the same order", () => {
    const small = loop();
    for (let t = 0; t < 40_000; t += 16) small.tick(16);
    const big = loop();
    big.tick(40_000);
    const kinds = (l: Loop) => l.events.filter((e) => e.type === "sound").map((e) => (e.type === "sound" ? e.id : ""));
    expect(kinds(big)).toEqual(kinds(small));
    expect(big.elapsed).toBe(small.elapsed);
    expect([...big.flags].sort()).toEqual([...small.flags].sort());
  });

  it("chronostasis: a glance at a clock holds the second half a second longer, up to ten seconds a loop", () => {
    const l = loop();
    l.look("east");
    l.tick(200);
    const before = l.display;
    l.look("north"); // the clock wall
    expect(l.hold).toBe(STRETCH_MS);
    l.tick(STRETCH_MS);
    expect(l.display).toBe(before);
    expect(l.elapsed).toBe(200);
    // Turning away and back again buys more…
    for (let i = 0; i < 40; i++) {
      l.look("east");
      l.look("north");
    }
    // …but never more than ten seconds a loop.
    expect(l.stretched).toBe(STRETCH_MAX_MS);
    // Over a whole loop, ten seconds more of real time pass.
    const full = loop();
    let real = 0;
    for (let i = 0; i < 20; i++) {
      full.look("east");
      full.look("north");
    }
    while (full.status !== "over") {
      full.tick(10);
      real += 10;
    }
    expect(real).toBe(99_000 + STRETCH_MAX_MS);
  });

  it("timed events happen at the same second in every loop", () => {
    const at = (l: Loop) => {
      const seen: Record<string, number> = {};
      while (l.status !== "over") {
        l.tick(16);
        for (const e of l.events) if (e.type === "sound" && !(e.id in seen)) seen[e.id] = l.display;
        l.events.length = 0;
      }
      return seen;
    };
    const first = at(loop());
    expect(first).toMatchObject({ ring: 77, dip: 66, glitch: 42, bird: 13 });
    expect(at(loop())).toEqual(first);
  });

  it("actions take time, keep the clock running, and stop if you look away", () => {
    const l = loop();
    l.look("south");
    expect(l.interact("coat")).toBe("started");
    l.tick(1500);
    expect(l.actionProgress).toBeCloseTo(0.5, 1);
    expect(l.display).toBe(98);
    l.look("west");
    expect(l.action).toBeNull();
    expect(l.items).toEqual([]);
    l.look("south");
    l.interact("coat");
    l.tick(3000);
    expect(l.items).toEqual(["coin"]);
  });

  it("you can only use what you're holding", () => {
    const l = loop();
    l.look("west");
    l.interact("photo");
    expect(l.view).toBe("closeup:photo");
    expect(l.interact("screw1", "coin")).toBe("nothing");
    l.tick(7000);
    expect(l.flags.has("n.s1")).toBe(false);
  });

  it("plays out the same way every time (deterministic)", () => {
    const a = loop("kitchen");
    const b = loop("kitchen");
    const ra = play(a, goldenPath("kitchen"));
    const rb = play(b, goldenPath("kitchen"));
    expect(ra).toEqual(rb);
    expect(a.found).toEqual(b.found);
  });
});
