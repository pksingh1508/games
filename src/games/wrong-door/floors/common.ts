// What every floor generator shares: blank floors, doors with their sounds and what's behind them, and sign
// puzzles that the solver has checked (Plan/13-wrong-door.md §12: "keep the puzzle only if exactly one door
// is consistent").
import { pick, randInt, shuffle, type Rng } from "@/engine/rng";
import { signExits, signWorlds } from "../logic/solver";
import { evaluate, statementText } from "../logic/statements";
import { DOOR_STYLES, type Archetype, type Consequence, type Door, type DoorId, type Floor, type FloorRule, type Sound, type Statement } from "../logic/types";

/** What you hear behind a wrong door tells you what's waiting there. */
export const SOUND_OF: Record<Consequence, Sound> = {
  downstairs: "footsteps",
  wrongRoom: "ticking",
  cursed: "whispers",
  loseKey: "silence",
};

/** How harsh wrong doors are, by floor: gentle at first, worse higher up. */
export function consequenceFor(rng: Rng, floor: number): Consequence {
  const r = rng();
  if (floor <= 3) return r < 0.55 ? "downstairs" : "wrongRoom";
  if (floor <= 7) return r < 0.35 ? "downstairs" : r < 0.65 ? "wrongRoom" : r < 0.88 ? "cursed" : "loseKey";
  return r < 0.3 ? "downstairs" : r < 0.55 ? "wrongRoom" : r < 0.75 ? "cursed" : "loseKey";
}

export function blankFloor(number: number, archetype: Archetype, seed: number): Floor {
  return {
    number,
    archetype,
    seed,
    doors: [],
    exit: 1,
    rule: null,
    notes: [],
    doorman: null,
    candle: null,
    footprints: null,
    sequence: null,
    memory: null,
    anomaly: null,
    mirror: false,
    dark: false,
    honest: null,
    windRule: false,
    shuffle: null,
    final: null,
    lucky: false,
    item: null,
  };
}

/**
 * `n` doors (each a different style when there are five or fewer), the way up at `exit`. Wrong doors get a
 * consequence and its sound; the way up has wind behind it (or, unless `wind`, sometimes silence).
 */
export function makeDoors(rng: Rng, floor: number, n: number, exit: DoorId, { wind = false }: { wind?: boolean } = {}): Door[] {
  const styles = shuffle(rng, DOOR_STYLES);
  return Array.from({ length: n }, (_, k) => {
    const id = k + 1;
    const consequence = id === exit ? null : consequenceFor(rng, floor);
    return {
      id,
      style: styles[k % styles.length]!,
      sign: null,
      sound: consequence ? SOUND_OF[consequence] : wind || rng() < 0.5 ? "wind" : "silence",
      light: null,
      number: null,
      scratch: null,
      consequence,
    };
  });
}

export type StatementKind = Statement["type"];

/** Kinds of claim, from plainest to trickiest. */
export const EASY_KINDS: StatementKind[] = ["exitIs", "exitIsNot"];
export const MID_KINDS: StatementKind[] = ["exitIs", "exitIsNot", "exitParity", "exitLeftOf", "exitRightOf", "exitOneOf", "exitNextTo"];
export const HARD_KINDS: StatementKind[] = [...MID_KINDS, "signTrue", "signLies"];

/** Does the claim's truth depend on the way up (or on other signs)? Claims that can't be anything but true
 * (or false) are left out, except "one of these doors is the way up", which is that on purpose. */
function informative(s: Statement, n: number): boolean {
  if (s.type === "signTrue" || s.type === "signLies" || s.type === "someExit") return true;
  let t = 0;
  for (let e = 1; e <= n; e++) if (evaluate(s, e, () => false)) t++;
  return t > 0 && t < n;
}

