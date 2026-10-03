// One attempt at a level, simulated one tick (1/60 s) at a time (Plan/06-trapsprint.md §12).
// Fully deterministic: no randomness, no clocks, plain arithmetic. The same input bits always give
// the same run, which is what makes ghosts, the All-Deaths Replay and the solver possible.
// Everything is plain data, so a world can be cloned cheaply (the solver clones millions).
import { inset, overlaps, type Rect, type Solids } from "@/engine/platformer/physics";
import { createRunner, stepRunner, type Runner } from "@/engine/platformer/runner";
import {
  CHECKPOINT_LAUNCH,
  COLS,
  CONVEYOR_SPEED,
  FOLLOW_DELAY,
  HEIGHT,
  JUMP,
  LEFT,
  PLAYER_H,
  PLAYER_W,
  RIGHT,
  ROWS,
  SIDE_SPRING,
  SPRING_SPEED,
  TILE,
  TUNING,
  WIDTH,
} from "./constants";
import type { Cell, Level, TrapDef, TrapKind } from "./level";

export type DeathCause = TrapKind | "spikes" | "pit" | "ghost";

export type Phase = "idle" | "warn" | "fire" | "rest" | "back" | "done";

export interface TrapState {
  phase: Phase;
  /** Ticks in the current phase. */
  t: number;
  /** Offset from the anchor, in pixels. */
  dx: number;
  dy: number;
  /** Speed along its path. */
  v: number;
  /** Kind-specific: conveyor direction, "passed by" for return traps, revealed blocks… */
  flag: number;
  /** Kind-specific counter: still-standing ticks, the tick it fired… */
  n: number;
}

export type GameEvent =
  | { type: "jump" }
  | { type: "land"; impact: number }
  | { type: "bonk" }
  | { type: "spring"; sideways: boolean }
  | { type: "coin"; index: number }
  | { type: "checkpoint"; index: number }
  | { type: "trap"; id: string; kind: TrapKind; phase: Phase }
  | { type: "die"; cause: DeathCause; x: number; y: number }
  | { type: "win" }
  | { type: "fakeHop" };

export interface World {
  readonly level: Level;
  readonly attempt: number;
  tick: number;
  status: "play" | "dead" | "won";
  cause: DeathCause | null;
  p: Runner;
  traps: TrapState[];
  exit: Rect & { hidden: boolean };
  /** Coins collected this attempt (bitmask). */
  coins: number;
  /** The checkpoint reached this attempt (-1: none). */
  checkpoint: number;
  /** The player's centre every tick, for the Follower (a ring buffer). */
  path: Int16Array;
  /** "Your Own Ghost": the best run's centre per tick (shared, never changed). */
  readonly ghost: Int16Array | null;
  /** The last trap that threw you somewhere (springs, flips, bonks): deaths soon after are its fault. */
  blame: { kind: TrapKind; tick: number } | null;
  /** Airborne over painted spikes (for Paranoid). */
  overFake: boolean;
  /** Assist: traps can't hurt you (falling still sends you back). */
  invincible: boolean;
  events: GameEvent[];
}

const RING = 128;
const BLAME_TICKS = 70;
/** The shortest saw warning (0.4 s). */
const SAW_WARN = 24;
/** "Your Own Ghost" leaves the start with you: its spike ball is harmless for the first half second. */
export const GHOST_GRACE = 30;

export function createWorld(
  level: Level,
  { attempt = 0, checkpoint = -1, ghost = null }: { attempt?: number; checkpoint?: number; ghost?: Int16Array | null } = {},
): World {
  const start = checkpoint >= 0 && level.checkpoints[checkpoint] ? level.checkpoints[checkpoint] : null;
  const sx = start ? start.x - 1 : level.spawn.x;
  const sy = start ? start.y + start.h - PLAYER_H : level.spawn.y;
  const fake = level.traps.some((t) => t.kind === "fakeDoor");
  const world: World = {
    level,
    attempt,
    tick: 0,
    status: "play",
    cause: null,
    p: createRunner(sx, sy, PLAYER_W, PLAYER_H),
    traps: level.traps.map((def) => ({ phase: "idle", t: 0, dx: 0, dy: 0, v: 0, flag: def.kind === "conveyorFlip" ? (def.dir ?? 1) : 0, n: 0 })),
    exit: { ...level.exit, hidden: fake },
    coins: 0,
    checkpoint,
    path: new Int16Array(RING * 2),
    ghost: level.ghostTrap ? ghost : null,
    blame: null,
    overFake: false,
    invincible: false,
    events: [],
  };
  world.p.grounded = true;
  world.p.coyote = TUNING.coyoteTicks;
  return world;
}

