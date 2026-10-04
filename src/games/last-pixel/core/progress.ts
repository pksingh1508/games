// What a level does to the save, and which trophies it earns (Plan/10-last-pixel.md §7). Pure functions:
// easy to test, and the game just applies the result.
import { BONUS_LEVEL, FINAL_LEVEL, LEVEL_IDS, WORLDS } from "../levels";
import { emptyLevel, type LastPixelSave } from "../save";
import { GOTCHA_TICKS } from "./constants";
import type { LevelResult } from "./world";

export type AchievementId = "perfectionist" | "gotcha" | "not-my-monitor" | "net-worth" | "logo-complete" | "tab-hunter";

/** Net Worth: this many catches in the net. */
export const NET_WORTH = 25;

export const starBits = (stars: readonly boolean[]) => stars.reduce((n, s, i) => n | (s ? 1 << i : 0), 0);
export const countStars = (bits: number) => (bits & 1) + ((bits >> 1) & 1) + ((bits >> 2) & 1);

export interface WinUpdate {
  save: LastPixelSave;
  unlock: AchievementId[];
  /** This time's stars (bits). */
  stars: number;
  newBestClean: boolean;
  newBestHunt: boolean;
}

export function recordWin(save: LastPixelSave, levelId: string, result: LevelResult, stars: readonly boolean[]): WinUpdate {
  const before = save.levels[levelId] ?? emptyLevel();
  const bits = starBits(stars);
  const newBestClean = before.bestClean === null || result.cleanTicks < before.bestClean;
  const newBestHunt = !result.assisted && (before.bestHunt === null || result.huntTicks < before.bestHunt);
  const record = {
    clears: before.clears + 1,
    stars: before.stars | bits,
    bestClean: newBestClean ? result.cleanTicks : before.bestClean,
    bestHunt: newBestHunt ? result.huntTicks : before.bestHunt,
  };
  const stats = {
    ...save.stats,
    catches: save.stats.catches + 1,
    netCatches: save.stats.netCatches + result.netCatches,
    outed: save.stats.outed + (result.outed ? 1 : 0),
  };
  const next: LastPixelSave = { ...save, levels: { ...save.levels, [levelId]: record }, stats };
  const unlock: AchievementId[] = [];
  if (!result.assisted && result.huntTicks < GOTCHA_TICKS) unlock.push("gotcha");
  if (result.outed) unlock.push("not-my-monitor");
  if (stats.netCatches >= NET_WORTH) unlock.push("net-worth");
  if (levelId === FINAL_LEVEL) unlock.push("logo-complete");
  if (result.tabbed) unlock.push("tab-hunter");
  // Perfectionist: every level of a world, three stars.
  const world = WORLDS.find((w) => w.levels.some((l) => l.id === levelId));
  if (world && world.levels.length > 1 && world.levels.every((l) => (next.levels[l.id]?.stars ?? 0) === 7)) unlock.push("perfectionist");
  return { save: next, unlock, stars: bits, newBestClean, newBestHunt };
}

export const isCleared = (save: LastPixelSave, id: string) => (save.levels[id]?.clears ?? 0) > 0;

/** Levels open one after another; the finale only needs 4-09 (the tab escape is a bonus). */
export function isOpen(save: LastPixelSave, id: string): boolean {
  const i = LEVEL_IDS.indexOf(id);
  if (i === 0) return true;
  if (i < 0) return false;
  if (id === FINAL_LEVEL) return isCleared(save, "4-09");
  if (id === BONUS_LEVEL) return isCleared(save, "4-09");
  return isCleared(save, LEVEL_IDS[i - 1]!);
}

/** All the stars there are, and how many you've got. */
export function starTotals(save: LastPixelSave) {
  return { got: LEVEL_IDS.reduce((n, id) => n + countStars(save.levels[id]?.stars ?? 0), 0), of: LEVEL_IDS.length * 3 };
}