export function randomStatement(rng: Rng, n: number, own: DoorId, kinds: readonly StatementKind[], signed: readonly DoorId[]): Statement | null {
  const kind = pick(rng, kinds);
  const any = () => randInt(rng, 1, n);
  let s: Statement;
  switch (kind) {
    case "exitIs":
    case "exitIsNot":
      // Signs about their own door read best ("This is the way up."), so they come up more often.
      s = { type: kind, door: rng() < 0.45 ? own : any() };
      break;
    case "exitParity":
      s = { type: kind, parity: rng() < 0.5 ? "even" : "odd" };
      break;
    case "exitLeftOf":
    case "exitRightOf":
    case "exitNextTo":
      s = { type: kind, door: rng() < 0.4 ? own : any() };
      break;
    case "exitOneOf": {
      const [a, b] = shuffle(rng, Array.from({ length: n }, (_, k) => k + 1)).slice(0, 2) as [number, number];
      s = { type: kind, doors: a < b ? [a, b] : [b, a] };
      break;
    }
    case "signTrue":
    case "signLies": {
      const others = signed.filter((d) => d !== own);
      if (!others.length) return null;
      s = { type: kind, door: pick(rng, others) };
      break;
    }
    case "someExit":
      s = { type: "someExit" };
      break;
  }
  return informative(s, n) ? s : null;
}

export interface SignSpec {
  n: number;
  exit: DoorId;
  /** Which doors carry signs. */
  signed: DoorId[];
  rules: readonly FloorRule[];
  kinds: readonly StatementKind[];
  /** How many doors the signs and plaque should leave (1: a full answer). */
  leave: number;
  /** A sign that says its own door is the way up, on a wrong door (the Confident Sign). */
  confident?: boolean;
  tries?: number;
}

/**
 * Signs for `spec.signed`, and a rule, that leave exactly `spec.leave` doors (the way up among them), with
 * exactly one way for the signs to be true or false when the way up is the real one (so the Truth Reveal can
 * say which were which). Null if it couldn't find any.
 */
export function makeSigns(rng: Rng, floor: Floor, spec: SignSpec): { signs: Map<DoorId, Statement>; rule: FloorRule } | null {
  const { n, exit, signed, rules, kinds, leave } = spec;
  for (let t = 0; t < (spec.tries ?? 400); t++) {
    const rule = pick(rng, rules);
    if ((rule.type === "exitSignTrue" || rule.type === "exitSignLies") && !signed.includes(exit)) continue;
    if (rule.type === "exactlyTrue" && rule.count > signed.length) continue;
    const signs = new Map<DoorId, Statement>();
    let ok = true;
    for (const d of signed) {
      const s = randomStatement(rng, n, d, kinds, signed);
      if (!s) {
        ok = false;
        break;
      }
      signs.set(d, s);
    }
    if (!ok) continue;
    if (spec.confident) {
      const wrong = signed.filter((d) => d !== exit);
      if (!wrong.length) continue;
      const w = pick(rng, wrong);
      signs.set(w, { type: "exitIs", door: w });
    }
    // No two signs that read the same.
    const texts = new Set([...signs.entries()].map(([d, s]) => statementText(s, d)));
    if (texts.size < signs.size) continue;
    const trial: Floor = { ...floor, rule, doors: floor.doors.map((d) => ({ ...d, sign: signs.get(d.id) ?? null })) };
    const exits = signExits(trial);
    if (exits.length !== leave || !exits.includes(exit)) continue;
    if (signWorlds(trial, exit).length !== 1) continue;
    return { signs, rule };
  }
  return null;
}

/** Put signs on a floor. */
export function withSigns(floor: Floor, made: { signs: Map<DoorId, Statement>; rule: FloorRule }): Floor {
  return { ...floor, rule: made.rule, doors: floor.doors.map((d) => ({ ...d, sign: made.signs.get(d.id) ?? null })) };
}

/** Rules for a number of signs, from plain to tricky. */
export function rulesFor(signs: number, level: "easy" | "mid" | "hard"): FloorRule[] {
  const exact = Array.from({ length: Math.max(0, signs - 1) }, (_, k): FloorRule => ({ type: "exactlyTrue", count: k + 1 }));
  if (level === "easy") return [{ type: "exactlyTrue", count: 1 }, { type: "allTrue" }, { type: "allLie" }];
  if (level === "mid") return [...exact, { type: "allTrue" }, { type: "allLie" }];
  return [...exact, { type: "allLie" }, { type: "exitSignTrue" }, { type: "exitSignLies" }];
}

export const range = (n: number) => Array.from({ length: n }, (_, k) => k + 1);
