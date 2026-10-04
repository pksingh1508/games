// A rough map of how to get around a room, for the solver's sense of direction (the same idea as
// TrapSprint's, for rooms of any width): which cells you can stand in, and which you can reach from
// each by walking, jumping (3 tiles up, about 4 across) or dropping. The distance to the goal along
// this graph tells the solver that the floor under a ledge is far from the ledge, not next to it.
import { ROWS, TILE } from "./constants";
import { ROCK, type FloorKind, type Room } from "./room";

/** Floors that can hold you (some of the time). The solver's simulation knows which really do. */
const HOLDS: ReadonlySet<FloorKind> = new Set(["solid", "invisible", "crumble", "returnTrip", "flip"]);

function supports(room: Room): Uint8Array {
  const out = new Uint8Array(room.cols * ROWS);
  for (let i = 0; i < out.length; i++) {
    const v = room.cells[i]!;
    out[i] = v === ROCK || (v >= 0 && HOLDS.has(room.floors[v]!.kind)) ? 1 : 0;
  }
  return out;
}

const cache = new WeakMap<Room, Map<number, Int32Array>>();

/** Distances (in tiles of travel) from every standable cell to the goal cell. -1: no way there. */
export function distanceField(room: Room, goalCol: number, goalRow: number): Int32Array {
  const cols = room.cols;
  const id = goalRow * cols + goalCol;
  let byGoal = cache.get(room);
  if (!byGoal) {
    byGoal = new Map();
    cache.set(room, byGoal);
  }
  const hit = byGoal.get(id);
  if (hit) return hit;

  const solid = supports(room);
  const isSolid = (c: number, r: number) => c < 0 || c >= cols || r < 0 || (r < ROWS && solid[r * cols + c] === 1);
  const standable = (c: number, r: number) => c >= 0 && c < cols && r >= 0 && r < ROWS - 1 && !isSolid(c, r) && solid[(r + 1) * cols + c] === 1;

  const cells: number[] = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < cols; c++) if (standable(c, r)) cells.push(r * cols + c);
  const incoming = new Map<number, Array<[number, number]>>();
  for (const u of cells) {
    const uc = u % cols;
    const ur = Math.floor(u / cols);
    for (const v of cells) {
      if (u === v) continue;
      const vc = v % cols;
      const vr = Math.floor(v / cols);
      const dc = Math.abs(vc - uc);
      const up = ur - vr;
      const ok = (up === 0 && dc <= 4) || (up > 0 && up <= 3 && dc <= 4) || (up < 0 && dc <= 4 + -up);
      if (!ok) continue;
      const list = incoming.get(v);
      if (list) list.push([u, dc + Math.abs(up)]);
      else incoming.set(v, [[u, dc + Math.abs(up)]]);
    }
  }

  // A goal in mid-air (a door on a ledge, a key, a waypoint): the first cell you can stand in below it.
  let gr = goalRow;
  while (gr < ROWS - 1 && !standable(goalCol, gr)) gr++;

  const dist = new Int32Array(cols * ROWS).fill(-1);
  const goal = gr * cols + goalCol;
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
 * Measured from the best place it could land: below it, or a few columns either side.
 */
export function travelDistance(room: Room, goalX: number, goalY: number, x: number, feet: number): number {
  const cols = room.cols;
  const gc = Math.max(0, Math.min(cols - 1, Math.floor(goalX / TILE)));
  const gr = Math.max(0, Math.min(ROWS - 1, Math.floor((goalY - 1) / TILE)));
  const field = distanceField(room, gc, gr);
  const c0 = Math.floor(x / TILE);
  const top = Math.max(0, Math.floor((feet - 1) / TILE));
  let best = 99_999;
  for (let dc = -4; dc <= 4; dc++) {
    const c = c0 + dc;
    if (c < 0 || c >= cols) continue;
    for (let r = top; r < ROWS; r++) {
      const d = field[r * cols + c]!;
      if (d < 0) continue;
      best = Math.min(best, d * TILE + Math.abs(dc) * TILE + Math.max(0, r * TILE + TILE - feet) * 0.5);
      break;
    }
  }
  return best;
}
