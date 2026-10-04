// A room (Plan/15-gravity-is-lying.md §5, §12): one screen. Tile rooms are written as rows of
// characters; orbit rooms (World 5) are open space with round planetoids. Everything that lies is
// declared here, next to what tells the truth.
//
//   .  air       #  wall        ^  spikes (they point away from the wall they sit on)
//   S  Newt's start             O  the portal (the way out)        a  a golden apple
//   L  a gravity lever (its direction is in `levers`, in reading order)
//   d  a drip (water falls the real way down)   l  a hanging lamp     s  a sign (text in `signs`)
//   I  where Isaac sits
//   Tilted Town's scenery (drawn upright for the camera's "up", whatever gravity says; you walk
//   in front of it): h  a house front   w  a window   D  a door   r  a roof   T  a tree   b  a bench
import type { Rect } from "@/engine/platformer/physics";
import { TILE } from "./constants";
import type { Dir } from "./gravity";

export type WorldId = 1 | 2 | 3 | 4 | 5 | 6;

export interface IsaacLine {
  text: string;
  /** He's lying: his leaf droops. */
  lie: boolean;
  /** What he says in Truth Mode instead (when this line is a lie). */
  truth?: string;
  /** When: at the start (default), when Newt reaches an area [col, row, w, h], or at a tick. */
  at?: "start" | [number, number, number, number] | number;
}

export interface ZoneSource {
  /** Tiles: [col, row, width, height]. */
  area: [number, number, number, number];
  /** The truth. */
  dir: Dir;
  /** What its painted arrows say (a lie when different). */
  painted?: Dir;
}

export interface RotateSource {
  /** Ticks between turns. */
  every: number;
  /** Which way it turns: a quarter clockwise, a quarter back, or a half turn. */
  turn: "cw" | "ccw" | "half";
  /** Ticks into the cycle at the start (the first turn comes `every - offset` ticks in). */
  offset?: number;
}

export interface PlanetSource {
  /** Centre and radius, in pixels. */
  x: number;
  y: number;
  r: number;
  /** How far its pull reaches, from the centre (px). */
  field?: number;
  /** Painted on the sky: no pull, nothing to stand on. */
  fake?: boolean;
}

export interface AsteroidSource {
  x: number;
  y: number;
  r: number;
  /** Circling a point: centre, radius and the ticks for one lap (negative: the other way). */
  orbit?: { x: number; y: number; period: number; phase?: number };
}

export interface RoomSource {
  id: string;
  name: string;
  /** Tile rooms: the rows. Orbit rooms: none. */
  map?: readonly string[];
  /** The room's gravity at the start. */
  gravity: Dir;
  /** For each "L", in reading order: the way it sets the room's gravity. */
  levers?: readonly Dir[];
  zones?: readonly ZoneSource[];
  /** Newt can flip the room's gravity (from World 2). */
  flip?: boolean;
  rotate?: RotateSource;
  /**
   * The HUD arrow lies: it shows this direction instead of the truth. "camera" shows the camera's
   * down; "mirror" swaps left and right (it still moves when gravity does, so it's believable).
   */
  arrowLie?: Dir | "camera" | "mirror";
  /**
   * The camera (Tilted Town): the room's direction shown as "up" on screen, and a small tilt
   * (degrees). With `intro`, the room starts level and turns at that tick (the safe room that shows
   * you the camera can lie).
   */
  view?: { up: Dir; tilt?: number; intro?: number };
  planets?: readonly PlanetSource[];
  asteroids?: readonly AsteroidSource[];
  /** Orbit rooms: where things are (px). */
  spawn?: { x: number; y: number };
  portal?: { x: number; y: number };
  apples?: ReadonlyArray<{ x: number; y: number }>;
  /** Isaac's perch in an orbit room (px). */
  perch?: { x: number; y: number };
  isaac?: readonly IsaacLine[];
  signs?: readonly string[];
  /** A safety net: a death puts Newt back where it last stood (introducing a liar). */
  net?: boolean;
  /** The final world: the drips, dust and lamps fall this way (only the scarf stays honest). */
  anchorsLie?: Dir;
  /** The solver's waypoints (tile centres) before the apples and the portal. */
  route?: ReadonlyArray<[number, number]>;
}

