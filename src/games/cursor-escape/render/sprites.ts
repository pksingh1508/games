// The cursors (Plan/12-cursor-escape.md §3, §9): DeskOS 98's pointer in every shape, as pixel art in
// code. Each has a hotspot (the pixel that's "the cursor"): the arrow's tip, the I-beam's middle, the
// hand's fingertip. Black outlines and white fills, so they show on any background.
import type { Mode } from "../core/level";

export interface CursorSprite {
  rows: readonly string[];
  /** The hotspot, in sprite pixels. */
  hx: number;
  hy: number;
}

export const CURSOR_PALETTE = { k: "#000000", w: "#FFFFFF", g: "#B8B8B8", y: "#FFE14D", b: "#0A2A8A", r: "#D62839" } as const;

const ARROW: CursorSprite = {
  hx: 0,
  hy: 0,
  rows: [
    "k...........",
    "kk..........",
    "kwk.........",
    "kwwk........",
    "kwwwk.......",
    "kwwwwk......",
    "kwwwwwk.....",
    "kwwwwwwk....",
    "kwwwwwwwk...",
    "kwwwwwwwwk..",
    "kwwwwwwwwwk.",
    "kwwwwwwkkkkk",
    "kwwwkwwk....",
    "kwwk.kwwk...",
    "kwk..kwwk...",
    "kk....kwwk..",
    "k.....kwwk..",
    ".......kwwk.",
    ".......kwwk.",
    "........kk..",
  ],
};

const IBEAM: CursorSprite = {
  hx: 4,
  hy: 8,
  rows: [
    "kkkk.kkkk",
    "kwwwkwwwk",
    "kkkkwkkkk",
    "...kwk...",
    "...kwk...",
    "...kwk...",
    "...kwk...",
    "...kwk...",
    "...kwk...",
    "...kwk...",
    "...kwk...",
    "...kwk...",
    "...kwk...",
    "kkkkwkkkk",
    "kwwwkwwwk",
    "kkkk.kkkk",
  ],
};

const RESIZE_H: CursorSprite = {
  hx: 10,
  hy: 4,
  rows: [
    "....k...........k....",
    "...kk...........kk...",
    "..kwkkkkkkkkkkkkkwk..",
    ".kwwwwwwwwwwwwwwwwwk.",
    "kwwwwwwwwwwwwwwwwwwwk",
    ".kwwwwwwwwwwwwwwwwwk.",
    "..kwkkkkkkkkkkkkkwk..",
    "...kk...........kk...",
    "....k...........k....",
  ],
};

const RESIZE_V: CursorSprite = {
  hx: 4,
  hy: 10,
  rows: [
    "....k....",
    "...kwk...",
    "..kwwwk..",
    ".kwwwwwk.",
    "kkkkwkkkk",
    "...kwk...",
    "...kwk...",
    "...kwk...",
    "...kwk...",
    "...kwk...",
    "...kwk...",
    "...kwk...",
    "...kwk...",
    "...kwk...",
    "...kwk...",
    "...kwk...",
    "kkkkwkkkk",
    ".kwwwwwk.",
    "..kwwwk..",
    "...kwk...",
    "....k....",
  ],
};

const HAND: CursorSprite = {
  hx: 5,
  hy: 0,
  rows: [
    ".....kk.......",
    "....kwwk......",
    "....kwwk......",
    "....kwwk......",
    "....kwwkkk....",
    "....kwwkwwkkk.",
    "....kwwkwwkwwk",
    "kkk.kwwkwwkwwk",
    "kwwkkwwwwwwwwk",
    "kwwwkwwwwwwwwk",
    ".kwwwwwwwwwwwk",
    "..kwwwwwwwwwwk",
    "..kwwwwwwwwwk.",
    "...kwwwwwwwwk.",
    "....kwwwwwwk..",
    "....kwwwwwwk..",
    "....kkkkkkkk..",
  ],
};

const GRAB: CursorSprite = {
  hx: 7,
  hy: 6,
  rows: [
    "....kkkkkk....",
    "...kwwkwwkkk..",
    "..kkwwkwwkwwk.",
    ".kwkwwwwwkwwk.",
    ".kwwwwwwwwwwk.",
    "kwwwwwwwwwwwk.",
    "kwwwwwwwwwwwk.",
    ".kwwwwwwwwwk..",
    ".kwwwwwwwwwk..",
    "..kwwwwwwwk...",
    "...kwwwwwwk...",
    "...kkkkkkkk...",
  ],
};

const BUSY: CursorSprite = {
  hx: 5,
  hy: 8,
  rows: [
    "kkkkkkkkkkk",
    "kwwwwwwwwwk",
    "kkkkkkkkkkk",
    ".kwyyyyywk.",
    ".kwwyyywwk.",
    "..kwwywwk..",
    "...kwywk...",
    "....kyk....",
    "...kwywk...",
    "..kwwywwk..",
    ".kwwwywwwk.",
    ".kwwyyywwk.",
    ".kwyyyyywk.",
    "kkkkkkkkkkk",
    "kwwwwwwwwwk",
    "kkkkkkkkkkk",
  ],
};

const CROSSHAIR: CursorSprite = {
  hx: 7,
  hy: 7,
  rows: [
    "......kkk......",
    "......kwk......",
    "......kwk......",
    "......kwk......",
    "......kwk......",
    "......kkk......",
    "kkkkkk...kkkkkk",
    "kwwwwk.w.kwwwwk",
    "kkkkkk...kkkkkk",
    "......kkk......",
    "......kwk......",
    "......kwk......",
    "......kwk......",
    "......kwk......",
    "......kkk......",
  ],
};

const FORBIDDEN: CursorSprite = {
  hx: 8,
  hy: 8,
  rows: [
    ".....kkkkkkk.....",
    "...kkrrrrrrrkk...",
    "..krrrkkkkkrrrk..",
    ".krrkk.....krrrk.",
    ".krk.......krrrk.",
    "krrk......krrrkrk",
    "krk......krrrk.rk",
    "krk.....krrrk..rk",
    "krk....krrrk...rk",
    "krk...krrrk....rk",
    "krk..krrrk.....rk",
    "krkkkrrrk.....krk",
    ".krrrrrk.....krk.",
    ".krrrk.....kkrrk.",
    "..krrrkkkkkrrrk..",
    "...kkrrrrrrrkk...",
    ".....kkkkkkk.....",
  ],
};

export const CURSORS: Record<Mode, CursorSprite> = {
  arrow: ARROW,
  ibeam: IBEAM,
  resizeH: RESIZE_H,
  resizeV: RESIZE_V,
  hand: HAND,
  busy: BUSY,
  crosshair: CROSSHAIR,
  forbidden: FORBIDDEN,
  grab: GRAB,
};

/** The arrow, broken (where you crashed). */
export const BROKEN: CursorSprite = {
  hx: 0,
  hy: 0,
  rows: [
    "k...........",
    "kk..........",
    "kwk.........",
    "kwwk........",
    "kwwwk.......",
    "kwwwwk......",
    "kwk.kwk.....",
    "kk..........",
    "....kwk.....",
    "...kwwwk..k.",
    "..kwwwwwkkwk",
    "kwwwwwwkkkkk",
    "kwwwkwwk....",
    "kwwk.kwwk...",
    "kwk..kwwk...",
    "kk....kwwk..",
  ],
};
