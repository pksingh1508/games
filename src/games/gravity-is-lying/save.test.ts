import { describe, expect, it } from "vitest";
import { readSaveValue } from "@/engine/save";
import { assistOn, defaultGravitySave, emptyRoomRecord, gravitySaveDefinition, NO_ASSIST } from "./save";

describe("the save", () => {
  it("starts empty, with honest defaults (Newt controls, no assist, no Truth Mode)", () => {
    const save = defaultGravitySave();
    expect(save.rooms).toEqual({});
    expect(save.finished).toBe(false);
    expect(save.prefs.controls).toBe("newt");
    expect(assistOn(save.prefs.assist)).toBe(false);
    expect(save.prefs.truthMode).toBe(false);
  });

  it("any assist option is assist", () => {
    expect(assistOn(NO_ASSIST)).toBe(false);
    expect(assistOn({ ...NO_ASSIST, trueArrow: true })).toBe(true);
    expect(assistOn({ ...NO_ASSIST, slow: true })).toBe(true);
    expect(assistOn({ ...NO_ASSIST, invincible: true })).toBe(true);
  });

  it("accepts a played save, and refuses a broken one", () => {
    const played = { ...defaultGravitySave(), rooms: { "1-01": { ...emptyRoomRecord(), clears: 2, best: 400, apples: 5 } }, deaths: 3 };
    const read = (value: unknown) => readSaveValue(gravitySaveDefinition, JSON.stringify(value));
    expect(read(played)).toEqual({ value: played });
    expect(read({ ...played, rooms: { "1-01": { ...emptyRoomRecord(), apples: 9 } } }).problem).toBeDefined();
    expect(read({ ...played, prefs: { ...played.prefs, controls: "joystick" } }).problem).toBeDefined();
  });
});
