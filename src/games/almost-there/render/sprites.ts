// Almost There's pixel art, as code (Plan/08-almost-there.md §9): Pip with the huge backpack,
// Chirp the sparrow, twelve hats, the Lost Feathers, signs and flags. Rows of palette letters,
// drawn once to small canvases.
import { pixelSprite, type PixelRows } from "@/engine/sprites";
import { SPRITE_PAL } from "./palette";

// ---------------------------------------------------------------------------------------------
// Pip: 11 × 12, facing right. The hitbox is the 8 columns from 3 (the backpack sticks out behind).
// ---------------------------------------------------------------------------------------------

export const PIP_ART_X = 3;

const HEAD = [".nn....rr..", "nttn.krrrk.", "nttnkrrrrrk", "nttnkeeeeek", "nttnkeeekek", "nttnkeeeeek"];
const BLINK_HEAD = [".nn....rr..", "nttn.krrrk.", "nttnkrrrrrk", "nttnkeeeeek", "nttnkeeekkk", "nttnkeeeeek"];
const COAT = ["nttnkkrrrk.", "nttnkrrrbrk", "nyttkrrrbrk", ".nnnkbrrrk."];
const LEGS = ["....kdkkdk.", "....kk..kk."];

export const PIP: Record<string, PixelRows> = {
  idle: [...HEAD, ...COAT, ...LEGS],
  blink: [...BLINK_HEAD, ...COAT, ...LEGS],
  walk0: [...HEAD, ...COAT, "....kdk.kdk", "...kk....kk"],
  walk1: [...HEAD, ...COAT, ".....kddk..", ".....kkkk.."],
  // Charging: lower and lower.
  charge0: ["...........", ...HEAD, COAT[0]!, COAT[2]!, COAT[3]!, "....kdkkdk.", "...kk...kk."],
  charge1: ["...........", "...........", ...HEAD, COAT[2]!, COAT[3]!, "...kdk..kdk", "...kk....kk"],
  charge2: ["...........", "...........", "...........", ...HEAD.slice(0, 2), ...HEAD.slice(3), COAT[2]!, COAT[3]!, "..kdk...kdk", "..kk.....kk"],
  rise: [...HEAD, ...COAT, "....kdddk..", "....kk.kk.."],
  fall: [".nn..rr....", "nttnkrrrk..", "nttnkrrrrk.", "nttnkeeeeek", "nttnkekekek", "nttnkeekeek", "nttnkkrrrkk", "nttnkrrrbrk", "nyttkrrrbrk", ".nnnkbrrrk.", "...kdk..kdk", "...kk....kk"],
  // Faceplant: flat on the ground, the backpack on top.
  stun: ["...........", "...........", "...........", "...........", "...........", "...........", ".nnnnnn....", "nttttttn...", "nttyttttn..", "kkkkkkkrrrk", "kddkbrrrrek", "kkkkkkkkkkk"],
  // Planting a flag: an arm up.
  plant: [".nn....rr..", "nttn.krrrkk", "nttnkrrrrrk", "nttnkeeeeek", "nttnkeeekek", "nttnkeeeeek", "nttnkkrrrk.", "nttnkrrrbrk", "nyttkrrrbrk", ".nnnkbrrrk.", ...LEGS],
};

export type PipFrame = keyof typeof PIP;

/** Where the hat sits on each frame: the top of the head (row), and how far the head moved right. */
export const HEAD_TOP: Record<PipFrame, { y: number; x: number } | null> = {
  idle: { y: 1, x: 0 },
  blink: { y: 1, x: 0 },
  walk0: { y: 1, x: 0 },
  walk1: { y: 1, x: 0 },
  charge0: { y: 2, x: 0 },
  charge1: { y: 3, x: 0 },
  charge2: { y: 4, x: 0 },
  rise: { y: 1, x: 0 },
  fall: { y: 1, x: -1 },
  stun: null,
  plant: { y: 1, x: 0 },
};

// ---------------------------------------------------------------------------------------------
// Hats (one per Lost Feather): 9 wide, drawn so their bottom row sits on the top of the beanie.
// ---------------------------------------------------------------------------------------------

export interface Hat {
  name: string;
  rows: PixelRows;
}

