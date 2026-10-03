// The practice room (Plan/09-one-tap-chaos.md §5): one microgame (or boss) over and over, at a
// chosen speed, optionally under one Chaos Card. No lives to lose.
import { createRng, hashString } from "@/engine/rng";
import { BOSSES } from "../microgames";
import type { BossId, MicrogameId } from "../microgames/types";
import type { RuleId } from "../rules";
import type { RoundPlan } from "./run";
import { BOSS_BEATS, GAME_BEATS, REDUCED_SPEED_BPM, TIERS, windowBeats } from "./timing";

export interface Planner {
  round(index: number): RoundPlan;
}

export class PracticePlanner implements Planner {
  constructor(
    readonly game: MicrogameId | BossId,
    readonly tier: number,
    readonly rule: RuleId | null,
    readonly reducedSpeed: boolean,
    readonly seed: number,
  ) {}

  round(index: number): RoundPlan {
    const boss = this.game in BOSSES;
    const tier = Math.min(TIERS.length, Math.max(1, this.tier));
    const bpm = this.reducedSpeed ? Math.min(TIERS[tier - 1]!, REDUCED_SPEED_BPM) : TIERS[tier - 1]!;
    const difficulty = (tier - 1) / (TIERS.length - 1);
    const seed = hashString(`${this.seed}:practice:${index}`);
    const rng = createRng(seed);
    const rules = boss || !this.rule ? [] : [this.rule];
    return {
      index,
      game: this.game,
      boss,
      beats: boss ? BOSS_BEATS : GAME_BEATS,
      tier,
      bpm,
      difficulty,
      window: windowBeats(difficulty, bpm),
      card: null,
      newCard: false,
      seed,
      rules,
      red: rules.includes("redMeansNo") && rng() < 0.4,
      crown: rules.includes("simonSays") ? rng() >= 0.4 : null,
    };
  }
}