export function cloneWorld(w: World): World {
  return {
    ...w,
    p: { ...w.p },
    traps: w.traps.map((t) => ({ ...t })),
    exit: { ...w.exit },
    path: w.path.slice(),
    blame: w.blame ? { ...w.blame } : null,
    events: [],
  };
}

// ---------------------------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------------------------

const cellAt = (level: Level, c: number, r: number): Cell => (c < 0 || c >= COLS || r < 0 || r >= ROWS ? "air" : level.grid[r]![c]!);
const isSolidCell = (cell: Cell) => cell === "ground" || cell === "conveyorRight" || cell === "conveyorLeft";

/** Where a trap's anchor is now: the Second-Try trap sits elsewhere after your first death. */
export function anchorOf(w: World, i: number): Rect {
  const def = w.level.traps[i]!;
  const r = def.rect;
  if (def.retry && w.attempt > 0) return { x: r.x + def.retry[0] * TILE, y: r.y + def.retry[1] * TILE, w: r.w, h: r.h };
  return r;
}

/** The rectangle a trap occupies right now. */
export function trapRect(w: World, i: number): Rect {
  const a = anchorOf(w, i);
  const s = w.traps[i]!;
  return { x: a.x + s.dx, y: a.y + s.dy, w: a.w, h: a.h };
}

/**
 * Squeeze walls: two slabs slide out of the walls at either end of the corridor and meet at the
 * `meet` column (under the way out) after `close` ticks. Progress lives in `dx` (0–1).
 */
export function squeezeWalls(w: World, i: number): [Rect, Rect] {
  const def = w.level.traps[i]!;
  const a = anchorOf(w, i);
  const f = w.traps[i]!.dx;
  const meetX = ((def.meet ?? (def.cells[0] + def.cells[2]) / 2) + 0.5) * TILE + (anchorOf(w, i).x - def.rect.x);
  const leftEdge = a.x + f * (meetX - a.x);
  const rightEdge = a.x + a.w + f * (meetX - (a.x + a.w));
  return [
    { x: leftEdge - TILE, y: a.y, w: TILE, h: a.h },
    { x: rightEdge, y: a.y, w: TILE, h: a.h },
  ];
}

/** Remix traps warn sooner and move faster. */
const meaner = (def: TrapDef, value: number, faster: boolean) => (def.remixed ? (faster ? value * 1.12 : Math.round(value * 0.75)) : value);

function trapSolids(w: World, i: number, out: Rect[]) {
  const def = w.level.traps[i]!;
  const s = w.traps[i]!;
  switch (def.kind) {
    case "dropFloor":
      if (s.phase === "idle" || s.phase === "warn") out.push(trapRect(w, i));
      break;
    case "crusher":
    case "risingFloor":
    case "invisibleBlock":
    case "conveyorFlip":
      out.push(trapRect(w, i));
      break;
    case "wallSqueeze":
      if (s.phase !== "idle") out.push(...squeezeWalls(w, i));
      break;
  }
}

export function solidsFor(w: World, ignore = -1): Solids {
  const level = w.level;
  const dynamic: Rect[] = [];
  w.traps.forEach((_, i) => {
    if (i !== ignore) trapSolids(w, i, dynamic);
  });
  return {
    solidAt(x, y, bw, bh) {
      if (x < 0 || x + bw > WIDTH || y < 0) return true;
      const c0 = Math.floor(x / TILE);
      const c1 = Math.floor((x + bw - 1) / TILE);
      const r0 = Math.floor(y / TILE);
      const r1 = Math.floor((y + bh - 1) / TILE);
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (isSolidCell(cellAt(level, c, r))) return true;
      const probe = { x, y, w: bw, h: bh };
      for (const d of dynamic) if (overlaps(probe, d)) return true;
      return false;
    },
    ledgeAt(x, y, bw) {
      if (y % TILE !== 0) return false;
      const r = y / TILE;
      const c0 = Math.floor(x / TILE);
      const c1 = Math.floor((x + bw - 1) / TILE);
      for (let c = c0; c <= c1; c++) if (cellAt(level, c, r) === "ledge") return true;
      return false;
    },
  };
}

