// The mountain's rock, drawn once per screen into a canvas (Plan/08-almost-there.md §9: "ledges
// have clear, bright top edges so players can judge jumps"). Things that change (crumbling ledges,
// clouds, gears, the elevator) are drawn every frame on top, in draw.ts.
import { COLS, ROWS, TILE, VIEW_H, VIEW_W } from "../core/constants";
import { T, tileAt, type Mountain, type Screen, type ZoneId } from "../core/mountain";
import { hash, mix, R, ZONE_LOOK, type ZoneLook } from "./palette";

/** Drawn with the rock (they never change), or never (gears and the elevator are drawn separately). */
const STATIC = new Set<number>([T.ROCK, T.ICE, T.SNOW, T.MUSHROOM, T.PLANK, T.SEAL, T.SUMMIT, T.HOLLOW]);

const isRockish = (code: number, collapsed: boolean) =>
  code === T.ROCK || code === T.ICE || code === T.SNOW || code === T.MUSHROOM || ((code === T.SEAL || code === T.SUMMIT || code === T.HOLLOW) && !collapsed);

/** Does this tile read as solid rock from outside (for edges)? Crumbles and clouds don't. */
function solidLook(m: Mountain, tx: number, ty: number, collapsed: boolean) {
  return isRockish(tileAt(m, tx, ty), collapsed);
}

/** How deep inside the rock a tile is (0: touches air; up to 3). */
function depth(m: Mountain, tx: number, ty: number, collapsed: boolean): number {
  for (let d = 1; d <= 3; d++) {
    for (let dy = -d; dy <= d; dy++) {
      for (let dx = -d; dx <= d; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== d) continue;
        if (!solidLook(m, tx + dx, ty + dy, collapsed)) return d - 1;
      }
    }
  }
  return 3;
}

const cache = new Map<string, HTMLCanvasElement>();

function screenHasCollapse(m: Mountain, screen: Screen) {
  const tx0 = screen.col * COLS;
  const ty0 = (screen.y / TILE) | 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const code = tileAt(m, tx0 + c, ty0 + r);
      if (code === T.SEAL || code === T.SUMMIT || code === T.HOLLOW) return true;
    }
  }
  return false;
}

