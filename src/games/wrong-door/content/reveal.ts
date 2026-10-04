// Clues in words, and the Truth Reveal (Plan/13-wrong-door.md §8.4, §10 rule 4): after a wrong door, every
// sign shows TRUE or FALSE, every clue is explained, and you're told exactly why your door wasn't it.
import { CAPTIONS } from "../audio/behind";
import { questionText } from "../logic/doorman";
import { explainSequence, predictions } from "../logic/sequences";
import { honestClue, signTruths, signWorlds } from "../logic/solver";
import { evaluate, isAboutSigns, statementText } from "../logic/statements";
import type { Anomaly, DoorId, Floor } from "../logic/types";
import type { Choice, FloorPlay } from "../run/state";

/** "The way up" (the last floor talks about the way out). */
export const wayWord = (floor: Floor) => (floor.final ? "way out" : "way up");

/** A sign's words, as the floor says them. */
export function signWords(floor: Floor, door: DoorId): string {
  const sign = floor.doors[door - 1]?.sign;
  if (!sign) return "";
  const text = statementText(sign, door);
  return floor.final ? text.replace(/way up/g, "way out") : text;
}

const list = (ids: readonly number[]) => (ids.length <= 1 ? `door ${ids[0]}` : `doors ${ids.slice(0, -1).join(", ")} and ${ids[ids.length - 1]}`);
const count = (n: number) => ["no signs", "one sign", "two signs", "three signs", "four signs", "five signs"][n] ?? `${n} signs`;
const NUMBER_WORDS = ["none", "one", "two", "three", "four", "five"];

export const ANOMALY_TEXT: Record<Anomaly, string> = {
  paintingUpsideDown: "The painting was hanging upside down.",
  paintingMissing: "The painting was gone.",
  shipSailsLeft: "The ship in the painting was sailing left, not right.",
  clockTime: "The clock said nine, not three.",
  clockBackwards: "The clock's numbers ran backwards.",
  threeLamps: "There were three lamps, not two.",
  lampOut: "One of the lamps was out.",
  plantMissing: "The fern was gone.",
  plantMoved: "The fern had moved to the other side.",
  rugBlue: "The rug was blue, not red.",
  stripes: "The wallpaper was striped, not diamonds.",
  signThirtyOne: "The little brass sign said 31, not 13.",
};

/** The clues on show, in words (for the board, and for screen readers). */
export function describeClues(floor: Floor, place: (door: DoorId) => number, canRead: boolean): string[] {
  const out: string[] = [];
  const lit = floor.doors.filter((d) => d.light).map((d) => place(d.id));
  if (floor.doors.some((d) => d.light !== null)) out.push(lit.length ? `Light under ${list(lit.sort((a, b) => a - b))}.` : "No light under any door.");
  if (floor.candle) {
    const { at, lean } = floor.candle;
    const between = at <= 0 ? "before door 1" : at >= floor.doors.length ? `after door ${floor.doors.length}` : `between doors ${at} and ${at + 1}`;
    out.push(`A candle stands ${between}. Its flame leans ${lean}.`);
  }
  if (floor.footprints && canRead) out.push(`Footprints lead to door ${place(floor.footprints.door)}, the toes pointing ${floor.footprints.toes === "in" ? "at the door" : "back at you"}.`);
  if (floor.sequence) out.push(`Room numbers: ${floor.doors.map((d) => d.number).join(", ")}.`);
  return out;
}

export interface Reveal {
  headline: string;
  /** The plaque's lines. */
  plaque: string[];
  signs: Array<{ door: DoorId; text: string; truth: boolean | null }>;
  clues: string[];
  /** Why the door you chose wasn't it. */
  why: string[];
}

