// Sequence floors (Plan/13-wrong-door.md §3 "Numbers"): the room numbers on the doors, and a run of numbers
// on the plaque. The door that continues it is the way up. Only well-known patterns, shown long enough to
// pin them down, and the wrong doors' numbers are checked against every simple pattern that fits, so no
// clever reading makes a second door right.
import { pick, shuffle, type Rng } from "@/engine/rng";

export interface Pattern {
  name: string;
  /** How the codex explains it. */
  how: string;
  /** The terms (long enough for any floor). */
  terms(rng: Rng): number[];
}

const range = (n: number, f: (k: number) => number) => Array.from({ length: n }, (_, k) => f(k));

export const PATTERNS: readonly Pattern[] = [
  { name: "primes", how: "Prime numbers: only 1 and themselves divide them.", terms: () => [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37] },
  { name: "squares", how: "Square numbers: 1×1, 2×2, 3×3…", terms: () => range(10, (k) => (k + 1) ** 2) },
  { name: "fibonacci", how: "Each number is the two before it added together.", terms: () => [1, 2, 3, 5, 8, 13, 21, 34, 55, 89] },
  { name: "doubling", how: "Each number doubles the one before.", terms: (rng) => range(9, (k) => pick(rng, [1, 3, 5]) * 2 ** k) },
  { name: "triangles", how: "Add one more each time: +1, +2, +3…", terms: () => range(10, (k) => ((k + 1) * (k + 2)) / 2) },
  {
    name: "steps",
    how: "The same jump every time.",
    terms: (rng) => {
      const start = pick(rng, [2, 3, 4, 5, 6, 7]);
      const step = pick(rng, [3, 4, 5, 6, 7, 9, 11]);
      return range(10, (k) => start + k * step);
    },
  },
  {
    name: "countdown",
    how: "The same jump every time, going down.",
    terms: (rng) => {
      const step = pick(rng, [3, 4, 5, 6, 7]);
      return range(8, (k) => 60 + step * 2 - k * step);
    },
  },
  { name: "tripling", how: "Each number is three times the one before.", terms: () => range(7, (k) => 3 ** k) },
  { name: "cubes", how: "Cube numbers: 1×1×1, 2×2×2…", terms: () => range(7, (k) => (k + 1) ** 3) },
];

/**
 * What every simple pattern that fits `shown` says comes next: a constant jump, a constant ratio, jumps that
 * grow steadily, each number the sum of the two before, and the known lists (primes, squares, cubes…).
 */
export function predictions(shown: readonly number[]): Set<number> {
  const out = new Set<number>();
  const n = shown.length;
  const last = shown[n - 1]!;
  const diffs = shown.slice(1).map((v, k) => v - shown[k]!);
  if (diffs.every((d) => d === diffs[0])) out.add(last + diffs[0]!);
  if (shown.every((v) => v !== 0)) {
    const ratio = shown[1]! / shown[0]!;
    if (shown.slice(1).every((v, k) => v === shown[k]! * ratio)) out.add(last * ratio);
  }
  const second = diffs.slice(1).map((v, k) => v - diffs[k]!);
  if (second.length && second.every((d) => d === second[0])) out.add(last + diffs[diffs.length - 1]! + second[0]!);
  if (n >= 3 && shown.slice(2).every((v, k) => v === shown[k]! + shown[k + 1]!)) out.add(shown[n - 1]! + shown[n - 2]!);
  for (const p of KNOWN) {
    const at = findRun(p, shown);
    if (at >= 0 && at + n < p.length) out.add(p[at + n]!);
  }
  return out;
}

const KNOWN: number[][] = [
  [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47],
  range(15, (k) => (k + 1) ** 2),
  range(10, (k) => (k + 1) ** 3),
  [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144],
  range(15, (k) => ((k + 1) * (k + 2)) / 2),
];

function findRun(list: number[], run: readonly number[]): number {
  outer: for (let i = 0; i + run.length <= list.length; i++) {
    for (let j = 0; j < run.length; j++) if (list[i + j] !== run[j]) continue outer;
    return i;
  }
  return -1;
}

/** How the run works, in words (for the Truth Reveal). */
export function explainSequence(shown: readonly number[]): string {
  const n = shown.length;
  const diffs = shown.slice(1).map((v, k) => v - shown[k]!);
  if (diffs.every((d) => d === diffs[0])) return diffs[0]! > 0 ? `The same jump every time: +${diffs[0]}.` : `The same jump every time: ${diffs[0]}.`;
  if (shown.every((v) => v !== 0) && shown.slice(1).every((v, k) => v === shown[k]! * (shown[1]! / shown[0]!))) return `Each number is ${shown[1]! / shown[0]!} times the one before.`;
  if (n >= 3 && shown.slice(2).every((v, k) => v === shown[k]! + shown[k + 1]!)) return "Each number is the two before it added together.";
  if (findRun(KNOWN[0]!, shown) >= 0) return "Prime numbers: only 1 and themselves divide them.";
  if (findRun(KNOWN[1]!, shown) >= 0) return "Square numbers: 1×1, 2×2, 3×3…";
  if (findRun(KNOWN[2]!, shown) >= 0) return "Cube numbers: 1×1×1, 2×2×2…";
  const second = diffs.slice(1).map((v, k) => v - diffs[k]!);
  if (second.every((d) => d === second[0])) return `The jumps grow by ${second[0]} each time.`;
  return "";
}

/** The next number (what every fitting pattern agrees on). */
export function nextTerm(shown: readonly number[]): number {
  const p = [...predictions(shown)];
  return p.length === 1 ? p[0]! : NaN;
}

export interface SequencePuzzle {
  pattern: Pattern;
  shown: number[];
  answer: number;
  /** Numbers for the wrong doors: near the answer, but not what any fitting pattern says. */
  wrong: number[];
}

/** A run of `length` terms and `wrongCount` wrong room numbers. Every fitting pattern must agree on the
 * answer. */
export function makeSequence(rng: Rng, length: number, wrongCount: number, patterns: readonly Pattern[] = PATTERNS): SequencePuzzle | null {
  for (let tries = 0; tries < 30; tries++) {
    const pattern = pick(rng, patterns);
    const terms = pattern.terms(rng);
    const start = pick(rng, [0, 0, 1]);
    if (start + length >= terms.length) continue;
    const shown = terms.slice(start, start + length);
    const answer = terms[start + length]!;
    const said = predictions(shown);
    if (said.size !== 1 || !said.has(answer)) continue;
    // Near misses: off by a little, or what a careless reading gives.
    const near = new Set<number>();
    const last = shown[shown.length - 1]!;
    for (const d of [-3, -2, -1, 1, 2, 3, 4]) near.add(answer + d);
    near.add(last + (shown[shown.length - 1]! - shown[shown.length - 2]!));
    near.add(last * 2);
    near.add(answer + (answer - last));
    const wrong = shuffle(rng, [...near].filter((v) => v > 0 && v !== answer && !shown.includes(v) && !said.has(v))).slice(0, wrongCount);
    if (wrong.length < wrongCount) continue;
    return { pattern, shown, answer, wrong };
  }
  return null;
}
