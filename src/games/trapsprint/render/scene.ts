// The parts of a level that never move, painted once per level onto two layers: the background
// (sky, hills, factory, castle hall) and the tiles in front of it, with the traps' quiet tells
// baked in: holes for pop spikes, slots for the jump punisher, rails for the squeeze, the clock.
import { COLS, HEIGHT, ROWS, TILE, WIDTH } from "../core/constants";
import type { Cell, Level, TrapDef } from "../core/level";
import { PAL } from "./art";

export type ZoneLook = 1 | 2 | 3;

export interface Theme {
  sky: [string, string];
  /** Ground: fill, darker, lighter, outline. */
  fill: string;
  dark: string;
  light: string;
  line: string;
  /** Top surface (grass, plate edge, capstone) and its highlight. */
  top: string;
  topLight: string;
  /** One-way ledges: top, body, underside. */
  ledge: [string, string, string];
}

export const THEMES: Record<ZoneLook, Theme> = {
  1: {
    sky: ["#6cc6ff", "#d4f1ff"],
    fill: PAL.u,
    dark: PAL.v,
    light: "#c47a4e",
    line: PAL.k,
    top: PAL.g,
    topLight: PAL.l,
    ledge: ["#e3b07a", PAL.u, PAL.v],
  },
  2: {
    sky: ["#2a2131", "#523a3a"],
    fill: PAL["2"],
    dark: PAL["3"],
    light: PAL["1"],
    line: PAL.k,
    top: PAL["1"],
    topLight: PAL.w,
    ledge: [PAL.o, PAL["3"], PAL.k],
  },
  3: {
    sky: ["#170f2b", "#33235a"],
    fill: PAL.q,
    dark: PAL.x,
    light: PAL.a,
    line: PAL.k,
    top: PAL.a,
    topLight: "#d6c6f2",
    ledge: [PAL.a, PAL.q, PAL.x],
  },
};

/** A stable little hash: the same level always gets the same speckles and clouds. */
export function hash(a: number, b = 0, c = 0): number {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const canvas = (w = WIDTH, h = HEIGHT) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
};

const px = (g: CanvasRenderingContext2D, colour: string, x: number, y: number, w = 1, h = 1) => {
  g.fillStyle = colour;
  g.fillRect(x, y, w, h);
};

/** Solid for drawing outlines: ground and belts. Off the map, the edge tile carries on. */
function solidish(level: Level, c: number, r: number): boolean {
  if (r < 0) return false;
  const cc = Math.max(0, Math.min(COLS - 1, c));
  const rr = Math.min(ROWS - 1, r);
  const cell = level.grid[rr]![cc]!;
  if (cc !== c || rr !== r) return cell === "ground";
  return cell === "ground" || cell.startsWith("conveyor");
}

// ---------------------------------------------------------------------------------------------
// Backgrounds
// ---------------------------------------------------------------------------------------------

/** A vertical gradient in a few hard bands (pixel-art skies don't blend). */
function bands(g: CanvasRenderingContext2D, [top, bottom]: [string, string], count = 9) {
  const a = Number.parseInt(top.slice(1), 16);
  const b = Number.parseInt(bottom.slice(1), 16);
  const h = Math.ceil(HEIGHT / count);
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const mix = (shift: number) => Math.round(((a >> shift) & 255) * (1 - t) + ((b >> shift) & 255) * t);
    g.fillStyle = `rgb(${mix(16)},${mix(8)},${mix(0)})`;
    g.fillRect(0, i * h, WIDTH, h);
  }
}

function hills(g: CanvasRenderingContext2D, colour: string, base: number, amp: number, period: number, phase: number) {
  g.fillStyle = colour;
  for (let x = 0; x < WIDTH; x += 2) {
    const y = Math.round(base - amp * (0.6 * Math.sin((x + phase) / period) + 0.4 * Math.sin((x + phase * 2) / (period * 0.47))));
    g.fillRect(x, y, 2, HEIGHT - y);
  }
}

function disc(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, colour: string) {
  g.fillStyle = colour;
  for (let y = -r; y <= r; y++) {
    const half = Math.floor(Math.sqrt(r * r - y * y));
    g.fillRect(cx - half, cy + y, half * 2 + 1, 1);
  }
}

