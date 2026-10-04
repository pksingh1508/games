// The climb, simulated one tick (1/60 s) at a time (Plan/08-almost-there.md §3, §12). Hold to
// charge, release to leap; no steering in the air; walls bounce you back at half speed; ceilings
// stop you; nothing kills you, you just fall. Deterministic, and every bit of state is plain
// JSON, so the climb can be saved mid-air and a reload carries on the very same fall.
import { approach, moveX, moveY, overlaps, type Body, type Rect, type Solids } from "@/engine/platformer/physics";
import {
  BOUNCE,
  CHARGE_MAX,
  CRUMBLE_TICKS,
  FALL_MIN,
  GRAVITY,
  ICE_FRICTION,
  JUMP,
  JUMP_VX,
  JUMP_VY_MAX,
  JUMP_VY_MIN,
  LEFT,
  MAX_FALL,
  MUSHROOM_VY,
  PIP_H,
  PIP_W,
  RESPAWN_TICKS,
  RIGHT,
  SNOW,
  STUN_FALL,
  STUN_TICKS,
  TILE,
  WALK,
} from "./constants";
import { T, tileAt, type Gear, type Mountain } from "./mountain";

export interface Pip extends Body {
  grounded: boolean;
  /** Ticks of charge so far (0: not charging). */
  charge: number;
  /** Jump is still held after a full-charge jump went by itself: let go before charging again. */
  latch: boolean;
  facing: 1 | -1;
  /** Ticks of a faceplant left. */
  stun: number;
  /** Feet height when Pip last left the ground. */
  takeoff: number;
  /** The highest the feet got since leaving the ground. */
  peak: number;
  /** Pixels walked since the last footstep. */
  walked: number;
  /** In the air from a mushroom's bounce: landing on one again just lands (no bouncing forever). */
  bounced: boolean;
}

export interface ElevatorState {
  /** How far down it is (px). */
  offset: number;
  phase: "idle" | "down" | "bottom" | "up";
  /** Ticks Pip has stood on it (idle), or been off it (bottom). */
  t: number;
}

export interface ClimbState {
  tick: number;
  pip: Pip;
  /** Crumbling ledges and clouds that have been stood on: tile index → timer (positive: ticks since; negative: gone, ticks until back). */
  crumbles: Array<[tile: number, timer: number]>;
  /** The fake summit has fallen (its ledge and the cave's seal are gone). */
  collapsed: boolean;
  elevators: ElevatorState[];
  /** Lost Feathers picked up on this climb (bitmask). */
  feathers: number;
  /** Already touching: a joke flag (-1: none), a summit flag. */
  touchingJoke: number;
  touchingFlag: boolean;
}

export type Surface = "rock" | "ice" | "snow" | "crumble" | "cloud" | "mushroom" | "plank" | "gear";

export type SimEvent =
  | { type: "charge" }
  | { type: "jump"; power: number; dir: -1 | 0 | 1 }
  | { type: "land"; drop: number; fell: number; surface: Surface }
  /** A landing well below where you left the ground. */
  | { type: "fall"; drop: number }
  | { type: "stun" }
  | { type: "bonk" }
  | { type: "bounce" }
  | { type: "mushroom" }
  | { type: "step"; surface: Surface }
  | { type: "crumble"; tile: number; phase: "shake" | "break" | "back" }
  | { type: "feather"; index: number }
  | { type: "joke"; index: number }
  | { type: "fakeSummit" }
  | { type: "summit" }
  | { type: "elevator"; index: number; phase: ElevatorState["phase"] };

export function createClimb(m: Mountain): ClimbState {
  const pip: Pip = {
    x: m.start.x,
    y: m.start.y,
    w: PIP_W,
    h: PIP_H,
    vx: 0,
    vy: 0,
    rx: 0,
    ry: 0,
    grounded: true,
    charge: 0,
    latch: false,
    facing: 1,
    stun: 0,
    takeoff: m.start.y + PIP_H,
    peak: m.start.y + PIP_H,
    walked: 0,
    bounced: false,
  };
  return {
    tick: 0,
    pip,
    crumbles: [],
    collapsed: false,
    elevators: m.elevators.map(() => ({ offset: 0, phase: "idle", t: 0 })),
    feathers: 0,
    touchingJoke: -1,
    touchingFlag: false,
  };
}

