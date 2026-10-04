// One attempt at a room, simulated one tick (1/60 s) at a time (Plan/05-fake-floor.md §3, §12).
// Deterministic: no randomness, no clocks. Floors keep their state in typed arrays, so a world
// clones cheaply (the solver clones a great many).
//
// The pebble is honest by construction: it collides with exactly what is solid, nothing else.
import { overlaps, type Rect, type Solids } from "@/engine/platformer/physics";
import { createRunner, stepRunner, type Runner } from "@/engine/platformer/runner";
import {
  CRUMBLE_TICKS,
  JUMP,
  LEFT,
  NET_TICKS,
  PEBBLE_GRAVITY,
  PLAYER_H,
  PLAYER_W,
  REVEAL_TICKS,
  RIGHT,
  STEP_EVERY,
  TILE,
  TUNING,
  VIEW_H,
} from "./constants";
import { AIR, cellAt, ROCK, type FlipPattern, type FloorKind, type Room } from "./room";

/** What you fell through: a floor that lied, a floor that gave way, or an honest gap. */
export type FallCause = "fake" | "mimic" | "painted" | "crumble" | "returnTrip" | "flip" | "gap";

export type Surface = "rock" | "floor";

export type GameEvent =
  | { type: "jump" }
  | { type: "land"; impact: number; surface: Surface }
  | { type: "step"; surface: Surface }
  | { type: "bonk" }
  /** A pebble hit something solid (`floor` below 0: rock or a wall). Soft: a bounce after the first hit. */
  | { type: "tok"; x: number; y: number; floor: number; soft: boolean }
  /** A pebble hit an invisible floor (the glassy sound; it glows for 3 s). */
  | { type: "tink"; x: number; y: number; floor: number }
  /** A pebble went straight through a floor that isn't there. */
  | { type: "fwip"; x: number; y: number; floor: number }
  | { type: "crumble"; floor: number; phase: "shake" | "fall" }
  /** A return-trip floor you've crossed turned fake (a faint crack appears). */
  | { type: "crack"; floor: number }
  | { type: "flip"; floor: number; solid: boolean }
  | { type: "pickup"; index: number; hidden: boolean }
  | { type: "key" }
  | { type: "locked" }
  /** You stepped onto an invisible floor no pebble had tested (Leap of Faith). */
  | { type: "leap" }
  /** A safety net caught you (it still counts as a fall). */
  | { type: "net"; x: number; y: number; cause: FallCause }
  | { type: "netReturn" }
  | { type: "fall"; cause: FallCause; x: number; y: number }
  | { type: "win" };

/** Per-floor state, in typed arrays (one entry per floor tile). */
export interface FloorStates {
  /** Crumbling: 0 whole, 1 shaking, 2 fallen. Flipping: 0 real, 2 fake. */
  phase: Uint8Array;
  /** Ticks in the current phase. */
  t: Uint16Array;
  /** Return-trip: 0 untouched, 1 stood on, 2 left behind (now fake). */
  crossed: Uint8Array;
  /** Ticks of glow left after a pebble found an invisible floor. */
  reveal: Uint16Array;
  /** A pebble has touched it this attempt. */
  tested: Uint8Array;
  /** A fallen crumbling floor's drop (drawn only). */
  drop: Float32Array;
  speed: Float32Array;
}

export interface Stone {
  x: number;
  y: number;
  vx: number;
  vy: number;
  state: "fly" | "rest" | "gone";
  t: number;
  /** The last floor it went through (one "fwip" each). */
  passed: number;
  hits: number;
}

export interface World {
  readonly room: Room;
  tick: number;
  status: "play" | "fell" | "won";
  cause: FallCause | null;
  p: Runner;
  fs: FloorStates;
  /** Pebbles left. */
  pebbles: number;
  /** Thrown this attempt. */
  thrown: number;
  stones: Stone[];
  /** Pickups taken this attempt (bitmask). */
  taken: number;
  key: boolean;
  /** The last safe floor you stood on (a safety net puts you back here). */
  safe: { x: number; y: number };
  /** Ticks into a safety net's bounce (0: not in a net). */
  net: number;
  caught: { x: number; y: number } | null;
  /** The floor you're falling through right now. */
  through: FallCause | null;
  /** Pixels walked since the last footstep. */
  walked: number;
  /** Assist: pebbles never run out. */
  unlimited: boolean;
  /** Assist: a safety net under everything. */
  netsEverywhere: boolean;
  leapt: boolean;
  touchingDoor: boolean;
  events: GameEvent[];
}

