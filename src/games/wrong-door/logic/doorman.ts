// Mr. Hinges, the doorman (Plan/13-wrong-door.md §3 "Asking Mr. Hinges"): he answers one yes-or-no question
// a floor, and lies whenever he wears his red hat (it has a feather, so colour is never the only sign). The
// logic is done properly, so the old trick always works: ask him what he *would* say. A liar lying about
// his own lie tells the truth.
import type { DoorId, Question } from "./types";

/** His answer: true is "yes". */
export function answerOf(q: Question, exit: DoorId, lies: boolean): boolean {
  const say = (fact: boolean) => (lies ? !fact : fact);
  switch (q.type) {
    case "isExit":
      return say(exit === q.door);
    case "hatRed":
      // The hat is red exactly when he lies: a liar says no, and so does an honest man.
      return say(lies);
    case "wouldSay":
      // What he'd answer to "Is door N the way up?", and then he tells you that (or lies about it).
      return say(say(exit === q.door));
  }
}

export function questionText(q: Question): string {
  switch (q.type) {
    case "isExit":
      return `Is door ${q.door} the way up?`;
    case "hatRed":
      return "Is your hat red?";
    case "wouldSay":
      return `If I asked you whether door ${q.door} is the way up, would you say yes?`;
  }
}

/** The questions on his card, for a floor of `doors` doors. */
export function questionsFor(doors: number): Question[] {
  const ids = Array.from({ length: doors }, (_, k) => k + 1);
  return [...ids.map((door): Question => ({ type: "isExit", door })), { type: "hatRed" }, ...ids.map((door): Question => ({ type: "wouldSay", door }))];
}

/** How he says it. */
export function answerLine(yes: boolean, seed: number): string {
  const yesLines = ["Yes.", "Yes, sir.", "Indeed.", "Quite so."];
  const noLines = ["No.", "No, sir.", "I'm afraid not.", "Certainly not."];
  const lines = yes ? yesLines : noLines;
  return lines[Math.abs(seed) % lines.length]!;
}
