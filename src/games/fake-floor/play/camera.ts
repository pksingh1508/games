// The camera (Plan/05-fake-floor.md §2, §12): it follows you sideways, a little ahead of where
// you're facing, and "look ahead" pans it much further. Painted floors are painted to line up with
// the real ones when the camera has settled where you'd stand to look at them, so any camera move
// (walking, looking ahead) makes them slide.
import type { Runner } from "@/engine/platformer/runner";
import { PLAYER_W, VIEW_W } from "../core/constants";
import type { Room } from "../core/room";

/** The camera sits this far ahead of you, in the way you're facing. */
export const CAMERA_LEAD = 48;
/** Looking ahead pans this much further. */
export const LOOK_AHEAD = 208;

export const maxCamera = (room: Room) => Math.max(0, room.width - VIEW_W);
const clampTo = (room: Room, x: number) => Math.max(0, Math.min(maxCamera(room), x));

export class Camera {
  x = 0;
  prev = 0;
  /** The look-ahead pan right now (it eases in and out). */
  look = 0;

  constructor(private readonly room: Room) {}

  private target(p: Runner): number {
    return clampTo(this.room, p.x + p.w / 2 - VIEW_W / 2 + p.facing * CAMERA_LEAD + this.look);
  }

  /** Jump straight to the player (a new room, a restart). */
  snap(p: Runner) {
    this.look = 0;
    this.x = this.prev = this.target(p);
  }

  /** One tick. */
  update(p: Runner, looking: boolean) {
    this.prev = this.x;
    this.look += ((looking ? p.facing * LOOK_AHEAD : 0) - this.look) * 0.1;
    if (Math.abs(this.look) < 0.05) this.look = 0;
    const t = this.target(p);
    this.x += (t - this.x) * 0.12;
    if (Math.abs(t - this.x) < 0.05) this.x = t;
  }

  /** Between the last two ticks (smooth on fast screens). */
  at(alpha: number): number {
    return this.prev + (this.x - this.prev) * alpha;
  }
}

const restCache = new WeakMap<Room, Map<number, number>>();

/**
 * Where the camera settles while you stand facing a painted floor, just before it (from the left,
 * the way rooms run). At that camera position it lines up exactly with the real floors.
 */
export function restCamera(room: Room, i: number): number {
  let byFloor = restCache.get(room);
  if (!byFloor) {
    byFloor = new Map();
    restCache.set(room, byFloor);
  }
  const hit = byFloor.get(i);
  if (hit !== undefined) return hit;
  // The run of painted tiles this one belongs to.
  let start = room.floors[i]!;
  for (;;) {
    const left = start.c > 0 ? room.cells[start.r * room.cols + start.c - 1]! : -1;
    if (left < 0 || room.floors[left]!.kind !== "painted") break;
    start = room.floors[left]!;
  }
  const rest = clampTo(room, start.x - PLAYER_W / 2 - VIEW_W / 2 + CAMERA_LEAD);
  byFloor.set(i, rest);
  return rest;
}
