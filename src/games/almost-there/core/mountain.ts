// The mountain (Plan/08-almost-there.md §3, §5): a grid of screens, two columns wide (the outside
// face, and later the inside of the mountain) and forty rows tall. Each screen is written as a
// 48 × 27 character map (Plan §12 suggests LDtk; plain text keeps them in the code review), and
// they're assembled into one big tile grid the physics reads directly.
//
//   .  air            #  rock            ~  ice (you slide)        *  snow (weaker jumps)
//   %  crumbling      c  cloud (vanishes; stand on it from above)   =  plank (stand on it from above)
//   m  mushroom (bounces you up)          X  rock that seals the cave (gone after the fake summit)
//   Z  the fake summit's ledge (gone after the fake summit)
//   o  hollow: air behind the summit, drawn as rock until the summit falls (the shaft you fall down)
//   S  the start      F  a Lost Feather   s  a sign (it may lie)    !  a warning sign (honest)
//   j  a joke checkpoint                  P  the fake summit's flag pole      R  the real summit
//   f  worn footprints on the ground below (the real route)       E  the express elevator
//   1–5  moving gear platforms (defined next to the map)
import type { Rect } from "@/engine/platformer/physics";
import { COLS, GRID_COLS, GRID_ROWS, METRE, PIP_H, ROWS, TILE, VIEW_H, VIEW_W } from "./constants";

export type ZoneId = "foothills" | "rooftops" | "clocktower" | "cliffs" | "ice" | "fake-summit" | "inside" | "sky" | "summit";

export const T = {
  AIR: 0,
  ROCK: 1,
  ICE: 2,
  SNOW: 3,
  CRUMBLE: 4,
  CLOUD: 5,
  MUSHROOM: 6,
  SEAL: 7,
  SUMMIT: 8,
  PLANK: 9,
  HOLLOW: 10,
} as const;
export type TileCode = (typeof T)[keyof typeof T];

const TILE_CHARS: Record<string, TileCode> = {
  ".": T.AIR,
  "#": T.ROCK,
  "~": T.ICE,
  "*": T.SNOW,
  "%": T.CRUMBLE,
  c: T.CLOUD,
  m: T.MUSHROOM,
  X: T.SEAL,
  Z: T.SUMMIT,
  "=": T.PLANK,
  o: T.HOLLOW,
};

export interface GearSource {
  /** Where it travels to and back, in tiles from where it's drawn. */
  to: [dx: number, dy: number];
  /** Ticks for the trip there and back. */
  period: number;
  /** Ticks into the cycle at tick 0. */
  offset?: number;
}

export type WindPattern = { kind: "steady" } | { kind: "gusts"; period: number; on: number; offset?: number };

export interface WindSource {
  /** Tiles: [col, row, width, height] within the screen. */
  area: [number, number, number, number];
  /** Push per tick in the air (px/tick²); positive is to the right. */
  push: number;
  pattern: WindPattern;
}

export interface ScreenSource {
  zone: ZoneId;
  col: number;
  /** 0 is the bottom of the mountain. */
  row: number;
  map: readonly string[];
  /** Text for each "s" and "!" sign, in reading order. */
  signs?: readonly string[];
  gears?: Readonly<Record<string, GearSource>>;
  wind?: readonly WindSource[];
  /** The express elevator: how far it goes (px, down). */
  elevatorDrop?: number;
  /** Never reachable: the sky above the fake summit (only the credits' camera sees it). */
  scenery?: boolean;
}

export interface Screen {
  id: string;
  zone: ZoneId;
  col: number;
  row: number;
  /** Top-left of the screen in world pixels. */
  x: number;
  y: number;
  scenery: boolean;
}

export interface Gear {
  rect: Rect;
  dx: number;
  dy: number;
  period: number;
  offset: number;
}

export interface Wind {
  rect: Rect;
  push: number;
  pattern: WindPattern;
  screen: string;
}

export interface Sign {
  x: number;
  y: number;
  text: string;
  /** Warning signs (big falls ahead) never lie. */
  warning: boolean;
}

export interface Elevator {
  rect: Rect;
  drop: number;
}

export interface Feather extends Rect {
  index: number;
  zone: ZoneId;
}