export const cloneClimb = (s: ClimbState): ClimbState => ({
  ...s,
  pip: { ...s.pip },
  crumbles: s.crumbles.map(([a, b]) => [a, b]),
  elevators: s.elevators.map((e) => ({ ...e })),
});

// ---------------------------------------------------------------------------------------------
// Moving things
// ---------------------------------------------------------------------------------------------

/** Where a gear platform is at a tick: there and back, easing at the ends. */
export function gearOffset(g: Gear, tick: number): { dx: number; dy: number } {
  const phase = ((((tick + g.offset) % g.period) + g.period) % g.period) / g.period;
  const tri = phase < 0.5 ? phase * 2 : 2 - phase * 2;
  const eased = tri * tri * (3 - 2 * tri);
  return { dx: Math.round(g.dx * eased), dy: Math.round(g.dy * eased) };
}

export const gearRect = (g: Gear, tick: number): Rect => {
  const o = gearOffset(g, tick);
  return { x: g.rect.x + o.dx, y: g.rect.y + o.dy, w: g.rect.w, h: g.rect.h };
};

export const elevatorRect = (m: Mountain, s: ClimbState, i: number): Rect => {
  const e = m.elevators[i]!;
  return { ...e.rect, y: e.rect.y + Math.round(s.elevators[i]!.offset) };
};

/** Is a wind zone blowing right now? */
export function windOn(pattern: Mountain["wind"][number]["pattern"], tick: number): boolean {
  if (pattern.kind === "steady") return true;
  const t = (((tick + (pattern.offset ?? 0)) % pattern.period) + pattern.period) % pattern.period;
  return t < pattern.on;
}

// ---------------------------------------------------------------------------------------------
// What's solid
// ---------------------------------------------------------------------------------------------

const crumbleTimer = (s: ClimbState, at: number) => {
  for (const [tile, timer] of s.crumbles) if (tile === at) return timer;
  return 0;
};

/** Does this tile stop you (from every side)? */
function tileSolid(m: Mountain, s: ClimbState, tx: number, ty: number): boolean {
  const code = tileAt(m, tx, ty);
  switch (code) {
    case T.ROCK:
    case T.ICE:
    case T.SNOW:
    case T.MUSHROOM:
      return true;
    case T.CRUMBLE:
      return crumbleTimer(s, ty * m.tileCols + tx) >= 0;
    case T.SEAL:
    case T.SUMMIT:
      return !s.collapsed;
    default:
      return false;
  }
}

/** Can you stand on this tile from above only (planks, clouds that are there)? */
function tileLedge(m: Mountain, s: ClimbState, tx: number, ty: number): boolean {
  const code = tileAt(m, tx, ty);
  if (code === T.PLANK) return true;
  if (code === T.CLOUD) return crumbleTimer(s, ty * m.tileCols + tx) >= 0;
  return false;
}

export function solidsFor(m: Mountain, s: ClimbState, { moving: withMoving = true }: { moving?: boolean } = {}): Solids {
  const moving: Rect[] = [];
  if (withMoving) {
    for (const g of m.gears) moving.push(gearRect(g, s.tick));
    for (let i = 0; i < m.elevators.length; i++) moving.push(elevatorRect(m, s, i));
  }
  return {
    solidAt(x, y, w, h) {
      const c0 = Math.floor(x / TILE);
      const c1 = Math.floor((x + w - 1) / TILE);
      const r0 = Math.floor(y / TILE);
      const r1 = Math.floor((y + h - 1) / TILE);
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (tileSolid(m, s, c, r)) return true;
      const probe = { x, y, w, h };
      for (const rect of moving) if (overlaps(probe, rect)) return true;
      return false;
    },
    ledgeAt(x, y, w) {
      if (y % TILE !== 0) return false;
      const r = y / TILE;
      for (let c = Math.floor(x / TILE); c <= Math.floor((x + w - 1) / TILE); c++) if (tileLedge(m, s, c, r)) return true;
      return false;
    },
  };
}