export interface WorldOptions {
  unlimited?: boolean;
  nets?: boolean;
}

export const flipSolid = (f: FlipPattern, tick: number) => (((tick + f.offset) % f.period) + f.period) % f.period < f.solid;

/** Ticks until a flipping floor next changes (for its warning shimmer). */
export function ticksToFlip(f: FlipPattern, tick: number): number {
  const at = (((tick + f.offset) % f.period) + f.period) % f.period;
  return at < f.solid ? f.solid - at : f.period - at;
}

export function createWorld(room: Room, { unlimited = false, nets = false }: WorldOptions = {}): World {
  const n = room.floors.length;
  const p = createRunner(room.spawn.x, room.spawn.y, PLAYER_W, PLAYER_H);
  p.grounded = true;
  p.coyote = TUNING.coyoteTicks;
  const fs: FloorStates = {
    phase: new Uint8Array(n),
    t: new Uint16Array(n),
    crossed: new Uint8Array(n),
    reveal: new Uint16Array(n),
    tested: new Uint8Array(n),
    drop: new Float32Array(n),
    speed: new Float32Array(n),
  };
  room.floors.forEach((f, i) => {
    if (f.flip && !flipSolid(f.flip, 0)) fs.phase[i] = 2;
  });
  return {
    room,
    tick: 0,
    status: "play",
    cause: null,
    p,
    fs,
    pebbles: room.pebbles,
    thrown: 0,
    stones: [],
    taken: 0,
    key: false,
    safe: { x: p.x, y: p.y },
    net: 0,
    caught: null,
    through: null,
    walked: STEP_EVERY / 2,
    unlimited,
    netsEverywhere: nets,
    leapt: false,
    touchingDoor: false,
    events: [],
  };
}

export function cloneWorld(w: World): World {
  return {
    ...w,
    p: { ...w.p },
    fs: {
      phase: w.fs.phase.slice(),
      t: w.fs.t.slice(),
      crossed: w.fs.crossed.slice(),
      reveal: w.fs.reveal.slice(),
      tested: w.fs.tested.slice(),
      drop: w.fs.drop.slice(),
      speed: w.fs.speed.slice(),
    },
    stones: w.stones.map((s) => ({ ...s })),
    safe: { ...w.safe },
    caught: w.caught ? { ...w.caught } : null,
    events: [],
  };
}

// ---------------------------------------------------------------------------------------------
// What's solid
// ---------------------------------------------------------------------------------------------

/** Is this floor tile there to stand on right now? */
export function floorSolid(w: World, i: number): boolean {
  switch (w.room.floors[i]!.kind) {
    case "solid":
    case "invisible":
      return true;
    case "crumble":
    case "flip":
      return w.fs.phase[i]! < 2;
    case "returnTrip":
      return w.fs.crossed[i]! < 2;
    default:
      return false;
  }
}

function solidCell(w: World, c: number, r: number): boolean {
  const v = cellAt(w.room, c, r);
  if (v === ROCK) return true;
  if (v === AIR) return false;
  return floorSolid(w, v);
}

export function solidAt(w: World, x: number, y: number, bw: number, bh: number): boolean {
  const c0 = Math.floor(x / TILE);
  const c1 = Math.floor((x + bw - 1) / TILE);
  const r0 = Math.floor(y / TILE);
  const r1 = Math.floor((y + bh - 1) / TILE);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (solidCell(w, c, r)) return true;
  return false;
}

const solidsOf = (w: World): Solids => ({ solidAt: (x, y, bw, bh) => solidAt(w, x, y, bw, bh) });

const floorRect = (w: World, i: number): Rect => {
  const f = w.room.floors[i]!;
  return { x: f.x, y: f.y, w: TILE, h: TILE };
};

const standingOn = (p: Runner, x: number, y: number) => p.grounded && p.y + p.h === y && p.x + p.w > x && p.x < x + TILE;

/** The floor tiles (and rock) right under your feet. */
function underFeet(w: World): number[] {
  const p = w.p;
  if ((p.y + p.h) % TILE !== 0) return [];
  const r = (p.y + p.h) / TILE;
  const out: number[] = [];
  for (let c = Math.floor(p.x / TILE); c <= Math.floor((p.x + p.w - 1) / TILE); c++) out.push(cellAt(w.room, c, r));
  return out;
}

const CAUSE: Partial<Record<FloorKind, FallCause>> = {
  fake: "fake",
  mimic: "mimic",
  painted: "painted",
  crumble: "crumble",
  returnTrip: "returnTrip",
  flip: "flip",
};