/** A puffy pixel cloud (also drawn moving, by the renderer). */
export function cloud(g: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const s = size;
  disc(g, x + 2, y + 3, Math.round(6 * s), "#bfe3f5");
  disc(g, x + Math.round(12 * s), y + 2, Math.round(8 * s), "#bfe3f5");
  disc(g, x + Math.round(24 * s), y + 3, Math.round(6 * s), "#bfe3f5");
  disc(g, x, y, Math.round(6 * s), "#ffffff");
  disc(g, x + Math.round(12 * s), y - 2, Math.round(8 * s), "#ffffff");
  disc(g, x + Math.round(23 * s), y + 1, Math.round(6 * s), "#ffffff");
}

function paintBackground(g: CanvasRenderingContext2D, level: Level, zone: ZoneLook) {
  const theme = THEMES[zone];
  bands(g, theme.sky);
  const seed = level.id.split("").reduce((n, ch) => n * 31 + ch.charCodeAt(0), 7);

  if (zone === 1) {
    disc(g, 404, 46, 19, "#ffe9a8");
    disc(g, 404, 46, 15, "#fff7dc");
    hills(g, "#9adba4", 196, 22, 46, seed % 200);
    hills(g, "#64c27f", 222, 16, 30, (seed * 7) % 300);
  } else if (zone === 2) {
    // Girders, a big pipe, windows glowing orange.
    for (let x = 24 + (seed % 40); x < WIDTH; x += 120) {
      px(g, "#3a2e3c", x, 0, 10, HEIGHT);
      for (let y = 0; y < HEIGHT; y += 24) {
        for (let i = 0; i < 24; i += 2) px(g, "#3a2e3c", x + 10 + Math.floor(i * 1.5), y + i, 2, 2);
      }
    }
    px(g, "#4b3a45", 0, 54, WIDTH, 14);
    px(g, "#5f4a55", 0, 55, WIDTH, 3);
    for (let x = (seed * 13) % 80; x < WIDTH; x += 80) px(g, "#3d2f39", x, 51, 6, 20);
    for (let i = 0; i < 12; i++) {
      const x = 16 + i * 40 + ((seed >> 2) % 10);
      px(g, "#2b2230", x, 96, 20, 14);
      px(g, i % 3 === 0 ? "#8a5a3a" : "#5c4036", x + 2, 98, 16, 10);
    }
    // Big gears.
    for (const [cx, cy, r] of [
      [70 + (seed % 60), 170, 34],
      [360 + (seed % 50), 150, 26],
    ] as const) {
      disc(g, cx, cy, r, "#3b2f3d");
      for (let a = 0; a < 12; a++) {
        const ang = (a / 12) * Math.PI * 2;
        disc(g, Math.round(cx + Math.cos(ang) * (r + 3)), Math.round(cy + Math.sin(ang) * (r + 3)), 4, "#3b2f3d");
      }
      disc(g, cx, cy, Math.round(r * 0.45), "#2c2230");
    }
  } else {
    // A castle hall: faint bricks, tall windows onto the night, banners.
    g.fillStyle = "#291d47";
    for (let y = 0; y < HEIGHT; y += 12) {
      g.fillRect(0, y, WIDTH, 1);
      for (let x = (y / 12) % 2 ? 12 : 0; x < WIDTH; x += 24) g.fillRect(x, y, 1, 12);
    }
    const windows = [72, 240, 408];
    windows.forEach((wx, i) => {
      px(g, "#3d2a63", wx - 20, 40, 40, 110);
      disc(g, wx, 52, 20, "#3d2a63");
      px(g, "#1d2756", wx - 16, 52, 32, 94);
      disc(g, wx, 52, 16, "#1d2756");
      for (let s = 0; s < 6; s++) px(g, "#c9d4ff", wx - 14 + Math.floor(hash(seed, i, s) * 28), 40 + Math.floor(hash(i, s, seed) * 90), 1, 1);
      if (i === 1) {
        disc(g, wx + 4, 66, 7, "#f4f0d8");
        disc(g, wx + 7, 64, 6, "#1d2756");
      }
      px(g, "#3d2a63", wx - 1, 40, 2, 106);
      px(g, "#4d3a78", wx - 22, 146, 44, 5);
    });
    for (const bx of [156, 324]) {
      px(g, "#7c2a3f", bx - 10, 30, 20, 64);
      for (let y = 0; y < 6; y++) px(g, "#7c2a3f", bx - 10 + y, 94 + y, 20 - y * 2, 1);
      px(g, "#ffcd75", bx - 3, 50, 6, 6);
      px(g, "#b13e53", bx - 2, 51, 4, 4);
      px(g, "#5d275d", bx - 12, 28, 24, 3);
    }
  }
}