/** What Pip is standing on (the middle of the feet first). */
export function surfaceUnder(m: Mountain, s: ClimbState): { surface: Surface; tiles: number[] } {
  const p = s.pip;
  const feet = p.y + p.h;
  for (const g of m.gears) {
    const r = gearRect(g, s.tick);
    if (r.y === feet && p.x + p.w > r.x && p.x < r.x + r.w) return { surface: "gear", tiles: [] };
  }
  for (let i = 0; i < m.elevators.length; i++) {
    const r = elevatorRect(m, s, i);
    if (r.y === feet && p.x + p.w > r.x && p.x < r.x + r.w) return { surface: "gear", tiles: [] };
  }
  if (feet % TILE !== 0) return { surface: "rock", tiles: [] };
  const ty = feet / TILE;
  const cols = [Math.floor((p.x + p.w / 2) / TILE), Math.floor(p.x / TILE), Math.floor((p.x + p.w - 1) / TILE)];
  const tiles: number[] = [];
  let surface: Surface | null = null;
  for (const tx of cols) {
    const code = tileAt(m, tx, ty);
    const at = ty * m.tileCols + tx;
    const kind: Surface | null =
      code === T.ICE
        ? "ice"
        : code === T.SNOW
          ? "snow"
          : code === T.CRUMBLE && crumbleTimer(s, at) >= 0
            ? "crumble"
            : code === T.CLOUD && crumbleTimer(s, at) >= 0
              ? "cloud"
              : code === T.MUSHROOM
                ? "mushroom"
                : code === T.PLANK
                  ? "plank"
                  : code === T.ROCK || ((code === T.SEAL || code === T.SUMMIT) && !s.collapsed)
                    ? "rock"
                    : null;
    if (kind && !surface) surface = kind;
    if (kind === "crumble" || kind === "cloud") tiles.push(at);
  }
  return { surface: surface ?? "rock", tiles };
}

// ---------------------------------------------------------------------------------------------
// The tick
// ---------------------------------------------------------------------------------------------

/** How fast a jump of this much charge goes up (before snow). */
export const jumpSpeed = (charge: number) => JUMP_VY_MIN + ((JUMP_VY_MAX - JUMP_VY_MIN) * (Math.max(1, charge) - 1)) / (CHARGE_MAX - 1);

const standingOn = (p: Pip, r: Rect) => p.grounded && p.y + p.h === r.y && p.x + p.w > r.x && p.x < r.x + r.w;

function takeOff(p: Pip) {
  p.grounded = false;
  p.takeoff = p.y + p.h;
  p.peak = p.y + p.h;
  p.walked = 0;
}