// ---------------------------------------------------------------------------------------------
// The tick
// ---------------------------------------------------------------------------------------------

export function step(w: World, bits: number): void {
  w.events = [];
  if (w.status !== "play") return;
  const room = w.room;
  const p = w.p;

  updateFlips(w);

  if (w.net > 0) {
    // In the safety net: a bounce, then back on safe ground.
    w.net++;
    if (w.net >= NET_TICKS) leaveNet(w);
    updateFloors(w);
    updateStones(w);
    w.tick++;
    return;
  }

  const prevFeet = p.y + p.h;
  const prevX = p.x;
  const wasAirborne = !p.grounded;
  const moved = stepRunner(p, { left: (bits & LEFT) !== 0, right: (bits & RIGHT) !== 0, jump: (bits & JUMP) !== 0 }, solidsOf(w), TUNING);
  const under = underFeet(w);
  const surface: Surface = under.includes(ROCK) ? "rock" : "floor";
  if (moved.jumped) w.events.push({ type: "jump" });
  if (moved.landed && wasAirborne) w.events.push({ type: "land", impact: moved.impact, surface });
  if (moved.bonked) w.events.push({ type: "bonk" });

  // Footsteps.
  if (p.grounded) {
    w.walked += Math.abs(p.x - prevX);
    if (w.walked >= STEP_EVERY) {
      w.walked -= STEP_EVERY;
      w.events.push({ type: "step", surface });
    }
  } else w.walked = STEP_EVERY / 2;

  // What you're standing on: crumbles start to go, return-trip floors remember you.
  for (const v of under) {
    if (v < 0) continue;
    const f = room.floors[v]!;
    if (!standingOn(p, f.x, f.y)) continue;
    if (f.kind === "crumble" && w.fs.phase[v] === 0) startCrumble(w, v);
    if (f.kind === "returnTrip" && w.fs.crossed[v] === 0) w.fs.crossed[v] = 1;
    if (f.kind === "invisible" && !w.fs.tested[v] && !w.leapt) {
      w.leapt = true;
      w.events.push({ type: "leap" });
    }
  }
  if (p.grounded && under.some((v) => v === ROCK || (v >= 0 && (room.floors[v]!.kind === "solid" || room.floors[v]!.kind === "invisible")))) {
    w.safe = { x: p.x, y: p.y };
  }

  updateFloors(w);
  updateStones(w);

  // Pickups and the key.
  room.pickups.forEach((pick, i) => {
    if (w.taken & (1 << i) || !overlaps(p, pick)) return;
    w.taken |= 1 << i;
    if (!w.unlimited) w.pebbles++;
    w.events.push({ type: "pickup", index: i, hidden: pick.hidden });
  });
  if (room.key && !w.key && overlaps(p, room.key)) {
    w.key = true;
    w.events.push({ type: "key" });
  }

  // Falling through something: which floor let you down?
  if (p.grounded) w.through = null;
  else if (p.vy > 0) {
    const feet = p.y + p.h;
    for (let c = Math.floor(p.x / TILE); c <= Math.floor((p.x + p.w - 1) / TILE); c++) {
      for (let r = Math.floor(prevFeet / TILE); r <= Math.floor(feet / TILE); r++) {
        const v = cellAt(room, c, r);
        if (v < 0 || floorSolid(w, v)) continue;
        const top = r * TILE;
        const overlap = Math.min(p.x + p.w, c * TILE + TILE) - Math.max(p.x, c * TILE);
        if (prevFeet <= top && feet > top && overlap > 4) w.through = CAUSE[room.floors[v]!.kind] ?? w.through;
      }
    }
  }

  // The bottom: a safety net, or the room starts again.
  const col = Math.floor((p.x + p.w / 2) / TILE);
  if (p.y + p.h >= VIEW_H - 6 && (w.netsEverywhere || room.nets[col])) {
    w.net = 1;
    w.caught = { x: p.x, y: VIEW_H - 6 - p.h };
    p.vx = 0;
    p.vy = 0;
    w.events.push({ type: "net", x: p.x + p.w / 2, y: VIEW_H - 6, cause: w.through ?? "gap" });
  } else if (p.y > VIEW_H + 8) {
    w.status = "fell";
    w.cause = w.through ?? "gap";
    w.events.push({ type: "fall", cause: w.cause, x: p.x + p.w / 2, y: VIEW_H });
  }

  // The door.
  if (w.status === "play" && w.net === 0) {
    const touching = overlaps(p, room.exit);
    if (touching && (!room.key || w.key)) {
      w.status = "won";
      w.events.push({ type: "win" });
    } else if (touching && !w.touchingDoor) w.events.push({ type: "locked" });
    w.touchingDoor = touching;
  }
  w.tick++;
}

