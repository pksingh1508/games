// The levels of Super Happy Jump! (Plan/04-dont-trust-the-game.md §5). A level is a grid of cells plus the
// things on it: coins (real ones spin; the one that doesn't is a spike), doors (real, cardboard, missing),
// zones that make HELPER talk, a pushable block, saws, portals and buttons. Levels are built by placing
// runs at coordinates (see levels/), which keeps their widths honest.
import type { Rect } from "@/engine/platformer/physics";
import { PLAYER_H, PLAYER_W, TILE } from "./constants";

/** What a cell is. Some depend on the scene's state (the brightness, the difficulty, a squeezed wall). */
export const CELL = {
  air: 0,
  /** Ground, walls. */
  solid: 1,
  /** One-way: you can jump up through it. */
  ledge: 2,
  /** Real spikes: they don't move. */
  spike: 3,
  /** Paper spikes: they flutter in the wind, and you can walk through them. */
  paper: 4,
  /** Solid, but only drawn when the Options menu's brightness is up. */
  hidden: 5,
  /** A wall that's only there on Easy ("Easy? Nah."). */
  easy: 6,
  /** A bridge that's only there on Hard. */
  hard: 7,
  /** The loading bar (solid). */
  bar: 8,
  /** The dots of "Loading..." (one-way). */
  dot: 9,
  /** The giant 404's strokes (solid). */
  digit: 10,
  /** A stroke you can bonk from below (the second 4 of 404). */
  bonk: 11,
  /** The squeezable wall: always solid… */
  wall: 12,
  /** …except its bottom, once squeezed. */
  wallLow: 13,
  /** A credits line you can stand on (one-way). */
  name: 14,
  /** Ground drawn as a plain, technical floor (error screens). */
  plain: 15,
} as const;
export type Cell = (typeof CELL)[keyof typeof CELL];

export type Theme = "tutorial" | "options" | "loading" | "error" | "secret" | "void" | "console" | "credits";

export type DoorKind =
  /** The way out. */
  | "exit"
  /** Cardboard: falls flat when you touch it. */
  | "fake"
  /** An empty frame until the page is reloaded. */
  | "frame"
  /** Locked until the console opens it. */
  | "locked"
  /** Back to where you came from (room 405). */
  | "back";

export interface Door {
  id: string;
  kind: DoorKind;
  rect: Rect;
}

export interface Named {
  id: string;
  rect: Rect;
}

export interface Saw {
  /** Back and forth along this path (px, the saw's centre). */
  path: ReadonlyArray<{ x: number; y: number }>;
  /** Pixels a tick. */
  speed: number;
  radius: number;
}

export interface NameLine {
  text: string;
  /** The ledge it sits on: columns and row. */
  col: number;
  row: number;
  cols: number;
}

export interface Level {
  id: string;
  theme: Theme;
  cols: number;
  rows: number;
  cells: Uint8Array;
  /** Where the hero starts (its top-left, in px). */
  spawn: { x: number; y: number };
  coins: Rect[];
  /** Coins that don't spin: spikes in disguise. */
  fakeCoins: Rect[];
  doors: Door[];
  /** Entering one makes something happen (usually HELPER speaks). */
  zones: Named[];
  /** Touching one moves your respawn point there. */
  checkpoints: Rect[];
  /** Pushable blocks, where they start. */
  blocks: Rect[];
  /** Where a block finishes loading (the missing 1%). */
  notch: Rect | null;
  saws: Saw[];
  portals: Named[];
  /** Cells that do something when bonked from below. */
  bonks: Named[];
  levers: Named[];
  /** Little secrets to pick up. */
  stickers: Named[];
  /** Quit and Stay, at the top of the credits. */
  buttons: Named[];
  names: NameLine[];
  /** The "safe frame": the part of a big level the screen shows unless you zoom out (px). */
  frame: Rect | null;
  /** Painted signs (pixel text in the world). */
  signs: ReadonlyArray<{ text: string; x: number; y: number; scale?: number; colour?: string }>;
  /** Solver waypoints (px), for levels that double back. */
  route: ReadonlyArray<{ x: number; y: number }>;
}

export const cellAt = (level: Level, col: number, row: number): Cell =>
  col < 0 || row < 0 || col >= level.cols || row >= level.rows ? CELL.air : (level.cells[row * level.cols + col] as Cell);

export const levelWidth = (level: Level) => level.cols * TILE;
export const levelHeight = (level: Level) => level.rows * TILE;

/** A rectangle of cells (inclusive), in px. */
export const cellRect = (c0: number, r0: number, c1 = c0, r1 = r0): Rect => ({ x: c0 * TILE, y: r0 * TILE, w: (c1 - c0 + 1) * TILE, h: (r1 - r0 + 1) * TILE });

