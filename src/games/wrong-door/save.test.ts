import { describe, expect, it } from "vitest";
import { readSaveValue } from "@/engine/save";
import { choose, floorOf, knock, startRun } from "./run/state";
import { defaultWrongDoorSave, wrongDoorSaveDefinition } from "./save";

const read = (value: unknown) => readSaveValue(wrongDoorSaveDefinition, JSON.stringify(value));

describe("the save", () => {
  it("starts with no run, no codex pages and honest options", () => {
    const save = defaultWrongDoorSave();
    expect(save.run).toBeNull();
    expect(save.codex).toEqual({});
    expect(save.prefs).toEqual({ relaxed: false, bigSigns: false });
  });

  it("keeps a run in progress (knocks, a wrong door waiting to happen) through a reload", () => {
    let run = startRun("daily", 1234, "2026-10-05");
    const floor = floorOf(run);
    run = knock(run, floor, 1)!.run;
    const wrong = choose(run, floor, floor.exit === 1 ? 2 : 1);
    const played = { ...defaultWrongDoorSave(), run: wrong.run };
    const back = read(played);
    expect(back.problem).toBeUndefined();
    expect(back.value).toEqual(played);
    expect(back.value!.run!.pending).not.toBeNull();
  });

  it("refuses a broken one", () => {
    const run = startRun("story", 0);
    expect(read({ ...defaultWrongDoorSave(), run: { ...run, keys: -1 } }).problem).toBeDefined();
    expect(read({ ...defaultWrongDoorSave(), run: { ...run, play: { ...run.play, opened: [7] } } }).problem).toBeDefined();
    expect(read({ ...defaultWrongDoorSave(), run: { ...run, play: { ...run.play, knocks: { 1: "screaming" } } } }).problem).toBeDefined();
  });
});
