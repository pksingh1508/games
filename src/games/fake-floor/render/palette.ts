// Fake Floor's colours: the Endesga 32 palette (Plan/gameStack.md §10.4: "a wide range for five very
// different worlds"). Sprites are rows of these letters; "." is transparent.

export const E = {
  rust: "#be4a2f",
  clay: "#d77643",
  cream: "#ead4aa",
  tan: "#e4a672",
  brown: "#b86f50",
  umber: "#733e39",
  cocoa: "#3e2731",
  wine: "#a22633",
  red: "#e43b44",
  orange: "#f77622",
  amber: "#feae34",
  yellow: "#fee761",
  green: "#63c74d",
  moss: "#3e8948",
  pine: "#265c42",
  teal: "#193c3e",
  navyBlue: "#124e89",
  blue: "#0099db",
  cyan: "#2ce8f5",
  white: "#ffffff",
  mist: "#c0cbdc",
  steel: "#8b9bb4",
  slate: "#5a6988",
  dusk: "#3a4466",
  night: "#262b44",
  ink: "#181425",
  hot: "#ff0044",
  plum: "#68386c",
  orchid: "#b55088",
  pink: "#f6757a",
  skin: "#e8b796",
  tanSkin: "#c28569",
} as const;

/** Single letters for sprite rows. */
export const SPRITE_PAL: Record<string, string> = {
  k: E.ink,
  n: E.night,
  d: E.dusk,
  s: E.slate,
  g: E.steel,
  m: E.mist,
  w: E.white,
  a: E.amber,
  y: E.yellow,
  o: E.orange,
  b: E.brown,
  u: E.umber,
  c: E.cocoa,
  t: E.tan,
  e: E.cream,
  r: E.red,
  l: E.blue,
  q: E.cyan,
  p: E.pink,
  v: E.green,
};

/** Hex to "r,g,b" (for rgba() strings). */
export function rgb(hex: string): string {
  const n = Number.parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

/** Blend two hex colours (t = 0 gives a, 1 gives b). */
export function mix(a: string, b: string, t: number): string {
  const x = Number.parseInt(a.slice(1), 16);
  const y = Number.parseInt(b.slice(1), 16);
  const ch = (shift: number) => Math.round(((x >> shift) & 255) * (1 - t) + ((y >> shift) & 255) * t);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0")}`;
}

/** A stable little hash in [0, 1): the same room always gets the same speckles and stars. */
export function hash(a: number, b = 0, c = 0): number {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
