// Rain and dust: the tells of Worlds 2 and 3 (Plan/05-fake-floor.md §3, §12). Raindrops really
// fall and really hit things: they splash on whatever is solid (invisible floors too) and fall
// straight through fakes. The rain comes in gusts, on a beat you can hear; a mimic's fake splashes
// come between the gusts, out of time. Dust drifts down and settles on anything real.
// Purely visual (its own random numbers), but it reads the world, so it never lies.
import { TILE, VIEW_H, VIEW_W } from "../core/constants";
import { AIR, cellAt, ROCK, type Room } from "../core/room";
import { floorSolid, type World } from "../core/world";
import { E } from "./palette";

/** One gust every this many seconds; the rain sound swells with it. */
export const GUST_PERIOD = 2.4;

/** How hard it's gusting at `time` (0–1). Shared with the rain's sound. */
export const gustAt = (time: number) => 0.5 + 0.5 * Math.sin((time / GUST_PERIOD) * Math.PI * 2);

const RAIN_AMOUNT = { none: 0, light: 0.45, steady: 1, heavy: 1.7 } as const;

interface Drop {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Splash {
  x: number;
  y: number;
  t: number;
  big: boolean;
}

interface Mote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Ticks resting on something (0 while falling). */
  rest: number;
}

const MAX_DROPS = 320;

export class Weather {
  private drops: Drop[] = [];
  private splashes: Splash[] = [];
  private motes: Mote[] = [];
  private seed = 9001;
  private room: Room | null = null;
  private rain = 0;
  private dust = false;

