// What a level does to the save, and which trophies it earns (Plan/01-one-more-step.md §7). Pure functions.
import { FINAL_LEVEL, LEVEL_IDS, stepsOf, WORLDS } from "./levels";
import { emptyLevel, type OmsSave } from "./save";

export type AchievementId = "catch-me" | "architect" | "echo-chamber" | "undo-ne" | "perfectionist" | "zero-steps" | "doctors-orders";

export const ECHO_CHAMBER = 10;
export const UNDO_NE = 1000;
export const DOCTORS_ORDERS = 10_000;

/** Stars for a clear in `steps` (bits): 1 cleared, 2 within par, 4 the solver's own count. */
export function starsFor(id: string, steps: number): number {
  const { optimal, par } = stepsOf(id);
  return 1 | (steps <= par ? 2 : 0) | (steps <= optimal ? 4 : 0);
}

export const countStars = (bits: number) => (bits & 1) + ((bits >> 1) & 1) + ((bits >> 2) & 1);

export interface Clear {
  steps: number;
  /** Doory was caught within 3 ticks of first running. */
  quick: boolean;
  /** Doory was cornered by nothing but holes you made. */
  architect: boolean;
}

export function recordClear(save: OmsSave, id: string, clear: Clear) {
  const before = save.levels[id] ?? emptyLevel();
  const stars = starsFor(id, clear.steps);
  const record = { clears: before.clears + 1, stars: before.stars | stars, best: before.best === null ? clear.steps : Math.min(before.best, clear.steps) };
  const next: OmsSave = { ...save, levels: { ...save.levels, [id]: record }, finished: save.finished || id === FINAL_LEVEL };
  const unlock: AchievementId[] = [];
  if (clear.quick) unlock.push("catch-me");
  if (clear.architect) unlock.push("architect");
  if (id === FINAL_LEVEL) unlock.push("zero-steps");
  const world = WORLDS.find((w) => w.levels.some((l) => l.id === id));
  if (world && world.levels.length > 1 && world.levels.every((l) => (next.levels[l.id]?.stars ?? 0) === 7)) unlock.push("perfectionist");
  return { save: next, unlock, stars, newBest: before.best === null || clear.steps < before.best };
}

/** Lifetime stats, as they happen. */
export function recordStats(save: OmsSave, add: Partial<OmsSave["stats"]>): { save: OmsSave; unlock: AchievementId[] } {
  const stats = { ...save.stats };
  for (const [k, n] of Object.entries(add) as Array<[keyof OmsSave["stats"], number]>) stats[k] = k === "resets" ? Math.max(stats[k], n) : stats[k] + n;
  const unlock: AchievementId[] = [];
  if (stats.echoDeaths >= ECHO_CHAMBER) unlock.push("echo-chamber");
  if (stats.undos >= UNDO_NE) unlock.push("undo-ne");
  if (stats.steps >= DOCTORS_ORDERS) unlock.push("doctors-orders");
  return { save: { ...save, stats }, unlock };
}

export const isCleared = (save: OmsSave, id: string) => (save.levels[id]?.clears ?? 0) > 0;

/** Levels open one after another. */
export function isOpen(save: OmsSave, id: string): boolean {
  const i = LEVEL_IDS.indexOf(id);
  return i === 0 || (i > 0 && isCleared(save, LEVEL_IDS[i - 1]!));
}

export function starTotals(save: OmsSave) {
  return { got: LEVEL_IDS.reduce((n, id) => n + countStars(save.levels[id]?.stars ?? 0), 0), of: LEVEL_IDS.length * 3 };
}