export function step(m: Mountain, s: ClimbState, bits: number): SimEvent[] {
  const events: SimEvent[] = [];
  const p = s.pip;
  const left = (bits & LEFT) !== 0;
  const right = (bits & RIGHT) !== 0;
  const jump = (bits & JUMP) !== 0;
  const dir = (right ? 1 : 0) - (left ? 1 : 0);

  // Moving platforms carry whoever stands on them, and shove whoever's in the way.
  const before = s.tick;
  s.tick++;
  for (const g of m.gears) {
    const was = gearRect(g, before);
    const now = gearRect(g, s.tick);
    if (now.x === was.x && now.y === was.y) continue;
    if (standingOn(p, was) || overlaps(p, now)) {
      const still = solidsFor(m, s, { moving: false });
      moveX(p, now.x - was.x, still);
      moveY(p, now.y - was.y, still);
    }
  }
  updateElevators(m, s, events);
  updateCrumbles(m, s, events);
  const solids = solidsFor(m, s);

  if (p.stun > 0) p.stun--;
  if (!jump) p.latch = false;

  if (p.grounded) {
    const under = surfaceUnder(m, s);
    const ice = under.surface === "ice";
    if (p.charge > 0) {
      if (dir) p.facing = dir as 1 | -1;
      if (jump && p.charge < CHARGE_MAX) p.charge++;
      else {
        // Let go (or full charge): leap, the way you're holding.
        const power = (p.charge - 1) / (CHARGE_MAX - 1);
        p.vy = -jumpSpeed(p.charge) * (under.surface === "snow" ? SNOW : 1);
        p.vx = dir * JUMP_VX + (ice ? p.vx * 0.5 : 0);
        if (jump) p.latch = true;
        p.charge = 0;
        takeOff(p);
        events.push({ type: "jump", power, dir: dir as -1 | 0 | 1 });
      }
    } else if (jump && !p.latch && p.stun === 0) {
      p.charge = 1;
      p.vx = ice ? p.vx : 0;
      events.push({ type: "charge" });
    }
    if (p.grounded) {
      if (p.charge === 0 && p.stun === 0) {
        if (ice) p.vx = approach(p.vx, dir * WALK, dir ? 0.05 : ICE_FRICTION);
        else p.vx = dir * WALK;
        if (dir) p.facing = dir as 1 | -1;
      } else p.vx = ice ? approach(p.vx, 0, ICE_FRICTION) : 0;
    }
  }

  if (!p.grounded) {
    p.vy = Math.min(MAX_FALL, p.vy + GRAVITY);
    // Wind pushes you around in the air.
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    for (const w of m.wind) {
      if (cx >= w.rect.x && cx < w.rect.x + w.rect.w && cy >= w.rect.y && cy < w.rect.y + w.rect.h && windOn(w.pattern, s.tick)) {
        p.vx = Math.max(-3.5, Math.min(3.5, p.vx + w.push));
      }
    }
  }

  const x0 = p.x;
  if (moveX(p, p.vx, solids)) {
    if (!p.grounded) {
      p.vx = -p.vx * BOUNCE;
      events.push({ type: "bounce" });
    } else p.vx = 0;
  }

  if (p.grounded) {
    // Walked off the edge?
    const supported = solids.solidAt(p.x, p.y + 1, p.w, p.h) || Boolean(solids.ledgeAt?.(p.x, p.y + p.h, p.w));
    if (!supported) {
      takeOff(p);
      p.vy = 0;
    } else {
      p.walked += Math.abs(p.x - x0);
      if (p.walked >= 9) {
        p.walked = 0;
        events.push({ type: "step", surface: surfaceUnder(m, s).surface });
      }
    }
  }

  if (!p.grounded) {
    const vy = p.vy;
    if (moveY(p, vy, solids)) {
      if (vy < 0) {
        p.vy = 0;
        events.push({ type: "bonk" });
      } else land(m, s, events);
    }
    p.peak = Math.min(p.peak, p.y + p.h);
  }

  // Standing on crumbling ground (or a cloud) starts it going.
  if (p.grounded) {
    for (const at of surfaceUnder(m, s).tiles) {
      if (crumbleTimer(s, at) === 0) {
        s.crumbles.push([at, 1]);
        events.push({ type: "crumble", tile: at, phase: "shake" });
      }
    }
  }

  // Things you touch.
  m.feathers.forEach((f) => {
    if (!(s.feathers & (1 << f.index)) && overlaps(p, f)) {
      s.feathers |= 1 << f.index;
      events.push({ type: "feather", index: f.index });
    }
  });
  const joke = m.jokes.findIndex((j) => overlaps(p, j));
  if (joke >= 0 && joke !== s.touchingJoke) events.push({ type: "joke", index: joke });
  s.touchingJoke = joke;
  const fake = !s.collapsed && overlaps(p, m.fakeFlag);
  const real = overlaps(p, m.realFlag);
  if ((fake || real) && !s.touchingFlag) events.push({ type: fake ? "fakeSummit" : "summit" });
  s.touchingFlag = fake || real;

  return events;
}

