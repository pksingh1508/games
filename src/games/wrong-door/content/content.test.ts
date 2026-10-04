import { describe, expect, it } from "vitest";
import { generateFloor, GENERATOR_ARCHETYPES } from "../floors/archetypes";
import { handMadeStory } from "../floors/story";
import { ITEM_KINDS, type Consequence } from "../logic/types";
import { startRun } from "../run/state";
import { CODEX, CODEX_BY_ID, pagesFor } from "./codex";
import { describeClues, revealFor, whyNot } from "./reveal";

const story = handMadeStory();
const play = startRun("story", 0).play;

describe("the codex", () => {
  it("has a page for every tool, every misfortune and every kind of clue (no secret lies, Plan §10 rule 2)", () => {
    for (const item of ITEM_KINDS) expect(CODEX_BY_ID.has(item)).toBe(true);
    for (const c of ["downstairs", "wrongRoom", "cursed", "loseKey"] as Consequence[]) expect(CODEX_BY_ID.has(c)).toBe(true);
    for (const id of ["signs", "doorman", "double", "knock", "light", "candle", "footprints", "numbers", "memory", "anomaly", "mirror", "lucky", "dark", "banquet", "shifting", "final"] as const) expect(CODEX_BY_ID.has(id)).toBe(true);
    expect(new Set(CODEX.map((p) => p.id)).size).toBe(CODEX.length);
  });

  it("opens the pages a floor needs when you arrive, but never gives away the Lucky Floor or the Final Floor first", () => {
    for (const archetype of GENERATOR_ARCHETYPES) {
      const floor = generateFloor(archetype, { number: 12, seed: 5, history: [{ floor: 3, style: "wood" }] });
      const pages = pagesFor(floor);
      expect(pages).not.toContain("lucky");
      expect(pages).not.toContain("final");
      if (floor.windRule) expect(pages).toContain("knock");
      if (floor.doors.some((d) => d.sign)) expect(pages).toContain("signs");
    }
  });
});

describe("the Truth Reveal", () => {
  it("names the way up and says why every wrong door in the Story Run was wrong", () => {
    for (const floor of story) {
      const r = revealFor(floor, play, null);
      expect(r.headline).toMatch(/^The way (up|out) was /);
      for (const d of floor.doors) {
        if (d.id === floor.exit) continue;
        const why = whyNot(floor, d.id);
        expect(why.length, `floor ${floor.number} door ${d.id}`).toBeGreaterThan(0);
        expect(why.join(" ")).not.toMatch(/undefined|NaN/);
      }
    }
  });

  it("stamps every sign TRUE or FALSE", () => {
    for (const floor of story.filter((f) => f.rule && typeof f.exit === "number")) {
      for (const s of revealFor(floor, play, null).signs) expect(typeof s.truth).toBe("boolean");
    }
  });

  it("explains in plain words: the counting on floor 2, the anomaly on floor 6, the maths on the Lucky Floor", () => {
    expect(whyNot(story[1]!, 1)).toEqual(["If door 1 were the way up, two signs would be true (doors 1 and 2), but the plaque says exactly one is."]);
    expect(revealFor(story[5]!, play, 1).clues[0]).toBe("The painting was hanging upside down.");
    expect(revealFor(story[7]!, play, 1).clues.join(" ")).toMatch(/two times in three/);
  });

  it("describes clues for people who can't see them", () => {
    const banquet = story[11]!;
    expect(describeClues(banquet, (d) => d, true)).toEqual([
      "Light under door 2.",
      "A candle stands between doors 2 and 3. Its flame leans left.",
      "Footprints lead to door 2, the toes pointing at the door.",
    ]);
  });
});
