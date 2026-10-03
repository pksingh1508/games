// Export / import / snapshot / delete for everything the arcade stores (Plan/gameStack.md §5.6).
//
// A save file is JSON with every "mfg:" localStorage value and every player IndexedDB store,
// protected by a SHA-256 checksum and gzipped when the browser supports it.
import * as v from "valibot";
import {
  canCompress,
  decodeText,
  encodeText,
  fromBase64,
  gunzip,
  gzip,
  isGzip,
  sha256Hex,
  toBase64,
} from "./codec";
import { closeDb, DATA_STORES, DB_NAME, getDb, isIndexedDBAvailable, type DataStore } from "./db";

export const STORAGE_PREFIX = "mfg:";
export const SAVE_FILE_EXTENSION = ".mfgsave";
const MAX_SNAPSHOTS = 3;

// ---------------------------------------------------------------------------
// Save file format

const EntrySchema = v.object({ key: v.unknown(), value: v.unknown() });

const PayloadSchema = v.object({
  format: v.literal("mfg-save"),
  formatVersion: v.literal(1),
  exportedAt: v.string(),
  appVersion: v.string(),
  localStorage: v.record(v.string(), v.string()),
  indexedDB: v.record(v.string(), v.array(EntrySchema)),
});

const SaveFileSchema = v.object({ ...PayloadSchema.entries, checksum: v.string() });

export type SavePayload = v.InferOutput<typeof PayloadSchema>;
export type SaveFile = v.InferOutput<typeof SaveFileSchema>;

export class SaveFileError extends Error {}

// ---------------------------------------------------------------------------
// Binary-safe values: IndexedDB can hold bytes, blobs and dates, JSON can't.

type Encoded =
  | { $type: "bytes"; data: string }
  | { $type: "blob"; mime: string; data: string }
  | { $type: "date"; value: string };

async function encodeValue(value: unknown): Promise<unknown> {
  if (value instanceof Uint8Array) return { $type: "bytes", data: toBase64(value) } satisfies Encoded;
  if (typeof Blob !== "undefined" && value instanceof Blob) {
    const bytes = new Uint8Array(await value.arrayBuffer());
    return { $type: "blob", mime: value.type, data: toBase64(bytes) } satisfies Encoded;
  }
  if (value instanceof Date) return { $type: "date", value: value.toISOString() } satisfies Encoded;
  if (Array.isArray(value)) return Promise.all(value.map(encodeValue));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, item] of Object.entries(value)) out[k] = await encodeValue(item);
    return out;
  }
  return value;
}

function decodeValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(decodeValue);
  if (value && typeof value === "object") {
    const tagged = value as Partial<Encoded> & { $type?: string };
    if (tagged.$type === "bytes" && typeof tagged.data === "string") return fromBase64(tagged.data);
    if (tagged.$type === "blob" && "data" in tagged && typeof tagged.data === "string") {
      return new Blob([fromBase64(tagged.data)], { type: "mime" in tagged ? String(tagged.mime) : "" });
    }
    if (tagged.$type === "date" && "value" in tagged && typeof tagged.value === "string") {
      return new Date(tagged.value);
    }
    const out: Record<string, unknown> = {};
    for (const [k, item] of Object.entries(value)) out[k] = decodeValue(item);
    return out;
  }
  return value;
}

// ---------------------------------------------------------------------------
// Collecting and applying data

export function listLocalEntries(): Array<{ key: string; bytes: number }> {
  const entries: Array<{ key: string; bytes: number }> = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(STORAGE_PREFIX)) continue;
      const value = localStorage.getItem(key) ?? "";
      entries.push({ key, bytes: encodeText(key).length + encodeText(value).length });
    }
  } catch {
    // localStorage blocked (some private modes): nothing to list.
  }
  return entries.sort((a, b) => a.key.localeCompare(b.key));
}

export async function countIndexedDBRecords(): Promise<Record<DataStore, number>> {
  const counts = Object.fromEntries(DATA_STORES.map((store) => [store, 0])) as Record<DataStore, number>;
  if (!isIndexedDBAvailable()) return counts;
  const db = await getDb();
  for (const store of DATA_STORES) counts[store] = await db.count(store);
  return counts;
}

async function collectPayload(appVersion: string): Promise<SavePayload> {
  const local: Record<string, string> = {};
  for (const { key } of listLocalEntries()) {
    const value = localStorage.getItem(key);
    if (value !== null) local[key] = value;
  }

  const indexed: Record<string, Array<{ key: unknown; value: unknown }>> = {};
  if (isIndexedDBAvailable()) {
    const db = await getDb();
    for (const store of DATA_STORES) {
      const [keys, values] = await Promise.all([db.getAllKeys(store), db.getAll(store)]);
      indexed[store] = await Promise.all(
        keys.map(async (key, i) => ({ key, value: await encodeValue(values[i]) })),
      );
    }
  }

  return {
    format: "mfg-save",
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    appVersion,
    localStorage: local,
    indexedDB: indexed,
  };
}

