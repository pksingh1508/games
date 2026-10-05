// The room's memory (Plan/03-99-seconds.md §3 "Room memory", §9 "colours desaturate"): scratches in your own
// handwriting after 5, 10 and 15 loops of being stuck, plainer each time; the colour drains while you're stuck and
// comes back the moment you learn something.
import { describe, expect, it } from "vitest";
import { CHAPTER_DEFS } from "../rooms";
import { currentGoal, emptyProgress, endLoop, recordClues, saturation, stageFor } from "./memory";

const ch1 = CHAPTER_DEFS["waiting-room"];

describe("the room's memory", () => {
  it("scratches appear after 5, 10 and 15 stuck loops, each plainer than the last", () => {
    expect([0, 4, 5, 9, 10, 14, 15, 40].map(stageFor)).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
    let p = emptyProgress();
    const seen: number[] = [];
    for (let n = 1; n <= 16; n++) {
      const before = p.scratches.length;
      p = endLoop(ch1, p, false);
      if (p.scratches.length > before) seen.push(n);
    }
    expect(seen).toEqual([5, 10, 15]);
    expect(p.scratches).toEqual([...ch1.goals[0]!.stages]);
    expect(p.loops).toBe(16);
  });

  it("learning something takes the pressure off, but the room remembers you've been struggling", () => {
    let p = emptyProgress();
    for (let n = 0; n < 12; n++) p = endLoop(ch1, p, false);
    expect(p.stuck).toBe(12);
    expect(p.streak).toBe(12);
    p = endLoop(ch1, p, true);
    expect(p.stuck).toBe(7);
    expect(p.streak).toBe(0);
    // A stage once reached is never taken back.
    expect(p.hints.door).toBe(2);
  });

  it("the next goal's scratches pick up where the struggling left off", () => {
    let p = emptyProgress();
    for (let n = 0; n < 15; n++) p = endLoop(ch1, p, false);
    p = recordClues(p, [{ id: "code", at: 90 }]);
    p = endLoop(ch1, p, true);
    expect(currentGoal(ch1, new Set(Object.keys(p.clues)))?.id).toBe("escape");
    expect(p.hints.escape).toBe(2);
    expect(p.scratches.slice(-2)).toEqual(ch1.goals[1]!.stages.slice(0, 2));
  });

  it("the journal keeps when and where you found each clue, once", () => {
    let p = emptyProgress();
    p = recordClues(p, [{ id: "coin", at: 95 }]);
    p = endLoop(ch1, p, true);
    p = recordClues(p, [{ id: "coin", at: 80 }, { id: "clock07", at: 42 }]);
    expect(p.clues).toEqual({ coin: { loop: 1, at: 95 }, clock07: { loop: 2, at: 42 } });
  });

  it("the colour drains while you're stuck, and never all the way", () => {
    expect(saturation(0)).toBe(1);
    expect(saturation(5)).toBeCloseTo(0.65);
    expect(saturation(50)).toBe(0.35);
  });
});
