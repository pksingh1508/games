// The levels' pictures (Plan/10-last-pixel.md §9): soft, colourful, satisfying, and chunky (128 × 72 cells).
// Each scene is a finished picture, an unfinished one, and which cells are the job. Decor (windows, doors,
// furniture, flower beds) is drawn on its own layer, stamped onto both pictures, and isn't part of the job.
//
//   room      paint a wall (roller), or its trim (brush)     window    wipe the grime off the glass (sponge)
//   lawn      mow it (mower); at night, fireflies             driveway  shovel the snow off it
//   patio     pressure-wash it                               card      scratch the panels off a lottery card
//   screen    a computer's screen: erase the doodles, or wipe the smudges
import { createRng, type Rng } from "@/engine/rng";
import { GRID_H, GRID_W } from "../core/constants";
import type { Scene, Task } from "../core/level";
import { darken, hash01, hex, lighten, luma, mix, Picture, shade, type Colour } from "../core/picture";

const W = GRID_W;
const H = GRID_H;

/** A scene being drawn: both pictures, a decor layer (0 = nothing there), and the job. */
class Builder {
  readonly after = new Picture(W, H);
  readonly before = new Picture(W, H);
  readonly deco = new Picture(W, H, 0);
  readonly region = new Uint8Array(W * H);
  readonly tasks: Task[] = [];
  readonly rng: Rng;

  constructor(seed: string) {
    this.rng = createRng(seed);
  }

  private index(task: Task) {
    let k = this.tasks.indexOf(task);
    if (k < 0) {
      this.tasks.push(task);
      k = this.tasks.length - 1;
    }
    return k + 1;
  }

  /** Mark cells as `task` where `keep` says so (inside the box). */
  job(task: Task, x: number, y: number, w: number, h: number, keep: (x: number, y: number) => boolean = () => true) {
    const k = this.index(task);
    for (let yy = Math.max(0, y); yy < Math.min(H, y + h); yy++) for (let xx = Math.max(0, x); xx < Math.min(W, x + w); xx++) if (keep(xx, yy)) this.region[yy * W + xx] = k;
  }

  /** Paint the finished and unfinished looks over the cells of a task. */
  looks(task: Task, finished: (x: number, y: number) => Colour, unfinished: (x: number, y: number) => Colour) {
    const k = this.tasks.indexOf(task) + 1;
    for (let i = 0; i < W * H; i++) {
      if (this.region[i] !== k) continue;
      const x = i % W;
      const y = (i - x) / W;
      this.after.data[i] = finished(x, y);
      this.before.data[i] = unfinished(x, y);
    }
  }

  /** Draw on both pictures (shading that's the same done or not, like a tree's shadow). */
  both(fn: (p: Picture) => void) {
    fn(this.after);
    fn(this.before);
  }

  build(extra: Partial<Scene> = {}): Scene {
    for (let i = 0; i < W * H; i++) {
      const d = this.deco.data[i]!;
      if (!d) continue;
      this.after.data[i] = d;
      this.before.data[i] = d;
      this.region[i] = 0;
    }
    // Cells left outside the job show the finished picture in both.
    for (let i = 0; i < W * H; i++) if (!this.region[i]) this.before.data[i] = this.after.data[i]!;
    return { w: W, h: H, before: this.before, after: this.after, region: this.region, tasks: this.tasks, ...extra };
  }
}

// -- Shared bits -------------------------------------------------------------------------------------

const INK = hex("#3B3355");
const CREAM = hex("#FDF6EC");
const TRIM = hex("#F7F2E9");
const TRIM_SHADE = hex("#DCD3C3");

export const PAINTS = {
  lavender: hex("#B7ABFF"),
  mint: hex("#A9E5CB"),
  peach: hex("#FFC6A3"),
  sky: hex("#A3D4FF"),
  butter: hex("#FFE49A"),
  rose: hex("#F6A9C6"),
  sage: hex("#B9D0A6"),
  magnolia: hex("#F3E9D8"),
  teal: hex("#7CC9C1"),
  coral: hex("#FF9E7D"),
} as const;
export type PaintName = keyof typeof PAINTS;

/** A sky, top to bottom. */
function sky(p: Picture, x: number, y: number, w: number, h: number, top: Colour, bottom: Colour) {
  for (let yy = y; yy < y + h; yy++) {
    const c = mix(top, bottom, Math.min(1, Math.floor(((yy - y) / Math.max(1, h - 1)) * 6) / 5));
    p.rect(x, yy, w, 1, c);
  }
}

/** Rolling hills: a wavy horizon filled downwards. */
function hills(p: Picture, x: number, y: number, w: number, h: number, base: number, amp: number, freq: number, phase: number, colour: Colour, shadeTop = 0.08) {
  for (let xx = x; xx < x + w; xx++) {
    const top = Math.round(y + base + Math.sin(xx * freq + phase) * amp + Math.sin(xx * freq * 2.3 + phase * 1.7) * amp * 0.4);
    for (let yy = Math.max(y, top); yy < y + h; yy++) p.set(xx, yy, yy === top ? lighten(colour, shadeTop) : colour);
  }
}

function cloud(p: Picture, cx: number, cy: number, s: number, c = hex("#FFFFFF")) {
  p.ellipse(cx, cy, 4 * s, 1.8 * s, c);
  p.ellipse(cx - 2.2 * s, cy + 0.3 * s, 2.4 * s, 1.5 * s, c);
  p.ellipse(cx + 1.5 * s, cy - 1 * s, 2.6 * s, 1.8 * s, c);
}

function tree(p: Picture, x: number, groundY: number, size: number, leaf: Colour) {
  p.rect(x - 0.5, groundY - size * 1.2, 1.4, size * 1.2, hex("#7A5236"));
  p.circle(x + 0.2, groundY - size * 1.6, size, leaf);
  p.circle(x - size * 0.35, groundY - size * 1.75, size * 0.55, lighten(leaf, 0.15));
}

function house(p: Picture, x: number, groundY: number, w: number, wall: Colour, roof: Colour) {
  const h = Math.round(w * 0.7);
  p.rect(x, groundY - h, w, h, wall);
  for (let k = 0; k < Math.ceil(w / 2) + 1; k++) p.rect(x - 1 + k, groundY - h - k, w + 2 - k * 2, 1, roof);
  p.rect(x + Math.floor(w / 2) - 1, groundY - 3, 2, 3, darken(roof, 0.3));
  p.rect(x + 1, groundY - h + 2, 2, 2, hex("#FFE9A6"));
  if (w > 7) p.rect(x + w - 3, groundY - h + 2, 2, 2, hex("#FFE9A6"));
}

/** The view out of a window (or a wallpaper): a little landscape. */
export type View = "hills" | "city" | "sea" | "snow" | "night" | "meadow";