// ---------------------------------------------------------------------------------------------
// Tiles
// ---------------------------------------------------------------------------------------------

function groundTile(g: CanvasRenderingContext2D, level: Level, zone: ZoneLook, c: number, r: number) {
  const t = THEMES[zone];
  const x = c * TILE;
  const y = r * TILE;
  const open = {
    up: !solidish(level, c, r - 1),
    down: !solidish(level, c, r + 1),
    left: !solidish(level, c - 1, r),
    right: !solidish(level, c + 1, r),
  };
  px(g, t.fill, x, y, TILE, TILE);

  if (zone === 1) {
    for (let i = 0; i < 5; i++) {
      const sx = Math.floor(hash(c, r, i) * 14) + 1;
      const sy = Math.floor(hash(r, c, i + 9) * 14) + 1;
      px(g, i < 3 ? t.dark : t.light, x + sx, y + sy, i === 0 ? 2 : 1, 1);
    }
    if (open.up) {
      px(g, t.top, x, y, TILE, 5);
      px(g, t.topLight, x, y, TILE, 1);
      px(g, t.dark, x, y + 5, TILE, 1);
      for (let i = 0; i < 3; i++) px(g, t.top, x + Math.floor(hash(c, r, i + 20) * 15), y + 5, 1, 2 + (i % 2));
      for (let i = 0; i < 2; i++) px(g, t.topLight, x + 2 + Math.floor(hash(c, i, r) * 12), y - 1, 1, 1);
    }
  } else if (zone === 2) {
    px(g, t.light, x + 1, y + 1, TILE - 2, 1);
    px(g, t.light, x + 1, y + 1, 1, TILE - 2);
    px(g, t.dark, x + 1, y + TILE - 2, TILE - 2, 1);
    px(g, t.dark, x + TILE - 2, y + 1, 1, TILE - 2);
    for (const [rx, ry] of [
      [3, 3],
      [12, 3],
      [3, 12],
      [12, 12],
    ] as const) {
      px(g, t.dark, x + rx, y + ry, 2, 2);
      px(g, t.light, x + rx, y + ry, 1, 1);
    }
    if (open.up) {
      px(g, t.topLight, x, y, TILE, 1);
      px(g, t.top, x, y + 1, TILE, 2);
      // Hazard stripes along exposed edges.
      for (let i = 0; i < TILE; i += 4) px(g, (c * 4 + i) % 8 < 4 ? PAL.y : PAL.k, x + i, y + 3, 4, 2);
    }
  } else {
    // Stone bricks, half a brick offset every row.
    const offset = r % 2 ? 4 : 0;
    for (const by of [0, 8]) {
      px(g, t.dark, x, y + by + 7, TILE, 1);
      const shift = by ? (offset + 4) % 8 : offset;
      for (let bx = shift; bx < TILE; bx += 8) px(g, t.dark, x + bx, y + by, 1, 7);
      px(g, t.light, x, y + by, TILE, 1);
    }
    if (hash(c, r) < 0.2) px(g, "#5a4390", x + 4, y + 3, 5, 3);
    if (open.up) {
      px(g, t.top, x, y, TILE, 3);
      px(g, t.topLight, x, y, TILE, 1);
      px(g, t.dark, x, y + 3, TILE, 1);
    }
  }

  if (open.up) px(g, t.line, x, y - 1, TILE, 1);
  if (open.down) px(g, t.line, x, y + TILE - 1, TILE, 1);
  if (open.left) px(g, t.line, x, y, 1, TILE);
  if (open.right) px(g, t.line, x + TILE - 1, y, 1, TILE);
}