/** The screen's static tiles (cached; screens that change at the collapse have two versions). */
export function screenTiles(m: Mountain, screen: Screen, collapsed: boolean): HTMLCanvasElement {
  const changes = screenHasCollapse(m, screen);
  const key = `${m.mirrored ? "m" : "n"}:${screen.id}:${changes && collapsed ? 1 : 0}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  canvas.width = VIEW_W;
  canvas.height = VIEW_H;
  const g = canvas.getContext("2d")!;
  const look = ZONE_LOOK[screen.zone];
  const tx0 = screen.col * COLS;
  const ty0 = (screen.y / TILE) | 0;
  if (screen.zone === "fake-summit") drawRecess(g, m, tx0, ty0, look, collapsed);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tx = tx0 + c;
      const ty = ty0 + r;
      const code = tileAt(m, tx, ty);
      if (!STATIC.has(code)) continue;
      if ((code === T.SEAL || code === T.SUMMIT) && collapsed) continue;
      if (code === T.HOLLOW && collapsed) {
        drawHollow(g, c * TILE, r * TILE, tx, ty);
        continue;
      }
      drawTile(g, m, code, c * TILE, r * TILE, tx, ty, look, screen.zone, collapsed);
    }
  }
  cache.set(key, canvas);
  return canvas;
}

/**
 * The summit is the top of a mountain, not a floating rock: under its overhangs (the headroom left
 * for the screen below) the mountain carries on, in shadow. Drawn behind; you can't stand on it.
 */
function drawRecess(g: CanvasRenderingContext2D, m: Mountain, tx0: number, ty0: number, look: ZoneLook, collapsed: boolean) {
  for (let c = 0; c < COLS; c++) {
    let roof = -1;
    for (let r = 0; r < ROWS; r++) {
      const solid = solidLook(m, tx0 + c, ty0 + r, collapsed);
      if (solid) roof = r;
      else if (roof >= 0 && r - roof <= 3 && r >= ROWS - 3) {
        g.fillStyle = mix(look.rockDeep, R.night, 0.35);
        g.fillRect(c * TILE, r * TILE, TILE, TILE);
        if (hash(tx0 + c, ty0 + r, 31) < 0.3) {
          g.fillStyle = look.rockShade;
          g.fillRect(c * TILE + 2, r * TILE + 3, 2, 1);
        }
      }
    }
  }
}

/**
 * Inside the mountain: the tops of the ledges glow faintly (luminous moss), so the next ledge is
 * always visible, even beyond the lamp (Plan §4: no falls that can't be seen coming). Cached.
 */
const glowCache = new Map<string, HTMLCanvasElement>();
export function screenGlow(m: Mountain, screen: Screen, collapsed: boolean): HTMLCanvasElement {
  const key = `${m.mirrored ? "m" : "n"}:${screen.id}:${collapsed ? 1 : 0}`;
  const hit = glowCache.get(key);
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  canvas.width = VIEW_W;
  canvas.height = VIEW_H;
  const g = canvas.getContext("2d")!;
  const tx0 = screen.col * COLS;
  const ty0 = (screen.y / TILE) | 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const code = tileAt(m, tx0 + c, ty0 + r);
      const ground = isRockish(code, collapsed) || code === T.CRUMBLE || code === T.PLANK;
      if (!ground || solidLook(m, tx0 + c, ty0 + r - 1, collapsed) || tileAt(m, tx0 + c, ty0 + r - 1) === T.CRUMBLE) continue;
      g.fillStyle = code === T.CRUMBLE ? R.peach : R.aqua;
      g.fillRect(c * TILE, r * TILE, TILE, 1);
      g.fillStyle = "rgba(48,225,185,0.35)";
      if (hash(tx0 + c, ty0 + r, 41) < 0.5) g.fillRect(c * TILE + 2, r * TILE - 1, 2, 1);
    }
  }
  glowCache.set(key, canvas);
  return canvas;
}

function drawHollow(g: CanvasRenderingContext2D, x: number, y: number, tx: number, ty: number) {
  g.fillStyle = R.night;
  g.fillRect(x, y, TILE, TILE);
  if (hash(tx, ty, 7) < 0.15) {
    g.fillStyle = R.plum;
    g.fillRect(x + ((hash(tx, ty, 8) * 6) | 0), y + ((hash(tx, ty, 9) * 6) | 0), 2, 1);
  }
}

function drawTile(g: CanvasRenderingContext2D, m: Mountain, code: number, x: number, y: number, tx: number, ty: number, look: ZoneLook, zone: ZoneId, collapsed: boolean) {
  const airAbove = !solidLook(m, tx, ty - 1, collapsed) && tileAt(m, tx, ty - 1) !== T.MUSHROOM;
  const airBelow = !solidLook(m, tx, ty + 1, collapsed);
  const airLeft = !solidLook(m, tx - 1, ty, collapsed);
  const airRight = !solidLook(m, tx + 1, ty, collapsed);

  switch (code) {
    case T.ICE: {
      g.fillStyle = R.ice;
      g.fillRect(x, y, TILE, TILE);
      g.fillStyle = R.sky;
      g.fillRect(x, y + TILE - 2, TILE, 2);
      g.fillStyle = R.white;
      if (airAbove) g.fillRect(x, y, TILE, 1);
      if (hash(tx, ty) < 0.5) g.fillRect(x + 2 + ((hash(tx, ty, 2) * 3) | 0), y + 2, 2, 1);
      g.fillStyle = R.foam;
      g.fillRect(x + ((hash(tx, ty, 3) * 5) | 0), y + 4, 3, 1);
      return;
    }
    case T.SNOW: {
      g.fillStyle = R.white;
      g.fillRect(x, y, TILE, TILE);
      g.fillStyle = R.mist;
      g.fillRect(x, y + 5, TILE, 3);
      g.fillStyle = R.ice;
      if (hash(tx, ty) < 0.6) g.fillRect(x + ((hash(tx, ty, 4) * 6) | 0), y + 6, 2, 1);
      if (airAbove) {
        g.fillStyle = R.white;
        g.fillRect(x + (hash(tx, ty, 5) < 0.5 ? 1 : 4), y - 1, 3, 1);
      }
      return;
    }
    case T.MUSHROOM: {
      // A big red cap with white spots (it bounces you).
      g.fillStyle = R.crimson;
      g.fillRect(x, y, TILE, TILE);
      g.fillStyle = R.scarlet;
      g.fillRect(x, y, TILE, 4);
      g.fillStyle = R.white;
      g.fillRect(x + 1 + ((hash(tx, ty) * 4) | 0), y + 1, 2, 2);
      if (hash(tx, ty, 6) < 0.5) g.fillRect(x + 5, y + 4, 1, 1);
      g.fillStyle = R.maroon;
      g.fillRect(x, y + TILE - 1, TILE, 1);
      if (airLeft) g.fillRect(x, y, 1, TILE);
      if (airRight) g.fillRect(x + TILE - 1, y, 1, TILE);
      g.fillStyle = R.salmon;
      if (airAbove) g.fillRect(x, y, TILE, 1);
      return;
    }
    case T.PLANK: {
      g.fillStyle = R.clay;
      g.fillRect(x, y, TILE, 3);
      g.fillStyle = R.rust;
      g.fillRect(x, y + 2, TILE, 1);
      g.fillStyle = R.tan;
      g.fillRect(x, y, TILE, 1);
      return;
    }
    default:
      break;
  }

  // Rock (and the summit's ledge, the seal and the hollow, which look like rock until the fall).
  const d = depth(m, tx, ty, collapsed);
  // Deeper inside the rock is a little darker (a gentle slope, not rings).
  const face = d === 0 ? look.rock : mix(look.rock, look.rockShade, Math.min(0.75, d * 0.28));
  g.fillStyle = face;
  g.fillRect(x, y, TILE, TILE);
  // Speckles and cracks: the same on every visit.
  const h = hash(tx, ty, 11);
  if (h < 0.55) {
    g.fillStyle = d === 0 ? look.speck : mix(face, look.speck, 0.35);
    g.fillRect(x + ((h * 97) % 6 | 0), y + ((h * 53) % 6 | 0), h < 0.2 ? 2 : 1, 1);
  }
  if (d === 0) {
    g.fillStyle = look.rockShade;
    if (airBelow) g.fillRect(x, y + TILE - 1, TILE, 1);
    if (airLeft) g.fillRect(x, y, 1, TILE);
    if (airRight) g.fillRect(x + TILE - 1, y, 1, TILE);
  }
  if (code === T.SEAL && !collapsed) {
    // A crack (hard to spot unless you're looking for it).
    g.fillStyle = look.rockShade;
    g.fillRect(x + 3, y + 1, 1, 3);
    g.fillRect(x + 4, y + 4, 1, 3);
  }
  if (airAbove) topEdge(g, x, y, tx, ty, look, zone);
}

/** The bright top of a ledge, in the zone's style. */
function topEdge(g: CanvasRenderingContext2D, x: number, y: number, tx: number, ty: number, look: ZoneLook, zone: ZoneId) {
  const h = hash(tx, ty, 21);
  switch (zone) {
    case "foothills":
      g.fillStyle = R.green;
      g.fillRect(x, y, TILE, 3);
      g.fillStyle = look.rockTop;
      g.fillRect(x, y, TILE, 2);
      g.fillStyle = R.leaf;
      g.fillRect(x, y, TILE, 1);
      if (h < 0.5) g.fillRect(x + ((h * 13) % 6 | 0), y - 1, 1, 1);
      if (h < 0.15) {
        g.fillStyle = R.gold;
        g.fillRect(x + 5, y - 1, 1, 1);
      }
      return;
    case "rooftops":
      // Terracotta tiles.
      g.fillStyle = R.brick;
      g.fillRect(x, y, TILE, 3);
      g.fillStyle = look.rockTop;
      g.fillRect(x, y, TILE, 2);
      g.fillStyle = R.coral;
      g.fillRect(x, y, TILE, 1);
      g.fillStyle = R.maroon;
      g.fillRect(x + (tx % 2 ? 3 : 7), y + 1, 1, 2);
      return;
    case "clocktower":
      g.fillStyle = R.amber;
      g.fillRect(x, y, TILE, 2);
      g.fillStyle = look.rockTop;
      g.fillRect(x, y, TILE, 1);
      g.fillStyle = R.bark;
      if (tx % 3 === 0) g.fillRect(x + 3, y + 1, 1, 1);
      return;
    case "ice":
    case "fake-summit":
    case "summit":
      // Snow on top.
      g.fillStyle = R.mist;
      g.fillRect(x, y, TILE, 3);
      g.fillStyle = R.white;
      g.fillRect(x, y, TILE, 2);
      if (h < 0.4) g.fillRect(x + ((h * 17) % 5 | 0), y + 2, 3, 1);
      return;
    case "inside":
      g.fillStyle = look.rockTop;
      g.fillRect(x, y, TILE, 1);
      g.fillStyle = mix(look.rock, look.rockTop, 0.4);
      g.fillRect(x, y + 1, TILE, 1);
      return;
    case "sky":
      g.fillStyle = R.blush;
      g.fillRect(x, y, TILE, 2);
      g.fillStyle = look.rockTop;
      g.fillRect(x, y, TILE, 1);
      return;
    default:
      g.fillStyle = look.rockTop;
      g.fillRect(x, y, TILE, 2);
      g.fillStyle = mix(look.rockTop, R.white, 0.5);
      g.fillRect(x, y, TILE, 1);
  }
}

/** A crumbling ledge's tile (it shakes before it goes). */
export function drawCrumble(g: CanvasRenderingContext2D, x: number, y: number, tx: number, ty: number, look: ZoneLook, shake: number, back: number) {
  if (back > 0) {
    // Gone: a faint outline where it will come back.
    g.fillStyle = `rgba(255,255,255,${0.08 + 0.25 * back})`;
    g.fillRect(x, y, TILE, 1);
    g.fillRect(x, y + TILE - 1, TILE, 1);
    return;
  }
  const dx = shake > 0 ? (Math.round(Math.sin(shake * 1.7 + tx) * Math.min(2, shake / 15)) | 0) : 0;
  g.fillStyle = mix(look.rock, R.sand, 0.35);
  g.fillRect(x + dx, y, TILE, TILE - 1);
  g.fillStyle = look.rockShade;
  g.fillRect(x + dx + 2, y + 2, 1, 3);
  g.fillRect(x + dx + 3, y + 4, 2, 1);
  g.fillRect(x + dx + 6, y + 1, 1, 2);
  g.fillStyle = mix(look.rockTop, R.sand, 0.5);
  g.fillRect(x + dx, y, TILE, 2);
}

/** A cloud's tile: soft and round at the ends (it fades before it goes). */
export function drawCloud(g: CanvasRenderingContext2D, x: number, y: number, tx: number, leftEnd: boolean, rightEnd: boolean, fade: number) {
  g.globalAlpha = Math.max(0, 1 - fade);
  g.fillStyle = R.cream;
  g.fillRect(x + (leftEnd ? 1 : 0), y + 1, TILE - (leftEnd ? 1 : 0) - (rightEnd ? 1 : 0), 4);
  g.fillStyle = R.white;
  g.fillRect(x + (leftEnd ? 2 : 0), y, TILE - (leftEnd ? 2 : 0) - (rightEnd ? 2 : 0), 2);
  if (tx % 2 === 0) g.fillRect(x + 2, y - 1, 4, 1);
  g.fillStyle = R.apricot;
  g.fillRect(x + (leftEnd ? 1 : 0), y + 4, TILE - (leftEnd ? 1 : 0) - (rightEnd ? 1 : 0), 1);
  g.globalAlpha = 1;
}
