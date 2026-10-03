// What a death, a clear or a zone speedrun does to the save, and which achievements it earns
// (Plan/06-trapsprint.md §7). Pure functions: easy to test, and the game just applies the result.
import { HEIGHT, WIDTH } from "./constants";
import type { TrapKind } from "./level";
import { medalFor, medalRank, medalTimes, type Medal } from "./medals";
import { emptyLevelRecord, type LevelRecord, type TrapSprintSave } from "../save";
import type { DeathCause } from "./world";

export type AchievementId = "fresh-meat" | "collector" | "read-the-room" | "speed-demon" | "untouchable" | "paranoid" | "thousand-ways";

/** Every way a trap can kill you, for Collector. (Painted doors, painted spikes and runaway doors can't.) */
export const DEADLY: ReadonlyArray<TrapKind | "ghost"> = [
  "popSpikes",
  "dropFloor",
  "crusher",
  "saw",
  "jumpPunisher",
  "invisibleBlock",
  "stalactite",
  "wallSqueeze",
  "fakeCheckpoint",
  "coinBait",
  "conveyorFlip",
  "sidewaysSpring",
  "returnTrap",
  "victoryBanner",
  "risingFloor",
  "follower",
  "ghost",
];

/** Skull markers kept per level. */
export const MAX_MARKS = 40;

export const packMark = (x: number, y: number) => Math.max(0, Math.min(WIDTH - 1, Math.round(x))) * 512 + Math.max(0, Math.min(HEIGHT - 1, Math.round(y)));
export const unpackMark = (mark: number) => ({ x: Math.floor(mark / 512), y: mark % 512 });

const levelOf = (save: TrapSprintSave, id: string): LevelRecord => save.levels[id] ?? emptyLevelRecord();

export function recordDeath(save: TrapSprintSave, levelId: string, cause: DeathCause, x: number, y: number): { save: TrapSprintSave; unlock: AchievementId[] } {
  const level = levelOf(save, levelId);
  const next: TrapSprintSave = {
    ...save,
    deaths: save.deaths + 1,
    causes: { ...save.causes, [cause]: (save.causes[cause] ?? 0) + 1 },
    levels: { ...save.levels, [levelId]: { ...level, deaths: level.deaths + 1, marks: [...level.marks, packMark(x, y)].slice(-MAX_MARKS) } },
  };
  const unlock: AchievementId[] = [];
  if (next.deaths >= 10) unlock.push("fresh-meat");
  if (next.deaths >= 1000) unlock.push("thousand-ways");
  if (DEADLY.every((kind) => (next.causes[kind] ?? 0) > 0)) unlock.push("collector");
  return { save: next, unlock };
}

export function recordFakeHop(save: TrapSprintSave): { save: TrapSprintSave; unlock: AchievementId[] } {
  const next = { ...save, fakeHops: save.fakeHops + 1 };
  return { save: next, unlock: next.fakeHops >= 20 ? ["paranoid"] : [] };
}

export interface Clear {
  levelId: string;
  ticks: number;
  /** Coins carried through the door (bitmask). */
  coins: number;
  /** Deaths in this visit before the clear. */
  deaths: number;
  assisted: boolean;
  fromCheckpoint: boolean;
}

export interface ClearResult {
  save: TrapSprintSave;
  /** The medal this run earned (null: none, or not eligible). */
  medal: Medal | null;
  /** Can this run earn medals and set records at all? */
  eligible: boolean;
  /** A new best time (the ghost should be saved). */
  newBest: boolean;
  previousBest: number | null;
  firstClear: boolean;
  unlock: AchievementId[];
}

export function recordClear(save: TrapSprintSave, clear: Clear): ClearResult {
  const level = levelOf(save, clear.levelId);
  const eligible = !clear.assisted && !clear.fromCheckpoint;
  const medal = eligible ? medalFor(clear.ticks, medalTimes(clear.levelId)) : null;
  const newBest = eligible && (level.best === null || clear.ticks < level.best);
  const record: LevelRecord = {
    ...level,
    clears: level.clears + 1,
    best: newBest ? clear.ticks : level.best,
    medal: medalRank(medal) > medalRank(level.medal) ? medal : level.medal,
    coins: level.coins | clear.coins,
    // Only ever cleared with assist on (the level select marks it).
    assisted: clear.assisted ? level.clears === 0 || level.assisted : false,
  };
  const unlock: AchievementId[] = [];
  if (level.clears === 0 && level.deaths === 0 && clear.deaths === 0 && eligible) unlock.push("read-the-room");
  if (medal === "dev") unlock.push("speed-demon");
  return {
    save: { ...save, levels: { ...save.levels, [clear.levelId]: record }, last: clear.levelId },
    medal,
    eligible,
    newBest,
    previousBest: level.best,
    firstClear: level.clears === 0,
    unlock,
  };
}

export interface ZoneRun {
  zone: string;
  /** Ticks since the first input, deaths included. */
  total: number;
  splits: number[];
  deaths: number;
  assisted: boolean;
}

export function recordZoneRun(save: TrapSprintSave, run: ZoneRun): { save: TrapSprintSave; newBest: boolean; previous: number | null; unlock: AchievementId[] } {
  const before = save.zoneRuns[run.zone] ?? { runs: 0, best: null, splits: [], deathless: false };
  const newBest = !run.assisted && (before.best === null || run.total < before.best);
  const deathless = !run.assisted && run.deaths === 0;
  return {
    save: {
      ...save,
      zoneRuns: {
        ...save.zoneRuns,
        [run.zone]: {
          runs: before.runs + 1,
          best: newBest ? run.total : before.best,
          splits: newBest ? run.splits : before.splits,
          deathless: before.deathless || deathless,
        },
      },
    },
    newBest,
    previous: before.best,
    unlock: deathless ? ["untouchable"] : [],
  };
}

/** Medals won, out of how many, for a list of levels. */
export function medalCount(save: TrapSprintSave, ids: readonly string[], at: Medal = "bronze"): number {
  return ids.filter((id) => medalRank(save.levels[id]?.medal) >= medalRank(at)).length;
}

export const isCleared = (save: TrapSprintSave, id: string) => (save.levels[id]?.clears ?? 0) > 0;