function view(p: Picture, rng: Rng, kind: View, x: number, y: number, w: number, h: number) {
  const g = (frac: number) => y + Math.round(h * frac);
  switch (kind) {
    case "hills":
      sky(p, x, y, w, h, hex("#8FCBFF"), hex("#DDF2FF"));
      p.circle(x + w * 0.78, g(0.2), Math.max(2, h * 0.09), hex("#FFE27A"));
      cloud(p, x + w * 0.25, g(0.18), Math.max(1, h / 30));
      cloud(p, x + w * 0.55, g(0.3), Math.max(0.8, h / 40));
      hills(p, x, y, w, h, h * 0.55, h * 0.06, 0.08, 1, hex("#9CCB86"));
      hills(p, x, y, w, h, h * 0.7, h * 0.05, 0.11, 3, hex("#7DB86A"));
      house(p, Math.round(x + w * 0.62), g(0.82), Math.max(5, Math.round(w * 0.1)), hex("#FFF3E2"), hex("#E2725B"));
      tree(p, x + w * 0.3, g(0.84), Math.max(2, h * 0.07), hex("#4E9A4A"));
      tree(p, x + w * 0.42, g(0.86), Math.max(1.6, h * 0.05), hex("#5DAA55"));
      break;
    case "meadow":
      sky(p, x, y, w, h, hex("#FFD9A8"), hex("#FFF1D6"));
      p.circle(x + w * 0.3, g(0.32), Math.max(2, h * 0.1), hex("#FF9E7D"));
      hills(p, x, y, w, h, h * 0.6, h * 0.04, 0.06, 2, hex("#C8D88A"));
      hills(p, x, y, w, h, h * 0.74, h * 0.04, 0.09, 5, hex("#A9C66E"));
      p.speckle(rng, 0.08, (xx, yy) => (hash01(xx, yy, 7) > 0.5 ? hex("#FFFFFF") : hex("#F6A9C6")), x, g(0.78), w, Math.ceil(h * 0.22));
      break;
    case "city":
      sky(p, x, y, w, h, hex("#8E7DFF"), hex("#FFB27D"));
      p.circle(x + w * 0.5, g(0.62), Math.max(2, h * 0.14), hex("#FFD08A"));
      for (let bx = x; bx < x + w; ) {
        const bw = 4 + Math.floor(rng() * 7);
        const bh = Math.round(h * (0.25 + rng() * 0.45));
        const c = mix(hex("#3B3355"), hex("#5A4C8A"), rng());
        p.rect(bx, y + h - bh, bw, bh, c);
        for (let wy = y + h - bh + 2; wy < y + h - 1; wy += 3) for (let wx = bx + 1; wx < bx + bw - 1; wx += 2) if (rng() < 0.45) p.set(wx, wy, hex("#FFE08A"));
        bx += bw + (rng() < 0.3 ? 1 : 0);
      }
      break;
    case "sea":
      sky(p, x, y, w, h, hex("#7EC8FF"), hex("#E5F6FF"));
      cloud(p, x + w * 0.7, g(0.18), Math.max(1, h / 32));
      p.rect(x, g(0.55), w, h - Math.round(h * 0.55), hex("#3D9BD6"));
      for (let yy = g(0.58); yy < y + h; yy += 2) for (let xx = x; xx < x + w; xx++) if (hash01(xx, yy, 3) < 0.18) p.set(xx, yy, hex("#8FD0F5"));
      p.rect(x, g(0.85), w, h - Math.round(h * 0.85), hex("#F2DDA4"));
      // A sailboat.
      const bx = x + w * 0.35;
      for (let k = 0; k < 5; k++) p.rect(bx - k * 0.6, g(0.53) - 5 + k, 1 + k * 0.6, 1, hex("#FFFFFF"));
      p.rect(bx - 3, g(0.53), 7, 1.5, hex("#E2725B"));
      break;
    case "snow":
      sky(p, x, y, w, h, hex("#C9DDF2"), hex("#F2F7FD"));
      hills(p, x, y, w, h, h * 0.55, h * 0.05, 0.07, 1, hex("#FFFFFF"));
      hills(p, x, y, w, h, h * 0.72, h * 0.04, 0.1, 4, hex("#EAF2FB"));
      for (let k = 0; k < 6; k++) {
        const tx = x + w * (0.1 + k * 0.16);
        const ty = g(0.8);
        for (let r = 0; r < 5; r++) p.rect(tx - r * 0.6, ty - 6 + r, 1 + r * 1.2, 1, hex("#2E6B4E"));
      }
      p.speckle(rng, 0.03, hex("#FFFFFF"), x, y, w, Math.round(h * 0.6));
      break;
    case "night":
      sky(p, x, y, w, h, hex("#141B3D"), hex("#3B3F7A"));
      p.speckle(rng, 0.025, (xx, yy) => (hash01(xx, yy, 11) > 0.7 ? hex("#FFFFFF") : hex("#B9C3FF")), x, y, w, Math.round(h * 0.6));
      p.circle(x + w * 0.8, g(0.2), Math.max(2, h * 0.08), hex("#FFF4CF"));
      hills(p, x, y, w, h, h * 0.68, h * 0.04, 0.08, 2, hex("#232A52"));
      for (let k = 0; k < 4; k++) house(p, Math.round(x + w * (0.12 + k * 0.22)), y + h, 6 + (k % 2) * 2, hex("#2E355F"), hex("#1F2546"));
      break;
  }
}

// -- Room walls (roller, brush) ----------------------------------------------------------------------

export interface RoomOptions {
  seed: string;
  paint: PaintName;
  /** What's on the wall to start with. */
  old?: "plaster" | "wallpaper" | "primer";
  /** A pattern painted in (the reward). */
  mural?: "plain" | "stripes" | "dots" | "sunset" | "waves" | "logo";
  /** A window (its panes a wiping job of their own if it's dirty). */
  window?: { x: number; y: number; w: number; h: number; view: View; dirty?: boolean } | null;
  door?: { x: number } | null;
  frames?: Array<{ x: number; y: number; w: number; h: number }>;
  sofa?: { x: number; w: number; colour?: string } | null;
  plant?: { x: number } | null;
  lamp?: { x: number } | null;
  /** The job is the trim (skirting board, door and window frames), not the wall: the brush. */
  trim?: boolean;
  /** A shelf with things on it (more edges to paint round). */
  shelf?: { x: number; y: number; w: number } | null;
}

function oldWall(kind: RoomOptions["old"], rng: Rng, salt: number) {
  const blotches: Array<[number, number, number, number, number]> = [];
  for (let k = 0; k < 14; k++) blotches.push([rng() * W, rng() * H, 3 + rng() * 9, 2 + rng() * 5, rng() < 0.5 ? 0.93 : 1.05]);
  const cracks = new Set<number>();
  for (let k = 0; k < 4; k++) {
    let x = rng() * W;
    let y = rng() * H * 0.8;
    for (let s = 0; s < 18; s++) {
      cracks.add(Math.floor(y) * W + Math.floor(x));
      x += rng() * 2 - 1;
      y += 0.7 + rng() * 0.6;
    }
  }
  return (x: number, y: number) => {
    let c = kind === "wallpaper" ? (Math.floor(x / 4) % 2 ? hex("#CDBFA6") : hex("#D6CAB4")) : kind === "primer" ? hex("#ECE7DE") : hex("#D2C9BA");
    if (kind === "wallpaper" && hash01(Math.floor(x / 4), Math.floor(y / 6), salt) < 0.08) c = hex("#E2D8C6");
    for (const [bx, by, rx, ry, k] of blotches) {
      const dx = (x - bx) / rx;
      const dy = (y - by) / ry;
      if (dx * dx + dy * dy < 1) c = shade(c, k);
    }
    if (cracks.has(y * W + x)) c = shade(c, 0.8);
    return shade(c, 1 + (hash01(x, y, salt) - 0.5) * 0.07);
  };
}

