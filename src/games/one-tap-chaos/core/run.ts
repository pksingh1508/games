// A run, planned ahead (Plan/09-one-tap-chaos.md §5): which microgame comes next, at what speed,
// under which Chaos Cards. Everything comes from the run's seed and the round number, never from
// how you're doing, so a Daily Chaos run is the same for everyone.
import { createRng, hashString, pick } from "@/engine/rng";
import { BOSS_ORDER, MICROGAMES, MICROGAME_IDS } from "../microgames";
import type { BossId, MicrogameId } from "../microgames/types";
import { allowedUnder, CARD_ORDER, compatible, type RuleId } from "../rules";
import type { RoundFlags } from "../rules/round";
import { BOSS_BEATS, GAME_BEATS, REDUCED_SPEED_BPM, TIERS, windowBeats } from "./timing";

export const LIVES = 4;
/** The first Chaos Card flips before this round, then one every 5 rounds. */
export const FIRST_CARD_ROUND = 6;
export const CARD_EVERY = 5;
/** A boss every 10 rounds. */
export const BOSS_EVERY = 10;
/** From the third card on, the previous card stays too: two rules at once. */
const DOUBLE_FROM_SLOT = 3;

export interface RunOptions {
  seed: number;
  /** Microgames that can come up. */
  pool: MicrogameId[];
  /** Cards unlocked so far (in CARD_ORDER). Reaching a new slot brings the next new card. */
  cardsUnlocked: number;
  /** Daily Chaos: every card is in play, and nothing is unlocked by it. */
  daily: boolean;
  reducedSpeed: boolean;
}

export interface RoundPlan extends RoundFlags {
  /** 1-based. */
  index: number;
  game: MicrogameId | BossId;
  boss: boolean;
  beats: number;
  tier: number;
  bpm: number;
  difficulty: number;
  /** Half the timing window, in beats. */
  window: number;
  /** A Chaos Card flips just before this round. */
  card: RuleId | null;
  /** …and it's one you've never seen. */
  newCard: boolean;
  seed: number;
}

export const tierFor = (index: number) => Math.min(TIERS.length, 1 + Math.floor((index - 1) / 5));
export const difficultyFor = (index: number) => Math.min(1, Math.max(0, (index - 1) / 40));
export const isBossRound = (index: number) => index % BOSS_EVERY === 0;
/** Which card slot a round is in (0 before the first card). */
export const slotFor = (index: number) => (index < FIRST_CARD_ROUND ? 0 : Math.floor((index - FIRST_CARD_ROUND) / CARD_EVERY) + 1);
export const cardFlipsBefore = (index: number) => index >= FIRST_CARD_ROUND && (index - FIRST_CARD_ROUND) % CARD_EVERY === 0;

export function bpmFor(index: number, reducedSpeed: boolean) {
  const bpm = TIERS[tierFor(index) - 1]!;
  return reducedSpeed ? Math.min(bpm, REDUCED_SPEED_BPM) : bpm;
}

/** Plans rounds in order and remembers them (each pick depends on the last few). */
export class RunPlanner {
  private rounds: RoundPlan[] = [];
  private cards: RuleId[] = [];

  constructor(readonly options: RunOptions) {}

  /** The card for a slot. New cards arrive in order; after that, any unlocked card. */
  card(slot: number): RuleId {
    while (this.cards.length < slot) {
      const s = this.cards.length + 1;
      const previous = this.cards[s - 2];
      if (!this.options.daily && s > this.options.cardsUnlocked && s <= CARD_ORDER.length) {
        this.cards.push(CARD_ORDER[s - 1]!);
        continue;
      }
      // Cards met earlier in this very run count as unlocked too.
      const known = Math.min(CARD_ORDER.length, Math.max(1, this.options.cardsUnlocked, s - 1));
      const unlocked = this.options.daily ? CARD_ORDER : CARD_ORDER.slice(0, known);
      const rng = createRng(`${this.options.seed}:card:${s}`);
      // Not the last two cards again, when there's enough to choose from.
      const recent = this.cards.slice(-2);
      let options = unlocked.filter((c) => c !== previous && (unlocked.length <= 3 || !recent.includes(c)));
      // From the third slot, prefer a card that can share the stage with the last one.
      if (s >= DOUBLE_FROM_SLOT && previous) {
        const friendly = options.filter((c) => compatible(c, previous));
        if (friendly.length) options = friendly;
      }
      this.cards.push(pick(rng, options.length ? options : unlocked));
    }
    return this.cards[slot - 1]!;
  }

