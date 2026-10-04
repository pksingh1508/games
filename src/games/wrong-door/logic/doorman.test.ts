import { describe, expect, it } from "vitest";
import { answerOf, questionsFor, questionText } from "./doorman";

describe("Mr. Hinges", () => {
  it("answers straight in his black hat, and lies in his red one", () => {
    for (const exit of [1, 2, 3, 4, 5]) {
      for (const door of [1, 2, 3, 4, 5]) {
        expect(answerOf({ type: "isExit", door }, exit, false)).toBe(exit === door);
        expect(answerOf({ type: "isExit", door }, exit, true)).toBe(exit !== door);
      }
    }
  });

  it("tells the truth to the double question, whatever his hat (a liar lying about his own lie)", () => {
    for (const lies of [false, true]) {
      for (const exit of [0, 1, 2, 3, 4, 5]) {
        for (const door of [1, 2, 3, 4, 5]) expect(answerOf({ type: "wouldSay", door }, exit, lies)).toBe(exit === door);
      }
    }
  });

  it("says no when asked about his hat, liar or not (so asking tells you nothing)", () => {
    expect(answerOf({ type: "hatRed" }, 2, true)).toBe(false);
    expect(answerOf({ type: "hatRed" }, 2, false)).toBe(false);
  });

  it("has a card of questions: each door, his hat, and each door the clever way", () => {
    const qs = questionsFor(3);
    expect(qs).toHaveLength(7);
    expect(qs.map(questionText)).toContain("If I asked you whether door 2 is the way up, would you say yes?");
    expect(questionText({ type: "hatRed" })).toBe("Is your hat red?");
  });
});