function muralAt(kind: RoomOptions["mural"], base: Colour, salt: number) {
  return (x: number, y: number): Colour => {
    let c = base;
    switch (kind) {
      case "stripes":
        if (Math.floor(x / 8) % 2) c = shade(base, 0.94);
        break;
      case "dots": {
        const cx = (x % 10) - 5 + (Math.floor(y / 10) % 2) * 5;
        const cy = (y % 10) - 5;
        if (Math.hypot(cx > 5 ? cx - 10 : cx, cy) < 1.8) c = lighten(base, 0.35);
        break;
      }
      case "sunset": {
        c = mix(lighten(base, 0.25), base, Math.min(1, y / 50));
        if (Math.hypot(x - 64, y - 40) < 13) c = mix(c, hex("#FFE49A"), 0.55);
        const top = 46 + Math.sin(x * 0.07) * 3 + Math.sin(x * 0.19) * 1.5;
        if (y > top) c = shade(base, 0.86);
        break;
      }
      case "waves":
        if (Math.floor((y + Math.sin(x * 0.2) * 2.5) / 7) % 2) c = shade(base, 0.93);
        break;
      case "logo":
        c = mix(lighten(base, 0.3), base, Math.min(1, y / 56));
        if (LOGO.has(y * W + x)) c = INK;
        break;
      default:
        break;
    }
    // A roller's faint texture: barely there (it's where a camouflaged Pix hides).
    return shade(c, 1 + (hash01(x, y, salt) - 0.5) * 0.008);
  };
}

/** "LAST PIXEL" in big letters, for the finale's mural, with the i's dot missing (Pix has it). */
const LOGO = (() => {
  const cells = new Set<number>();
  const p = new Picture(W, H, 0);
  p.text("LAST P XEL", 5, 22, 1, 3);
  // The dotless i: just its stem.
  p.rect(5 + 6 * 12 + 3, 28, 3, 9, 1);
  for (let i = 0; i < W * H; i++) if (p.data[i]) cells.add(i);
  return cells;
})();

/** Where the mural's missing dot goes (the finale's last cell). */
export const LOGO_DOT = { x: 5 + 6 * 12 + 4, y: 23 };

export function room(o: RoomOptions): Scene {
  const b = new Builder(o.seed);
  const rng = b.rng;
  const paint = PAINTS[o.paint];
  const wallTop = 2;
  const skirt = 59;
  const floor = 62;
  const old = oldWall(o.old ?? "plaster", rng, 4);
  const fresh = muralAt(o.mural ?? "plain", paint, 9);
  if (o.trim) {
    // The wall's done already; the trim is the job.
    b.both((p) => p.rect(0, wallTop, W, skirt - wallTop, (x, y) => fresh(x, y)));
  } else {
    b.job("paint", 0, wallTop, W, skirt - wallTop);
    b.looks("paint", fresh, old);
  }
  // The ceiling's edge.
  b.deco.rect(0, 0, W, 2, TRIM);
  b.deco.rect(0, 1, W, 1, TRIM_SHADE);
  // The floor: planks.
  b.deco.rect(0, floor, W, H - floor, (x, y) => {
    const band = Math.floor((y - floor) / 3);
    const seam = (x + band * 11) % 23 === 0;
    const tone = [hex("#C99A6B"), hex("#BD8D5F"), hex("#D2A576")][band % 3]!;
    return seam ? hex("#8E6A47") : shade(tone, 1 + (hash01(x >> 1, y, 3) - 0.5) * 0.08);
  });
  b.deco.rect(0, floor, W, 1, hex("#9C7350"));
  const trimTasks: Array<[number, number, number, number]> = [];
  // The skirting board.
  if (o.trim) trimTasks.push([0, skirt, W, 3]);
  else {
    b.deco.rect(0, skirt, W, 3, TRIM);
    b.deco.rect(0, skirt, W, 1, hex("#FFFFFF"));
    b.deco.rect(0, skirt + 2, W, 1, TRIM_SHADE);
  }
  if (o.window) {
    const { x, y, w, h } = o.window;
    if (o.window.dirty) {
      // The panes are a job of their own: grime to wipe off the view.
      const pane = new Picture(W, H);
      view(pane, rng, o.window.view, x + 2, y + 2, w - 4, h - 4);
      b.job("wipe", x + 2, y + 2, w - 4, h - 4);
      b.looks(
        "wipe",
        (xx, yy) => pane.get(xx, yy),
        (xx, yy) => {
          let c = mix(pane.get(xx, yy), hex("#8C7B5A"), 0.6);
          if (hash01(xx >> 1, yy >> 1, 47) < 0.2) c = shade(c, 0.88);
          return shade(c, 1 + (hash01(xx, yy, 48) - 0.5) * 0.06);
        },
      );
    } else view(b.deco, rng, o.window.view, x + 2, y + 2, w - 4, h - 4);
    if (o.trim) trimTasks.push([x, y, w, 2], [x, y + h - 2, w, 2], [x, y, 2, h], [x + w - 2, y, 2, h], [x + Math.floor(w / 2) - 1, y, 2, h]);
    else {
      b.deco.rect(x, y, w, 2, TRIM);
      b.deco.rect(x, y + h - 2, w, 2, TRIM);
      b.deco.rect(x, y, 2, h, TRIM);
      b.deco.rect(x + w - 2, y, 2, h, TRIM);
      b.deco.rect(x + Math.floor(w / 2) - 1, y, 2, h, TRIM);
    }
    b.deco.rect(x - 2, y + h, w + 4, 2, TRIM_SHADE);
    b.deco.rect(x - 2, y + h, w + 4, 1, TRIM);
  }
  if (o.door) {
    const x = o.door.x;
    const dw = 20;
    const top = 14;
    b.deco.rect(x + 2, top + 2, dw - 4, skirt - top - 2 + 3, hex("#B5835A"));
    for (const [px, py, pw, ph] of [
      [x + 5, top + 6, dw - 10, 14],
      [x + 5, top + 25, dw - 10, 18],
    ] as const) {
      b.deco.rect(px, py, pw, ph, hex("#A2744E"));
      b.deco.rect(px, py, pw, 1, hex("#8C6240"));
      b.deco.rect(px, py + ph - 1, pw, 1, hex("#C4936A"));
    }
    b.deco.rect(x + dw - 6, top + 26, 2, 2, hex("#F2C94C"));
    if (o.trim) trimTasks.push([x, top, 2, skirt - top + 3], [x + dw - 2, top, 2, skirt - top + 3], [x, top, dw, 2]);
    else {
      b.deco.rect(x, top, 2, skirt - top + 3, TRIM);
      b.deco.rect(x + dw - 2, top, 2, skirt - top + 3, TRIM);
      b.deco.rect(x, top, dw, 2, TRIM);
    }
  }
  if (o.trim) {
    // Trim: chipped and greying before; glossy white after.
    for (const [x, y, w, h] of trimTasks) b.job("paint", x, y, w, h);
    b.looks(
      "paint",
      (x, y) => (hash01(x, y, 21) < 0.12 ? hex("#FFFFFF") : TRIM),
      (x, y) => {
        const chip = hash01(x >> 1, y, 5) < 0.18;
        return chip ? hex("#B9AE9C") : shade(hex("#D8CFBF"), 1 + (hash01(x, y, 6) - 0.5) * 0.08);
      },
    );
  }
  for (const f of o.frames ?? []) {
    b.deco.rect(f.x, f.y, f.w, f.h, hex("#C9A15A"));
    b.deco.rect(f.x + 1, f.y + 1, f.w - 2, f.h - 2, hex("#F4E6C8"));
    view(b.deco, rng, (["hills", "sea", "meadow", "city"] as const)[Math.floor(rng() * 4)]!, f.x + 2, f.y + 2, f.w - 4, f.h - 4);
  }
  if (o.shelf) {
    const { x, y, w } = o.shelf;
    b.deco.rect(x, y, w, 2, hex("#B5835A"));
    b.deco.rect(x, y + 2, w, 1, hex("#8C6240"));
    for (let k = 0, bx = x + 2; bx < x + w - 3; k++) {
      const bw = 2 + (k % 3);
      const bh = 5 + ((k * 7) % 4);
      b.deco.rect(bx, y - bh, bw, bh, [hex("#6F5BF2"), hex("#FF9E7D"), hex("#7CC9C1"), hex("#FFE49A")][k % 4]!);
      bx += bw + (k % 4 === 3 ? 4 : 1);
    }
  }
  if (o.plant) {
    const x = o.plant.x;
    for (let k = 0; k < 9; k++) b.deco.rect(x - 4 + k * 0.25, 52 + k, 9 - k * 0.5, 1, hex("#D9774B"));
    b.deco.rect(x - 5, 51, 11, 2, hex("#C2653F"));
    for (const [dx, dy, r, c] of [
      [0, 44, 5, "#4C8C48"],
      [-4, 47, 3.5, "#5FA35A"],
      [4, 46, 3.8, "#5FA35A"],
      [-2, 40, 3.2, "#6DB866"],
      [2, 41, 3, "#4C8C48"],
    ] as const) {
      b.deco.ellipse(x + dx, dy, r, r * 0.8, hex(c));
    }
  }
  if (o.lamp) {
    const x = o.lamp.x;
    b.deco.rect(x, 26, 1, skirt - 26 + 3, hex("#3B3355"));
    b.deco.rect(x - 3, skirt + 1, 7, 2, hex("#3B3355"));
    for (let k = 0; k < 8; k++) b.deco.rect(x - 2 - k * 0.5, 18 + k, 5 + k, 1, k === 7 ? hex("#F1B85B") : hex("#FFD38A"));
  }
  if (o.sofa) {
    const { x, w } = o.sofa;
    const body = hex(o.sofa.colour ?? "#6F5BF2");
    b.deco.ellipse(x + 3, 50, 4, 8, darken(body, 0.15));
    b.deco.ellipse(x + w - 3, 50, 4, 8, darken(body, 0.15));
    b.deco.rect(x + 2, 40, w - 4, 12, body);
    b.deco.rect(x + 2, 40, w - 4, 1, lighten(body, 0.2));
    b.deco.rect(x + 1, 50, w - 2, 9, darken(body, 0.08));
    b.deco.rect(x + 1, 50, w - 2, 1, lighten(body, 0.12));
    const cushions = Math.max(2, Math.round(w / 14));
    for (let k = 0; k < cushions; k++) {
      const cx = x + 5 + ((w - 10) * (k + 0.5)) / cushions;
      b.deco.ellipse(cx, 45, 4.5, 3.6, lighten(body, 0.25));
    }
    b.deco.rect(x + 3, 59, 2, 3, hex("#3B3355"));
    b.deco.rect(x + w - 5, 59, 2, 3, hex("#3B3355"));
  }
  return b.build();
}

