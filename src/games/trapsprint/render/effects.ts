// Juice (Plan/06-trapsprint.md §9): dust when you land, a squash and a stretch, a puff of smoke and
// a little ghost floating away when you die, confetti at the door, debris when a trap lands.
// Purely visual: it has its own random numbers and never touches the simulation.
import { PAL, sprite, SPIRIT } from "./art";

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
  kind: "dot" | "puff" | "spirit";
}

export class Effects {
  private particles: Particle[] = [];
  private seed = 12345;
  /** Screen shake, in pixels; fades by itself. */
  shake = 0;
  /** The runner's squash and stretch (1 = normal). */
  squashX = 1;
  squashY = 1;

  constructor(private readonly reducedMotion: () => boolean) {}

  private rand(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  private add(p: Omit<Particle, "max">) {
    if (this.particles.length > 400) return;
    this.particles.push({ ...p, max: p.life });
  }

  dust(x: number, y: number, count = 4, spread = 1) {
    for (let i = 0; i < count; i++) {
      this.add({ x: x + (this.rand() - 0.5) * 8, y, vx: (this.rand() - 0.5) * spread, vy: -this.rand() * 0.6, life: 14 + this.rand() * 10, colour: "#f4f4f4", size: 2, gravity: 0, kind: "puff" });
    }
  }

  jump(x: number, y: number) {
    this.squashX = 0.8;
    this.squashY = 1.25;
    this.dust(x, y, 3, 1.4);
  }

  land(x: number, y: number, impact: number) {
    const k = Math.min(1, impact / 5);
    this.squashX = 1 + 0.3 * k;
    this.squashY = 1 - 0.3 * k;
    if (impact > 2) this.dust(x, y, 3 + Math.round(k * 4), 1.6);
  }

  /** A cartoon death: smoke, a few bits of you, a spirit floating up. */
  death(x: number, y: number, colour: string = PAL.h) {
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const speed = 0.8 + this.rand() * 1.4;
      this.add({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 18 + this.rand() * 12, colour: "#f4f4f4", size: 4, gravity: -0.02, kind: "puff" });
    }
    for (let i = 0; i < 8; i++) {
      this.add({ x, y, vx: (this.rand() - 0.5) * 4, vy: -1 - this.rand() * 3, life: 30 + this.rand() * 20, colour: i % 3 ? colour : PAL.k, size: 2, gravity: 0.2, kind: "dot" });
    }
    this.add({ x: x - 4, y: y - 6, vx: 0, vy: -0.45, life: 50, colour: "#ffffff", size: 1, gravity: 0, kind: "spirit" });
    this.kick(4);
  }

  /** Something heavy landed (a press, a stalactite, the banner). */
  debris(x: number, y: number, colour: string, amount = 8) {
    for (let i = 0; i < amount; i++) {
      this.add({ x: x + (this.rand() - 0.5) * 16, y, vx: (this.rand() - 0.5) * 3, vy: -0.5 - this.rand() * 2.5, life: 20 + this.rand() * 14, colour, size: 2, gravity: 0.2, kind: "dot" });
    }
    this.dust(x, y, 4, 2);
  }

  sparkle(x: number, y: number, colour: string = PAL.y, count = 6) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + this.rand();
      this.add({ x, y, vx: Math.cos(angle) * 1.3, vy: Math.sin(angle) * 1.3, life: 12 + this.rand() * 8, colour, size: 1, gravity: 0, kind: "dot" });
    }
  }

  confetti(x: number, y: number) {
    const colours = [PAL.h, PAL.y, PAL.s, PAL.l, PAL.c, PAL.o];
    for (let i = 0; i < 40; i++) {
      this.add({ x, y, vx: (this.rand() - 0.5) * 5, vy: -2 - this.rand() * 3.5, life: 50 + this.rand() * 30, colour: colours[i % colours.length]!, size: 2, gravity: 0.12, kind: "dot" });
    }
  }

  /** A trickle of dust from a crack (the crusher's tell). */
  trickle(x: number, y: number) {
    this.add({ x: x + (this.rand() - 0.5) * 2, y, vx: 0, vy: 0.4, life: 26, colour: "#c9b8a6", size: 1, gravity: 0.03, kind: "dot" });
  }

  kick(amount: number) {
    if (!this.reducedMotion()) this.shake = Math.max(this.shake, amount);
  }

  /** One simulation tick. */
  tick() {
    this.squashX += (1 - this.squashX) * 0.25;
    this.squashY += (1 - this.squashY) * 0.25;
    this.shake = this.shake > 0.2 ? this.shake * 0.82 : 0;
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      if (p.kind === "puff") {
        p.vx *= 0.9;
        p.vy *= 0.9;
      }
      p.life--;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  clear() {
    this.particles = [];
    this.shake = 0;
    this.squashX = this.squashY = 1;
  }

  draw(g: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const fade = p.life / p.max;
      if (p.kind === "spirit") {
        g.globalAlpha = Math.min(1, fade * 1.5) * 0.9;
        const sway = Math.round(Math.sin((p.max - p.life) / 6) * 2);
        g.drawImage(sprite(SPIRIT, "spirit"), Math.round(p.x) + sway, Math.round(p.y));
        continue;
      }
      const size = p.kind === "puff" ? Math.max(1, Math.round(p.size * (0.4 + fade * 0.8))) : p.size;
      g.globalAlpha = p.kind === "puff" ? fade * 0.85 : Math.min(1, fade * 2);
      g.fillStyle = p.colour;
      g.fillRect(Math.round(p.x - size / 2), Math.round(p.y - size / 2), size, size);
    }
    g.globalAlpha = 1;
  }
}
