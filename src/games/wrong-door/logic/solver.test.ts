import { describe, expect, it } from "vitest";
import { blankFloor } from "../floors/common";
import { candidates, signExits, signTruths } from "./solver";
import { scramble, statementText } from "./statements";
import { emptyKnowledge, type Door, type Floor, type FloorRule, type Statement } from "./types";

const door = (id: number, sign: Statement | null = null, extra: Partial<Door> = {}): Door => ({ id, style: "wood", sign, sound: "silence", light: null, number: null, scratch: null, consequence: "downstairs", ...extra });
const signs = (rule: FloorRule, ...said: Array<Statement | null>): Floor => ({ ...blankFloor(1, "knightsKnaves", 1), rule, doors: said.map((s, k) => door(k + 1, s)) });

describe("the solver", () => {
  it("solves the Lady or the Tiger's first puzzle (one sign true; the second is always true)", () => {
    const f = signs({ type: "exactlyTrue", count: 1 }, { type: "exitIs", door: 1 }, { type: "someExit" });
    expect(signExits(f)).toEqual([2]);
    expect([...signTruths(f, 2)!]).toEqual([
      [1, false],
      [2, true],
    ]);
  });

  it("solves knights and knaves with three doors", () => {
    const f = signs({ type: "exactlyTrue", count: 1 }, { type: "exitIs", door: 1 }, { type: "exitIsNot", door: 2 }, { type: "exitIsNot", door: 1 });
    expect(signExits(f)).toEqual([2]);
  });

  it("handles signs about signs (each sign's truth has to match what it claims)", () => {
    // "Door 2's sign lies" / "This is the way up" / every other sign tells the truth but the way up's.
    const f = signs({ type: "exitSignTrue" }, { type: "signLies", door: 2 }, { type: "exitIs", door: 2 }, { type: "exitIsNot", door: 3 });
    for (const e of signExits(f)) {
      const t = signTruths(f, e)!;
      expect(t.get(1)).toBe(!t.get(2));
    }
    // A sign calling itself a liar can never fit: no way up works with it.
    const paradox = signs({ type: "allTrue" }, { type: "signLies", door: 1 }, null);
    expect(signExits(paradox)).toEqual([]);
  });

  it("uses light, the candle, footprints, room numbers and memory, and turns them round on Liar's Banquet", () => {
    const base = signs({ type: "allTrue" }, null, null, null, null);
    const lit = { ...base, rule: null, doors: base.doors.map((d) => ({ ...d, light: d.id === 2 || d.id === 4 })) };
    expect(candidates(lit, emptyKnowledge(lit))).toEqual([2, 4]);
    expect(candidates({ ...lit, honest: "candle" }, emptyKnowledge(lit))).toEqual([1, 3]);
    const candle = { ...base, rule: null, candle: { at: 1, lean: "right" as const } };
    expect(candidates(candle, emptyKnowledge(candle))).toEqual([2, 3, 4]);
    const prints = { ...base, rule: null, footprints: { door: 3, toes: "out" as const } };
    expect(candidates(prints, emptyKnowledge(prints))).toEqual([1, 2, 4]);
    expect(candidates({ ...prints, honest: "signs" }, emptyKnowledge(prints))).toEqual([3]);
    const numbered = { ...base, rule: null, sequence: [2, 3, 5, 7], doors: base.doors.map((d, k) => ({ ...d, number: [9, 11, 13, 10][k]! })) };
    expect(candidates(numbered, emptyKnowledge(numbered))).toEqual([2]);
    const memory = { ...base, rule: null, memory: { floor: 3, style: "glass" as const }, doors: base.doors.map((d, k) => ({ ...d, style: (["wood", "iron", "glass", "round"] as const)[k]! })) };
    expect(candidates(memory, emptyKnowledge(memory))).toEqual([3]);
  });

  it("learns from knocks: wind is the way up, footsteps never are, silence only counts when the plaque promises wind", () => {
    const f = signs({ type: "allTrue" }, null, null, null);
    const k = { ...emptyKnowledge(f), knocks: { 1: "silence" as const, 2: "footsteps" as const } };
    expect(candidates(f, k)).toEqual([1, 3]);
    expect(candidates({ ...f, windRule: true }, k)).toEqual([3]);
    expect(candidates(f, { ...k, knocks: { 3: "wind" } })).toEqual([3]);
  });

  it("learns from Mr. Hinges: decoding him by his hat, or with the double question when the hat's hidden", () => {
    const f = { ...signs({ type: "allTrue" }, null, null, null), doorman: { lies: true, hat: "on" as const } };
    const seen = emptyKnowledge(f);
    expect(seen.seeHat).toBe(true);
    // He lies: "No" to "Is door 2 the way up?" means it is.
    expect(candidates(f, { ...seen, answer: { question: { type: "isExit", door: 2 }, yes: false } })).toEqual([2]);
    const hidden = { ...f, doorman: { lies: true, hat: "off" as const } };
    const unseen = emptyKnowledge(hidden);
    expect(unseen.seeHat).toBe(false);
    // Without the hat, a straight answer tells you nothing…
    expect(candidates(hidden, { ...unseen, answer: { question: { type: "isExit", door: 2 }, yes: false } })).toEqual([1, 2, 3]);
    // …and the double question tells you everything.
    expect(candidates(hidden, { ...unseen, answer: { question: { type: "wouldSay", door: 2 }, yes: true } })).toEqual([2]);
  });

  it("can't read the signs in the dark (unless there's a lantern)", () => {
    const f = { ...signs({ type: "allTrue" }, { type: "exitIs", door: 2 }, null, null), dark: true };
    expect(candidates(f, emptyKnowledge(f))).toEqual([1, 2, 3]);
    expect(candidates(f, emptyKnowledge(f, true))).toEqual([2]);
  });

  it("reads plainly, and a scramble keeps every word's first and last letters", () => {
    expect(statementText({ type: "exitIs", door: 2 }, 2)).toBe("This is the way up.");
    expect(statementText({ type: "exitOneOf", doors: [1, 3] }, 3)).toBe("The way up is this door or door 1.");
    expect(statementText({ type: "signLies", door: 1 }, 2)).toBe("The sign on door 1 is lying.");
    const text = "The sign on door three tells the truth.";
    const s = scramble(text, 5);
    expect(s).not.toBe(text);
    const ends = (t: string) => t.split(" ").map((w) => `${w.at(0)}${w.at(-1)}`);
    expect(ends(s)).toEqual(ends(text));
  });
});