// -- Windows (sponge) --------------------------------------------------------------------------------

export interface WindowOptions {
  seed: string;
  view: View;
  /** Panes across and down. */
  panes: [number, number];
  /** The wall colour round the window. */
  wall?: PaintName;
  /** How dirty (0–1). */
  grime?: number;
}

export function windowWipe(o: WindowOptions): Scene {
  const b = new Builder(o.seed);
  const rng = b.rng;
  const wall = PAINTS[o.wall ?? "magnolia"];
  // The view, everywhere (the frame's drawn over it).
  view(b.after, rng, o.view, 0, 0, W, H);
  b.before.data.set(b.after.data);
  const fx = 6;
  const fy = 3;
  const fw = W - 12;
  const fh = H - 10;
  const [across, down] = o.panes;
  b.job("wipe", fx, fy, fw, fh);
  // Grime: the view, dulled and smeared.
  const smears: Array<[number, number, number, number, number]> = [];
  for (let k = 0; k < 26; k++) smears.push([rng() * W, rng() * H, 2 + rng() * 8, 1.5 + rng() * 4, rng()]);
  const grime = o.grime ?? 0.62;
  const view0 = b.after.copy();
  b.looks(
    "wipe",
    (x, y) => view0.get(x, y),
    (x, y) => {
      let c = mix(view0.get(x, y), hex("#8C7B5A"), grime);
      for (const [sx, sy, rx, ry, k] of smears) {
        const dx = (x - sx) / rx;
        const dy = (y - sy) / ry;
        if (dx * dx + dy * dy < 1) c = k < 0.5 ? shade(c, 0.86) : mix(c, hex("#BFB59C"), 0.35);
      }
      // Streaks where the rain ran down.
      if (hash01(x, 0, 41) < 0.12 && hash01(x, y >> 2, 42) < 0.6) c = shade(c, 0.92);
      if (hash01(x, y, 43) < 0.012) c = hex("#F1EEE6");
      return shade(c, 1 + (hash01(x, y, 44) - 0.5) * 0.05);
    },
  );
  // The wall round it, the frame, the bars between panes, the sill.
  b.deco.rect(0, 0, W, fy, wall);
  b.deco.rect(0, 0, fx, H, wall);
  b.deco.rect(W - fx, 0, fx, H, wall);
  b.deco.rect(0, fy + fh, W, H - fy - fh, wall);
  const frame = (x: number, y: number, w: number, h: number) => {
    b.deco.rect(x, y, w, h, TRIM);
    b.deco.rect(x, y + h - 1, w, 1, TRIM_SHADE);
  };
  frame(fx - 2, fy - 2, fw + 4, 2);
  frame(fx - 2, fy + fh, fw + 4, 2);
  frame(fx - 2, fy - 2, 2, fh + 4);
  frame(fx + fw, fy - 2, 2, fh + 4);
  for (let k = 1; k < across; k++) frame(Math.round(fx + (fw * k) / across) - 1, fy, 2, fh);
  for (let k = 1; k < down; k++) frame(fx, Math.round(fy + (fh * k) / down) - 1, fw, 2);
  b.deco.rect(fx - 5, fy + fh + 2, fw + 10, 3, hex("#E8DFCF"));
  b.deco.rect(fx - 5, fy + fh + 2, fw + 10, 1, hex("#FFFFFF"));
  b.deco.rect(fx - 5, fy + fh + 4, fw + 10, 1, hex("#C9BEA9"));
  // A little pot plant on the sill.
  const px = W - 22;
  b.deco.rect(px - 3, fy + fh - 2, 7, 4, hex("#D9774B"));
  b.deco.ellipse(px + 0.5, fy + fh - 4, 4, 3, hex("#5FA35A"));
  b.deco.ellipse(px - 1.5, fy + fh - 6, 2, 2, hex("#6DB866"));
  return b.build();
}

