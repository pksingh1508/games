// Rooms are written as character maps, 17 rows tall (missing rows at the top are air) and 30 to
// 100 columns wide (Plan §12 suggests LDtk; plain text keeps them in the code review, like
// TrapSprint's levels). Floors are entities, not plain tiles: each floor tile has its own kind
// and state (crumble timers, the return-trip crack, the glow after a pebble).
//
//   .  air               #  rock (always real)        =  floor (real)
//   f  fake floor        c  crumbling floor           i  invisible floor
//   r  return-trip       m  mimic (fakes its tell)    p  painted floor (part of the background)
//   1–9  floors that flip between real and fake (the final room), patterns in `flips`
//   S  spawn             D  the exit door             k  key (locks the door until you have it)
//   o  a pebble          h  a hidden pebble           L  a lantern on a chain
//   s  a sign            n  a safety net (in the bottom row)
import type { Rect } from "@/engine/platformer/physics";
import { MAX_COLS, MIN_COLS, PLAYER_H, ROWS, TILE } from "./constants";

export type FloorKind = "solid" | "fake" | "crumble" | "invisible" | "returnTrip" | "mimic" | "painted" | "flip";

/** The art style: each world has its own (6 is the final room). */
export type Look = 1 | 2 | 3 | 4 | 5 | 6;
export type Rain = "none" | "light" | "steady" | "heavy";

export interface Env {
  look: Look;
  /** Tiles with grout lines; a fake's grout doesn't line up (World 1's tell). */
  grout: boolean;
  /** Rain splashes on real floors; fakes stay dry (World 2's tell). */
  rain: Rain;
  /** Swinging lanterns light the room; real floors cast moving shadows on the back wall (World 3). */
  lantern: boolean;
  /** Dust falls from the ceiling and settles on floors, invisible ones too. */
  dust: boolean;
  /** How deep painted floors sit (1 would be the main layer; World 5's tell is the difference). */
  parallax: number;
  /** How dark it is away from the lanterns (0–1). */
  dark: number;
}

/** Solid for `solid` ticks out of every `period`, shifted by `offset`. */
export interface FlipPattern {
  period: number;
  solid: number;
  offset: number;
  /** A travelling wave: each column further right is shifted by this many more ticks. */
  wave?: number;
}

export interface RoomSource {
  id: string;
  name: string;
  map: readonly string[];
  /** Pebbles you start the room with. */
  pebbles: number;
  env?: Partial<Env>;
  /** Text for each "s" sign, left to right. */
  signs?: readonly string[];
  flips?: Readonly<Record<string, FlipPattern>>;
  /** Waypoints [col, row] for the solver on rooms that double back (the game ignores them). */
  route?: ReadonlyArray<readonly [number, number]>;
}

export interface FloorDef {
  kind: FloorKind;
  c: number;
  r: number;
  x: number;
  y: number;
  flip: FlipPattern | null;
}

export interface Pickup extends Rect {
  hidden: boolean;
}

export interface Lantern {
  /** Where the chain hangs from (the top of the room), and how long it is. */
  x: number;
  len: number;
  /** Its swing starts at a different point for each lantern. */
  phase: number;
}

export interface Sign {
  x: number;
  y: number;
  text: string;
}

export interface Room {
  id: string;
  name: string;
  world: number;
  cols: number;
  width: number;
  /** One per cell (row-major): -1 air, -2 rock, otherwise the index of a floor tile. */
  cells: Int16Array;
  floors: FloorDef[];
  spawn: { x: number; y: number };
  exit: Rect;
  pickups: Pickup[];
  key: Rect | null;
  lanterns: Lantern[];
  signs: Sign[];
  /** Columns with a safety net under them. */
  nets: boolean[];
  pebbles: number;
  env: Env;
  route: Array<{ x: number; y: number }>;
}

export const AIR = -1;
export const ROCK = -2;

const FLOOR_CHARS: Record<string, FloorKind> = {
  "=": "solid",
  f: "fake",
  c: "crumble",
  i: "invisible",
  r: "returnTrip",
  m: "mimic",
  p: "painted",
};

/** Each world's surroundings (Plan §3 "Tells by world"). */
export const WORLD_ENV: Record<number, Env> = {
  1: { look: 1, grout: true, rain: "none", lantern: false, dust: false, parallax: 0.9, dark: 0 },
  2: { look: 2, grout: false, rain: "steady", lantern: false, dust: false, parallax: 0.9, dark: 0 },
  3: { look: 3, grout: false, rain: "none", lantern: true, dust: true, parallax: 0.9, dark: 0.86 },
  4: { look: 4, grout: false, rain: "none", lantern: true, dust: false, parallax: 0.9, dark: 0.7 },
  5: { look: 5, grout: false, rain: "none", lantern: false, dust: false, parallax: 0.9, dark: 0.8 },
  6: { look: 6, grout: true, rain: "steady", lantern: true, dust: true, parallax: 0.9, dark: 0.55 },
};

