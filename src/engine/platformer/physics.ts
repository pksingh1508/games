// Tile physics for the platformers (Plan/gameStack.md §6.2, §7). Bodies have whole-pixel
// positions plus a sub-pixel remainder, and move one pixel at a time against solids. Collisions
// are exact, and every step uses plain arithmetic only, so a recording always replays the same way.

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Body extends Rect {
  vx: number;
  vy: number;
  /** Sub-pixel movement not yet applied. */
  rx: number;
  ry: number;
}

/** What a body collides with. */
export interface Solids {
  /** Anything solid overlapping this rectangle? */
  solidAt(x: number, y: number, w: number, h: number): boolean;
  /** A one-way platform whose top edge is exactly at `y`, under [x, x + w)? (Only blocks falling.) */
  ledgeAt?(x: number, y: number, w: number): boolean;
}

export const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/** Shrink a rectangle on every side (forgiving hitboxes). */
export const inset = (r: Rect, by: number): Rect => ({ x: r.x + by, y: r.y + by, w: Math.max(0, r.w - by * 2), h: Math.max(0, r.h - by * 2) });

/** Move horizontally. Returns true if a wall stopped the body. */
export function moveX(body: Body, amount: number, solids: Solids): boolean {
  body.rx += amount;
  let move = Math.round(body.rx);
  if (move === 0) return false;
  body.rx -= move;
  const step = move > 0 ? 1 : -1;
  while (move !== 0) {
    if (solids.solidAt(body.x + step, body.y, body.w, body.h)) {
      body.rx = 0;
      return true;
    }
    body.x += step;
    move -= step;
  }
  return false;
}

/** Move vertically (one-way platforms only stop a falling body). Returns true if stopped. */
export function moveY(body: Body, amount: number, solids: Solids): boolean {
  body.ry += amount;
  let move = Math.round(body.ry);
  if (move === 0) return false;
  body.ry -= move;
  const step = move > 0 ? 1 : -1;
  while (move !== 0) {
    const blocked =
      solids.solidAt(body.x, body.y + step, body.w, body.h) || (step > 0 && Boolean(solids.ledgeAt?.(body.x, body.y + body.h, body.w)));
    if (blocked) {
      body.ry = 0;
      return true;
    }
    body.y += step;
    move -= step;
  }
  return false;
}

/** Standing on something (solid or a one-way ledge) right now? */
export function onGround(body: Rect, solids: Solids): boolean {
  return solids.solidAt(body.x, body.y + 1, body.w, body.h) || Boolean(solids.ledgeAt?.(body.x, body.y + body.h, body.w));
}

/** Move `value` toward `target` by at most `delta`. */
export function approach(value: number, target: number, delta: number): number {
  return value < target ? Math.min(target, value + delta) : Math.max(target, value - delta);
}

/** A grid of tiles: which cells are solid, which are one-way ledges. */
export class TileGrid implements Solids {
  constructor(
    readonly cols: number,
    readonly rows: number,
    readonly size: number,
    private readonly solidCell: (col: number, row: number) => boolean,
    private readonly ledgeCell: (col: number, row: number) => boolean = () => false,
  ) {}

  solidAt(x: number, y: number, w: number, h: number): boolean {
    const c0 = Math.floor(x / this.size);
    const c1 = Math.floor((x + w - 1) / this.size);
    const r0 = Math.floor(y / this.size);
    const r1 = Math.floor((y + h - 1) / this.size);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (this.solidCell(c, r)) return true;
    return false;
  }

  ledgeAt(x: number, y: number, w: number): boolean {
    if (y % this.size !== 0) return false;
    const r = y / this.size;
    const c0 = Math.floor(x / this.size);
    const c1 = Math.floor((x + w - 1) / this.size);
    for (let c = c0; c <= c1; c++) if (this.ledgeCell(c, r)) return true;
    return false;
  }
}
