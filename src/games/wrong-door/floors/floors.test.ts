import { describe, expect, it } from "vitest";
import { candidates, signTruths } from "../logic/solver";
import { ARCHETYPES, DOOR_STYLES, emptyKnowledge, type Archetype } from "../logic/types";
import { generateFloor } from "./archetypes";
import { verify } from "./check";
import { curseFor, dailyFor, itemFor, plan } from "./schedule";
import { handMadeStory, STORY_ARCHETYPES, storyFloor } from "./story";

/** Plan §14: "10,000 generated floors per archetype all have exactly one valid answer". */
const COUNT = Number(process.env.FLOORS ?? 10_000);

/** The floors each kind usually appears on (Plan §5). */
const FLOORS_OF: Record<Archetype, readonly number[]> = {
  plainSigns: [1, 2],
  knightsKnaves: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 20],
  doorman: [3, 5, 7, 9, 12, 20],
  sound: [3, 5, 7, 10, 20],
  sequence: [4, 6, 9, 11, 20],
  mirror: [6, 8, 10, 12, 20],
  anomaly: [5, 7, 9, 12, 20],
  montyHall: [5, 8, 11],
  memory: [7, 9, 12, 20],
  dark: [8, 10, 12, 20],
  liarsBanquet: [10, 11, 12, 20],
  shifting: [9, 11, 12, 20],
  final: [13],
};

const history = Array.from({ length: 24 }, (_, k) => ({ floor: k + 1, style: DOOR_STYLES[(k * 3) % 5]! }));

describe.each(ARCHETYPES)("%s floors", (archetype) => {
  it(`${COUNT.toLocaleString("en-US")} generated floors are all fair, with one answer`, () => {
    const floors = FLOORS_OF[archetype];
    for (let i = 0; i < COUNT; i++) {
      const number = floors[i % floors.length]!;
      const floor = generateFloor(archetype, { number, seed: i * 2654435761, history: history.slice(0, number - 1) });
      expect(floor.archetype).toBe(archetype);
      const why = verify(floor);
      if (why) throw new Error(`${archetype} #${i} on floor ${number}: ${why}`);
    }
  });
});

describe("the Story Run", () => {
  it("is thirteen hand-made floors in the plan's order, each one fair", () => {
    const story = handMadeStory();
    expect(story.map((f) => f.archetype)).toEqual(STORY_ARCHETYPES);
    for (const floor of story) expect(verify(floor), `story floor ${floor.number}`).toBeNull();
  });

  it("has a confident sign that lies on floor 1, and the double question's moment on floor 10", () => {
    const [one, , , , , , , , , ten] = handMadeStory();
    expect(signTruths(one!, 2)!.get(1)).toBe(false);
    expect(ten!.dark && ten!.doorman && emptyKnowledge(ten!).seeHat).toBe(false);
  });

  it("asks on floor 9 about the door you really took on floor 4", () => {
    const floor = storyFloor(9, 0, [{ floor: 4, style: "glass" }]);
    expect(floor.memory).toEqual({ floor: 4, style: "glass" });
    expect(candidates(floor, emptyKnowledge(floor))).toEqual([floor.exit]);
  });

  it("is a new puzzle of the same kind when you come back to a floor", () => {
    const again = storyFloor(2, 1, []);
    expect(again.archetype).toBe("knightsKnaves");
    expect(verify(again)).toBeNull();
    expect(JSON.stringify(again.doors)).not.toBe(JSON.stringify(storyFloor(2, 0, []).doors));
  });
});

describe("the schedule", () => {
  it("plans a Daily Door: signs first, the Final Floor last, the Lucky Floor once in between, no kind twice running", () => {
    for (let seed = 0; seed < 500; seed++) {
      const kinds = plan(seed, 13, { final: true });
      expect(kinds[0]).toBe("plainSigns");
      expect(kinds[12]).toBe("final");
      const lucky = kinds.indexOf("montyHall");
      expect(lucky + 1).toBeGreaterThanOrEqual(5);
      expect(lucky + 1).toBeLessThanOrEqual(11);
      expect(kinds.filter((k) => k === "montyHall")).toHaveLength(1);
      for (let i = 1; i < kinds.length; i++) expect(kinds[i]).not.toBe(kinds[i - 1]);
    }
  });

  it("keeps each kind to its floors, and Endless's plan grows without changing what came before", () => {
    const long = plan(42, 40, { final: false });
    expect(plan(42, 25, { final: false })).toEqual(long.slice(0, 25));
    expect(long).not.toContain("final");
    expect(long.indexOf("dark") + 1).toBeGreaterThanOrEqual(8);
    expect(long.indexOf("liarsBanquet") + 1).toBeGreaterThanOrEqual(10);
    expect(long.filter((k) => k === "montyHall").length).toBe(3);
  });

  it("is the same hotel for everyone on the same UTC day", () => {
    const a = dailyFor(new Date("2026-10-05T00:30:00Z"));
    const b = dailyFor(new Date("2026-10-05T23:30:00Z"));
    expect(a).toEqual(b);
    expect(a.key).toBe("2026-10-05");
    expect(a.number).toBe(5);
    expect(dailyFor(new Date("2026-10-06T00:00:00Z")).seed).not.toBe(a.seed);
  });

  it("never curses a floor with what it needs (no knocks off a sound floor, no silent doorman on his floor)", () => {
    for (let i = 0; i < 3000; i++) {
      for (const archetype of ["sound", "dark", "doorman"] as const) {
        const floor = generateFloor(archetype, { number: 10, seed: i, history });
        const curse = curseFor(floor, i);
        if (floor.windRule) expect(curse).not.toBe("noKnock");
        if (archetype === "doorman") expect(curse).not.toBe("silentDoorman");
      }
    }
  });

  it("leaves things lying around now and then, never a tool you already carry", () => {
    let found = 0;
    for (let f = 2; f < 400; f++) {
      const item = itemFor(9, f, 0, new Set(["stethoscope", "chalk"]), "knightsKnaves");
      if (item) found++;
      expect(item).not.toBe("stethoscope");
      expect(item).not.toBe("chalk");
    }
    expect(found).toBeGreaterThan(80);
    expect(found).toBeLessThan(180);
    expect(itemFor(9, 5, 0, new Set(), "montyHall")).toBeNull();
  });
});
