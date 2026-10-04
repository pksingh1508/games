// Drawing a level (Plan/10-last-pixel.md §9, §12): the cells on a tiny offscreen canvas (one pixel each),
// scaled up with no smoothing, so they stay chunky. Only cells that changed are re-coloured (the coverage
// grid keeps a box of them): there's never a getImageData, only putImageData of what changed. Over that:
// the missed spots' sparkles near the end, your tool, the particles, Pix (and its decoys), the net, the
// bait, the magnifier's lens, the detector's ring, and an arrow at the edge when Pix has left the canvas.
import { blit, pixelSprite } from "@/engine/sprites";
import { BLINK_TICKS, FULL } from "../core/constants";
import { clamp, type Rect, type Vec } from "../core/geometry";
import type { HuntToolId } from "../core/level";
import { cellColour, PIX_GLOW, pixColour } from "../core/look";
import { blue, css, green, red, type Colour } from "../core/picture";
import { TOOLS } from "../core/tools";
import type { World } from "../core/world";
import { ARROW, NET, PAL, PIX_FACE, TOOL_SPRITES, type ToolSprite } from "./sprites";

export interface Frame {
  world: World;
  /** Your pointer right now (cells; off the canvas is fine), or null. */
  pointer: Vec | null;
  down: boolean;
  /** A finger: no hover, so the cursor's only drawn while it's down. */
  touch: boolean;
  huntTool: HuntToolId;
  /** A net being drawn (cells). */
  net: Rect | null;
  lens: { on: boolean; zoom: number };
  /** Seconds (for animations). */
  time: number;
  reduceMotion: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  colour: string;
  size: number;
  gravity: number;
}

export type Spray = "paint" | "suds" | "grass" | "snow" | "water" | "crumbs" | "dust" | "pop" | "sparkle";

/** The lens (cells on screen, as a radius). */
export const LENS_R = 11;

const INK = "#3B3355";

export class Renderer {
  private readonly g: CanvasRenderingContext2D;
  private grid: HTMLCanvasElement | null = null;
  private gridCtx: CanvasRenderingContext2D | null = null;
  private img: ImageData | null = null;
  private px: Uint32Array | null = null;
  private lensCanvas: HTMLCanvasElement | null = null;
  private world: World | null = null;
  private cssW = 0;
  private cssH = 0;
  private dpr = 1;
  private particles: Particle[] = [];
  private glints: number[] = [];
  private glintAt = -1;
  private lensAt: Vec | null = null;
  /** The celebration's glow (1 → 0). */
  private flash = 0;