// -- Lawns (mower) -----------------------------------------------------------------------------------

export interface LawnOptions {
  seed: string;
  beds?: Array<{ x: number; y: number; w: number; h: number }>;
  trees?: Array<{ x: number; y: number; r: number }>;
  pond?: { x: number; y: number; rx: number; ry: number } | null;
  path?: Array<[number, number]>;
  night?: boolean;
  gnome?: { x: number; y: number } | null;
  /** A patio in the garden: a washing job of its own. */
  patio?: { x: number; y: number; w: number; h: number } | null;
}

export function lawn(o: LawnOptions): Scene {
  const b = new Builder(o.seed);
  const night = (c: Colour) => (o.night ? mix(shade(c, 0.55), hex("#22306A"), 0.3) : c);
  b.job("mow", 0, 0, W, H);
  b.looks(
    "mow",
    (x, y) => night(shade(hex("#7CC45C"), 1 + (hash01(x, y, 8) - 0.5) * 0.03)),
    (x, y) => {
      // Long grass: blades, tufts, a few yellow tips.
      const blade = hash01(x, y >> 1, 9);
      let c = blade < 0.33 ? hex("#3F7E33") : blade < 0.75 ? hex("#4E9140") : hex("#5FA64B");
      if (hash01(x, y, 10) < 0.04) c = hex("#B6C35A");
      return night(c);
    },
  );
  if (o.patio) {
    const { x, y, w, h } = o.patio;
    const k = (b.tasks.includes("wash") ? b.tasks.indexOf("wash") : b.tasks.length) + 1;
    b.job("wash", x, y, w, h);
    void k;
    const tile = (xx: number, yy: number) => {
      const grout = (xx - x) % 7 === 0 || (yy - y) % 7 === 0;
      return grout ? hex("#E9E1D3") : shade(hex("#C9BFAE"), 1 + (hash01(Math.floor((xx - x) / 7), Math.floor((yy - y) / 7), 57) - 0.5) * 0.12);
    };
    b.looks("wash", tile, (xx, yy) => shade(mix(tile(xx, yy), hex("#4D4931"), 0.55), 1 + (hash01(xx, yy, 58) - 0.5) * 0.08));
  }
  // The fence along the top.
  b.deco.rect(0, 0, W, 5, night(hex("#C79B6B")));
  for (let x = 0; x < W; x += 6) b.deco.rect(x, 0, 1, 5, night(hex("#9C7350")));
  b.deco.rect(0, 4, W, 1, night(hex("#8C6542")));
  for (const tr of o.trees ?? []) {
    // Its shadow on the grass (done or not), then the canopy.
    b.both((p) => p.map((c, x, y) => (Math.hypot(x - tr.x - 3, (y - tr.y - 3) * 1.3) < tr.r ? shade(c, 0.82) : c)));
    b.deco.circle(tr.x, tr.y, tr.r, night(hex("#3E7D3A")));
    b.deco.circle(tr.x - tr.r * 0.3, tr.y - tr.r * 0.3, tr.r * 0.6, night(hex("#4F9447")));
    b.deco.circle(tr.x - tr.r * 0.45, tr.y - tr.r * 0.45, tr.r * 0.25, night(hex("#67AE5C")));
  }
  for (const bed of o.beds ?? []) {
    b.deco.rect(bed.x, bed.y, bed.w, bed.h, night(hex("#6B4A33")));
    b.deco.rect(bed.x, bed.y, bed.w, 1, night(hex("#7C5A40")));
    for (let y = bed.y + 1; y < bed.y + bed.h - 1; y++) {
      for (let x = bed.x + 1; x < bed.x + bed.w - 1; x++) {
        const r = hash01(x, y, 12);
        if (r < 0.16) b.deco.set(x, y, night([hex("#F6A9C6"), hex("#FFE49A"), hex("#FFFFFF"), hex("#B7ABFF")][Math.floor(r * 25) % 4]!));
        else if (r < 0.4) b.deco.set(x, y, night(hex("#4F9447")));
      }
    }
  }
  if (o.pond) {
    const { x, y, rx, ry } = o.pond;
    b.deco.ellipse(x, y, rx + 1, ry + 1, night(hex("#A69C8C")));
    b.deco.ellipse(x, y, rx, ry, night(hex("#4DA3D9")));
    b.deco.ellipse(x - rx * 0.3, y - ry * 0.3, rx * 0.5, ry * 0.3, night(hex("#7FC3EC")));
    for (const [dx, dy] of [
      [0.3, 0.2],
      [-0.4, 0.35],
      [0.1, -0.4],
    ] as const) {
      b.deco.circle(x + dx * rx, y + dy * ry, 1.6, night(hex("#5FA35A")));
    }
  }
  for (const [x, y] of o.path ?? []) {
    b.deco.ellipse(x, y, 3.2, 2.2, night(hex("#BDB6AA")));
    b.deco.ellipse(x - 0.6, y - 0.6, 2, 1.2, night(hex("#D2CCC2")));
  }
  if (o.gnome) {
    const { x, y } = o.gnome;
    for (let k = 0; k < 4; k++) b.deco.rect(x - k * 0.5, y - 6 + k, 1 + k, 1, night(hex("#E63946")));
    b.deco.rect(x - 1, y - 2, 3, 2, night(hex("#FFD7B5")));
    b.deco.rect(x - 1.5, y, 4, 3, night(hex("#3D7DD8")));
    b.deco.rect(x - 1, y - 1, 3, 1, night(hex("#FFFFFF")));
  }
  // Mown the other way: a darker stripe (shadows and all).
  const scene = b.build({ night: o.night, glow: o.night ? hex("#E9FF8A") : undefined });
  const after2 = scene.after.copy();
  const mow = scene.tasks.indexOf("mow") + 1;
  after2.map((c, x, y) => (scene.region[y * W + x] === mow ? shade(c, 0.88) : c));
  return { ...scene, after2 };
}

// -- Driveways (shovel) ------------------------------------------------------------------------------

export interface DriveOptions {
  seed: string;
  /** The drive runs up the canvas (from the garage at the top) or across it. */
  dir: "down" | "across";
  /** Its width (cells). */
  width: number;
  snowman?: boolean;
  car?: boolean;
}

