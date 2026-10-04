// Draws the climb (Plan/08-almost-there.md §8, §9, §12): the screen the camera is on (two while
// the credits pan up), the moving parts, Pip with a hat, Chirp, the wind, and the dark inside the
// mountain. Canvas 2D at 384 × 216, scaled up in whole pixels by the page.
import { CHARGE_MAX, COLS, ROWS, TILE, VIEW_H, VIEW_W } from "../core/constants";
import type { Climb } from "../core/climb";
import { screenOf, T, tileAt, type Mountain, type ZoneId } from "../core/mountain";
import type { Mood } from "../core/chirp";
import { elevatorRect, gearRect, windOn } from "../core/sim";
import { screenBackground } from "./background";
import { drawWeather, Effects } from "./effects";
import { hash, mix, R, rgb, ZONE_LOOK } from "./palette";
import { CHIRP, FEATHER, FLAG_CLOTH, FOOTPRINTS, HATS, HEAD_TOP, JOKE_CLOTH, PIP, PIP_ART_X, SIGN, sprite, WARNING, type PipFrame } from "./sprites";
import { drawCloud, drawCrumble, screenGlow, screenTiles } from "./tiles";

export interface ChirpView {
  x: number;
  y: number;
  mood: Mood;
  /** Facing right (towards Pip, when sincere). */
  right: boolean;
}

export interface Frame {
  climb: Climb;
  /** Pip's position at the tick before (drawn in between, by alpha). */
  prev: { x: number; y: number };
  alpha: number;
  /** Seconds, for animation. */
  time: number;
  /** The view's top-left, in world pixels. */
  cam: { x: number; y: number };
  chirp: ChirpView | null;
  hat: number | null;
  /** Assist: where this jump would go. */
  preview: ReadonlyArray<{ x: number; y: number }> | null;
  /** How far each summit's flag has gone up its pole (0–1; -1: not planted). */
  flags: { fake: number; real: number };
  /** Pip is hidden (between the credits' lines, the camera looks elsewhere). */
  hidePip: boolean;
  reducedMotion: boolean;
}

const ELEVATOR_FLICKER_EVERY = 3.1;

