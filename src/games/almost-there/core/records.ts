// What a jump, a fall, a feather and a summit do to the game's record, and which achievements they
// earn (Plan/08-almost-there.md §7). Pure functions: easy to test, and the game just applies them.
import type { AlmostThereSave, Best } from "../save";
import type { Climb } from "./climb";
import { METRE, VIEW_H } from "./constants";

export type AchievementId = "gravity-tourist" | "fooled-once" | "never-again" | "clean-climb" | "the-long-way-down" | "feather-collector" | "mirror-climber";

export const FEATHER_COUNT = 12;
/** Gravity Tourist: a kilometre of falling, all climbs together. */
export const KILOMETRE_PX = 1000 * METRE;
/** The Long Way Down: four screens in one go. */
export const LONG_WAY_DOWN_PX = 4 * VIEW_H;
/** Clean Climb: the summit with fewer falls than this. */
export const CLEAN_FALLS = 20;

export interface Update {
  save: AlmostThereSave;
  unlock: AchievementId[];
}

export const countFeathers = (mask: number) => {
  let n = 0;
  for (let v = mask; v; v &= v - 1) n++;
  return n;
};

export function recordJump(save: AlmostThereSave): Update {
  return { save: { ...save, totals: { ...save.totals, jumps: save.totals.jumps + 1 } }, unlock: [] };
}

export function recordFall(save: AlmostThereSave, drop: number): Update {
  const totals = { ...save.totals, falls: save.totals.falls + 1, fallen: save.totals.fallen + drop, biggest: Math.max(save.totals.biggest, drop) };
  const unlock: AchievementId[] = [];
  if (totals.fallen >= KILOMETRE_PX) unlock.push("gravity-tourist");
  if (drop >= LONG_WAY_DOWN_PX) unlock.push("the-long-way-down");
  return { save: { ...save, totals }, unlock };
}

/** A Lost Feather: a hat for Pip (worn straight away if it's the first). */
export function recordFeather(save: AlmostThereSave, index: number): Update {
  const feathers = save.feathers | (1 << index);
  const hat = save.hat ?? (save.feathers === 0 ? index : null);
  return { save: { ...save, feathers, hat }, unlock: countFeathers(feathers) >= FEATHER_COUNT ? ["feather-collector"] : [] };
}

export function recordFakeSummit(save: AlmostThereSave): Update {
  return { save: { ...save, seen: { ...save.seen, fakeSummit: true } }, unlock: ["fooled-once"] };
}

export function recordStart(save: AlmostThereSave, mirrored: boolean): AlmostThereSave {
  const climbs = mirrored ? { ...save.climbs, mirrorStarted: save.climbs.mirrorStarted + 1 } : { ...save.climbs, started: save.climbs.started + 1 };
  return { ...save, climbs };
}

/** A climb given up for a new one: its time still counts as time played. */
export function recordAbandon(save: AlmostThereSave, climb: Climb): AlmostThereSave {
  return { ...save, totals: { ...save.totals, ticks: save.totals.ticks + climb.stats.ticks } };
}

export interface SummitResult extends Update {
  /** The fastest climb so far (without assist). */
  newBest: boolean;
  previous: Best | null;
}

export function recordSummit(save: AlmostThereSave, climb: Climb, at = Date.now()): SummitResult {
  const which = climb.mirrored ? "mirror" : "normal";
  const previous = save.best[which];
  const eligible = !climb.assisted;
  const newBest = eligible && (previous === null || climb.stats.ticks < previous.ticks);
  const best: Best | null = newBest ? { ticks: climb.stats.ticks, falls: climb.stats.falls, splits: { ...climb.splits } as Record<string, number>, at } : previous;
  const next: AlmostThereSave = {
    ...save,
    climbs: climb.mirrored ? { ...save.climbs, mirrorFinished: save.climbs.mirrorFinished + 1 } : { ...save.climbs, finished: save.climbs.finished + 1 },
    best: { ...save.best, [which]: best },
    totals: { ...save.totals, ticks: save.totals.ticks + climb.stats.ticks },
    seen: { ...save.seen, summit: true },
  };
  const unlock: AchievementId[] = ["never-again"];
  if (climb.stats.falls < CLEAN_FALLS) unlock.push("clean-climb");
  if (climb.mirrored) unlock.push("mirror-climber");
  return { save: next, unlock, newBest, previous };
}

/** Mirror Mountain opens once you've stood on the real summit. */
export const mirrorUnlocked = (save: AlmostThereSave) => save.climbs.finished > 0 || save.climbs.mirrorFinished > 0;