export function driveway(o: DriveOptions): Scene {
  const b = new Builder(o.seed);
  const rng = b.rng;
  // Snowy lawns everywhere.
  b.after.map((_, x, y) => shade(hex("#F4F8FF"), 1 - hash01(x >> 2, y >> 2, 31) * 0.05));
  b.before.data.set(b.after.data);
  const paver = (x: number, y: number) => {
    // Herringbone-ish pavers, wet from the snow.
    const bx = Math.floor((x + (Math.floor(y / 3) % 2) * 3) / 6);
    const by = Math.floor(y / 3);
    const grout = (x + (Math.floor(y / 3) % 2) * 3) % 6 === 0 || y % 3 === 0;
    const tone = [hex("#A79F96"), hex("#9A9189"), hex("#B3ABA1")][Math.floor(hash01(bx, by, 32) * 3)]!;
    return grout ? hex("#7C756E") : shade(tone, 1 + (hash01(x, y, 33) - 0.5) * 0.05);
  };
  const snow = (x: number, y: number) => {
    let c = hex("#FBFDFF");
    const drift = Math.sin(x * 0.21 + y * 0.07) + Math.sin(y * 0.31 - x * 0.05);
    if (drift > 1.2) c = hex("#E6EEF9");
    if (hash01(x, y, 34) < 0.03) c = hex("#DCE6F4");
    return c;
  };
  const [dx, dy, dw, dh] = o.dir === "down" ? [Math.round(W / 2 - o.width / 2), 9, o.width, H - 9] : [14, Math.round(H / 2 - o.width / 2), W - 14, o.width];
  b.job("shovel", dx, dy, dw, dh);
  b.looks("shovel", paver, snow);
  // The garage (top, or left).
  if (o.dir === "down") {
    b.deco.rect(dx - 6, 0, dw + 12, 9, hex("#E2725B"));
    b.deco.rect(dx - 6, 0, dw + 12, 2, hex("#FFFFFF"));
    b.deco.rect(dx - 2, 3, dw + 4, 6, hex("#D8D2C8"));
    for (let y = 4; y < 9; y += 2) b.deco.rect(dx - 2, y, dw + 4, 1, hex("#C2BBAF"));
  } else {
    b.deco.rect(0, dy - 6, 14, dh + 12, hex("#E2725B"));
    b.deco.rect(0, dy - 6, 3, dh + 12, hex("#FFFFFF"));
    b.deco.rect(6, dy - 2, 8, dh + 4, hex("#D8D2C8"));
    for (let x = 7; x < 14; x += 2) b.deco.rect(x, dy - 2, 1, dh + 4, hex("#C2BBAF"));
  }
  // Snowy bushes and a mailbox.
  const side = o.dir === "down" ? [[10, 20], [14, 50], [W - 12, 30], [W - 16, 60]] : [[30, 8], [70, 6], [100, H - 8], [50, H - 6]];
  for (const [x, y] of side) {
    b.deco.ellipse(x!, y!, 5, 3.5, hex("#3E7D3A"));
    b.deco.ellipse(x!, y! - 1.5, 4.5, 2, hex("#FFFFFF"));
  }
  if (o.snowman) {
    const [x, y] = o.dir === "down" ? [W - 22, 52] : [96, 10];
    b.deco.circle(x, y, 5, hex("#FFFFFF"));
    b.deco.circle(x, y - 7, 3.5, hex("#FFFFFF"));
    b.deco.rect(x - 1, y - 8, 1, 1, INK);
    b.deco.rect(x + 1, y - 8, 1, 1, INK);
    b.deco.rect(x, y - 7, 2, 1, hex("#FF8A3D"));
    b.deco.rect(x - 4, y - 4, 9, 1.5, hex("#E63946"));
    b.deco.rect(x - 2, y - 12, 5, 2, INK);
  }
  if (o.car) {
    const [x, y] = o.dir === "down" ? [W / 2, 22] : [32, H / 2];
    b.deco.rect(x - 7, y - 4, 14, 10, hex("#6F5BF2"));
    b.deco.rect(x - 5, y - 2, 10, 5, hex("#A9D6F5"));
    b.deco.rect(x - 7, y - 5, 14, 2, hex("#FFFFFF"));
  }
  void rng;
  return b.build({ glow: hex("#FFD38A") });
}

// -- Patios (pressure washer) ------------------------------------------------------------------------

export interface PatioOptions {
  seed: string;
  tile: "terracotta" | "slate" | "checker" | "stone";
  parasol?: { x: number; y: number; r: number; colours: [string, string] } | null;
  pots?: Array<[number, number]>;
  table?: { x: number; y: number } | null;
}

export function patio(o: PatioOptions): Scene {
  const b = new Builder(o.seed);
  // Lawn round the edges.
  b.after.map((_, x, y) => shade(hex("#79C35A"), 1 + (hash01(x, y, 51) - 0.5) * 0.06));
  b.before.data.set(b.after.data);
  const [px, py, pw, ph] = [6, 4, W - 12, H - 8];
  b.job("wash", px, py, pw, ph);
  const size = o.tile === "stone" ? 9 : 8;
  const tile = (x: number, y: number): Colour => {
    const row = Math.floor((y - py) / size);
    const off = o.tile === "stone" ? (row % 2) * 4 : 0;
    const tx = Math.floor((x - px + off) / size);
    const grout = (x - px + off) % size === 0 || (y - py) % size === 0;
    if (grout) return hex("#E9E1D3");
    const base =
      o.tile === "terracotta" ? hex("#D9774B") : o.tile === "slate" ? hex("#6E7F92") : o.tile === "checker" ? ((tx + row) % 2 ? hex("#F3E9D8") : hex("#B9D0A6")) : hex("#C9BFAE");
    let c = shade(base, 1 + (hash01(tx, row, 52) - 0.5) * 0.12);
    // A wet sheen on each tile's top corner.
    const lx = (x - px + off) % size;
    const ly = (y - py) % size;
    if (lx === 1 && ly <= 2) c = lighten(c, 0.25);
    if (ly === 1 && lx <= 2) c = lighten(c, 0.25);
    return c;
  };
  b.looks("wash", tile, (x, y) => {
    let c = mix(tile(x, y), hex("#4D4931"), 0.58);
    const moss = Math.sin(x * 0.17) + Math.sin(y * 0.23 + x * 0.05);
    if (moss > 1.1 && hash01(x, y, 53) < 0.7) c = mix(c, hex("#5E7A3A"), 0.6);
    if (hash01(x >> 1, y >> 3, 54) < 0.05) c = shade(c, 0.75);
    return shade(c, 1 + (hash01(x, y, 55) - 0.5) * 0.08);
  });
  for (const [x, y] of o.pots ?? []) {
    b.deco.circle(x, y, 4, hex("#C2653F"));
    b.deco.circle(x, y, 3, hex("#5FA35A"));
    b.deco.circle(x - 1, y - 1, 1.5, hex("#F6A9C6"));
  }
  if (o.table) {
    const { x, y } = o.table;
    b.deco.circle(x - 9, y, 3, hex("#FFFFFF"));
    b.deco.circle(x + 9, y, 3, hex("#FFFFFF"));
    b.deco.circle(x, y, 6, hex("#F7F2E9"));
    b.deco.circle(x, y, 5, hex("#FFFFFF"));
  }
  if (o.parasol) {
    const { x, y, r, colours } = o.parasol;
    for (let yy = Math.floor(y - r); yy <= y + r; yy++) {
      for (let xx = Math.floor(x - r); xx <= x + r; xx++) {
        const d = Math.hypot(xx + 0.5 - x, yy + 0.5 - y);
        if (d > r) continue;
        const a = Math.atan2(yy + 0.5 - y, xx + 0.5 - x);
        const seg = Math.floor(((a + Math.PI) / (Math.PI * 2)) * 8) % 2;
        b.deco.set(xx, yy, shade(hex(colours[seg]!), d > r - 1 ? 0.85 : 1));
      }
    }
    b.deco.circle(x, y, 1, hex("#FFFFFF"));
  }
  return b.build();
}

