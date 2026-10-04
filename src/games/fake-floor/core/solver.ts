// The room solver: proves every room can be crossed, and records a run that sets its par time
// (Plan §14: "All 51 rooms are completable"). A beam search over short bursts of input, simulated
// with the real engine, like TrapSprint's. The solver knows which floors are real (it simulates
// them), like a player who has tested every one; it never throws a pebble and never falls.
// It runs offline (rooms/dev-runs.test.ts); the game only uses its results.
import type { InputLog } from "@/engine/replay";
import { JUMP, LEFT, MAX_KNOWN_TICKS, RIGHT } from "./constants";
import { travelDistance } from "./navigation";
import type { Room } from "./room";
import { cloneWorld, createWorld, step, type World } from "./world";

const ACTIONS = [RIGHT, RIGHT | JUMP, 0, JUMP, LEFT, LEFT | JUMP] as const;

interface Node {
  w: World;
  parent: Node | null;
  action: number;
  ticks: number;
  /** The next route waypoint to reach. */
  goal: number;
}

export interface Solution {
  log: InputLog;
  /** Every tick of the log. */
  ticks: number;
  /** From the first movement to the door (what the game's clock measures). */
  time: number;
}

/** Where the solver is heading: the next waypoint, the key, or the door. */
function target(w: World, goal: number): { x: number; y: number } {
  const waypoint = w.room.route[goal];
  if (waypoint) return waypoint;
  const key = w.room.key;
  if (key && !w.key) return { x: key.x + key.w / 2, y: key.y + key.h / 2 };
  return { x: w.room.exit.x + w.room.exit.w / 2, y: w.room.exit.y + w.room.exit.h / 2 };
}

type Heuristic = "travel" | "straight";

function score(w: World, waypoint: number, heuristic: Heuristic): number {
  const goal = target(w, waypoint);
  const cx = w.p.x + w.p.w / 2;
  const straight = Math.abs(cx - goal.x) + Math.abs(w.p.y + w.p.h / 2 - goal.y) * 0.25;
  const stage = waypoint * 100_000 + (w.key ? 50_000 : 0);
  if (heuristic === "straight") return stage - straight;
  return stage - travelDistance(w.room, goal.x, goal.y + 8, cx, w.p.y + w.p.h) - straight * 0.05;
}

function advance(w: World, goal: number): number {
  const waypoint = w.room.route[goal];
  if (!waypoint) return goal;
  const dx = w.p.x + w.p.w / 2 - waypoint.x;
  const dy = w.p.y + w.p.h / 2 - waypoint.y;
  return dx * dx + dy * dy < 14 * 14 ? goal + 1 : goal;
}

/** Floors whose state matters (crumbles, return trips, flips), per room. */
const activeCache = new WeakMap<Room, number[]>();
function activeFloors(room: Room): number[] {
  let list = activeCache.get(room);
  if (!list) {
    list = room.floors.flatMap((f, i) => (f.kind === "crumble" || f.kind === "returnTrip" || f.kind === "flip" ? [i] : []));
    activeCache.set(room, list);
  }
  return list;
}

const periodCache = new WeakMap<Room, number>();
/** Flipping floors repeat every this many ticks (1 when nothing flips). */
function flipPeriod(room: Room): number {
  let period = periodCache.get(room);
  if (period === undefined) {
    const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
    period = room.floors.reduce((lcm, f) => (f.flip ? (lcm * f.flip.period) / gcd(lcm, f.flip.period) : lcm), 1);
    periodCache.set(room, period);
  }
  return period;
}

function key(w: World): string {
  const p = w.p;
  let floors = "";
  for (const i of activeFloors(w.room)) floors += `${w.fs.phase[i]}${w.fs.crossed[i]}`;
  return `${p.x >> 1},${p.y >> 1},${Math.round(p.vx * 2)},${Math.round(p.vy)},${p.grounded ? 1 : 0},${p.buffer > 0 ? 1 : 0},${w.key ? 1 : 0},${w.tick % flipPeriod(w.room)},${floors}`;
}

function bucket(w: World): string {
  return `${w.p.y >> 4},${w.p.grounded ? 1 : 0}`;
}

