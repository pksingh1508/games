// Which way the walking keys walk Newt (Plan/15-gravity-is-lying.md §2, §11). Newt mode (the
// default): ◀ ▶ walk along Newt's floor; when that floor looks level on screen they go the way they
// point, and on a wall they mean Newt's own left and right. Screen mode: the four arrows go the way
// they point on screen, along whatever Newt stands on. Either way, a held key keeps walking the same
// way through a flip, a zone or round a planet, until it's let go. Pure, so it's easy to test.
import { LEFT, RIGHT } from "../core/constants";
import type { Vec } from "../core/gravity";
import { dirToScreen } from "../render/camera";
import type { ControlMode } from "../save";

export interface Held {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

/** What a held key last meant: the keys held, the bit it gave, and Newt's floor then. */
export interface WalkLatch {
  keys: string;
  bit: number;
  floor: Vec;
}

const swap = (bit: number) => (bit === LEFT ? RIGHT : bit === RIGHT ? LEFT : 0);

/**
 * One tick's walking bit. `floor` is Newt's "right" along its floor, in the room (null out in deep
 * space, where walking does nothing); `camera` is the camera's angle.
 */
export function walk(mode: ControlMode, held: Held, floor: Vec | null, camera: number, latch: WalkLatch | null): { bit: number; latch: WalkLatch | null } {
  const screen = mode === "screen";
  const keys = `${held.left ? "L" : ""}${held.right ? "R" : ""}${screen && held.up ? "U" : ""}${screen && held.down ? "D" : ""}`;
  if (!keys) return { bit: 0, latch: null };
  if (!floor) return { bit: latch?.bit ?? 0, latch };
  // The same keys, still held: follow the floor round (a planet), or across a flip (keep going the same way).
  if (latch && latch.keys === keys) {
    const d = floor.x * latch.floor.x + floor.y * latch.floor.y;
    if (d > 0.5) return { bit: latch.bit, latch: { ...latch, floor } };
    if (d < -0.5) {
      const bit = swap(latch.bit);
      return { bit, latch: { keys, bit, floor } };
    }
  }
  const s = dirToScreen(floor, camera);
  let bit = 0;
  if (screen) {
    const ax = (held.right ? 1 : 0) - (held.left ? 1 : 0);
    const ay = (held.down ? 1 : 0) - (held.up ? 1 : 0);
    const len = Math.hypot(ax, ay);
    const d = len ? (ax * s.x + ay * s.y) / len : 0;
    bit = d > 0.25 ? RIGHT : d < -0.25 ? LEFT : 0;
  } else {
    const h = (held.right ? 1 : 0) - (held.left ? 1 : 0);
    if (h !== 0) {
      const level = Math.abs(s.x) >= Math.abs(s.y) - 0.01;
      bit = (level ? h * Math.sign(s.x) > 0 : h > 0) ? RIGHT : LEFT;
    }
  }
  return { bit, latch: { keys, bit, floor } };
}