function startCrumble(w: World, i: number) {
  w.fs.phase[i] = 1;
  w.fs.t[i] = 0;
  w.events.push({ type: "crumble", floor: i, phase: "shake" });
}

/** Timers: crumbles shake then fall, return-trip floors turn once you've left them, glows fade. */
function updateFloors(w: World) {
  const { fs, room, p } = w;
  for (let i = 0; i < room.floors.length; i++) {
    const f = room.floors[i]!;
    if (fs.reveal[i]! > 0) fs.reveal[i] = fs.reveal[i]! - 1;
    if (f.kind === "crumble") {
      if (fs.phase[i] === 1) {
        fs.t[i] = fs.t[i]! + 1;
        if (fs.t[i]! >= CRUMBLE_TICKS) {
          fs.phase[i] = 2;
          fs.t[i] = 0;
          w.events.push({ type: "crumble", floor: i, phase: "fall" });
        }
      } else if (fs.phase[i] === 2 && fs.drop[i]! < VIEW_H) {
        fs.speed[i] = Math.min(8, fs.speed[i]! + 0.35);
        fs.drop[i] = fs.drop[i]! + fs.speed[i]!;
      }
    } else if (f.kind === "returnTrip" && fs.crossed[i] === 1) {
      const clear = p.x + p.w <= f.x || p.x >= f.x + TILE;
      if (clear && w.net === 0) {
        fs.crossed[i] = 2;
        w.events.push({ type: "crack", floor: i });
      }
    }
  }
}

/** Floors that flip on a rhythm (the final room). A floor never turns solid around you. */
function updateFlips(w: World) {
  const { fs, room, p } = w;
  for (let i = 0; i < room.floors.length; i++) {
    const f = room.floors[i]!;
    if (!f.flip) continue;
    fs.t[i] = fs.t[i]! + 1;
    const solid = flipSolid(f.flip, w.tick);
    if (solid && fs.phase[i] === 2 && !overlaps(p, floorRect(w, i))) {
      fs.phase[i] = 0;
      fs.t[i] = 0;
      w.events.push({ type: "flip", floor: i, solid: true });
    } else if (!solid && fs.phase[i] === 0) {
      fs.phase[i] = 2;
      fs.t[i] = 0;
      w.events.push({ type: "flip", floor: i, solid: false });
    }
  }
}

function leaveNet(w: World) {
  const p = w.p;
  p.x = w.safe.x;
  p.y = w.safe.y;
  p.vx = 0;
  p.vy = 0;
  p.rx = 0;
  p.ry = 0;
  p.grounded = true;
  p.coyote = TUNING.coyoteTicks;
  p.rising = false;
  w.net = 0;
  w.caught = null;
  w.through = null;
  // The net's other kindness: floors that crumbled come back.
  w.room.floors.forEach((f, i) => {
    if (f.kind === "crumble" && w.fs.phase[i] !== 0 && !overlaps(p, floorRect(w, i))) {
      w.fs.phase[i] = 0;
      w.fs.t[i] = 0;
      w.fs.drop[i] = 0;
      w.fs.speed[i] = 0;
    }
  });
  w.events.push({ type: "netReturn" });
}

// ---------------------------------------------------------------------------------------------
// Pebbles
// ---------------------------------------------------------------------------------------------

/** Where a thrown pebble leaves your hand. */
export function handOf(w: World, towardX: number): { x: number; y: number } {
  const p = w.p;
  const dir = towardX < p.x + p.w / 2 ? -1 : 1;
  return { x: p.x + p.w / 2 + dir * 4, y: p.y + 3 };
}

/** The lob that lands on (tx, ty): a fixed arc for the distance, so aiming is predictable. */
export function lobTo(from: { x: number; y: number }, tx: number, ty: number): { vx: number; vy: number; ticks: number } {
  const dx = tx - from.x;
  const dy = ty - from.y;
  const ticks = Math.max(16, Math.min(60, Math.round(16 + Math.hypot(dx, dy) / 6)));
  // Matches the integration below (speed changes, then position): y(n) = y0 + n·vy + g·n(n+1)/2.
  return { vx: dx / ticks, vy: (dy - (PEBBLE_GRAVITY * ticks * (ticks + 1)) / 2) / ticks, ticks };
}

