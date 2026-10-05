// A level being played (Plan/04-dont-trust-the-game.md §4, §5): the hero runs and jumps with the arcade's
// shared platformer feel, real spikes and the coin that doesn't spin kill you, paper spikes don't, blocks can
// be pushed, saws sweep, and touching doors, zones, portals, levers and buttons raises events for the scene to
// act on. Respawn is instant. Plain arithmetic only, so the solver's runs replay exactly.
import { approach, inset, moveX, moveY, onGround, overlaps, type Rect, type Solids } from "@/engine/platformer/physics";
import { createRunner, stepRunner, type Runner } from "@/engine/platformer/runner";
import { BLOCK_RESET_TICKS, JUMP, LEFT, MOON_TICKS, MOON_TUNING, PLAYER_H, PLAYER_W, PUSH_SPEED, RESPAWN_TICKS, RIGHT, TILE, TUNING } from "./constants";
import { CELL, cellAt, levelHeight, type DoorKind, type Level } from "./level";

/** What the scene has set: they change which cells are there, and what you can do. */
export interface WorldFlags {
  /** The Options menu's brightness is up: hidden platforms show (they're always solid). */
  bright: boolean;
  easy: boolean;
  hard: boolean;
  /** Jump is bound to F13 (Chapter 2): pressing jump does nothing. */
  noJump: boolean;
  /** The void's wall has been squeezed (the crank, or the window). */
  squeezed: boolean;
  /** The page was reloaded: the missing door is back. */
  fixed: boolean;
  /** The console opened the door (`please open door`). */
  open: boolean;
  /** Assist: nothing hurts. */
  invincible: boolean;
}

export type DeathCause = "spike" | "coin" | "saw" | "fall";

export type WorldEvent =
  | { type: "jump" }
  | { type: "land"; impact: number }
  | { type: "head" }
  | { type: "die"; cause: DeathCause; x: number; y: number }
  | { type: "respawn" }
  | { type: "coin"; index: number }
  | { type: "paper" }
  | { type: "door"; id: string; kind: DoorKind }
  | { type: "zone"; id: string }
  | { type: "checkpoint"; index: number }
  | { type: "push" }
  | { type: "loaded" }
  | { type: "blockReset" }
  | { type: "portal"; id: string }
  | { type: "bonk"; id: string }
  | { type: "lever"; id: string }
  | { type: "sticker"; id: string }
  | { type: "button"; id: string };

export interface Block extends Rect {
  /** Blocks only move sideways when pushed (moveX), so this stays 0. */
  vx: number;
  vy: number;
  rx: number;
  ry: number;
  home: { x: number; y: number };
  /** Ticks spent jammed against a wall. */
  jammed: number;
  loaded: boolean;
}

export interface World {
  level: Level;
  p: Runner;
  tick: number;
  status: "play" | "dead";
  deadTicks: number;
  respawnAt: { x: number; y: number };
  flags: WorldFlags;
  coins: boolean[];
  /** Cardboard doors that have fallen flat. */
  flattened: Set<string>;
  blocks: Block[];
  /** Where each saw is along its path (px travelled, ping-pong). */
  sawAt: number[];
  /** Things the hero is touching now (to fire once per touch). */
  touching: Set<string>;
  /** Stickers picked up. */
  taken: Set<string>;
  /** Moon jump ticks left. */
  moon: number;
  deaths: number;
  /** The credits line being stood on (it wobbles), or -1. */
  standing: number;
  events: WorldEvent[];
}

export const defaultFlags = (): WorldFlags => ({ bright: false, easy: false, hard: false, noJump: false, squeezed: false, fixed: false, open: false, invincible: false });

export function createWorld(level: Level, flags: Partial<WorldFlags> = {}): World {
  return {
    level,
    p: createRunner(level.spawn.x, level.spawn.y, PLAYER_W, PLAYER_H),
    tick: 0,
    status: "play",
    deadTicks: 0,
    respawnAt: { ...level.spawn },
    flags: { ...defaultFlags(), ...flags },
    coins: level.coins.map(() => false),
    flattened: new Set(),
    blocks: level.blocks.map((b) => ({ ...b, vx: 0, vy: 0, rx: 0, ry: 0, home: { x: b.x, y: b.y }, jammed: 0, loaded: false })),
    sawAt: level.saws.map(() => 0),
    touching: new Set(),
    taken: new Set(),
    moon: 0,
    deaths: 0,
    standing: -1,
    events: [],
  };
}

