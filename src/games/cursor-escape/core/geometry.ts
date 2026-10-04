// Swept collision (Plan/12-cursor-escape.md §10.3, §12): every move is checked along its whole path, so
// a flick can't skip through a wall, and you never crash into a wall you didn't actually reach. The
// arrow's hitbox is a circle at its tip (a rect grown by the radius, with rounded corners), the
// I-beam's a thin box. Touching means overlapping: grazing an edge exactly isn't a crash.

export interface Vec {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Nothing hit (a time past the end of any move). */
export const MISS = Infinity;

export const inRect = (px: number, py: number, r: Rect) => px > r.x && px < r.x + r.w && py > r.y && py < r.y + r.h;

export const rectsOverlap = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

export const grow = (r: Rect, by: number): Rect => ({ x: r.x - by, y: r.y - by, w: r.w + by * 2, h: r.h + by * 2 });

export const centre = (r: Rect): Vec => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });

/** The circle (centre, radius) overlaps the rect. */
export function circleHitsRect(cx: number, cy: number, radius: number, r: Rect): boolean {
  const nx = Math.max(r.x, Math.min(cx, r.x + r.w));
  const ny = Math.max(r.y, Math.min(cy, r.y + r.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < radius * radius;
}

/**
 * Liang–Barsky: when the segment from (ax, ay) moving by (dx, dy) first enters the open box
 * (x0, y0)–(x1, y1). 0 if it starts inside; MISS if it never gets inside.
 */
export function sweepBox(ax: number, ay: number, dx: number, dy: number, x0: number, y0: number, x1: number, y1: number): number {
  let t0 = 0;
  let t1 = 1;
  if (dx === 0) {
    if (ax <= x0 || ax >= x1) return MISS;
  } else {
    let ta = (x0 - ax) / dx;
    let tb = (x1 - ax) / dx;
    if (ta > tb) [ta, tb] = [tb, ta];
    if (ta > t0) t0 = ta;
    if (tb < t1) t1 = tb;
    if (t0 >= t1) return MISS;
  }
  if (dy === 0) {
    if (ay <= y0 || ay >= y1) return MISS;
  } else {
    let ta = (y0 - ay) / dy;
    let tb = (y1 - ay) / dy;
    if (ta > tb) [ta, tb] = [tb, ta];
    if (ta > t0) t0 = ta;
    if (tb < t1) t1 = tb;
    if (t0 >= t1) return MISS;
  }
  return t0;
}

/** When a point moving by (dx, dy) from (ax, ay) first comes closer than `radius` to (cx, cy). */
export function sweepCircle(ax: number, ay: number, dx: number, dy: number, cx: number, cy: number, radius: number): number {
  const fx = ax - cx;
  const fy = ay - cy;
  const c = fx * fx + fy * fy - radius * radius;
  if (c < 0) return 0;
  const a = dx * dx + dy * dy;
  if (a === 0) return MISS;
  const b = 2 * (fx * dx + fy * dy);
  const disc = b * b - 4 * a * c;
  if (disc <= 0) return MISS;
  const t = (-b - Math.sqrt(disc)) / (2 * a);
  return t >= 0 && t < 1 ? t : MISS;
}

/** A circle of `radius` swept from A by (dx, dy) against a rect: the rect grown by the radius, corners rounded. */
export function sweepRoundRect(ax: number, ay: number, dx: number, dy: number, radius: number, r: Rect): number {
  const x0 = r.x;
  const y0 = r.y;
  const x1 = r.x + r.w;
  const y1 = r.y + r.h;
  // Cheap reject: the move's bounding box doesn't come near.
  const minX = Math.min(ax, ax + dx);
  const maxX = Math.max(ax, ax + dx);
  const minY = Math.min(ay, ay + dy);
  const maxY = Math.max(ay, ay + dy);
  if (maxX <= x0 - radius || minX >= x1 + radius || maxY <= y0 - radius || minY >= y1 + radius) return MISS;
  let t = sweepBox(ax, ay, dx, dy, x0 - radius, y0, x1 + radius, y1);
  t = Math.min(t, sweepBox(ax, ay, dx, dy, x0, y0 - radius, x1, y1 + radius));
  if (t === 0) return 0;
  t = Math.min(t, sweepCircle(ax, ay, dx, dy, x0, y0, radius));
  t = Math.min(t, sweepCircle(ax, ay, dx, dy, x1, y0, radius));
  t = Math.min(t, sweepCircle(ax, ay, dx, dy, x0, y1, radius));
  t = Math.min(t, sweepCircle(ax, ay, dx, dy, x1, y1, radius));
  return t;
}

/** A box of half-size (hw, hh) swept from A by (dx, dy) against a rect (the I-beam). */
export function sweepHalfBox(ax: number, ay: number, dx: number, dy: number, hw: number, hh: number, r: Rect): number {
  return sweepBox(ax, ay, dx, dy, r.x - hw, r.y - hh, r.x + r.w + hw, r.y + r.h + hh);
}

/** The squared distance from a point to a segment. */
export function pointSegment2(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len = dx * dx + dy * dy;
  let t = len === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len;
  t = Math.max(0, Math.min(1, t));
  const qx = ax + t * dx - px;
  const qy = ay + t * dy - py;
  return qx * qx + qy * qy;
}

/** The squared shortest distance between segments AB and CD. */
export function segmentSegment2(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, dx: number, dy: number): number {
  // Crossing: distance zero.
  const d1 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx);
  const d2 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
  const d3 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const d4 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return 0;
  return Math.min(pointSegment2(ax, ay, cx, cy, dx, dy), pointSegment2(bx, by, cx, cy, dx, dy), pointSegment2(cx, cy, ax, ay, bx, by), pointSegment2(dx, dy, ax, ay, bx, by));
}
