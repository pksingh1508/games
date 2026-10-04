// One climb, from the foot of the mountain to the real summit (Plan/08-almost-there.md §3, §7):
// the simulation plus everything the game remembers about it (the clock, jumps, falls, metres
// fallen, zone splits, the story so far). Plain JSON, saved four times a second and on every jump
// and landing, so a reload carries on exactly where it was, mid-fall included.
import { ENGINE_VERSION, FALL_MIN, TILE, VIEW_H } from "./constants";
import { isSolidTile, screenAt, screenOf, T, tileAt, type Mountain, type ZoneId } from "./mountain";
import { cloneClimb, collapse, createClimb, step, type ClimbState, type SimEvent } from "./sim";

export interface ClimbStats {
  /** Ticks on the clock (it stops while paused and during the fake credits). */
  ticks: number;
  jumps: number;
  /** Landings at least FALL_MIN below where you took off (the summit's collapse doesn't count). */
  falls: number;
  /** Height lost in those falls (px). */
  fallen: number;
  biggest: number;
}

/**
 * - climbing: on the way up.
 * - credits: Pip planted the flag on the fake summit; the credits are rolling (the climb waits).
 * - fallen: the fake summit fell; the rest of the mountain is open.
 * - summit: the real summit. The climb is over.
 */
export type Story = "climbing" | "credits" | "fallen" | "summit";

export interface Climb {
  /** The physics (and map) this climb was saved with. */
  engine: number;
  mirrored: boolean;
  sim: ClimbState;
  stats: ClimbStats;
  /** The clock when each zone was first reached. */
  splits: Partial<Record<ZoneId, number>>;
  story: Story;
  /** In the summit's collapse: the next landing isn't your fall. */
  scripted: boolean;
  /** Where Pip last stood still on solid ground (an old save restarts there). */
  stand: { x: number; y: number };
  /** The highest Pip's feet have been (y; smaller is higher). */
  best: number;
  /** Assist was on at some point (Plan §3: assist runs are marked). */
  assisted: boolean;
  /** Assist checkpoints: up to 3 per zone (Plan §3). */
  checkpoints: Array<{ x: number; y: number; zone: ZoneId }>;
  /** Lines Chirp has said, and the tick it may talk again. */
  chirp: { n: number; quiet: number };
}

export const CHECKPOINTS_PER_ZONE = 3;

export function newClimb(m: Mountain): Climb {
  const sim = createClimb(m);
  return {
    engine: ENGINE_VERSION,
    mirrored: m.mirrored,
    sim,
    stats: { ticks: 0, jumps: 0, falls: 0, fallen: 0, biggest: 0 },
    splits: { foothills: 0 },
    story: "climbing",
    scripted: false,
    stand: { x: sim.pip.x, y: sim.pip.y },
    best: sim.pip.y + sim.pip.h,
    assisted: false,
    checkpoints: [],
    chirp: { n: 0, quiet: 0 },
  };
}

export const cloneWhole = (c: Climb): Climb => ({
  ...c,
  sim: cloneClimb(c.sim),
  stats: { ...c.stats },
  splits: { ...c.splits },
  stand: { ...c.stand },
  checkpoints: c.checkpoints.map((p) => ({ ...p })),
  chirp: { ...c.chirp },
});

/** The screen Pip's middle is in (the camera shows this one). */
export function pipScreen(c: Climb): { col: number; row: number } {
  const p = c.sim.pip;
  return screenAt(p.x + p.w / 2, p.y + p.h / 2);
}

export function zoneAt(m: Mountain, x: number, y: number): ZoneId {
  const { col, row } = screenAt(x, y);
  return screenOf(m, col, row)?.zone ?? "foothills";
}

export const pipZone = (m: Mountain, c: Climb) => zoneAt(m, c.sim.pip.x + c.sim.pip.w / 2, c.sim.pip.y + c.sim.pip.h / 2);

export type ClimbEvent =
  | SimEvent
  /** The camera cut to another screen. */
  | { type: "screen"; col: number; row: number; from: { col: number; row: number } }
  /** A zone reached for the first time this climb. */
  | { type: "zone"; zone: ZoneId }
  /** A fall, with the height lost (px), counted in the stats. */
  | { type: "fell"; drop: number; screens: number };