/** Throw a pebble at a point. False when you have none left (or can't throw right now). */
export function throwPebble(w: World, tx: number, ty: number): boolean {
  if (w.status !== "play" || w.net > 0) return false;
  if (!w.unlimited && w.pebbles <= 0) return false;
  const from = handOf(w, tx);
  const { vx, vy } = lobTo(from, tx, ty);
  w.stones.push({ x: from.x, y: from.y, vx, vy, state: "fly", t: 0, passed: -1, hits: 0 });
  if (w.stones.length > 12) w.stones.splice(0, w.stones.length - 12);
  if (!w.unlimited) w.pebbles--;
  w.thrown++;
  w.p.facing = tx < w.p.x + w.p.w / 2 ? -1 : 1;
  return true;
}

/** What a point is inside: the floor index, rock, or air (out of the room's sides: rock). */
const cellOfPoint = (w: World, x: number, y: number) => (x < 0 || x >= w.room.width ? ROCK : cellAt(w.room, Math.floor(x / TILE), Math.floor(y / TILE)));

const pointSolid = (w: World, x: number, y: number) => {
  const v = cellOfPoint(w, x, y);
  return v === ROCK || (v >= 0 && floorSolid(w, v));
};

function hit(w: World, s: Stone, v: number, x: number, y: number) {
  const loud = s.hits === 0;
  s.hits++;
  if (v >= 0) {
    const f = w.room.floors[v]!;
    w.fs.tested[v] = 1;
    if (f.kind === "invisible") {
      w.fs.reveal[v] = REVEAL_TICKS;
      if (loud) w.events.push({ type: "tink", x, y, floor: v });
      return;
    }
    if (f.kind === "crumble" && w.fs.phase[v] === 0) startCrumble(w, v);
  }
  w.events.push({ type: "tok", x, y, floor: v, soft: !loud });
}

function updateStones(w: World) {
  for (const s of w.stones) {
    if (s.state === "gone") continue;
    s.t++;
    if (s.state === "rest") {
      // The floor under it fell away (a crumble, a flip): it falls too.
      if (!pointSolid(w, s.x, s.y + 2)) {
        s.state = "fly";
        s.vx = 0;
        s.vy = 0;
      } else if (s.t > 150) s.state = "gone";
      continue;
    }
    s.vy = Math.min(7, s.vy + PEBBLE_GRAVITY);
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(s.vx), Math.abs(s.vy)) / 2));
    for (let k = 0; k < n && s.state === "fly"; k++) {
      const nx = s.x + s.vx / n;
      const ny = s.y + s.vy / n;
      const v = cellOfPoint(w, nx, ny);
      if (v >= 0 && !floorSolid(w, v)) {
        // Straight through: nothing there (one quiet "fwip" per floor). It drops down the hole it
        // found, and anything it bumps on the way down is only a soft knock: the answer was silence.
        if (s.passed !== v) {
          s.passed = v;
          s.hits++;
          s.vx = 0;
          w.fs.tested[v] = 1;
          w.events.push({ type: "fwip", x: nx, y: w.room.floors[v]!.y, floor: v });
        }
        s.x = nx;
        s.y = ny;
        continue;
      }
      if (!pointSolid(w, nx, ny)) {
        s.x = nx;
        s.y = ny;
        continue;
      }
      const vertical = pointSolid(w, s.x, ny);
      if (vertical || !pointSolid(w, nx, s.y)) {
        // Up or down into something (or a corner, which counts as the same).
        const landing = s.vy > 0;
        const top = Math.floor(ny / TILE) * TILE;
        hit(w, s, vertical ? cellOfPoint(w, s.x, ny) : cellOfPoint(w, nx, ny), s.x, landing ? top : ny);
        if (landing) {
          s.y = top - 1;
          s.vy = -s.vy * 0.35;
          s.vx *= 0.55;
          if (Math.abs(s.vy) < 0.9) {
            s.state = "rest";
            s.t = 0;
            s.vx = 0;
            s.vy = 0;
          }
        } else s.vy = Math.abs(s.vy) * 0.3;
      } else {
        // Sideways into a wall.
        hit(w, s, cellOfPoint(w, nx, s.y), nx, s.y);
        s.vx = -s.vx * 0.4;
      }
      break;
    }
    if (s.y > VIEW_H + 24) s.state = "gone";
  }
  if (w.stones.length && w.stones.every((s) => s.state === "gone")) w.stones = [];
}
