// What a level does to the save, and which trophies it earns (Plan/12-cursor-escape.md §7). Pure
// functions: easy to test, and the game just applies the result.
import { DRIVES, LEVEL_IDS } from "../levels";
import { emptyLevel, type CursorSave } from "../save";
import type { LevelResult } from "../play/runtime";

export type AchievementId = "steady-hand" | "ambidextrous" | "identity-crisis" | "speed-clicker" | "uninstall-denied" | "free-at-last";
export type Medal = "gold" | "silver" | "bronze";

/** Ambidextrous: this many inverted or rotated stretches got through. */
export const TURNED_GOAL = 5;
/** Speed Clicker: C:\-01 in under 3 seconds. */
export const SPEED_TICKS = 360;

export function medalFor(medals: { gold: number; silver: number; bronze: number }, ticks: number): Medal | null {
  if (ticks <= medals.gold) return "gold";
  if (ticks <= medals.silver) return "silver";
  if (ticks <= medals.bronze) return "bronze";
  return null;
}

const RANK: Record<Medal, number> = { gold: 3, silver: 2, bronze: 1 };

export interface WinUpdate {
  save: CursorSave;
  unlock: AchievementId[];
  medal: Medal | null;
  best: number;
  newBest: boolean;
}

export function recordWin(save: CursorSave, levelId: string, medals: { gold: number; silver: number; bronze: number }, r: LevelResult, assisted: boolean): WinUpdate {
  const before = save.levels[levelId] ?? emptyLevel();
  const medal = assisted ? null : medalFor(medals, r.ticks);
  const newBest = !assisted && (before.best === null || r.ticks < before.best);
  const record = {
    clears: before.clears + 1,
    crashes: before.crashes,
    best: newBest ? r.ticks : before.best,
    medal: medal && (!before.medal || RANK[medal] > RANK[before.medal]) ? medal : before.medal,
    clean: before.clean || (r.crashes === 0 && !assisted),
  };
  let next: CursorSave = { ...save, levels: { ...save.levels, [levelId]: record } };
  const unlock: AchievementId[] = [];
  if (!assisted && levelId === "C-01" && r.ticks < SPEED_TICKS) unlock.push("speed-clicker");
  if (r.found) unlock.push("identity-crisis");
  if (levelId.startsWith("X")) unlock.push("uninstall-denied");
  // Steady Hand: every level of a drive cleared in one go.
  const drive = DRIVES.find((d) => d.levels.some((l) => l.id === levelId));
  if (drive && !assisted && drive.levels.every((l) => next.levels[l.id]?.clean)) unlock.push("steady-hand");
  next = { ...next };
  return { save: next, unlock, medal, best: record.best ?? r.ticks, newBest };
}

export function recordCrash(save: CursorSave, levelId: string): CursorSave {
  const before = save.levels[levelId] ?? emptyLevel();
  return { ...save, crashes: save.crashes + 1, levels: { ...save.levels, [levelId]: { ...before, crashes: before.crashes + 1 } } };
}

/** A turned stretch got through: Ambidextrous at five. */
export function recordTurned(save: CursorSave): { save: CursorSave; unlock: AchievementId[] } {
  const turnedClean = save.stats.turnedClean + 1;
  return { save: { ...save, stats: { ...save.stats, turnedClean } }, unlock: turnedClean >= TURNED_GOAL ? ["ambidextrous"] : [] };
}

export const isCleared = (save: CursorSave, id: string) => (save.levels[id]?.clears ?? 0) > 0;

/** Levels open one after another (each drive opens with its first). */
export function isOpen(save: CursorSave, id: string): boolean {
  const i = LEVEL_IDS.indexOf(id);
  return i === 0 || (i > 0 && isCleared(save, LEVEL_IDS[i - 1]!));
}
