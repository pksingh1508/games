// The solver (Plan/12-cursor-escape.md §14): proves each level can be escaped, at a hand speed a person
// can manage, and sets its medal times. It's a beam search through the real simulation: every 1/20 s it
// tries moving the hand in 16 directions at two speeds (or holding still), and keeps the most promising
// moments, ranked by how far the cursor still has to go (a distance field round the walls, worked out
// once per goal). A level can give it waypoints: windows to close first, a safe file to wait in.
import { CLIENT, DESK_H, DESK_W, TITLE } from "./constants";
import { circleHitsRect, inRect, type Rect } from "./geometry";
import { panelClose } from "./level";
import { World, type Course, type Input, type WorldOptions } from "./sim";

/** A place to get to (and click, or wait in until a tick). */
export interface Waypoint {
  rect: Rect;
  click?: boolean;
  /** Stay inside until this tick (after the first move). */
  until?: number;
  /** Don't count it reached before this tick. */
  after?: number;
  /** Only count it reached once this is true (a dialog closed, the [X] hopped): until then, keep at it. */
  done?: (w: World) => boolean;
}

export interface SolveOptions {
  /** How many moments to keep at each step. */
  beam?: number;
  /** Give up after this long. */
  maxTicks?: number;
  /** The way through (default: the [X]). */
  route?: Waypoint[];
  world?: WorldOptions;
  /** Report progress (step, best distance). */
  trace?: (step: number, best: number, kept: number) => void;
}

export interface Solution {
  /** One character a move (MACRO ticks of one hand movement), "!" after one that ends in a click. */
  moves: string;
  /** Ticks from the first move to the click on the [X]. */
  time: number;
}

/** The solver's moves: still, then 16 directions at each speed. One character each. */
export const MACRO = 6;
export const SPEEDS = [1, 2.5];
const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const ACTIONS: Array<[number, number]> = [[0, 0]];
for (const v of SPEEDS) for (let d = 0; d < 16; d++) ACTIONS.push([round6(Math.cos((d / 16) * Math.PI * 2) * v), round6(Math.sin((d / 16) * Math.PI * 2) * v)]);
function round6(v: number) {
  return Math.round(v * 1e6) / 1e6;
}

const GRID = 2;
const GW = DESK_W / GRID;
const GH = DESK_H / GRID;

