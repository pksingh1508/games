// Little bursts: dust on a landing, bits flying into you, you in pixels when you're patched. They live
// in the world (they scroll with the track).

interface Bit {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  colour: string;
  size: number;
  glyph?: string;
}

export class Particles {
  private parts: Bit[] = [];

  clear() {
    this.parts = [];
  }

  private add(p: Bit) {
    if (this.parts.length > 300) this.parts.shift();
    this.parts.push(p);
  }

  dust(x: number, y: number, strength: number) {
    for (let i = 0; i < 6; i++) {
      const side = i % 2 ? 1 : -1;
      this.add({ x, y, vx: side * (0.4 + Math.random()) * strength, vy: -Math.random() * strength, life: 16, max: 16, colour: "#00F5D4", size: 1.6 });
    }
  }

  sparkle(x: number, y: number, colour: string, glyph?: string) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      this.add({ x, y, vx: Math.cos(a) * 1.6, vy: Math.sin(a) * 1.6, life: 18, max: 18, colour, size: 2, glyph });
    }
  }

  /** Patched: you come apart into pixels. */
  shatter(x: number, y: number) {
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 1 + Math.random() * 3;
      this.add({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, life: 50, max: 50, colour: i % 3 === 0 ? "#FF2E88" : i % 3 === 1 ? "#00F5D4" : "#E6F1FF", size: 2 + Math.random() * 2 });
    }
  }

  tick() {
    const keep: Bit[] = [];
    for (const p of this.parts) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
      p.vx *= 0.96;
      if (--p.life > 0) keep.push(p);
    }
    this.parts = keep;
  }

  draw(g: CanvasRenderingContext2D) {
    for (const p of this.parts) {
      g.globalAlpha = Math.min(1, (p.life / p.max) * 1.5);
      g.fillStyle = p.colour;
      if (p.glyph) {
        g.font = "bold 8px ui-monospace, Menlo, monospace";
        g.fillText(p.glyph, p.x, p.y);
      } else g.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    g.globalAlpha = 1;
  }
}
