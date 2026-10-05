// The camera: metres (y up) to canvas pixels (y down). It fits the platform, the goal line and the belt on
// any screen; spare room on a wide screen shows more of the location, on a tall one more sky and pillar.
import type { Vec } from "../core/geometry";

export interface Camera {
  /** Pixels per metre. */
  scale: number;
  /** Where the world's origin is, in canvas pixels. */
  ox: number;
  oy: number;
  /** The canvas, in CSS pixels. */
  w: number;
  h: number;
}

export const toScreen = (c: Camera, p: Vec): Vec => ({ x: c.ox + p.x * c.scale, y: c.oy - p.y * c.scale });
export const toWorld = (c: Camera, x: number, y: number): Vec => ({ x: (x - c.ox) / c.scale, y: (c.oy - y) / c.scale });

/** Fit [left, right] × [bottom, top] (metres) into a w × h canvas; spare height goes a little more below. */
export function fit(w: number, h: number, rect: { left: number; right: number; bottom: number; top: number }): Camera {
  const scale = Math.min(w / (rect.right - rect.left), h / (rect.top - rect.bottom));
  const ox = w / 2 - ((rect.left + rect.right) / 2) * scale;
  const extra = h - (rect.top - rect.bottom) * scale;
  const oy = h - extra * 0.55 + rect.bottom * scale;
  return { scale, ox, oy, w, h };
}

/** What a level's camera must show: the platform (and a little either side), the pillar, up past the belt. */
export function viewRect(platform: number, viewTop: number) {
  const half = Math.max(platform, 4) / 2 + 0.55;
  return { left: -half, right: half, bottom: -1.3, top: viewTop };
}
