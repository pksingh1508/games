// One attempt at a room, simulated a tick (1/60 s) at a time (Plan/15-gravity-is-lying.md §3).
// Newt runs and jumps with the shared platformer code in a frame where gravity is down; levers,
// zones, flips and timed turns change which way that is. Timed turns are announced by the hum at
// least 0.75 s before (Plan §10.2). Deterministic: the same inputs always give the same room.
import { overlaps, TileGrid, type Rect } from "@/engine/platformer/physics";
import { createRunner, stepRunner, type Runner } from "@/engine/platformer/runner";
import { FLIP, HAZARD_INSET, HUM_TICKS, JUMP, LEFT, NEWT, RIGHT, TILE, TUNING } from "./constants";
import { clockwise, counterClockwise, localSolids, opposite, toLocal, toWorld, vecToLocal, vecToWorld, type Dir } from "./gravity";
import { asteroidAt, createOrbitNewt, NEWT_R, stepOrbit, type OrbitNewt } from "./orbit";
import { cellAt, SPIKES, WALL, zoneAt, type Room } from "./room";

export type DeathCause = "spikes" | "out" | "asteroid";

export type WorldEvent =
  | { type: "jump" }
  | { type: "land"; impact: number }
  | { type: "bonk" }
  | { type: "step" }
  /** Newt's gravity changed (a zone, a lever, a flip, a turn): Newt turns to face the new up. */
  | { type: "shift"; from: Dir; to: Dir }
  | { type: "flip" }
  /** Tried to flip where you can't (in the air, in a zone). */
  | { type: "noFlip" }
  | { type: "lever"; index: number; dir: Dir }
  /** A timed turn is coming: the hum starts. */
  | { type: "hum"; to: Dir; in: number }
  | { type: "turn"; to: Dir }
  | { type: "apple"; index: number }
  | { type: "death"; cause: DeathCause }
  /** A safety net caught Newt: back where it last stood. */
  | { type: "net"; cause: DeathCause }
  | { type: "isaac"; line: number }
  | { type: "orbital" }
  | { type: "win" };

export interface Newt extends Runner {
  /** The gravity on Newt right now (a zone's, or the room's). */
  gravity: Dir;
  /** Pixels walked since the last footstep. */
  walked: number;
}

export interface World {
  room: Room;
  tick: number;
  /** Tile rooms: Newt, in the room's pixels. */
  newt: Newt;
  /** Orbit rooms: Newt among the planets. */
  orbit: OrbitNewt | null;
  /** The room's gravity (levers, flips and turns change it; zones override it locally). */
  gravity: Dir;
  status: "play" | "dead" | "won";
  /** Golden apples picked up in this attempt (bitmask). */
  apples: number;
  /** The lever Newt is touching (-1: none), so a lever is pulled once per touch. */
  touching: number;
  flipHeld: boolean;
  /** Where Newt last stood safely, and the room's gravity then (for safety nets). */
  safe: { x: number; y: number; gravity: Dir } | null;
  /** Ticks standing on a ceiling (gravity up). */
  ceilingTicks: number;
  /** Isaac's lines already said (bitmask). */
  said: number;
  cause: DeathCause | null;
  /** Assist: every death is caught (back where Newt last stood). */
  netsEverywhere: boolean;
}

export function createWorld(room: Room): World {
  const newt: Newt = { ...createRunner(room.spawn.x, room.spawn.y, NEWT, NEWT), gravity: room.gravity, walked: 0 };
  return {
    room,
    tick: 0,
    newt,
    orbit: room.kind === "orbit" ? createOrbitNewt(room) : null,
    gravity: room.gravity,
    status: "play",
    apples: 0,
    touching: -1,
    flipHeld: false,
    safe: null,
    ceilingTicks: 0,
    said: 0,
    cause: null,
    netsEverywhere: false,
  };
}

export function cloneWorld(w: World): World {
  return {
    ...w,
    newt: { ...w.newt },
    orbit: w.orbit ? { ...w.orbit, run: { ...w.orbit.run }, chain: [...w.orbit.chain] } : null,
    safe: w.safe ? { ...w.safe } : null,
  };
}

const gridCache = new WeakMap<Room, TileGrid>();
export function solidsOf(room: Room): TileGrid {
  let grid = gridCache.get(room);
  if (!grid) {
    grid = new TileGrid(room.cols, room.rows, TILE, (c, r) => cellAt(room, c, r) === WALL);
    gridCache.set(room, grid);
  }
  return grid;
}

/** The turn a timed room makes, and which way gravity points after it. */
function turned(room: Room, d: Dir): Dir {
  const t = room.rotate?.turn;
  return t === "cw" ? clockwise(d) : t === "ccw" ? counterClockwise(d) : opposite(d);
}

/** Ticks until the next timed turn (Infinity: none). */
export function ticksToTurn(room: Room, tick: number): number {
  const r = room.rotate;
  if (!r) return Infinity;
  const phase = (tick + (r.offset ?? 0)) % r.every;
  return phase === 0 ? 0 : r.every - phase;
}