/** Hitboxes for the level's fixed spikes: a bit smaller than they look (Plan §10.7). */
const spikeCache = new WeakMap<Level, Rect[]>();
export function spikeHitboxes(level: Level): Rect[] {
  const hit = spikeCache.get(level);
  if (hit) return hit;
  const out: Rect[] = [];
  level.grid.forEach((row, r) =>
    row.forEach((cell, c) => {
      const x = c * TILE;
      const y = r * TILE;
      if (cell === "spikeUp") out.push({ x: x + 3, y: y + 9, w: 10, h: 7 });
      if (cell === "spikeDown") out.push({ x: x + 3, y, w: 10, h: 7 });
      if (cell === "spikeRight") out.push({ x, y: y + 3, w: 7, h: 10 });
      if (cell === "spikeLeft") out.push({ x: x + 9, y: y + 3, w: 7, h: 10 });
    }),
  );
  spikeCache.set(level, out);
  return out;
}

const centre = (r: Rect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });

const circleHits = (cx: number, cy: number, radius: number, r: Rect) => {
  const nx = Math.max(r.x, Math.min(cx, r.x + r.w));
  const ny = Math.max(r.y, Math.min(cy, r.y + r.h));
  return (cx - nx) * (cx - nx) + (cy - ny) * (cy - ny) < radius * radius;
};

/** The first solid row below a pixel rectangle (for things that fall). */
function floorBelow(w: World, r: Rect, ignore: number): number {
  const solids = solidsFor(w, ignore);
  let y = r.y + r.h;
  while (y < HEIGHT + TILE && !solids.solidAt(r.x + 2, y, r.w - 4, 1)) y++;
  return y;
}

// ---------------------------------------------------------------------------------------------
// Triggers
// ---------------------------------------------------------------------------------------------

const inCells = (p: Rect, cols: [number, number], rows: [number, number]) =>
  overlaps(p, { x: cols[0] * TILE, y: rows[0] * TILE, w: (cols[1] - cols[0] + 1) * TILE, h: (rows[1] - rows[0] + 1) * TILE });

/** Which way the level runs past a trap: away from the spawn (mirrored in Remix). */
const forwardOf = (w: World, a: Rect) => (w.level.spawn.x < a.x ? 1 : -1);

const standingOn = (p: Runner, r: Rect) => p.grounded && p.y + p.h === r.y && p.x + p.w > r.x && p.x < r.x + r.w;

