// The climb solver: proves the mountain can be climbed, and that every jump it needs is a fair
// one (Plan/08-almost-there.md §10, §14: "every required jump has a margin of at least 4 px at the
// right charge level"). It searches over places Pip can stand, trying every jump from them
// (walk to a spot, charge, release left, right or straight up) with the real simulation. A jump
// only counts if it still lands on the same ledge when you start 4 px either side and charge a
// tick more or less. It runs offline (world/route.test.ts); the game uses nothing from it.
import type { InputLog } from "@/engine/replay";
import { CHARGE_MAX, JUMP, LEFT, RIGHT, TILE, VIEW_H, VIEW_W } from "./constants";
import { isSolidTile, tileAt, T, type Mountain } from "./mountain";
import { cloneClimb, step, type ClimbState, type SimEvent } from "./sim";

export interface Jump {
  /** Walk to this x first. */
  x: number;
  /** Wait this many ticks before charging (timed screens). */
  wait: number;
  charge: number;
  dir: -1 | 0 | 1;
}

export interface Leg {
  /** Every tick's input bits. */
  log: InputLog;
  ticks: number;
  jumps: number;
}

interface Node {
  s: ClimbState;
  parent: Node | null;
  jump: Jump | null;
  bits: number[];
  depth: number;
}

const MAX_FLIGHT = 900;

const feetOf = (s: ClimbState) => s.pip.y + s.pip.h;

/** Settled: standing still, not charging, not stunned. */
const settled = (s: ClimbState) => s.pip.grounded && s.pip.charge === 0 && s.pip.stun === 0 && Math.abs(s.pip.vx) < 0.01;

/** Let a stance settle (ice slides, faceplants end); bits are recorded. */
function settle(m: Mountain, s: ClimbState, bits: number[], events: SimEvent[]): boolean {
  for (let i = 0; i < 240; i++) {
    if (settled(s)) return true;
    events.push(...step(m, s, 0));
    bits.push(0);
  }
  return settled(s);
}

/** The run of ground a stance is on: [left x, right x] Pip can stand between (no gaps). */
function ledgeSpan(m: Mountain, s: ClimbState): [number, number] {
  const feet = feetOf(s);
  if (feet % TILE !== 0) return [s.pip.x, s.pip.x];
  const ty = feet / TILE;
  const standable = (tx: number) => {
    const code = tileAt(m, tx, ty);
    const ground = isSolidTile(code, s.collapsed) || code === T.PLANK || code === T.CLOUD;
    return ground && !isSolidTile(tileAt(m, tx, ty - 1), s.collapsed);
  };
  const c = Math.floor((s.pip.x + s.pip.w / 2) / TILE);
  let c0 = c;
  let c1 = c;
  while (standable(c0 - 1) && c - c0 < 60) c0--;
  while (standable(c1 + 1) && c1 - c < 60) c1++;
  return [c0 * TILE - s.pip.w + 2, c1 * TILE + TILE - 2];
}

/** Do two stances stand on the same stretch of ground? */
function sameLedge(m: Mountain, a: ClimbState, b: ClimbState): boolean {
  if (feetOf(a) !== feetOf(b)) return false;
  const [l, r] = ledgeSpan(m, a);
  return b.pip.x >= l - 1 && b.pip.x <= r + 1;
}

interface Outcome {
  s: ClimbState;
  bits: number[];
  events: SimEvent[];
}

/** Walk to x (on the ground), wait, charge, release, fly, land, settle. */
function perform(m: Mountain, from: ClimbState, j: Jump): Outcome | null {
  const s = cloneClimb(from);
  const bits: number[] = [];
  const events: SimEvent[] = [];
  const push = (b: number) => {
    events.push(...step(m, s, b));
    bits.push(b);
  };
  for (let i = 0; i < 400 && Math.abs(s.pip.x - j.x) > 0; i++) {
    push(s.pip.x < j.x ? RIGHT : LEFT);
    if (!s.pip.grounded) return null;
  }
  if (s.pip.x !== j.x) return null;
  for (let i = 0; i < j.wait; i++) push(0);
  if (!s.pip.grounded) return null;
  const dirBits = j.dir < 0 ? LEFT : j.dir > 0 ? RIGHT : 0;
  for (let i = 0; i < j.charge; i++) push(JUMP | dirBits);
  if (j.charge < CHARGE_MAX) push(dirBits);
  else push(dirBits); // (it went by itself; let go)
  for (let i = 0; i < MAX_FLIGHT && !s.pip.grounded; i++) push(0);
  if (!s.pip.grounded) return null;
  if (!settle(m, s, bits, events)) return null;
  return { s, bits, events };
}