function ledgeTile(g: CanvasRenderingContext2D, zone: ZoneLook, c: number, r: number) {
  const [top, body, under] = THEMES[zone].ledge;
  const x = c * TILE;
  const y = r * TILE;
  px(g, PAL.k, x, y - 1, TILE, 1);
  px(g, top, x, y, TILE, 2);
  px(g, body, x, y + 2, TILE, 3);
  px(g, under, x, y + 5, TILE, 1);
  px(g, PAL.k, x, y + 6, TILE, 1);
  if (zone === 1) px(g, under, x + 7, y + 1, 1, 4);
  if (zone === 2) for (let i = 1; i < TILE; i += 3) px(g, PAL.k, x + i, y + 3, 1, 1);
  if (zone === 3) px(g, under, x + (c % 2 ? 3 : 11), y + 2, 1, 3);
}

/** Spikes, cached per direction and style: "real" ones shine, painted ones are flat. */
const spikeCache = new Map<string, HTMLCanvasElement>();
export function spikeTile(dir: "up" | "down" | "left" | "right", painted = false): HTMLCanvasElement {
  const id = `${dir}:${painted}`;
  const hit = spikeCache.get(id);
  if (hit) return hit;
  const tile = canvas(TILE, TILE);
  const g = tile.getContext("2d")!;
  const outline = painted ? PAL["3"] : PAL.k;
  const lit = painted ? "#8494a6" : PAL.w;
  const mid = painted ? "#8494a6" : PAL["1"];
  const shade = painted ? "#8494a6" : PAL["2"];
  g.translate(8, 8);
  g.rotate({ up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 }[dir]);
  g.translate(-8, -8);
  // Two chunky spikes per tile, 8 px tall (the hitbox is a little smaller: Plan §10.7).
  for (const cx of [4, 12]) {
    for (let i = 0; i < 8; i++) {
      const hw = Math.floor(i / 2);
      const y = 8 + i;
      for (let dx = -hw; dx <= hw; dx++) {
        const edge = dx === -hw || dx === hw || i === 0 || i === 7;
        g.fillStyle = edge ? outline : dx < 0 ? lit : dx === 0 ? mid : shade;
        g.fillRect(cx + dx, y, 1, 1);
      }
    }
  }
  spikeCache.set(id, tile);
  return tile;
}

const SPIKE_DIR: Partial<Record<Cell, "up" | "down" | "left" | "right">> = { spikeUp: "up", spikeDown: "down", spikeLeft: "left", spikeRight: "right" };