/** Default triggers (Plan §3): each trap fires the way the trap table describes. */
function defaultTrigger(def: TrapDef, a: Rect): (w: World, s: TrapState, jumped: boolean) => boolean {
  const c0 = Math.floor(a.x / TILE);
  const c1 = Math.floor((a.x + a.w - 1) / TILE);
  const r0 = Math.floor(a.y / TILE);
  const r1 = Math.floor((a.y + a.h - 1) / TILE);
  switch (def.kind) {
    case "popSpikes":
      return (w) => inCells(w.p, [c0, c1], [Math.max(0, r0 - 4), r1]);
    case "returnTrap":
      return (w, s) => s.flag === 1 && w.p.vx * forwardOf(w, a) < 0 && inCells(w.p, [c0, c1], [Math.max(0, r0 - 4), r1]);
    case "dropFloor":
      return (w) => standingOn(w.p, a);
    case "risingFloor":
      return (_w, s) => s.n >= 40;
    case "crusher":
    case "stalactite":
      return (w) => inCells(w.p, [c0 - (def.kind === "stalactite" ? 1 : 0), c1 + (def.kind === "stalactite" ? 1 : 0)], [r1 + 1, ROWS - 1]);
    case "runawayDoor":
      return (w) => Math.abs(centre(w.p).x - centre(w.exit).x) < 3 * TILE && Math.abs(centre(w.p).y - centre(w.exit).y) < 2 * TILE;
    case "fakeDoor":
      return (w) => overlaps(w.p, { x: a.x + 2, y: a.y - 8, w: TILE - 4, h: TILE + 8 });
    case "jumpPunisher":
      return (w, _s, jumped) => jumped && inCells(w.p, [c0, c1], [r1 + 1, ROWS - 1]);
    case "wallSqueeze":
      return (w) => overlaps(w.p, a);
    case "fakeCheckpoint":
    case "coinBait":
    case "sidewaysSpring":
      return (w) => overlaps(w.p, a);
    case "conveyorFlip": {
      // Halfway across: the half nearer the exit (mirrored in Remix).
      const half = Math.floor((c0 + c1) / 2);
      return (w) => inCells(w.p, forwardOf(w, a) > 0 ? [half + 1, c1] : [c0, half], [r0 - 1, r0 - 1]);
    }
    case "victoryBanner":
      return (w) => inCells(w.p, [c0 - 2, c1 + 1], [r1 + 1, ROWS - 1]);
    case "saw":
      return (w) => inCells(w.p, [0, COLS - 1], [r0 - 1, r1 + 1]);
    case "follower":
      return () => true;
    case "invisibleBlock":
    case "fakeSpikes":
      return () => false;
  }
}

function triggered(w: World, i: number, jumped: boolean): boolean {
  const def = w.level.traps[i]!;
  const s = w.traps[i]!;
  const trig = def.trigger;
  if (!trig) return defaultTrigger(def, anchorOf(w, i))(w, s, jumped);
  switch (trig.on) {
    case "zone":
      return inCells(w.p, trig.cols, trig.rows);
    case "jump":
      return jumped && inCells(w.p, trig.cols, trig.rows);
    case "return":
      return s.flag === 1 && w.p.vx * forwardOf(w, anchorOf(w, i)) < 0 && inCells(w.p, trig.cols, trig.rows);
    case "near": {
      const dx = centre(w.p).x - centre(anchorOf(w, i)).x;
      const dy = centre(w.p).y - centre(anchorOf(w, i)).y;
      return dx * dx + dy * dy < (trig.tiles * TILE) ** 2;
    }
    case "land":
      return standingOn(w.p, trapRect(w, i));
    case "touch":
      return overlaps(w.p, trapRect(w, i));
    case "still":
      return s.n >= trig.ticks;
    case "after": {
      const j = w.level.traps.findIndex((t) => t.id === trig.trap);
      const other = w.traps[j];
      return Boolean(other && other.phase !== "idle" && w.tick - other.n >= trig.ticks);
    }
    case "start":
      return true;
    case "never":
      return false;
  }
}

// ---------------------------------------------------------------------------------------------
// The tick
// ---------------------------------------------------------------------------------------------

function kill(w: World, cause: DeathCause) {
  if (w.status !== "play" || (w.invincible && cause !== "pit")) return;
  // A trap that threw you into something gets the credit.
  const blamed = w.blame && w.tick - w.blame.tick <= BLAME_TICKS && (cause === "spikes" || cause === "pit") ? w.blame.kind : null;
  w.status = "dead";
  w.cause = blamed ?? cause;
  const c = centre(w.p);
  w.events.push({ type: "die", cause: w.cause, x: c.x, y: c.y });
}

function fire(w: World, i: number, phase: Phase) {
  const s = w.traps[i]!;
  s.phase = phase;
  s.t = 0;
  if (phase === "warn" || phase === "fire") s.n = w.tick;
  w.events.push({ type: "trap", id: w.level.traps[i]!.id, kind: w.level.traps[i]!.kind, phase });
}

