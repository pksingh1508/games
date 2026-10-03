// The level solver: proves a level can be cleared, and records a run for the Dev medal
// (Plan §14: "30 levels, each clearable in 15 seconds or less once known").
//
// A beam search over short bursts of input (run, jump, wait, back up…), simulated with the real
// engine. The solver "knows" every trap (it simulates them), like a player who has died to each
// one once. It runs offline (see levels/dev-runs.test.ts); the game only replays its results.
import type { InputLog } from "@/engine/replay";
import { COLS, JUMP, LEFT, MAX_KNOWN_TICKS, RIGHT, TILE } from "./constants";
import type { Level } from "./level";
import { travelDistance } from "./navigation";
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
  ticks: number;
}

/**
 * Where the solver is heading: the next waypoint, the painted door that reveals the exit, or the
 * exit (for a runaway door, where it stops: chasing it shouldn't look like losing ground).
 */
function target(w: World, goal: number): { x: number; y: number } {
  const waypoint = w.level.route[goal];
  if (waypoint) return waypoint;
  if (w.exit.hidden) {
    const fake = w.level.traps.find((t) => t.kind === "fakeDoor");
    if (fake) return { x: fake.rect.x + 8, y: fake.rect.y + 8 };
  }
  const runaway = w.level.traps.find((t) => t.kind === "runawayDoor");
  if (runaway) return { x: (runaway.to ?? COLS - 2) * TILE + TILE / 2, y: w.exit.y + w.exit.h / 2 };
  return { x: w.exit.x + w.exit.w / 2, y: w.exit.y + w.exit.h / 2 };
}

type Heuristic = "travel" | "straight";

function score(w: World, waypoint: number, heuristic: Heuristic): number {
  const goal = target(w, waypoint);
  const cx = w.p.x + w.p.w / 2;
  const straight = Math.abs(cx - goal.x) + Math.abs(w.p.y + w.p.h / 2 - goal.y) * 0.25;
  if (heuristic === "straight") return waypoint * 10_000 - straight;
  // Distance along the level's map (around walls, up via springs), with straight-line distance
  // as a tie-breaker inside a tile.
  const travel = travelDistance(w.level, goal.x, goal.y + 8, cx, w.p.y + w.p.h);
  return waypoint * 10_000 - travel - straight * 0.05;
}

/** Reached the current waypoint? Then aim for the next. */
function advance(w: World, goal: number): number {
  const waypoint = w.level.route[goal];
  if (!waypoint) return goal;
  const dx = w.p.x + w.p.w / 2 - waypoint.x;
  const dy = w.p.y + w.p.h / 2 - waypoint.y;
  return dx * dx + dy * dy < 14 * 14 ? goal + 1 : goal;
}

/** Groups that should each keep a few states: different heights, and different trap timings. */
function bucket(w: World): string {
  let traps = "";
  for (const t of w.traps) traps += t.phase[0];
  return `${w.p.y >> 4},${w.p.grounded ? 1 : 0},${traps}`;
}

/**
 * Keep the best half by score, then fill up round-robin across buckets, so jumpers and waiters
 * survive even when walkers look closer (the walkers are usually about to die).
 */
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

function key(w: World): string {
  const p = w.p;
  let traps = "";
  for (const t of w.traps) traps += `${t.phase[0]}${Math.round(t.dx / 4)},${Math.round(t.dy / 4)},${t.flag};`;
  return `${p.x >> 1},${p.y >> 1},${Math.round(p.vx * 2)},${Math.round(p.vy)},${p.grounded ? 1 : 0},${p.buffer > 0 ? 1 : 0},${Math.round(w.exit.x / 4)},${w.exit.hidden ? 1 : 0},${traps}`;
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
  // Runs are capped at 255 ticks per entry by the recorder; split long ones.
  return log.flatMap(([bits, n]) => {
    const parts: InputLog = [];
    for (let left = n; left > 0; left -= 255) parts.push([bits, Math.min(255, left)]);
    return parts;
  });
}

export interface SolveOptions {
  attempt?: number;
  beam?: number;
  stepTicks?: number;
  maxTicks?: number;
  heuristic?: Heuristic;
}

/**
 * Try coarse input timing first, then finer timing with a wider search. Each with two senses of
 * direction (along the level's map, and as the crow flies); the faster win counts.
 */
export function solve(level: Level, options: SolveOptions = {}): Solution | null {
  const tries: SolveOptions[] = options.stepTicks
    ? [options]
    : [
        { stepTicks: 4, beam: 160 },
        { stepTicks: 3, beam: 260 },
        { stepTicks: 2, beam: 400 },
      ];
  for (const t of tries) {
    const found = (options.heuristic ? [options.heuristic] : (["travel", "straight"] as const))
      .map((heuristic) => search(level, { ...options, ...t, heuristic }))
      .filter((x): x is Solution => x !== null);
    if (found.length) return found.reduce((a, b) => (b.ticks < a.ticks ? b : a));
  }
  return null;
}

function search(level: Level, { attempt = 0, beam = 160, stepTicks = 4, maxTicks = MAX_KNOWN_TICKS, heuristic = "travel" }: SolveOptions): Solution | null {
  let frontier: Node[] = [{ w: createWorld(level, { attempt }), parent: null, action: 0, ticks: 0, goal: 0 }];
  for (let depth = 0; depth * stepTicks < maxTicks && frontier.length; depth++) {
    const next: Array<Node & { score: number }> = [];
    const seen = new Set<string>();
    let best: { node: Node; action: number; ticks: number } | null = null;
    for (const node of frontier) {
      for (const action of ACTIONS) {
        // A run starts with an input (the timer starts on your first input).
        if (depth === 0 && action === 0) continue;
        const w = cloneWorld(node.w);
        let goal = node.goal;
        let k = 0;
        for (; k < stepTicks; k++) {
          step(w, action);
          goal = advance(w, goal);
          if (w.status !== "play") break;
        }
        if (w.status === "dead") continue;
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
      return { log: toLog(best.node, best.action, best.ticks - best.node.ticks, stepTicks), ticks: best.ticks };
    }
    frontier = select(next, beam);
  }
  return null;
}

/** Play a log through a fresh world; returns the end state (for checks and ghosts). */
export function replay(level: Level, log: InputLog, { attempt = 0 }: { attempt?: number } = {}): World {
  const w = createWorld(level, { attempt });
  for (const [bits, n] of log) {
    for (let i = 0; i < n; i++) {
      step(w, bits);
      if (w.status !== "play") return w;
    }
  }
  return w;
}
