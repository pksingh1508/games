// Pointer Lock (Plan/README.md › engine/browser): capture the mouse so a game can read raw movement
// and draw its own cursor. It needs a click (a user gesture), Esc always releases it (the browser says
// so on screen), and some browsers refuse a new lock for about a second after Esc. "Raw" asks for
// movement without the operating system's acceleration where the browser supports it (Chromium), and
// quietly falls back to normal movement everywhere else.

/** The bits of `document` and `Element` this needs (a fake can stand in for tests). */
export interface LockDocument {
  pointerLockElement: Element | null;
  exitPointerLock(): void;
  addEventListener(type: "pointerlockchange" | "pointerlockerror", listener: () => void): void;
  removeEventListener(type: "pointerlockchange" | "pointerlockerror", listener: () => void): void;
}

type LockableElement = Element & { requestPointerLock(options?: { unadjustedMovement?: boolean }): Promise<void> | void };

const doc = (): LockDocument | null => (typeof document === "undefined" ? null : (document as unknown as LockDocument));

/** The browser can lock the pointer at all (phones and tablets can't). */
export function pointerLockSupported(target: LockDocument | null = doc()): boolean {
  return !!target && typeof Element !== "undefined" && "requestPointerLock" in Element.prototype && "exitPointerLock" in target;
}

export function isPointerLocked(element?: Element | null, target: LockDocument | null = doc()): boolean {
  if (!target?.pointerLockElement) return false;
  return element ? target.pointerLockElement === element : true;
}

/**
 * Lock the pointer to `element` (call it from a click). Resolves true once it's locked, false if the
 * browser refused (too soon after Esc, not from a click, not supported).
 */
export function lockPointer(element: Element, { raw = false, target = doc() }: { raw?: boolean; target?: LockDocument | null } = {}): Promise<boolean> {
  if (!target) return Promise.resolve(false);
  if (target.pointerLockElement === element) return Promise.resolve(true);
  const el = element as LockableElement;
  return new Promise<boolean>((resolve) => {
    let settled = false;
    const finish = (locked: boolean) => {
      if (settled) return;
      settled = true;
      target.removeEventListener("pointerlockchange", changed);
      target.removeEventListener("pointerlockerror", failed);
      resolve(locked);
    };
    const changed = () => {
      if (target.pointerLockElement === element) finish(true);
    };
    const failed = () => finish(false);
    target.addEventListener("pointerlockchange", changed);
    target.addEventListener("pointerlockerror", failed);
    const attempt = (options?: { unadjustedMovement: boolean }) => {
      try {
        const result = options ? el.requestPointerLock(options) : el.requestPointerLock();
        if (result && typeof result.then === "function") {
          result.then(
            () => finish(target.pointerLockElement === element),
            (error: unknown) => {
              // Raw movement isn't supported here: lock without it.
              if (options && error instanceof Error && error.name === "NotSupportedError") attempt();
              else finish(false);
            },
          );
        }
      } catch {
        if (options) attempt();
        else finish(false);
      }
    };
    attempt(raw ? { unadjustedMovement: true } : undefined);
    // Browsers that answer with neither an event nor a promise.
    setTimeout(() => finish(target.pointerLockElement === element), 1500);
  });
}

export function unlockPointer(target: LockDocument | null = doc()) {
  if (target?.pointerLockElement) target.exitPointerLock();
}

/** Called with true when the pointer is locked, false when it's released (Esc, a tab switch, an unlock). */
export function onPointerLockChange(listener: (locked: boolean) => void, target: LockDocument | null = doc()): () => void {
  if (!target) return () => {};
  const changed = () => listener(target.pointerLockElement !== null);
  target.addEventListener("pointerlockchange", changed);
  return () => target.removeEventListener("pointerlockchange", changed);
}
