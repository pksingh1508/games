// Juice (Plan/05-fake-floor.md §9): dust when you land, a squash and a stretch, bits of a crumbling
// floor, a little "TOK" where a pebble hits, "lol" from a safety net, confetti at the door.
// Purely visual, in room coordinates, with its own random numbers.
import { pixelText, textWidth } from "@/engine/pixel-font";
import { E } from "./palette";

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
  puff: boolean;
}

interface Word {
  x: number;
  y: number;
  text: string;
  colour: string;
  life: number;
  max: number;
}

export class Effects {
  private particles: Particle[] = [];
  private words: Word[] = [];
  private seed = 4242;
  shake = 0;
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

  dust(x: number, y: number, count = 4, spread = 1, colour: string = E.mist) {
    for (let i = 0; i < count; i++) {
      this.add({ x: x + (this.rand() - 0.5) * 8, y, vx: (this.rand() - 0.5) * spread, vy: -this.rand() * 0.6, life: 14 + this.rand() * 10, colour, size: 2, gravity: 0, puff: true });
    }
  }

  jump(x: number, y: number) {
    this.squashX = 0.82;
    this.squashY = 1.2;
    this.dust(x, y, 3, 1.3);
  }

  land(x: number, y: number, impact: number) {
    const k = Math.min(1, impact / 5);
    this.squashX = 1 + 0.28 * k;
    this.squashY = 1 - 0.28 * k;
    if (impact > 2) this.dust(x, y, 3 + Math.round(k * 4), 1.5);
  }

  /** Bits falling off something (a crumbling floor). */
  debris(x: number, y: number, colour: string, amount = 8) {
    for (let i = 0; i < amount; i++) {
      this.add({ x: x + (this.rand() - 0.5) * 14, y, vx: (this.rand() - 0.5) * 1.6, vy: -0.4 - this.rand() * 1.5, life: 30 + this.rand() * 20, colour, size: 2, gravity: 0.18, puff: false });
    }
  }

  sparkle(x: number, y: number, colour: string = E.yellow, count = 6) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + this.rand();
      this.add({ x, y, vx: Math.cos(angle) * 1.2, vy: Math.sin(angle) * 1.2, life: 12 + this.rand() * 8, colour, size: 1, gravity: 0, puff: false });
    }
  }

  confetti(x: number, y: number) {
    const colours = [E.red, E.amber, E.blue, E.green, E.cyan, E.pink];
    for (let i = 0; i < 36; i++) {
      this.add({ x, y, vx: (this.rand() - 0.5) * 4.5, vy: -1.8 - this.rand() * 3, life: 50 + this.rand() * 30, colour: colours[i % colours.length]!, size: 2, gravity: 0.12, puff: false });
    }
  }

  /** A little word in the room ("TOK", "TINK", "lol"): it floats up and fades. */
  say(x: number, y: number, text: string, colour: string = E.white, life = 40) {
    this.words = this.words.filter((w) => !(w.text === text && Math.abs(w.x - x) < 10 && w.life > w.max - 6));
    this.words.push({ x, y, text, colour, life, max: life });
    if (this.words.length > 12) this.words.shift();
  }

  kick(amount: number) {
    if (!this.reducedMotion()) this.shake = Math.max(this.shake, amount);
  }

  tick() {
    this.squashX += (1 - this.squashX) * 0.25;
    this.squashY += (1 - this.squashY) * 0.25;
    this.shake = this.shake > 0.2 ? this.shake * 0.82 : 0;
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      if (p.puff) {
        p.vx *= 0.9;
        p.vy *= 0.9;
      }
      p.life--;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const w of this.words) {
      w.life--;
      w.y -= 0.25;
    }
    this.words = this.words.filter((w) => w.life > 0);
  }

  clear() {
    this.particles = [];
    this.words = [];
    this.shake = 0;
    this.squashX = this.squashY = 1;
  }

  draw(g: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const fade = p.life / p.max;
      const size = p.puff ? Math.max(1, Math.round(p.size * (0.4 + fade * 0.8))) : p.size;
      g.globalAlpha = p.puff ? fade * 0.8 : Math.min(1, fade * 2);
      g.fillStyle = p.colour;
      g.fillRect(Math.round(p.x - size / 2), Math.round(p.y - size / 2), size, size);
    }
    g.globalAlpha = 1;
  }

  /** Words go on top of everything, darkness included. */
  drawWords(g: CanvasRenderingContext2D) {
    for (const w of this.words) {
      const fade = Math.min(1, (w.life / w.max) * 3);
      const x = Math.round(w.x - textWidth(w.text) / 2);
      const y = Math.round(w.y);
      g.globalAlpha = fade;
      // A dark outline so words read on any floor.
      for (const [dx, dy] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ] as const) {
        pixelText(g, w.text, x + dx, y + dy, E.ink);
      }
      pixelText(g, w.text, x, y, w.colour);
    }
    g.globalAlpha = 1;
  }
}
