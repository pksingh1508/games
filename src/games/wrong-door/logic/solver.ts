// The solver (Plan/13-wrong-door.md §12): which doors could be the way up, given what you can see and what
// you've found out. Signs can talk about other signs, so for each possible way up it tries every true/false
// combination of the signs (at most 2^5) and keeps the ones where every sign's truth matches what it claims
// and the plaque's rule holds. Then every other clue (light, the candle, footprints, room numbers, memory,
// knocks, Mr. Hinges's answer, items) rules doors in or out. A floor's generator keeps a puzzle only when
// this leaves exactly one door.
import { answerOf } from "./doorman";
import { evaluate, ruleHolds } from "./statements";
import { nextTerm } from "./sequences";
import type { ClueKind, DoorId, Floor, Knowledge } from "./types";

/** Does this kind of clue tell the truth on this floor? (Only Liar's Banquet has liars besides the signs and
 * Mr. Hinges, who have their own rules.) */
export const honestClue = (floor: Floor, kind: ClueKind) => !floor.honest || floor.honest === kind;

/** The doors with signs, in order. */
export const signedDoors = (floor: Floor): DoorId[] => floor.doors.filter((d) => d.sign).map((d) => d.id);

/**
 * Every way the signs could be true or false (bit k: the k-th signed door's sign is true) that fits what
 * they say and the plaque, if the way up is `exit`. `coins` fixes signs you've checked with the Truth Coin.
 */
export function signWorlds(floor: Floor, exit: DoorId, coins: Knowledge["coins"] = {}): number[] {
  const signed = signedDoors(floor);
  const rule = floor.rule;
  if (!signed.length || !rule) return [0];
  const index = new Map(signed.map((d, k) => [d, k]));
  const out: number[] = [];
  for (let mask = 0; mask < 1 << signed.length; mask++) {
    const truths = (d: DoorId) => {
      const k = index.get(d);
      return k !== undefined && ((mask >> k) & 1) === 1;
    };
    let ok = true;
    for (let k = 0; k < signed.length && ok; k++) {
      const d = signed[k]!;
      const said = evaluate(floor.doors[d - 1]!.sign!, exit, truths);
      if (said !== truths(d)) ok = false;
      else if (coins[d] !== undefined && coins[d] !== truths(d)) ok = false;
    }
    if (ok && ruleHolds(rule, exit, signed, truths)) out.push(mask);
  }
  return out;
}

/** Doors the signs and plaque allow (on their own). */
export function signExits(floor: Floor, coins: Knowledge["coins"] = {}): DoorId[] {
  return floor.doors.map((d) => d.id).filter((e) => signWorlds(floor, e, coins).length > 0);
}

/** Which signs tell the truth, if the way up is `exit` (the generators make sure there's exactly one way). */
export function signTruths(floor: Floor, exit: DoorId): Map<DoorId, boolean> | null {
  const worlds = signWorlds(floor, exit);
  if (worlds.length === 0) return null;
  const signed = signedDoors(floor);
  return new Map(signed.map((d, k) => [d, ((worlds[0]! >> k) & 1) === 1]));
}

/** The room number that continues the sequence (sequence floors). */
export const sequenceAnswer = (floor: Floor) => (floor.sequence ? nextTerm(floor.sequence) : null);

export interface Check {
  /** Which of the floor's clues to use (default: all of them, as far as `knowledge` allows). */
  use?: Partial<Record<"signs" | "light" | "candle" | "footprints" | "sequence" | "memory" | "knocks" | "doorman" | "items", boolean>>;
}

/** Could `exit` be the way up, given what's on show and what you know? */
export function couldBe(floor: Floor, exit: DoorId, k: Knowledge, { use = {} }: Check = {}): boolean {
  const on = (key: keyof NonNullable<Check["use"]>) => use[key] !== false;
  if (k.opened.includes(exit)) return false;
  const door = floor.doors[exit - 1];
  if (!door) return false;
  if (on("items")) {
    for (const [d, up] of Object.entries(k.peeks)) if ((Number(d) === exit) !== up) return false;
  }
  if (on("knocks")) {
    for (const [d, sound] of Object.entries(k.knocks)) {
      const here = Number(d) === exit;
      if (sound === "wind" && !here) return false;
      if ((sound === "footsteps" || sound === "ticking" || sound === "whispers") && here) return false;
      if (sound === "silence" && here && floor.windRule) return false;
    }
  }
  if (on("signs") && k.canSee && floor.rule && floor.doors.some((d) => d.sign)) {
    if (signWorlds(floor, exit, on("items") ? k.coins : {}).length === 0) return false;
  }
  if (on("light") && floor.doors.some((d) => d.light !== null)) {
    const lit = door.light === true;
    if (lit !== honestClue(floor, "light")) return false;
  }
  if (on("candle") && floor.candle) {
    const left = exit <= floor.candle.at;
    const pointsLeft = floor.candle.lean === "left";
    if ((left === pointsLeft) !== honestClue(floor, "candle")) return false;
  }
  if (on("footprints") && floor.footprints) {
    const claimsHere = floor.footprints.toes === "in";
    const here = floor.footprints.door === exit;
    if ((claimsHere === here) !== honestClue(floor, "footprints")) return false;
  }
  if (on("sequence") && floor.sequence) {
    if (door.number !== sequenceAnswer(floor)) return false;
  }
  if (on("memory") && floor.memory) {
    if (door.style !== floor.memory.style) return false;
  }
  if (on("doorman") && k.answer && floor.doorman) {
    const { question, yes } = k.answer;
    if (k.seeHat) {
      if (answerOf(question, exit, floor.doorman.lies) !== yes) return false;
    } else if (answerOf(question, exit, true) !== yes && answerOf(question, exit, false) !== yes) return false;
  }
  return true;
}

/** The doors that could be the way up. */
export function candidates(floor: Floor, k: Knowledge, check: Check = {}): DoorId[] {
  return floor.doors.map((d) => d.id).filter((e) => couldBe(floor, e, k, check));
}