export interface Mountain {
  /** One byte per tile, (GRID_COLS × 48) × (GRID_ROWS × 27), row-major from the top. */
  tiles: Uint8Array;
  tileCols: number;
  tileRows: number;
  screens: Screen[];
  start: { x: number; y: number };
  feathers: Feather[];
  signs: Sign[];
  jokes: Rect[];
  fakeFlag: Rect;
  realFlag: Rect;
  gears: Gear[];
  wind: Wind[];
  elevators: Elevator[];
  footprints: Array<{ x: number; y: number }>;
  /** Tiles that go when the fake summit collapses (its ledge and the cave's seal). */
  collapse: number[];
  mirrored: boolean;
}

export const screenId = (col: number, row: number) => `${col}:${row}`;

/** World pixel y of the top of a screen row (row 0 is the bottom of the mountain). */
export const rowTop = (row: number) => (GRID_ROWS - 1 - row) * VIEW_H;

/** The screen a world point is in. */
export function screenAt(x: number, y: number): { col: number; row: number } {
  return { col: Math.max(0, Math.min(GRID_COLS - 1, Math.floor(x / VIEW_W))), row: Math.max(0, Math.min(GRID_ROWS - 1, GRID_ROWS - 1 - Math.floor(y / VIEW_H))) };
}

/** Mirror Mountain (Plan §5): every screen flipped, the columns swapped, the wind reversed. */
export function mirrorSource(s: ScreenSource): ScreenSource {
  const width = COLS;
  const flipGear = (g: GearSource): GearSource => ({ ...g, to: [-g.to[0], g.to[1]] });
  return {
    ...s,
    col: GRID_COLS - 1 - s.col,
    map: s.map.map((row) => [...row].reverse().join("")),
    gears: s.gears ? Object.fromEntries(Object.entries(s.gears).map(([k, g]) => [k, flipGear(g)])) : undefined,
    wind: s.wind?.map((w) => ({ ...w, push: -w.push, area: [width - w.area[0] - w.area[2], w.area[1], w.area[2], w.area[3]] })),
  };
}

