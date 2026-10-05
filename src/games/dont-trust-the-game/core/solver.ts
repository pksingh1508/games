// The level solver (Plan/04-dont-trust-the-game.md §14, and the arcade's habit of proving every level): a beam
// search over short bursts of input (run, jump, wait, back up), simulated with the real world. It knows every
// trick, like a player who's been told the truth. Used by the tests, never by the game.
import { JUMP, LEFT, RIGHT } from "./constants";
import type { Level } from "./level";
import { cloneWorld, createWorld, step, type World, type WorldEvent, type WorldFlags } from "./world";

const ACTIONS = [RIGHT, RIGHT | JUMP, 0, JUMP, LEFT, LEFT | JUMP] as const;

export interface SolveGoal {
  /** Reached it? (This tick's events, and the world after them.) */
  done(events: readonly WorldEvent[], w: World): boolean;
  /** Where to head once the level's waypoints are behind you. */
  target(w: World): { x: number; y: number };
  /** Progress the hero's position doesn't show (a block pushed toward the gap), added to the score. */
  bonus?(w: World): number;
}

export interface Solution {
  /** Run-length input: [bits, ticks]. */
  log: Array<[number, number]>;
  ticks: number;
  /** Every event along the way (for checks like "never touched the coin"). */
  events: WorldEvent[];
}

interface Node {
  w: World;
  parent: Node | null;
  action: number;
  ticks: number;
  goal: number;
  events: WorldEvent[];
}

export interface SolveOptions {
  flags?: Partial<WorldFlags>;
  beam?: number;
  stepTicks?: number;
  maxTicks?: number;
  /** Events that make a branch worthless (e.g. touching the cardboard door when proving it's avoidable). */
  avoid?: (e: WorldEvent) => boolean;
  /** Waypoints to pass first (default: the level's own). */
  route?: ReadonlyArray<{ x: number; y: number }>;
}

function advance(route: ReadonlyArray<{ x: number; y: number }>, w: World, goal: number): number {
  const waypoint = route[goal];
  if (!waypoint) return goal;
  const dx = w.p.x + w.p.w / 2 - waypoint.x;
  const dy = w.p.y + w.p.h / 2 - waypoint.y;
  return dx * dx + dy * dy < 14 * 14 ? goal + 1 : goal;
}

function score(route: ReadonlyArray<{ x: number; y: number }>, w: World, goal: number, target: SolveGoal): number {
  const to = route[goal] ?? target.target(w);
  const cx = w.p.x + w.p.w / 2;
  const cy = w.p.y + w.p.h / 2;
  return goal * 100_000 - Math.abs(cx - to.x) - Math.abs(cy - to.y) * 1.5 + (goal >= route.length ? (target.bonus?.(w) ?? 0) : 0);
}

function key(w: World, goal: number): string {
  const p = w.p;
  let blocks = "";
  for (const b of w.blocks) blocks += `${b.x},${b.y},${b.loaded ? 1 : 0};`;
  return `${p.x >> 1},${p.y >> 1},${Math.round(p.vx * 2)},${Math.round(p.vy)},${p.grounded ? 1 : 0},${blocks}|${goal}`;
}

