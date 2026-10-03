// Small, versioned, validated saves in localStorage (Plan/gameStack.md §5.4).
//
// Loading: read → JSON.parse → migrate step by step → validate with Valibot.
// Anything broken is copied to the IndexedDB "backups" store, and only that save is reset.
// Writing: debounced, and flushed immediately when the tab is hidden or closed.
import * as v from "valibot";

export interface SaveDef<T> {
  /** localStorage key, e.g. "mfg:game:trapsprint" */
  key: string;
  /** Current schema version; stored objects carry it in a `v` field. */
  version: number;
  schema: v.GenericSchema<unknown, T>;
  defaults: () => T;
  /** migrations[n] upgrades a version-n object to version n + 1. */
  migrations?: Record<number, (old: never) => unknown>;
  /** Write delay in milliseconds (default 400). */
  debounceMs?: number;
}

export interface SaveSlot<T> {
  readonly key: string;
  /** Current value. Stable reference until it changes (safe for useSyncExternalStore). */
  get(): T;
  set(next: T): void;
  update(change: (current: T) => T): void;
  /** Write pending changes now. */
  flush(): void;
  /** Throw away the stored value and go back to defaults. */
  reset(): void;
  /** Reload from storage (after an import, or a change in another tab). */
  reload(): void;
  subscribe(listener: () => void): () => void;
  /** Defaults, used while prerendering and during hydration. */
  getServerSnapshot(): T;
}

export const STORAGE_ERROR_EVENT = "mfg:storage-error";

const isBrowser = typeof window !== "undefined";

type LoadResult<T> = { value: T; problem?: { raw: string; reason: string } };

export function readSaveValue<T>(def: SaveDef<T>, raw: string | null): LoadResult<T> {
  if (raw === null) return { value: def.defaults() };

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { value: def.defaults(), problem: { raw, reason: "invalid JSON" } };
  }

  let version =
    typeof data === "object" && data !== null && typeof (data as { v?: unknown }).v === "number"
      ? (data as { v: number }).v
      : 0;

  if (version > def.version) {
    return { value: def.defaults(), problem: { raw, reason: `from a newer version (v${version})` } };
  }

  while (version < def.version) {
    const migrate = def.migrations?.[version];
    if (!migrate) {
      return { value: def.defaults(), problem: { raw, reason: `no migration from v${version}` } };
    }
    try {
      data = migrate(data as never);
    } catch {
      return { value: def.defaults(), problem: { raw, reason: `migration from v${version} failed` } };
    }
    version++;
  }

  const result = v.safeParse(def.schema, data);
  if (!result.success) {
    return { value: def.defaults(), problem: { raw, reason: "did not match the save format" } };
  }
  return { value: result.output };
}

async function quarantine(key: string, raw: string, reason: string) {
  try {
    const { getDb } = await import("./db");
    const db = await getDb();
    await db.add("backups", {
      at: Date.now(),
      reason: `Damaged save "${key}" (${reason})`,
      data: JSON.stringify({ localStorage: { [key]: raw }, indexedDB: {} }),
    });
  } catch {
    // Quarantine is best-effort: never let it break loading.
  }
}

function reportStorageError(key: string, error: unknown) {
  if (!isBrowser) return;
  window.dispatchEvent(new CustomEvent(STORAGE_ERROR_EVENT, { detail: { key, error } }));
}

export function defineSave<T>(def: SaveDef<T>): SaveSlot<T> {
  const listeners = new Set<() => void>();
  let value: T | undefined;
  let serverValue: T | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let dirty = false;
  let wired = false;

  const notify = () => listeners.forEach((listener) => listener());

  const load = (): T => {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(def.key);
    } catch (error) {
      reportStorageError(def.key, error);
    }
    const { value: loaded, problem } = readSaveValue(def, raw);
    if (problem) void quarantine(def.key, problem.raw, problem.reason);
    return loaded;
  };

  const write = () => {
    timer = undefined;
    if (!dirty || value === undefined) return;
    dirty = false;
    try {
      localStorage.setItem(def.key, JSON.stringify(value));
    } catch (error) {
      reportStorageError(def.key, error);
    }
  };

  const wireBrowserEvents = () => {
    if (wired || !isBrowser) return;
    wired = true;
    // Never lose progress when the tab is hidden or closed.
    window.addEventListener("pagehide", write);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") write();
    });
    // Another tab changed this save: pick up the new value.
    window.addEventListener("storage", (event) => {
      if (event.key === def.key || event.key === null) slot.reload();
    });
  };

  const slot: SaveSlot<T> = {
    key: def.key,
    get() {
      if (!isBrowser) return slot.getServerSnapshot();
      if (value === undefined) {
        value = load();
        wireBrowserEvents();
      }
      return value;
    },
    set(next) {
      value = next;
      dirty = true;
      wireBrowserEvents();
      if (timer) clearTimeout(timer);
      timer = setTimeout(write, def.debounceMs ?? 400);
      notify();
    },
    update(change) {
      slot.set(change(slot.get()));
    },
    flush() {
      if (timer) clearTimeout(timer);
      write();
    },
    reset() {
      if (timer) clearTimeout(timer);
      timer = undefined;
      dirty = false;
      try {
        localStorage.removeItem(def.key);
      } catch (error) {
        reportStorageError(def.key, error);
      }
      value = def.defaults();
      notify();
    },
    reload() {
      if (!isBrowser) return;
      value = load();
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getServerSnapshot() {
      serverValue ??= def.defaults();
      return serverValue;
    },
  };

  return slot;
}