  /** Baloo's real family name (a canvas font can't use a CSS variable). */
  private readonly family: string;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.g = canvas.getContext("2d")!;
    const baloo = getComputedStyle(canvas).getPropertyValue("--font-g-baloo").trim();
    this.family = baloo ? `${baloo}, system-ui, sans-serif` : "system-ui, sans-serif";
  }

  /** A new level (or a fresh start of it): every cell gets coloured again. */
  attach(world: World) {
    this.world = world;
    if (!this.grid || this.grid.width !== world.w || this.grid.height !== world.h) {
      this.grid = document.createElement("canvas");
      this.grid.width = world.w;
      this.grid.height = world.h;
      this.gridCtx = this.grid.getContext("2d")!;
      this.img = this.gridCtx.createImageData(world.w, world.h);
      this.px = new Uint32Array(this.img.data.buffer);
    }
    world.cov.touchAll();
    this.particles = [];
    this.glints = [];
    this.flash = 0;
  }

  resize(cssW: number, cssH: number, dpr: number) {
    this.cssW = cssW;
    this.cssH = cssH;
    this.dpr = dpr;
  }

  celebrate() {
    this.flash = 1;
  }

  /** Particles, where a tool's working or something happened (cells). */
  spray(kind: Spray, at: Vec, n = 3) {
    if (this.particles.length > 400) return;
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2;
      const s = Math.random();
      const p: Particle = { x: at.x, y: at.y, vx: Math.cos(a) * s * 8, vy: Math.sin(a) * s * 8, life: 0, max: 0.5 + Math.random() * 0.4, colour: "#FFFFFF", size: 0.5, gravity: 0 };
      switch (kind) {
        case "paint":
          p.colour = css(this.world?.scene.after.get(at.x, at.y) ?? 0xffffffff);
          p.gravity = 30;
          break;
        case "suds":
          p.colour = "#FFFFFF";
          p.size = 0.6 + Math.random() * 0.6;
          p.vy -= 3;
          break;
        case "grass":
          p.colour = Math.random() < 0.5 ? "#4E9140" : "#7CC45C";
          p.vx *= 2;
          p.vy *= 2;
          p.gravity = 20;
          break;
        case "snow":
          p.colour = "#FFFFFF";
          p.size = 0.7;
          p.gravity = 10;
          break;
        case "water":
          p.colour = "#9FD8F5";
          p.vx *= 2.5;
          p.vy *= 2.5;
          p.size = 0.35;
          break;
        case "crumbs":
          p.colour = "#F6A9C6";
          p.gravity = 40;
          break;
        case "dust":
          p.colour = "#C9CED6";
          p.gravity = 25;
          break;
        case "pop":
          p.colour = Math.random() < 0.5 ? "#FFF4D6" : "#FFD23F";
          p.vx *= 3;
          p.vy *= 3;
          p.size = 0.6;
          break;
        case "sparkle":
          p.colour = Math.random() < 0.5 ? "#FFE49A" : "#FFFFFF";
          p.vx *= 1.5;
          p.vy *= 1.5;
          p.max = 0.9;
          p.size = 0.5;
          break;
      }
      this.particles.push(p);
    }
  }

  draw(f: Frame) {
    const w = f.world;
    if (w !== this.world) this.attach(w);
    const canvas = this.canvas;
    const bw = Math.max(1, Math.round(this.cssW * this.dpr));
    const bh = Math.max(1, Math.round(this.cssH * this.dpr));
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    const g = this.g;
    const cell = bw / w.w;
    this.updateGrid(w);
    g.imageSmoothingEnabled = false;
    g.drawImage(this.grid!, 0, 0, bw, bh);
    if (w.scene.night) this.fireflies(f, cell);
    if ((w.phase === "clean" || w.phase === "finish") && w.progress >= 0.985) this.missedSpots(f, cell);
    this.tool(f, cell);
    this.updateParticles(f, cell);
    if (w.bait) this.baitAt(f, w.bait, cell);
    this.pix(f, cell);
    if (f.net) this.netRect(f.net, cell);
    if (f.lens.on && f.pointer && !(f.touch && !f.down)) this.lens(f, cell);
    else this.lensAt = null;
    this.cursor(f, cell);
    this.edgeArrow(f, cell);
    if (this.flash > 0) {
      g.fillStyle = `rgba(255,255,255,${(this.flash * 0.55).toFixed(3)})`;
      g.fillRect(0, 0, bw, bh);
      this.flash = Math.max(0, this.flash - 1 / 50);
    }
  }

  // -- The cells ---------------------------------------------------------------------------------

  private updateGrid(w: World) {
    const box = w.cov.takeDirty();
    if (!box || !this.px || !this.img) return;
    const { amount, variant } = w.cov;
    for (let y = box.y0; y <= box.y1; y++) {
      for (let x = box.x0; x <= box.x1; x++) {
        const i = y * w.w + x;
        this.px[i] = cellColour(w.scene, amount, variant, i);
      }
    }
    this.gridCtx!.putImageData(this.img, 0, 0, box.x0, box.y0, box.x1 - box.x0 + 1, box.y1 - box.y0 + 1);
  }

  /** Near the end of a clean-up, the cells you missed sparkle (so the last few aren't a hunt of their own). */
  private missedSpots(f: Frame, cell: number) {
    const w = f.world;
    if (f.time - this.glintAt > 0.4) {
      this.glintAt = f.time;
      this.glints = w.cov.remaining().slice(0, 300);
    }
    const g = this.g;
    for (const i of this.glints) {
      if (w.cov.amount[i]! >= FULL) continue;
      const x = (i % w.w) + 0.5;
      const y = Math.floor(i / w.w) + 0.5;
      const pulse = 0.45 + 0.35 * Math.sin(f.time * 5 + i);
      g.fillStyle = `rgba(255,255,255,${pulse.toFixed(3)})`;
      const s = Math.max(1, cell * 0.25);
      g.fillRect(x * cell - s / 2, y * cell - cell * 0.6, s, cell * 1.2);
      g.fillRect(x * cell - cell * 0.6, y * cell - s / 2, cell * 1.2, s);
    }
  }

  private fireflies(f: Frame, cell: number) {
    const g = this.g;
    const w = f.world;
    for (let k = 0; k < 26; k++) {
      const t = f.time * (0.25 + (k % 5) * 0.04) + k * 1.7;
      const x = ((Math.sin(t * 0.9 + k) * 0.5 + 0.5) * (w.w - 4) + 2) * cell;
      const y = ((Math.cos(t * 0.7 + k * 2.3) * 0.5 + 0.5) * (w.h - 8) + 4) * cell;
      const on = Math.sin(f.time * (1.3 + (k % 7) * 0.37) + k * 4.1);
      if (on < 0.2) continue;
      g.fillStyle = `rgba(233,255,138,${(0.2 + on * 0.5).toFixed(3)})`;
      g.beginPath();
      g.arc(x, y, cell * 1.4, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#F4FFB8";
      g.fillRect(Math.floor(x / cell) * cell, Math.floor(y / cell) * cell, cell, cell);
    }
  }

  // -- Your tool ---------------------------------------------------------------------------------

  private sprite(s: ToolSprite, at: Vec, cell: number, key: string) {
    const img = pixelSprite(s.rows, PAL, { key: `lp:${key}` });
    const scale = Math.max(2, Math.round(3 * this.dpr));
    const g = this.g;
    g.save();
    g.imageSmoothingEnabled = false;
    g.translate(Math.round(at.x * cell - s.hot[0] * scale), Math.round(at.y * cell - s.hot[1] * scale));
    g.scale(scale, scale);
    blit(g, img, 0, 0);
    g.restore();
  }

  private tool(f: Frame, cell: number) {
    const w = f.world;
    const g = this.g;
    const t = w.painter.tool;
    if (t.kind === "mower") this.mower(f, cell);
    const hunting = w.phase === "hunt" || w.phase === "wake" || w.phase === "escaped";
    if (hunting || w.phase === "done" || !f.pointer || (f.touch && !f.down)) return;
    if (t.kind === "shovel") {
      this.shovel(f, cell);
      return;
    }
    if (t.kind === "mower") return;
    // The footprint, faintly, so you know what you'll cover.
    g.strokeStyle = "rgba(59,51,85,0.45)";
    g.lineWidth = Math.max(1, this.dpr);
    g.beginPath();
    g.arc(f.pointer.x * cell, f.pointer.y * cell, t.radius * cell, 0, Math.PI * 2);
    g.stroke();
    if (t.id === "washer" && f.down) {
      g.fillStyle = "rgba(159,216,245,0.35)";
      g.beginPath();
      g.arc(f.pointer.x * cell, f.pointer.y * cell, t.radius * cell, 0, Math.PI * 2);
      g.fill();
    }
    this.sprite(TOOL_SPRITES[t.id as keyof typeof TOOL_SPRITES], f.pointer, cell, t.id);
  }

  private mower(f: Frame, cell: number) {
    const m = f.world.painter.mower;
    const g = this.g;
    const half = TOOLS.mower.radius;
    g.save();
    g.translate(m.x * cell, m.y * cell);
    g.rotate(m.heading);
    // Wheels, body, engine, handle (behind it).
    g.fillStyle = INK;
    for (const [x, y] of [
      [1.6, -half - 0.4],
      [1.6, half - 0.6],
      [-2.4, -half - 0.4],
      [-2.4, half - 0.6],
    ] as const) {
      g.fillRect(x * cell, y * cell, 1.6 * cell, cell);
    }
    g.fillStyle = "#E63946";
    g.fillRect(-2.6 * cell, -half * cell, 5 * cell, half * 2 * cell);
    g.fillStyle = "#FF6B6B";
    g.fillRect(-2.6 * cell, -half * cell, 5 * cell, cell * 0.7);
    g.fillStyle = INK;
    g.fillRect(-1 * cell, -1.2 * cell, 2.4 * cell, 2.4 * cell);
    g.fillStyle = "#9AA5B1";
    g.fillRect(-0.6 * cell, -0.8 * cell, 1.6 * cell, 1.6 * cell);
    g.strokeStyle = INK;
    g.lineWidth = Math.max(2, cell * 0.5);
    g.beginPath();
    g.moveTo(-2.6 * cell, -half * 0.6 * cell);
    g.lineTo(-6 * cell, -half * 0.5 * cell);
    g.lineTo(-6 * cell, half * 0.5 * cell);
    g.lineTo(-2.6 * cell, half * 0.6 * cell);
    g.stroke();
    g.restore();
  }

  private shovel(f: Frame, cell: number) {
    const w = f.world;
    const p = f.pointer!;
    const b = w.painter.blade;
    const n = Math.hypot(b.x, b.y) || 1;
    const ang = Math.atan2(b.y / n, b.x / n);
    const half = TOOLS.shovel.radius;
    const g = this.g;
    g.save();
    g.translate(p.x * cell, p.y * cell);
    g.rotate(ang);
    // The load, heaped in front of the blade.
    const load = w.painter.load;
    if (load > 1) {
      const r = Math.min(half, 1 + Math.sqrt(load) * 0.35);
      g.fillStyle = "#FFFFFF";
      g.beginPath();
      g.ellipse((0.6 + r * 0.5) * cell, 0, r * 0.6 * cell, Math.min(half, r * 1.1) * cell, 0, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "rgba(160,180,210,0.8)";
      g.lineWidth = Math.max(1, this.dpr);
      g.stroke();
    }
    g.fillStyle = "#9AA5B1";
    g.fillRect(-0.4 * cell, -half * cell, 0.9 * cell, half * 2 * cell);
    g.fillStyle = INK;
    g.fillRect(-0.4 * cell, -half * cell, 0.25 * cell, half * 2 * cell);
    g.fillStyle = "#B5835A";
    g.fillRect(-7 * cell, -0.35 * cell, 6.6 * cell, 0.7 * cell);
    g.fillStyle = INK;
    g.fillRect(-7.6 * cell, -1 * cell, 0.8 * cell, 2 * cell);
    g.restore();
  }

  // -- Pix, and its decoys -----------------------------------------------------------------------

  private pix(f: Frame, cell: number) {
    const w = f.world;
    const p = w.pix;
    const g = this.g;
    const live = w.phase === "wake" || w.phase === "hunt" || w.phase === "escaped" || w.phase === "revenge" || (w.phase === "done" && this.flash > 0.4);
    if (!live) return;
    for (const d of w.decoys) {
      if (!d.alive) continue;
      this.dot(d, cell, w.scene.glow ?? PIX_GLOW, w.decoyBlinking(d), false, f);
    }
    if (p.mode === "burrow" || p.mode === "tab" || p.mode === "asleep") return;
    // In the page, and as a dead pixel, it's an element over the page (the runtime moves it).
    if (!w.onCanvas() || p.mode === "dom" || (p.mode === "dead" && p.arrived)) return;
    if (p.mode === "mimic") {
      this.sprite(ARROW, p, cell, "arrow");
      return;
    }
    const camo = !!w.def.camo && !p.gaveUp;
    const blink = (w.def.decoys ?? 0) > 0 && w.blinking();
    const pulse = p.tired && !f.reduceMotion ? 0.5 + 0.5 * Math.sin(f.time * 4) : 1;
    this.dot(p, cell, pixColour(w), blink, camo, f, pulse);
    if (w.frozen > 0) {
      g.strokeStyle = "#7FD4F5";
      g.lineWidth = Math.max(2, cell * 0.3);
      g.strokeRect(Math.floor(p.x) * cell - cell * 0.4, Math.floor(p.y) * cell - cell * 0.4, cell * 1.8, cell * 1.8);
    }
    // What it's saying.
    const say = w.phase === "wake" || p.mode === "stunned" ? "!" : p.gaveUp ? "fine." : w.phase === "escaped" ? "not yet!" : null;
    if (say) this.bubble(say, p, cell);
  }

  /** A pixel: its cell, a glow (unless it's hiding in plain sight), a blink. */
  private dot(at: Vec, cell: number, colour: Colour, blink: boolean, camo: boolean, f: Frame, pulse = 1) {
    const g = this.g;
    const x = Math.floor(at.x) * cell;
    const y = Math.floor(at.y) * cell;
    if (!camo) {
      const glow = g.createRadialGradient(x + cell / 2, y + cell / 2, 0, x + cell / 2, y + cell / 2, cell * 3.2);
      glow.addColorStop(0, `rgba(${red(colour)},${green(colour)},${blue(colour)},${(0.55 * pulse).toFixed(3)})`);
      glow.addColorStop(1, `rgba(${red(colour)},${green(colour)},${blue(colour)},0)`);
      g.fillStyle = glow;
      g.fillRect(x - cell * 3, y - cell * 3, cell * 7, cell * 7);
    }
    g.fillStyle = blink ? "#FFFFFF" : css(colour);
    g.fillRect(x, y, cell, cell);
    if (!camo) {
      g.strokeStyle = blink ? "#FFD23F" : "rgba(59,51,85,0.55)";
      g.lineWidth = Math.max(1, cell * 0.12);
      g.strokeRect(x, y, cell, cell);
    }
    void f;
  }

  private bubble(text: string, at: Vec, cell: number) {
    const g = this.g;
    const size = Math.max(17 * this.dpr, cell * 2.2);
    g.font = `800 ${Math.round(size)}px ${this.family}`;
    const tw = g.measureText(text).width;
    const x = clamp(at.x * cell, tw / 2 + 6, this.canvas.width - tw / 2 - 6);
    const y = Math.max(size + 6, at.y * cell - cell * 1.6);
    g.fillStyle = "#FFFFFF";
    g.strokeStyle = INK;
    g.lineWidth = Math.max(2, this.dpr * 2);
    const pad = size * 0.3;
    g.beginPath();
    g.roundRect(x - tw / 2 - pad, y - size - pad * 0.4, tw + pad * 2, size + pad * 0.8, pad);
    g.fill();
    g.stroke();
    g.fillStyle = INK;
    g.textAlign = "center";
    g.textBaseline = "alphabetic";
    g.fillText(text, x, y - pad * 0.1);
  }

  private baitAt(f: Frame, at: Vec, cell: number) {
    const g = this.g;
    const s = 1 + 0.4 * Math.sin(f.time * 12);
    g.fillStyle = "#FFE49A";
    g.fillRect((Math.floor(at.x) + 0.5 - 0.5 * s) * cell, Math.floor(at.y) * cell - cell, cell * s, cell * 3);
    g.fillRect(Math.floor(at.x) * cell - cell, (Math.floor(at.y) + 0.5 - 0.5 * s) * cell, cell * 3, cell * s);
    g.fillStyle = "#FFFFFF";
    g.fillRect(Math.floor(at.x) * cell, Math.floor(at.y) * cell, cell, cell);
  }

  private netRect(r: Rect, cell: number) {
    const g = this.g;
    g.fillStyle = "rgba(255,255,255,0.18)";
    g.fillRect(r.x * cell, r.y * cell, r.w * cell, r.h * cell);
    g.strokeStyle = "rgba(255,255,255,0.35)";
    g.lineWidth = Math.max(1, this.dpr);
    g.beginPath();
    const step = 1.5 * cell;
    for (let x = r.x * cell + step; x < (r.x + r.w) * cell; x += step) {
      g.moveTo(x, r.y * cell);
      g.lineTo(x, (r.y + r.h) * cell);
    }
    for (let y = r.y * cell + step; y < (r.y + r.h) * cell; y += step) {
      g.moveTo(r.x * cell, y);
      g.lineTo((r.x + r.w) * cell, y);
    }
    g.stroke();
    g.setLineDash([6 * this.dpr, 4 * this.dpr]);
    g.strokeStyle = INK;
    g.lineWidth = Math.max(2, this.dpr * 2);
    g.strokeRect(r.x * cell, r.y * cell, r.w * cell, r.h * cell);
    g.setLineDash([]);
  }

  // -- The magnifier -----------------------------------------------------------------------------

  /** A lens over the pointer: everything under it bigger, its contrast pushed right up, Pix's face showing. */
  private lens(f: Frame, cell: number) {
    const w = f.world;
    const target = f.pointer!;
    // A heavy lens: it trails your hand a little.
    this.lensAt = this.lensAt ? { x: this.lensAt.x + (target.x - this.lensAt.x) * 0.35, y: this.lensAt.y + (target.y - this.lensAt.y) * 0.35 } : { ...target };
    const at = this.lensAt;
    const zoom = f.lens.zoom;
    const R = LENS_R;
    const span = Math.ceil((R * 2) / zoom) + 2;
    const x0 = Math.floor(at.x - span / 2);
    const y0 = Math.floor(at.y - span / 2);
    if (!this.lensCanvas) this.lensCanvas = document.createElement("canvas");
    const lc = this.lensCanvas;
    if (lc.width !== span || lc.height !== span) {
      lc.width = span;
      lc.height = span;
    }
    const lg = lc.getContext("2d")!;
    const img = lg.createImageData(span, span);
    const out = new Uint32Array(img.data.buffer);
    // Local contrast: each cell pushed away from its neighbours' average. Flat paint stays flat; anything
    // that's just slightly off (a camouflaged Pix) stands right out.
    const cells: number[] = [];
    for (let yy = 0; yy < span; yy++) {
      for (let xx = 0; xx < span; xx++) {
        const cx = clamp(x0 + xx, 0, w.w - 1);
        const cy = clamp(y0 + yy, 0, w.h - 1);
        cells.push(cellColour(w.scene, w.cov.amount, w.cov.variant, cy * w.w + cx));
      }
    }
    // Pix, as it looks right now, is one of the cells.
    const pixCell = w.phase === "hunt" && w.onCanvas() && w.def.camo ? (Math.floor(w.pix.y) - y0) * span + (Math.floor(w.pix.x) - x0) : -1;
    if (pixCell >= 0 && pixCell < cells.length && Math.floor(w.pix.x) >= x0 && Math.floor(w.pix.x) < x0 + span) cells[pixCell] = pixColour(w);
    const k = 7;
    for (let yy = 0; yy < span; yy++) {
      for (let xx = 0; xx < span; xx++) {
        let r = 0;
        let gg = 0;
        let b = 0;
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if ((!dx && !dy) || xx + dx < 0 || yy + dy < 0 || xx + dx >= span || yy + dy >= span) continue;
            const c = cells[(yy + dy) * span + xx + dx]!;
            r += red(c);
            gg += green(c);
            b += blue(c);
            n++;
          }
        }
        const c = cells[yy * span + xx]!;
        const boost = (v: number, mean: number) => Math.round(clamp(v + (v - mean / n) * k, 0, 255));
        out[yy * span + xx] = ((255 << 24) | (boost(blue(c), b) << 16) | (boost(green(c), gg) << 8) | boost(red(c), r)) >>> 0;
      }
    }
    lg.putImageData(img, 0, 0);
    const g = this.g;
    const cx = at.x * cell;
    const cy = at.y * cell;
    g.save();
    g.beginPath();
    g.arc(cx, cy, R * cell, 0, Math.PI * 2);
    g.clip();
    g.imageSmoothingEnabled = false;
    const scale = cell * zoom;
    g.drawImage(lc, cx - (at.x - x0) * scale, cy - (at.y - y0) * scale, span * scale, span * scale);
    // Pix under the lens: its face.
    const p = w.pix;
    const show = (w.phase === "hunt" || w.phase === "wake") && w.onCanvas() && p.mode !== "tab" && p.mode !== "mimic" && !((p.mode === "dead" || p.mode === "dom") && p.arrived);
    if (show) {
      const px = cx + (Math.floor(p.x) - at.x) * scale;
      const py = cy + (Math.floor(p.y) - at.y) * scale;
      if (Math.hypot(px + scale / 2 - cx, py + scale / 2 - cy) < R * cell) {
        const face = pixelSprite(PIX_FACE, PAL, { key: "lp:face" });
        g.fillStyle = INK;
        g.fillRect(px - scale * 0.15, py - scale * 0.15, scale * 1.3, scale * 1.3);
        g.drawImage(face, px, py, scale, scale);
      }
    }
    g.restore();
    g.strokeStyle = "#FFFFFF";
    g.lineWidth = Math.max(3, this.dpr * 3);
    g.beginPath();
    g.arc(cx, cy, R * cell, 0, Math.PI * 2);
    g.stroke();
    g.strokeStyle = INK;
    g.lineWidth = Math.max(1, this.dpr * 1.5);
    g.beginPath();
    g.arc(cx, cy, R * cell + Math.max(2, this.dpr * 2), 0, Math.PI * 2);
    g.stroke();
  }

  // -- Your cursor, the detector, the edge arrow -------------------------------------------------

  private cursor(f: Frame, cell: number) {
    const w = f.world;
    const hunting = w.phase === "hunt" || w.phase === "wake" || w.phase === "escaped";
    if (!hunting || !f.pointer || (f.touch && !f.down)) return;
    this.detector(f, cell);
    if (f.touch) return;
    if (f.huntTool === "net" || f.net) this.sprite(NET, f.pointer, cell, "net");
    else this.sprite(ARROW, f.pointer, cell, "arrow");
  }

  /** The pixel detector: a ring round your pointer, colder or hotter, pulsing faster the closer Pix is. */
  private detector(f: Frame, cell: number) {
    const w = f.world;
    if (w.phase !== "hunt") return;
    const heat = detectorHeat(w, f.pointer!);
    const g = this.g;
    const beat = f.reduceMotion ? 0 : (f.time * (1 + heat * 7)) % 1;
    const r = (2.4 + beat * 1.6) * cell;
    const cold = [127, 212, 245];
    const hot = [255, 107, 107];
    const c = cold.map((v, i) => Math.round(v + (hot[i]! - v) * heat));
    g.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${(0.85 - beat * 0.6).toFixed(3)})`;
    g.lineWidth = Math.max(2, cell * 0.35);
    g.beginPath();
    g.arc(f.pointer!.x * cell, f.pointer!.y * cell, r, 0, Math.PI * 2);
    g.stroke();
  }

  /** Pix has left the canvas (into the page, a "dead pixel", the tab): an arrow at the edge points to it. */
  private edgeArrow(f: Frame, cell: number) {
    const w = f.world;
    const p = w.pix;
    if (w.phase !== "hunt" || (w.onCanvas() && !(p.mode === "dom" && p.arrived))) return;
    // Into the page or the tab: an arrow. (A dead pixel's tell is pausing; the detector finds it.)
    if (p.mode !== "dom" && p.mode !== "tab") return;
    const g = this.g;
    const cx = w.w / 2;
    const cy = w.h / 2;
    const dx = p.x - cx;
    const dy = p.y - cy;
    const k = Math.min((w.w / 2 - 2.5) / Math.max(0.001, Math.abs(dx)), (w.h / 2 - 2.5) / Math.max(0.001, Math.abs(dy)));
    const ax = (cx + dx * k) * cell;
    const ay = (cy + dy * k) * cell;
    const a = Math.atan2(dy, dx);
    const bob = f.reduceMotion ? 0 : Math.sin(f.time * 6) * cell * 0.5;
    g.save();
    g.translate(ax + Math.cos(a) * bob, ay + Math.sin(a) * bob);
    g.rotate(a);
    g.fillStyle = "#FFD23F";
    g.strokeStyle = INK;
    g.lineWidth = Math.max(2, this.dpr * 2);
    g.beginPath();
    g.moveTo(cell * 2, 0);
    g.lineTo(-cell * 1.2, -cell * 1.6);
    g.lineTo(-cell * 0.4, 0);
    g.lineTo(-cell * 1.2, cell * 1.6);
    g.closePath();
    g.fill();
    g.stroke();
    g.restore();
  }

  // -- Particles ---------------------------------------------------------------------------------

  private updateParticles(f: Frame, cell: number) {
    const g = this.g;
    const dt = 1 / 60;
    this.particles = this.particles.filter((p) => (p.life += dt) < p.max);
    for (const p of this.particles) {
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const a = 1 - p.life / p.max;
      g.globalAlpha = a;
      g.fillStyle = p.colour;
      const s = Math.max(1, p.size * cell);
      g.fillRect(p.x * cell - s / 2, p.y * cell - s / 2, s, s);
    }
    g.globalAlpha = 1;
    void f;
  }
}

/** How hot the detector is (0 cold – 1 on top of it), by how far Pix is from your pointer (the real one). */
export function detectorHeat(w: World, pointer: Vec): number {
  const d = Math.hypot(w.pix.x - pointer.x, w.pix.y - pointer.y);
  if (w.pix.mode === "tab") return 0.15;
  return clamp(1 - d / 70, 0, 1) ** 1.6;
}

/** Ticks the real Pix's blink lasts (for the HUD's screen-reader beat, and tests). */
export const BLINK = BLINK_TICKS;