/** Everything a floor was hiding. */
export function revealFor(floor: Floor, play: FloorPlay, choice: Choice | null): Reveal {
  const exit = floor.exit;
  const exitDoor = typeof exit === "number" ? exit : 0;
  const headline =
    exit === "painting"
      ? "The way out was the painting."
      : exit === "back"
        ? floor.final
          ? "The way out was the door you came in by."
          : "The way up was back the way you came."
        : `The ${wayWord(floor)} was door ${exit}.`;
  const truths = exitDoor && floor.rule ? signTruths(floor, exitDoor) : null;
  const signs = floor.doors.filter((d) => d.sign).map((d) => ({ door: d.id, text: signWords(floor, d.id), truth: floor.final ? false : (truths?.get(d.id) ?? null) }));
  const clues: string[] = [];
  if (floor.anomaly) clues.push(floor.anomaly.changed ? ANOMALY_TEXT[floor.anomaly.changed] : "Nothing had changed from the lobby.");
  if (floor.lucky) clues.push("It was luck. He always opens a wrong door you didn't pick: switching wins two times in three.");
  if (floor.doorman && !floor.lucky) {
    const { lies, hat } = floor.doorman;
    clues.push(
      floor.dark
        ? `In the dark you couldn't see his hat. He was ${lies ? "lying" : "telling the truth"} tonight: only the double question works when you can't tell.`
        : hat === "off"
          ? `His hat was behind his back. He was ${lies ? "lying" : "telling the truth"}: only the double question works when you can't tell.`
          : lies
            ? "Mr. Hinges wore his red hat (with the feather): he lies."
            : "Mr. Hinges wore his black hat: he tells the truth.",
    );
    if (play.answer) clues.push(`You asked: “${questionText(play.answer.question)}” He said ${play.answer.yes ? "yes" : "no"}${play.answer.question.type === "wouldSay" ? " (the double question: always the truth)." : play.answer.question.type === "hatRed" ? " (everyone says no to that)." : lies ? ": a lie." : ": the truth."}`);
  }
  if (floor.sequence) {
    const answer = [...predictions(floor.sequence)][0];
    clues.push(`${floor.sequence.join(", ")}, ${answer}: the next room was ${answer}. ${explainSequence(floor.sequence)}`);
  }
  if (floor.memory) clues.push(`On floor ${floor.memory.floor} you went through a ${floor.memory.style === "round" ? "round" : floor.memory.style} door.`);
  if (floor.honest) clues.push(`Tonight only ${floor.honest === "doorman" ? "Mr. Hinges" : `the ${floor.honest}`} told the truth.`);
  if (floor.doors.some((d) => d.light !== null) && !floor.final) {
    clues.push(honestClue(floor, "light") ? "The light was honest: the way up is always lit." : "The light lied: the way up was dark.");
  }
  if (floor.candle && !floor.final) clues.push(honestClue(floor, "candle") ? `The flame leaned ${floor.candle.lean}, towards the way up.` : `The flame lied: it leaned ${floor.candle.lean}, away from the way up.`);
  if (floor.footprints && !floor.final) {
    const toes = floor.footprints.toes === "in" ? "went through" : "came back out of";
    clues.push(`${honestClue(floor, "footprints") ? "The footprints were honest" : "The footprints lied"}: someone ${toes} door ${floor.footprints.door}.`);
  }
  if (!floor.lucky) {
    const heard = floor.doors.map((d) => `${d.id}: ${CAPTIONS[d.sound].text}`).join(" · ");
    clues.push(`Behind the doors — ${heard}.`);
  }
  if (floor.final) clues.push("Every clue pointed at a different door. The plaque was the only thing telling the truth, as plaques always do.");
  const why: string[] = [];
  if (typeof choice === "number" && choice !== exit) why.push(...whyNot(floor, choice));
  if (choice === "back" && exit !== "back") why.push(floor.anomaly ? "Nothing had changed, so the way up was ahead." : "That was the way down.");
  if (typeof choice === "number" && floor.anomaly?.changed) why.push(`${ANOMALY_TEXT[floor.anomaly.changed]} When anything changes, the way up is back the way you came.`);
  return { headline, plaque: floor.notes, signs, clues, why };
}

/** Reasons a door isn't the way up. */
export function whyNot(floor: Floor, d: DoorId): string[] {
  const out: string[] = [];
  if (floor.final) return ["None of the doors was the way out: the plaque said so."];
  if (floor.lucky) return ["It wasn't behind the door you ended on. That's luck: nothing could have told you."];
  const way = wayWord(floor);
  if (floor.rule && signWorlds(floor, d).length === 0) {
    const signed = floor.doors.filter((x) => x.sign);
    if (signed.some((x) => isAboutSigns(x.sign!))) out.push(`If door ${d} were the ${way}, there'd be no way to make the signs fit the plaque.`);
    else {
      const t = signed.map((x) => ({ id: x.id, t: evaluate(x.sign!, d, () => false) }));
      const trueIds = t.filter((x) => x.t).map((x) => x.id);
      const r = floor.rule;
      if (r.type === "exactlyTrue") out.push(`If door ${d} were the ${way}, ${count(trueIds.length)} would be true${trueIds.length ? ` (${list(trueIds)})` : ""}, but the plaque says exactly ${NUMBER_WORDS[r.count]} ${r.count === 1 ? "is" : "are"}.`);
      else if (r.type === "allTrue") out.push(`If door ${d} were the ${way}, door ${t.find((x) => !x.t)?.id}'s sign would be false, and they all tell the truth.`);
      else if (r.type === "allLie") out.push(`If door ${d} were the ${way}, door ${t.find((x) => x.t)?.id}'s sign would be true, and they all lie.`);
      else out.push(`If door ${d} were the ${way}, the signs wouldn't fit the plaque.`);
    }
  }
  const door = floor.doors[d - 1];
  if (door && door.light !== null && door.light !== honestClue(floor, "light")) out.push(honestClue(floor, "light") ? `There was no light under door ${d}.` : `Door ${d} was lit, and the light was lying.`);
  if (floor.candle) {
    const left = d <= floor.candle.at;
    if ((left === (floor.candle.lean === "left")) !== honestClue(floor, "candle")) out.push(`The flame ${honestClue(floor, "candle") ? "leaned away from" : "leaned towards (and lied about)"} door ${d}.`);
  }
  if (floor.footprints && floor.footprints.door === d && (floor.footprints.toes === "in") !== honestClue(floor, "footprints")) out.push(`The footprints at door ${d} ${floor.footprints.toes === "out" ? "came back out of it" : "were lying"}.`);
  if (floor.footprints && floor.footprints.door !== d && floor.footprints.toes === "in" && honestClue(floor, "footprints")) out.push(`The footprints went through door ${floor.footprints.door}, not this one.`);
  if (floor.sequence && door) out.push(`Room ${door.number} doesn't come next.`);
  if (floor.memory && door) out.push(`It was a ${door.style} door, and on floor ${floor.memory.floor} you went through a ${floor.memory.style} one.`);
  if (!out.length) out.push(`Door ${d} wasn't the ${way}.`);
  return out;
}
