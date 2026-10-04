// Little things that move: dust when you land, debris when a ledge crumbles, a poof when a cloud
// goes, sparkles on feathers, and each zone's weather (Plan/08-almost-there.md §9).
import { VIEW_H, VIEW_W } from "../core/constants";
import type { ZoneLook } from "./palette";
import { hash, R } from "./palette";

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

export class Effects {
  private parts: Particle[] = [];
  private seed = 1;

  clear() {
    this.parts = [];
  }

  private rand() {
    this.seed = (this.seed * 16807) % 2147483647;
    return this.seed / 2147483647;
  }

  /** A puff of dust at the feet: bigger for a harder landing. */
  dust(x: number, y: number, power: number, colour: string = R.mist) {
    const n = Math.round(3 + power * 6);
    for (let i = 0; i < n; i++) {
      const dir = i % 2 ? 1 : -1;
      this.parts.push({ x, y: y - 1, vx: dir * (0.3 + this.rand() * (0.6 + power)), vy: -this.rand() * (0.4 + power * 0.6), life: 0, max: 18 + this.rand() * 14, colour, size: 1, gravity: 0.04 });
    }
  }

  /** Bits of a crumbling ledge falling away. */
  debris(x: number, y: number, colour: string) {
    for (let i = 0; i < 6; i++) {
      this.parts.push({ x: x + this.rand() * 8, y: y + this.rand() * 6, vx: (this.rand() - 0.5) * 0.8, vy: this.rand() * 0.5, life: 0, max: 40 + this.rand() * 20, colour, size: this.rand() < 0.3 ? 2 : 1, gravity: 0.12 });
    }
  }

  /** A cloud going: a soft poof. */
  poof(x: number, y: number) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      this.parts.push({ x: x + 4, y: y + 2, vx: Math.cos(a) * 0.5, vy: Math.sin(a) * 0.3, life: 0, max: 30, colour: R.white, size: 2, gravity: -0.005 });
    }
  }

  /** A feather picked up: a burst of gold. */
  sparkle(x: number, y: number) {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      this.parts.push({ x, y, vx: Math.cos(a) * 1.1, vy: Math.sin(a) * 1.1, life: 0, max: 26, colour: i % 2 ? R.gold : R.white, size: 1, gravity: 0 });
    }
  }

  /** A bonk on the head: stars. */
  stars(x: number, y: number) {
    for (let i = 0; i < 4; i++) {
      this.parts.push({ x, y, vx: (i - 1.5) * 0.4, vy: -0.6, life: 0, max: 20, colour: R.gold, size: 1, gravity: 0.03 });
    }
  }

  tick() {
    for (const p of this.parts) {
      p.life++;
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
    }
    this.parts = this.parts.filter((p) => p.life < p.max);
  }

  /** Drawn relative to the camera (world → canvas). */
  draw(g: CanvasRenderingContext2D, camX: number, camY: number) {
    for (const p of this.parts) {
      const fade = 1 - p.life / p.max;
      g.globalAlpha = Math.max(0, Math.min(1, fade * 1.4));
      g.fillStyle = p.colour;
      g.fillRect(Math.round(p.x - camX), Math.round(p.y - camY), p.size, p.size);
    }
    g.globalAlpha = 1;
  }
}

/** Each zone's weather, drawn over the screen (it doesn't touch anything). */
export function drawWeather(g: CanvasRenderingContext2D, look: ZoneLook, time: number, worldTop: number, reducedMotion: boolean) {
  if (look.weather === "none") return;
  const count = reducedMotion ? 10 : 26;
  for (let i = 0; i < count; i++) {
    const h1 = hash(i, 101);
    const h2 = hash(i, 102);
    const speed = 0.3 + hash(i, 103) * 0.5;
    let x = 0;
    let y = 0;
    let colour: string = R.white;
    let size = 1;
    switch (look.weather) {
      case "snow":
        y = (h1 * VIEW_H + time * 14 * speed) % VIEW_H;
        x = (h2 * VIEW_W + Math.sin(time * speed + i) * 8 + VIEW_W) % VIEW_W;
        size = i % 4 === 0 ? 2 : 1;
        break;
      case "leaves":
        y = (h1 * VIEW_H + time * 9 * speed) % VIEW_H;
        x = (h2 * VIEW_W + time * 12 * speed + Math.sin(time + i) * 6) % VIEW_W;
        colour = i % 3 ? R.leaf : R.gold;
        break;
      case "embers":
        y = VIEW_H - ((h1 * VIEW_H + time * 10 * speed) % VIEW_H);
        x = (h2 * VIEW_W + Math.sin(time * 0.7 + i) * 10 + VIEW_W) % VIEW_W;
        colour = i % 2 ? R.peach : R.coral;
        break;
      case "dust":
        y = (h1 * VIEW_H + Math.sin(time * 0.3 + i) * 6 + VIEW_H) % VIEW_H;
        x = (h2 * VIEW_W + time * 6 * speed) % VIEW_W;
        colour = "rgba(255,255,255,0.35)";
        break;
      case "motes":
        y = (h1 * VIEW_H + Math.sin(time * 0.4 + i) * 10 + VIEW_H) % VIEW_H;
        x = (h2 * VIEW_W + Math.cos(time * 0.3 + i) * 10 + VIEW_W) % VIEW_W;
        colour = i % 2 ? "rgba(249,194,43,0.5)" : "rgba(255,255,255,0.25)";
        break;
      case "petals":
        y = (h1 * VIEW_H + time * 8 * speed) % VIEW_H;
        x = (h2 * VIEW_W + time * 10 * speed + Math.sin(time * 1.3 + i) * 5) % VIEW_W;
        colour = i % 2 ? R.blush : R.cream;
        break;
    }
    if (worldTop % 2 === 1) x = VIEW_W - x;
    g.fillStyle = colour;
    g.fillRect(Math.round(x), Math.round(y), size, size);
  }
}