export const AIR = 0;
export const WALL = 1;
export const SPIKES = 2;

export interface Lever extends Rect {
  dir: Dir;
}

export interface Zone extends Rect {
  dir: Dir;
  painted: Dir;
}

export interface Anchor {
  kind: "drip" | "lamp";
  /** Where it hangs from (px). */
  x: number;
  y: number;
}

export interface Decor {
  kind: "facade" | "window" | "door" | "roof" | "tree" | "bench";
  x: number;
  y: number;
}

export interface Planet {
  x: number;
  y: number;
  r: number;
  field: number;
  fake: boolean;
}

export interface Room {
  id: string;
  name: string;
  world: WorldId;
  index: number;
  kind: "tiles" | "orbit";
  cols: number;
  rows: number;
  /** In pixels. */
  w: number;
  h: number;
  cells: Uint8Array;
  gravity: Dir;
  spawn: { x: number; y: number };
  portal: Rect;
  apples: Rect[];
  levers: Lever[];
  zones: Zone[];
  flip: boolean;
  rotate: RotateSource | null;
  arrowLie: Dir | "camera" | "mirror" | null;
  view: { up: Dir; tilt: number; intro: number | null };
  planets: Planet[];
  asteroids: AsteroidSource[];
  anchors: Anchor[];
  decor: Decor[];
  signs: Array<{ x: number; y: number; text: string }>;
  isaac: { x: number; y: number; lines: IsaacLine[] } | null;
  net: boolean;
  anchorsLie: Dir | null;
  route: Array<{ x: number; y: number }>;
}

const SPAN = TILE;