export class Renderer {
  readonly g: CanvasRenderingContext2D;
  readonly fx = new Effects();
  private m: Mountain | null = null;
  private dark: HTMLCanvasElement | null = null;
  private walkPhase = 0;
  private lastX = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    canvas.width = VIEW_W;
    canvas.height = VIEW_H;
    this.g = canvas.getContext("2d")!;
    this.g.imageSmoothingEnabled = false;
  }

  setMountain(m: Mountain) {
    this.m = m;
  }

  draw(f: Frame) {
    const m = this.m;
    if (!m) return;
    const g = this.g;
    const { cam } = f;
    const s = f.climb.sim;
    g.imageSmoothingEnabled = false;

    // The screens in view (one, or two while the camera pans).
    const col = Math.round(cam.x / VIEW_W);
    const rowAt = (y: number) => Math.floor(y / VIEW_H);
    const firstRow = rowAt(cam.y);
    const lastRow = rowAt(cam.y + VIEW_H - 1);
    for (let gr = firstRow; gr <= lastRow; gr++) {
      const row = 39 - gr;
      const screen = screenOf(m, col, row);
      const top = gr * VIEW_H;
      const dy = Math.round(top - cam.y);
      const zone: ZoneId = screen?.zone ?? "summit";
      g.drawImage(screenBackground(zone, top, m.mirrored), 0, dy);
      if (screen) g.drawImage(screenTiles(m, screen, s.collapsed), 0, dy);
    }

    this.drawDynamicTiles(f);
    this.drawThings(f);
    this.drawWind(f);
    if (!f.hidePip) this.drawPip(f);
    if (f.chirp) this.drawChirp(f.chirp, f);
    if (f.preview) this.drawPreview(f.preview, cam);
    this.fx.draw(g, cam.x, cam.y);

    // Weather, then the dark (inside the mountain only the lamp lights things).
    const zone = this.zoneAtCam(cam);
    const look = ZONE_LOOK[zone];
    drawWeather(g, look, f.time, Math.round(cam.y), f.reducedMotion);
    if (look.dark) this.drawDark(f);
  }

  private zoneAtCam(cam: { x: number; y: number }): ZoneId {
    const m = this.m!;
    const row = 39 - Math.floor((cam.y + VIEW_H / 2) / VIEW_H);
    return screenOf(m, Math.round(cam.x / VIEW_W), row)?.zone ?? "summit";
  }

  /** Crumbling ledges and clouds: they shake, go, and come back. */
  private drawDynamicTiles(f: Frame) {
    const m = this.m!;
    const g = this.g;
    const s = f.climb.sim;
    const timers = new Map(s.crumbles);
    const tx0 = Math.floor(f.cam.x / TILE);
    const ty0 = Math.floor(f.cam.y / TILE);
    for (let r = 0; r <= ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const tx = tx0 + c;
        const ty = ty0 + r;
        const code = tileAt(m, tx, ty);
        if (code !== T.CRUMBLE && code !== T.CLOUD) continue;
        const at = ty * m.tileCols + tx;
        const timer = timers.get(at) ?? 0;
        const x = tx * TILE - f.cam.x;
        const y = ty * TILE - f.cam.y;
        const zone = screenOf(m, Math.floor((tx * TILE) / VIEW_W), 39 - Math.floor((ty * TILE) / VIEW_H))?.zone ?? "summit";
        const look = ZONE_LOOK[zone];
        if (code === T.CRUMBLE) {
          drawCrumble(g, Math.round(x), Math.round(y), tx, ty, look, timer > 0 ? timer : 0, timer < 0 && timer > -40 ? 1 - -timer / 40 : 0);
        } else if (timer >= 0) {
          const leftEnd = tileAt(m, tx - 1, ty) !== T.CLOUD;
          const rightEnd = tileAt(m, tx + 1, ty) !== T.CLOUD;
          drawCloud(g, Math.round(x), Math.round(y), tx, leftEnd, rightEnd, timer > 40 ? (timer - 40) / 20 : 0);
        } else if (timer > -30) {
          // Coming back: a faint wisp.
          g.fillStyle = `rgba(255,255,255,${0.15 + (1 - -timer / 30) * 0.4})`;
          g.fillRect(Math.round(x) + 1, Math.round(y) + 2, TILE - 2, 2);
        }
      }
    }
  }

  private inView(x: number, y: number, w: number, h: number, cam: { x: number; y: number }) {
    return x + w > cam.x && x < cam.x + VIEW_W && y + h > cam.y - 30 && y < cam.y + VIEW_H + 30;
  }

  private drawThings(f: Frame) {
    const m = this.m!;
    const g = this.g;
    const s = f.climb.sim;
    const { cam } = f;
    const X = (x: number) => Math.round(x - cam.x);
    const Y = (y: number) => Math.round(y - cam.y);

    // Footprints: worn into the real route.
    const prints = sprite(FOOTPRINTS, "prints");
    g.globalAlpha = 0.55;
    for (const p of m.footprints) if (this.inView(p.x, p.y - 2, 8, 2, cam)) g.drawImage(prints, X(p.x + 1), Y(p.y - 2));
    g.globalAlpha = 1;

    // Gears: brass platforms that move on a timer.
    for (const gear of m.gears) {
      const a = gearRect(gear, s.tick);
      const b = gearRect(gear, s.tick + 1);
      const x = a.x + (b.x - a.x) * f.alpha;
      const y = a.y + (b.y - a.y) * f.alpha;
      if (!this.inView(x, y, a.w, a.h, cam)) continue;
      g.fillStyle = R.bark;
      g.fillRect(X(x), Y(y), a.w, a.h);
      g.fillStyle = R.amber;
      g.fillRect(X(x), Y(y), a.w, 3);
      g.fillStyle = R.gold;
      g.fillRect(X(x), Y(y), a.w, 1);
      // Teeth underneath, turning.
      const turn = Math.floor((s.tick + f.alpha) / 6) % 2;
      g.fillStyle = R.amber;
      for (let tx = turn * 2; tx < a.w; tx += 4) g.fillRect(X(x) + tx, Y(y) + a.h, 2, 2);
      // A cog at each end.
      g.fillStyle = R.olive;
      g.fillRect(X(x) + 1, Y(y) + 3, 3, 3);
      g.fillRect(X(x) + a.w - 4, Y(y) + 3, 3, 3);
    }

    // The Express Elevator, with its arrow display (▲… and for one frame, ▼).
    m.elevators.forEach((e, i) => {
      const r = elevatorRect(m, s, i);
      if (!this.inView(r.x, r.y - 40, r.w, r.h + 40 + e.drop, cam)) return;
      // Cables.
      g.fillStyle = R.dusk;
      g.fillRect(X(r.x + 2), Y(e.rect.y - 120), 1, r.y - e.rect.y + 120);
      g.fillRect(X(r.x + r.w - 3), Y(e.rect.y - 120), 1, r.y - e.rect.y + 120);
      g.fillStyle = R.fog;
      g.fillRect(X(r.x), Y(r.y), r.w, r.h);
      g.fillStyle = R.white;
      g.fillRect(X(r.x), Y(r.y), r.w, 1);
      g.fillStyle = R.lilac;
      for (let x = 2; x < r.w; x += 5) g.fillRect(X(r.x) + x, Y(r.y) + 3, 2, 3);
      // The display above the doors.
      const dx = X(r.x + r.w / 2 - 5);
      const dy = Y(e.rect.y - 22);
      g.fillStyle = R.night;
      g.fillRect(dx, dy, 11, 9);
      const flicker = !f.reducedMotion && Math.floor(f.time * 60) % Math.round(ELEVATOR_FLICKER_EVERY * 60) === 0;
      g.fillStyle = flicker ? R.scarlet : R.emerald;
      for (let k = 0; k < 4; k++) {
        const w = 1 + k * 2;
        // ▲ (narrow at the top), and for a single frame, ▼.
        const yy = flicker ? dy + 5 - k : dy + 2 + k;
        g.fillRect(dx + 5 - k, yy, w, 1);
      }
    });

    // Signs (the words are shown by the page when you're close).
    for (const sign of m.signs) {
      if (!this.inView(sign.x - 5, sign.y - 10, 10, 10, cam)) continue;
      g.drawImage(sprite(sign.warning ? WARNING : SIGN, sign.warning ? "warning" : "sign"), X(sign.x - 4), Y(sign.y - 10));
    }

    // Lost Feathers, bobbing (gone once picked up on this climb).
    m.feathers.forEach((fe) => {
      if (s.feathers & (1 << fe.index)) return;
      if (!this.inView(fe.x, fe.y, 6, 6, cam)) return;
      const bob = f.reducedMotion ? 0 : Math.round(Math.sin(f.time * 2.4 + fe.index) * 1.5);
      g.fillStyle = `rgba(${rgb(R.gold)},0.25)`;
      g.fillRect(X(fe.x) - 2, Y(fe.y) - 2 + bob, 10, 10);
      g.drawImage(sprite(FEATHER, "feather"), X(fe.x), Y(fe.y) + bob);
      if (!f.reducedMotion && Math.floor(f.time * 3 + fe.index) % 4 === 0) {
        g.fillStyle = R.white;
        g.fillRect(X(fe.x) + 5, Y(fe.y) - 1 + bob, 1, 1);
      }
    });

    // The joke checkpoint (a little smaller than a real flag: that's the tell).
    for (const j of m.jokes) {
      if (!this.inView(j.x, j.y, 8, 16, cam)) continue;
      g.fillStyle = R.fog;
      g.fillRect(X(j.x + 1), Y(j.y + 1), 1, 13);
      g.drawImage(sprite(JOKE_CLOTH, "joke"), X(j.x + 2), Y(j.y + 1));
    }

    // The summits' poles, and the flags Pip plants on them.
    if (!s.collapsed) this.drawPole(m.fakeFlag, f.flags.fake, f);
    this.drawPole(m.realFlag, f.flags.real, f);

    // Assist checkpoints.
    for (const k of f.climb.checkpoints) {
      if (!this.inView(k.x, k.y - 8, 8, 20, cam)) continue;
      g.fillStyle = R.fog;
      g.fillRect(X(k.x + 3), Y(k.y - 4), 1, 16);
      g.fillStyle = R.aqua;
      g.fillRect(X(k.x + 4), Y(k.y - 4), 4, 3);
    }
  }

  private drawPole(r: { x: number; y: number; w: number; h: number }, raised: number, f: Frame) {
    const g = this.g;
    if (!this.inView(r.x - 2, r.y - 4, 12, r.h + 4, f.cam)) return;
    const x = Math.round(r.x + 1 - f.cam.x);
    const y = Math.round(r.y - f.cam.y);
    g.fillStyle = R.fog;
    g.fillRect(x, y, 1, r.h);
    g.fillStyle = R.white;
    g.fillRect(x, y - 1, 1, 1);
    g.fillStyle = R.gold;
    g.fillRect(x - 1, y - 2, 3, 1);
    if (raised < 0) return;
    const wave = f.reducedMotion ? 0 : Math.floor(f.time * 6) % 2;
    const cy = Math.round(y + r.h - 6 - (r.h - 7) * Math.min(1, raised));
    g.drawImage(sprite(FLAG_CLOTH, `cloth${wave}`, false), x + 1, cy + wave);
  }

  /** Wind: streaks blowing across, and pennants on the walls that show which way and how hard. */
  private drawWind(f: Frame) {
    const m = this.m!;
    const g = this.g;
    const s = f.climb.sim;
    for (const w of m.wind) {
      const r = w.rect;
      if (!this.inView(r.x, r.y, r.w, r.h, f.cam)) continue;
      const on = windOn(w.pattern, s.tick);
      const strength = Math.min(1, Math.abs(w.push) / 0.03);
      const dir = Math.sign(w.push);
      // Pennants on both walls, every few rows.
      for (let py = r.y + 16; py < r.y + r.h; py += 56) {
        for (const px of [r.x + 2, r.x + r.w - 10]) {
          const x = Math.round(px - f.cam.x);
          const y = Math.round(py - f.cam.y);
          if (y < -10 || y > VIEW_H) continue;
          g.fillStyle = R.fog;
          g.fillRect(x + 4, y, 1, 10);
          const len = on ? 3 + Math.round(strength * 6) : 2;
          const flap = !f.reducedMotion && on ? Math.floor(f.time * 10 + px) % 2 : 0;
          g.fillStyle = R.scarlet;
          for (let k = 0; k < len; k++) {
            const h = on ? 3 - Math.floor(k / 3) : 4 - Math.floor(k / 2);
            const xx = on ? x + 4 + dir * (k + 1) : x + 5;
            const yy = on ? y + flap * (k % 2) : y + k;
            g.fillRect(dir < 0 && on ? xx - 1 : xx, yy, 1, Math.max(1, h));
          }
        }
      }
      if (!on || f.reducedMotion) continue;
      // Streaks.
      const n = Math.round(6 + strength * 14);
      for (let i = 0; i < n; i++) {
        const speed = 90 + hash(i, 7) * 80 * (0.5 + strength);
        const len = 6 + Math.round(hash(i, 8) * 10 * strength);
        const yy = r.y + hash(i, 9, r.y) * r.h;
        let xx = (hash(i, 10) * r.w + f.time * speed) % (r.w + len);
        if (dir < 0) xx = r.w - xx;
        g.fillStyle = `rgba(255,255,255,${0.18 + 0.2 * strength})`;
        g.fillRect(Math.round(r.x + xx - f.cam.x), Math.round(yy - f.cam.y), len, 1);
      }
    }
  }

  private pipFrame(f: Frame): PipFrame {
    const p = f.climb.sim.pip;
    if (f.climb.story === "credits" || f.climb.story === "summit") return "plant";
    if (p.stun > 0) return "stun";
    if (p.grounded) {
      if (p.charge > 0) return p.charge < CHARGE_MAX / 3 ? "charge0" : p.charge < (CHARGE_MAX * 2) / 3 ? "charge1" : "charge2";
      if (Math.abs(p.x - this.lastX) > 0.01) {
        this.walkPhase += Math.abs(p.x - this.lastX);
        return Math.floor(this.walkPhase / 5) % 2 ? "walk1" : "walk0";
      }
      return Math.floor(f.time * 10) % 37 === 0 ? "blink" : "idle";
    }
    return p.vy < 0 ? "rise" : "fall";
  }

  private drawPip(f: Frame) {
    const g = this.g;
    const p = f.climb.sim.pip;
    const x = f.prev.x + (p.x - f.prev.x) * f.alpha;
    const y = f.prev.y + (p.y - f.prev.y) * f.alpha;
    const frame = this.pipFrame(f);
    this.lastX = p.x;
    const flip = p.facing < 0;
    const art = sprite(PIP[frame]!, `pip:${frame}`, flip);
    // Facing right the backpack hangs out to the left; facing left, to the right.
    const ax = Math.round(x - f.cam.x) - (flip ? art.width - PIP_ART_X - 8 : PIP_ART_X);
    const ay = Math.round(y - f.cam.y) + p.h - art.height;
    // A glow while charging (the meter is the squat).
    if (p.charge > 0 && p.grounded) {
      const t = p.charge / CHARGE_MAX;
      g.fillStyle = `rgba(${rgb(t > 0.95 ? R.white : R.gold)},${0.15 + t * 0.35})`;
      g.fillRect(ax - 1 + (flip ? 0 : PIP_ART_X), ay + art.height + 1, Math.round(10 * t), 1);
    }
    g.drawImage(art, ax, ay);
    // The hat.
    const head = HEAD_TOP[frame];
    if (f.hat !== null && head) {
      const hat = HATS[f.hat];
      if (hat) {
        const h = sprite(hat.rows, `hat:${f.hat}`, flip);
        const hx = Math.round(x - f.cam.x) + (flip ? -1 - head.x : head.x) + Math.round((8 - h.width) / 2) + (flip ? 0 : 1);
        const hy = ay + head.y - h.height + 1;
        g.drawImage(h, hx, hy);
      }
    }
  }

  private drawChirp(c: ChirpView, f: Frame) {
    const flap = Math.floor(f.time * (c.mood === "troll" ? 9 : 7)) % 2;
    const rows = c.mood === "troll" ? (flap ? CHIRP.front1! : CHIRP.front0!) : flap ? CHIRP.side1! : CHIRP.side0!;
    const art = sprite(rows, `chirp:${c.mood}:${flap}`, c.mood === "sincere" && !c.right);
    this.g.drawImage(art, Math.round(c.x - f.cam.x - art.width / 2), Math.round(c.y - f.cam.y - art.height / 2));
  }

  private drawPreview(points: ReadonlyArray<{ x: number; y: number }>, cam: { x: number; y: number }) {
    const g = this.g;
    g.fillStyle = `rgba(${rgb(R.aqua)},0.85)`;
    points.forEach((pt, i) => {
      if (i % 3) return;
      g.fillRect(Math.round(pt.x - cam.x), Math.round(pt.y - cam.y), 1, 1);
    });
    const end = points[points.length - 1];
    if (end) {
      g.fillStyle = R.aqua;
      g.fillRect(Math.round(end.x - cam.x) - 2, Math.round(end.y - cam.y), 5, 1);
    }
  }

  /** Inside the mountain: dark, but for Pip's lamp (and the mushrooms' glow). */
  private drawDark(f: Frame) {
    const g = this.g;
    const m = this.m!;
    if (!this.dark) {
      this.dark = document.createElement("canvas");
      this.dark.width = VIEW_W;
      this.dark.height = VIEW_H;
    }
    const d = this.dark.getContext("2d")!;
    d.globalCompositeOperation = "source-over";
    d.clearRect(0, 0, VIEW_W, VIEW_H);
    d.fillStyle = "rgba(14,10,18,0.88)";
    d.fillRect(0, 0, VIEW_W, VIEW_H);
    d.globalCompositeOperation = "destination-out";
    const p = f.climb.sim.pip;
    const px = f.prev.x + (p.x - f.prev.x) * f.alpha - f.cam.x + p.w / 2;
    const py = f.prev.y + (p.y - f.prev.y) * f.alpha - f.cam.y + 2;
    const flickerR = f.reducedMotion ? 0 : Math.sin(f.time * 9) * 1.5;
    const light = (x: number, y: number, r: number, strength: number) => {
      const grad = d.createRadialGradient(x, y, 2, x, y, r);
      grad.addColorStop(0, `rgba(0,0,0,${strength})`);
      grad.addColorStop(0.6, `rgba(0,0,0,${strength * 0.75})`);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      d.fillStyle = grad;
      d.fillRect(x - r, y - r, r * 2, r * 2);
    };
    light(px, py, 100 + flickerR, 1);
    // Mushrooms glow a little, so you can find them.
    const tx0 = Math.floor(f.cam.x / TILE);
    const ty0 = Math.floor(f.cam.y / TILE);
    for (let r = 0; r <= ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (tileAt(m, tx0 + c, ty0 + r) === T.MUSHROOM) light(c * TILE + 4, r * TILE + 2, 22, 0.55);
      }
    }
    for (const fe of m.feathers) if (!(f.climb.sim.feathers & (1 << fe.index))) light(fe.x - f.cam.x + 3, fe.y - f.cam.y + 3, 16, 0.6);
    for (const sign of m.signs) light(sign.x - f.cam.x, sign.y - f.cam.y - 6, 14, 0.4);
    d.globalCompositeOperation = "source-over";
    g.drawImage(this.dark, 0, 0);
    // The ledges' glowing edges, over the dark: you can always see where to jump.
    const col = Math.round(f.cam.x / VIEW_W);
    for (let gr = Math.floor(f.cam.y / VIEW_H); gr <= Math.floor((f.cam.y + VIEW_H - 1) / VIEW_H); gr++) {
      const screen = screenOf(m, col, 39 - gr);
      if (!screen || !ZONE_LOOK[screen.zone].dark) continue;
      g.globalAlpha = 0.55;
      g.drawImage(screenGlow(m, screen, f.climb.sim.collapsed), 0, Math.round(gr * VIEW_H - f.cam.y));
      g.globalAlpha = 1;
    }
    // A warm tint around the lamp.
    g.fillStyle = `rgba(${rgb(R.gold)},0.06)`;
    g.beginPath();
    g.arc(px, py, 40, 0, Math.PI * 2);
    g.fill();
  }
}

/** A little colour for things drawn by the page (signs' bubbles). */
export const signColour = (warning: boolean) => (warning ? mix(R.scarlet, R.white, 0.1) : R.tan);