/** Keep the best by score, plus a spread of heights (so climbers survive next to walkers). */
function select<N extends { w: World; score: number }>(nodes: N[], beam: number): N[] {
  nodes.sort((a, b) => b.score - a.score);
  const keep = nodes.slice(0, Math.floor(beam / 2));
  const groups = new Map<string, N[]>();
  for (const n of nodes.slice(keep.length)) {
    const id = `${n.w.p.y >> 4},${n.w.p.grounded ? 1 : 0}`;
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

function toLog(node: Node, last: number, lastTicks: number, stepTicks: number): Array<[number, number]> {
  const actions: number[] = [];
  for (let n: Node | null = node; n && n.parent; n = n.parent) actions.push(n.action);
  actions.reverse();
  const log: Array<[number, number]> = [];
  const add = (bits: number, count: number) => {
    const end = log[log.length - 1];
    if (end && end[0] === bits) end[1] += count;
    else log.push([bits, count]);
  };
  for (const a of actions) add(a, stepTicks);
  if (lastTicks > 0) add(last, lastTicks);
  return log;
}

export function solve(level: Level, goal: SolveGoal, options: SolveOptions = {}): Solution | null {
  const tries = options.stepTicks ? [options] : [{ stepTicks: 4, beam: 200 }, { stepTicks: 3, beam: 320 }, { stepTicks: 2, beam: 500 }];
  for (const t of tries) {
    const found = search(level, goal, { ...options, ...t });
    if (found) return found;
  }
  return null;
}

function search(level: Level, goal: SolveGoal, { flags = {}, beam = 200, stepTicks = 4, maxTicks = 60 * 90, avoid, route = level.route }: SolveOptions): Solution | null {
  let frontier: Node[] = [{ w: createWorld(level, flags), parent: null, action: 0, ticks: 0, goal: 0, events: [] }];
  for (let depth = 0; depth * stepTicks < maxTicks && frontier.length; depth++) {
    const next: Array<Node & { score: number }> = [];
    const seen = new Set<string>();
    for (const node of frontier) {
      for (const action of ACTIONS) {
        const w = cloneWorld(node.w);
        let g = node.goal;
        const events: WorldEvent[] = [];
        let finished = false;
        let bad = false;
        let k = 0;
        for (; k < stepTicks; k++) {
          step(w, action);
          events.push(...w.events);
          if (w.status === "dead" || (avoid && w.events.some(avoid))) {
            bad = true;
            break;
          }
          g = advance(route, w, g);
          if (g >= route.length && goal.done(w.events, w)) {
            finished = true;
            break;
          }
        }
        if (bad) continue;
        if (finished) {
          const all = [...collect(node), ...events];
          return { log: toLog(node, action, k + 1, stepTicks), ticks: node.ticks + k + 1, events: all };
        }
        const id = key(w, g);
        if (seen.has(id)) continue;
        seen.add(id);
        next.push({ w, parent: node, action, ticks: node.ticks + stepTicks, goal: g, events, score: score(route, w, g, goal) });
      }
    }
    frontier = select(next, beam);
  }
  return null;
}

function collect(node: Node): WorldEvent[] {
  const chain: Node[] = [];
  for (let n: Node | null = node; n; n = n.parent) chain.push(n);
  return chain.reverse().flatMap((n) => n.events);
}

/** Play a solution through a fresh world (the same flags); returns it at the end. */
export function replay(level: Level, log: ReadonlyArray<readonly [number, number]>, flags: Partial<WorldFlags> = {}): { w: World; events: WorldEvent[] } {
  const w = createWorld(level, flags);
  const events: WorldEvent[] = [];
  for (const [bits, n] of log) {
    for (let i = 0; i < n; i++) {
      step(w, bits);
      events.push(...w.events);
    }
  }
  return { w, events };
}

/** Common goals. */
export const reachDoor = (kind: string): SolveGoal => ({
  done: (events) => events.some((e) => e.type === "door" && e.kind === kind),
  target: (w) => {
    const d = w.level.doors.find((x) => x.kind === kind)!;
    return { x: d.rect.x + d.rect.w / 2, y: d.rect.y + d.rect.h / 2 };
  },
});

export const reachEvent = (type: WorldEvent["type"], at: { x: number; y: number }): SolveGoal => ({
  done: (events) => events.some((e) => e.type === type),
  target: () => at,
});

/** Push the level's block into its gap (scored by how far the block still has to go). */
export const loadBlock = (): SolveGoal => ({
  done: (events) => events.some((e) => e.type === "loaded"),
  target: (w) => {
    const b = w.blocks[0]!;
    return { x: b.x + b.w + 6, y: b.y + 8 };
  },
  bonus: (w) => {
    const b = w.blocks[0]!;
    const notch = w.level.notch!;
    return -(Math.abs(b.x - notch.x) + Math.abs(b.y - notch.y)) * 20;
  },
});
