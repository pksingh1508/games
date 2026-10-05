// What a loop does to the save (Plan/03-99-seconds.md §3 "What persists", §7, §14 "Progress and the journal survive
// page reloads").
import { describe, expect, it } from "vitest";
import { readSaveValue } from "@/engine/save";
import { STRETCH_MAX_MS } from "./core/loop";
import { isOpen, loopEnded, noteClues, rankFor, storyChapter, type LoopReport } from "./progress";
import { defaultNinetySave, ninetySaveDefinition } from "./save";

const report = (more: Partial<LoopReport> = {}): LoopReport => ({ chapter: "waiting-room", result: "reset", found: [], stretched: 0, stared: false, realMs: 99_000, ...more });

describe("the save", () => {
  it("counts loops, keeps the journal and lets the room remember", () => {
    let save = defaultNinetySave();
    save = loopEnded(save, report({ found: [{ id: "coin", at: 95 }] })).save;
    expect(save.totalLoops).toBe(1);
    expect(save.chapters["waiting-room"].progress.loops).toBe(1);
    expect(save.chapters["waiting-room"].progress.clues.coin).toEqual({ loop: 1, at: 95 });
    for (let i = 0; i < 5; i++) save = loopEnded(save, report()).save;
    expect(save.chapters["waiting-room"].progress.scratches).toHaveLength(1);
    expect(save.chapters["waiting-room"].realMs).toBe(6 * 99_000);
  });

  it("clues found mid-loop go in the journal at once (a reload keeps them)", () => {
    const save = noteClues(defaultNinetySave(), "kitchen", [{ id: "honest", at: 80 }]);
    expect(save.chapters.kitchen.progress.clues.honest).toEqual({ loop: 1, at: 80 });
    const back = readSaveValue(ninetySaveDefinition, JSON.stringify(save));
    expect(back.problem).toBeUndefined();
    expect(back.value).toEqual(save);
  });

  it("escaping records the loops it took (the rank) and opens the next chapter", () => {
    let save = defaultNinetySave();
    expect(storyChapter(save)).toBe("waiting-room");
    expect(isOpen(save, "kitchen")).toBe(false);
    for (let i = 0; i < 6; i++) save = loopEnded(save, report()).save;
    const out = loopEnded(save, report({ result: "next" }));
    save = out.save;
    expect(out.escaped).toBe(true);
    expect(save.chapters["waiting-room"].escapedIn).toBe(7);
    expect(rankFor(7)).toBe("clockwatcher");
    expect([rankFor(5), rankFor(15), rankFor(16)]).toEqual(["time-lord", "clockwatcher", "groundhog"]);
    expect(isOpen(save, "kitchen")).toBe(true);
    expect(storyChapter(save)).toBe("kitchen");
    // Going back in doesn't change how long the first escape took.
    save = loopEnded(save, report({ result: "next" })).save;
    expect(save.chapters["waiting-room"].escapedIn).toBe(7);
  });

  it("the trophies: First Try (lol), Groundhog, Clockwatcher, A Watched Pot, both endings", () => {
    expect(loopEnded(defaultNinetySave(), report({ result: "next" })).unlock).toContain("first-try");
    let save = defaultNinetySave();
    save = loopEnded(save, report()).save;
    expect(loopEnded(save, report({ result: "next" })).unlock).not.toContain("first-try");
    save = { ...defaultNinetySave(), totalLoops: 49 };
    expect(loopEnded(save, report()).unlock).toContain("groundhog");
    expect(loopEnded(defaultNinetySave(), report({ stretched: STRETCH_MAX_MS })).unlock).toContain("clockwatcher");
    expect(loopEnded(defaultNinetySave(), report({ stretched: STRETCH_MAX_MS - 500 })).unlock).not.toContain("clockwatcher");
    expect(loopEnded(defaultNinetySave(), report({ chapter: "kitchen", stared: true })).unlock).toContain("a-watched-pot");
    const truly = loopEnded(defaultNinetySave(), report({ chapter: "clock-room", result: "true" }));
    expect(truly.unlock).toContain("closed-loop");
    expect(truly.save.chapters["clock-room"].done).toBe(1);
    const paradox = loopEnded(defaultNinetySave(), report({ chapter: "clock-room", result: "paradox" }));
    expect(paradox.unlock).toContain("paradox");
    expect(paradox.save.chapters["clock-room"].done).toBe(0);
    expect(paradox.save.endings.paradox).toBe(1);
  });

  it("a Single Loop keeps its best time and leaves the story alone", () => {
    let save = defaultNinetySave();
    save = loopEnded(save, report({ result: "next" })).save;
    const loops = save.chapters["waiting-room"].progress.loops;
    save = loopEnded(save, report({ result: "next", realMs: 99_500, single: { left: 0 } })).save;
    save = loopEnded(save, report({ result: "reset", realMs: 99_000, single: { left: 0 } })).save;
    save = loopEnded(save, report({ result: "next", realMs: 101_000, single: { left: 0 } })).save;
    expect(save.chapters["waiting-room"].single).toEqual({ tries: 3, best: { realMs: 99_500, left: 0 } });
    expect(save.chapters["waiting-room"].progress.loops).toBe(loops);
  });

  it("refuses a broken save", () => {
    const save = defaultNinetySave();
    expect(readSaveValue(ninetySaveDefinition, JSON.stringify({ ...save, prefs: { ...save.prefs, mode: "easy" } })).problem).toBeDefined();
    expect(readSaveValue(ninetySaveDefinition, JSON.stringify({ ...save, totalLoops: -1 })).problem).toBeDefined();
  });
});