// -- Lottery cards (scratch coin) --------------------------------------------------------------------

export type Prize = "cherries" | "star" | "pix" | "seven" | "clover" | "heart" | "diamond";

function prize(p: Picture, kind: Prize, cx: number, cy: number, s: number) {
  switch (kind) {
    case "cherries":
      p.line(cx - 2 * s, cy + s, cx + s * 0.5, cy - 3 * s, hex("#4C8C48"), Math.max(1, s * 0.6));
      p.line(cx + 2.5 * s, cy + s, cx + s * 0.5, cy - 3 * s, hex("#4C8C48"), Math.max(1, s * 0.6));
      p.circle(cx - 2 * s, cy + 2 * s, 2.2 * s, hex("#E63946"));
      p.circle(cx + 2.5 * s, cy + 2 * s, 2.2 * s, hex("#E63946"));
      p.circle(cx - 2.6 * s, cy + 1.4 * s, 0.7 * s, hex("#FFB3B8"));
      break;
    case "star":
      for (let yy = -5; yy <= 5; yy++) {
        for (let xx = -5; xx <= 5; xx++) {
          const a = Math.atan2(yy, xx);
          const r = Math.hypot(xx, yy);
          const edge = 3 + 2 * Math.cos(5 * (a + Math.PI / 2)) ** 2;
          if (r <= edge * 0.95) p.rect(cx + xx * s * 0.8, cy + yy * s * 0.8, Math.ceil(s * 0.8), Math.ceil(s * 0.8), hex("#FFD23F"));
        }
      }
      break;
    case "pix":
      p.rect(cx - 3 * s, cy - 3 * s, 6 * s, 6 * s, hex("#FFF4D6"));
      p.rect(cx - 3 * s, cy - 3 * s, 6 * s, 1, INK);
      p.rect(cx - 3 * s, cy + 3 * s - 1, 6 * s, 1, INK);
      p.rect(cx - 3 * s, cy - 3 * s, 1, 6 * s, INK);
      p.rect(cx + 3 * s - 1, cy - 3 * s, 1, 6 * s, INK);
      p.rect(cx - 1.6 * s, cy - s, s, 1.5 * s, INK);
      p.rect(cx + 0.6 * s, cy - s, s, 1.5 * s, INK);
      break;
    case "seven":
      p.text("7", cx - 1.5 * s * 1.3, cy - 2.5 * s * 1.3, hex("#E63946"), Math.max(1, Math.round(s * 1.3)));
      break;
    case "clover":
      for (const [dx, dy] of [
        [-1.4, -1.4],
        [1.4, -1.4],
        [-1.4, 1.4],
        [1.4, 1.4],
      ] as const) {
        p.circle(cx + dx * s, cy + dy * s, 1.9 * s, hex("#4C9A4A"));
      }
      p.line(cx, cy, cx + s, cy + 4 * s, hex("#3E7D3A"), Math.max(1, s * 0.5));
      break;
    case "heart":
      p.circle(cx - 1.6 * s, cy - s, 2 * s, hex("#F6A9C6"));
      p.circle(cx + 1.6 * s, cy - s, 2 * s, hex("#F6A9C6"));
      for (let k = 0; k < 4 * s; k++) p.rect(cx - 3.5 * s + k * 0.85, cy - s + k, 7 * s - k * 1.7, 1, hex("#F6A9C6"));
      break;
    case "diamond":
      for (let k = 0; k < 4 * s; k++) {
        p.rect(cx - k, cy - 4 * s + k, k * 2 + 1, 1, hex("#7FD4F5"));
        p.rect(cx - k, cy + 4 * s - k, k * 2 + 1, 1, hex("#5BB8E0"));
      }
      break;
  }
}

export interface CardOptions {
  seed: string;
  prizes: Prize[];
  /** Panels: one row of three, or two rows. */
  rows?: 1 | 2;
  theme?: [string, string];
}

export function card(o: CardOptions): Scene {
  const b = new Builder(o.seed);
  const [c0, c1] = (o.theme ?? ["#8E7DFF", "#FF9E7D"]).map(hex) as [Colour, Colour];
  b.after.map((_, x, y) => {
    const t = (x / W) * 0.6 + (y / H) * 0.4;
    let c = mix(c0, c1, Math.min(1, Math.floor(t * 8) / 7));
    if ((x + y) % 9 === 0 && hash01(x, y, 61) < 0.5) c = lighten(c, 0.15);
    return c;
  });
  b.before.data.set(b.after.data);
  // Border, title, sparkles.
  b.deco.rect(0, 0, W, 2, CREAM);
  b.deco.rect(0, H - 2, W, 2, CREAM);
  b.deco.rect(0, 0, 2, H, CREAM);
  b.deco.rect(W - 2, 0, 2, H, CREAM);
  const title = "LUCKY PIXEL";
  const tw = title.length * 8 - 2;
  b.deco.text(title, Math.round(W / 2 - tw / 2) + 1, 5, darken(c0, 0.45), 2);
  b.deco.text(title, Math.round(W / 2 - tw / 2), 4, CREAM, 2);
  b.deco.text("MATCH 3 TO WIN", Math.round(W / 2 - (14 * 4 - 1) / 2), H - 9, CREAM);
  for (const [x, y] of [
    [8, 8],
    [118, 9],
    [10, 60],
    [117, 58],
  ] as const) {
    b.deco.rect(x, y - 2, 1, 5, hex("#FFE49A"));
    b.deco.rect(x - 2, y, 5, 1, hex("#FFE49A"));
  }
  const rows = o.rows ?? 1;
  const panels: Array<[number, number, number, number]> = [];
  if (rows === 1) for (let k = 0; k < 3; k++) panels.push([10 + k * 38, 18, 32, 38]);
  else for (let r = 0; r < 2; r++) for (let k = 0; k < 3; k++) panels.push([12 + k * 36, 17 + r * 23, 32, 20]);
  for (const [x, y, w, h] of panels) {
    b.deco.rect(x - 1, y - 1, w + 2, 1, CREAM);
    b.deco.rect(x - 1, y + h, w + 2, 1, CREAM);
    b.deco.rect(x - 1, y, 1, h, CREAM);
    b.deco.rect(x + w, y, 1, h, CREAM);
    b.job("scratch", x, y, w, h);
  }
  const prizes = b.after.copy();
  panels.forEach(([x, y, w, h], k) => {
    prizes.rect(x, y, w, h, hex("#FFF8EA"));
    prize(prizes, o.prizes[k % o.prizes.length]!, x + w / 2, y + h / 2, h > 30 ? 3 : 2);
  });
  b.looks(
    "scratch",
    (x, y) => prizes.get(x, y),
    (x, y) => {
      // Silver foil with a diagonal shine and little "$" coins pressed in.
      let c = mix(hex("#CDD2DA"), hex("#A9B0BB"), ((x + y) % 14) / 14);
      if ((x - y + 300) % 14 < 2) c = lighten(c, 0.35);
      if (hash01(x >> 2, y >> 2, 62) < 0.05) c = shade(c, 0.9);
      return c;
    },
  );
  return b.build({ glow: hex("#FFF4D6") });
}