export function step(w: World, bits: number): void {
  w.events = [];
  if (w.status !== "play") return;
  const p = w.p;
  const level = w.level;

  // Conveyors carry whoever stands on them.
  let carry = 0;
  if (p.grounded) {
    const row = Math.floor((p.y + p.h) / TILE);
    for (let c = Math.floor(p.x / TILE); c <= Math.floor((p.x + p.w - 1) / TILE); c++) {
      const cell = cellAt(level, c, row);
      if (cell === "conveyorRight") carry = CONVEYOR_SPEED;
      if (cell === "conveyorLeft") carry = -CONVEYOR_SPEED;
    }
    level.traps.forEach((def, i) => {
      if (def.kind !== "conveyorFlip" || !standingOn(p, trapRect(w, i))) return;
      carry = CONVEYOR_SPEED * w.traps[i]!.flag;
      // Riding a belt that turned on you: wherever it dumps you is its fault.
      if (w.traps[i]!.flag !== (def.dir ?? 1)) w.blame = { kind: "conveyorFlip", tick: w.tick };
    });
  }

  const wasAirborne = !p.grounded;
  const moved = stepRunner(p, { left: (bits & LEFT) !== 0, right: (bits & RIGHT) !== 0, jump: (bits & JUMP) !== 0 }, solidsFor(w), TUNING, carry);
  if (moved.jumped) w.events.push({ type: "jump" });
  if (moved.landed && wasAirborne) w.events.push({ type: "land", impact: moved.impact });
  if (moved.bonked) {
    w.events.push({ type: "bonk" });
    // Bonked an invisible block: now you've seen it.
    const head = { x: p.x, y: p.y - 2, w: p.w, h: 2 };
    level.traps.forEach((def, i) => {
      if (def.kind === "invisibleBlock" && overlaps(head, trapRect(w, i)) && !w.traps[i]!.flag) {
        w.traps[i]!.flag = 1;
        w.blame = { kind: "invisibleBlock", tick: w.tick };
        w.events.push({ type: "trap", id: def.id, kind: def.kind, phase: "fire" });
      }
    });
  }

  // Springs, coins, checkpoints.
  for (const spring of level.springs) {
    if (p.vy >= 0 && overlaps(p, spring)) {
      p.vy = SPRING_SPEED;
      p.rising = false;
      p.grounded = false;
      p.coyote = 0;
      w.events.push({ type: "spring", sideways: false });
    }
  }
  level.coins.forEach((coin, i) => {
    if (!(w.coins & (1 << i)) && overlaps(p, coin)) {
      w.coins |= 1 << i;
      w.events.push({ type: "coin", index: i });
    }
  });
  level.checkpoints.forEach((flag, i) => {
    if (w.checkpoint < i && overlaps(p, flag)) {
      w.checkpoint = i;
      w.events.push({ type: "checkpoint", index: i });
    }
  });

  // Traps: triggers, then motion.
  for (let i = 0; i < level.traps.length; i++) updateTrap(w, i, moved.jumped);
  if (w.status !== "play") return;

  // Record the path (the Follower runs it 2 s behind).
  const c = centre(p);
  const slot = (w.tick % RING) * 2;
  w.path[slot] = Math.round(c.x);
  w.path[slot + 1] = Math.round(c.y);

  // Painted spikes: jumping clean over them counts toward Paranoid.
  if (!p.grounded) {
    level.traps.forEach((def, i) => {
      if (def.kind !== "fakeSpikes") return;
      const a = anchorOf(w, i);
      if (p.x + p.w > a.x && p.x < a.x + a.w && p.y + p.h <= a.y + a.h) w.overFake = true;
    });
  } else if (w.overFake) {
    w.overFake = false;
    const onFake = level.traps.some((def, i) => def.kind === "fakeSpikes" && standingOn(p, { ...anchorOf(w, i), y: anchorOf(w, i).y + TILE }));
    if (!onFake) w.events.push({ type: "fakeHop" });
  }

  // Hazards.
  if (p.y > HEIGHT) kill(w, "pit");
  const body = inset(p, 1);
  for (const spike of spikeHitboxes(level)) if (overlaps(body, spike)) kill(w, "spikes");
  for (let i = 0; i < level.traps.length && w.status === "play"; i++) hazards(w, i, body);
  if (w.ghost && w.status === "play") {
    const g = ghostPosition(w);
    if (g?.armed && circleHits(g.x, g.y, 6, body)) kill(w, "ghost");
  }

  if (w.status === "play" && !w.exit.hidden && overlaps(p, w.exit)) {
    w.status = "won";
    w.events.push({ type: "win" });
  }
  w.tick++;
}