export const worldOf = (id: string) => Number(id.split("-")[0]);

export function parseRoom(source: RoomSource): Room {
  const width = source.map[0]?.length ?? 0;
  if (source.map.length > ROWS) throw new Error(`Room ${source.id}: more than ${ROWS} rows`);
  if (width < MIN_COLS || width > MAX_COLS) throw new Error(`Room ${source.id}: ${width} columns (${MIN_COLS}–${MAX_COLS} allowed)`);
  if (source.map.some((row) => row.length !== width)) throw new Error(`Room ${source.id}: rows of different widths`);
  const map = [...Array.from({ length: ROWS - source.map.length }, () => ".".repeat(width)), ...source.map];

  const world = worldOf(source.id);
  const env: Env = { ...WORLD_ENV[world]!, ...source.env };
  const cells = new Int16Array(width * ROWS).fill(AIR);
  const floors: FloorDef[] = [];
  const pickups: Pickup[] = [];
  const lanterns: Lantern[] = [];
  const signCells: Array<[number, number]> = [];
  const nets = Array.from({ length: width }, () => false);
  let spawn: { x: number; y: number } | null = null;
  let exit: Rect | null = null;
  let key: Rect | null = null;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < width; c++) {
      const ch = map[r]![c]!;
      const at = r * width + c;
      const kind = FLOOR_CHARS[ch] ?? (ch >= "1" && ch <= "9" ? "flip" : null);
      if (ch === "#") cells[at] = ROCK;
      else if (kind) {
        const pattern = kind === "flip" ? (source.flips?.[ch] ?? null) : null;
        if (kind === "flip" && !pattern) throw new Error(`Room ${source.id}: no flip pattern for "${ch}"`);
        const flip = pattern ? { period: pattern.period, solid: pattern.solid, offset: pattern.offset + (pattern.wave ?? 0) * c } : null;
        cells[at] = floors.length;
        floors.push({ kind, c, r, x: c * TILE, y: r * TILE, flip });
      } else if (ch === "S") spawn = { x: c * TILE + 3, y: r * TILE + TILE - PLAYER_H };
      else if (ch === "D") exit = { x: c * TILE + 2, y: r * TILE - 8, w: TILE - 4, h: TILE + 8 };
      else if (ch === "k") key = { x: c * TILE + 3, y: r * TILE + 3, w: 10, h: 10 };
      else if (ch === "o" || ch === "h") pickups.push({ x: c * TILE + 4, y: r * TILE + 8, w: 8, h: 8, hidden: ch === "h" });
      else if (ch === "L") lanterns.push({ x: c * TILE + 8, len: r * TILE + 8, phase: lanterns.length * 1.7 });
      else if (ch === "s") signCells.push([c, r]);
      else if (ch === "n") nets[c] = true;
      else if (ch !== ".") throw new Error(`Room ${source.id}: unknown "${ch}" at ${c},${r}`);
    }
  }

  if (!spawn) throw new Error(`Room ${source.id}: no spawn (S)`);
  if (!exit) throw new Error(`Room ${source.id}: no door (D)`);
  if (env.lantern && lanterns.length === 0) throw new Error(`Room ${source.id}: a lantern room needs a lantern (L)`);
  signCells.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const texts = source.signs ?? [];
  if (texts.length !== signCells.length) throw new Error(`Room ${source.id}: ${signCells.length} signs, ${texts.length} texts`);

  return {
    id: source.id,
    name: source.name,
    world,
    cols: width,
    width: width * TILE,
    cells,
    floors,
    spawn,
    exit,
    pickups,
    key,
    lanterns,
    signs: signCells.map(([c, r], i) => ({ x: c * TILE + 8, y: r * TILE + TILE, text: texts[i]! })),
    nets,
    pebbles: source.pebbles,
    env,
    route: (source.route ?? []).map(([c, r]) => ({ x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 })),
  };
}

/** The cell at a column and row: off the sides is rock, above the top is rock, below the bottom is air. */
export function cellAt(room: Room, c: number, r: number): number {
  if (c < 0 || c >= room.cols || r < 0) return ROCK;
  if (r >= ROWS) return AIR;
  return room.cells[r * room.cols + c]!;
}

/** Floors that pretend (or hide): the ones with a tell. */
export const DECEPTIVE: ReadonlySet<FloorKind> = new Set(["fake", "mimic", "painted", "invisible", "returnTrip", "flip"]);

/** Floors that look like floor to you (everything but the invisible ones): aiming must never tell them apart. */
export const LOOKS_SOLID: ReadonlySet<FloorKind> = new Set(["solid", "fake", "crumble", "returnTrip", "mimic", "painted", "flip"]);
