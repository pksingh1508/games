// The truth anchors (Plan/15-gravity-is-lying.md §3, §12): Newt's scarf (a little rope of linked
// points, Verlet integration), water drips, dust motes and hanging lamps. Each is pulled by the
// real gravity where it is, straight out of the physics, so it can't lie: except in the final
// world, where the drips, the dust and the lamps start lying. The scarf never does.
// They're for the eyes only: simulated alongside the room, never part of it.
import { NEWT, TILE } from "../core/constants";
import { VEC, type Vec } from "../core/gravity";
import { orbitDown } from "../core/orbit";
import type { Room } from "../core/room";
import { gravityAt, newtCentre, wallAt, type World } from "../core/world";

const SCARF_POINTS = 9;
const SCARF_LINK = 3.2;

/** The real down at a point (a unit vector, or nothing in deep space). */
export function trueDown(w: World, x: number, y: number): Vec | null {
  if (w.room.kind === "orbit") return orbitDown(w.room, x, y);
  return VEC[gravityAt(w, x, y)];
}

/** What the drips, dust and lamps believe (the truth, except where they lie). */
export function anchorDown(w: World, x: number, y: number): Vec | null {
  if (w.room.anchorsLie) return VEC[w.room.anchorsLie];
  return trueDown(w, x, y);
}