function land(m: Mountain, s: ClimbState, events: SimEvent[]) {
  const p = s.pip;
  const impact = p.vy;
  p.grounded = true;
  p.vy = 0;
  p.peak = Math.min(p.peak, p.y + p.h);
  const feet = p.y + p.h;
  const drop = feet - p.takeoff;
  const fell = feet - p.peak;
  const under = surfaceUnder(m, s);
  if (under.surface === "mushroom" && !p.bounced) {
    // Boing: straight back up, keeping your sideways speed.
    p.vy = -MUSHROOM_VY;
    p.grounded = false;
    p.peak = feet;
    p.bounced = true;
    events.push({ type: "mushroom" });
    return;
  }
  p.bounced = false;
  if (under.surface !== "ice") p.vx = 0;
  events.push({ type: "land", drop, fell, surface: under.surface });
  if (drop >= FALL_MIN) events.push({ type: "fall", drop });
  if (fell >= STUN_FALL && impact >= MAX_FALL - 0.5) {
    p.stun = STUN_TICKS;
    events.push({ type: "stun" });
  }
}

function updateCrumbles(m: Mountain, s: ClimbState, events: SimEvent[]) {
  const p = s.pip;
  const next: ClimbState["crumbles"] = [];
  for (const [at, timer] of s.crumbles) {
    if (timer > 0) {
      if (timer + 1 >= CRUMBLE_TICKS) {
        next.push([at, -RESPAWN_TICKS]);
        events.push({ type: "crumble", tile: at, phase: "break" });
      } else next.push([at, timer + 1]);
    } else if (timer < 0) {
      if (timer + 1 < 0) next.push([at, timer + 1]);
      else {
        // Back, unless you're standing where it goes (then a moment later).
        const tx = at % m.tileCols;
        const ty = Math.floor(at / m.tileCols);
        if (overlaps(p, { x: tx * TILE, y: ty * TILE, w: TILE, h: TILE })) next.push([at, -1]);
        else events.push({ type: "crumble", tile: at, phase: "back" });
      }
    }
  }
  s.crumbles = next;
}

function updateElevators(m: Mountain, s: ClimbState, events: SimEvent[]) {
  const p = s.pip;
  m.elevators.forEach((def, i) => {
    const e = s.elevators[i]!;
    const r = elevatorRect(m, s, i);
    const on = standingOn(p, r);
    const was = e.offset;
    switch (e.phase) {
      case "idle":
        e.t = on ? e.t + 1 : 0;
        if (e.t >= 30) {
          e.phase = "down";
          e.t = 0;
          events.push({ type: "elevator", index: i, phase: "down" });
        }
        break;
      case "down":
        e.offset = Math.min(def.drop, e.offset + 1.6);
        if (e.offset >= def.drop) {
          e.phase = "bottom";
          e.t = 0;
          events.push({ type: "elevator", index: i, phase: "bottom" });
        }
        break;
      case "bottom":
        e.t = on ? 0 : e.t + 1;
        if (e.t >= 120) {
          e.phase = "up";
          events.push({ type: "elevator", index: i, phase: "up" });
        }
        break;
      case "up":
        e.offset = Math.max(0, e.offset - 3);
        if (e.offset <= 0) {
          e.phase = "idle";
          e.t = 0;
        }
        break;
    }
    // Riding it.
    const moved = Math.round(e.offset) - Math.round(was);
    if (on && moved !== 0) p.y += moved;
  });
}

/** The fake summit falls: its ledge goes, and the cave's seal cracks open (Plan §5). */
export function collapse(s: ClimbState) {
  s.collapsed = true;
  const p = s.pip;
  p.grounded = false;
  p.takeoff = p.y + p.h;
  p.peak = p.y + p.h;
  p.vy = 0;
  p.vx = 0;
  p.charge = 0;
}
