// Last Pixel's sprites (Plan/10-last-pixel.md §9), as pixel art in code: the tools you hold, the pointer you
// hunt with (and that Pix copies when it pretends to be a second cursor), and Pix's face, which only shows
// up close (through the magnifier, and in the tab's icon).
import type { PixelPalette, PixelRows } from "@/engine/sprites";
import type { ToolId } from "../core/level";

export const PAL: PixelPalette = {
  k: "#3B3355",
  w: "#FFFFFF",
  c: "#FFF4D6",
  v: "#6F5BF2",
  l: "#B7ABFF",
  y: "#FFD23F",
  o: "#E8A13A",
  b: "#B5835A",
  d: "#8C6240",
  g: "#9AA5B1",
  s: "#DDE3EA",
  p: "#F6A9C6",
  r: "#E63946",
  t: "#4FA59C",
  a: "#7FD4F5",
};

/** Hot spot: the cell of the sprite that's under your pointer. */
export interface ToolSprite {
  rows: PixelRows;
  hot: [number, number];
}

export const TOOL_SPRITES: Record<Exclude<ToolId, "mower" | "shovel">, ToolSprite> = {
  roller: {
    rows: [
      ".kkkkkkkkkkkk.",
      "kvvvvvvvvvvvvk",
      "kvlvlvlvlvlvvk",
      "kvvvvvvvvvvvvk",
      ".kkkkkkkkkkkk.",
      "......kk......",
      "......kk......",
      "......kk......",
      ".....kddk.....",
      ".....kbbk.....",
      ".....kbbk.....",
      ".....kddk.....",
      "......kk......",
    ],
    hot: [7, 2],
  },
  brush: {
    rows: [
      "...kk...",
      "..kvvk..",
      "..kvvk..",
      ".ksssk..",
      ".kgggk..",
      "..kbk...",
      "..kbk...",
      "..kbk...",
      "..kdk...",
      "..kbk...",
      "...k....",
    ],
    hot: [3, 1],
  },
  sponge: {
    rows: [
      ".kkkkkkkkkk.",
      "kyyyyyyyyyyk",
      "kyoyyyyoyyyk",
      "kyyyyoyyyyok",
      "kyyoyyyyoyyk",
      "kttttttttttk",
      "kttttttttttk",
      ".kkkkkkkkkk.",
    ],
    hot: [6, 4],
  },
  scratch: {
    rows: [
      "..kkkkk..",
      ".kyyyyyk.",
      "kyyoooyyk",
      "kyoyyyoyk",
      "kyoyyyoyk",
      "kyyoooyyk",
      ".kyyyyyk.",
      "..kkkkk..",
    ],
    hot: [4, 4],
  },
  washer: {
    rows: [
      "kk..........",
      "kakkkkkkk...",
      "kasssssssk..",
      ".kkkkkkkkgk.",
      "........kgk.",
      "........kgkk",
      ".......krrrk",
      ".......krrrk",
      "........kkk.",
    ],
    hot: [0, 1],
  },
  eraser: {
    rows: [
      ".kkkkkkk.",
      "kpppppppk",
      "kpppppppk",
      "kpppppppk",
      "kvvvvvvvk",
      "kvlvvvvvk",
      "kvvvvvvvk",
      ".kkkkkkk.",
    ],
    hot: [4, 2],
  },
};

/** The hunting pointer: a classic arrow (and Pix's disguise). Tip at (0, 0). */
export const ARROW: ToolSprite = {
  rows: [
    "k.........",
    "kk........",
    "kwk.......",
    "kwwk......",
    "kwwwk.....",
    "kwwwwk....",
    "kwwwwwk...",
    "kwwwwwwk..",
    "kwwwwwwwk.",
    "kwwwwkkkkk",
    "kwwkwk....",
    "kwk.kwk...",
    "kk..kwk...",
    "k....kwk..",
    ".....kk...",
  ],
  hot: [0, 0],
};

/** The net (Shift-drag, or the net tool). */
export const NET: ToolSprite = {
  rows: [
    "..kkkk....",
    ".kswswk...",
    "kswswswk..",
    "kwswswsk..",
    "kswswswk..",
    ".kwswsk...",
    "..kkkkd...",
    "......bd..",
    ".......bd.",
    "........bd",
  ],
  hot: [3, 3],
};

/** Pix up close: a tiny 3 × 3 face, two eyes (the plan's own words). */
export const PIX_FACE: PixelRows = ["ccc", "kck", "ccc"];

/** Pix's face for the tab's icon: drawn big, on a transparent background. */
export function pixFavicon(size = 32, glow = "#FFF4D6"): string {
  if (typeof document === "undefined") return "";
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d")!;
  const u = size / 8;
  g.fillStyle = "#3B3355";
  g.fillRect(u, u, u * 6, u * 6);
  g.fillStyle = glow;
  g.fillRect(u * 1.5, u * 1.5, u * 5, u * 5);
  g.fillStyle = "#3B3355";
  g.fillRect(u * 2.6, u * 3, u, u * 1.4);
  g.fillRect(u * 4.4, u * 3, u, u * 1.4);
  return c.toDataURL("image/png");
}