/** Walking distance (px) to a goal from every grid point, round the walls (for a point with a small hitbox). */
export function distanceField(walls: readonly Rect[], goal: Rect, radius = 1): Float64Array {
  const blocked = new Uint8Array(GW * GH);
  for (let gy = 0; gy < GH; gy++) {
    for (let gx = 0; gx < GW; gx++) {
      const x = gx * GRID + GRID / 2;
      const y = gy * GRID + GRID / 2;
      if (y < TITLE.y || y > CLIENT.y + CLIENT.h || x < CLIENT.x || x > CLIENT.x + CLIENT.w) {
        blocked[gy * GW + gx] = 1;
        continue;
      }
      for (const w of walls) {
        if (circleHitsRect(x, y, radius, w)) {
          blocked[gy * GW + gx] = 1;
          break;
        }
      }
    }
  }
  const dist = new Float64Array(GW * GH).fill(Infinity);
  // Dijkstra on an 8-connected grid (a binary heap of [distance, index]).
  const heap: number[] = [];
  const push = (d: number, i: number) => {
    heap.push(d, i);
    let k = heap.length / 2 - 1;
    while (k > 0) {
      const parent = (k - 1) >> 1;
      if (heap[parent * 2]! <= heap[k * 2]!) break;
      [heap[parent * 2], heap[k * 2]] = [heap[k * 2]!, heap[parent * 2]!];
      [heap[parent * 2 + 1], heap[k * 2 + 1]] = [heap[k * 2 + 1]!, heap[parent * 2 + 1]!];
      k = parent;
    }
  };
  const pop = (): [number, number] => {
    const top: [number, number] = [heap[0]!, heap[1]!];
    const lastI = heap.pop()!;
    const lastD = heap.pop()!;
    if (heap.length) {
      heap[0] = lastD;
      heap[1] = lastI;
      let k = 0;
      const n = heap.length / 2;
      for (;;) {
        const l = k * 2 + 1;
        const r = l + 1;
        let m = k;
        if (l < n && heap[l * 2]! < heap[m * 2]!) m = l;
        if (r < n && heap[r * 2]! < heap[m * 2]!) m = r;
        if (m === k) break;
        [heap[m * 2], heap[k * 2]] = [heap[k * 2]!, heap[m * 2]!];
        [heap[m * 2 + 1], heap[k * 2 + 1]] = [heap[k * 2 + 1]!, heap[m * 2 + 1]!];
        k = m;
      }
    }
    return top;
  };
  for (let gy = 0; gy < GH; gy++) {
    for (let gx = 0; gx < GW; gx++) {
      const i = gy * GW + gx;
      if (inRect(gx * GRID + GRID / 2, gy * GRID + GRID / 2, goal)) {
        dist[i] = 0;
        push(0, i);
      }
    }
  }
  const steps: Array<[number, number, number]> = [
    [1, 0, GRID],
    [-1, 0, GRID],
    [0, 1, GRID],
    [0, -1, GRID],
    [1, 1, GRID * Math.SQRT2],
    [1, -1, GRID * Math.SQRT2],
    [-1, 1, GRID * Math.SQRT2],
    [-1, -1, GRID * Math.SQRT2],
  ];
  while (heap.length) {
    const [d, i] = pop();
    if (d > dist[i]!) continue;
    const gx = i % GW;
    const gy = (i / GW) | 0;
    for (const [sx, sy, cost] of steps) {
      const nx = gx + sx;
      const ny = gy + sy;
      if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
      const j = ny * GW + nx;
      // Blocked cells can still be left (the goal's sometimes inside something, like the [X]).
      if (blocked[j] && !(dist[i] === 0)) continue;
      const nd = d + cost;
      if (nd < dist[j]!) {
        dist[j] = nd;
        push(nd, j);
      }
    }
  }
  return dist;
}

export function fieldAt(field: Float64Array, x: number, y: number): number {
  const gx = Math.max(0, Math.min(GW - 1, Math.floor(x / GRID)));
  const gy = Math.max(0, Math.min(GH - 1, Math.floor(y / GRID)));
  return field[gy * GW + gx]!;
}

interface Node {
  world: World;
  /** Which waypoint it's heading for. */
  k: number;
  /** The input so far: one action index per move (−1: click-in-place appended), shared with its parent. */
  path: { a: number; click: boolean; before: Node["path"] } | null;
  score: number;
}

/** The walls the distance field goes round: the window and the level's own walls (windows and dialogs come and go). */
function staticWalls(course: Course): Rect[] {
  return [...course.walls];
}

