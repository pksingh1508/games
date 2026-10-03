// Bots (Plan/09-one-tap-chaos.md §12, Testing): every microgame knows the right moments to act.
// The harness turns those moments into real presses under the active rules (tap early for Lag,
// two taps for Double Tap, no taps at all for a trap) and plays the round frame by frame.
import { createRng } from "@/engine/rng";
import { DOUBLE_TAP_SECONDS, GAME_BEATS, LAG_BEATS, windowBeats } from "../core/timing";
import type { Microgame, MicrogameContext, Outcome } from "../microgames/types";
import { DARK_BEATS } from "../rules";
import { isTrap, Round, type RoundFlags } from "../rules/round";

export interface RoundSetup {
  game: Microgame<string>;
  bpm: number;
  difficulty: number;
  seed: number | string;
  flags: RoundFlags;
  beats?: number;
  holdMode?: boolean;
}

/** The context a microgame gets for a round (the live game builds it the same way). */
export function makeContext(setup: RoundSetup, emit: MicrogameContext["emit"] = () => {}): MicrogameContext {
  return {
    bpm: setup.bpm,
    beats: setup.beats ?? GAME_BEATS,
    rng: createRng(setup.seed),
    difficulty: setup.difficulty,
    window: windowBeats(setup.difficulty, setup.bpm),
    inverted: setup.flags.rules.includes("opposite"),
    dark: setup.flags.rules.includes("lightsOut") ? DARK_BEATS : [],
    holdMode: setup.holdMode ?? false,
    emit,
  };
}

/** Turn the bot's action moments into presses, under the round's rules. */
export function botPresses(plan: number[], flags: RoundFlags, bpm: number): number[] {
  if (isTrap(flags)) return [];
  const lag = flags.rules.includes("lag") ? LAG_BEATS : 0;
  const double = flags.rules.includes("doubleTap");
  // The first tap of a pair goes a little before the action (well inside 250 ms).
  const gap = Math.min(0.1, DOUBLE_TAP_SECONDS * (bpm / 60) * 0.4);
  return plan.flatMap((t) => (double ? [t - lag - gap, t - lag] : [t - lag]));
}

export interface SimResult {
  outcome: Outcome;
  presses: number[];
  round: Round;
}

/**
 * Play a round. `presses` defaults to the bot's. With `late`, presses reach the round a frame
 * after they happened, like real input events can.
 */
export function simulate(setup: RoundSetup, options: { presses?: number[]; frame?: number; late?: boolean; shift?: number } = {}): SimResult {
  const ctx = makeContext(setup);
  const scene = setup.game.create(ctx);
  const round = new Round(scene, setup.flags, setup.bpm);
  const beats = ctx.beats;
  const presses = (options.presses ?? botPresses(scene.plan(), setup.flags, setup.bpm)).map((p) => p + (options.shift ?? 0)).sort((a, b) => a - b);
  const frame = options.frame ?? 1 / 48;
  let i = 0;
  for (let t = 0; t <= beats + 1e-9; t += frame) {
    if (options.late) {
      round.update(t);
      while (i < presses.length && presses[i]! <= t) round.press(presses[i++]!);
    } else {
      while (i < presses.length && presses[i]! <= t) round.press(presses[i++]!);
      round.update(t);
    }
  }
  round.update(beats);
  return { outcome: round.outcome(true), presses, round };
}
