// What a round or a run changes in your save, and which achievements it earns. Pure functions,
// so they're easy to test; index.tsx writes the result to the save.
import type { OtcAchievementId } from "../achievements";
import { newlyUnlocked } from "../microgames";
import type { MicrogameId } from "../microgames/types";
import type { OtcSave } from "../save";
import type { Daily } from "./daily";
import type { RoundReport, RunSummary, SessionMode } from "./session";

/** Counters that only matter within one run. */
export interface RunTracker {
  simonStreak: number;
  doubleClears: number;
}

export const newTracker = (): RunTracker => ({ simonStreak: 0, doubleClears: 0 });

const counts = (mode: SessionMode) => mode === "run" || mode === "daily";

export function recordRound(save: OtcSave, tracker: RunTracker, report: RoundReport, mode: SessionMode) {
  const unlock: OtcAchievementId[] = [];
  if (mode === "demo") return { save, tracker, unlock };
  const { plan, won } = report;
  let next: OtcSave = { ...save };

  if (!plan.boss && !next.seen.includes(plan.game)) next.seen = [...next.seen, plan.game];
  if (plan.boss && !next.bossesSeen.includes(plan.game)) next.bossesSeen = [...next.bossesSeen, plan.game];

  if (mode === "practice") {
    const before = next.practice[plan.game] ?? { wins: 0, losses: 0 };
    next.practice = { ...next.practice, [plan.game]: { wins: before.wins + (won ? 1 : 0), losses: before.losses + (won ? 0 : 1) } };
    return { save: next, tracker, unlock };
  }

  const stats = { ...next.stats };
  stats.cleared += won ? 1 : 0;
  stats.failed += won ? 0 : 1;
  if (plan.boss && won) stats.bossesBeaten += 1;
  if (plan.game === "dont" && !plan.rules.includes("opposite") && report.tapped) stats.flySwats += 1;
  if (report.noTap) stats.refrainStreak = won ? stats.refrainStreak + 1 : 0;
  next = { ...next, stats };

  const t = { ...tracker };
  if (!plan.boss) {
    if (plan.rules.includes("simonSays")) t.simonStreak = won ? t.simonStreak + 1 : 0;
    else t.simonStreak = 0;
    if (won && plan.rules.length >= 2) t.doubleClears += 1;
  }

  if (counts(mode)) {
    if (stats.refrainStreak >= 10) unlock.push("self-control");
    if (t.simonStreak >= 5) unlock.push("simon-who");
    if (t.doubleClears >= 5) unlock.push("double-trouble");
    if (plan.game === "conductor" && won) unlock.push("conductor");
    if (report.state.score >= 50) unlock.push("fifty");
    if (stats.flySwats >= 5) unlock.push("couldnt-resist");
  }
  return { save: next, tracker: t, unlock };
}

export interface RunEnd {
  save: OtcSave;
  newBest: boolean;
  previousBest: number;
  unlocked: MicrogameId[];
  dailyBest: boolean;
}

export function recordRun(save: OtcSave, summary: RunSummary, daily: Daily | null): RunEnd {
  const { state, mode } = summary;
  const next: OtcSave = { ...save, stats: { ...save.stats, playMs: save.stats.playMs + Math.round(summary.playedMs) } };
  if (mode === "demo" || mode === "practice") return { save: next, newBest: false, previousBest: save.best, unlocked: [], dailyBest: false };

  next.runs += 1;
  next.bestStreak = Math.max(next.bestStreak, state.bestStreak);
  let newBest = false;
  let unlocked: MicrogameId[] = [];
  if (mode === "run" && state.score > save.best) {
    newBest = save.best > 0 || state.score > 0;
    unlocked = newlyUnlocked(save.best, state.score);
    next.best = state.score;
  }

  let dailyBest = false;
  if (mode === "daily" && daily) {
    const today = save.daily?.key === daily.key ? save.daily : null;
    dailyBest = !today || state.score > today.best;
    next.daily = {
      key: daily.key,
      number: daily.number,
      attempts: (today?.attempts ?? 0) + 1,
      best: dailyBest ? state.score : today!.best,
      bosses: dailyBest ? state.bosses : today!.bosses,
      diedTo: dailyBest ? state.diedTo : today!.diedTo,
    };
  }
  return { save: next, newBest, previousBest: save.best, unlocked, dailyBest };
}
