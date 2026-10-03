// The one IndexedDB database for big local data (replays, run history, custom levels, media,
// backups). Opened lazily, so nothing touches IndexedDB while pages are prerendered.
import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export const DB_NAME = "mfg";
export const DB_VERSION = 1;

export interface RunRecord {
  game: string;
  level?: string;
  mode: string;
  score: number;
  at: number;
  seed?: number;
}

export interface ReplayRecord {
  game: string;
  level: string;
  kind: "best" | "attempt" | "challenge";
  /** Replays only work with the same physics, so they carry the engine version. */
  engineVersion: number;
  /** Run-length encoded input bits, one entry per simulation tick. */
  inputs: Uint8Array;
  timeMs: number;
  at: number;
  /** Game-specific: which version of the level it ran through (e.g. a layout that changes after a death). */
  variant?: number;
}

export interface LevelRecord {
  game: string;
  name: string;
  data: unknown;
  updatedAt: number;
}

export interface BackupRecord {
  at: number;
  reason: string;
  /** A JSON snapshot in the same shape as an exported save file (without checksum). */
  data: string;
}

export interface MfgDB extends DBSchema {
  runs: {
    key: number;
    value: RunRecord;
    indexes: { "by-game": string; "by-game-level": [string, string] };
  };
  replays: { key: string; value: ReplayRecord };
  levels: { key: string; value: LevelRecord };
  media: { key: string; value: Blob };
  backups: { key: number; value: BackupRecord };
}

/** Stores that belong to the player's data (exported, imported and deleted together). */
export const DATA_STORES = ["runs", "replays", "levels", "media"] as const;
export type DataStore = (typeof DATA_STORES)[number];

let dbPromise: Promise<IDBPDatabase<MfgDB>> | undefined;

export function isIndexedDBAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

export function getDb(): Promise<IDBPDatabase<MfgDB>> {
  dbPromise ??= openDB<MfgDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const runs = db.createObjectStore("runs", { autoIncrement: true });
      runs.createIndex("by-game", "game");
      runs.createIndex("by-game-level", ["game", "level"]);
      db.createObjectStore("replays");
      db.createObjectStore("levels");
      db.createObjectStore("media");
      db.createObjectStore("backups", { autoIncrement: true });
    },
  });
  return dbPromise;
}

/** Close the connection (needed before deleting the whole database). */
export async function closeDb(): Promise<void> {
  if (!dbPromise) return;
  const db = await dbPromise.catch(() => undefined);
  db?.close();
  dbPromise = undefined;
}