export interface SolveOptions {
  /** Done: after a jump that ends here (or that made this happen). */
  goal: (s: ClimbState, events: readonly SimEvent[]) => boolean;
  /** Give up after expanding this many stances. */
  budget?: number;
  /** Fairness: how far the takeoff may be off (px) and how many charge ticks either way. */
  slackPx?: number;
  slackCharge?: number;
  /** Ignore landings lower than this (feet y): the leg shouldn't wander off downhill. */
  floor?: number;
  /** Debugging: called for every stance expanded. */
  trace?: (s: ClimbState, info: { expanded: number; open: number; waits: number; ms: number }) => void;
}

/**
 * The waits worth trying before a jump. Where things move on a timer (gears, gusts) in Pip's
 * screen, every 10 ticks through the longest cycle: any timing can be had by waiting, so when you
 * got somewhere doesn't matter, only where. (Walking 4 px either way is 4 ticks either way, so the
 * fairness check covers being a little early or late.)
 */
function waitsFor(m: Mountain, s: ClimbState): number[] {
  const cx = s.pip.x + s.pip.w / 2;
  const cy = s.pip.y + s.pip.h / 2;
  const sx = Math.floor(cx / VIEW_W) * VIEW_W;
  const sy = Math.floor(cy / VIEW_H) * VIEW_H;
  const inScreen = (r: { x: number; y: number; w: number; h: number }) => r.x < sx + VIEW_W && r.x + r.w > sx && r.y < sy + VIEW_H && r.y + r.h > sy;
  let period = 0;
  for (const g of m.gears) {
    const span = { x: g.rect.x + Math.min(0, g.dx), y: g.rect.y + Math.min(0, g.dy), w: g.rect.w + Math.abs(g.dx), h: g.rect.h + Math.abs(g.dy) };
    if (inScreen(span)) period = Math.max(period, g.period);
  }
  for (const w of m.wind) if (w.pattern.kind === "gusts" && inScreen(w.rect)) period = Math.max(period, w.pattern.period);
  const waits = [0];
  for (let t = 10; t < period; t += 10) waits.push(t);
  return waits;
}

/**
 * Stances that are the same for the search: a stretch of solid ground is one stance wherever on it
 * you landed (every spot on it gets tried anyway). Crumbling ground, clouds and anything moving
 * keep the exact spot (when and where you landed matters there).
 */
function keyOf(m: Mountain, s: ClimbState): string {
  const feet = feetOf(s);
  const tail = `${feet},${s.collapsed ? 1 : 0}`;
  if (feet % TILE === 0) {
    const ty = feet / TILE;
    const under = [Math.floor(s.pip.x / TILE), Math.floor((s.pip.x + s.pip.w - 1) / TILE)].map((tx) => tileAt(m, tx, ty)).filter((code) => code !== T.AIR);
    const firm = under.length > 0 && under.every((code) => code === T.PLANK || (isSolidTile(code, s.collapsed) && code !== T.CRUMBLE && code !== T.ICE && code !== T.MUSHROOM));
    if (firm) return `L${ledgeSpan(m, s)[0]},${tail}`;
  }
  return `${s.pip.x >> 2},${tail}`;
}

/** Snapshots of walking along the ledge: the state when Pip stands at each spot. */
function walkSpots(m: Mountain, from: ClimbState, l: number, r: number, spacing: number): Array<{ x: number; s: ClimbState; bits: number[] }> {
  const out = [{ x: from.pip.x, s: cloneClimb(from), bits: [] as number[] }];
  for (const dir of [-1, 1] as const) {
    const s = cloneClimb(from);
    const bits: number[] = [];
    let last = s.pip.x;
    for (let i = 0; i < 500; i++) {
      const next = s.pip.x + dir;
      if (next < l || next > r) break;
      step(m, s, dir < 0 ? LEFT : RIGHT);
      bits.push(dir < 0 ? LEFT : RIGHT);
      if (!s.pip.grounded) break;
      if (Math.abs(s.pip.x - last) >= spacing || s.pip.x === (dir < 0 ? Math.ceil(l) : Math.floor(r))) {
        last = s.pip.x;
        out.push({ x: s.pip.x, s: cloneClimb(s), bits: [...bits] });
      }
    }
  }
  return out;
}

/**
 * Best-first, highest stance first. Returns the inputs from the start state to the goal.
 */
