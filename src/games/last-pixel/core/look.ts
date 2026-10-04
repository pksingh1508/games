// What cells and Pix look like (Plan/10-last-pixel.md §3, §4, §11). A cell shows the "before" picture
// fading into the "after" one as it's done. Pix glows (it's a pixel with somewhere to be); camouflaged, it
// takes the colour under it, just 2% brighter or darker (brightness, not hue, so it's the same trick for
// every eye), and every 2 seconds the shimmer gives it away.
import { CAMO_DELTA, FULL } from "./constants";
import type { Scene } from "./level";
import { hex, luma, mix, shade, type Colour } from "./picture";
import type { World } from "./world";

/** The colour a cell shows (how done it is, and which way it was mown). */
export function cellColour(scene: Scene, amount: Uint8Array, variant: Uint8Array, i: number): Colour {
  const a = amount[i]!;
  const after = variant[i] && scene.after2 ? scene.after2.data[i]! : scene.after.data[i]!;
  if (a >= FULL) return after;
  if (a === 0) return scene.before.data[i]!;
  return mix(scene.before.data[i]!, after, a / FULL);
}

/** Pix's own colour when it isn't hiding: a warm cream glow. */
export const PIX_GLOW = hex("#FFF4D6");

/** The colour Pix shows on the canvas right now. */
export function pixColour(world: World): Colour {
  if (!world.def.camo || world.pix.gaveUp) return world.scene.glow ?? PIX_GLOW;
  const x = Math.floor(world.pix.x);
  const y = Math.floor(world.pix.y);
  const under = cellColour(world.scene, world.cov.amount, world.cov.variant, Math.max(0, Math.min(world.cov.size - 1, y * world.w + x)));
  // Lighter on a dark background, darker on a light one: always the same small step in brightness.
  const lighter = luma(under) < 128;
  const k = world.shimmering() ? 0.14 : CAMO_DELTA;
  return shade(under, lighter ? 1 + k : 1 - k);
}

/** How different two colours' brightness is, 0–1 (of the brighter one). */
export function contrast(a: Colour, b: Colour): number {
  const la = luma(a);
  const lb = luma(b);
  return Math.abs(la - lb) / Math.max(1, la, lb);
}
