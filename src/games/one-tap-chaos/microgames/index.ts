// All 24 microgames and the 3 bosses (Plan/09-one-tap-chaos.md §3), and when each one unlocks.
import { pick } from "@/engine/rng";
import { beat } from "./beat";
import { bigger } from "./bigger";
import { conductor } from "./bosses/conductor";
import { finalTap } from "./bosses/final-tap";
import { liar } from "./bosses/liar";
import { catchGame } from "./catch";
import { count } from "./count";
import { cut } from "./cut";
import { dodge } from "./dodge";
import { dont } from "./dont";
import { flip } from "./flip";
import { freeze } from "./freeze";
import { highFive } from "./high-five";
import { jump } from "./jump";
import { kick } from "./kick";
import { MYSTERY_POOL } from "./kit";
import { land } from "./land";
import { loading } from "./loading";
import { match } from "./match";
import { pump } from "./pump";
import { shoot } from "./shoot";
import { sleep } from "./sleep";
import { snap } from "./snap";
import { stack } from "./stack";
import { stop } from "./stop";
import { swat } from "./swat";
import type { Boss, BossId, Microgame, MicrogameId } from "./types";
import { wait } from "./wait";

/** ??? — one of the other microgames, with the instruction hidden. The scene shows what to do. */
const mystery: Microgame = {
  id: "mystery",
  instruction: "???",
  hint: "No instruction at all. The scene always shows what to do.",
  invertible: false,
  refrain: false,
  bg: "#2B2D42",
  cue: "mystery",
  caption: "???",
  create: (ctx) => MICROGAMES[pick(ctx.rng, MYSTERY_POOL)].create(ctx),
};

export const MICROGAMES: Record<MicrogameId, Microgame> = {
  jump,
  catch: catchGame,
  stop,
  dont,
  shoot,
  pump,
  flip,
  wait,
  count,
  dodge,
  beat,
  cut,
  snap,
  kick,
  "high-five": highFive,
  sleep,
  bigger,
  match,
  stack,
  land,
  freeze,
  swat,
  loading,
  mystery,
};

/** In the plan's order. */
export const MICROGAME_IDS = Object.keys(MICROGAMES) as MicrogameId[];

export const BOSSES: Record<BossId, Boss> = { conductor, liar, "final-tap": finalTap };
/** Bosses take turns: #10 the Conductor, #20 the Liar, #30 the Final Tap, then round again. */
export const BOSS_ORDER: BossId[] = ["conductor", "liar", "final-tap"];

export function getGame(id: MicrogameId | BossId): Microgame<MicrogameId | BossId> {
  return (id in BOSSES ? BOSSES[id as BossId] : MICROGAMES[id as MicrogameId]) as Microgame<MicrogameId | BossId>;
}

/** You start with 12. The rest unlock as your best score grows (Plan §5). */
export const STARTERS: MicrogameId[] = ["jump", "catch", "stop", "dont", "shoot", "pump", "flip", "wait", "high-five", "sleep", "stack", "bigger"];

export const UNLOCKS: ReadonlyArray<{ score: number; games: MicrogameId[] }> = [
  { score: 10, games: ["count", "dodge", "loading"] },
  { score: 20, games: ["beat", "match", "swat"] },
  { score: 30, games: ["snap", "cut"] },
  { score: 40, games: ["kick", "land"] },
  { score: 50, games: ["freeze", "mystery"] },
];

export function unlockedMicrogames(best: number): MicrogameId[] {
  const open = new Set<MicrogameId>(STARTERS);
  for (const step of UNLOCKS) if (best >= step.score) step.games.forEach((g) => open.add(g));
  return MICROGAME_IDS.filter((id) => open.has(id));
}

/** The score a locked microgame needs, or 0 if it's open from the start. */
export function unlockScore(id: MicrogameId): number {
  return UNLOCKS.find((step) => step.games.includes(id))?.score ?? 0;
}

/** Microgames newly unlocked by going from one best score to another. */
export function newlyUnlocked(before: number, after: number): MicrogameId[] {
  return UNLOCKS.filter((step) => before < step.score && after >= step.score).flatMap((step) => step.games);
}