  private rand(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  setRoom(room: Room) {
    this.room = room;
    this.rain = RAIN_AMOUNT[room.env.rain];
    this.dust = room.env.dust;
    this.drops = [];
    this.splashes = [];
    this.motes = [];
  }

  /** Does rain (or dust) stop here? Solid floors (invisible ones too) and rock. Painted floors hang behind. */
  private catches(w: World, x: number, y: number): boolean {
    const v = cellAt(w.room, Math.floor(x / TILE), Math.floor(y / TILE));
    if (v === ROCK) return y >= 0;
    if (v === AIR) return false;
    return floorSolid(w, v) && w.room.floors[v]!.kind !== "painted";
  }

  tick(w: World, cam: number, time: number, highContrast: boolean) {
    const room = this.room;
    if (!room) return;
    const gust = gustAt(time);
    const left = cam - 48;
    const right = cam + VIEW_W + 48;

    if (this.rain > 0) {
      // New drops: more in the gusts.
      const want = this.rain * (1.2 + 3.2 * gust);
      for (let n = want + this.rand(); n >= 1 && this.drops.length < MAX_DROPS; n--) {
        this.drops.push({ x: left + this.rand() * (right - left + 40), y: -8 - this.rand() * 30, vx: -0.9 - gust * 0.6, vy: 5.5 + this.rand() * 1.5 });
      }
      this.drops = this.drops.filter((d) => {
        d.x += d.vx;
        d.y += d.vy;
        if (d.y > VIEW_H + 8) return false;
        if (this.catches(w, d.x, d.y)) {
          this.splashes.push({ x: d.x, y: Math.floor(d.y / TILE) * TILE, t: 0, big: highContrast });
          return false;
        }
        return true;
      });

      // Splashes too small to see the drop for, so every real floor gets its share; and the
      // mimics' fake ones, between the gusts.
      const first = Math.max(0, Math.floor(left / TILE));
      const last = Math.min(room.cols - 1, Math.ceil(right / TILE));
      for (let i = 0; i < room.floors.length; i++) {
        const f = room.floors[i]!;
        if (f.c < first || f.c > last) continue;
        if (f.kind === "mimic") {
          const offbeat = (1 - gust) ** 2;
          if (this.rand() < this.rain * 0.09 * offbeat) this.splashes.push({ x: f.x + 2 + this.rand() * 12, y: f.y, t: 0, big: highContrast });
        } else if (f.kind !== "painted" && floorSolid(w, i) && this.rand() < this.rain * (0.012 + 0.04 * gust) * (highContrast ? 1.6 : 1)) {
          this.splashes.push({ x: f.x + 2 + this.rand() * 12, y: f.y, t: 0, big: highContrast });
        }
      }
    }

    if (this.dust) {
      if (this.rand() < 0.35) this.motes.push({ x: left + this.rand() * (right - left), y: -4, vx: (this.rand() - 0.5) * 0.15, vy: 0.35 + this.rand() * 0.3, rest: 0 });
      // Dust already settling on floors (real and invisible alike).
      for (let i = 0; i < room.floors.length; i++) {
        const f = room.floors[i]!;
        if (f.x < left || f.x > right || f.kind === "painted" || !floorSolid(w, i)) continue;
        const rate = f.kind === "invisible" ? 0.03 : 0.006;
        if (this.rand() < rate * (highContrast ? 1.8 : 1)) this.motes.push({ x: f.x + 1 + this.rand() * 14, y: f.y - 1, vx: 0, vy: 0, rest: 1 });
      }
      this.motes = this.motes.filter((m) => {
        if (m.rest > 0) {
          m.rest++;
          // Gone if what it rests on goes, or after a while.
          return m.rest < 150 && this.catches(w, m.x, m.y + 2);
        }
        m.x += m.vx + Math.sin((m.y + m.x) / 20) * 0.1;
        m.y += m.vy;
        if (m.y > VIEW_H) return false;
        if (this.catches(w, m.x, m.y + 1)) {
          m.y = Math.floor((m.y + 1) / TILE) * TILE - 1;
          m.rest = 1;
        }
        return m.x > left - 20 && m.x < right + 20;
      });
      if (this.motes.length > 260) this.motes.splice(0, this.motes.length - 260);
    }

    for (const s of this.splashes) s.t++;
    this.splashes = this.splashes.filter((s) => s.t < 10);
    if (this.splashes.length > 400) this.splashes.splice(0, this.splashes.length - 400);
  }

  /** Falling rain and splashes, in room coordinates (the caller has translated by the camera). */
  drawRain(g: CanvasRenderingContext2D) {
    if (!this.rain) return;
    g.fillStyle = "rgba(192, 203, 220, 0.55)";
    for (const d of this.drops) {
      for (let k = 0; k < 5; k++) g.fillRect(Math.round(d.x - d.vx * k * 0.3), Math.round(d.y - k * 1.2), 1, 1);
    }
    for (const s of this.splashes) {
      // A little crown: a flash on the surface, two droplets thrown out and up.
      const t = s.t;
      const x = Math.round(s.x);
      const reach = s.big ? 1.6 : 1.15;
      const rise = Math.round((t < 5 ? t : 10 - t) * 0.8 * reach);
      g.fillStyle = t < 4 ? E.white : E.mist;
      if (t < 4) g.fillRect(x - 2, s.y - 1, 5, 1);
      const out = Math.round((1 + t * 0.7) * reach);
      g.fillRect(x - out, s.y - 1 - rise, 1, 2);
      g.fillRect(x + out, s.y - 1 - rise, 1, 2);
      if (t < 6) g.fillRect(x, s.y - 2 - Math.round(t * reach), 1, 1);
    }
  }

  /** Dust motes (drawn over the darkness: they catch the lantern light). */
  drawDust(g: CanvasRenderingContext2D) {
    if (!this.dust) return;
    for (const m of this.motes) {
      const fade = m.rest > 0 ? Math.min(1, (150 - m.rest) / 40) : 0.8;
      g.fillStyle = m.rest > 0 ? `rgba(254, 231, 170, ${0.85 * fade})` : "rgba(234, 212, 170, 0.45)";
      g.fillRect(Math.round(m.x), Math.round(m.y), 1, 1);
    }
  }
}
