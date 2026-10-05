// What a night does to the save, and which trophies it earns (Plan/14-dont-blink.md §7). Pure functions.
import { IRON_EYES_TICKS } from "./core/constants";
import type { NightResult, Rank } from "./core/game";
import { emptyNight, type DontBlinkSave } from "./save";

export type AchievementId = "perfect-shift" | "eagle-eye" | "iron-eyes" | "statue-of-limitations" | "counted-it" | "who-are-you";

/** Times the Visitor goes home for Statue of Limitations, and count anomalies for Counted It. */
export const SENT_HOME = 10;
export const COUNTS = 5;

/** The nights, in order. */
export const NIGHT_NUMBERS = [1, 2, 3, 4, 5] as const;

/** Ranks, best first. */
export const RANKS: readonly Rank[] = ["hawk-eye", "night-owl", "sleepy", "fired"];

export const RANK_NAMES: Record<Rank, string> = { "hawk-eye": "Hawk Eye", "night-owl": "Night Owl", sleepy: "Sleepy", fired: "Fired" };

const better = (a: Rank | null, b: Rank | null): Rank | null => {
  if (!a) return b;
  if (!b) return a;
  return RANKS.indexOf(a) <= RANKS.indexOf(b) ? a : b;
};

export const isCleared = (save: DontBlinkSave, night: number) => (save.nights[night]?.clears ?? 0) > 0;

/** Nights open one after another. */
export const isOpen = (save: DontBlinkSave, night: number) => night === 1 || isCleared(save, night - 1);

/** Endless Night and Custom Night open once you've survived a full shift (Night 2). */
export const modesOpen = (save: DontBlinkSave) => isCleared(save, 2);

/** The next night to play: the first open one not yet survived (or the last). */
export const nextNight = (save: DontBlinkSave) => NIGHT_NUMBERS.find((n) => isOpen(save, n) && !isCleared(save, n)) ?? 5;

/** A night is over: the record, the totals and the trophies. */
export function recordNight(save: DontBlinkSave, result: NightResult) {
  const unlock: AchievementId[] = [];
  const stats = {
    shifts: save.stats.shifts + 1,
    reported: save.stats.reported + result.reported,
    falseReports: save.stats.falseReports + result.falseReports,
    visitorHome: save.stats.visitorHome + result.visitorHome,
    counts: save.stats.counts + result.counts,
  };
  let next: DontBlinkSave = { ...save, stats };
  const won = result.status === "won";
  let newBest = false;
  if (result.mode === "night") {
    const before = save.nights[result.night] ?? emptyNight();
    const rank = won && result.rank !== "fired" ? result.rank : null;
    const best = better(before.best, rank) as "hawk-eye" | "night-owl" | "sleepy" | null;
    newBest = !!rank && best !== before.best;
    next = {
      ...next,
      nights: {
        ...next.nights,
        [result.night]: { tries: before.tries + 1, clears: before.clears + (won ? 1 : 0), best, perfect: before.perfect || (won && result.falseReports === 0) },
      },
    };
  } else if (result.mode === "endless") {
    newBest = result.hours > save.endless.best + 0.005;
    next = { ...next, endless: { best: Math.max(save.endless.best, result.hours), runs: save.endless.runs + 1 } };
  }
  if (won && result.falseReports === 0) unlock.push("perfect-shift");
  if (result.eagle) unlock.push("eagle-eye");
  if (result.heldTicks >= IRON_EYES_TICKS) unlock.push("iron-eyes");
  if (stats.visitorHome >= SENT_HOME) unlock.push("statue-of-limitations");
  if (stats.counts >= COUNTS) unlock.push("counted-it");
  return { save: next, unlock, newBest };
}

/** Saw the ending. */
export function recordEnding(save: DontBlinkSave) {
  return { save: save.ending ? save : { ...save, ending: true }, unlock: ["who-are-you"] as AchievementId[] };
}

/** Hours, the way the clock would put them: "7 h 24 m". */
export function hoursText(hours: number) {
  const whole = Math.floor(hours);
  const minutes = Math.floor((hours - whole) * 60);
  return `${whole} h ${String(minutes).padStart(2, "0")} m`;
}

/** The share card: nothing leaves the device unless you share it. */
export function shareText(result: Pick<NightResult, "mode" | "night" | "hours" | "reported" | "rank">, url: string) {
  const eyes = "👁".repeat(Math.max(1, Math.min(12, Math.round(result.hours))));
  if (result.mode === "endless") return `Don't Blink: Endless Night\n${eyes}\nI kept watch for ${hoursText(result.hours)}. Then I blinked.\n${url}`;
  const rank = result.rank ? RANK_NAMES[result.rank] : "Survived";
  const what = result.mode === "night" ? `Night ${result.night}` : "Custom Night";
  return `Don't Blink: ${what}\n${eyes}\n06:00 AM. ${result.reported} changes reported. Rank: ${rank}.\n${url}`;
}