export function cloneWorld(w: World): World {
  return {
    ...w,
    p: { ...w.p },
    respawnAt: { ...w.respawnAt },
    flags: { ...w.flags },
    coins: [...w.coins],
    flattened: new Set(w.flattened),
    blocks: w.blocks.map((b) => ({ ...b, home: { ...b.home } })),
    sawAt: [...w.sawAt],
    touching: new Set(w.touching),
    taken: new Set(w.taken),
    events: [],
  };
}

/** Is this cell solid right now? (Off the sides is wall; above and below the level is open.) */
export function solidCell(w: World, col: number, row: number): boolean {
  if (col < 0 || col >= w.level.cols) return true;
  switch (cellAt(w.level, col, row)) {
    case CELL.solid:
    case CELL.hidden:
    case CELL.bar:
    case CELL.digit:
    case CELL.bonk:
    case CELL.wall:
    case CELL.plain:
      return true;
    case CELL.easy:
      return w.flags.easy;
    case CELL.hard:
      return w.flags.hard;
    case CELL.wallLow:
      return !w.flags.squeezed;
    default:
      return false;
  }
}

const ledgeCell = (w: World, col: number, row: number) => {
  const c = cellAt(w.level, col, row);
  return c === CELL.ledge || c === CELL.dot || c === CELL.name;
};

function cellsSolid(w: World, x: number, y: number, width: number, height: number): boolean {
  const c0 = Math.floor(x / TILE);
  const c1 = Math.floor((x + width - 1) / TILE);
  const r0 = Math.floor(y / TILE);
  const r1 = Math.floor((y + height - 1) / TILE);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (solidCell(w, c, r)) return true;
  return false;
}

function cellsLedge(w: World, x: number, y: number, width: number): boolean {
  if (y % TILE !== 0) return false;
  const r = y / TILE;
  for (let c = Math.floor(x / TILE); c <= Math.floor((x + width - 1) / TILE); c++) if (ledgeCell(w, c, r)) return true;
  return false;
}

/** What the hero collides with: the cells, and the blocks. */
function heroSolids(w: World): Solids {
  return {
    solidAt: (x, y, width, height) => cellsSolid(w, x, y, width, height) || w.blocks.some((b) => overlaps({ x, y, w: width, h: height }, b)),
    ledgeAt: (x, y, width) => cellsLedge(w, x, y, width),
  };
}

/** What a block collides with: the cells, other blocks and the hero (it won't squash you). */
function blockSolids(w: World, self: Block): Solids {
  return {
    solidAt: (x, y, width, height) => {
      const r = { x, y, w: width, h: height };
      return cellsSolid(w, x, y, width, height) || w.blocks.some((b) => b !== self && overlaps(r, b)) || (w.status === "play" && overlaps(r, w.p));
    },
    ledgeAt: (x, y, width) => cellsLedge(w, x, y, width),
  };
}

const emit = (w: World, e: WorldEvent) => w.events.push(e);

/** (A function, so a status changed by die() is read fresh.) */
const isDead = (w: World) => w.status === "dead";

/** Fire once when a touch starts; forget it when the touch ends. */
function touch(w: World, key: string, now: boolean): boolean {
  if (!now) {
    w.touching.delete(key);
    return false;
  }
  if (w.touching.has(key)) return false;
  w.touching.add(key);
  return true;
}

function die(w: World, cause: DeathCause) {
  if (w.status === "dead") return;
  if (w.flags.invincible && cause !== "fall") return;
  w.status = "dead";
  w.deadTicks = RESPAWN_TICKS;
  w.deaths++;
  emit(w, { type: "die", cause, x: w.p.x + w.p.w / 2, y: w.p.y + w.p.h / 2 });
}

function respawn(w: World) {
  const { x, y } = w.respawnAt;
  w.p = createRunner(x, y, PLAYER_W, PLAYER_H);
  w.status = "play";
  w.moon = 0;
  emit(w, { type: "respawn" });
}

