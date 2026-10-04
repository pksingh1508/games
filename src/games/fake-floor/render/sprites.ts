// Fake Floor's pixel art, as code (Plan/05-fake-floor.md §9): a little floor inspector in a hard
// hat, pebbles, keys and lanterns. Rows of palette letters, drawn once to small canvases.
import { pixelSprite, type PixelRows } from "@/engine/sprites";
import { SPRITE_PAL } from "./palette";

// ---------------------------------------------------------------------------------------------
// The inspector: 12 × 14, facing right, drawn 1 px left of the 10 × 14 hitbox.
// ---------------------------------------------------------------------------------------------

const HAT = ["....kkkk....", "...kayyak...", "..kaaaaaak..", ".kkkkkkkkkk."];
const BODY = ["..knddddnk..", "..kndwwwnk..", "..knnwwknk..", "..knnwwwnk..", "..knnnnnnk..", "..kdnnnnnk..", "..kdnnnnnk..", "...knnnnk..."];
const BLINK = ["..knddddnk..", "..knnnnnnk..", "..knnkkknk..", "..knnnnnnk..", ...BODY.slice(4)];
/** Looking far ahead: the pupil hard against the edge. */
const PEER = ["..knddddnk..", "..kndwwwnk..", "..knnwwwkk..", "..knnwwwnk..", ...BODY.slice(4)];
/** Throwing: an arm out front. */
const THROW = [...BODY.slice(0, 4), "..knnnnnnkkk", "..kdnnnnnkak", ...BODY.slice(6)];

export const INSPECTOR: Record<string, PixelRows> = {
  idle: [...HAT, ...BODY, "...kk..kk...", "...kk..kk..."],
  blink: [...HAT, ...BLINK, "...kk..kk...", "...kk..kk..."],
  peer: [...HAT, ...PEER, "...kk..kk...", "...kk..kk..."],
  throw: [...HAT, ...THROW, "...kk..kk...", "...kk..kk..."],
  run0: [...HAT, ...BODY, "..kk...kk...", ".kk.....kk.."],
  run1: [...HAT, ...BODY, "...kk.kk....", "...kkkkk...."],
  run2: [...HAT, ...BODY, "...kk..kk...", "..kk....kk.."],
  run3: [...HAT, ...BODY, "....kkkk....", "....kkkk...."],
  jump: [...HAT, ...BODY, "..kkkkkkk...", "............"],
  fall: [...HAT, ...PEER, "..k.....k...", ".kk.....kk.."],
};

export type InspectorFrame = keyof typeof INSPECTOR;

// ---------------------------------------------------------------------------------------------
// Things in the rooms.
// ---------------------------------------------------------------------------------------------

export const PEBBLE: PixelRows = [".kk.", "kgmk", "ksgk", ".kk."];

/** A little pile of pebbles to pick up: 8 × 6. */
export const PEBBLE_PILE: PixelRows = ["..kk....", ".kgmk...", "kgsgkkk.", "kssgkgmk", ".kkkksgk", "....kkk."];

export const KEY: PixelRows = [".kkk.......", "kayak......", "kaakkkkkkk.", "kaaaaaaaaak", "kaakkkakak.", "kaak..k.k..", ".kk........"];

export const LANTERN: PixelRows = ["...kkk...", "..kgggk..", ".kkkkkkk.", ".kayyyak.", ".kyywyyk.", ".kyyyyyk.", ".kayyyak.", ".kkkkkkk.", "..kgggk..", "...kkk..."];

/** A chandelier (the Hall of Mirrors' lantern): 15 × 9. */
export const CHANDELIER: PixelRows = [
  ".......k.......",
  "......kgk......",
  "..kkkkkgkkkkk..",
  ".kmwmkkgkkmwmk.",
  "kmwwwmkgkmwwwmk",
  ".kmwmk.k.kmwmk.",
  "..kmk..k..kmk..",
  "...k..kmk..k...",
  ".......k.......",
];

/** Rendered once, in Fake Floor's palette (cached by key). */
export function sprite(rows: PixelRows, key: string, flip = false): HTMLCanvasElement {
  return pixelSprite(rows, SPRITE_PAL, { key: `ff:${key}`, flip });
}

/** The same shape in one colour (the ghost in time trials, silhouettes on the title). */
export function silhouette(rows: PixelRows, colour: string, key: string, flip = false): HTMLCanvasElement {
  const palette = Object.fromEntries(Object.keys(SPRITE_PAL).map((k) => [k, colour]));
  return pixelSprite(rows, palette, { key: `ff:sil:${colour}:${key}`, flip });
}
