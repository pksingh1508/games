import { describe, expect, it } from "vitest";
import { compile, initialState } from "../engine/course";
import { step } from "../engine/rules";
import type { Action, State } from "../engine/types";
import { FINAL_LEVEL, getLevel } from "../levels";
import { Narrator, type Said } from "./narrator";

const ACTIONS: Record<string, Action> = { U: { type: "move", dir: "up" }, R: { type: "move", dir: "right" }, D: { type: "move", dir: "down" }, L: { type: "move", dir: "left" }, ".": { type: "wait" } };

/** Plays `moves` in a level, with what the narrator said after each. */
function play(id: string, moves: string) {
  const level = getLevel(id);
  const course = compile(level);
  const narrator = new Narrator(level);
  const said: Array<Said | null> = [narrator.start()];
  let s: State = initialState(course);
  for (const m of moves) {
    const { state, events } = step(course, s, ACTIONS[m]!);
    said.push(narrator.after(s, state, events));
    s = state;
  }
  return { said, state: s, narrator };
}

describe("the narrator", () => {
  it("tells the truth outside World 5: one more step really is one more step", () => {
    const { said } = play("1-3", "RR");
    expect(said[0]!.text).toBe("This one's a good door. It stays.");
    expect(said[2]).toMatchObject({ text: "One more step!", lie: false });
  });

  it("lies in World 5, and says so (the bubble's tail turns away)", () => {
    const { said } = play("5-7", "R");
    expect(said[1]).toMatchObject({ text: "One more step!", lie: true });
  });

  it("has a word for how you went", () => {
    const { said, state } = play("5-1", "RR");
    expect(state.cause).toBe("spikes");
    expect(said[2]!.text).toBe("Spikes are pointy. Noted.");
  });

  it("begs in the finale, gives up, then has the last word", () => {
    const { said, state } = play(FINAL_LEVEL, "..........");
    expect(said[0]!.text).toBe("One more step!");
    expect(said.slice(1).flatMap((s) => (s ? [s.text] : []))).toEqual(["…", "Step?", "…Step?", "Come on.", "Please?", "Pretty please?", "Just one?", "Fine.", "Sometimes the best step is no step."]);
    expect(state.status).toBe("won");
  });

  it("numbers the finale's fake levels, smugger each time", () => {
    const narrator = new Narrator(getLevel(FINAL_LEVEL));
    const lines = Array.from({ length: 14 }, (_, k) => narrator.reset(k + 2).text);
    expect(lines[0]).toBe("Level 6-2! One more step!");
    lines.forEach((line, k) => expect(line).toMatch(new RegExp(`\\b6-${k + 2}\\b`)));
    expect(new Set(lines).size).toBeGreaterThanOrEqual(9);
  });

  it("says something new each time (so the bubble pops again, even with the same words)", () => {
    const { narrator } = play("1-1", "");
    const a = narrator.undo();
    const b = narrator.undo();
    expect(a.key).not.toBe(b.key);
  });
});
