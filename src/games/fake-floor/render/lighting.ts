// Lanterns, light and shadows: World 3's tell (Plan/05-fake-floor.md §3, §12). Lanterns swing on
// their chains; every real floor casts a shadow on the back wall, offset by where the lantern is,
// so the shadows swing too. A fake casts none. A mimic's shadow is painted on: it stays put.
// The darkness is one overlay with the lights cut out (destination-out), in hard pixel-art bands.
import { TILE, VIEW_H, VIEW_W } from "../core/constants";
import type { Lantern, Room } from "../core/room";
import { E } from "./palette";

/** One swing there and back. */
export const SWING_PERIOD = 3.2;

export function lanternAt(l: Lantern, time: number, reducedMotion = false): { x: number; y: number; angle: number } {
  // With reduced motion the swing is gentler (shadows still move, just less).
  const amplitude = reducedMotion ? 0.22 : 0.42;
  const angle = amplitude * Math.sin((time / SWING_PERIOD) * Math.PI * 2 + l.phase);
  return { x: l.x + Math.sin(angle) * l.len, y: Math.cos(angle) * l.len, angle };
}

/** The lantern hanging still (where painted shadows were painted from). */
export const lanternAtRest = (l: Lantern) => ({ x: l.x, y: l.len, angle: 0 });

/** The lantern nearest a point (by where they hang). */
export function nearestLantern(room: Room, x: number): Lantern | null {
  let best: Lantern | null = null;
  for (const l of room.lanterns) if (!best || Math.abs(l.x - x) < Math.abs(best.x - x)) best = l;
  return best;
}

/** Where a floor tile's shadow falls on the wall, from a light at (lx, ly). */
export function shadowOffset(fx: number, fy: number, lx: number, ly: number, highContrast: boolean): { dx: number; dy: number } {
  const k = highContrast ? 0.24 : 0.18;
  const dx = Math.max(-16, Math.min(16, Math.round((fx + TILE / 2 - lx) * k)));
  const dy = Math.round(7 + Math.max(0, (fy - ly) * 0.05)) + (highContrast ? 3 : 0);
  return { dx, dy };
}

const lightCache = new Map<string, HTMLCanvasElement>();

/** A round light in four hard bands, as an alpha mask (cut out of the darkness). */
function lightSprite(radius: number): HTMLCanvasElement {
  const id = String(radius);
  const hit = lightCache.get(id);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = c.height = radius * 2;
  const g = c.getContext("2d")!;
  // [radius fraction, how much light], outside in; each band adds to the ones outside it.
  const bands: Array<[number, number]> = [
    [1, 0.3],
    [0.78, 0.55],
    [0.56, 0.8],
    [0.34, 1],
  ];
  let before = 0;
  for (const [fraction, alpha] of bands) {
    g.fillStyle = `rgba(0,0,0,${(alpha - before) / (1 - before)})`;
    const r = Math.round(radius * fraction);
    for (let y = -r; y <= r; y++) {
      const half = Math.floor(Math.sqrt(r * r - y * y));
      g.fillRect(radius - half, radius + y, half * 2 + 1, 1);
    }
    before = alpha;
  }
  lightCache.set(id, c);
  return c;
}

export class Lighting {
  private overlay: HTMLCanvasElement;
  private g: CanvasRenderingContext2D;

  constructor() {
    this.overlay = document.createElement("canvas");
    this.overlay.width = VIEW_W;
    this.overlay.height = VIEW_H;
    this.g = this.overlay.getContext("2d")!;
  }

  /** Darken everything but the lights (screen coordinates). */
  draw(target: CanvasRenderingContext2D, darkness: number, lights: ReadonlyArray<{ x: number; y: number; r: number }>, tint: string) {
    const g = this.g;
    g.globalCompositeOperation = "source-over";
    g.clearRect(0, 0, VIEW_W, VIEW_H);
    g.globalAlpha = darkness;
    g.fillStyle = E.ink;
    g.fillRect(0, 0, VIEW_W, VIEW_H);
    g.globalAlpha = 1;
    g.globalCompositeOperation = "destination-out";
    for (const l of lights) {
      const sprite = lightSprite(l.r);
      g.drawImage(sprite, Math.round(l.x - l.r), Math.round(l.y - l.r));
    }
    g.globalCompositeOperation = "source-over";
    target.drawImage(this.overlay, 0, 0);
    // A warm (or cold) glow where the light is.
    target.save();
    target.globalCompositeOperation = "lighter";
    for (const l of lights) {
      if (l.r < 60) continue;
      const grad = target.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r * 0.8);
      grad.addColorStop(0, tint);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      target.fillStyle = grad;
      target.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
    }
    target.restore();
  }
}