/** Things that hurt: a trap's deadly parts this tick. */
function hazards(w: World, i: number, body: Rect) {
  const def = w.level.traps[i]!;
  const s = w.traps[i]!;
  const a = anchorOf(w, i);
  const r = trapRect(w, i);
  switch (def.kind) {
    case "popSpikes":
    case "returnTrap":
      if (s.phase === "fire" && s.t >= 1 && overlaps(body, { x: a.x + 2, y: a.y + a.h - 9, w: a.w - 4, h: 9 })) kill(w, def.kind);
      break;
    case "jumpPunisher":
      if (s.phase === "fire" && overlaps(body, { x: a.x + 2, y: a.y, w: a.w - 4, h: 9 })) kill(w, def.kind);
      break;
    case "crusher":
    case "risingFloor":
      if (overlaps(body, r)) kill(w, def.kind);
      break;
    case "wallSqueeze":
      if (s.phase !== "idle" && squeezeWalls(w, i).some((wall) => overlaps(body, wall))) kill(w, def.kind);
      break;
    case "saw":
      if (s.phase === "fire") {
        const cx = r.x + r.w / 2;
        const cy = r.y + r.h / 2;
        if (circleHits(cx, cy, 9, body)) kill(w, def.kind);
      }
      break;
    case "stalactite":
    case "victoryBanner":
      if (s.phase === "fire" && overlaps(body, inset(r, 3))) kill(w, def.kind);
      break;
    case "coinBait":
      if (s.phase === "fire" && s.t >= 2 && overlaps(body, { x: a.x - TILE + 3, y: a.y - TILE + 3, w: TILE * 3 - 6, h: TILE * 3 - 6 })) kill(w, def.kind);
      break;
    case "follower":
      if (w.tick >= FOLLOW_DELAY) {
        const slot = ((w.tick - FOLLOW_DELAY) % RING) * 2;
        if (circleHits(w.path[slot]!, w.path[slot + 1]!, 6, body)) kill(w, def.kind);
      }
      break;
  }
}