/** The gravity on a point: its zone's, or the room's. */
export function gravityAt(w: World, x: number, y: number): Dir {
  return zoneAt(w.room, x, y)?.dir ?? w.gravity;
}

/** Newt's middle (both kinds of room). */
export function newtCentre(w: World): { x: number; y: number } {
  if (w.orbit) return { x: w.orbit.x, y: w.orbit.y };
  return { x: w.newt.x + NEWT / 2, y: w.newt.y + NEWT / 2 };
}

/** Newt's box (both kinds of room). */
export function newtBox(w: World): Rect {
  if (w.orbit) return { x: w.orbit.x - NEWT_R, y: w.orbit.y - NEWT_R, w: NEWT_R * 2, h: NEWT_R * 2 };
  return { x: w.newt.x, y: w.newt.y, w: NEWT, h: NEWT };
}

export function step(w: World, bits: number): WorldEvent[] {
  const events: WorldEvent[] = [];
  if (w.status !== "play") return events;
  const room = w.room;
  w.tick++;

  // Timed turns: the hum first (at least 0.75 s), then the turn.
  if (room.rotate) {
    const to = ticksToTurn(room, w.tick);
    if (to === HUM_TICKS) events.push({ type: "hum", to: turned(room, w.gravity), in: HUM_TICKS });
    if (to === 0) {
      w.gravity = turned(room, w.gravity);
      events.push({ type: "turn", to: w.gravity });
    }
  }

  const input = { left: (bits & LEFT) !== 0, right: (bits & RIGHT) !== 0, jump: (bits & JUMP) !== 0 };
  const flipPressed = (bits & FLIP) !== 0 && !w.flipHeld;
  w.flipHeld = (bits & FLIP) !== 0;

  if (w.orbit) stepOrbitRoom(w, input, events);
  else stepTiles(w, input, flipPressed, events);

  // Isaac speaks when Newt reaches his cue.
  if (room.isaac) {
    const c = newtCentre(w);
    room.isaac.lines.forEach((line, i) => {
      if (w.said & (1 << i)) return;
      const at = line.at ?? "start";
      const due =
        at === "start"
          ? w.tick === 1
          : typeof at === "number"
            ? w.tick === at
            : c.x >= at[0] * TILE && c.x < (at[0] + at[2]) * TILE && c.y >= at[1] * TILE && c.y < (at[1] + at[3]) * TILE;
      if (due) {
        w.said |= 1 << i;
        events.push({ type: "isaac", line: i });
      }
    });
  }

  // Golden apples and the portal.
  const box = newtBox(w);
  room.apples.forEach((a, i) => {
    if (!(w.apples & (1 << i)) && overlaps(box, a)) {
      w.apples |= 1 << i;
      events.push({ type: "apple", index: i });
    }
  });
  if (w.status === "play" && overlaps(box, inset(room.portal, 3))) {
    w.status = "won";
    events.push({ type: "win" });
  }
  return events;
}

const inset = (r: Rect, by: number): Rect => ({ x: r.x + by, y: r.y + by, w: r.w - by * 2, h: r.h - by * 2 });

