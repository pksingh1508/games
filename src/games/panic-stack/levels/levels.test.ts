// The campaign's shape (Plan/11-panic-stack.md §5, §10): six locations of six; every liar introduced calmly
// (no events, a generous clock) before it's met under pressure; every event introduced on its own; everything
// in the plan appears somewhere.
import { describe, expect, it } from "vitest";
import { EVENT_KINDS } from "../core/events";
import { ITEMS, LIARS } from "../core/items";
import type { EventKind } from "../core/level";
import { LEVEL_IDS, LEVELS, LOCATIONS, newIn } from ".";

const eventsOf = (l: (typeof LEVELS)[number]) => new Set<EventKind>([...l.events.map((e) => e.kind), ...(l.random?.kinds ?? [])]);

describe("the campaign", () => {
  it("has six locations of six levels, in order", () => {
    expect(LOCATIONS.map((l) => l.id)).toEqual(["kitchen", "warehouse", "toyroom", "museum", "bakery", "space"]);
    expect(LEVELS).toHaveLength(36);
    LOCATIONS.forEach((loc, i) => {
      expect(loc.levels.map((l) => l.id)).toEqual([1, 2, 3, 4, 5, 6].map((k) => `${i + 1}-${k}`));
      for (const l of loc.levels) expect(l.location).toBe(loc.id);
    });
    expect(new Set(LEVEL_IDS).size).toBe(36);
  });

  it("uses every item, every liar and every event", () => {
    const items = new Set(LEVELS.flatMap((l) => l.items));
    for (const id of Object.keys(ITEMS)) expect(items.has(id as never), id).toBe(true);
    expect(items.has("xray")).toBe(true);
    const events = new Set(LEVELS.flatMap((l) => [...eventsOf(l)]));
    for (const k of EVENT_KINDS) expect(events.has(k), k).toBe(true);
  });

  it("introduces every liar in a calm level: no events, at least 100 seconds, a slow belt (§10 rule 2)", () => {
    for (const liar of LIARS) {
      const first = LEVELS.find((l) => l.items.includes(liar))!;
      expect(eventsOf(first).size, `${liar} first appears in ${first.id}`).toBe(0);
      expect(first.time, liar).toBeGreaterThanOrEqual(100);
      expect(first.belt, liar).toBeGreaterThanOrEqual(20);
      expect(newIn(first.id).items).toContain(liar);
      // Only one new liar at a time.
      expect(newIn(first.id).items.filter((k) => k !== "xray" && ITEMS[k].lie), first.id).toEqual([liar]);
    }
  });

  it("introduces every event on its own, on a schedule (not at random), before it's a random one", () => {
    for (const kind of EVENT_KINDS) {
      const first = LEVELS.find((l) => eventsOf(l).has(kind))!;
      expect(first.events.some((e) => e.kind === kind), `${kind} first appears in ${first.id} as a scheduled event`).toBe(true);
      expect(newIn(first.id).events, first.id).toEqual([kind]);
    }
  });

  it("brings in each location's new things in its first levels, then adds events, then tightens up", () => {
    for (const loc of LOCATIONS) {
      const [a, b] = loc.levels;
      expect(eventsOf(a!).size + eventsOf(b!).size, `${loc.id} 1–2 are calm`).toBeLessThanOrEqual(1);
      const goals = loc.levels.map((l) => l.goal);
      expect(goals[5]!, loc.id).toBeGreaterThan(goals[0]!);
    }
  });

  it("keeps every goal on screen and every clock and belt fair", () => {
    for (const l of LEVELS) {
      expect(l.goal).toBeGreaterThanOrEqual(1.5);
      expect(l.goal).toBeLessThanOrEqual(4.5);
      expect(l.time).toBeGreaterThanOrEqual(90);
      expect(l.belt).toBeGreaterThanOrEqual(15);
      // Events give a breather at the start.
      for (const e of l.events) expect(e.at, l.id).toBeGreaterThanOrEqual(12);
    }
  });

  it("puts the space station in low gravity", () => {
    for (const l of LOCATIONS.find((x) => x.id === "space")!.levels) expect(l.gravity).toBe(6);
  });
});