/** JSON with object keys sorted at every level, so the checksum never depends on key order. */
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, item]) => `${JSON.stringify(k)}:${stableStringify(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

const checksumOf = (payload: SavePayload) => sha256Hex(stableStringify(payload));

async function writePayload(payload: Pick<SavePayload, "localStorage" | "indexedDB">) {
  // localStorage: replace every "mfg:" key.
  for (const { key } of listLocalEntries()) localStorage.removeItem(key);
  for (const [key, value] of Object.entries(payload.localStorage)) {
    if (key.startsWith(STORAGE_PREFIX)) localStorage.setItem(key, value);
  }

  // IndexedDB: replace every player store.
  if (!isIndexedDBAvailable()) return;
  const db = await getDb();
  for (const store of DATA_STORES) {
    const tx = db.transaction(store, "readwrite");
    // Every player store uses out-of-line keys, so records go back in with their original key.
    const objectStore = tx.store as unknown as {
      clear(): Promise<void>;
      put(value: unknown, key: IDBValidKey): Promise<IDBValidKey>;
    };
    await objectStore.clear();
    for (const entry of payload.indexedDB[store] ?? []) {
      await objectStore.put(decodeValue(entry.value), entry.key as IDBValidKey);
    }
    await tx.done;
  }
}

// ---------------------------------------------------------------------------
// Snapshots (automatic local backups before risky operations)

export async function createSnapshot(reason: string, appVersion = "local"): Promise<void> {
  if (!isIndexedDBAvailable()) return;
  const payload = await collectPayload(appVersion);
  const db = await getDb();
  await db.add("backups", { at: Date.now(), reason, data: JSON.stringify(payload) });

  // Keep only the newest few.
  const keys = await db.getAllKeys("backups");
  const extra = keys.length - MAX_SNAPSHOTS;
  for (let i = 0; i < extra; i++) await db.delete("backups", keys[i]!);
}

export interface SnapshotInfo {
  id: number;
  at: number;
  reason: string;
  bytes: number;
}

export async function listSnapshots(): Promise<SnapshotInfo[]> {
  if (!isIndexedDBAvailable()) return [];
  const db = await getDb();
  const [keys, values] = await Promise.all([db.getAllKeys("backups"), db.getAll("backups")]);
  return keys
    .map((id, i) => ({
      id,
      at: values[i]!.at,
      reason: values[i]!.reason,
      bytes: encodeText(values[i]!.data).length,
    }))
    .sort((a, b) => b.at - a.at);
}

export async function restoreSnapshot(id: number): Promise<void> {
  const db = await getDb();
  const snapshot = await db.get("backups", id);
  if (!snapshot) throw new SaveFileError("That snapshot no longer exists.");
  const data = JSON.parse(snapshot.data) as Partial<SavePayload>;
  await createSnapshot("Before restoring a snapshot");
  await writePayload({ localStorage: data.localStorage ?? {}, indexedDB: data.indexedDB ?? {} });
}

// ---------------------------------------------------------------------------
// Export / import

export async function createSaveFile(appVersion: string): Promise<{ blob: Blob; fileName: string }> {
  const payload = await collectPayload(appVersion);
  const file: SaveFile = { ...payload, checksum: `sha256:${await checksumOf(payload)}` };
  const json = encodeText(JSON.stringify(file));
  const bytes = canCompress() ? await gzip(json) : json;
  const date = new Date().toISOString().slice(0, 10);
  return {
    blob: new Blob([bytes], { type: "application/octet-stream" }),
    fileName: `mind-games-${date}${SAVE_FILE_EXTENSION}`,
  };
}

export async function readSaveFile(file: Blob): Promise<SaveFile> {
  let bytes: Uint8Array<ArrayBuffer> = new Uint8Array(await file.arrayBuffer());
  if (isGzip(bytes)) {
    if (!canCompress()) throw new SaveFileError("This browser can't open compressed save files.");
    try {
      bytes = await gunzip(bytes);
    } catch {
      throw new SaveFileError("This save file is damaged (it couldn't be unpacked).");
    }
  }

  let json: unknown;
  try {
    json = JSON.parse(decodeText(bytes));
  } catch {
    throw new SaveFileError("This doesn't look like a Mind Games save file.");
  }

  const parsed = v.safeParse(SaveFileSchema, json);
  if (!parsed.success) throw new SaveFileError("This doesn't look like a Mind Games save file.");

  const { checksum, ...payload } = parsed.output;
  if (checksum !== `sha256:${await checksumOf(payload)}`) {
    throw new SaveFileError("This save file has been changed or damaged (the checksum doesn't match).");
  }
  return parsed.output;
}

export interface SaveFileSummary {
  exportedAt: Date;
  appVersion: string;
  localKeys: string[];
  games: string[];
  records: number;
}

export function summarizeSaveFile(file: SaveFile): SaveFileSummary {
  const localKeys = Object.keys(file.localStorage).sort();
  return {
    exportedAt: new Date(file.exportedAt),
    appVersion: file.appVersion,
    localKeys,
    games: localKeys.filter((k) => k.startsWith("mfg:game:")).map((k) => k.slice("mfg:game:".length)),
    records: Object.values(file.indexedDB).reduce((sum, entries) => sum + entries.length, 0),
  };
}

/** Replace all local data with a save file. A snapshot of the current data is taken first. */
export async function applySaveFile(file: SaveFile): Promise<void> {
  await createSnapshot("Before importing a save file");
  await writePayload(file);
}

// ---------------------------------------------------------------------------
// Deleting

/** Delete every save, setting and record. Offline copies of the site itself are kept. */
export async function deleteAllData(): Promise<void> {
  for (const { key } of listLocalEntries()) localStorage.removeItem(key);
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) sessionStorage.removeItem(key);
    }
  } catch {
    // sessionStorage unavailable: nothing to clear.
  }
  if (!isIndexedDBAvailable()) return;
  await closeDb();
  await new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
}
