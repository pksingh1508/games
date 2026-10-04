import { describe, expect, it } from "vitest";
import { generateFloor } from "./floors/archetypes";
import { handMadeStory } from "./floors/story";
import { addPages, recordClimb, recordRunEnd, recordWrong, SHARP_EYES, shareText } from "./progress";
import { startRun, type RunState } from "./run/state";
import { defaultWrongDoorSave } from "./save";

const story = handMadeStory();
const escaped = (over: Partial<RunState> = {}): RunState => ({ ...startRun("story", 0), floor: 13, status: "escaped", ...over });

describe("progress", () => {
  it("adds codex pages once", () => {
    const a = addPages(defaultWrongDoorSave(), ["signs", "knock"], 5);
    expect(a.pages).toEqual(["signs", "knock"]);
    expect(addPages(a.save, ["signs"]).pages).toEqual([]);
  });

  it("spots anomalies (Sharp Eyes at ten), switches and wins (The Switch), and believes the last plaque (Believer)", () => {
    const anomaly = story[5]!;
    const near = { ...defaultWrongDoorSave(), stats: { ...defaultWrongDoorSave().stats, anomalies: SHARP_EYES - 1 } };
    expect(recordClimb(near, anomaly, { spotted: true, switched: false }).unlock).toEqual(["sharp-eyes"]);
    expect(recordClimb(near, anomaly, { spotted: false, switched: false }).unlock).toEqual([]);
    const lucky = recordClimb(defaultWrongDoorSave(), story[7]!, { spotted: false, switched: true });
    expect(lucky.unlock).toEqual(["the-switch"]);
    expect(lucky.pages).toEqual(["lucky"]);
    expect(lucky.save.stats).toMatchObject({ luckyPlays: 1, luckyWins: 1, luckySwitches: 1 });
    const final = recordClimb(defaultWrongDoorSave(), story[12]!, { spotted: false, switched: false });
    expect(final.unlock).toEqual(["believer"]);
    expect(final.pages).toEqual(["final"]);
  });

  it("notes a wrong door's misfortune in the codex (and the double question, where the hat was hidden)", () => {
    const r = recordWrong(defaultWrongDoorSave(), story[9]!, "cursed", { switched: false });
    expect(r.pages).toEqual(["cursed", "double"]);
    expect(r.save.stats.wrongDoors).toBe(1);
  });

  it("ends a run: escapes, untouched and knock-free trophies, Endless bests, and the day's first Daily Door", () => {
    const clean = recordRunEnd(defaultWrongDoorSave(), escaped());
    expect(clean.unlock).toEqual(["untouched", "no-knock"]);
    expect(clean.save.stats).toMatchObject({ runs: 1, escapes: 1, storyEscapes: 1 });
    expect(clean.save.run).toBeNull();
    const messy = recordRunEnd(defaultWrongDoorSave(), escaped({ stats: { ...escaped().stats, wrong: 1, knocks: 2 } }));
    expect(messy.unlock).toEqual([]);
    const endless = recordRunEnd(defaultWrongDoorSave(), { ...startRun("endless", 1), floor: 27, status: "out", keys: 0 });
    expect(endless.save.stats.bestEndless).toBe(27);
    const day = { ...startRun("daily", 9, "2026-10-05"), floor: 6, status: "out" as const, keys: 0 };
    const first = recordRunEnd(defaultWrongDoorSave(), day);
    expect(first.save.daily["2026-10-05"]).toMatchObject({ floor: 6, escaped: false });
    const second = recordRunEnd(first.save, { ...day, floor: 13, status: "escaped", keys: 2 });
    expect(second.save.daily["2026-10-05"]!.floor).toBe(6);
  });

  it("writes the Daily Door's share card", () => {
    const run = escaped({ mode: "daily", daily: "2026-10-05", keys: 2, path: Array.from({ length: 13 }, (_, k) => ({ floor: k + 1, style: "wood" as const, wrong: 0, knocks: 0, question: false, items: 0, lucky: k === 8, points: 100 })), wrongBy: { 5: 1 }, stats: { ...escaped().stats, wrong: 1 } });
    expect(shareText(run, 57, "https://example.com/games/wrong-door")).toBe(
      ["WRONG DOOR · Daily #57", "🚪🚪🚪🚪❌🚪🚪🚪🎲🚪🚪🚪🏁", "Floor 13 escaped · 1 wrong door · 2 keys left", "https://example.com/games/wrong-door"].join("\n"),
    );
  });

  it("never gives Mr. Hinges a question to answer on the Lucky Floor (he's busy hosting)", () => {
    const floor = generateFloor("montyHall", { number: 7, seed: 3, history: [] });
    expect(floor.doorman).toEqual({ lies: false, hat: "on" });
  });
});