export const HATS: readonly Hat[] = [
  { name: "Acorn Cap", rows: ["....n....", "..nnnnn..", ".nuuuuun.", "nutututun"] },
  { name: "Flat Cap", rows: ["..kkkkk..", ".kllllldk", "kllllllll"] },
  { name: "Bobble Hat", rows: ["....w....", "...www...", "..kzzzk..", ".kszszsk.", ".kwwwwwk."] },
  { name: "Top Hat", rows: ["..kkkkk..", "..kpppk..", "..kpppk..", "..krrrk..", "kkkkkkkkk"] },
  { name: "Propeller Cap", rows: ["..yyyyy..", "....k....", "..krrsk..", ".krrssyk.", "kkkkkkkkk"] },
  { name: "Aviator", rows: ["..nnnnn..", ".nuuuuun.", "nqqkuqqkn", "nqqkuqqkn"] },
  { name: "Earmuffs", rows: ["..kkkkk..", ".k.....k.", "hh.....hh", "hh.....hh"] },
  { name: "Ice Crown", rows: ["i.i.i.i.i", "iqiqiqiqi", "iiiiiiiii"] },
  { name: "Miner's Helmet", rows: ["...www...", "..kyyyk..", ".kyyyyyk.", "kkkkkkkkk"] },
  { name: "Party Hat", rows: ["....h....", "....y....", "...hyh...", "..yhyhy..", ".hyhyhyh."] },
  { name: "Halo", rows: ["..yyyyy..", ".y.....y.", "..yyyyy..", "........."] },
  { name: "Golden Plume", rows: [".....yy..", "....yay..", "...yay...", "..yay....", "kkkkkkk.."] },
];

// ---------------------------------------------------------------------------------------------
// Chirp: 8 × 7. Sincere: side on, looking at Pip. Trolling: straight at the camera, at you.
// ---------------------------------------------------------------------------------------------

export const CHIRP: Record<string, PixelRows> = {
  side0: ["...kkk..", "..knnwk.", ".knnnkka", "kunnnnk.", "kuuettk.", ".kkttk..", "...k.k.."],
  side1: ["...kkk..", "..knnwk.", "kknnnkka", "kuunnnk.", ".kuettk.", "..kttk..", "...k.k.."],
  front0: ["..kkkk..", ".knnnnk.", "knwkkwnk", "knnaannk", "kunttnuk", ".kettek.", "..k..k.."],
  front1: ["..kkkk..", ".knnnnk.", "knwkkwnk", "knnaannk", "kuuttuuk", ".kettek.", "..k..k.."],
};

// ---------------------------------------------------------------------------------------------
// Things on the mountain.
// ---------------------------------------------------------------------------------------------

/** A Lost Feather, 6 × 6. */
export const FEATHER: PixelRows = ["....yw", "...yaw", "..yay.", ".yay..", "yay...", "k....."];

/** A sign on a post, 9 × 10: the board, then the post. */
export const SIGN: PixelRows = ["kkkkkkkkk", "ktttttttk", "ktnnntntk", "ktttttttk", "kkkkkkkkk", "....n....", "....n....", "....n....", "...nnn...", "........."];
/** Warning signs never lie: red and white, with a "!". */
export const WARNING: PixelRows = ["kkkkkkkkk", "kwrwkwrwk", "krwrkrwrk", "kwrwwwrwk", "kkkkkkkkk", "....n....", "....n....", "....n....", "...nnn...", "........."];

/** A flag on a pole, 9 × 24 (the real flags); the cloth is drawn separately so it can wave. */
export const FLAG_CLOTH: PixelRows = ["hhhhhhh", "hhwhhhh", "hwwwhhh", "hhwhhh.", "hhhhh.."];
/** The joke checkpoint's flag: smaller than a real one (the tell). */
export const JOKE_CLOTH: PixelRows = ["sssss", "swwss", "sssss", "sss.."];

/** Footprints worn into the rock, 6 × 2. */
export const FOOTPRINTS: PixelRows = ["kk..kk", ".k...k"];

/** Rendered once, in Almost There's palette (cached by key). */
export function sprite(rows: PixelRows, key: string, flip = false): HTMLCanvasElement {
  return pixelSprite(rows, SPRITE_PAL, { key: `at:${key}`, flip });
}

/** The same shape in one colour (silhouettes on the title, the ghost). */
export function silhouette(rows: PixelRows, colour: string, key: string, flip = false): HTMLCanvasElement {
  const palette = Object.fromEntries(Object.keys(SPRITE_PAL).map((k) => [k, colour]));
  return pixelSprite(rows, palette, { key: `at:sil:${colour}:${key}`, flip });
}
