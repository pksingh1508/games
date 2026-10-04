// What a run does to the save, and which trophies it earns (Plan/13-wrong-door.md §7). Pure functions.
import { CODEX_BY_ID, type CodexId } from "./content/codex";
import type { Consequence, Floor } from "./logic/types";
import { pathEmoji, reached, scoreOf, type RunState } from "./run/state";
import type { WrongDoorSave } from "./save";

export type AchievementId = "the-switch" | "double-negative" | "no-knock" | "sharp-eyes" | "untouched" | "believer";

/** Anomalies to spot for Sharp Eyes. */
export const SHARP_EYES = 10;

export interface Update {
  save: WrongDoorSave;
  unlock: AchievementId[];
  /** Codex pages found just now. */
  pages: CodexId[];
}

/** Add codex pages (the ones you didn't have yet are returned). */
export function addPages(save: WrongDoorSave, ids: readonly CodexId[], now = Date.now()): { save: WrongDoorSave; pages: CodexId[] } {
  const fresh = ids.filter((id) => !save.codex[id] && CODEX_BY_ID.has(id));
  if (!fresh.length) return { save, pages: [] };
  return { save: { ...save, codex: { ...save.codex, ...Object.fromEntries(fresh.map((id) => [id, now])) } }, pages: fresh };
}

/** Up a floor. */
export function recordClimb(save: WrongDoorSave, floor: Floor, { spotted, switched }: { spotted: boolean; switched: boolean }): Update {
  const stats = { ...save.stats, floors: save.stats.floors + 1 };
  const unlock: AchievementId[] = [];
  const pages: CodexId[] = [];
  if (spotted) {
    stats.anomalies++;
    if (stats.anomalies >= SHARP_EYES) unlock.push("sharp-eyes");
  }
  if (floor.lucky) {
    stats.luckyPlays++;
    stats.luckyWins++;
    if (switched) {
      stats.luckySwitches++;
      unlock.push("the-switch");
    }
    pages.push("lucky");
  }
  if (floor.final) {
    unlock.push("believer");
    pages.push("final");
  }
  const added = addPages({ ...save, stats }, pages);
  return { save: added.save, unlock, pages: added.pages };
}

/** A wrong door. */
export function recordWrong(save: WrongDoorSave, floor: Floor, consequence: Consequence, { switched }: { switched: boolean }): Update {
  const stats = { ...save.stats, wrongDoors: save.stats.wrongDoors + 1 };
  const pages: CodexId[] = [consequence];
  if (floor.lucky) {
    stats.luckyPlays++;
    if (switched) stats.luckySwitches++;
    pages.push("lucky");
  }
  if (floor.final) pages.push("final");
  if (floor.doorman && (floor.doorman.hat === "off" || floor.dark)) pages.push("double");
  const added = addPages({ ...save, stats }, pages);
  return { save: added.save, unlock: [], pages: added.pages };
}

/** The end of a run: escaped, out of keys, or walked away from. */
export function recordRunEnd(save: WrongDoorSave, run: RunState): Update {
  const escaped = run.status === "escaped";
  const score = scoreOf(run);
  const stats = {
    ...save.stats,
    runs: save.stats.runs + 1,
    escapes: save.stats.escapes + (escaped ? 1 : 0),
    storyEscapes: save.stats.storyEscapes + (escaped && run.mode === "story" ? 1 : 0),
    bestEndless: run.mode === "endless" ? Math.max(save.stats.bestEndless, reached(run)) : save.stats.bestEndless,
    bestScore: Math.max(save.stats.bestScore, score),
    knocks: save.stats.knocks + run.stats.knocks,
    questions: save.stats.questions + run.stats.questions,
  };
  const daily =
    run.mode === "daily" && run.daily && !save.daily[run.daily]
      ? { ...save.daily, [run.daily]: { floor: reached(run), wrong: run.stats.wrong, keys: run.keys, escaped, grid: pathEmoji(run), score } }
      : save.daily;
  const unlock: AchievementId[] = [];
  if (escaped && run.stats.wrong === 0) unlock.push("untouched");
  if (escaped && run.stats.knocks === 0) unlock.push("no-knock");
  return { save: { ...save, stats, daily, run: null }, unlock, pages: [] };
}

/** The share card for a finished run (Plan §7). */
export function shareText(run: RunState, dailyNumber: number | null, url: string): string {
  const title = run.mode === "daily" && dailyNumber ? `WRONG DOOR · Daily #${dailyNumber}` : run.mode === "endless" ? "WRONG DOOR · Endless" : "WRONG DOOR";
  const wrong = run.stats.wrong;
  const parts = [`Floor ${reached(run)} ${run.status === "escaped" ? "escaped" : "reached"}`, `${wrong} wrong ${wrong === 1 ? "door" : "doors"}`, `${run.keys} ${run.keys === 1 ? "key" : "keys"} left`];
  return [title, pathEmoji(run), parts.join(" · "), url].join("\n");
}
