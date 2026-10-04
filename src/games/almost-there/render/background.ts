// Behind the rock: each zone's sky, distant mountains, and the Summit Mirage (Plan/08-almost-there.md
// §4): a peak in the background that looks like the goal. It's painted scenery: when the camera
// cuts up a screen it only moves a quarter as far as the rock does (that's the tell).
import { GRID_ROWS, VIEW_H, VIEW_W } from "../core/constants";
import { rowTop, type ZoneId } from "../core/mountain";
import { hash, mix, R, ZONE_LOOK } from "./palette";

/** How far the far mountains move for every pixel the rock moves. */
export const FAR_PARALLAX = 0.25;
const NEAR_PARALLAX = 0.5;

const cache = new Map<string, HTMLCanvasElement>();

/** A mountain range's skyline: height at x (deterministic). */
function ridge(x: number, seed: number, rough: number, base: number): number {
  let h = 0;
  for (let k = 1; k <= 4; k++) {
    const f = (k * k * 0.004 + 0.002) * rough;
    h += Math.sin(x * f + seed * (k + 1.3)) * (base / k);
  }
  return h + (hash(Math.floor(x / 3), seed) - 0.5) * 3;
}

/**
 * The far layers for a screen (cached). `worldTop` is the screen's top (world y); the layers sit
 * where they would if the mountains were far away (they drop slowly as you climb).
 */