/** Small marks on the tiles near a trap: every trap has a tell (Plan §3). */
function tells(g: CanvasRenderingContext2D, level: Level, zone: ZoneLook, def: TrapDef) {
  const [c0, r0, c1, r1] = def.cells;
  const t = THEMES[zone];
  switch (def.kind) {
    case "popSpikes":
    case "returnTrap": {
      // Tiny holes in the floor below.
      const fy = (r1 + 1) * TILE;
      for (let c = c0; c <= c1; c++) {
        for (const hx of [3, 7, 11]) px(g, PAL.k, c * TILE + hx, fy + 1, 2, 1);
      }
      if (def.kind === "returnTrap") {
        // A little clock engraved in the floor.
        const cx = Math.floor(((c0 + c1 + 1) * TILE) / 2);
        const cy = fy + 9;
        g.fillStyle = t.light;
        for (const [dx, dy] of [
          [-1, -3],
          [0, -3],
          [1, -3],
          [-3, -1],
          [-3, 0],
          [-3, 1],
          [3, -1],
          [3, 0],
          [3, 1],
          [-1, 3],
          [0, 3],
          [1, 3],
          [-2, -2],
          [2, -2],
          [-2, 2],
          [2, 2],
        ] as const) {
          g.fillRect(cx + dx, cy + dy, 1, 1);
        }
        px(g, t.light, cx, cy - 2, 1, 2);
        px(g, t.light, cx, cy, 2, 1);
      }
      break;
    }
    case "jumpPunisher": {
      // Odd ceiling tiles: little slots where spikes wait.
      const cy = r0 * TILE - 1;
      for (let c = c0; c <= c1; c++) for (const hx of [2, 6, 10, 13]) px(g, PAL.k, c * TILE + hx, cy - 1, 1, 2);
      break;
    }
    case "wallSqueeze": {
      // Rails along the floor.
      const fy = (r1 + 1) * TILE;
      px(g, PAL["1"], c0 * TILE, fy - 3, (c1 - c0 + 1) * TILE, 1);
      px(g, PAL.k, c0 * TILE, fy - 2, (c1 - c0 + 1) * TILE, 1);
      for (let x = c0 * TILE; x < (c1 + 1) * TILE; x += 6) px(g, PAL["2"], x, fy - 1, 2, 1);
      break;
    }
    case "saw": {
      // A dark slot in the wall the saw comes out of.
      const { x, y } = def.rect;
      px(g, t.fill, x, y, TILE, TILE);
      px(g, "#0d0e17", x, y + 1, TILE, TILE - 2);
      px(g, t.line, x, y, TILE, 1);
      px(g, t.line, x, y + TILE - 1, TILE, 1);
      px(g, "#2a2c3d", x, y + 2, TILE, 1);
      break;
    }
    case "risingFloor": {
      // Pistons under the floor.
      for (const cx of [c0 * TILE + 6, c1 * TILE + 6]) {
        px(g, PAL["3"], cx, (r1 + 1) * TILE, 4, HEIGHT - (r1 + 1) * TILE);
        px(g, PAL["1"], cx + 1, (r1 + 1) * TILE, 1, HEIGHT - (r1 + 1) * TILE);
      }
      break;
    }
    case "stalactite":
    case "crusher": {
      // Cracks in the ceiling above.
      const cy = r0 * TILE - 2;
      if (r0 > 0 && level.grid[r0 - 1]?.[c0] === "ground") {
        px(g, PAL.k, c0 * TILE + 5, cy - 3, 1, 3);
        px(g, PAL.k, c0 * TILE + 6, cy - 4, 1, 2);
        px(g, PAL.k, c1 * TILE + 10, cy - 2, 1, 2);
      }
      break;
    }
  }
}

export interface Scene {
  zone: ZoneLook;
  background: HTMLCanvasElement;
  tiles: HTMLCanvasElement;
}

const scenes = new WeakMap<Level, Scene>();

export function buildScene(level: Level): Scene {
  const hit = scenes.get(level);
  if (hit) return hit;
  const zone = level.zone as ZoneLook;
  const background = canvas();
  paintBackground(background.getContext("2d")!, level, zone);

  const tiles = canvas();
  const g = tiles.getContext("2d")!;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = level.grid[r]![c]!;
      if (cell === "ground") groundTile(g, level, zone, c, r);
      else if (cell === "ledge") ledgeTile(g, zone, c, r);
    }
  }
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const dir = SPIKE_DIR[level.grid[r]![c]!];
      if (dir) g.drawImage(spikeTile(dir), c * TILE, r * TILE);
    }
  }
  for (const def of level.traps) tells(g, level, zone, def);

  const scene = { zone, background, tiles };
  scenes.set(level, scene);
  return scene;
}

/** Paint a stretch of ground in a zone's style (for traps that are floor: drop floors, rising floors). */
export function paintGround(g: CanvasRenderingContext2D, zone: ZoneLook, x: number, y: number, w: number, h: number) {
  const t = THEMES[zone];
  px(g, t.fill, x, y, w, h);
  if (zone === 1) {
    px(g, t.top, x, y, w, 5);
    px(g, t.topLight, x, y, w, 1);
    px(g, t.dark, x, y + 5, w, 1);
  } else if (zone === 2) {
    px(g, t.topLight, x, y, w, 1);
    px(g, t.top, x, y + 1, w, 2);
    for (let i = 0; i < w; i += 4) px(g, i % 8 < 4 ? PAL.y : PAL.k, x + i, y + 3, Math.min(4, w - i), 2);
  } else {
    px(g, t.top, x, y, w, 3);
    px(g, t.topLight, x, y, w, 1);
    for (let by = y + 4; by < y + h; by += 8) px(g, t.dark, x, by + 3, w, 1);
  }
  px(g, t.line, x, y - 1, w, 1);
  px(g, t.line, x, y + h - 1, w, 1);
  px(g, t.line, x, y, 1, h);
  px(g, t.line, x + w - 1, y, 1, h);
}
