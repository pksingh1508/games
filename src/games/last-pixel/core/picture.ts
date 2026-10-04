// Pixel art drawn in code, one value per cell (Plan/10-last-pixel.md §9: chunky pixels, no image files).
// Colours are packed the way ImageData stores them (RGBA bytes, little-endian), so a picture goes onto a
// canvas with one putImageData, and every colour can be checked in a test.
import { GLYPH_W, glyphBits } from "@/engine/pixel-font";
import type { Rng } from "@/engine/rng";

/** RGBA packed as 0xAABBGGRR (ImageData's byte order on every browser that matters). */
export type Colour = number;

export const rgb = (r: number, g: number, b: number): Colour => ((255 << 24) | (clampByte(b) << 16) | (clampByte(g) << 8) | clampByte(r)) >>> 0;

export function hex(code: string): Colour {
  const n = Number.parseInt(code.replace("#", ""), 16);
  return rgb((n >> 16) & 255, (n >> 8) & 255, n & 255);
}

function clampByte(v: number) {
  return v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
}

export const red = (c: Colour) => c & 255;
export const green = (c: Colour) => (c >>> 8) & 255;
export const blue = (c: Colour) => (c >>> 16) & 255;

/** Perceived brightness, 0–255. */
export const luma = (c: Colour) => 0.2126 * red(c) + 0.7152 * green(c) + 0.0722 * blue(c);

export const mix = (a: Colour, b: Colour, t: number): Colour => rgb(red(a) + (red(b) - red(a)) * t, green(a) + (green(b) - green(a)) * t, blue(a) + (blue(b) - blue(a)) * t);

/** Brightness times k (1.1 is 10% brighter). */
export const shade = (c: Colour, k: number): Colour => rgb(red(c) * k, green(c) * k, blue(c) * k);

export const WHITE = rgb(255, 255, 255);
export const BLACK = rgb(0, 0, 0);
export const lighten = (c: Colour, t: number) => mix(c, WHITE, t);
export const darken = (c: Colour, t: number) => mix(c, BLACK, t);

export const css = (c: Colour) => `rgb(${red(c)} ${green(c)} ${blue(c)})`;

/** A small, fast hash of a cell (and a salt) to 0–1: texture that's the same every time. */
export function hash01(x: number, y: number, salt = 0): number {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(salt | 0, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export class Picture {
  readonly data: Uint32Array;

  constructor(
    readonly w: number,
    readonly h: number,
    fill: Colour = WHITE,
  ) {
    this.data = new Uint32Array(w * h).fill(fill);
  }

  copy(): Picture {
    const p = new Picture(this.w, this.h);
    p.data.set(this.data);
    return p;
  }

  get(x: number, y: number): Colour {
    return this.data[clampInt(y, this.h) * this.w + clampInt(x, this.w)]!;
  }

  set(x: number, y: number, c: Colour) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.data[y * this.w + x] = c;
  }

  rect(x: number, y: number, w: number, h: number, c: Colour | ((x: number, y: number) => Colour)) {
    const x0 = Math.max(0, Math.round(x));
    const y0 = Math.max(0, Math.round(y));
    const x1 = Math.min(this.w, Math.round(x + w));
    const y1 = Math.min(this.h, Math.round(y + h));
    for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) this.data[yy * this.w + xx] = typeof c === "number" ? c : c(xx, yy);
  }

  /** A filled ellipse (a circle when ry is left out), centred on (cx, cy). */
  ellipse(cx: number, cy: number, rx: number, ry: number, c: Colour | ((x: number, y: number) => Colour)) {
    const x0 = Math.max(0, Math.floor(cx - rx));
    const x1 = Math.min(this.w - 1, Math.ceil(cx + rx));
    const y0 = Math.max(0, Math.floor(cy - ry));
    const y1 = Math.min(this.h - 1, Math.ceil(cy + ry));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.data[y * this.w + x] = typeof c === "number" ? c : c(x, y);
      }
    }
  }

  circle(cx: number, cy: number, r: number, c: Colour | ((x: number, y: number) => Colour)) {
    this.ellipse(cx, cy, r, r, c);
  }

  /** A line `width` cells thick. */
  line(x0: number, y0: number, x1: number, y1: number, c: Colour, width = 1) {
    const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
    for (let i = 0; i <= steps; i++) {
      const x = x0 + ((x1 - x0) * i) / steps;
      const y = y0 + ((y1 - y0) * i) / steps;
      if (width <= 1) this.set(x, y, c);
      else this.circle(x, y, width / 2, c);
    }
  }

  /** A smooth path through points, `width` thick. */
  path(points: ReadonlyArray<readonly [number, number]>, c: Colour, width = 1) {
    for (let i = 1; i < points.length; i++) this.line(points[i - 1]![0], points[i - 1]![1], points[i]![0], points[i]![1], c, width);
  }

  /** Top to bottom, from one colour to another (in `steps` bands: chunky pixel-art gradients). */
  vgradient(top: Colour, bottom: Colour, y0 = 0, y1 = this.h, steps = 0) {
    for (let y = Math.max(0, y0); y < Math.min(this.h, y1); y++) {
      let t = (y - y0) / Math.max(1, y1 - y0 - 1);
      if (steps > 1) t = Math.floor(t * steps) / (steps - 1);
      const c = mix(top, bottom, Math.min(1, t));
      this.data.fill(c, y * this.w, y * this.w + this.w);
    }
  }

  /** Each cell's colour through `fn` (inside a box, or everywhere). */
  map(fn: (c: Colour, x: number, y: number) => Colour, x0 = 0, y0 = 0, w = this.w, h = this.h) {
    for (let y = Math.max(0, y0); y < Math.min(this.h, y0 + h); y++) {
      for (let x = Math.max(0, x0); x < Math.min(this.w, x0 + w); x++) {
        const i = y * this.w + x;
        this.data[i] = fn(this.data[i]!, x, y);
      }
    }
  }

  /** A little brightness grain (±amount), the same every time for the same salt. */
  grain(amount: number, salt: number, x0 = 0, y0 = 0, w = this.w, h = this.h) {
    this.map((c, x, y) => shade(c, 1 + (hash01(x, y, salt) * 2 - 1) * amount), x0, y0, w, h);
  }

  /** Words in the arcade's 3 × 5 pixel font, top-left at (x, y). */
  text(words: string, x: number, y: number, c: Colour, scale = 1) {
    let cx = Math.round(x);
    for (const ch of words) {
      const bits = glyphBits(ch);
      for (let i = 0; i < 15; i++) if (bits[i] === "1") this.rect(cx + (i % 3) * scale, Math.round(y) + Math.floor(i / 3) * scale, scale, scale, c);
      cx += (GLYPH_W + 1) * scale;
    }
  }

  /** Scattered dots (stars, specks, flowers): each cell has `chance` of getting one. */
  speckle(rng: Rng, chance: number, colour: Colour | ((x: number, y: number) => Colour), x0 = 0, y0 = 0, w = this.w, h = this.h, keep?: (x: number, y: number) => boolean) {
    for (let y = Math.max(0, y0); y < Math.min(this.h, y0 + h); y++) {
      for (let x = Math.max(0, x0); x < Math.min(this.w, x0 + w); x++) {
        if (rng() < chance && (!keep || keep(x, y))) this.data[y * this.w + x] = typeof colour === "number" ? colour : colour(x, y);
      }
    }
  }
}

function clampInt(v: number, n: number) {
  v = Math.floor(v);
  return v < 0 ? 0 : v >= n ? n - 1 : v;
}
