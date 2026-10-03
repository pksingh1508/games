// Helpers every microgame uses: picking fair moments, finding when moving things line up (for
// the bots), and tracking the verdict.
import { randRange, type Rng } from "@/engine/rng";
import { verdict as drawVerdictStamp } from "../render/draw";
import type { Microgame, MicrogameContext, MicrogameId, Outcome, View } from "./types";

export function defineMicrogame(game: Microgame): Microgame {
  return game;
}

/** True when beat `t` (± `half`) touches a dark beat. */
export function inDark(ctx: Pick<MicrogameContext, "dark">, t: number, half = 0): boolean {
  return ctx.dark.some(([a, b]) => t + half > a && t - half < b);
}

/**
 * A random moment in [lo, hi] for something the player must see (a green light, a landing…).
 * Under Lights Out it avoids the dark beats, so the key moment is never hidden.
 */
export function pickTime(rng: Rng, lo: number, hi: number, ctx: Pick<MicrogameContext, "dark">, half = 0): number {
  const first = randRange(rng, lo, hi);
  if (!inDark(ctx, first, half)) return first;
  // Walk the range in small steps from the random start, wrapping around.
  const steps = 64;
  for (let i = 1; i <= steps; i++) {
    const t = lo + ((first - lo + (i * (hi - lo)) / steps) % (hi - lo || 1));
    if (!inDark(ctx, t, half)) return t;
  }
  return first;
}

/**
 * The first moment in [from, to] where `f` (a smooth function of time) reaches `target`, found by
 * scanning then bisecting. Null if it never does.
 */
export function firstCrossing(f: (t: number) => number, target: number, from: number, to: number, step = 0.01): number | null {
  let prevT = from;
  let prev = f(from) - target;
  if (prev === 0) return from;
  for (let t = from + step; t <= to + 1e-9; t += step) {
    const cur = f(t) - target;
    if (cur === 0) return t;
    if (Math.sign(cur) !== Math.sign(prev)) {
      let lo = prevT;
      let hi = t;
      for (let i = 0; i < 40; i++) {
        const mid = (lo + hi) / 2;
        const v = f(mid) - target;
        if (Math.sign(v) === Math.sign(prev)) lo = mid;
        else hi = mid;
      }
      return (lo + hi) / 2;
    }
    prevT = t;
    prev = cur;
  }
  return null;
}

/** The middle of the first stretch in [from, to] where `ok(t)` holds for at least `minLength`. */
export function firstStretch(ok: (t: number) => boolean, from: number, to: number, minLength = 0, step = 0.005): number | null {
  let start: number | null = null;
  for (let t = from; t <= to + 1e-9; t += step) {
    if (ok(t)) {
      start ??= t;
    } else if (start !== null) {
      if (t - step - start >= minLength) return (start + t - step) / 2;
      start = null;
    }
  }
  if (start !== null && to - start >= minLength) return (start + to) / 2;
  return null;
}

/** Win/lose bookkeeping: the first decision sticks, and remembers when it happened. */
export class Verdict {
  value: Outcome = "pending";
  at = Infinity;

  win(b: number) {
    if (this.value !== "pending") return;
    this.value = "win";
    this.at = b;
  }

  lose(b: number) {
    if (this.value !== "pending") return;
    this.value = "lose";
    this.at = b;
  }

  get decided() {
    return this.value !== "pending";
  }

  /** The verdict now; at the end, `fallback` decides anything still pending. */
  outcome(final: boolean, fallback: Outcome = "lose"): Outcome {
    if (this.value !== "pending" || !final) return this.value;
    return fallback;
  }

  /** The ✓ / ✖ stamp in the corner, popping in when decided. */
  draw(g: CanvasRenderingContext2D, b: number, view: View) {
    if (!this.decided || !view.showVerdict) return;
    drawVerdictStamp(g, 880, 120, 70, this.value === "win", (b - this.at) * 5);
  }
}

/** Microgames the "???" round can borrow: their scenes make the goal obvious without words. */
export const MYSTERY_POOL: MicrogameId[] = [
  "jump",
  "catch",
  "stop",
  "shoot",
  "pump",
  "flip",
  "wait",
  "dodge",
  "stack",
  "land",
  "snap",
  "swat",
];