/** Builds a level by placing runs of cells and things at coordinates. */
export class LevelBuilder {
  readonly cells: Uint8Array;
  private readonly parts: Omit<Level, "id" | "theme" | "cols" | "rows" | "cells" | "spawn"> = {
    coins: [],
    fakeCoins: [],
    doors: [],
    zones: [],
    checkpoints: [],
    blocks: [],
    notch: null,
    saws: [],
    portals: [],
    bonks: [],
    levers: [],
    stickers: [],
    buttons: [],
    names: [],
    frame: null,
    signs: [],
    route: [],
  };
  private spawnAt = { x: 0, y: 0 };

  constructor(
    readonly id: string,
    readonly theme: Theme,
    readonly cols: number,
    readonly rows: number,
  ) {
    this.cells = new Uint8Array(cols * rows);
  }

  /** Fill cells c0..c1 × r0..r1 (inclusive). */
  fill(c0: number, r0: number, c1: number, r1: number, cell: Cell): this {
    for (let r = Math.max(0, r0); r <= Math.min(this.rows - 1, r1); r++) {
      for (let c = Math.max(0, c0); c <= Math.min(this.cols - 1, c1); c++) this.cells[r * this.cols + c] = cell;
    }
    return this;
  }

  set(c: number, r: number, cell: Cell): this {
    return this.fill(c, r, c, r, cell);
  }

  /** The hero stands on the cell below (col, row): its feet at the bottom of this cell. */
  spawn(col: number, row: number): this {
    this.spawnAt = { x: col * TILE + (TILE - PLAYER_W) / 2, y: (row + 1) * TILE - PLAYER_H };
    return this;
  }

  coin(col: number, row: number): this {
    this.parts.coins.push({ x: col * TILE + 3, y: row * TILE + 2, w: 10, h: 12 });
    return this;
  }

  fakeCoin(col: number, row: number): this {
    this.parts.fakeCoins.push({ x: col * TILE + 3, y: row * TILE + 2, w: 10, h: 12 });
    return this;
  }

  /** A door two cells tall, standing on the cell below (col, row). */
  door(id: string, kind: DoorKind, col: number, row: number): this {
    this.parts.doors.push({ id, kind, rect: { x: col * TILE, y: (row - 1) * TILE, w: TILE, h: TILE * 2 } });
    return this;
  }

  zone(id: string, c0: number, r0: number, c1: number, r1: number): this {
    this.parts.zones.push({ id, rect: cellRect(c0, r0, c1, r1) });
    return this;
  }

  checkpoint(col: number, row: number): this {
    this.parts.checkpoints.push(cellRect(col, row));
    return this;
  }

  block(col: number, row: number): this {
    this.parts.blocks.push(cellRect(col, row));
    return this;
  }

  notch(col: number, row: number): this {
    this.parts.notch = cellRect(col, row);
    return this;
  }

  saw(path: ReadonlyArray<readonly [number, number]>, speed: number, radius = 7): this {
    this.parts.saws.push({ path: path.map(([x, y]) => ({ x, y })), speed, radius });
    return this;
  }

  portal(id: string, c0: number, r0: number, c1: number, r1: number): this {
    this.parts.portals.push({ id, rect: cellRect(c0, r0, c1, r1) });
    return this;
  }

  bonk(id: string, col: number, row: number): this {
    this.set(col, row, CELL.bonk);
    this.parts.bonks.push({ id, rect: cellRect(col, row) });
    return this;
  }

  lever(id: string, col: number, row: number): this {
    this.parts.levers.push({ id, rect: cellRect(col, row) });
    return this;
  }

  sticker(id: string, col: number, row: number): this {
    this.parts.stickers.push({ id, rect: { x: col * TILE + 2, y: row * TILE + 2, w: 12, h: 12 } });
    return this;
  }

  button(id: string, c0: number, r0: number, c1: number, r1: number): this {
    this.parts.buttons.push({ id, rect: cellRect(c0, r0, c1, r1) });
    return this;
  }

  /** A credits line: a one-way ledge as wide as its text. */
  name(text: string, col: number, row: number, cols: number): this {
    this.fill(col, row, col + cols - 1, row, CELL.name);
    this.parts.names.push({ text, col, row, cols });
    return this;
  }

  frame(c0: number, r0: number, c1: number, r1: number): this {
    this.parts.frame = cellRect(c0, r0, c1, r1);
    return this;
  }

  sign(text: string, x: number, y: number, scale = 1, colour?: string): this {
    this.parts.signs = [...this.parts.signs, { text, x, y, scale, colour }];
    return this;
  }

  /** A waypoint for the solver (the centre of a cell). */
  via(col: number, row: number): this {
    this.parts.route = [...this.parts.route, { x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 }];
    return this;
  }

  build(): Level {
    return { id: this.id, theme: this.theme, cols: this.cols, rows: this.rows, cells: this.cells, spawn: this.spawnAt, ...this.parts };
  }
}
