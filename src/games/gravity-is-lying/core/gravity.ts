// Which way is down (Plan/15-gravity-is-lying.md §3, §12 "gravity frames"). For each of the four
// directions there's a local frame where gravity points down and "right" runs along the floor:
// the physics converts Newt into it, runs the shared platformer code unchanged, and converts back.
// Every conversion is a quarter turn or a half turn of whole numbers, so nothing is lost on the way.
import type { Rect, Solids } from "@/engine/platformer/physics";

export type Dir = "down" | "up" | "left" | "right";
/** In clockwise order (as the screen sees it). */
export const DIRS: readonly Dir[] = ["down", "left", "up", "right"];

export interface Vec {
  x: number;
  y: number;
}

/** Which way each direction pulls, on the screen's axes (y grows downward). */
export const VEC: Record<Dir, Vec> = {
  down: { x: 0, y: 1 },
  up: { x: 0, y: -1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Record<Dir, Dir> = { down: "up", up: "down", left: "right", right: "left" };
export const opposite = (d: Dir): Dir => OPPOSITE[d];

/** A quarter turn clockwise (as the screen sees it): down → left → up → right → down. */
export const clockwise = (d: Dir): Dir => DIRS[(DIRS.indexOf(d) + 1) % 4]!;
export const counterClockwise = (d: Dir): Dir => DIRS[(DIRS.indexOf(d) + 3) % 4]!;

/** The direction a vector mostly points. */
export function dirOf(v: Vec): Dir {
  if (Math.abs(v.x) > Math.abs(v.y)) return v.x < 0 ? "left" : "right";
  return v.y < 0 ? "up" : "down";
}

/** How far to turn something drawn upright (feet down) so its feet point this way (radians, clockwise). */
export const TURN: Record<Dir, number> = { down: 0, left: Math.PI / 2, up: Math.PI, right: -Math.PI / 2 };

/** -0 becomes 0 (so directions compare cleanly). */
const z = (n: number) => n + 0;

/** Newt's "right", along the floor: Newt's "up" turned a quarter clockwise. */
export function along(d: Dir): Vec {
  const g = VEC[d];
  return { x: z(g.y), y: z(-g.x) };
}

/** A room's size in pixels (the frame needs it to mirror positions). */
export interface Size {
  w: number;
  h: number;
}

/** A rectangle (or a body) in the local frame of `d`: gravity down, right along the floor. */
export function toLocal(d: Dir, r: Rect, room: Size): Rect {
  switch (d) {
    case "down":
      return { x: r.x, y: r.y, w: r.w, h: r.h };
    case "up":
      return { x: room.w - r.x - r.w, y: room.h - r.y - r.h, w: r.w, h: r.h };
    case "left":
      // Local right is the screen's down; local down is the screen's left.
      return { x: r.y, y: room.w - r.x - r.w, w: r.h, h: r.w };
    case "right":
      // Local right is the screen's up; local down is the screen's right.
      return { x: room.h - r.y - r.h, y: r.x, w: r.h, h: r.w };
  }
}

/** Back from the local frame of `d` to the room. */
export function toWorld(d: Dir, r: Rect, room: Size): Rect {
  switch (d) {
    case "down":
      return { x: r.x, y: r.y, w: r.w, h: r.h };
    case "up":
      return { x: room.w - r.x - r.w, y: room.h - r.y - r.h, w: r.w, h: r.h };
    case "left":
      return { x: room.w - r.y - r.h, y: r.x, w: r.h, h: r.w };
    case "right":
      return { x: r.y, y: room.h - r.x - r.w, w: r.h, h: r.w };
  }
}

/** A velocity (or any displacement) into the local frame of `d`. */
export function vecToLocal(d: Dir, v: Vec): Vec {
  switch (d) {
    case "down":
      return { x: v.x, y: v.y };
    case "up":
      return { x: z(-v.x), y: z(-v.y) };
    case "left":
      return { x: z(v.y), y: z(-v.x) };
    case "right":
      return { x: z(-v.y), y: z(v.x) };
  }
}

export function vecToWorld(d: Dir, v: Vec): Vec {
  switch (d) {
    case "down":
      return { x: v.x, y: v.y };
    case "up":
      return { x: z(-v.x), y: z(-v.y) };
    case "left":
      return { x: z(-v.y), y: z(v.x) };
    case "right":
      return { x: z(v.y), y: z(-v.x) };
  }
}

/** The room's solids, seen from the local frame of `d`. */
export function localSolids(d: Dir, solids: Solids, room: Size): Solids {
  if (d === "down") return solids;
  return {
    solidAt(x, y, w, h) {
      const r = toWorld(d, { x, y, w, h }, room);
      return solids.solidAt(r.x, r.y, r.w, r.h);
    },
  };
}
