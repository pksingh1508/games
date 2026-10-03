import * as v from "valibot";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineSave, readSaveValue, type SaveDef } from "./define-save";

const SchemaV2 = v.object({ v: v.literal(2), stars: v.number(), name: v.string() });
type Save = v.InferOutput<typeof SchemaV2>;

const def: SaveDef<Save> = {
  key: "mfg:game:test",
  version: 2,
  schema: SchemaV2,
  defaults: () => ({ v: 2, stars: 0, name: "player" }),
  migrations: {
    // v1 stored "score"; v2 renamed it to "stars" and added "name".
    1: (old: { v: 1; score: number }) => ({ v: 2, stars: old.score, name: "player" }),
  },
};

describe("readSaveValue", () => {
  it("returns defaults when nothing is stored", () => {
    expect(readSaveValue(def, null)).toEqual({ value: def.defaults() });
  });

  it("migrates old versions step by step", () => {
    const { value, problem } = readSaveValue(def, JSON.stringify({ v: 1, score: 7 }));
    expect(problem).toBeUndefined();
    expect(value).toEqual({ v: 2, stars: 7, name: "player" });
  });

  it("rejects damaged JSON", () => {
    const { value, problem } = readSaveValue(def, "{not json");
    expect(value).toEqual(def.defaults());
    expect(problem?.reason).toBe("invalid JSON");
  });

  it("rejects data that doesn't match the schema", () => {
    const { problem } = readSaveValue(def, JSON.stringify({ v: 2, stars: "lots" }));
    expect(problem?.reason).toMatch(/save format/);
  });

  it("rejects saves from a newer version", () => {
    const { problem } = readSaveValue(def, JSON.stringify({ v: 9 }));
    expect(problem?.reason).toMatch(/newer version/);
  });
});

describe("defineSave", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads defaults, writes debounced updates, and flushes on demand", () => {
    const slot = defineSave({ ...def, debounceMs: 300 });
    expect(slot.get()).toEqual({ v: 2, stars: 0, name: "player" });

    slot.update((s) => ({ ...s, stars: 3 }));
    expect(slot.get().stars).toBe(3);
    expect(localStorage.getItem(def.key)).toBeNull();

    vi.advanceTimersByTime(300);
    expect(JSON.parse(localStorage.getItem(def.key)!)).toEqual({ v: 2, stars: 3, name: "player" });

    slot.update((s) => ({ ...s, name: "pip" }));
    slot.flush();
    expect(JSON.parse(localStorage.getItem(def.key)!).name).toBe("pip");
  });

  it("keeps a stable reference until the value changes", () => {
    const slot = defineSave(def);
    const first = slot.get();
    expect(slot.get()).toBe(first);
    slot.update((s) => ({ ...s, stars: 1 }));
    expect(slot.get()).not.toBe(first);
  });

  it("notifies subscribers and reloads after another tab writes", () => {
    const slot = defineSave(def);
    const listener = vi.fn();
    slot.subscribe(listener);
    slot.get();

    localStorage.setItem(def.key, JSON.stringify({ v: 2, stars: 42, name: "other tab" }));
    window.dispatchEvent(new StorageEvent("storage", { key: def.key }));

    expect(listener).toHaveBeenCalled();
    expect(slot.get().stars).toBe(42);
  });

  it("resets to defaults", () => {
    const slot = defineSave(def);
    slot.set({ v: 2, stars: 5, name: "x" });
    slot.flush();
    slot.reset();
    expect(slot.get()).toEqual(def.defaults());
    expect(localStorage.getItem(def.key)).toBeNull();
  });
});
