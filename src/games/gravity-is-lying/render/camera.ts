// The camera (Plan/15-gravity-is-lying.md §3, §10.4, §11): rooms are one screen, so it never
// scrolls; it only turns. Tilted Town shows some rooms turned (the room's `view.up` is drawn at the
// top of the screen) and a little tilted (gravity hills). A turn is never a snap: at most a quarter
// turn every 0.6 s. With reduce motion on it never turns at all (the HUD shows a little frame
// instead). It's for the eyes only: the room plays the same whichever way it's shown.
import { TURN_TICKS_PER_QUARTER, VIEW_H, VIEW_W } from "../core/constants";
import { opposite, TURN, type Vec } from "../core/gravity";
import type { Room } from "../core/room";

/** The room's resting angle on screen (radians, clockwise): its `view.up` at the top, plus its tilt. */
export function viewAngle(room: Room): number {
  // Turning by TURN[d] puts something's feet toward d; the room's "up" goes to the top when its
  // down (the opposite) is turned to the screen's down: that's the reverse turn.
  return wrap(-TURN[opposite(room.view.up)] + (room.view.tilt * Math.PI) / 180);
}

/** An angle in (-π, π]. */
export function wrap(a: number): number {
  let x = a % (2 * Math.PI);
  if (x <= -Math.PI) x += 2 * Math.PI;
  if (x > Math.PI) x -= 2 * Math.PI;
  return x;
}

/** How big the room can be drawn at an angle and still fit the screen. */
export function fitScale(room: { w: number; h: number }, angle: number): number {
  const c = Math.abs(Math.cos(angle));
  const s = Math.abs(Math.sin(angle));
  const bw = room.w * c + room.h * s;
  const bh = room.w * s + room.h * c;
  return Math.min(VIEW_W / bw, VIEW_H / bh, 1);
}

/** The fastest a camera turns (radians a tick). */
export const MAX_TURN_SPEED = Math.PI / 2 / TURN_TICKS_PER_QUARTER;

export class Camera {
  angle = 0;
  prevAngle = 0;
  private room: Room | null = null;

  constructor(private readonly reducedMotion: () => boolean) {}

  /** Where it's heading: the room's view, or level with reduce motion on (or before an intro turn). */
  target(room: Room, tick: number): number {
    if (this.reducedMotion()) return 0;
    if (room.view.intro !== null && tick < room.view.intro) return 0;
    return viewAngle(room);
  }

  /** A new room (or the same one again): straight to where it rests. */
  snap(room: Room, tick = 0) {
    this.room = room;
    this.angle = this.prevAngle = this.target(room, tick);
  }

  /** One tick: turn toward the target, easing in and out, never faster than a quarter turn in 0.6 s. */
  update(room: Room, tick: number) {
    if (room !== this.room) this.snap(room, tick);
    this.prevAngle = this.angle;
    const diff = wrap(this.target(room, tick) - this.angle);
    if (Math.abs(diff) < 1e-4) {
      this.angle = this.target(room, tick);
      return;
    }
    const step = Math.sign(diff) * Math.min(Math.abs(diff) * 0.12 + 0.004, MAX_TURN_SPEED, Math.abs(diff));
    this.angle = wrap(this.angle + step);
  }

  /** The angle to draw at (between ticks). */
  at(alpha: number): number {
    return wrap(this.prevAngle + wrap(this.angle - this.prevAngle) * alpha);
  }

  /** Is it turning right now? */
  get turning(): boolean {
    return Math.abs(wrap(this.angle - this.prevAngle)) > 1e-5;
  }
}

/** A room point on the (480 × 272) screen, for a camera angle. */
export function roomToScreen(room: { w: number; h: number }, angle: number, p: Vec): Vec {
  const s = fitScale(room, angle);
  const x = (p.x - room.w / 2) * s;
  const y = (p.y - room.h / 2) * s;
  const c = Math.cos(angle);
  const n = Math.sin(angle);
  return { x: VIEW_W / 2 + x * c - y * n, y: VIEW_H / 2 + x * n + y * c };
}

/** A direction in the room, as the screen shows it (turned by the camera). */
export function dirToScreen(v: Vec, angle: number): Vec {
  const c = Math.cos(angle);
  const n = Math.sin(angle);
  return { x: v.x * c - v.y * n, y: v.x * n + v.y * c };
}