function stepTiles(w: World, input: { left: boolean; right: boolean; jump: boolean }, flipPressed: boolean, events: WorldEvent[]) {
  const room = w.room;
  const n = w.newt;
  const size = { w: room.w, h: room.h };

  // The player's flip: only standing on something, and not inside a zone (it has its own gravity).
  if (flipPressed && room.flip) {
    const c = newtCentre(w);
    if (n.grounded && !zoneAt(room, c.x, c.y)) {
      w.gravity = opposite(w.gravity);
      events.push({ type: "flip" });
    } else events.push({ type: "noFlip" });
  }

  // Which way is down for Newt this tick.
  const c0 = newtCentre(w);
  const g = gravityAt(w, c0.x, c0.y);
  if (g !== n.gravity) {
    events.push({ type: "shift", from: n.gravity, to: g });
    n.gravity = g;
    // Newt keeps its momentum (in the room); its footing is gone until it lands again.
    n.grounded = false;
    n.coyote = 0;
    n.rising = false;
  }

  // Run the platformer in Newt's frame.
  const box = toLocal(g, n, size);
  const v = vecToLocal(g, { x: n.vx, y: n.vy });
  const rem = vecToLocal(g, { x: n.rx, y: n.ry });
  const local: Runner = { ...n, x: box.x, y: box.y, w: box.w, h: box.h, vx: v.x, vy: v.y, rx: rem.x, ry: rem.y };
  const before = { x: n.x, y: n.y };
  const ev = stepRunner(local, input, localSolids(g, solidsOf(room), size), TUNING);
  fadeOverspeed(local);
  const back = toWorld(g, local, size);
  const wv = vecToWorld(g, { x: local.vx, y: local.vy });
  const wr = vecToWorld(g, { x: local.rx, y: local.ry });
  Object.assign(n, { x: back.x, y: back.y, vx: wv.x, vy: wv.y, rx: wr.x, ry: wr.y, grounded: local.grounded, coyote: local.coyote, buffer: local.buffer, rising: local.rising, held: local.held, facing: local.facing });
  if (ev.jumped) events.push({ type: "jump" });
  if (ev.landed) events.push({ type: "land", impact: ev.impact });
  if (ev.bonked) events.push({ type: "bonk" });
  if (n.grounded) {
    n.walked += Math.abs(n.x - before.x) + Math.abs(n.y - before.y);
    if (n.walked >= 14) {
      n.walked = 0;
      events.push({ type: "step" });
    }
    if (n.gravity === "up") w.ceilingTicks++;
  }

  // Levers: pulled when you walk into them (once per touch).
  const nb = { x: n.x, y: n.y, w: NEWT, h: NEWT };
  const lever = room.levers.findIndex((l) => overlaps(nb, l));
  if (lever >= 0 && lever !== w.touching) {
    const dir = room.levers[lever]!.dir;
    if (w.gravity !== dir) {
      w.gravity = dir;
      events.push({ type: "lever", index: lever, dir });
    }
  }
  w.touching = lever;

  // Spikes, and the world beyond the room.
  const hit = inset(nb, HAZARD_INSET);
  let cause: DeathCause | null = null;
  const c0x = Math.floor(hit.x / TILE);
  const c1x = Math.floor((hit.x + hit.w - 1) / TILE);
  const r0y = Math.floor(hit.y / TILE);
  const r1y = Math.floor((hit.y + hit.h - 1) / TILE);
  for (let r = r0y; r <= r1y && !cause; r++) for (let c = c0x; c <= c1x && !cause; c++) if (cellAt(room, c, r) === SPIKES) cause = "spikes";
  const cx = n.x + NEWT / 2;
  const cy = n.y + NEWT / 2;
  if (!cause && (cx < -TILE || cx > room.w + TILE || cy < -TILE || cy > room.h + TILE)) cause = "out";
  if (cause) die(w, cause, events);
  else if (n.grounded) w.safe = { x: n.x, y: n.y, gravity: w.gravity };
}

function stepOrbitRoom(w: World, input: { left: boolean; right: boolean; jump: boolean }, events: WorldEvent[]) {
  const room = w.room;
  const o = w.orbit!;
  const ev = stepOrbit(room, o, input);
  if (ev.jumped) events.push({ type: "jump" });
  if (ev.landed) events.push({ type: "land", impact: ev.impact });
  if (ev.orbital) events.push({ type: "orbital" });
  let cause: DeathCause | null = null;
  for (const a of room.asteroids) {
    const at = asteroidAt(a, w.tick);
    if (Math.hypot(o.x - at.x, o.y - at.y) < a.r + NEWT_R - 2) cause = "asteroid";
  }
  if (!cause && (o.x < -TILE || o.x > room.w + TILE || o.y < -TILE || o.y > room.h + TILE)) cause = "out";
  if (cause) die(w, cause, events);
  else if (o.standing >= 0) w.safe = { x: o.x, y: o.y, gravity: w.gravity };
}

/**
 * Momentum from a gravity change (a jump turned sideways becomes a run along the new floor) is kept,
 * but faster than a run it fades in the air, like air drag, instead of carrying Newt forever.
 */
export function fadeOverspeed(r: Runner) {
  const over = Math.abs(r.vx) - TUNING.maxRun;
  if (!r.grounded && over > 0) r.vx -= Math.sign(r.vx) * Math.min(over, TUNING.airFriction);
}

/** Spikes, the edge of the room, an asteroid: the room starts again, or a safety net catches you. */
function die(w: World, cause: DeathCause, events: WorldEvent[]) {
  if ((w.room.net || w.netsEverywhere) && w.safe) {
    events.push({ type: "net", cause });
    w.gravity = w.safe.gravity;
    if (w.orbit) {
      Object.assign(w.orbit, { x: w.safe.x, y: w.safe.y, vx: 0, vy: 0, standing: -1, chain: [], grounded: 0 });
      w.orbit.run.vx = 0;
      w.orbit.run.vy = 0;
    } else {
      Object.assign(w.newt, { x: w.safe.x, y: w.safe.y, vx: 0, vy: 0, rx: 0, ry: 0, grounded: false, coyote: 0, rising: false, buffer: 0 });
    }
    return;
  }
  w.status = "dead";
  w.cause = cause;
  events.push({ type: "death", cause });
}

/** Is there a wall at this pixel? (For the anchors: drips stop on walls.) */
export function wallAt(room: Room, x: number, y: number): boolean {
  return cellAt(room, Math.floor(x / TILE), Math.floor(y / TILE)) === WALL;
}
