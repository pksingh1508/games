// What signs say (Plan/13-wrong-door.md §3 "Signs", §10 rule 6): whether a claim is true, for a given way
// up and a given set of true and false signs, and how it reads, in plain English.
import type { DoorId, FloorRule, Statement } from "./types";

/** Is `s` true, if the way up is `exit` and `truths(d)` says which signs tell the truth? */
export function evaluate(s: Statement, exit: DoorId, truths: (door: DoorId) => boolean): boolean {
  switch (s.type) {
    case "exitIs":
      return exit === s.door;
    case "exitIsNot":
      return exit !== s.door;
    case "exitParity":
      return exit % 2 === (s.parity === "even" ? 0 : 1);
    case "exitLeftOf":
      return exit < s.door;
    case "exitRightOf":
      return exit > s.door;
    case "exitOneOf":
      return exit === s.doors[0] || exit === s.doors[1];
    case "exitNextTo":
      return Math.abs(exit - s.door) === 1;
    case "signTrue":
      return truths(s.door);
    case "signLies":
      return !truths(s.door);
    case "someExit":
      return true;
  }
}

/** Signs that talk about other signs (their truth depends on more than the way up). */
export const isAboutSigns = (s: Statement) => s.type === "signTrue" || s.type === "signLies";

const name = (door: DoorId, own: DoorId) => (door === own ? "this door" : `door ${door}`);

/** The sign's words. `own` is the door it hangs on. */
export function statementText(s: Statement, own: DoorId): string {
  switch (s.type) {
    case "exitIs":
      return s.door === own ? "This is the way up." : `The way up is door ${s.door}.`;
    case "exitIsNot":
      return s.door === own ? "This is not the way up." : `Door ${s.door} is not the way up.`;
    case "exitParity":
      return `The way up has an ${s.parity} number.`;
    case "exitLeftOf":
      return `The way up is somewhere left of ${name(s.door, own)}.`;
    case "exitRightOf":
      return `The way up is somewhere right of ${name(s.door, own)}.`;
    case "exitOneOf": {
      const [a, b] = s.doors[0] === own || s.doors[1] !== own ? s.doors : [s.doors[1], s.doors[0]];
      return `The way up is ${name(a, own)} or ${name(b, own)}.`;
    }
    case "exitNextTo":
      return `The way up is right next to ${name(s.door, own)}.`;
    case "signTrue":
      return `The sign on ${name(s.door, own)} tells the truth.`;
    case "signLies":
      return `The sign on ${name(s.door, own)} is lying.`;
    case "someExit":
      return "One of these doors is the way up.";
  }
}

/** A short version, for small door plates (the full words are always one tap away). */
export function statementShort(s: Statement, own: DoorId): string {
  switch (s.type) {
    case "exitIs":
      return s.door === own ? "THIS WAY UP" : `UP: DOOR ${s.door}`;
    case "exitIsNot":
      return s.door === own ? "NOT THIS ONE" : `NOT DOOR ${s.door}`;
    case "exitParity":
      return s.parity === "even" ? "UP IS EVEN" : "UP IS ODD";
    case "exitLeftOf":
      return `LEFT OF ${s.door === own ? "ME" : s.door}`;
    case "exitRightOf":
      return `RIGHT OF ${s.door === own ? "ME" : s.door}`;
    case "exitOneOf":
      return `${s.doors[0] === own ? "ME" : s.doors[0]} OR ${s.doors[1] === own ? "ME" : s.doors[1]}`;
    case "exitNextTo":
      return `NEXT TO ${s.door === own ? "ME" : s.door}`;
    case "signTrue":
      return `${s.door}'S SIGN: TRUE`;
    case "signLies":
      return `${s.door}'S SIGN LIES`;
    case "someExit":
      return "ONE OF US";
  }
}

/** The plaque's line for a rule. */
export function ruleText(rule: FloorRule, signs: number): string {
  switch (rule.type) {
    case "exactlyTrue":
      if (rule.count === 0) return "Every sign lies.";
      if (rule.count === signs) return signs === 2 ? "Both signs tell the truth." : "Every sign tells the truth.";
      return `Exactly ${["no", "one", "two", "three", "four", "five"][rule.count]} ${rule.count === 1 ? "sign tells" : "signs tell"} the truth.`;
    case "allTrue":
      return signs === 2 ? "Both signs tell the truth." : "Every sign tells the truth.";
    case "allLie":
      return signs === 2 ? "Both signs lie." : "Every sign lies.";
    case "exitSignTrue":
      return "The sign on the way up tells the truth. Every other sign lies.";
    case "exitSignLies":
      return "The sign on the way up lies. Every other sign tells the truth.";
  }
}

/** Does the rule hold, for this way up and these truths (signed doors only)? */
export function ruleHolds(rule: FloorRule, exit: DoorId, signed: readonly DoorId[], truths: (door: DoorId) => boolean): boolean {
  let count = 0;
  for (const d of signed) if (truths(d)) count++;
  switch (rule.type) {
    case "exactlyTrue":
      return count === rule.count;
    case "allTrue":
      return count === signed.length;
    case "allLie":
      return count === 0;
    case "exitSignTrue":
      return signed.includes(exit) && signed.every((d) => truths(d) === (d === exit));
    case "exitSignLies":
      return signed.includes(exit) && signed.every((d) => truths(d) === (d !== exit));
  }
}

/** The words, with each word's inside letters shuffled (a curse): "Teh way up is dorr 2." Still readable. */
export function scramble(text: string, seed: number): string {
  let h = seed >>> 0 || 1;
  const next = () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return (h >>> 0) / 4294967296;
  };
  return text.replace(/[A-Za-z]{4,}/g, (word) => {
    const inner = word.slice(1, -1).split("");
    for (let i = inner.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [inner[i], inner[j]] = [inner[j]!, inner[i]!];
    }
    const out = word[0] + inner.join("") + word[word.length - 1];
    // Never leave it unchanged when it could change.
    return out === word && inner.length > 1 ? word[0] + inner.reverse().join("") + word[word.length - 1] : out;
  });
}