  /** Active rules in a slot: the slot's card, plus the previous one from the third slot on. */
  rulesFor(slot: number): RuleId[] {
    if (slot === 0) return [];
    const current = this.card(slot);
    if (slot < DOUBLE_FROM_SLOT) return [current];
    const previous = this.card(slot - 1);
    return compatible(current, previous) ? [current, previous] : [current];
  }

  round(index: number): RoundPlan {
    while (this.rounds.length < index) this.rounds.push(this.plan(this.rounds.length + 1));
    return this.rounds[index - 1]!;
  }

  private plan(index: number): RoundPlan {
    const { seed, reducedSpeed } = this.options;
    const roundSeed = hashString(`${seed}:round:${index}`);
    const rng = createRng(roundSeed);
    const bpm = bpmFor(index, reducedSpeed);
    const difficulty = difficultyFor(index);
    const slot = slotFor(index);
    const flips = cardFlipsBefore(index);
    const card = flips ? this.card(slot) : null;
    const newCard = flips && !this.options.daily && slot > this.options.cardsUnlocked && slot <= CARD_ORDER.length;
    const base = { index, tier: tierFor(index), bpm, difficulty, window: windowBeats(difficulty, bpm), card, newCard, seed: roundSeed };

    if (isBossRound(index)) {
      const boss = BOSS_ORDER[(index / BOSS_EVERY - 1) % BOSS_ORDER.length]!;
      return { ...base, game: boss, boss: true, beats: BOSS_BEATS, rules: [], red: false, crown: null };
    }

    const rules = this.rulesFor(slot);
    const pool = allowedUnder(
      this.options.pool.map((id) => MICROGAMES[id]),
      rules,
    ).map((g) => g.id);
    // Never the same microgame within three rounds (when there's enough to choose from).
    const recent = this.rounds.slice(-3).map((r) => r.game);
    const fresh = pool.filter((id) => !recent.includes(id));
    const game = pick(rng, fresh.length ? fresh : pool.length ? pool : MICROGAME_IDS.filter((id) => MICROGAMES[id].invertible));
    const red = rules.includes("redMeansNo") && rng() < 0.4;
    const crown = rules.includes("simonSays") ? rng() >= 0.4 : null;
    return { ...base, game, boss: false, beats: GAME_BEATS, rules, red, crown };
  }
}

/** Points for a round you won (Plan §7): 1, +1 with two rules active, +5 for a boss. */
export function pointsFor(round: Pick<RoundPlan, "boss" | "rules">): number {
  if (round.boss) return 6;
  return round.rules.length >= 2 ? 2 : 1;
}

export interface RunState {
  lives: number;
  score: number;
  /** The next round to play (1-based). */
  next: number;
  streak: number;
  bestStreak: number;
  cleared: number;
  bosses: number;
  /** The round that took your last life. */
  diedTo: MicrogameId | BossId | null;
}

export const newRunState = (): RunState => ({ lives: LIVES, score: 0, next: 1, streak: 0, bestStreak: 0, cleared: 0, bosses: 0, diedTo: null });

export function applyResult(state: RunState, round: RoundPlan, won: boolean, { infinite = false } = {}): RunState {
  if (won) {
    const streak = state.streak + 1;
    return {
      ...state,
      next: state.next + 1,
      score: state.score + pointsFor(round),
      streak,
      bestStreak: Math.max(state.bestStreak, streak),
      cleared: state.cleared + 1,
      bosses: state.bosses + (round.boss ? 1 : 0),
    };
  }
  const lives = infinite ? state.lives : state.lives - 1;
  return { ...state, next: state.next + 1, lives, streak: 0, diedTo: lives <= 0 ? round.game : state.diedTo };
}

export const isOver = (state: RunState) => state.lives <= 0;