export function solveLeg(m: Mountain, start: ClimbState, { goal, budget = 6000, slackPx = 4, slackCharge = 1, floor = Infinity, trace }: SolveOptions): Leg | null {
  const root: Node = { s: cloneClimb(start), parent: null, jump: null, bits: [], depth: 0 };
  const settleBits: number[] = [];
  settle(m, root.s, settleBits, []);
  root.bits = settleBits;
  const open: Node[] = [root];
  const seen = new Set<string>([keyOf(m, root.s)]);
  let expanded = 0;

  while (open.length && expanded < budget) {
    // Highest first (smallest feet y), then shallower.
    let bi = 0;
    for (let i = 1; i < open.length; i++) {
      const a = open[i]!;
      const b = open[bi]!;
      if (feetOf(a.s) < feetOf(b.s) || (feetOf(a.s) === feetOf(b.s) && a.depth < b.depth)) bi = i;
    }
    const node = open.splice(bi, 1)[0]!;
    expanded++;
    const t0 = trace ? performance.now() : 0;
    const [l, r] = ledgeSpan(m, node.s);
    const spots = walkSpots(m, node.s, l, r, 6);
    const waits = waitsFor(m, node.s);
    for (const spot of spots) {
      const base = cloneClimb(spot.s);
      const pre: number[] = [...spot.bits];
      for (const wait of waits) {
        // Wait, then charge one tick at a time, keeping a snapshot of each charge level.
        while (pre.length - spot.bits.length < wait) {
          step(m, base, 0);
          pre.push(0);
        }
        if (!base.pip.grounded) break;
        for (const dir of [1, -1, 0] as const) {
          const dirBits = dir < 0 ? LEFT : dir > 0 ? RIGHT : 0;
          const charging = cloneClimb(base);
          const chargeBits: number[] = [];
          for (let charge = 1; charge <= CHARGE_MAX; charge++) {
            step(m, charging, JUMP | dirBits);
            chargeBits.push(JUMP | dirBits);
            if (!charging.pip.grounded) break;
            const s = cloneClimb(charging);
            const bits = [...pre, ...chargeBits, dirBits];
            if (feetOf(s) > floor) break;
            const events: SimEvent[] = [...step(m, s, dirBits)];
            for (let i = 0; i < MAX_FLIGHT && !s.pip.grounded; i++) {
              events.push(...step(m, s, 0));
              bits.push(0);
            }
            if (!s.pip.grounded || !settle(m, s, bits, events)) continue;
            if (feetOf(s) > floor) continue;
            const reached = goal(s, events);
            const k = keyOf(m, s);
            if (!reached && seen.has(k)) continue;
            const j: Jump = { x: spot.x, wait, charge, dir };
            // Fair? The same ledge from 4 px either way, and a tick more or less of charge.
            if (!fair(m, node.s, j, s, l, r, slackPx, slackCharge, reached ? goal : null)) continue;
            const child: Node = { s, parent: node, jump: j, bits, depth: node.depth + 1 };
            if (reached) return toLeg(child);
            seen.add(k);
            open.push(child);
          }
        }
      }
    }
    trace?.(node.s, { expanded, open: open.length, waits: waits.length, ms: performance.now() - t0 });
  }
  return null;
}

function fair(
  m: Mountain,
  from: ClimbState,
  j: Jump,
  landed: ClimbState,
  l: number,
  r: number,
  slackPx: number,
  slackCharge: number,
  goal: SolveOptions["goal"] | null,
): boolean {
  const variants: Jump[] = [];
  for (const dx of [-slackPx, slackPx]) {
    const x = j.x + dx;
    if (x >= l && x <= r) variants.push({ ...j, x });
  }
  for (const dc of [-slackCharge, slackCharge]) {
    const charge = j.charge + dc;
    if (charge >= 1 && charge <= CHARGE_MAX) variants.push({ ...j, charge });
  }
  for (const v of variants) {
    const out = perform(m, from, v);
    if (!out) return false;
    if (goal) {
      if (!goal(out.s, out.events)) return false;
    } else if (!sameLedge(m, landed, out.s)) return false;
  }
  return true;
}

function toLeg(end: Node): Leg {
  const chain: Node[] = [];
  for (let n: Node | null = end; n; n = n.parent) chain.push(n);
  chain.reverse();
  const bits = chain.flatMap((n) => n.bits);
  const log: InputLog = [];
  for (const b of bits) {
    const last = log[log.length - 1];
    if (last && last[0] === b && last[1] < 255) last[1]++;
    else log.push([b, 1]);
  }
  return { log, ticks: bits.length, jumps: chain.length - 1 };
}

/** Play a log through a state (mutates it); returns every event. */
export function play(m: Mountain, s: ClimbState, log: InputLog): SimEvent[] {
  const events: SimEvent[] = [];
  for (const [bits, n] of log) for (let i = 0; i < n; i++) events.push(...step(m, s, bits));
  return events;
}
