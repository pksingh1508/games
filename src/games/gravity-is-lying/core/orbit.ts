// Round planetoids (Plan/15-gravity-is-lying.md §3, §12: "a separate, small physics path"). Each
// real planet pulls toward its centre within its field; Newt runs and jumps exactly like on tiles,
// in a frame that turns with the planet's surface: "right" goes round it, "jump" is straight out.
// Between fields there's nothing: you drift in a straight line. Painted planets pull nothing and
// can't be stood on. Plain arithmetic only, so a recording replays the same way.
import { steerRunner, type Runner, type RunnerInput } from "@/engine/platformer/runner";
import { TUNING } from "./constants";
import type { Vec } from "./gravity";
import type { AsteroidSource, Room } from "./room";

/** Newt is a circle out here. */
export const NEWT_R = 6;

export interface OrbitNewt {
  /** The centre. */
  x: number;
  y: number;
  /** World velocity. */
  vx: number;
  vy: number;
  /** The shared runner's state, in the planet's frame (vx along the surface, vy toward it). */
  run: Runner;
  /** The planet pulling Newt (-1: deep space). */
  planet: number;
  /** The planet Newt stands on (-1: in the air). */
  standing: number;
  /** Which way is up for Newt, as a turn from the screen's up (radians, clockwise). */
  turn: number;
  /** Planets landed on in a row, in this life (for Orbital), and ticks standing still on this one. */
  chain: number[];
  grounded: number;
}

/** Stand on a planet longer than this and the hop chain starts again (Orbital: no touching the ground). */
export const ORBITAL_REST_TICKS = 60;

export interface OrbitEvents {
  jumped: boolean;
  landed: boolean;
  impact: number;
  /** Landed on a third different planet in a row. */
  orbital: boolean;
}

export function createOrbitNewt(room: Room): OrbitNewt {
  const n: OrbitNewt = {
    x: room.spawn.x,
    y: room.spawn.y,
    vx: 0,
    vy: 0,
    run: { x: 0, y: 0, w: 0, h: 0, vx: 0, vy: 0, rx: 0, ry: 0, grounded: false, coyote: 0, buffer: 0, rising: false, held: false, facing: 1 },
    planet: -1,
    standing: -1,
    turn: 0,
    chain: [],
    grounded: 0,
  };
  return n;
}

/** Where an asteroid is at a tick. */
export function asteroidAt(a: AsteroidSource, tick: number): Vec {
  if (!a.orbit) return { x: a.x, y: a.y };
  const k = (a.orbit.phase ?? 0) + (2 * Math.PI * tick) / a.orbit.period;
  const dx = a.x - a.orbit.x;
  const dy = a.y - a.orbit.y;
  const radius = Math.hypot(dx, dy);
  const start = Math.atan2(dy, dx);
  return { x: a.orbit.x + Math.cos(start + k) * radius, y: a.orbit.y + Math.sin(start + k) * radius };
}

/** The real planet whose pull Newt is in (the nearest surface), or -1. */
export function pullingPlanet(room: Room, x: number, y: number): number {
  let best = -1;
  let bestGap = Infinity;
  room.planets.forEach((p, i) => {
    if (p.fake) return;
    const d = Math.hypot(x - p.x, y - p.y);
    if (d > p.field) return;
    const gap = d - p.r;
    if (gap < bestGap) {
      bestGap = gap;
      best = i;
    }
  });
  return best;
}

/** Which way is truly down at a point (a unit vector toward the pulling planet), or none. */
export function orbitDown(room: Room, x: number, y: number): Vec | null {
  const i = pullingPlanet(room, x, y);
  if (i < 0) return null;
  const p = room.planets[i]!;
  const d = Math.hypot(x - p.x, y - p.y) || 1;
  return { x: (p.x - x) / d, y: (p.y - y) / d };
}

export function stepOrbit(room: Room, n: OrbitNewt, input: RunnerInput): OrbitEvents {
  const events: OrbitEvents = { jumped: false, landed: false, impact: 0, orbital: false };
  const was = n.standing;
  n.planet = pullingPlanet(room, n.x, n.y);
  let jumped = false;
  if (n.planet >= 0) {
    const p = room.planets[n.planet]!;
    const d = Math.hypot(n.x - p.x, n.y - p.y) || 1;
    // Up (out from the planet), and right (round it).
    const ux = (n.x - p.x) / d;
    const uy = (n.y - p.y) / d;
    const tx = -uy;
    const ty = ux;
    const r = n.run;
    r.vx = n.vx * tx + n.vy * ty;
    r.vy = -(n.vx * ux + n.vy * uy);
    r.grounded = n.standing === n.planet;
    const ev = steerRunner(r, input, TUNING);
    // Faster than a run round a planet (arriving from space): it fades in the air, like on tiles.
    const over = Math.abs(r.vx) - TUNING.maxRun;
    if (!r.grounded && over > 0) r.vx -= Math.sign(r.vx) * Math.min(over, TUNING.airFriction);
    jumped = ev.jumped;
    events.jumped = ev.jumped;
    n.vx = tx * r.vx - ux * r.vy;
    n.vy = ty * r.vx - uy * r.vy;
    n.turn = Math.atan2(ux, -uy);
  } else {
    // Deep space: nothing to push against, nothing pulling. Keep the jump button's state honest.
    n.run.held = input.jump;
  }

  n.x += n.vx;
  n.y += n.vy;

  // Stand on (or bump into) the real planets.
  n.standing = -1;
  room.planets.forEach((p, i) => {
    if (p.fake) return;
    const d = Math.hypot(n.x - p.x, n.y - p.y) || 1;
    const min = p.r + NEWT_R;
    if (d >= min) return;
    const ux = (n.x - p.x) / d;
    const uy = (n.y - p.y) / d;
    n.x = p.x + ux * min;
    n.y = p.y + uy * min;
    const inward = n.vx * ux + n.vy * uy;
    if (inward < 0) {
      n.vx -= ux * inward;
      n.vy -= uy * inward;
      if (was !== i) events.impact = -inward;
    }
    n.standing = i;
  });
  // Walking round a planet: stay on the surface (it curves away under your feet).
  if (n.standing < 0 && was >= 0 && !jumped) {
    const p = room.planets[was]!;
    const d = Math.hypot(n.x - p.x, n.y - p.y) || 1;
    const min = p.r + NEWT_R;
    if (d - min < 3) {
      const ux = (n.x - p.x) / d;
      const uy = (n.y - p.y) / d;
      n.x = p.x + ux * min;
      n.y = p.y + uy * min;
      const outward = n.vx * ux + n.vy * uy;
      if (outward > 0) {
        n.vx -= ux * outward;
        n.vy -= uy * outward;
      }
      n.standing = was;
    }
  }

  const r = n.run;
  r.grounded = n.standing >= 0;
  n.grounded = r.grounded ? n.grounded + 1 : 0;
  // Lingering on a planet isn't hopping between them.
  if (n.grounded > ORBITAL_REST_TICKS && n.chain.length > 1) n.chain = [n.standing];
  if (r.grounded) {
    r.coyote = TUNING.coyoteTicks;
    r.rising = false;
    if (was !== n.standing) {
      events.landed = true;
      if (n.chain[n.chain.length - 1] !== n.standing) {
        n.chain.push(n.standing);
        if (new Set(n.chain).size >= 3 && n.chain.length >= 3) events.orbital = true;
      }
    }
  } else if (r.coyote > 0) r.coyote--;
  return events;
}