export function solve(course: Course, options: SolveOptions = {}): Solution | null {
  const { beam = 160, maxTicks = 120 * 60, world: worldOptions = {} } = options;
  const macro = MACRO;
  const route: Waypoint[] = options.route ?? [{ rect: { x: 608, y: 14, w: 14, h: 12 }, click: true }];
  const walls = staticWalls(course);
  const fields = route.map((w) => distanceField(walls, w.rect));
  // What's left after each waypoint (so later waypoints always rank better).
  const rest: number[] = route.map((_, k) => {
    let sum = 0;
    for (let j = k + 1; j < route.length; j++) {
      const c = route[j - 1]!.rect;
      sum += fieldAt(fields[j]!, c.x + c.w / 2, c.y + c.h / 2) + 1000;
    }
    return sum;
  });
  const actions = ACTIONS;

  const start = new World(course, worldOptions);
  // The first move starts the clock: a tiny nudge.
  start.step({ dx: 0.0001, dy: 0, click: false });
  let frontier: Node[] = [{ world: start, k: 0, path: null, score: 0 }];
  const steps = Math.ceil(maxTicks / macro);
  for (let step = 0; step < steps; step++) {
    const next = new Map<string, Node>();
    for (const node of frontier) {
      for (let a = 0; a < actions.length; a++) {
        const [dx, dy] = actions[a]!;
        const w = node.world.clone();
        const input: Input = { dx, dy, click: false };
        for (let i = 0; i < macro && w.status === "run"; i++) w.step(input);
        if (w.status !== "run") continue;
        let k = node.k;
        let click = false;
        // At a waypoint: click it (or wait it out), and head for the next.
        const wp = route[k]!;
        if (inRect(w.x, w.y, wp.rect) && (wp.after === undefined || w.tick >= wp.after)) {
          if (wp.click) {
            w.step({ dx: 0, dy: 0, click: true });
            click = true;
            // (The click changes the status: read it afresh.)
            const after = w.status as World["status"];
            if (after === "won") return finish(w, { a, click: true, before: node.path });
            if (after !== "run") continue;
            if (!wp.done || wp.done(w)) k++;
          } else if ((wp.until === undefined || w.tick >= wp.until) && (!wp.done || wp.done(w))) k++;
        }
        const field = fields[Math.min(k, route.length - 1)]!;
        let score = fieldAt(field, w.x, w.y) + rest[Math.min(k, route.length - 1)]!;
        // Waiting in a waypoint you have to wait in is good.
        if (route[k]?.until !== undefined && inRect(w.x, w.y, route[k]!.rect)) score = rest[k]!;
        const key = `${k}:${Math.round(w.x / 2)}:${Math.round(w.y / 2)}:${Math.round((w.hx - w.x) / 3)}:${Math.round((w.hy - w.y) / 3)}:${w.busy > 0 ? 1 : 0}:${w.grab}:${w.panels.map((p) => (p.open ? 1 : 0) + (p.closed ? 2 : 0)).join("")}`;
        const seen = next.get(key);
        if (seen && seen.score <= score) continue;
        next.set(key, { world: w, k, path: { a, click, before: node.path }, score });
      }
    }
    let nodes = [...next.values()];
    if (!nodes.length) return null;
    nodes.sort((p, q) => p.score - q.score);
    // Keep a spread: no more than a few from any 24 px square.
    const per = new Map<string, number>();
    const kept: Node[] = [];
    for (const n of nodes) {
      const cell = `${n.k}:${Math.floor(n.world.x / 24)}:${Math.floor(n.world.y / 24)}`;
      const c = per.get(cell) ?? 0;
      if (c >= 6) continue;
      per.set(cell, c + 1);
      kept.push(n);
      if (kept.length >= beam) break;
    }
    nodes = kept;
    options.trace?.(step, nodes[0]!.score, nodes.length);
    frontier = nodes;
  }
  return null;
}

function finish(w: World, path: NonNullable<Node["path"]>): Solution {
  const moves: string[] = [];
  for (let p: Node["path"] = path; p; p = p.before) moves.push(ALPHABET[p.a]! + (p.click ? "!" : ""));
  return { moves: moves.reverse().join(""), time: w.tick };
}

/** Play a solver's moves back through a fresh world (the tests, and QA's autoplay). */
export function replay(course: Course, moves: string, worldOptions: WorldOptions = {}): World {
  const w = new World(course, worldOptions);
  for (const input of inputsOf(moves)) {
    if (w.status === "crashed" || w.status === "won") break;
    w.step(input);
  }
  return w;
}

/** The moves, tick by tick (the first tick's a nudge that starts the clock). */
export function* inputsOf(moves: string): Generator<Input> {
  yield { dx: 0.0001, dy: 0, click: false };
  for (let i = 0; i < moves.length; i++) {
    const a = ALPHABET.indexOf(moves[i]!);
    const [dx, dy] = ACTIONS[a]!;
    for (let k = 0; k < MACRO; k++) yield { dx, dy, click: false };
    if (moves[i + 1] === "!") {
      yield { dx: 0, dy: 0, click: true };
      i++;
    }
  }
}

/** Waypoint helper: a panel's [X]. */
export const closeOf = (panelRect: Rect): Waypoint => ({ rect: shrinkRect(panelClose(panelRect), 2), click: true });

const shrinkRect = (r: Rect, by: number): Rect => ({ x: r.x + by, y: r.y + by, w: r.w - by * 2, h: r.h - by * 2 });