/** Advance one trap: fire when its trigger says so, then move. */
function updateTrap(w: World, i: number, jumped: boolean) {
  const def = w.level.traps[i]!;
  const s = w.traps[i]!;
  const p = w.p;
  s.t++;

  if (def.kind === "returnTrap" && s.flag === 0) {
    const a = anchorOf(w, i);
    const past = forwardOf(w, a) > 0 ? p.x > a.x + a.w : p.x + p.w < a.x;
    if (past) s.flag = 1;
  }
  if (def.kind === "risingFloor" && s.phase === "idle") s.n = standingOn(p, trapRect(w, i)) && Math.abs(p.vx) < 0.05 ? s.n + 1 : 0;

  if (s.phase === "idle" && def.kind !== "fakeSpikes" && def.kind !== "invisibleBlock") {
    if (triggered(w, i, jumped)) {
      const warns = ["dropFloor", "crusher", "saw", "stalactite", "victoryBanner"].includes(def.kind);
      fire(w, i, warns && (def.warn ?? 1) > 0 ? "warn" : "fire");
      onFire(w, i);
    }
  }

  let warnTicks = meaner(def, def.warn ?? { dropFloor: 5, crusher: 8, saw: 24, stalactite: 18, victoryBanner: 7 }[def.kind as string] ?? 0, false);
  // Anything that flies in from off-screen is heard at least 0.4 s before it arrives (Plan §10.5).
  if (def.kind === "saw") warnTicks = Math.max(SAW_WARN, warnTicks);
  if (s.phase === "warn" && s.t >= warnTicks) fire(w, i, "fire");

  switch (def.kind) {
    case "sidewaysSpring":
      // Fires once per landing: re-arms when you're off it.
      if (s.phase === "fire" && !overlaps(p, trapRect(w, i))) s.phase = "idle";
      break;
    case "dropFloor":
      if (s.phase === "fire") {
        s.v = Math.min(9, s.v + 0.5);
        s.dy += s.v;
        if (s.dy > HEIGHT) s.phase = "done";
      }
      break;
    case "crusher": {
      const a = anchorOf(w, i);
      if (s.phase === "fire") {
        if (s.t === 0 || s.flag === 0) s.flag = floorBelow(w, a, i) - (a.y + a.h);
        const limit = s.flag;
        s.v = Math.min(10, s.v + 1);
        s.dy = Math.min(limit, s.dy + s.v);
        if (s.dy >= limit) {
          fire(w, i, "rest");
          s.v = 0;
        }
      } else if (s.phase === "rest" && s.t >= 40) {
        fire(w, i, "back");
      } else if (s.phase === "back") {
        s.dy = Math.max(0, s.dy - 1.2);
        if (s.dy === 0) {
          s.phase = "idle";
          s.flag = 0;
        }
      }
      break;
    }
    case "runawayDoor":
      if (s.phase === "fire") {
        const target = (def.to ?? COLS - 2) * TILE + 2;
        const dir = Math.sign(target - w.exit.x);
        const speed = meaner(def, def.speed ?? 2.6, true);
        if (Math.abs(target - w.exit.x) <= speed) {
          w.exit.x = target;
          s.phase = "done";
        } else w.exit.x += dir * speed;
        s.dx = w.exit.x - (anchorOf(w, i).x + 2);
      }
      break;
    case "saw":
      if (s.phase === "fire") {
        s.dx += (def.dir ?? 1) * meaner(def, def.speed ?? 4.2, true);
        if (s.dx < -WIDTH - 40 || s.dx > WIDTH + 40) s.phase = "done";
      }
      break;
    case "stalactite":
    case "victoryBanner": {
      if (s.phase === "fire") {
        const a = anchorOf(w, i);
        if (s.t === 0 || s.flag === 0) s.flag = floorBelow(w, a, i) - (a.y + a.h);
        const limit = s.flag;
        s.v = Math.min(9, s.v + (def.kind === "victoryBanner" ? 0.6 : 0.5));
        s.dy = Math.min(limit, s.dy + s.v);
        if (s.dy >= limit) fire(w, i, def.kind === "stalactite" ? "done" : "rest");
      }
      break;
    }
    case "wallSqueeze":
      if (s.phase === "fire") {
        s.dx = Math.min(1, s.t / meaner(def, def.close ?? 60, false));
        if (s.dx >= 1) s.phase = "done";
      }
      break;
    case "risingFloor":
      if (s.phase === "fire") {
        const limit = -(def.rise ?? 4) * TILE;
        if (s.dy > limit) {
          const riding = standingOn(p, trapRect(w, i));
          s.dy -= 1;
          if (riding) {
            // Carry the rider up; squashed if there's no room.
            const solids = solidsFor(w, i);
            if (solids.solidAt(p.x, p.y - 1, p.w, p.h)) kill(w, "risingFloor");
            else p.y -= 1;
          }
        } else s.phase = "done";
      }
      break;
  }
}

/** The instant a trap fires. */
function onFire(w: World, i: number) {
  const def = w.level.traps[i]!;
  const s = w.traps[i]!;
  const p = w.p;
  switch (def.kind) {
    case "fakeDoor":
      w.exit.hidden = false;
      break;
    case "fakeCheckpoint":
      p.vy = CHECKPOINT_LAUNCH;
      p.vx = 0;
      p.rising = false;
      p.grounded = false;
      p.coyote = 0;
      w.blame = { kind: "fakeCheckpoint", tick: w.tick };
      break;
    case "sidewaysSpring":
      p.vx = (def.dir ?? 1) * SIDE_SPRING.vx;
      p.vy = SIDE_SPRING.vy;
      p.rising = false;
      p.grounded = false;
      p.coyote = 0;
      w.blame = { kind: "sidewaysSpring", tick: w.tick };
      w.events.push({ type: "spring", sideways: true });
      break;
    case "conveyorFlip":
      s.flag = -s.flag;
      w.blame = { kind: "conveyorFlip", tick: w.tick };
      break;
    case "dropFloor":
      w.blame = { kind: "dropFloor", tick: w.tick };
      break;
  }
}

