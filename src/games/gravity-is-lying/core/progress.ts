// What a death, a clear or time on the ceiling does to the save, and which achievements it earns
// (Plan/15-gravity-is-lying.md §7). Pure functions: easy to test, and the game just applies them.
import { FINAL_ROOM, ROOM_IDS, WORLDS } from "../rooms";
import { emptyRoomRecord, type GravitySave, type RoomRecord } from "../save";

export type AchievementId = "upside-downer" | "never-trusted-the-arrow" | "ground-control" | "orbital" | "apple-picker" | "fell-up";

/** Upside Downer: ten minutes on ceilings. */
export const CEILING_GOAL = 60 * 60 * 10;

export const roomOf = (save: GravitySave, id: string): RoomRecord => save.rooms[id] ?? emptyRoomRecord();

export interface Update {
  save: GravitySave;
  unlock: AchievementId[];
}

export function recordDeath(save: GravitySave, roomId: string): Update {
  const room = roomOf(save, roomId);
  return { save: { ...save, rooms: { ...save.rooms, [roomId]: { ...room, deaths: room.deaths + 1 } }, deaths: save.deaths + 1 }, unlock: [] };
}

/** Time on the ceiling, added up (written at the end of a visit, and at the portal). */
export function recordCeiling(save: GravitySave, ticks: number): Update {
  if (ticks <= 0) return { save, unlock: [] };
  const next = { ...save, ceilingTicks: save.ceilingTicks + ticks };
  return { save: next, unlock: next.ceilingTicks >= CEILING_GOAL ? ["upside-downer"] : [] };
}

export interface Clear {
  roomId: string;
  /** From the winning attempt's first move to the portal. */
  ticks: number;
  /** This visit (safety-net catches count). */
  deaths: number;
  /** Golden apples brought through (bitmask). */
  apples: number;
  assisted: boolean;
  /** The camera was free to turn (reduce motion off). */
  rotated: boolean;
}

export interface ClearResult extends Update {
  firstClear: boolean;
  newBest: boolean;
  previousBest: number | null;
  /** Apples counted (none with assist). */
  counted: number;
  /** Apples found for the first time. */
  freshApples: number;
}

const bits = (n: number) => (n & 1) + ((n >> 1) & 1) + ((n >> 2) & 1);

export function recordClear(save: GravitySave, clear: Clear): ClearResult {
  const room = roomOf(save, clear.roomId);
  const eligible = !clear.assisted;
  const counted = eligible ? clear.apples & 7 : 0;
  const newBest = eligible && (room.best === null || clear.ticks < room.best);
  const record: RoomRecord = {
    ...room,
    clears: room.clears + 1,
    best: newBest ? clear.ticks : room.best,
    apples: room.apples | counted,
    clean: room.clean || (eligible && clear.deaths === 0),
    rotated: room.rotated || (eligible && clear.rotated),
    assisted: clear.assisted ? room.clears === 0 || room.assisted : false,
  };
  const next: GravitySave = { ...save, rooms: { ...save.rooms, [clear.roomId]: record }, last: clear.roomId };
  const unlock: AchievementId[] = [];
  const world = (id: number) => WORLDS.find((w) => w.id === id)?.rooms ?? [];
  const w3 = world(3);
  if (w3.length && w3.every((id) => next.rooms[id]?.clean)) unlock.push("never-trusted-the-arrow");
  const w4 = world(4);
  if (w4.length && w4.every((id) => next.rooms[id]?.rotated)) unlock.push("ground-control");
  if (ROOM_IDS.every((id) => next.rooms[id]?.apples === 7)) unlock.push("apple-picker");
  if (clear.roomId === FINAL_ROOM) {
    next.finished = true;
    unlock.push("fell-up");
  }
  return {
    save: next,
    unlock,
    firstClear: room.clears === 0,
    newBest,
    previousBest: room.best,
    counted,
    freshApples: counted & ~room.apples,
  };
}

export const isCleared = (save: GravitySave, id: string) => (save.rooms[id]?.clears ?? 0) > 0;

/** Rooms open one after another, across the worlds. */
export function isUnlocked(save: GravitySave, id: string): boolean {
  const i = ROOM_IDS.indexOf(id);
  if (i < 0) return false;
  return i === 0 || isCleared(save, ROOM_IDS[i - 1]!);
}

/** Golden apples across some rooms (three a room). */
export const appleCount = (save: GravitySave, ids: readonly string[]) => ids.reduce((n, id) => n + bits(save.rooms[id]?.apples ?? 0), 0);

/** A world's totals, for the map and its "world complete" card. */
export function worldStats(save: GravitySave, world: number) {
  const ids = WORLDS.find((w) => w.id === world)?.rooms ?? [];
  const rooms = ids.map((id) => roomOf(save, id));
  return {
    rooms: ids.length,
    cleared: rooms.filter((r) => r.clears > 0).length,
    deaths: rooms.reduce((n, r) => n + r.deaths, 0),
    apples: appleCount(save, ids),
    /** The sum of best times (null until every room has one). */
    best: rooms.every((r) => r.best !== null) ? rooms.reduce((n, r) => n + r.best!, 0) : null,
  };
}

/** "12.3" seconds, or "1:02.3". */
export function formatTime(ticks: number): string {
  const tenths = Math.floor(ticks / 6);
  const s = Math.floor(tenths / 10);
  const t = tenths % 10;
  if (s < 60) return `${s}.${t}`;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}.${t}`;
}
