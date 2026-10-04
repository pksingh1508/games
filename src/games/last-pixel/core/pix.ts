// Pix, the last pixel (Plan/10-last-pixel.md §3 "Phase 2"), and its decoys: how they move. Free on the
// canvas, Pix wanders, or (if it flees) runs from your cursor, choosing the heading that keeps it furthest
// from you without boxing itself into a corner, faster the closer you get, with a sideways dodge when
// you're right on it. Its decoys move the same way (each with its own mind) but they're not real: they
// ignore bait, and they never blink on the beat.
import type { Rng } from "@/engine/rng";
import { HZ, JUKE_COOLDOWN, JUKE_R } from "./constants";
import { clamp, type Vec } from "./geometry";

export interface Mover {
  x: number;
  y: number;
  /** Last move (cells a second): which way it's going. */
  vx: number;
  vy: number;
  /** Where it's wandering to. */
  target: Vec | null;
  /** Ticks to wait before wandering on. */
  wait: number;
  jukeCool: number;
  /** Breath, 0–1: running flat out uses it up (and it slows), ambling gets it back. */
  stamina: number;
}

export interface Decoy extends Mover {
  alive: boolean;
  /** The next tick it blinks (decoys blink when they like, never on the beat). */
  blinkAt: number;
}

export interface MoveContext {
  w: number;
  h: number;
  rng: Rng;
  /** Your cursor (cells), or null (no mouse over the page, no finger down). */
  pointer: Vec | null;
  /** How close you can get before it runs (cells). */
  notice: number;
  /** Sideways dodges allowed (not when it's tired). */
  juke: boolean;
  /** Dodged: for the sound. */
  onJuke(): void;
}

export const mover = (x: number, y: number): Mover => ({ x, y, vx: 0, vy: 0, target: null, wait: 0, jukeCool: 0, stamina: 1 });

/** How fast it tires running flat out, and gets its breath back (per second). */
const WINDED = 0.3;
const RECOVER = 0.35;

/** Keep it on the canvas (half a cell in from the edge). */
export function keepOn(m: Mover, w: number, h: number) {
  m.x = clamp(m.x, 0.5, w - 0.5);
  m.y = clamp(m.y, 0.5, h - 0.5);
}

/** Move by (dx, dy) cells this tick, remembering the velocity. */
function go(m: Mover, dx: number, dy: number, w: number, h: number) {
  const x0 = m.x;
  const y0 = m.y;
  m.x += dx;
  m.y += dy;
  keepOn(m, w, h);
  m.vx = (m.x - x0) * HZ;
  m.vy = (m.y - y0) * HZ;
}

/** Straight towards a point at `speed` (cells a second). True once it's there. */
export function travel(m: Mover, to: Vec, speed: number, bounded: { w: number; h: number } | null): boolean {
  const dx = to.x - m.x;
  const dy = to.y - m.y;
  const d = Math.hypot(dx, dy);
  const step = speed / HZ;
  if (d <= step) {
    m.vx = dx * HZ;
    m.vy = dy * HZ;
    m.x = to.x;
    m.y = to.y;
    return true;
  }
  if (bounded) go(m, (dx / d) * step, (dy / d) * step, bounded.w, bounded.h);
  else {
    m.x += (dx / d) * step;
    m.y += (dy / d) * step;
    m.vx = (dx / d) * speed;
    m.vy = (dy / d) * speed;
  }
  return false;
}

/**
 * One tick of free movement: flee from the cursor (if it flees and you're near), else wander. `still`:
 * a camouflaged Pix that doesn't flee barely moves (it's hiding in plain sight).
 */
export function roam(m: Mover, ctx: MoveContext, speed: number, flee: boolean, still: boolean) {
  const { w, h, rng, pointer } = ctx;
  if (m.jukeCool > 0) m.jukeCool--;
  const d = pointer ? Math.hypot(m.x - pointer.x, m.y - pointer.y) : Infinity;
  if (flee && pointer && d < ctx.notice) {
    m.target = null;
    m.wait = 0;
    if (ctx.juke && d < JUKE_R && m.jukeCool <= 0) {
      // A sideways dodge, to whichever side has more room.
      const px = -(m.y - pointer.y) / (d || 1);
      const py = (m.x - pointer.x) / (d || 1);
      const room = (s: number) => Math.min(m.x + px * s * 4, m.y + py * s * 4, w - (m.x + px * s * 4), h - (m.y + py * s * 4));
      const side = room(1) >= room(-1) ? 1 : -1;
      go(m, px * side * 3.5, py * side * 3.5, w, h);
      m.jukeCool = JUKE_COOLDOWN;
      ctx.onJuke();
      return;
    }
    // The heading that keeps it furthest from you, without boxing itself into a corner.
    const look = 4;
    const heading = Math.hypot(m.vx, m.vy) || 1;
    let best = -Infinity;
    let bx = 0;
    let by = 0;
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      const ax = Math.cos(a);
      const ay = Math.sin(a);
      const nx = m.x + ax * look;
      const ny = m.y + ay * look;
      const room = Math.min(nx, ny, w - nx, h - ny);
      let score = Math.hypot(nx - pointer.x, ny - pointer.y) - Math.max(0, 5 - room) * 0.9 + rng() * 0.6;
      score += (0.7 * (ax * m.vx + ay * m.vy)) / heading;
      if (score > best) {
        best = score;
        bx = ax;
        by = ay;
      }
    }
    // Out of breath, it slows down: that's your moment.
    const run = speed * (0.8 + 1.6 * (1 - d / ctx.notice)) * (0.4 + 0.6 * m.stamina);
    m.stamina = Math.max(0, m.stamina - WINDED / HZ);
    go(m, (bx * run) / HZ, (by * run) / HZ, w, h);
    return;
  }
  m.stamina = Math.min(1, m.stamina + RECOVER / HZ);
  // Wandering: amble to a spot, sometimes stop for a moment.
  if (m.wait > 0) {
    m.wait--;
    m.vx = m.vy = 0;
    return;
  }
  if (!m.target || Math.hypot(m.target.x - m.x, m.target.y - m.y) < 1) {
    const margin = 5;
    m.target = { x: margin + rng() * (w - margin * 2), y: margin + rng() * (h - margin * 2) };
    if (rng() < 0.45) {
      m.wait = Math.round(HZ * (0.4 + rng() * (still ? 2.5 : 1)));
      return;
    }
  }
  const pace = speed * (still ? 0.1 : 0.3);
  const dx = m.target.x - m.x;
  const dy = m.target.y - m.y;
  const dd = Math.hypot(dx, dy) || 1;
  go(m, ((dx / dd) * pace) / HZ, ((dy / dd) * pace) / HZ, w, h);
}
