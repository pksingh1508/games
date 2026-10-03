// Medal times (Plan/06-trapsprint.md §3): Bronze, Silver, Gold, and Dev, the designer's best.
// Dev times come from the solver's recorded runs (levels/dev-runs.ts); the others are generous
// multiples of it, rounded up to a tenth of a second.
import { DEV_RUNS } from "../levels/dev-runs";

export type Medal = "dev" | "gold" | "silver" | "bronze";

export const MEDALS: readonly Medal[] = ["dev", "gold", "silver", "bronze"];

export interface MedalTimes {
  /** All in ticks (1/60 s). */
  dev: number;
  gold: number;
  silver: number;
  bronze: number;
}

/** Round up to the next tenth of a second, in ticks. */
const upToTenth = (ticks: number) => Math.ceil(ticks / 6 - 1e-9) * 6;

export function medalTimesFor(devTicks: number): MedalTimes {
  const gold = upToTenth(devTicks * 1.15);
  return { dev: devTicks, gold, silver: upToTenth(gold * 1.35), bronze: upToTenth(gold * 1.9) };
}

/**
 * A level's medal times. A level whose trap moves after your first death has a Dev run for each
 * layout; the slower one sets the times, so every medal is fair in both.
 */
export function medalTimes(levelId: string): MedalTimes {
  const run = DEV_RUNS[levelId];
  if (!run) throw new Error(`No dev run for ${levelId}`);
  return medalTimesFor(Math.max(run.ticks, run.retry?.ticks ?? 0));
}

/** The best medal a time earns (null: cleared, but slower than Bronze). */
export function medalFor(ticks: number, times: MedalTimes): Medal | null {
  if (ticks <= times.dev) return "dev";
  if (ticks <= times.gold) return "gold";
  if (ticks <= times.silver) return "silver";
  if (ticks <= times.bronze) return "bronze";
  return null;
}

/** Better medals sort first. */
export const medalRank = (medal: Medal | null | undefined) => (medal ? MEDALS.length - MEDALS.indexOf(medal) : 0);

export const MEDAL_NAMES: Record<Medal, string> = { dev: "Dev", gold: "Gold", silver: "Silver", bronze: "Bronze" };
export const MEDAL_EMOJI: Record<Medal, string> = { dev: "💀", gold: "🥇", silver: "🥈", bronze: "🥉" };

/** "8.31 s"-style time from ticks. */
export function formatTime(ticks: number): string {
  return `${(ticks / 60).toFixed(2)} s`;
}

/** A compact clock for the HUD: "8.31", "1:02.45". */
export function formatClock(ticks: number): string {
  const total = ticks / 60;
  const minutes = Math.floor(total / 60);
  const seconds = total - minutes * 60;
  return minutes > 0 ? `${minutes}:${seconds.toFixed(2).padStart(5, "0")}` : seconds.toFixed(2);
}
