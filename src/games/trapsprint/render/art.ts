// TrapSprint's pixel art, as code (Plan/06-trapsprint.md §9): candy-coloured and friendly, so the
// traps are funnier. Sprites are rows of palette letters ("." is transparent), drawn once to small
// canvases by engine/sprites. Mostly the Sweetie 16 palette, plus a few earth and stone tones.
import { pixelSprite, type PixelRows } from "@/engine/sprites";

export const PAL = {
  k: "#1a1c2c",
  p: "#5d275d",
  r: "#b13e53",
  o: "#ef7d57",
  y: "#ffcd75",
  l: "#a7f070",
  g: "#38b764",
  t: "#257179",
  n: "#29366f",
  b: "#3b5dc9",
  s: "#41a6f6",
  c: "#73eff7",
  w: "#f4f4f4",
  "1": "#94b0c2",
  "2": "#566c86",
  "3": "#333c57",
  // Extras: the hero's red, a highlight, earth, stone.
  h: "#e43b5c",
  m: "#fff3c4",
  u: "#a0603e",
  v: "#6b3f2e",
  a: "#a58bd6",
  q: "#6d52a8",
  x: "#3d2a63",
} as const;

export type PalKey = keyof typeof PAL;

// ---------------------------------------------------------------------------------------------
// The runner: 12 × 14, facing right (drawn 1 px left of the 10 × 14 hitbox).
// ---------------------------------------------------------------------------------------------

const HEAD = [
  "...kkkkkk...",
  "..kmhhhhhk..",
  ".kmhhhhhhhk.",
  ".kwwwwwwwwk.",
  ".khhhhhhhhk.",
  ".khhhwwhwwk.",
  ".khhhwkhwkk.",
  ".khhhhhhhhk.",
  ".krhhhhhhrk.",
  ".krrhhhhrrk.",
  "..krrrrrrk..",
  "...kkkkkk...",
];

/** The bandana's tail flaps behind while running. */
const withTail = (rows: string[], up: boolean): string[] => {
  const out = [...rows];
  const r = up ? 2 : 3;
  out[r] = `w${out[r]!.slice(1)}`;
  out[r + 1] = `w${out[r + 1]!.slice(1)}`;
  return out;
};

export const RUNNER: Record<string, PixelRows> = {
  idle: [...HEAD, "...kk..kk...", "...kkk.kkk.."],
  blink: [...HEAD.slice(0, 5), ".khhhhhhhhk.", ".khhhkkhkkk.", ...HEAD.slice(7), "...kk..kk...", "...kkk.kkk.."],
  run0: [...withTail(HEAD, false), "..kk....kk..", ".kk......kk."],
  run1: [...withTail(HEAD, true), "....kk.kk...", "....kkkkk..."],
  run2: [...withTail(HEAD, false), "...kk..kk...", "...kk...kk.."],
  run3: [...withTail(HEAD, true), "....kkkk....", "....kkkk...."],
  jump: [...withTail(HEAD, true), "...kkkkkk...", "............"],
  fall: [...withTail(HEAD, false), "..k......k..", ".kk......kk."],
};

/** The little ghost that floats away when you die (never gory: Plan §9). */
export const SPIRIT: PixelRows = [
  "..wwww..",
  ".wwwwww.",
  "wwkwwkww",
  "wwkwwkww",
  "wwwwwwww",
  "wwwkkwww",
  "wwwwwwww",
  "w.ww.ww.",
];

export const SKULL: PixelRows = [
  ".wwwww.",
  "wwwwwww",
  "wkkwkkw",
  "wkkwkkw",
  "wwwkwww",
  ".wwwww.",
  ".w.w.w.",
];

// ---------------------------------------------------------------------------------------------
// Things in the levels.
// ---------------------------------------------------------------------------------------------

/** Coins: 8 × 10, four frames of a spin. */
export const COIN: PixelRows[] = [
  ["..kkkk..", ".kyyyyk.", "kymmyyyk", "kmyyyyok", "kmyyyyok", "kmyyyyok", "kyyyyyok", "kyyyyook", ".kyoook.", "..kkkk.."],
  ["...kk...", "..kmyk..", ".kmyyok.", ".kmyyok.", ".kmyyok.", ".kmyyok.", ".kmyyok.", ".kyyook.", "..kyok..", "...kk..."],
  ["...kk...", "...kk...", "...ky...", "...ky...", "...ky...", "...ky...", "...ky...", "...ky...", "...kk...", "...kk..."],
  ["...kk...", "..kyok..", ".koyymk.", ".koyymk.", ".koyymk.", ".koyymk.", ".koyymk.", ".kooyyk.", "..kyok..", "...kk..."],
];

/** Springs: 14 wide, resting and squashed. */
export const SPRING: PixelRows[] = [
  ["kkkkkkkkkkkkkk", "krhhhhhhhhhhrk", "kkkkkkkkkkkkkk", "..k1k1k1k1k1..", "..1k1k1k1k1k..", "..k1k1k1k1k1..", "kkkkkkkkkkkkkk", "k222222222222k"],
  ["..............", "..............", "..............", "kkkkkkkkkkkkkk", "krhhhhhhhhhhrk", "kkkkkkkkkkkkkk", "kkkkkkkkkkkkkk", "k222222222222k"],
];