export function screenBackground(zone: ZoneId, worldTop: number, mirrored: boolean): HTMLCanvasElement {
  const key = `${zone}:${worldTop}:${mirrored ? 1 : 0}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  canvas.width = VIEW_W;
  canvas.height = VIEW_H;
  const g = canvas.getContext("2d")!;
  const look = ZONE_LOOK[zone];

  // Sky. The summit's sky is one gradient over all its screens: the credits' camera pans up
  // through three of them at once, and there must be no seams.
  if (zone === "fake-summit") {
    const top = rowTop(29) - worldTop;
    const bottom = rowTop(25) + VIEW_H - worldTop;
    const grad = g.createLinearGradient(0, top, 0, bottom);
    grad.addColorStop(0, R.blue);
    grad.addColorStop(0.42, R.sky);
    grad.addColorStop(0.72, R.apricot);
    grad.addColorStop(1, R.cream);
    g.fillStyle = grad;
  } else {
    const grad = g.createLinearGradient(0, 0, 0, VIEW_H);
    grad.addColorStop(0, look.sky[0]);
    grad.addColorStop(0.55, look.sky[1]);
    grad.addColorStop(1, look.sky[2]);
    g.fillStyle = grad;
  }
  g.fillRect(0, 0, VIEW_W, VIEW_H);
  if (zone === "fake-summit" && worldTop < rowTop(26)) {
    paintTheRestOfTheMountain(g, worldTop, mirrored);
    cache.set(key, canvas);
    return canvas;
  }

  if (look.dark) {
    // Inside the mountain: the far wall of the cave, barely there.
    for (let y = 0; y < VIEW_H; y += 4) {
      for (let x = 0; x < VIEW_W; x += 4) {
        const h = hash(x, y + worldTop, 3);
        if (h < 0.08) {
          g.fillStyle = h < 0.03 ? R.dusk : R.plum;
          g.fillRect(x, y, h < 0.02 ? 2 : 1, 1);
        }
      }
    }
    cache.set(key, canvas);
    return canvas;
  }

  // Stars high up, before the sunset zones.
  if (zone === "clocktower" || zone === "cliffs") {
    for (let i = 0; i < 40; i++) {
      const h = hash(i, worldTop, 5);
      g.fillStyle = `rgba(255,255,255,${0.25 + h * 0.5})`;
      g.fillRect((hash(i, 1, worldTop) * VIEW_W) | 0, (h * VIEW_H * 0.5) | 0, 1, 1);
    }
  }

  // Far mountains, with the Mirage: a peak shaped like the summit, always "just there".
  const height = GRID_ROWS * VIEW_H;
  const climbed = height - worldTop - VIEW_H; // how high the screen's bottom is
  const farBase = VIEW_H * 0.72 + climbed * FAR_PARALLAX * 0.15;
  const mirageX = mirrored ? VIEW_W * 0.28 : VIEW_W * 0.72;
  g.fillStyle = look.far;
  for (let x = 0; x < VIEW_W; x++) {
    let top = farBase - 18 - ridge(x, 3, 1, 10);
    const d = Math.abs(x - mirageX);
    if (d < 70) top = Math.min(top, farBase - 74 + d * 0.9 + (d < 8 ? 0 : ridge(x, 9, 2, 2)));
    if (top < VIEW_H) g.fillRect(x, Math.max(0, Math.round(top)), 1, VIEW_H);
  }
  // Snow on the Mirage.
  g.fillStyle = mix(look.far, R.white, 0.7);
  for (let x = Math.floor(mirageX - 16); x <= mirageX + 16; x++) {
    const d = Math.abs(x - mirageX);
    const top = farBase - 74 + d * 0.9;
    if (top < VIEW_H) g.fillRect(x, Math.max(0, Math.round(top)), 1, Math.max(1, Math.round(6 - d * 0.3)));
  }
  // A flag on the Mirage (it looks like the goal; it's paint).
  const fy = Math.round(farBase - 74);
  if (fy > 4 && fy < VIEW_H) {
    g.fillStyle = mix(look.far, R.night, 0.4);
    g.fillRect(Math.round(mirageX), fy - 6, 1, 6);
    g.fillStyle = mix(look.far, R.hot, 0.6);
    g.fillRect(Math.round(mirageX) + 1, fy - 6, 3, 2);
  }

  // Nearer hills.
  const nearBase = VIEW_H * 0.92 + climbed * NEAR_PARALLAX * 0.1;
  g.fillStyle = look.near;
  for (let x = 0; x < VIEW_W; x++) {
    const top = nearBase - 10 - ridge(x, 17, 1.6, 7);
    if (top < VIEW_H) g.fillRect(x, Math.max(0, Math.round(top)), 1, VIEW_H);
  }

  // Zone touches.
  if (zone === "rooftops") {
    // Distant roofs and lit windows.
    for (let i = 0; i < 14; i++) {
      const x = (hash(i, 31) * VIEW_W) | 0;
      const w = 10 + ((hash(i, 32) * 16) | 0);
      const top = Math.round(nearBase - 18 - hash(i, 33) * 22);
      g.fillStyle = R.wine;
      g.fillRect(x, top, w, VIEW_H);
      g.fillStyle = R.raisin;
      g.fillRect(x - 1, top - 2, w + 2, 2);
      g.fillStyle = R.peach;
      if (hash(i, 34) < 0.7) g.fillRect(x + 3, top + 5, 2, 2);
      if (hash(i, 35) < 0.5) g.fillRect(x + w - 5, top + 9, 2, 2);
    }
  } else if (zone === "clocktower") {
    // A big clock face, far off.
    const cx = mirrored ? VIEW_W * 0.75 : VIEW_W * 0.25;
    const cy = VIEW_H * 0.35;
    g.fillStyle = R.raisin;
    g.beginPath();
    g.arc(cx, cy, 30, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = mix(R.raisin, R.gold, 0.25);
    g.beginPath();
    g.arc(cx, cy, 26, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = R.raisin;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      g.fillRect(Math.round(cx + Math.cos(a) * 22) - 1, Math.round(cy + Math.sin(a) * 22) - 1, 2, 2);
    }
  } else if (zone === "sky" || zone === "fake-summit") {
    // Cloud banks.
    for (let i = 0; i < 9; i++) {
      const x = hash(i, 41, worldTop) * VIEW_W;
      const y = VIEW_H * (0.3 + hash(i, 42, worldTop) * 0.6);
      const w = 40 + hash(i, 43) * 60;
      g.fillStyle = `rgba(253,203,176,${0.25 + hash(i, 44) * 0.25})`;
      g.fillRect(Math.round(x - w / 2), Math.round(y), Math.round(w), 6);
      g.fillRect(Math.round(x - w / 3), Math.round(y - 4), Math.round(w * 0.6), 4);
    }
  }

  cache.set(key, canvas);
  return canvas;
}

/**
 * Above the fake summit, only the credits' camera ever looks: the rest of the mountain, rising out
 * of the clouds to a peak so high its flag is a speck (Plan §5: "revealing that the mountain keeps
 * going into the clouds"). Painted across three screens as one picture.
 */
function paintTheRestOfTheMountain(g: CanvasRenderingContext2D, worldTop: number, mirrored: boolean) {
  const top = rowTop(29);
  const span = 3 * VIEW_H;
  const peakX = mirrored ? VIEW_W * 0.36 : VIEW_W * 0.64;
  // Just inside the view where the credits' camera stops (two screens up).
  const peakU = 0.37;
  for (let cy = 0; cy < VIEW_H; cy++) {
    const wy = worldTop + cy;
    const u = (wy - top) / span;
    if (u < peakU) continue;
    const v = (u - peakU) / (1 - peakU);
    const half = 3 + v * 340;
    const left = Math.round(peakX - half * (0.82 + 0.06 * Math.sin(wy * 0.045)) + ridge(wy, 11, 2.2, 5));
    const right = Math.round(peakX + half * (1.15 + 0.05 * Math.sin(wy * 0.03 + 1)) + ridge(wy, 13, 2.2, 5));
    // The sunlit face, the shadowed face.
    const split = Math.round(peakX + half * 0.12 + ridge(wy, 17, 1.4, 3));
    g.fillStyle = mix(R.lilac, R.white, Math.max(0, 0.55 - v));
    g.fillRect(Math.max(0, left), cy, Math.max(0, Math.min(VIEW_W, split) - Math.max(0, left)), 1);
    g.fillStyle = mix(R.dusk, R.fog, Math.max(0, 0.45 - v));
    g.fillRect(Math.max(0, split), cy, Math.max(0, Math.min(VIEW_W, right) - Math.max(0, split)), 1);
    // Snow high up, in streaks.
    if (v < 0.3) {
      g.fillStyle = R.white;
      const streak = Math.round(half * (0.3 + 0.25 * hash(cy >> 2, 3)));
      g.fillRect(Math.max(0, split - streak), cy, streak, 1);
    }
  }
  // The flag on the real summit: tiny, because it's that far up.
  const fy = Math.round(top + span * peakU - worldTop);
  if (fy > 0 && fy < VIEW_H) {
    g.fillStyle = R.night;
    g.fillRect(Math.round(peakX), fy - 7, 1, 7);
    g.fillStyle = R.hot;
    g.fillRect(Math.round(peakX) + 1, fy - 7, 4, 2);
  }
  // A bank of cloud at the bottom: the summit you stood on is far below it.
  const bank = top + span * 0.84 - worldTop;
  for (let i = 0; i < 46; i++) {
    const x = hash(i, 51) * VIEW_W;
    const y = bank + hash(i, 52) * 60 - 10;
    const w = 50 + hash(i, 53) * 90;
    if (y > VIEW_H + 20 || y < -40) continue;
    g.fillStyle = i % 3 === 0 ? R.white : i % 3 === 1 ? R.cream : mix(R.apricot, R.white, 0.4);
    g.fillRect(Math.round(x - w / 2), Math.round(y), Math.round(w), 14);
    g.fillRect(Math.round(x - w / 3), Math.round(y - 6), Math.round(w * 0.6), 6);
  }
  if (bank + 50 < VIEW_H) {
    g.fillStyle = R.cream;
    g.fillRect(0, Math.max(0, Math.round(bank + 50)), VIEW_W, VIEW_H);
  }
  // Wisps in front of the peak.
  for (let i = 0; i < 8; i++) {
    const y = top + span * (0.25 + i * 0.07) - worldTop;
    if (y < -10 || y > VIEW_H + 10) continue;
    const x = hash(i, 61) * VIEW_W;
    g.fillStyle = "rgba(253,203,176,0.55)";
    g.fillRect(Math.round(x - 40), Math.round(y), 80, 4);
    g.fillRect(Math.round(x - 20), Math.round(y - 3), 44, 3);
  }
}