/** A stable little hash in [0, 1). */
export function hash(a: number, b = 0, c = 0): number {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

interface Point {
  x: number;
  y: number;
  px: number;
  py: number;
}

export interface Drop {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface Splash {
  x: number;
  y: number;
  life: number;
}

export interface Mote {
  x: number;
  y: number;
  seed: number;
}

export interface Lamp {
  /** Where it hangs from. */
  x: number;
  y: number;
  /** The bob's angle (radians, measured like atan2 of the chain) and its spin. */
  angle: number;
  spin: number;
}

export class Anchors {
  scarf: Point[] = [];
  drops: Drop[] = [];
  splashes: Splash[] = [];
  motes: Mote[] = [];
  lamps: Lamp[] = [];
  private room: Room | null = null;
  private tick = 0;
  private spawned = 0;

  reset(w: World) {
    this.room = w.room;
    this.tick = 0;
    const c = newtCentre(w);
    const down = trueDown(w, c.x, c.y) ?? { x: 0, y: 1 };
    this.scarf = Array.from({ length: SCARF_POINTS }, (_, i) => {
      const x = c.x - down.x * 4 + down.x * i * SCARF_LINK * 0.5 - i * 1.5;
      const y = c.y - down.y * 4 + down.y * i * SCARF_LINK;
      return { x, y, px: x, py: y };
    });
    this.drops = [];
    this.splashes = [];
    const room = w.room;
    this.motes = Array.from({ length: room.kind === "orbit" ? 70 : 36 }, (_, i) => ({ x: hash(i, 1) * room.w, y: hash(i, 2) * room.h, seed: i }));
    this.lamps = room.anchors
      .filter((a) => a.kind === "lamp")
      .map((a) => {
        const d = anchorDown(w, a.x, a.y) ?? { x: 0, y: 1 };
        return { x: a.x, y: a.y, angle: Math.atan2(d.y, d.x), spin: 0 };
      });
    this.spawned = 0;
  }

  /** One tick, after the room's. */
  step(w: World) {
    if (this.room !== w.room) this.reset(w);
    this.tick++;
    this.stepScarf(w);
    this.stepDrips(w);
    this.stepDust(w);
    this.stepLamps(w);
  }

  private stepScarf(w: World) {
    const c = newtCentre(w);
    const down = trueDown(w, c.x, c.y);
    // Tied round Newt's neck, a little above the middle.
    const head = this.scarf[0]!;
    head.px = head.x;
    head.py = head.y;
    head.x = c.x - (down?.x ?? 0) * 3;
    head.y = c.y - (down?.y ?? 0) * 3;
    for (let i = 1; i < this.scarf.length; i++) {
      const p = this.scarf[i]!;
      // Each bit of the scarf feels the gravity where it is: dangle the tip into a zone and it
      // bends the zone's way, before you step in. (The truth, always: even in the tree.)
      const here = trueDown(w, p.x, p.y);
      const g = here ? { x: here.x * 0.32, y: here.y * 0.32 } : { x: 0, y: 0 };
      const vx = (p.x - p.px) * 0.9;
      const vy = (p.y - p.py) * 0.9;
      p.px = p.x;
      p.py = p.y;
      // A little flutter at the tip.
      const flutter = Math.sin(this.tick * 0.21 + i) * 0.05 * (i / this.scarf.length);
      p.x += vx + g.x + flutter * (here ? -here.y : 1);
      p.y += vy + g.y + flutter * (here ? here.x : 0);
    }
    for (let k = 0; k < 3; k++) {
      for (let i = 1; i < this.scarf.length; i++) {
        const a = this.scarf[i - 1]!;
        const b = this.scarf[i]!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 0.001;
        const diff = (d - SCARF_LINK) / d;
        if (i === 1) {
          b.x -= dx * diff;
          b.y -= dy * diff;
        } else {
          a.x += dx * diff * 0.5;
          a.y += dy * diff * 0.5;
          b.x -= dx * diff * 0.5;
          b.y -= dy * diff * 0.5;
        }
      }
      for (let i = 1; i < this.scarf.length; i++) this.collide(w, this.scarf[i]!);
    }
  }

  /** The scarf drapes over floors and planets instead of sinking into them. */
  private collide(w: World, p: Point) {
    const room = w.room;
    if (room.kind === "orbit") {
      for (const planet of room.planets) {
        if (planet.fake) continue;
        const dx = p.x - planet.x;
        const dy = p.y - planet.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d >= planet.r + 0.5) continue;
        const nx = dx / d;
        const ny = dy / d;
        const vx = p.x - p.px;
        const vy = p.y - p.py;
        p.x = planet.x + nx * (planet.r + 0.5);
        p.y = planet.y + ny * (planet.r + 0.5);
        // Keep a little of the sliding, none of the sinking.
        const along = vx * -ny + vy * nx;
        p.px = p.x - -ny * along * 0.6;
        p.py = p.y - nx * along * 0.6;
      }
      return;
    }
    if (!wallAt(room, p.x, p.y)) return;
    const col = Math.floor(p.x / TILE);
    const row = Math.floor(p.y / TILE);
    const x0 = col * TILE;
    const y0 = row * TILE;
    const open = (c: number, r: number) => c >= 0 && r >= 0 && c < room.cols && r < room.rows && !wallAt(room, c * TILE + 1, r * TILE + 1);
    // Back out the side it came in through (or failing that, the nearest open side, inside the room).
    const exits = [
      { ok: open(col, row - 1), x: p.x, y: y0 - 0.3, dist: p.y - y0, from: p.py < y0, vertical: true },
      { ok: open(col, row + 1), x: p.x, y: y0 + TILE + 0.3, dist: y0 + TILE - p.y, from: p.py >= y0 + TILE, vertical: true },
      { ok: open(col - 1, row), x: x0 - 0.3, y: p.y, dist: p.x - x0, from: p.px < x0, vertical: false },
      { ok: open(col + 1, row), x: x0 + TILE + 0.3, y: p.y, dist: x0 + TILE - p.x, from: p.px >= x0 + TILE, vertical: false },
    ].filter((e) => e.ok);
    if (!exits.length) {
      p.x = p.px;
      p.y = p.py;
      return;
    }
    exits.sort((a, b) => Number(b.from) - Number(a.from) || a.dist - b.dist);
    const exit = exits[0]!;
    const vx = p.x - p.px;
    const vy = p.y - p.py;
    p.x = exit.x;
    p.y = exit.y;
    // Keep a little of the sliding along the surface, none of the sinking into it.
    p.px = p.x - (exit.vertical ? vx * 0.6 : 0);
    p.py = p.y - (exit.vertical ? 0 : vy * 0.6);
  }

  private stepDrips(w: World) {
    const room = w.room;
    room.anchors.forEach((a, i) => {
      if (a.kind !== "drip") return;
      if ((this.tick + i * 23) % 64 !== 0) return;
      // From the dropper's tip.
      const down = anchorDown(w, a.x, a.y) ?? { x: 0, y: 1 };
      this.drops.push({ x: a.x + down.x * 5, y: a.y + down.y * 5, vx: 0, vy: 0 });
    });
    const keep: Drop[] = [];
    for (const d of this.drops) {
      const g = anchorDown(w, d.x, d.y) ?? { x: 0, y: 0 };
      d.vx = Math.max(-5, Math.min(5, d.vx + g.x * 0.18));
      d.vy = Math.max(-5, Math.min(5, d.vy + g.y * 0.18));
      d.x += d.vx;
      d.y += d.vy;
      const out = d.x < -8 || d.y < -8 || d.x > room.w + 8 || d.y > room.h + 8;
      const hit = room.kind === "tiles" && wallAt(room, d.x, d.y);
      const planet = room.planets.some((p) => !p.fake && Math.hypot(d.x - p.x, d.y - p.y) < p.r);
      if (hit || planet) this.splashes.push({ x: d.x - d.vx, y: d.y - d.vy, life: 14 });
      if (!out && !hit && !planet && Math.abs(d.vx) + Math.abs(d.vy) < 99) keep.push(d);
    }
    this.drops = keep;
    this.splashes = this.splashes.filter((s) => --s.life > 0);
  }

  private stepDust(w: World) {
    const room = w.room;
    for (const m of this.motes) {
      const g = anchorDown(w, m.x, m.y);
      const wob = Math.sin(this.tick * 0.03 + m.seed * 1.7) * 0.12;
      const speed = 0.22 + hash(m.seed, 3) * 0.2;
      if (g) {
        m.x += g.x * speed + (g.y !== 0 ? wob : 0);
        m.y += g.y * speed + (g.x !== 0 ? wob : 0);
      } else {
        m.x += Math.cos(m.seed) * 0.05;
        m.y += Math.sin(m.seed) * 0.05;
      }
      const inWall = room.kind === "tiles" && wallAt(room, m.x, m.y);
      const inPlanet = room.planets.some((p) => !p.fake && Math.hypot(m.x - p.x, m.y - p.y) < p.r);
      if (inWall || inPlanet || m.x < 0 || m.y < 0 || m.x > room.w || m.y > room.h) {
        // Back in somewhere else (the same somewhere every time).
        this.spawned++;
        m.x = hash(this.spawned, m.seed, 5) * room.w;
        m.y = hash(this.spawned, m.seed, 6) * room.h;
      }
    }
  }

  private stepLamps(w: World) {
    for (const lamp of this.lamps) {
      const g = anchorDown(w, lamp.x, lamp.y);
      if (!g) continue;
      const target = Math.atan2(g.y, g.x);
      let diff = lamp.angle - target;
      while (diff > Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      lamp.spin += -0.012 * Math.sin(diff) * 4 - lamp.spin * 0.04;
      lamp.angle += lamp.spin;
    }
  }
}

/** How long the lamps' chains are (px). */
export const LAMP_CHAIN = TILE * 1.4;
/** Newt's neck, for drawing the scarf's knot. */
export const NECK = NEWT / 2 - 3;
