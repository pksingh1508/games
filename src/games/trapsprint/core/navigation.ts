// A rough map of how to get around a level, for the solver's sense of direction: which cells you
// can stand in, and which you can reach from each by walking, jumping (up to 3 tiles up and about
// 5 across), falling or riding a spring. The distance to the goal along this graph tells the solver
// that standing right under the door's platform is far from the door, not next to it.
import { COLS, ROWS, TILE } from "./constants";
import type { Level } from "./level";

const SOLID_TRAPS = new Set(["dropFloor", "conveyorFlip", "risingFloor", "invisibleBlock"]);

/** Cells that hold you up. */
function supports(level: Level): boolean[][] {
  const grid = level.grid.map((row) => row.map((cell) => cell === "ground" || cell === "ledge" || cell === "conveyorLeft" || cell === "conveyorRight"));
  for (const t of level.traps) {
    if (!SOLID_TRAPS.has(t.kind)) continue;
    const [c0, r0, c1, r1] = t.cells;
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) grid[r]![c] = true;
  }
  return grid;
}

const cache = new WeakMap<Level, Map<number, Int32Array>>();

/** Distances (in tiles of travel) from every standable cell to the goal cell. -1: no way there. */
export function distanceField(level: Level, goalCol: number, goalRow: number): Int32Array {
  const id = goalRow * COLS + goalCol;
  let byGoal = cache.get(level);
  if (!byGoal) {
    byGoal = new Map();
    cache.set(level, byGoal);
  }
  const hit = byGoal.get(id);
  if (hit) return hit;

  const solid = supports(level);
  const isSolid = (c: number, r: number) => c < 0 || c >= COLS || r < 0 || (r < ROWS && Boolean(solid[r]![c]) && level.grid[r]![c] !== "ledge");
  const spike = (c: number, r: number) => r >= 0 && r < ROWS && c >= 0 && c < COLS && level.grid[r]![c]!.startsWith("spike");
  const standable = (c: number, r: number) => c >= 0 && c < COLS && r >= 0 && r < ROWS - 1 && !isSolid(c, r) && !spike(c, r) && Boolean(solid[r + 1]![c]);
  const springs = new Set(level.springs.map((s) => Math.floor(s.y / TILE) * COLS + Math.floor(s.x / TILE)));

  // Edges u → v (u can get to v), stored backwards for a search from the goal.
  const cells: number[] = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (standable(c, r)) cells.push(r * COLS + c);
  const incoming = new Map<number, Array<[number, number]>>();
  const edge = (u: number, v: number, cost: number) => {
    const list = incoming.get(v);
    if (list) list.push([u, cost]);
    else incoming.set(v, [[u, cost]]);
  };
  for (const u of cells) {
    const uc = u % COLS;
    const ur = Math.floor(u / COLS);
    const spring = springs.has(u);
    for (const v of cells) {
      if (u === v) continue;
      const vc = v % COLS;
      const vr = Math.floor(v / COLS);
      const dc = Math.abs(vc - uc);
      const up = ur - vr;
      let ok = false;
      if (up === 0 && dc === 1) ok = true;
      else if (spring && up > 0 && up <= 7 && dc <= 6) ok = true;
      else if (up > 0 && up <= 3 && dc <= 4) ok = true;
      else if (up === 0 && dc <= 5) ok = true;
      else if (up < 0 && dc <= 5 + -up) ok = true;
      if (ok) edge(u, v, dc + Math.abs(up));
    }
  }

  // A goal in mid-air (a door on a ledge, a waypoint): use the first cell you can stand in below it.
  let gr = goalRow;
  while (gr < ROWS - 1 && !standable(goalCol, gr)) gr++;

  // Dijkstra from the goal over the reversed edges (small graph: a plain scan is plenty fast).
  const dist = new Int32Array(COLS * ROWS).fill(-1);
  const goal = gr * COLS + goalCol;
  dist[goal] = 0;
  const open = new Set<number>([goal]);
  while (open.size) {
    let best = -1;
    for (const n of open) if (best < 0 || dist[n]! < dist[best]!) best = n;
    open.delete(best);
    for (const [u, cost] of incoming.get(best) ?? []) {
      const d = dist[best]! + cost;
      if (dist[u] === -1 || d < dist[u]!) {
        dist[u] = d;
        open.add(u);
      }
    }
  }
  byGoal.set(id, dist);
  return dist;
}

/**
 * How far a body is from the goal along the map, in pixels. `x` is its centre, `feet` its bottom.
 * Measured from the best place it could land: below it, or a few columns either side (over a pit,
 * mid-launch, "straight down" is nowhere).
 */
export function travelDistance(level: Level, goalX: number, goalY: number, x: number, feet: number): number {
  const gc = Math.max(0, Math.min(COLS - 1, Math.floor(goalX / TILE)));
  const gr = Math.max(0, Math.min(ROWS - 1, Math.floor((goalY - 1) / TILE)));
  const field = distanceField(level, gc, gr);
  const c0 = Math.floor(x / TILE);
  const top = Math.max(0, Math.floor((feet - 1) / TILE));
  let best = 99_999;
  for (let dc = -4; dc <= 4; dc++) {
    const c = c0 + dc;
    if (c < 0 || c >= COLS) continue;
    for (let r = top; r < ROWS; r++) {
      const d = field[r * COLS + c]!;
      if (d < 0) continue;
      best = Math.min(best, d * TILE + Math.abs(dc) * TILE + Math.max(0, r * TILE + TILE - feet) * 0.5);
      break;
    }
  }
  return best;
}
