// Floor tiles, the stars of the game (Plan/05-fake-floor.md §9: "floors get extra care"). Every
// floor tile in a world looks the same, real or not; only its tell gives it away. In grout rooms a
// tile's grout follows the world's grid, and a fake's is shifted, so the lines jog at its edges.
// High-contrast tells (an assist option) make the lines thicker and the jog bigger.
import { TILE } from "../core/constants";
import type { Look } from "../core/room";
import { E } from "./palette";

export type GroutVariant = "aligned" | "offset";

interface TileLook {
  face: string;
  top: string;
  topLight: string;
  bottom: string;
  grout: string;
  /** Extra texture on the face. */
  detail?: (g: CanvasRenderingContext2D) => void;
}

const px = (g: CanvasRenderingContext2D, colour: string, x: number, y: number, w = 1, h = 1) => {
  g.fillStyle = colour;
  g.fillRect(x, y, w, h);
};

const LOOKS: Record<Look, TileLook> = {
  1: { face: E.tan, top: E.cream, topLight: E.white, bottom: E.umber, grout: E.brown },
  2: {
    face: E.slate,
    top: E.steel,
    topLight: E.mist,
    bottom: E.dusk,
    grout: E.dusk,
    detail: (g) => {
      // Wet concrete: a puddle on top, streaks down the face.
      px(g, E.navyBlue, 4, 1, 6, 1);
      px(g, E.blue, 5, 1, 3, 1);
      for (const x of [3, 9, 13]) px(g, "#4f5d7e", x, 5, 1, 7);
    },
  },
  3: {
    face: E.brown,
    top: E.tan,
    topLight: E.cream,
    bottom: E.umber,
    grout: E.umber,
    detail: (g) => {
      // Plank grain and nails.
      px(g, "#a8644a", 2, 6, 5, 1);
      px(g, "#a8644a", 10, 10, 4, 1);
      px(g, E.mist, 1, 3, 1, 1);
      px(g, E.mist, 9, 3, 1, 1);
      px(g, E.mist, 1, 12, 1, 1);
      px(g, E.mist, 9, 12, 1, 1);
    },
  },
  4: {
    face: E.mist,
    top: E.white,
    topLight: E.white,
    bottom: E.slate,
    grout: E.steel,
    detail: (g) => {
      // A reflection streak.
      for (let i = 0; i < 5; i++) px(g, E.white, 3 + i, 12 - i * 2, 1, 2);
    },
  },
  5: {
    face: E.clay,
    top: E.amber,
    topLight: E.yellow,
    bottom: E.umber,
    grout: E.rust,
    detail: (g) => {
      // Brush strokes.
      px(g, E.amber, 2, 5, 4, 1);
      px(g, E.amber, 3, 6, 3, 1);
      px(g, E.rust, 9, 9, 4, 1);
      px(g, E.rust, 10, 10, 3, 1);
      px(g, "#e58a52", 5, 12, 5, 1);
    },
  },
  6: { face: E.orchid, top: E.pink, topLight: E.skin, bottom: E.plum, grout: E.plum },
};

const cache = new Map<string, HTMLCanvasElement>();

/**
 * One floor tile. The grid is 8 px squares (running bond in the lower half); "offset" shifts it by
 * 3 px across and 2 px down (4 and 3 with high contrast), so it never lines up with real tiles.
 */
export function floorTile(look: Look, variant: GroutVariant, highContrast: boolean): HTMLCanvasElement {
  const id = `${look}:${variant}:${highContrast ? 1 : 0}`;
  const hit = cache.get(id);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = TILE;
  c.height = TILE;
  const g = c.getContext("2d")!;
  const t = LOOKS[look];
  px(g, t.face, 0, 0, TILE, TILE);
  t.detail?.(g);

  const shiftX = variant === "offset" ? (highContrast ? 4 : 3) : 0;
  const shiftY = variant === "offset" ? (highContrast ? 3 : 2) : 0;
  const thick = highContrast ? 2 : 1;
  const mid = 8 + shiftY;
  // The horizontal line runs right across a real floor; on a fake it jogs.
  px(g, t.grout, 0, mid, TILE, thick);
  for (let x = 0; x < TILE + 8; x += 8) {
    const top = (x + shiftX) % TILE;
    const bottom = (x + 4 + shiftX) % TILE;
    px(g, t.grout, top, 2, thick, mid - 2);
    px(g, t.grout, bottom, mid + thick, thick, TILE - 1 - mid - thick);
  }
  px(g, t.top, 0, 0, TILE, 2);
  px(g, t.topLight, 0, 0, TILE, 1);
  px(g, t.bottom, 0, TILE - 1, TILE, 1);
  cache.set(id, c);
  return c;
}

/** Hairline cracks across a crumbling floor (it's honest about being fragile). */
export function drawCracks(g: CanvasRenderingContext2D, x: number, y: number, seed: number, colour: string = E.ink) {
  g.fillStyle = colour;
  const zig = seed % 2 ? 1 : -1;
  for (let i = 0; i < 7; i++) g.fillRect(x + 3 + i, y + 3 + Math.floor(i * 0.9) + (i % 2) * zig, 1, 1);
  for (let i = 0; i < 5; i++) g.fillRect(x + 12 - Math.floor(i * 0.6), y + 6 + i, 1, 1);
  g.fillRect(x + 7, y + 10, 3, 1);
}

/** The faint crack a return-trip floor gets once you've crossed it. */
export function drawReturnCrack(g: CanvasRenderingContext2D, x: number, y: number, colour: string) {
  g.fillStyle = colour;
  const path: Array<[number, number]> = [
    [7, 0],
    [7, 1],
    [8, 2],
    [8, 3],
    [7, 4],
    [6, 5],
    [6, 6],
    [7, 7],
    [8, 8],
    [9, 9],
    [9, 10],
    [8, 11],
  ];
  for (const [dx, dy] of path) g.fillRect(x + dx, y + dy, 1, 1);
}

/** Bridge ends get an outline, real or fake alike. */
export function drawEnds(g: CanvasRenderingContext2D, x: number, y: number, left: boolean, right: boolean) {
  g.fillStyle = E.ink;
  if (left) g.fillRect(x - 1, y, 1, TILE);
  if (right) g.fillRect(x + TILE, y, 1, TILE);
  g.fillRect(x, y - 1, TILE, 1);
  g.fillRect(x, y + TILE, TILE, 1);
}