export function buildMountain(sources: readonly ScreenSource[], { mirrored = false }: { mirrored?: boolean } = {}): Mountain {
  const tileCols = GRID_COLS * COLS;
  const tileRows = GRID_ROWS * ROWS;
  // Anywhere without a screen is solid rock.
  const tiles = new Uint8Array(tileCols * tileRows).fill(T.ROCK);
  const mountain: Mountain = {
    tiles,
    tileCols,
    tileRows,
    screens: [],
    start: { x: 0, y: 0 },
    feathers: [],
    signs: [],
    jokes: [],
    fakeFlag: { x: 0, y: 0, w: 0, h: 0 },
    realFlag: { x: 0, y: 0, w: 0, h: 0 },
    gears: [],
    wind: [],
    elevators: [],
    footprints: [],
    collapse: [],
    mirrored,
  };
  let hasStart = false;
  let hasFake = false;
  let hasReal = false;
  let featherCount = 0;
  const seen = new Set<string>();

  for (const raw of sources) {
    const source = mirrored ? mirrorSource(raw) : raw;
    const id = screenId(source.col, source.row);
    if (seen.has(id)) throw new Error(`Two screens at ${id}`);
    seen.add(id);
    if (source.map.length !== ROWS || source.map.some((r) => r.length !== COLS)) {
      throw new Error(`Screen ${id} (${source.zone}): the map must be ${COLS} × ${ROWS}, got ${source.map.map((r) => r.length).join(",")}`);
    }
    const sx = source.col * VIEW_W;
    const sy = rowTop(source.row);
    mountain.screens.push({ id, zone: source.zone, col: source.col, row: source.row, x: sx, y: sy, scenery: Boolean(source.scenery) });
    const signTexts = [...(source.signs ?? [])];
    const gearCells = new Map<string, Array<[number, number]>>();
    const elevatorCells: Array<[number, number]> = [];

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const ch = source.map[r]![c]!;
        const tx = source.col * COLS + c;
        const ty = (GRID_ROWS - 1 - source.row) * ROWS + r;
        const at = ty * tileCols + tx;
        const x = sx + c * TILE;
        const y = sy + r * TILE;
        const code = TILE_CHARS[ch];
        tiles[at] = code ?? T.AIR;
        if (code === T.SEAL || code === T.SUMMIT) mountain.collapse.push(at);
        if (code !== undefined) continue;
        switch (ch) {
          case "S":
            if (hasStart) throw new Error(`Screen ${id}: a second start`);
            hasStart = true;
            mountain.start = { x: x + 1, y: y + TILE - PIP_H };
            break;
          case "F":
            mountain.feathers.push({ x: x + 1, y: y + 1, w: 6, h: 6, index: featherCount++, zone: source.zone });
            break;
          case "s":
          case "!": {
            const text = signTexts.shift();
            if (text === undefined) throw new Error(`Screen ${id}: no text for the sign at ${c},${r}`);
            mountain.signs.push({ x: x + TILE / 2, y: y + TILE, text, warning: ch === "!" });
            break;
          }
          case "j":
            mountain.jokes.push({ x: x + 1, y: y - 6, w: 6, h: 14 });
            break;
          case "P":
            hasFake = true;
            mountain.fakeFlag = { x: x + 2, y: y - 16, w: 4, h: 24 };
            break;
          case "R":
            hasReal = true;
            mountain.realFlag = { x: x + 2, y: y - 16, w: 4, h: 24 };
            break;
          case "f":
            mountain.footprints.push({ x, y: y + TILE });
            break;
          case "E":
            elevatorCells.push([c, r]);
            break;
          default:
            if (ch >= "1" && ch <= "5") {
              const list = gearCells.get(ch) ?? [];
              list.push([c, r]);
              gearCells.set(ch, list);
            } else throw new Error(`Screen ${id}: unknown "${ch}" at ${c},${r}`);
        }
      }
    }
    if (signTexts.length) throw new Error(`Screen ${id}: ${signTexts.length} sign texts without signs`);

    for (const [letter, cells] of gearCells) {
      const def = source.gears?.[letter];
      if (!def) throw new Error(`Screen ${id}: no gear defined for "${letter}"`);
      const cs = cells.map(([c]) => c);
      const rs = cells.map(([, r]) => r);
      const c0 = Math.min(...cs);
      const r0 = Math.min(...rs);
      mountain.gears.push({
        rect: { x: sx + c0 * TILE, y: sy + r0 * TILE, w: (Math.max(...cs) - c0 + 1) * TILE, h: (Math.max(...rs) - r0 + 1) * TILE },
        dx: def.to[0] * TILE,
        dy: def.to[1] * TILE,
        period: def.period,
        offset: def.offset ?? 0,
      });
    }
    if (elevatorCells.length) {
      const cs = elevatorCells.map(([c]) => c);
      const r0 = elevatorCells[0]![1];
      const c0 = Math.min(...cs);
      mountain.elevators.push({ rect: { x: sx + c0 * TILE, y: sy + r0 * TILE, w: (Math.max(...cs) - c0 + 1) * TILE, h: TILE }, drop: source.elevatorDrop ?? 2 * VIEW_H });
    }
    for (const w of source.wind ?? []) {
      const [c, r, wc, wr] = w.area;
      mountain.wind.push({ rect: { x: sx + c * TILE, y: sy + r * TILE, w: wc * TILE, h: wr * TILE }, push: w.push, pattern: w.pattern, screen: id });
    }
  }

  if (!hasStart) throw new Error("The mountain has no start (S)");
  if (!hasFake) throw new Error("The mountain has no fake summit (P)");
  if (!hasReal) throw new Error("The mountain has no real summit (R)");
  mountain.screens.sort((a, b) => a.row - b.row || a.col - b.col);
  return mountain;
}

export function screenOf(m: Mountain, col: number, row: number): Screen | undefined {
  return m.screens.find((s) => s.col === col && s.row === row);
}

/** Solid from every side (planks and clouds only from above; the summit's ledge and seal until they fall). */
export function isSolidTile(code: number, collapsed: boolean): boolean {
  if (code === T.ROCK || code === T.ICE || code === T.SNOW || code === T.MUSHROOM || code === T.CRUMBLE) return true;
  return (code === T.SEAL || code === T.SUMMIT) && !collapsed;
}

/** The tile at a tile position (outside the mountain: rock). */
export function tileAt(m: Mountain, tx: number, ty: number): number {
  if (tx < 0 || tx >= m.tileCols || ty < 0 || ty >= m.tileRows) return T.ROCK;
  return m.tiles[ty * m.tileCols + tx]!;
}

/** How high a point is, in metres above the foot of the mountain. */
export const altitudeOf = (y: number) => Math.max(0, (GRID_ROWS * VIEW_H - y) / METRE);