/** The sideways spring: the same, on a base that leans (its tell). */
export const SIDE_SPRING: PixelRows[] = [
  ["kkkkkkkkkkkkkk", "krhhhhhhhhhhrk", "kkkkkkkkkkkkkk", "..k1k1k1k1k1..", "..1k1k1k1k1k..", "..k1k1k1k1k1kk", "kkkkkkkkkkkk22", "k222222222kk..", "k2222222kk...."],
  ["..............", "..............", "..............", "kkkkkkkkkkkkkk", "krhhhhhhhhhhrk", "kkkkkkkkkkkkkk", "kkkkkkkkkkkk22", "k222222222kk..", "k2222222kk...."],
];

/** A stalactite: 16 × 13, hanging from the ceiling. */
export const STALACTITE: PixelRows = [
  ".kkkkkkkkkkkkkk.",
  ".k2211111111x2k.",
  "..k221111112kk..",
  "..k22111111x2k..",
  "...k22111112k...",
  "...k2211112xk...",
  "....k221112k....",
  "....k221112k....",
  ".....k2112k.....",
  ".....k2112k.....",
  "......k22k......",
  "......k22k......",
  ".......kk.......",
];

/** Rendered once: a sprite in the shared palette (cached by key). */
export function sprite(rows: PixelRows, key: string, flip = false): HTMLCanvasElement {
  return pixelSprite(rows, PAL, { key: `ts:${key}`, flip });
}

/** A one-colour silhouette of a sprite (ghosts). */
export function silhouette(rows: PixelRows, colour: string, key: string, flip = false): HTMLCanvasElement {
  const palette = Object.fromEntries(Object.keys(PAL).map((k) => [k, colour]));
  return pixelSprite(rows, palette, { key: `ts:sil:${key}:${colour}`, flip });
}

// ---------------------------------------------------------------------------------------------
// Procedural sprites (round things are easier to compute than to type).
// ---------------------------------------------------------------------------------------------

const made = new Map<string, HTMLCanvasElement>();

function make(key: string, w: number, h: number, paint: (g: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const hit = made.get(key);
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  paint(canvas.getContext("2d")!);
  made.set(key, canvas);
  return canvas;
}

/** A spinning saw blade, 16 × 16. */
export function sawBlade(frame: number): HTMLCanvasElement {
  return make(`saw:${frame % 2}`, 16, 16, (g) => {
    const phase = (frame % 2) * (Math.PI / 12);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const dx = x - 7.5;
        const dy = y - 7.5;
        const r = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) + phase;
        let colour: string | null = null;
        if (r < 2) colour = PAL.k;
        else if (r < 2.8) colour = PAL["1"];
        else if (r < 5.6) colour = dx + dy < -2 ? PAL.w : PAL["1"];
        else if (r < 6.4) colour = PAL["2"];
        else if (r < 7.9 && Math.floor(((angle + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 6)) % 2 === 0) colour = PAL["3"];
        if (colour) {
          g.fillStyle = colour;
          g.fillRect(x, y, 1, 1);
        }
      }
    }
  });
}

/** The Follower's spike ball, 14 × 14. */
export function spikeBall(colour: "grey" | "red" = "grey"): HTMLCanvasElement {
  return make(`ball:${colour}`, 14, 14, (g) => {
    const body = colour === "red" ? [PAL.p, PAL.r, PAL.h] : [PAL["3"], PAL["2"], PAL["1"]];
    // Eight spikes, light enough to see against the castle's dark walls.
    g.fillStyle = colour === "red" ? PAL.m : PAL.w;
    for (const [x, y, w, h] of [
      [6, 0, 2, 3],
      [6, 11, 2, 3],
      [0, 6, 3, 2],
      [11, 6, 3, 2],
      [2, 2, 2, 2],
      [10, 2, 2, 2],
      [2, 10, 2, 2],
      [10, 10, 2, 2],
    ] as const) {
      g.fillRect(x, y, w, h);
    }
    for (let y = 0; y < 14; y++) {
      for (let x = 0; x < 14; x++) {
        const dx = x - 6.5;
        const dy = y - 6.5;
        const r = Math.sqrt(dx * dx + dy * dy);
        if (r >= 4.8) continue;
        g.fillStyle = r > 4 ? PAL.k : dx + dy < -2.5 ? body[2]! : dx + dy > 2.5 ? body[0]! : body[1]!;
        g.fillRect(x, y, 1, 1);
      }
    }
  });
}

/**
 * A checkpoint flag's cloth, 13 × 9. Real flags ripple (four frames); the painted one on the fake
 * checkpoint is perfectly flat (its tell). `gold`: a checkpoint you've reached.
 */
export function flagCloth(frame: number, { still = false, gold = false }: { still?: boolean; gold?: boolean } = {}): HTMLCanvasElement {
  const phase = still ? 0 : frame % 4;
  return make(`flag:${phase}:${still}:${gold}`, 13, 9, (g) => {
    const [fill, light, dark] = gold ? [PAL.y, PAL.m, PAL.o] : [PAL.g, PAL.l, PAL.t];
    for (let x = 0; x < 13; x++) {
      // The free end moves most.
      const off = still ? 0 : Math.round(Math.sin((x / 12) * Math.PI * 1.6 - (phase * Math.PI) / 2) * 1.6 * (x / 12));
      const top = 1 + off;
      const bottom = 7 + off;
      for (let y = top; y <= bottom; y++) {
        const edge = y === top || y === bottom || x === 12;
        g.fillStyle = edge ? PAL.k : y === top + 2 && x > 1 && x < 6 ? light : y >= bottom - 2 ? dark : fill;
        g.fillRect(x, y, 1, 1);
      }
    }
  });
}
