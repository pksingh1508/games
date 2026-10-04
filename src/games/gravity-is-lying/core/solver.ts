// The room solver: proves every room can be cleared with all three golden apples (Plan §14: "Every
// room is completable"), and records the run. A beam search over short bursts of input, simulated
// with the real engine (like Fake Floor's and TrapSprint's), following the room's waypoints: the
// designer's route, in order, then the portal. The solver knows the real gravity (it simulates
// it), like a player who reads every anchor; it never dies. It runs offline (rooms/dev-runs.test.ts).
import type { InputLog } from "@/engine/replay";
import { FLIP, JUMP, LEFT, MAX_ROOM_TICKS, RIGHT } from "./constants";
import type { Room } from "./room";
import { cloneWorld, createWorld, newtCentre, step, type World } from "./world";

const BASE = [RIGHT, RIGHT | JUMP, 0, JUMP, LEFT, LEFT | JUMP] as const;
const FLIPS = [FLIP, RIGHT | FLIP, LEFT | FLIP] as const;
const ALL_APPLES = 0b111;

interface Node {
  w: World;
  parent: Node | null;
  action: number;
  ticks: number;
  /** The next waypoint to reach. */
  goal: number;
}

export interface Solution {
  log: InputLog;
  ticks: number;
  /** From the first movement to the portal (what the game's clock measures). */
  time: number;
}

/** The route: the designer's waypoints, then the portal. */
function targets(room: Room): Array<{ x: number; y: number }> {
  return [...room.route, { x: room.portal.x + room.portal.w / 2, y: room.portal.y + room.portal.h / 2 }];
}

function advance(w: World, goal: number, list: Array<{ x: number; y: number }>): number {
  let g = goal;
  while (g < list.length - 1) {
    const t = list[g]!;
    const c = newtCentre(w);
    if ((c.x - t.x) ** 2 + (c.y - t.y) ** 2 >= 14 * 14) break;
    g++;
  }
  return g;
}

function score(w: World, goal: number, list: Array<{ x: number; y: number }>): number {
  const t = list[goal]!;
  const c = newtCentre(w);
  let apples = 0;
  for (let a = w.apples; a; a &= a - 1) apples++;
  return goal * 100_000 + apples * 1000 - Math.hypot(c.x - t.x, c.y - t.y);
}

function period(room: Room): number {
  return room.rotate?.every ?? 1;
}

function key(w: World): string {
  const o = w.orbit;
  const base = `${w.gravity},${w.apples},${w.touching},${w.flipHeld ? 1 : 0},${w.tick % period(w.room)}`;
  if (o) return `${Math.round(o.x)},${Math.round(o.y)},${Math.round(o.vx * 2)},${Math.round(o.vy * 2)},${o.standing},${o.run.buffer > 0 ? 1 : 0},${base}`;
  const n = w.newt;
  return `${n.x >> 1},${n.y >> 1},${Math.round(n.vx * 2)},${Math.round(n.vy * 2)},${n.grounded ? 1 : 0},${n.buffer > 0 ? 1 : 0},${n.gravity},${base}`;
}

function bucket(w: World): string {
  const c = newtCentre(w);
  return `${c.y >> 5},${c.x >> 6},${w.gravity}`;
}

/** Keep the best half by score, then fill up round-robin across buckets (so detours survive). */
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
  /** Clear without the apples (just reach the portal). */
  anyApples?: boolean;
}

/** Coarse input timing first, then finer timing with a wider search; the first clear counts. */
export function solve(room: Room, options: SolveOptions = {}): Solution | null {
  const tries: SolveOptions[] = options.stepTicks
    ? [options]
    : [
        { stepTicks: 4, beam: 200 },
        { stepTicks: 3, beam: 400 },
        { stepTicks: 2, beam: 700 },
      ];
  for (const t of tries) {
    const found = search(room, { ...options, ...t });
    if (found) return found;
  }
  return null;
}

function search(room: Room, { beam = 200, stepTicks = 4, maxTicks = MAX_ROOM_TICKS, anyApples = false }: SolveOptions): Solution | null {
  const list = targets(room);
  const actions = room.flip ? [...BASE, ...FLIPS] : [...BASE];
  let frontier: Node[] = [{ w: createWorld(room), parent: null, action: 0, ticks: 0, goal: 0 }];
  for (let depth = 0; depth * stepTicks < maxTicks && frontier.length; depth++) {
    const next: Array<Node & { score: number }> = [];
    const seen = new Set<string>();
    let best: { node: Node; action: number; ticks: number } | null = null;
    for (const node of frontier) {
      for (const action of actions) {
        const w = cloneWorld(node.w);
        let goal = node.goal;
        let k = 0;
        let caught = false;
        for (; k < stepTicks; k++) {
          for (const e of step(w, action)) if (e.type === "net") caught = true;
          goal = advance(w, goal, list);
          if (w.status !== "play" || caught) break;
        }
        if (w.status === "dead" || caught) continue;
        if (w.status === "won") {
          if (!anyApples && w.apples !== ALL_APPLES) continue;
          const ticks = node.ticks + k + 1;
          if (!best || ticks < best.ticks) best = { node, action, ticks };
          continue;
        }
        const id = `${key(w)}|${goal}`;
        if (seen.has(id)) continue;
        seen.add(id);
        next.push({ w, parent: node, action, ticks: node.ticks + stepTicks, goal, score: score(w, goal, list) });
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
