// What the game tells you about how far you've come, and what's true (Plan/08-almost-there.md §4,
// §12): the progress bar lies, the altitude in the pause menu never does.
import { METRE, VIEW_H } from "./constants";
import { altitudeOf, rowTop, type Mountain } from "./mountain";
import type { Climb } from "./climb";

/** How high Pip's feet are, in metres (honest). */
export const altitude = (c: Climb) => altitudeOf(c.sim.pip.y + c.sim.pip.h);
/** The highest this climb has been, in metres. */
export const bestAltitude = (c: Climb) => altitudeOf(c.best);

/** Heights that matter (metres): the start, the fake summit, the real one (flags stand on the ground). */
export function landmarks(m: Mountain) {
  return {
    base: altitudeOf(m.start.y + 12),
    fake: altitudeOf(m.fakeFlag.y + m.fakeFlag.h),
    real: altitudeOf(m.realFlag.y + m.realFlag.h),
  };
}

export type Shown =
  /** A share of the way up (0–1), as the bar says it. */
  | { kind: "bar"; value: number }
  /** After the fake summit, it sticks at 99.9%… */
  | { kind: "stuck" }
  /** …until near the real top, when it gives up. */
  | { kind: "broken" }
  | { kind: "done" };

/** The zone where the bar gives up: "Progress bar broke. Sorry." */
const BROKEN_FROM = rowTop(36) + VIEW_H;

/**
 * The lying progress bar. Below the fake summit it runs ahead of the truth (90% at the fake
 * summit, which is barely past halfway, and early metres count for more than late ones); after it,
 * 99.9% for the whole second half; near the real top it breaks.
 */
export function shownProgress(m: Mountain, c: Climb): Shown {
  if (c.story === "summit") return { kind: "done" };
  // Once it breaks it stays broken.
  if (c.story === "fallen") return c.best <= BROKEN_FROM ? { kind: "broken" } : { kind: "stuck" };
  const { base, fake } = landmarks(m);
  const t = Math.max(0, Math.min(1, (altitude(c) - base) / (fake - base)));
  return { kind: "bar", value: 0.9 * Math.pow(t, 0.8) };
}

/** The truth, for the pause menu: a share of the real climb (0–1). */
export function trueProgress(m: Mountain, c: Climb): number {
  const { base, real } = landmarks(m);
  return Math.max(0, Math.min(1, (altitude(c) - base) / (real - base)));
}

/** "1,234 m" */
export const formatMetres = (m: number) => `${Math.round(m).toLocaleString("en-US")} m`;
export const pxToMetres = (px: number) => px / METRE;

/** "1:02:03.4" or "2:03.4" (from ticks). */
export function formatClock(ticks: number, tenths = true): string {
  const total = Math.floor((ticks * 10) / 60);
  const d = total % 10;
  const s = Math.floor(total / 10) % 60;
  const m = Math.floor(total / 600) % 60;
  const h = Math.floor(total / 36000);
  const tail = tenths ? `.${d}` : "";
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}${tail}` : `${m}:${String(s).padStart(2, "0")}${tail}`;
}
