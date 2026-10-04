import { describe, expect, it, vi } from "vitest";
import { isPointerLocked, lockPointer, onPointerLockChange, unlockPointer, type LockDocument } from "./pointer-lock";

/** A stand-in document: locks when asked (or refuses), and fires the events. */
function fakeDocument() {
  const listeners = new Map<string, Set<() => void>>();
  const doc: LockDocument & { fire(type: string): void } = {
    pointerLockElement: null,
    exitPointerLock() {
      this.pointerLockElement = null;
      this.fire("pointerlockchange");
    },
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(listener);
    },
    removeEventListener(type, listener) {
      listeners.get(type)?.delete(listener);
    },
    fire(type) {
      listeners.get(type)?.forEach((l) => l());
    },
  };
  return doc;
}

function element(doc: ReturnType<typeof fakeDocument>, behaviour: (options?: { unadjustedMovement?: boolean }) => Promise<void> | void) {
  const el = { requestPointerLock: vi.fn(behaviour) } as unknown as Element & { requestPointerLock: ReturnType<typeof vi.fn> };
  void doc;
  return el;
}

describe("pointer lock", () => {
  it("locks (and says so), reports changes, and unlocks", async () => {
    const doc = fakeDocument();
    const el = element(doc, () => {
      doc.pointerLockElement = el;
      doc.fire("pointerlockchange");
    });
    const seen: boolean[] = [];
    const off = onPointerLockChange((locked) => seen.push(locked), doc);
    await expect(lockPointer(el, { target: doc })).resolves.toBe(true);
    expect(isPointerLocked(el, doc)).toBe(true);
    unlockPointer(doc);
    expect(isPointerLocked(el, doc)).toBe(false);
    expect(seen).toEqual([true, false]);
    off();
    unlockPointer(doc);
    expect(seen).toEqual([true, false]);
  });

  it("asks for raw movement, and locks without it where that's not supported", async () => {
    const doc = fakeDocument();
    const el = element(doc, (options) => {
      if (options?.unadjustedMovement) return Promise.reject(Object.assign(new Error("no"), { name: "NotSupportedError" }));
      doc.pointerLockElement = el;
      doc.fire("pointerlockchange");
      return Promise.resolve();
    });
    await expect(lockPointer(el, { raw: true, target: doc })).resolves.toBe(true);
    expect(el.requestPointerLock).toHaveBeenCalledTimes(2);
    expect(el.requestPointerLock.mock.calls[0]![0]).toEqual({ unadjustedMovement: true });
  });

  it("gives up when the browser refuses (too soon after Esc, not from a click)", async () => {
    const doc = fakeDocument();
    const el = element(doc, () => {
      doc.fire("pointerlockerror");
    });
    await expect(lockPointer(el, { target: doc })).resolves.toBe(false);
    const rejecting = element(doc, () => Promise.reject(Object.assign(new Error("soon"), { name: "SecurityError" })));
    await expect(lockPointer(rejecting, { target: doc })).resolves.toBe(false);
  });
});