// -- A computer's screen (eraser, sponge) ------------------------------------------------------------

export interface ScreenOptions {
  seed: string;
  wallpaper: View;
  /** Doodles to erase (the eraser) or smudges to wipe (the sponge). */
  mess: "doodles" | "smudges" | "both";
  /** How much mess (0–1). */
  amount?: number;
}

function desktop(p: Picture, rng: Rng, wallpaper: View) {
  view(p, rng, wallpaper, 0, 0, W, H - 6);
  // Icons down the left.
  const icons: Array<[Colour, Colour]> = [
    [hex("#FFD23F"), hex("#E8B10F")],
    [hex("#DDE3EA"), hex("#9AA5B1")],
    [hex("#8E7DFF"), hex("#6F5BF2")],
    [hex("#7CC9C1"), hex("#4FA59C")],
  ];
  icons.forEach(([a, c], k) => {
    const y = 4 + k * 13;
    p.rect(4, y, 9, 7, a);
    p.rect(4, y, 9, 1, lighten(a, 0.3));
    p.rect(4, y + 6, 9, 1, c);
    p.rect(3, y + 9, 11, 2, hex("#FFFFFF"));
  });
  // The taskbar.
  p.rect(0, H - 6, W, 6, hex("#2B2D42"));
  p.rect(0, H - 6, W, 1, hex("#4A4D6B"));
  // The start button: a little four-colour logo.
  p.rect(2, H - 5, 4, 4, hex("#6F5BF2"));
  p.rect(2, H - 5, 2, 2, hex("#FF9E7D"));
  p.rect(4, H - 3, 2, 2, hex("#FFD23F"));
  p.rect(4, H - 5, 2, 2, hex("#7CC9C1"));
  p.text("12:00", W - 22, H - 5, hex("#DDE3EA"));
}

export function screen(o: ScreenOptions): Scene {
  const b = new Builder(o.seed);
  const rng = b.rng;
  desktop(b.after, rng, o.wallpaper);
  b.before.data.set(b.after.data);
  const amount = o.amount ?? 0.5;
  const top = W * (H - 6);
  const doodles = new Map<number, Colour>();
  const smudges = new Map<number, Colour>();
  if (o.mess !== "smudges") {
    const pens = [hex("#E63946"), hex("#1D3557"), hex("#2A9D8F"), hex("#F4A261"), hex("#8E44AD")];
    const scribble = (x: number, y: number, n: number, pen: Colour) => {
      let a = rng() * Math.PI * 2;
      for (let s = 0; s < n; s++) {
        for (const [dx, dy] of [
          [0, 0],
          [1, 0],
          [0, 1],
        ] as const) {
          doodles.set(Math.floor(y + dy) * W + Math.floor(x + dx), pen);
        }
        a += (rng() - 0.5) * 1.4;
        x = Math.max(16, Math.min(W - 3, x + Math.cos(a) * 1.2));
        y = Math.max(2, Math.min(H - 9, y + Math.sin(a) * 1.2));
      }
    };
    const count = Math.round(4 + amount * 8);
    for (let k = 0; k < count; k++) scribble(18 + rng() * (W - 24), 4 + rng() * (H - 16), 30 + Math.floor(rng() * 50), pens[k % pens.length]!);
    // A big smiley.
    const sx = 40 + rng() * 50;
    const sy = 18 + rng() * 20;
    for (let a = 0; a < Math.PI * 2; a += 0.06) doodles.set(Math.floor(sy + Math.sin(a) * 8) * W + Math.floor(sx + Math.cos(a) * 8), pens[0]!);
    doodles.set(Math.floor(sy - 2) * W + Math.floor(sx - 3), pens[0]!);
    doodles.set(Math.floor(sy - 2) * W + Math.floor(sx + 3), pens[0]!);
    for (let a = 0.4; a < Math.PI - 0.4; a += 0.1) doodles.set(Math.floor(sy + 1 + Math.sin(a) * 4) * W + Math.floor(sx + Math.cos(a) * 4), pens[0]!);
  }
  if (o.mess !== "doodles") {
    // Fingerprints: whorls of grease, and a few long smears.
    const prints = Math.round(8 + amount * 14);
    for (let k = 0; k < prints; k++) {
      const cx = 16 + rng() * (W - 22);
      const cy = 4 + rng() * (H - 16);
      const rx = 3 + rng() * 2.5;
      const ry = rx * 1.3;
      for (let y = Math.floor(cy - ry); y <= cy + ry; y++) {
        for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
          const d = Math.hypot((x - cx) / rx, (y - cy) / ry);
          if (d > 1 || x < 0 || y < 0 || x >= W || y >= H - 6) continue;
          smudges.set(y * W + x, Math.floor(d * 6) % 2 === 0 ? hex("#FFFFFF") : hex("#D9D2BF"));
        }
      }
    }
    for (let k = 0; k < 4; k++) {
      let x = 16 + rng() * (W - 30);
      const y0 = 4 + rng() * (H - 20);
      for (let s = 0; s < 24; s++) {
        for (let t = 0; t < 4; t++) smudges.set(Math.floor(y0 + t + s * 0.3) * W + Math.floor(x), hex("#E7E1D0"));
        x += 1;
      }
    }
  }
  // The mess is the job: smudges to wipe, doodles (drawn over them) to erase.
  const mark = (marks: Map<number, Colour>, task: Task, look: (i: number, c: Colour) => Colour) => {
    if (!marks.size) return;
    b.job(task, 0, 0, 0, 0);
    const k = b.tasks.indexOf(task) + 1;
    for (const [i, c] of marks) {
      if (i < 0 || i >= top) continue;
      b.region[i] = k;
      b.before.data[i] = look(i, c);
    }
  };
  mark(smudges, "wipe", (i, c) => mix(b.after.data[i]!, c, 0.55));
  mark(doodles, "erase", (_, c) => c);
  return b.build();
}

/** A quick look at a scene's brightness spread (tests: camouflage needs calm backgrounds). */
export function brightness(scene: Scene, i: number): number {
  return luma(scene.after.data[i]!);
}