/** Where saw `i` is now. */
export function sawPosition(w: World, i: number): { x: number; y: number } {
  const saw = w.level.saws[i]!;
  const pts = saw.path;
  if (pts.length === 1) return pts[0]!;
  let total = 0;
  for (let k = 1; k < pts.length; k++) total += Math.hypot(pts[k]!.x - pts[k - 1]!.x, pts[k]!.y - pts[k - 1]!.y);
  let d = w.sawAt[i]! % (total * 2);
  if (d > total) d = total * 2 - d;
  for (let k = 1; k < pts.length; k++) {
    const a = pts[k - 1]!;
    const b = pts[k]!;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (d <= len || k === pts.length - 1) {
      const t = len === 0 ? 0 : Math.min(1, d / len);
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    d -= len;
  }
  return pts[pts.length - 1]!;
}

const circleHits = (r: Rect, cx: number, cy: number, radius: number) => {
  const nx = Math.max(r.x, Math.min(cx, r.x + r.w));
  const ny = Math.max(r.y, Math.min(cy, r.y + r.h));
  return (nx - cx) ** 2 + (ny - cy) ** 2 < radius * radius;
};

/** Push the block the hero is walking into (before the hero moves, so it follows at the block's pace). */
function push(w: World, dir: number) {
  if (dir === 0) return;
  const p = w.p;
  for (const b of w.blocks) {
    if (b.loaded) continue;
    const beside = dir > 0 ? b.x === p.x + p.w : b.x + b.w === p.x;
    const level = b.y < p.y + p.h - 2 && b.y + b.h > p.y + 2;
    // Only a block that's sitting on something moves (one that's falling drops straight).
    if (!beside || !level || !onGround(b, blockSolids(w, b))) continue;
    p.vx = approach(p.vx, dir * PUSH_SPEED, 1);
    const before = b.x;
    moveX(b, dir * PUSH_SPEED, blockSolids(w, b));
    if (b.x !== before) emit(w, { type: "push" });
  }
}

function stepBlocks(w: World) {
  for (const b of w.blocks) {
    if (b.loaded) continue;
    const solids = blockSolids(w, b);
    if (!onGround(b, solids)) {
      b.vy = Math.min(5, b.vy + TUNING.gravity);
      if (moveY(b, b.vy, solids)) b.vy = 0;
    } else b.vy = 0;
    // Dropping into the gap (a pixel or two off still counts: it settles in).
    const notch = w.level.notch;
    if (notch && Math.abs(b.x - notch.x) <= 8 && b.y + b.h >= notch.y && b.y <= notch.y) {
      Object.assign(b, { x: notch.x, y: notch.y, vy: 0, rx: 0, ry: 0, loaded: true });
      emit(w, { type: "loaded" });
      continue;
    }
    // Jammed against a wall (or fallen off the level)? It goes home.
    const jammed = cellsSolid(w, b.x + 1, b.y, b.w, b.h) && cellsSolid(w, b.x + b.w, b.y + 2, 1, b.h - 4);
    b.jammed = jammed ? b.jammed + 1 : 0;
    if (b.jammed > BLOCK_RESET_TICKS || b.y > levelHeight(w.level) + 64) {
      Object.assign(b, { x: b.home.x, y: b.home.y, vy: 0, rx: 0, ry: 0, jammed: 0 });
      emit(w, { type: "blockReset" });
    }
  }
}

/** One tick: `bits` are LEFT | RIGHT | JUMP. */
export function step(w: World, bits: number) {
  w.events = [];
  w.tick++;
  w.level.saws.forEach((saw, i) => (w.sawAt[i] = w.sawAt[i]! + saw.speed));

  if (w.status === "dead") {
    if (--w.deadTicks <= 0) respawn(w);
    stepBlocks(w);
    return;
  }

  const left = (bits & LEFT) !== 0;
  const right = (bits & RIGHT) !== 0;
  const jump = (bits & JUMP) !== 0 && !w.flags.noJump;
  push(w, (right ? 1 : 0) - (left ? 1 : 0));
  const tuning = w.moon > 0 ? MOON_TUNING : TUNING;
  if (w.moon > 0) w.moon--;
  const ev = stepRunner(w.p, { left, right, jump }, heroSolids(w), tuning);
  if (ev.jumped) emit(w, { type: "jump" });
  if (ev.landed) emit(w, { type: "land", impact: ev.impact });
  if (ev.bonked) {
    emit(w, { type: "head" });
    // Bonked something from below?
    const p = w.p;
    for (const b of w.level.bonks) {
      if (b.rect.y + b.rect.h === p.y && p.x + p.w > b.rect.x && p.x < b.rect.x + b.rect.w) emit(w, { type: "bonk", id: b.id });
    }
  }
  stepBlocks(w);

  const p = w.p;
  const body = inset(p, 1);

  // Things that hurt.
  if (hits(w, body, CELL.spike)) die(w, "spike");
  w.level.fakeCoins.forEach((c) => {
    if (overlaps(inset(c, 2), body)) die(w, "coin");
  });
  w.level.saws.forEach((saw, i) => {
    const at = sawPosition(w, i);
    if (circleHits(inset(p, 2), at.x, at.y, saw.radius - 1)) die(w, "saw");
  });
  if (p.y > levelHeight(w.level) + 32) die(w, "fall");
  if (isDead(w)) return;

  // Things you pick up or walk through.
  w.level.coins.forEach((c, i) => {
    if (!w.coins[i] && overlaps(c, body)) {
      w.coins[i] = true;
      emit(w, { type: "coin", index: i });
    }
  });
  if (touch(w, "paper", hits(w, body, CELL.paper))) emit(w, { type: "paper" });
  w.level.checkpoints.forEach((k, i) => {
    if (overlaps(k, p) && (w.respawnAt.x !== k.x + (TILE - PLAYER_W) / 2 || w.respawnAt.y !== k.y + TILE - PLAYER_H)) {
      w.respawnAt = { x: k.x + (TILE - PLAYER_W) / 2, y: k.y + TILE - PLAYER_H };
      emit(w, { type: "checkpoint", index: i });
    }
  });

  // Things you touch.
  for (const d of w.level.doors) {
    if (d.kind === "fake" && w.flattened.has(d.id)) continue;
    if (touch(w, `door:${d.id}`, overlaps(d.rect, body))) {
      if (d.kind === "fake") w.flattened.add(d.id);
      emit(w, { type: "door", id: d.id, kind: d.kind });
    }
  }
  for (const z of w.level.zones) if (touch(w, `zone:${z.id}`, overlaps(z.rect, body))) emit(w, { type: "zone", id: z.id });
  for (const z of w.level.portals) if (touch(w, `portal:${z.id}`, overlaps(inset(z.rect, 3), body))) emit(w, { type: "portal", id: z.id });
  for (const z of w.level.levers) if (touch(w, `lever:${z.id}`, overlaps(z.rect, body))) emit(w, { type: "lever", id: z.id });
  for (const z of w.level.stickers) {
    if (!w.taken.has(z.id) && overlaps(z.rect, body)) {
      w.taken.add(z.id);
      emit(w, { type: "sticker", id: z.id });
    }
  }
  for (const z of w.level.buttons) if (touch(w, `button:${z.id}`, overlaps(z.rect, body))) emit(w, { type: "button", id: z.id });

  // Which credits line you're standing on (it wobbles).
  w.standing = -1;
  if (p.grounded) {
    const row = (p.y + p.h) / TILE;
    w.standing = w.level.names.findIndex((n) => n.row === row && p.x + p.w > n.col * TILE && p.x < (n.col + n.cols) * TILE);
  }
}

/** Does `r` overlap any cell of this kind? (Spikes only count in their lower part.) */
function hits(w: World, r: Rect, kind: number): boolean {
  const c0 = Math.floor(r.x / TILE);
  const c1 = Math.floor((r.x + r.w - 1) / TILE);
  const r0 = Math.floor(r.y / TILE);
  const r1 = Math.floor((r.y + r.h - 1) / TILE);
  for (let row = r0; row <= r1; row++) {
    for (let col = c0; col <= c1; col++) {
      if (cellAt(w.level, col, row) !== kind) continue;
      if (kind !== CELL.spike) return true;
      if (overlaps(r, { x: col * TILE + 2, y: row * TILE + 7, w: TILE - 4, h: TILE - 7 })) return true;
    }
  }
  return false;
}

/** `jump --height 999`. */
export function moonJump(w: World) {
  w.moon = MOON_TICKS;
}

/** Back to the start of the level (keeps flags, coins and the death count). */
export function restartWorld(w: World) {
  w.respawnAt = { ...w.level.spawn };
  w.p = createRunner(w.level.spawn.x, w.level.spawn.y, PLAYER_W, PLAYER_H);
  w.status = "play";
  w.touching.clear();
  w.moon = 0;
}

/** Bits from a held-keys snapshot (for the runtime). */
export const inputBits = (left: boolean, right: boolean, jump: boolean) => (left ? LEFT : 0) | (right ? RIGHT : 0) | (jump ? JUMP : 0);
