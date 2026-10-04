// Little bursts for the moments that matter: dust from a jump or a landing, a ring when gravity
// changes, sparkles for a golden apple, Newt in bits after spikes, confetti at the portal. They live
// in the room (they turn with the camera); bits that fall, fall the real way down.
import type { Vec } from "../core/gravity";

type Kind = "dot" | "ring" | "spark" | "confetti";

interface Particle {
  kind: Kind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Which way it falls (a unit vector times its weight), or none. */
  gx: number;
  gy: number;
  life: number;
  max: number;
  size: number;
  colour: string;
  spin: number;
}

const CONFETTI = ["#E63946", "#FFB703", "#2A9D8F", "#7B2CBF", "#4CC9F0", "#F4B400"];

export class Effects {
  private parts: Particle[] = [];
  /** Screen shake left (px), for a death. */
  shake = 0;

  constructor(private readonly reducedMotion: () => boolean) {}

  clear() {
    this.parts = [];
    this.shake = 0;
  }

  private add(p: Partial<Particle> & Pick<Particle, "x" | "y">) {
    if (this.parts.length > 400) this.parts.shift();
    this.parts.push({ kind: "dot", vx: 0, vy: 0, gx: 0, gy: 0, life: 30, size: 2, colour: "#fff", spin: 0, ...p, max: p.life ?? 30 });
  }

  /** A puff where Newt's feet were (pushed along the floor, away from it). */
  dust(x: number, y: number, up: Vec, count: number, strength: number, colour: string) {
    const tx = -up.y;
    const ty = up.x;
    for (let i = 0; i < count; i++) {
      const side = (i % 2 ? 1 : -1) * (0.4 + Math.random() * 0.8) * strength;
      const lift = Math.random() * 0.5 * strength;
      this.add({ x, y, vx: tx * side + up.x * lift, vy: ty * side + up.y * lift, life: 18 + Math.random() * 10, size: 1.6 + Math.random() * 1.6, colour });
    }
  }

  /** A ring that grows and fades (a lever, a flip, a net). */
  ring(x: number, y: number, colour: string, size = 18, life = 24) {
    this.add({ kind: "ring", x, y, life, size, colour });
  }

  sparkle(x: number, y: number, colour: string, count = 10) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const v = 0.8 + Math.random() * 1.2;
      this.add({ kind: "spark", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 20 + Math.random() * 12, size: 2.2, colour, spin: a });
    }
  }

  /** Newt in bits: they fly out, then fall the real way. */
  burst(x: number, y: number, down: Vec | null, colours: readonly string[]) {
    const g = down ? { x: down.x * 0.12, y: down.y * 0.12 } : { x: 0, y: 0 };
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      const v = 1 + Math.random() * 1.8;
      this.add({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, gx: g.x, gy: g.y, life: 36 + Math.random() * 16, size: 2 + Math.random() * 1.6, colour: colours[i % colours.length]! });
    }
    if (!this.reducedMotion()) this.shake = 3;
  }

  confetti(x: number, y: number, down: Vec | null) {
    const g = down ? { x: down.x * 0.06, y: down.y * 0.06 } : { x: 0, y: 0.04 };
    for (let i = 0; i < 28; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 0.8 + Math.random() * 2;
      this.add({ kind: "confetti", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, gx: g.x, gy: g.y, life: 60 + Math.random() * 30, size: 2.6, colour: CONFETTI[i % CONFETTI.length]!, spin: a });
    }
  }

  tick() {
    this.shake = Math.max(0, this.shake - 0.25);
    const keep: Particle[] = [];
    for (const p of this.parts) {
      p.vx = (p.vx + p.gx) * 0.94;
      p.vy = (p.vy + p.gy) * 0.94;
      if (p.kind === "dot" && !p.gx && !p.gy) {
        p.vx *= 0.95;
        p.vy *= 0.95;
      }
      p.x += p.vx;
      p.y += p.vy;
      p.spin += 0.2;
      if (--p.life > 0) keep.push(p);
    }
    this.parts = keep;
  }

  draw(g: CanvasRenderingContext2D) {
    for (const p of this.parts) {
      const t = p.life / p.max;
      g.globalAlpha = Math.min(1, t * 1.6);
      switch (p.kind) {
        case "dot":
          g.fillStyle = p.colour;
          g.beginPath();
          g.arc(p.x, p.y, p.size * (0.5 + t * 0.5), 0, Math.PI * 2);
          g.fill();
          break;
        case "ring":
          g.strokeStyle = p.colour;
          g.lineWidth = 2 * t + 0.5;
          g.beginPath();
          g.arc(p.x, p.y, p.size * (1.15 - t * 0.85), 0, Math.PI * 2);
          g.stroke();
          break;
        case "spark": {
          g.strokeStyle = p.colour;
          g.lineWidth = 1.4;
          const r = p.size * t + 0.6;
          g.beginPath();
          g.moveTo(p.x - r, p.y);
          g.lineTo(p.x + r, p.y);
          g.moveTo(p.x, p.y - r);
          g.lineTo(p.x, p.y + r);
          g.stroke();
          break;
        }
        case "confetti":
          g.save();
          g.translate(p.x, p.y);
          g.rotate(p.spin);
          g.fillStyle = p.colour;
          g.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          g.restore();
          break;
      }
    }
    g.globalAlpha = 1;
  }
}
