// Almost There's colours: the Resurrect 64 palette (Plan/gameStack.md §10.4: "enough shades for 9
// zones and sunset gradients"). The colours get colder and brighter as you climb (Plan §9).
import type { ZoneId } from "../core/mountain";

export const R = {
  night: "#2e222f",
  plum: "#3e3546",
  dusk: "#625565",
  mauve: "#966c6c",
  sand: "#ab947a",
  heather: "#694f62",
  lilac: "#7f708a",
  fog: "#9babb2",
  mist: "#c7dcd0",
  white: "#ffffff",
  maroon: "#6e2727",
  brick: "#b33831",
  red: "#ea4f36",
  coral: "#f57d4a",
  crimson: "#ae2334",
  scarlet: "#e83b3b",
  orange: "#fb6b1d",
  amber: "#f79617",
  gold: "#f9c22b",
  wine: "#7a3045",
  rust: "#9e4539",
  clay: "#cd683d",
  tan: "#e6904e",
  peach: "#fbb954",
  bark: "#4c3e24",
  olive: "#676633",
  lime: "#a2a947",
  chartreuse: "#d5e04b",
  lemon: "#fbff86",
  forest: "#165a4c",
  green: "#239063",
  emerald: "#1ebc73",
  leaf: "#91db69",
  pear: "#cddf6c",
  charcoal: "#313638",
  slateGreen: "#374e4a",
  sage: "#547e64",
  moss: "#92a984",
  khaki: "#b2ba90",
  deepTeal: "#0b5e65",
  teal: "#0b8a8f",
  jade: "#0eaf9b",
  aqua: "#30e1b9",
  foam: "#8ff8e2",
  navy: "#323353",
  indigo: "#484a77",
  blue: "#4d65b4",
  sky: "#4d9be6",
  ice: "#8fd3ff",
  aubergine: "#45293f",
  purple: "#6b3e75",
  violet: "#905ea9",
  lavender: "#a884f3",
  pink: "#eaaded",
  raisin: "#753c54",
  berry: "#a24b6f",
  rose: "#cf657f",
  blush: "#ed8099",
  magenta: "#831c5d",
  cherry: "#c32454",
  hot: "#f04f78",
  salmon: "#f68181",
  apricot: "#fca790",
  cream: "#fdcbb0",
} as const;

/** Single letters for sprite rows ("." is transparent). */
export const SPRITE_PAL: Record<string, string> = {
  k: R.night,
  p: R.plum,
  d: R.dusk,
  l: R.lilac,
  f: R.fog,
  m: R.mist,
  w: R.white,
  r: R.red,
  b: R.brick,
  c: R.coral,
  o: R.orange,
  a: R.amber,
  y: R.gold,
  e: R.cream,
  t: R.tan,
  u: R.rust,
  n: R.bark,
  g: R.green,
  v: R.emerald,
  i: R.ice,
  s: R.sky,
  z: R.blue,
  h: R.hot,
  q: R.aqua,
  x: R.peach,
  j: R.purple,
};

export interface ZoneLook {
  /** Sky, top to bottom. */
  sky: [string, string, string];
  /** The far mountains (and the summit mirage). */
  far: string;
  near: string;
  /** Rock: face, shade, the bright top edge, and the deep inside. */
  rock: string;
  rockShade: string;
  rockTop: string;
  rockDeep: string;
  /** Dots and cracks on the rock. */
  speck: string;
  /** Inside the mountain: dark, and only the lamp lights it. */
  dark: boolean;
  /** Snow falling, leaves drifting… */
  weather: "none" | "leaves" | "embers" | "dust" | "snow" | "motes" | "petals";
}

export const ZONE_LOOK: Record<ZoneId, ZoneLook> = {
  foothills: {
    sky: [R.sky, R.ice, R.mist],
    far: R.moss,
    near: R.sage,
    rock: R.rust,
    rockShade: R.maroon,
    rockTop: R.emerald,
    rockDeep: R.bark,
    speck: R.clay,
    dark: false,
    weather: "leaves",
  },
  rooftops: {
    sky: [R.berry, R.coral, R.peach],
    far: R.raisin,
    near: R.wine,
    rock: R.heather,
    rockShade: R.plum,
    rockTop: R.red,
    rockDeep: R.aubergine,
    speck: R.mauve,
    dark: false,
    weather: "embers",
  },
  clocktower: {
    sky: [R.aubergine, R.raisin, R.rust],
    far: R.plum,
    near: R.heather,
    rock: R.bark,
    rockShade: R.night,
    rockTop: R.gold,
    rockDeep: R.night,
    speck: R.olive,
    dark: false,
    weather: "dust",
  },
  cliffs: {
    sky: [R.indigo, R.blue, R.fog],
    far: R.lilac,
    near: R.dusk,
    rock: R.dusk,
    rockShade: R.plum,
    rockTop: R.mist,
    rockDeep: R.navy,
    speck: R.lilac,
    dark: false,
    weather: "dust",
  },
  ice: {
    sky: [R.deepTeal, R.teal, R.foam],
    far: R.jade,
    near: R.teal,
    rock: R.indigo,
    rockShade: R.navy,
    rockTop: R.foam,
    rockDeep: R.navy,
    speck: R.blue,
    dark: false,
    weather: "snow",
  },
  "fake-summit": {
    sky: [R.sky, R.apricot, R.cream],
    far: R.pink,
    near: R.lavender,
    rock: R.lilac,
    rockShade: R.dusk,
    rockTop: R.white,
    rockDeep: R.plum,
    speck: R.fog,
    dark: false,
    weather: "snow",
  },
  inside: {
    sky: [R.night, R.night, R.night],
    far: R.night,
    near: R.night,
    rock: R.plum,
    rockShade: R.night,
    rockTop: R.lilac,
    rockDeep: R.night,
    speck: R.dusk,
    dark: true,
    weather: "motes",
  },
  sky: {
    sky: [R.violet, R.hot, R.peach],
    far: R.blush,
    near: R.rose,
    rock: R.raisin,
    rockShade: R.aubergine,
    rockTop: R.apricot,
    rockDeep: R.aubergine,
    speck: R.berry,
    dark: false,
    weather: "petals",
  },
  summit: {
    sky: [R.sky, R.ice, R.white],
    far: R.mist,
    near: R.fog,
    rock: R.fog,
    rockShade: R.lilac,
    rockTop: R.white,
    rockDeep: R.dusk,
    speck: R.mist,
    dark: false,
    weather: "snow",
  },
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

/** A stable little hash in [0, 1): the same tile always gets the same speckles. */
export function hash(a: number, b = 0, c = 0): number {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
