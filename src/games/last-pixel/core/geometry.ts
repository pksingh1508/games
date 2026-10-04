// Points and boxes, in cells (fractions allowed: the pointer is never exactly on a cell).

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

export const dist = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y);

export const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

export const inRect = (p: Vec, r: Rect, pad = 0) => p.x >= r.x - pad && p.x < r.x + r.w + pad && p.y >= r.y - pad && p.y < r.y + r.h + pad;

/** The rect between two corners, whichever way it was drawn. */
export const rectOf = (a: Vec, b: Vec): Rect => ({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) });

/** How much of `r` lies on a w × h canvas (0–1). */
export function onCanvas(r: Rect, w: number, h: number): number {
  const ox = Math.max(0, Math.min(r.x + r.w, w) - Math.max(r.x, 0));
  const oy = Math.max(0, Math.min(r.y + r.h, h) - Math.max(r.y, 0));
  return r.w * r.h > 0 ? (ox * oy) / (r.w * r.h) : 0;
}