/** Where the Follower is drawn (asleep at its start for the first 2 seconds). */
export function followerPosition(w: World, i: number): { x: number; y: number; awake: boolean } {
  if (w.tick >= FOLLOW_DELAY) {
    const slot = ((w.tick - FOLLOW_DELAY) % RING) * 2;
    return { x: w.path[slot]!, y: w.path[slot + 1]!, awake: true };
  }
  const a = anchorOf(w, i);
  return { x: a.x + a.w / 2, y: a.y + a.h / 2, awake: false };
}

/**
 * "Your Own Ghost": where your best run was at this tick. It goes through the door when that run
 * ended, so a slower run can still finish.
 */
export function ghostPosition(w: World): { x: number; y: number; armed: boolean } | null {
  if (!w.ghost || w.tick >= w.ghost.length / 2) return null;
  return { x: w.ghost[w.tick * 2]!, y: w.ghost[w.tick * 2 + 1]!, armed: w.tick >= GHOST_GRACE };
}

/** Run a recording and note the player's centre each tick (the path "Your Own Ghost" follows). */
export function tracePath(level: Level, bits: Iterable<number>, { attempt = 0 }: { attempt?: number } = {}): Int16Array {
  const w = createWorld(level, { attempt });
  const out: number[] = [];
  for (const b of bits) {
    step(w, b);
    const c = centre(w.p);
    out.push(Math.round(c.x), Math.round(c.y));
    if (w.status !== "play") break;
  }
  return Int16Array.from(out);
}

/** Where a trap's trigger is, for assist mode's "reveal traps" (null: nothing to show). */
export function triggerArea(w: World, i: number): Rect | null {
  const def = w.level.traps[i]!;
  const a = anchorOf(w, i);
  const cells = (cols: [number, number], rows: [number, number]): Rect => ({
    x: cols[0] * TILE,
    y: rows[0] * TILE,
    w: (cols[1] - cols[0] + 1) * TILE,
    h: (rows[1] - rows[0] + 1) * TILE,
  });
  const trig = def.trigger;
  if (trig) {
    switch (trig.on) {
      case "zone":
      case "jump":
      case "return":
        return cells(trig.cols, trig.rows);
      case "near": {
        const c = centre(a);
        const r = trig.tiles * TILE;
        return { x: c.x - r, y: c.y - r, w: r * 2, h: r * 2 };
      }
      case "land":
      case "touch":
        return trapRect(w, i);
      default:
        return null;
    }
  }
  const c0 = Math.floor(a.x / TILE);
  const c1 = Math.floor((a.x + a.w - 1) / TILE);
  const r0 = Math.floor(a.y / TILE);
  const r1 = Math.floor((a.y + a.h - 1) / TILE);
  switch (def.kind) {
    case "popSpikes":
    case "returnTrap":
      return cells([c0, c1], [Math.max(0, r0 - 4), r1]);
    case "dropFloor":
    case "risingFloor":
      return { x: a.x, y: a.y - TILE, w: a.w, h: TILE };
    case "crusher":
    case "jumpPunisher":
      return cells([c0, c1], [r1 + 1, ROWS - 1]);
    case "stalactite":
      return cells([c0 - 1, c1 + 1], [r1 + 1, ROWS - 1]);
    case "victoryBanner":
      return cells([c0 - 2, c1 + 1], [r1 + 1, ROWS - 1]);
    case "saw":
      return cells([0, COLS - 1], [r0 - 1, r1 + 1]);
    case "runawayDoor": {
      const c = centre(w.exit);
      return { x: c.x - 3 * TILE, y: c.y - 2 * TILE, w: 6 * TILE, h: 4 * TILE };
    }
    case "fakeDoor":
      return { x: a.x + 2, y: a.y - 8, w: TILE - 4, h: TILE + 8 };
    case "conveyorFlip": {
      const half = Math.floor((c0 + c1) / 2);
      return cells(forwardOf(w, a) > 0 ? [half + 1, c1] : [c0, half], [r0 - 1, r0 - 1]);
    }
    case "wallSqueeze":
    case "fakeCheckpoint":
    case "coinBait":
    case "sidewaysSpring":
    case "invisibleBlock":
      return a;
    default:
      return null;
  }
}