export function buildRoom(src: RoomSource, world: WorldId, index: number): Room {
  const orbit = !src.map;
  const map = src.map ?? [];
  const rows = orbit ? 17 : map.length;
  const cols = orbit ? 30 : (map[0]?.length ?? 0);
  if (!orbit) {
    if (map.some((r) => r.length !== cols)) throw new Error(`${src.id}: rows of different widths (${map.map((r) => r.length).join(",")})`);
    if (!((cols === 30 && rows === 17) || (cols === 17 && rows === 17))) throw new Error(`${src.id}: a room is 30 × 17 or 17 × 17 tiles, not ${cols} × ${rows}`);
  }
  const cells = new Uint8Array(cols * rows);
  const room: Room = {
    id: src.id,
    name: src.name,
    world,
    index,
    kind: orbit ? "orbit" : "tiles",
    cols,
    rows,
    w: cols * TILE,
    h: rows * TILE,
    cells,
    gravity: src.gravity,
    spawn: { x: 0, y: 0 },
    portal: { x: 0, y: 0, w: 0, h: 0 },
    apples: [],
    levers: [],
    zones: (src.zones ?? []).map((z) => ({ x: z.area[0] * SPAN, y: z.area[1] * SPAN, w: z.area[2] * SPAN, h: z.area[3] * SPAN, dir: z.dir, painted: z.painted ?? z.dir })),
    flip: Boolean(src.flip),
    rotate: src.rotate ?? null,
    arrowLie: src.arrowLie ?? null,
    view: { up: src.view?.up ?? "up", tilt: src.view?.tilt ?? 0, intro: src.view?.intro ?? null },
    planets: (src.planets ?? []).map((p) => ({ x: p.x, y: p.y, r: p.r, field: p.field ?? p.r * 2.4, fake: Boolean(p.fake) })),
    asteroids: [...(src.asteroids ?? [])],
    anchors: [],
    decor: [],
    signs: [],
    isaac: null,
    net: Boolean(src.net),
    anchorsLie: src.anchorsLie ?? null,
    route: (src.route ?? []).map(([c, r]) => ({ x: c * SPAN + SPAN / 2, y: r * SPAN + SPAN / 2 })),
  };

  const leverDirs = [...(src.levers ?? [])];
  const signTexts = [...(src.signs ?? [])];
  let spawn = false;
  let portal = false;
  let perch: { x: number; y: number } | null = null;
  for (let r = 0; r < rows && !orbit; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = map[r]![c]!;
      const x = c * TILE;
      const y = r * TILE;
      const at = r * cols + c;
      switch (ch) {
        case ".":
          break;
        case "#":
          cells[at] = WALL;
          break;
        case "^":
          cells[at] = SPIKES;
          break;
        case "S":
          if (spawn) throw new Error(`${src.id}: two starts`);
          spawn = true;
          room.spawn = { x: x + 2, y: y + 2 };
          break;
        case "O":
          if (portal) throw new Error(`${src.id}: two portals`);
          portal = true;
          room.portal = { x, y, w: TILE, h: TILE };
          break;
        case "a":
          room.apples.push({ x: x + 3, y: y + 3, w: 10, h: 10 });
          break;
        case "L": {
          const dir = leverDirs.shift();
          if (!dir) throw new Error(`${src.id}: a lever at ${c},${r} without a direction`);
          room.levers.push({ x: x + 2, y: y + 2, w: 12, h: 12, dir });
          break;
        }
        case "d":
          room.anchors.push({ kind: "drip", x: x + TILE / 2, y: y + TILE / 2 });
          break;
        case "l":
          room.anchors.push({ kind: "lamp", x: x + TILE / 2, y: y + TILE / 2 });
          break;
        case "s": {
          const text = signTexts.shift();
          if (text === undefined) throw new Error(`${src.id}: a sign at ${c},${r} without words`);
          room.signs.push({ x: x + TILE / 2, y: y + TILE / 2, text });
          break;
        }
        case "I":
          perch = { x: x + TILE / 2, y: y + TILE / 2 };
          break;
        case "h":
          room.decor.push({ kind: "facade", x: x + TILE / 2, y: y + TILE / 2 });
          break;
        case "r":
          room.decor.push({ kind: "roof", x: x + TILE / 2, y: y + TILE / 2 });
          break;
        case "w":
          room.decor.push({ kind: "window", x: x + TILE / 2, y: y + TILE / 2 });
          break;
        case "D":
          room.decor.push({ kind: "door", x: x + TILE / 2, y: y + TILE / 2 });
          break;
        case "T":
          room.decor.push({ kind: "tree", x: x + TILE / 2, y: y + TILE / 2 });
          break;
        case "b":
          room.decor.push({ kind: "bench", x: x + TILE / 2, y: y + TILE / 2 });
          break;
        default:
          throw new Error(`${src.id}: unknown "${ch}" at ${c},${r}`);
      }
    }
  }
  if (leverDirs.length) throw new Error(`${src.id}: ${leverDirs.length} lever directions without levers`);
  if (signTexts.length) throw new Error(`${src.id}: ${signTexts.length} sign texts without signs`);

  if (orbit) {
    if (!src.spawn || !src.portal) throw new Error(`${src.id}: an orbit room needs a spawn and a portal`);
    room.spawn = { x: src.spawn.x, y: src.spawn.y };
    room.portal = { x: src.portal.x - 8, y: src.portal.y - 8, w: 16, h: 16 };
    room.apples = (src.apples ?? []).map((a) => ({ x: a.x - 5, y: a.y - 5, w: 10, h: 10 }));
    perch = src.perch ?? null;
    spawn = portal = true;
  }
  if (!spawn) throw new Error(`${src.id}: no start (S)`);
  if (!portal) throw new Error(`${src.id}: no portal (O)`);
  if (room.apples.length !== 3) throw new Error(`${src.id}: ${room.apples.length} golden apples (every room has 3)`);
  if (src.isaac?.length) {
    room.isaac = { x: perch?.x ?? room.w - 24, y: perch?.y ?? 24, lines: [...src.isaac] };
  }
  return room;
}

export const cellAt = (room: Room, col: number, row: number): number => {
  if (col < 0 || row < 0 || col >= room.cols || row >= room.rows) return AIR;
  return room.cells[row * room.cols + col]!;
};

/** The zone a point is in (the last listed wins), or null. */
export function zoneAt(room: Room, x: number, y: number): Zone | null {
  let hit: Zone | null = null;
  for (const z of room.zones) if (x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h) hit = z;
  return hit;
}
