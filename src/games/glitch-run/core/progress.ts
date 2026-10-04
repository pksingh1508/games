// What a run does to the save, and which trophies it earns (Plan/07-glitch-run.md §7). Pure
// functions: easy to test, and the game just applies the result.
import { STAGE_IDS } from "../stages";
import { emptyStage, type GlitchSave } from "../save";
import type { RunResult } from "../play/runtime";

export type AchievementId = "living-dangerously" | "kernel-survivor" | "blind-faith" | "shadow-reader" | "wontfix" | "clean-code";

/** Living Dangerously: a minute above 80% corruption, in one run. */
export const DANGER_TICKS = 3600;
/** Shadow Reader: ten Screen Tears survived, in all. */
export const TEARS_GOAL = 10;

export interface Update {
  save: GlitchSave;
  unlock: AchievementId[];
  newBest: boolean;
}

/** Totals and the trophies any run can earn. */
function tally(save: GlitchSave, r: RunResult): { save: GlitchSave; unlock: AchievementId[] } {
  const totals = {
    runs: save.totals.runs + 1,
    deaths: save.totals.deaths + (r.won ? 0 : 1),
    metres: save.totals.metres + r.metres,
    clips: save.totals.clips + r.clips,
    panics: save.totals.panics + r.panicsSurvived,
    tears: save.totals.tears + r.tearsSurvived,
  };
  const unlock: AchievementId[] = [];
  if (r.above80 >= DANGER_TICKS) unlock.push("living-dangerously");
  if (r.panicsSurvived > 0) unlock.push("kernel-survivor");
  if (r.blindRuns > 0) unlock.push("blind-faith");
  if (totals.tears >= TEARS_GOAL) unlock.push("shadow-reader");
  return { save: { ...save, totals }, unlock };
}

export function recordStage(save: GlitchSave, stageId: string, r: RunResult): Update {
  const t = tally(save, r);
  const before = save.stages[stageId] ?? emptyStage();
  const newBest = r.won && r.score > before.best;
  const record = {
    clears: before.clears + (r.won ? 1 : 0),
    deaths: before.deaths + (r.won ? 0 : 1),
    best: newBest ? r.score : before.best,
    clean: before.clean || (r.won && !r.glitched),
  };
  if (r.won && !r.glitched) t.unlock.push("clean-code");
  return { save: { ...t.save, stages: { ...t.save.stages, [stageId]: record } }, unlock: t.unlock, newBest };
}

export function recordEndless(save: GlitchSave, r: RunResult, daily: string | null): Update {
  const t = tally(save, r);
  if (daily) {
    const before = save.daily[daily] ?? { best: 0, metres: 0, runs: 0 };
    const newBest = r.score > before.best;
    const day = { best: Math.max(before.best, r.score), metres: Math.max(before.metres, r.metres), runs: before.runs + 1 };
    return { save: { ...t.save, daily: { ...t.save.daily, [daily]: day } }, unlock: t.unlock, newBest };
  }
  const newBest = r.score > save.endless.best;
  const endless = { runs: save.endless.runs + 1, best: Math.max(save.endless.best, r.score), metres: Math.max(save.endless.metres, r.metres) };
  return { save: { ...t.save, endless }, unlock: t.unlock, newBest };
}

/** The ending (Plan §5): "Fix the bug?" — and Wontfix for refusing. */
export function recordEnding(save: GlitchSave, choice: "fixed" | "wontfix"): Update {
  return { save: { ...save, ending: choice === "wontfix" ? "wontfix" : (save.ending ?? "fixed") }, unlock: choice === "wontfix" ? ["wontfix"] : [], newBest: false };
}

export const isCleared = (save: GlitchSave, id: string) => (save.stages[id]?.clears ?? 0) > 0;

/** Stages open one after another. */
export function isOpen(save: GlitchSave, id: string): boolean {
  const i = STAGE_IDS.indexOf(id);
  return i === 0 || (i > 0 && isCleared(save, STAGE_IDS[i - 1]!));
}

/** Endless and the daily open once the first stage is cleared. */
export const endlessOpen = (save: GlitchSave) => isCleared(save, STAGE_IDS[0]!);