/** Keep the best half by score, then fill up round-robin across buckets (jumpers and waiters survive). */
function select<N extends { w: World; score: number }>(nodes: N[], beam: number): N[] {
  nodes.sort((a, b) => b.score - a.score);
  const keep = nodes.slice(0, Math.floor(beam / 2));
  const groups = new Map<string, N[]>();
  for (const n of nodes.slice(keep.length)) {
    const id = bucket(n.w);
    const list = groups.get(id);
    if (list) list.push(n);
    else groups.set(id, [n]);
  }
  const lists = [...groups.values()];
  for (let round = 0; keep.length < beam && lists.some((l) => l.length > round); round++) {
    for (const list of lists) {
      if (keep.length >= beam) break;
      const n = list[round];
      if (n) keep.push(n);
    }
  }
  return keep;
}

function toLog(node: Node, last: number, lastTicks: number, stepTicks: number): InputLog {
  const actions: number[] = [];
  for (let n: Node | null = node; n && n.parent; n = n.parent) actions.push(n.action);
  actions.reverse();
  const log: InputLog = [];
  const push = (bits: number, count: number) => {
    const end = log[log.length - 1];
    if (end && end[0] === bits) end[1] += count;
    else log.push([bits, count]);
  };
  for (const a of actions) push(a, stepTicks);
  if (lastTicks > 0) push(last, lastTicks);
  return log.flatMap(([bits, n]) => {
    const parts: InputLog = [];
    for (let left = n; left > 0; left -= 255) parts.push([bits, Math.min(255, left)]);
    return parts;
  });
}

/** Ticks from the first movement to the end of a log (the clock ignores waiting before it). */
export function clockTicks(log: InputLog): number {
  let total = 0;
  let waiting = 0;
  let moved = false;
  for (const [bits, n] of log) {
    if (!moved && bits === 0) waiting += n;
    else moved = true;
    total += n;
  }
  return total - waiting;
}

export interface SolveOptions {
  beam?: number;
  stepTicks?: number;
  maxTicks?: number;
  heuristic?: Heuristic;
}

/** Coarse input timing first, then finer timing with a wider search; the first win counts. */
export function solve(room: Room, options: SolveOptions = {}): Solution | null {
  const tries: SolveOptions[] = options.stepTicks
    ? [options]
    : [
        { stepTicks: 4, beam: 160 },
        { stepTicks: 3, beam: 300 },
        { stepTicks: 2, beam: 500 },
      ];
  for (const t of tries) {
    for (const heuristic of options.heuristic ? [options.heuristic] : (["travel", "straight"] as const)) {
      const found = search(room, { ...options, ...t, heuristic });
      if (found) return found;
    }
  }
  return null;
}

function search(room: Room, { beam = 160, stepTicks = 4, maxTicks = MAX_KNOWN_TICKS, heuristic = "travel" }: SolveOptions): Solution | null {
  let frontier: Node[] = [{ w: createWorld(room), parent: null, action: 0, ticks: 0, goal: 0 }];
  for (let depth = 0; depth * stepTicks < maxTicks && frontier.length; depth++) {
    const next: Array<Node & { score: number }> = [];
    const seen = new Set<string>();
    let best: { node: Node; action: number; ticks: number } | null = null;
    for (const node of frontier) {
      for (const action of ACTIONS) {
        const w = cloneWorld(node.w);
        let goal = node.goal;
        let k = 0;
        for (; k < stepTicks; k++) {
          step(w, action);
          goal = advance(w, goal);
          if (w.status !== "play" || w.net > 0) break;
        }
        if (w.status === "fell" || w.net > 0) continue;
        if (w.status === "won") {
          const ticks = node.ticks + k + 1;
          if (!best || ticks < best.ticks) best = { node, action, ticks };
          continue;
        }
        const id = `${key(w)}|${goal}`;
        if (seen.has(id)) continue;
        seen.add(id);
        next.push({ w, parent: node, action, ticks: node.ticks + stepTicks, goal, score: score(w, goal, heuristic) });
      }
    }
    if (best) {
      const log = toLog(best.node, best.action, best.ticks - best.node.ticks, stepTicks);
      return { log, ticks: best.ticks, time: clockTicks(log) };
    }
    frontier = select(next, beam);
  }
  return null;
}

/** Play a log through a fresh world; returns the end state (for checks). */
export function replay(room: Room, log: InputLog): World {
  const w = createWorld(room);
  for (const [bits, n] of log) {
    for (let i = 0; i < n; i++) {
      step(w, bits);
      if (w.status !== "play") return w;
    }
  }
  return w;
}
