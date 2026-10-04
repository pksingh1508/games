// What a fall, a pebble, a clear or a time trial does to the save, and which achievements it earns
// (Plan/05-fake-floor.md §7). Pure functions: easy to test, and the game just applies the result.
import { FINAL_ROOM, HIDDEN_ROOMS, WORLDS } from "../rooms";
import { emptyRoomRecord, type FakeFloorSave, type RoomRecord } from "../save";
import { MEDAL_IDS, parTicks, type MedalId } from "./medals";
import type { FallCause } from "./world";

export type AchievementId = "trust-issues" | "barefoot-champion" | "eagle-eye" | "floor-inspector" | "gravity-tourist" | "leap-of-faith" | "grounded";

/** Falls through a floor that lied (the closing line counts these). */
export const LIED: ReadonlySet<FallCause> = new Set(["fake", "mimic", "painted", "returnTrip", "flip"]);

export const roomOf = (save: FakeFloorSave, id: string): RoomRecord => save.rooms[id] ?? emptyRoomRecord();

const withRoom = (save: FakeFloorSave, id: string, change: (room: RoomRecord) => RoomRecord): FakeFloorSave => ({
  ...save,
  rooms: { ...save.rooms, [id]: change(roomOf(save, id)) },
});

export interface Update {
  save: FakeFloorSave;
  unlock: AchievementId[];
}

export function recordFall(save: FakeFloorSave, roomId: string, cause: FallCause): Update {
  const next: FakeFloorSave = {
    ...withRoom(save, roomId, (r) => ({ ...r, falls: r.falls + 1 })),
    falls: save.falls + 1,
    fakeFalls: save.fakeFalls + (LIED.has(cause) ? 1 : 0),
    causes: { ...save.causes, [cause]: (save.causes[cause] ?? 0) + 1 },
  };
  return { save: next, unlock: next.falls >= 500 ? ["gravity-tourist"] : [] };
}

export function recordThrow(save: FakeFloorSave, roomId: string): Update {
  const next: FakeFloorSave = { ...withRoom(save, roomId, (r) => ({ ...r, thrown: r.thrown + 1 })), thrown: save.thrown + 1 };
  return { save: next, unlock: next.thrown >= 100 ? ["trust-issues"] : [] };
}

export function recordHidden(save: FakeFloorSave, roomId: string): Update {
  const next = withRoom(save, roomId, (r) => ({ ...r, hidden: true }));
  return { save: next, unlock: HIDDEN_ROOMS.every((id) => next.rooms[id]?.hidden) ? ["floor-inspector"] : [] };
}

export interface Clear {
  roomId: string;
  /** From the winning attempt's first step to the door. */
  ticks: number;
  /** This visit. */
  falls: number;
  thrown: number;
  assisted: boolean;
}

export interface ClearResult extends Update {
  /** The medals this run earned (none with assist). */
  earned: Record<MedalId, boolean>;
  /** Medals earned for the first time. */
  fresh: MedalId[];
  eligible: boolean;
  newBest: boolean;
  previousBest: number | null;
  firstClear: boolean;
  par: number;
}

export function recordClear(save: FakeFloorSave, clear: Clear): ClearResult {
  const room = roomOf(save, clear.roomId);
  const eligible = !clear.assisted;
  const par = parTicks(clear.roomId);
  const earned: Record<MedalId, boolean> = {
    clean: eligible && clear.falls === 0,
    barefoot: eligible && clear.thrown === 0,
    quick: eligible && clear.ticks <= par,
  };
  const fresh = MEDAL_IDS.filter((m) => earned[m] && !room[m]);
  const newBest = eligible && (room.best === null || clear.ticks < room.best);
  const record: RoomRecord = {
    ...room,
    clears: room.clears + 1,
    best: newBest ? clear.ticks : room.best,
    clean: room.clean || earned.clean,
    barefoot: room.barefoot || earned.barefoot,
    quick: room.quick || earned.quick,
    assisted: clear.assisted ? room.clears === 0 || room.assisted : false,
  };
  return {
    save: { ...save, rooms: { ...save.rooms, [clear.roomId]: record }, last: clear.roomId },
    earned,
    fresh,
    eligible,
    newBest,
    previousBest: room.best,
    firstClear: room.clears === 0,
    par,
    unlock: clear.roomId === FINAL_ROOM ? ["grounded"] : [],
  };
}

export interface Trial {
  world: number;
  /** Ticks from the first step in the first room to the last door, falls included. */
  total: number;
  splits: number[];
  falls: number;
  thrown: number;
  assisted: boolean;
}

export function recordTrial(save: FakeFloorSave, trial: Trial): Update & { newBest: boolean; previous: number | null } {
  const key = String(trial.world);
  const before = save.trials[key] ?? { runs: 0, best: null, splits: [], falls: null, thrown: null };
  const newBest = !trial.assisted && (before.best === null || trial.total < before.best);
  const unlock: AchievementId[] = [];
  if (!trial.assisted && trial.thrown === 0) unlock.push("barefoot-champion");
  if (!trial.assisted && trial.world === 4 && trial.falls === 0) unlock.push("eagle-eye");
  return {
    save: {
      ...save,
      trials: {
        ...save.trials,
        [key]: newBest
          ? { runs: before.runs + 1, best: trial.total, splits: trial.splits, falls: trial.falls, thrown: trial.thrown }
          : { ...before, runs: before.runs + 1 },
      },
    },
    newBest,
    previous: before.best,
    unlock,
  };
}

export const isCleared = (save: FakeFloorSave, id: string) => (save.rooms[id]?.clears ?? 0) > 0;

/** Medals won across some rooms (three per room at most). */
export function medalCount(save: FakeFloorSave, ids: readonly string[]): number {
  return ids.reduce((n, id) => n + MEDAL_IDS.filter((m) => save.rooms[id]?.[m]).length, 0);
}

/** A world's totals, for its "world complete" card and the map. */
export function worldStats(save: FakeFloorSave, world: number) {
  const ids = WORLDS.find((w) => w.id === world)?.rooms ?? [];
  const rooms = ids.map((id) => roomOf(save, id));
  return {
    cleared: rooms.filter((r) => r.clears > 0).length,
    falls: rooms.reduce((n, r) => n + r.falls, 0),
    thrown: rooms.reduce((n, r) => n + r.thrown, 0),
    medals: medalCount(save, ids),
    hidden: rooms.filter((r) => r.hidden).length,
    /** The sum of best times (null until every room has one). */
    best: rooms.every((r) => r.best !== null) ? rooms.reduce((n, r) => n + r.best!, 0) : null,
  };
}