/** One tick of the climb (1/60 s). Mutates the climb. */
export function tickClimb(m: Mountain, c: Climb, bits: number): ClimbEvent[] {
  const before = pipScreen(c);
  const events: ClimbEvent[] = step(m, c.sim, c.story === "summit" ? 0 : bits);
  c.stats.ticks++;
  const p = c.sim.pip;
  const feet = p.y + p.h;
  for (const e of events.slice()) {
    if (e.type === "jump") c.stats.jumps++;
    else if (e.type === "land") {
      if (c.scripted) c.scripted = false;
      else if (e.drop >= FALL_MIN) {
        c.stats.falls++;
        c.stats.fallen += e.drop;
        c.stats.biggest = Math.max(c.stats.biggest, e.drop);
        events.push({ type: "fell", drop: e.drop, screens: e.drop / VIEW_H });
      }
    } else if (e.type === "fakeSummit") {
      if (c.story === "climbing") c.story = "credits";
    } else if (e.type === "summit") c.story = "summit";
  }
  if (feet < c.best) c.best = feet;
  if (stillOnRock(m, c)) c.stand = { x: p.x, y: p.y };

  const now = pipScreen(c);
  if (now.col !== before.col || now.row !== before.row) {
    events.push({ type: "screen", col: now.col, row: now.row, from: before });
    const zone = screenOf(m, now.col, now.row)?.zone;
    if (zone && c.splits[zone] === undefined) {
      c.splits[zone] = c.stats.ticks;
      events.push({ type: "zone", zone });
    }
  }
  return events;
}

/** Standing still on rock, ice or snow (somewhere a reload can safely put you back). */
function stillOnRock(m: Mountain, c: Climb): boolean {
  const p = c.sim.pip;
  if (!p.grounded || p.vx !== 0 || p.charge !== 0) return false;
  const feet = p.y + p.h;
  if (feet % TILE !== 0) return false;
  const ty = feet / TILE;
  for (const tx of [Math.floor(p.x / TILE), Math.floor((p.x + p.w - 1) / TILE)]) {
    const code = tileAt(m, tx, ty);
    if (!isSolidTile(code, c.sim.collapsed) || code === T.CRUMBLE) return false;
  }
  return true;
}

/** The credits are over: the summit falls and Pip with it. */
export function collapseSummit(c: Climb) {
  collapse(c.sim);
  c.story = "fallen";
  c.scripted = true;
}

/** Pip is somewhere it can't be (inside rock). */
function embedded(m: Mountain, c: Climb): boolean {
  const p = c.sim.pip;
  for (let ty = Math.floor(p.y / TILE); ty <= Math.floor((p.y + p.h - 1) / TILE); ty++) {
    for (let tx = Math.floor(p.x / TILE); tx <= Math.floor((p.x + p.w - 1) / TILE); tx++) {
      if (isSolidTile(tileAt(m, tx, ty), c.sim.collapsed)) return true;
    }
  }
  return false;
}

/**
 * A saved climb, ready to carry on. A charge in progress is let go of (that was your thumb, not
 * Pip's momentum): Pip stands up again. A climb from older physics (or an older map) goes back to
 * where Pip last stood still, the same height, nothing lost.
 */
export function resumeClimb(m: Mountain, saved: Climb): Climb {
  const c = cloneWhole(saved);
  const p = c.sim.pip;
  if (p.grounded && p.charge > 0) p.charge = 0;
  p.latch = false;
  if (c.story === "summit") return c;
  const stale = c.engine !== ENGINE_VERSION || c.sim.elevators.length !== m.elevators.length || embedded(m, c);
  if (stale) {
    const fresh = createClimb(m);
    c.sim = {
      ...fresh,
      tick: c.sim.tick,
      collapsed: c.sim.collapsed,
      feathers: c.sim.feathers,
      pip: { ...fresh.pip, x: c.stand.x, y: c.stand.y, takeoff: c.stand.y + p.h, peak: c.stand.y + p.h, facing: p.facing },
    };
    c.engine = ENGINE_VERSION;
    // Still stuck (the map changed under it)? Up until there's room.
    for (let i = 0; i < 400 && embedded(m, c); i++) c.sim.pip.y -= 1;
    if (embedded(m, c)) {
      c.sim.pip.x = m.start.x;
      c.sim.pip.y = m.start.y;
    }
    c.sim.pip.grounded = false;
  }
  return c;
}

/** Assist: a checkpoint where Pip stands (up to 3 per zone; the oldest in the zone goes). */
export function plantCheckpoint(m: Mountain, c: Climb): boolean {
  const p = c.sim.pip;
  if (!p.grounded || p.charge > 0 || (c.story !== "climbing" && c.story !== "fallen")) return false;
  const zone = pipZone(m, c);
  const inZone = c.checkpoints.filter((k) => k.zone === zone);
  if (inZone.some((k) => Math.abs(k.x - p.x) < 4 && k.y === p.y)) return false;
  if (inZone.length >= CHECKPOINTS_PER_ZONE) c.checkpoints.splice(c.checkpoints.indexOf(inZone[0]!), 1);
  c.checkpoints.push({ x: p.x, y: p.y, zone });
  c.assisted = true;
  return true;
}

/** Assist: back to the newest checkpoint. */
export function returnToCheckpoint(c: Climb): boolean {
  const k = c.checkpoints.at(-1);
  if (!k || c.story === "credits" || c.story === "summit") return false;
  const p = c.sim.pip;
  Object.assign(p, { x: k.x, y: k.y, vx: 0, vy: 0, rx: 0, ry: 0, charge: 0, stun: 0, grounded: false, takeoff: k.y + p.h, peak: k.y + p.h });
  c.scripted = false;
  c.assisted = true;
  return true;
}
