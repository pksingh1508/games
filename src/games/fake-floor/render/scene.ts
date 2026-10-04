// The parts of a room that never change, painted once per room (Plan/05-fake-floor.md §9, §12):
// the far background (parallax 0.3), the back wall right behind the floors (where lantern shadows
// fall), the painted world's middle layer, and the rock. Each world has its own mood: a bright
// showroom, rooftops in the rain, a mine, a hall of mirrors, a painting, and the Floor itself.
import { ROWS, TILE, VIEW_H, VIEW_W } from "../core/constants";
import { cellAt, ROCK, type Look, type Room } from "../core/room";
import { E, hash, mix } from "./palette";

/** How far the far background moves for each pixel the camera moves. */
export const FAR_PARALLAX = 0.3;
/** The main floor line (most rooms walk on row 11): the pit starts below it. */
const HORIZON = 11 * TILE;

export interface Scene {
  look: Look;
  far: HTMLCanvasElement;
  /** The back wall, at the floors' depth (lantern shadows fall on it). */
  wall: HTMLCanvasElement | null;
  /** The painting's middle layer (World 5): hills and bushes at the painted floors' depth. */
  mid: HTMLCanvasElement | null;
  rock: HTMLCanvasElement;
  /** Eyes in the Floor's rock (the final room), drawn live so they can blink and look at you. */
  eyes: Array<{ x: number; y: number; size: number }>;
}

const canvas = (w: number, h = VIEW_H) => {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.ceil(w));
  c.height = h;
  return c;
};

const px = (g: CanvasRenderingContext2D, colour: string, x: number, y: number, w = 1, h = 1) => {
  g.fillStyle = colour;
  g.fillRect(Math.round(x), Math.round(y), w, h);
};

/** A vertical gradient in hard bands (pixel-art skies don't blend). */
function bands(g: CanvasRenderingContext2D, width: number, top: string, bottom: string, y0 = 0, y1 = VIEW_H, count = 8) {
  const h = (y1 - y0) / count;
  for (let i = 0; i < count; i++) px(g, mix(top, bottom, i / (count - 1)), 0, y0 + Math.floor(i * h), width, Math.ceil(h) + 1);
}

function disc(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, colour: string) {
  g.fillStyle = colour;
  for (let y = -r; y <= r; y++) {
    const half = Math.floor(Math.sqrt(r * r - y * y));
    g.fillRect(Math.round(cx - half), Math.round(cy + y), half * 2 + 1, 1);
  }
}

const seedOf = (room: Room) => room.id.split("").reduce((n, ch) => n * 31 + ch.charCodeAt(0), 7);

// ---------------------------------------------------------------------------------------------
// Far backgrounds
// ---------------------------------------------------------------------------------------------

function farShowroom(g: CanvasRenderingContext2D, w: number, seed: number) {
  // A bright wall with framed floor samples, spotlights and a sale banner; the basement below.
  bands(g, w, "#f6efe0", E.cream, 0, HORIZON, 6);
  px(g, E.tan, 0, HORIZON - 8, w, 8);
  px(g, E.brown, 0, HORIZON - 8, w, 1);
  px(g, "#efe3c8", 0, 0, w, 10);
  px(g, E.steel, 0, 10, w, 2);
  for (let x = (seed % 40) + 20; x < w; x += 92) {
    // A framed tile sample.
    px(g, E.umber, x - 1, 46, 42, 34);
    px(g, E.white, x, 47, 40, 32);
    for (let ty = 0; ty < 4; ty++) for (let tx = 0; tx < 5; tx++) px(g, (tx + ty) % 2 ? E.tan : E.cream, x + 2 + tx * 7 + (ty % 2 ? 3 : 0), 50 + ty * 7, 6, 6);
    px(g, E.wine, x + 26, 82, 12, 7);
    px(g, E.white, x + 28, 84, 8, 1);
    px(g, E.white, x + 28, 86, 5, 1);
    // A spotlight on its rail.
    px(g, E.dusk, x + 17, 12, 6, 5);
    g.fillStyle = "rgba(255, 255, 255, 0.18)";
    g.beginPath();
    g.moveTo(x + 17, 17);
    g.lineTo(x + 23, 17);
    g.lineTo(x + 50, HORIZON - 8);
    g.lineTo(x - 10, HORIZON - 8);
    g.closePath();
    g.fill();
  }
  // A potted plant now and then.
  for (let x = (seed % 70) + 60; x < w; x += 230) {
    px(g, E.umber, x, HORIZON - 22, 14, 14);
    px(g, E.brown, x + 1, HORIZON - 22, 12, 3);
    disc(g, x + 7, HORIZON - 34, 10, E.moss);
    disc(g, x + 3, HORIZON - 38, 6, E.green);
  }
  bands(g, w, E.dusk, E.ink, HORIZON, VIEW_H, 6);
}

function farRooftops(g: CanvasRenderingContext2D, w: number, seed: number) {
  bands(g, w, "#1b1f38", E.dusk, 0, VIEW_H, 8);
  // A moon behind the clouds.
  disc(g, 380, 48, 22, "#3f4a72");
  disc(g, 380, 48, 16, E.mist);
  disc(g, 386, 44, 14, "#d9e1ec");
  // Two rows of city skyline, lit windows in the near one.
  for (const [base, colour, lit, step] of [
    [150, "#2b3154", 0.08, 26],
    [176, E.night, 0.22, 34],
  ] as const) {
    for (let x = -10, i = 0; x < w; i++) {
      const bw = step + Math.floor(hash(seed, i, base) * 30);
      const top = base - 20 - Math.floor(hash(i, seed, base) * 70);
      px(g, colour, x, top, bw, VIEW_H - top);
      for (let wy = top + 6; wy < VIEW_H - 4; wy += 9) {
        for (let wx = x + 4; wx < x + bw - 5; wx += 7) {
          const h = hash(wx, wy, seed);
          if (h < lit) px(g, h < lit / 3 ? E.yellow : E.amber, wx, wy, 3, 4);
        }
      }
      if (hash(i, base) < 0.3) {
        // A water tower.
        px(g, colour, x + 6, top - 14, 12, 10);
        px(g, colour, x + 8, top - 4, 2, 4);
        px(g, colour, x + 14, top - 4, 2, 4);
      }
      x += bw + 2;
    }
  }
  // Low clouds.
  g.fillStyle = "rgba(90, 105, 136, 0.35)";
  for (let x = (seed % 50) - 40; x < w; x += 140) g.fillRect(x, 24 + (x % 3) * 8, 110, 7);
  bands(g, w, E.night, E.ink, HORIZON + 6, VIEW_H, 5);
}

function farMines(g: CanvasRenderingContext2D, w: number) {
  bands(g, w, "#140f1c", E.ink, 0, VIEW_H, 4);
}

function farMirrors(g: CanvasRenderingContext2D, w: number, seed: number) {
  // A checkerboard far wall, a glass ceiling, cold light.
  bands(g, w, "#2e3552", E.dusk, 0, VIEW_H, 6);
  for (let y = 0; y < 30; y += 6) for (let x = (y / 6) % 2 ? 6 : 0; x < w; x += 12) px(g, "#46507a", x, y, 6, 6);
  px(g, E.steel, 0, 30, w, 2);
  for (let x = (seed % 30) + 10; x < w; x += 46) {
    px(g, "#323a5c", x, 40, 22, 120);
    px(g, "#3f4a72", x + 2, 42, 18, 116);
  }
  bands(g, w, E.night, E.ink, HORIZON + 6, VIEW_H, 5);
}

/** Short brush strokes: the painting's texture. */
function strokes(g: CanvasRenderingContext2D, x0: number, y0: number, w: number, h: number, colours: readonly string[], seed: number, density = 0.012) {
  const count = Math.floor(w * h * density);
  for (let i = 0; i < count; i++) {
    const x = x0 + Math.floor(hash(seed, i, 1) * w);
    const y = y0 + Math.floor(hash(i, seed, 2) * h);
    const len = 3 + Math.floor(hash(i, 3, seed) * 5);
    const colour = colours[Math.floor(hash(seed, 4, i) * colours.length)]!;
    for (let k = 0; k < len; k++) px(g, colour, x + k, y - Math.floor(k / 2), 1, 2);
  }
}

function farPainting(g: CanvasRenderingContext2D, w: number, seed: number) {
  // A swirling night sky, stars with halos, rolling hills.
  bands(g, w, E.navyBlue, "#2a78b8", 0, VIEW_H, 8);
  strokes(g, 0, 0, w, 150, ["#2f7fc0", "#1b5c9c", "#4a90c8"], seed, 0.006);
  for (let i = 0; i < Math.ceil(w / 90); i++) {
    const cx = 30 + i * 90 + Math.floor(hash(i, seed) * 50);
    const cy = 20 + Math.floor(hash(seed, i) * 70);
    // A swirl.
    g.strokeStyle = "#7fb6e0";
    g.lineWidth = 2;
    g.beginPath();
    for (let a = 0; a < Math.PI * 3; a += 0.25) {
      const r = 3 + a * 3;
      const x = Math.round(cx + Math.cos(a) * r);
      const y = Math.round(cy + Math.sin(a) * r * 0.6);
      if (a === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
  }
  for (let i = 0; i < Math.ceil(w / 60); i++) {
    const sx = Math.floor(hash(i, 7, seed) * w);
    const sy = 8 + Math.floor(hash(seed, 7, i) * 110);
    disc(g, sx, sy, 6, "rgba(254, 231, 97, 0.35)");
    disc(g, sx, sy, 3, E.yellow);
    px(g, E.white, sx, sy, 1, 1);
  }
  // Far hills.
  g.fillStyle = E.pine;
  for (let x = 0; x < w; x += 2) {
    const y = Math.round(150 - 18 * Math.sin((x + seed) / 70) - 8 * Math.sin((x + seed * 3) / 23));
    g.fillRect(x, y, 2, VIEW_H - y);
  }
  strokes(g, 0, 120, w, 70, [E.moss, E.pine], seed + 1, 0.008);
  bands(g, w, E.teal, E.ink, HORIZON + 6, VIEW_H, 5);
}

function farFloor(g: CanvasRenderingContext2D, w: number, seed: number) {
  // The inside of something alive: dark plum, slow veins.
  bands(g, w, "#2a1630", E.ink, 0, VIEW_H, 6);
  g.strokeStyle = "rgba(181, 80, 136, 0.18)";
  g.lineWidth = 2;
  for (let i = 0; i < Math.ceil(w / 70); i++) {
    g.beginPath();
    let x = i * 70 + Math.floor(hash(i, seed) * 40);
    let y = 0;
    g.moveTo(x, y);
    while (y < VIEW_H) {
      x += Math.round((hash(x, y, seed) - 0.5) * 18);
      y += 12;
      g.lineTo(x, y);
    }
    g.stroke();
  }
}

// ---------------------------------------------------------------------------------------------
// Back walls (at the floors' depth)
// ---------------------------------------------------------------------------------------------

function wallMines(g: CanvasRenderingContext2D, w: number, seed: number) {
  // Rough rock close behind the planks (light enough for shadows to show on), with timber supports.
  px(g, "#6a4a3c", 0, 0, w, VIEW_H);
  for (let i = 0; i < (w * VIEW_H) / 22; i++) {
    const x = Math.floor(hash(i, seed, 11) * w);
    const y = Math.floor(hash(seed, i, 12) * VIEW_H);
    px(g, hash(i, 13) < 0.5 ? "#5c3f34" : "#7a5646", x, y, 2 + Math.floor(hash(i, 14) * 4), 2);
  }
  for (let x = (seed % 60) + 30; x < w; x += 190) {
    for (const post of [x, x + 60]) {
      px(g, "#4a3029", post, 0, 7, VIEW_H);
      px(g, "#5d3c32", post + 1, 0, 2, VIEW_H);
    }
    px(g, "#4a3029", x - 4, 28, 75, 7);
    px(g, "#5d3c32", x - 4, 28, 75, 2);
  }
  // Darker toward the bottom: the shaft goes down.
  for (let y = 11 * TILE; y < VIEW_H; y += 4) {
    g.fillStyle = `rgba(24, 20, 37, ${Math.min(0.8, ((y - 11 * TILE) / (VIEW_H - 11 * TILE)) * 0.8)})`;
    g.fillRect(0, y, w, 4);
  }
}

function wallMirrors(g: CanvasRenderingContext2D, w: number, seed: number) {
  // Tall mirror panels between silver pilasters.
  px(g, "#2a3150", 0, 0, w, VIEW_H);
  for (let x = (seed % 20) - 10; x < w; x += 96) {
    px(g, E.slate, x, 36, 64, HORIZON - 36);
    px(g, E.dusk, x + 3, 39, 58, HORIZON - 42);
    px(g, "#4a5884", x + 4, 40, 56, HORIZON - 44);
    // Glints.
    for (let k = 0; k < 3; k++) {
      const gx = x + 10 + k * 16;
      for (let i = 0; i < 26; i++) px(g, "rgba(255,255,255,0.18)", gx + i, 50 + i * 2, 1, 2);
    }
    px(g, E.mist, x + 70, 20, 10, VIEW_H);
    px(g, E.white, x + 71, 20, 2, VIEW_H);
    px(g, E.steel, x + 78, 20, 2, VIEW_H);
  }
  px(g, E.steel, 0, 18, w, 4);
  px(g, E.mist, 0, 18, w, 1);
}

// ---------------------------------------------------------------------------------------------
// Rock
// ---------------------------------------------------------------------------------------------

/** How much darker rock gets below the floor line (the pit is deep). */
const depthShade = (r: number) => Math.max(0, Math.min(0.85, (r - 11) * 0.17));

function rockTile(g: CanvasRenderingContext2D, room: Room, look: Look, c: number, r: number, seed: number) {
  const x = c * TILE;
  const y = r * TILE;
  const solid = (dc: number, dr: number) => {
    const rr = r + dr;
    if (rr >= ROWS) return true;
    const cc = c + dc;
    if (cc < 0 || cc >= room.cols) return true;
    return cellAt(room, cc, rr) === ROCK;
  };
  const open = { up: !solid(0, -1), down: !solid(0, 1), left: !solid(-1, 0), right: !solid(1, 0) };
  const shade = depthShade(r);
  const tone = (colour: string) => (shade ? mix(colour, E.ink, shade) : colour);

  switch (look) {
    case 1: {
      // White display plinths with panel lines.
      px(g, tone(E.mist), x, y, TILE, TILE);
      if ((c + seed) % 3 === 0) px(g, tone(E.steel), x + 15, y, 1, TILE);
      if (open.up) {
        px(g, E.white, x, y, TILE, 3);
        px(g, E.steel, x, y + 3, TILE, 1);
      }
      if (open.left) px(g, tone(E.white), x, y, 2, TILE);
      if (open.right) px(g, tone(E.steel), x + TILE - 2, y, 2, TILE);
      break;
    }
    case 2: {
      // Brick buildings, lit windows below the roofline.
      px(g, tone(E.umber), x, y, TILE, TILE);
      for (let by = 0; by < TILE; by += 4) {
        px(g, tone(E.cocoa), x, y + by + 3, TILE, 1);
        for (let bx = (by / 4) % 2 ? 4 : 0; bx < TILE; bx += 8) px(g, tone(E.cocoa), x + bx, y + by, 1, 3);
      }
      if (r >= 12 && hash(c, r, seed) < 0.5) {
        const lit = hash(r, c, seed) < 0.45;
        px(g, E.ink, x + 4, y + 3, 8, 10);
        px(g, lit ? E.amber : E.night, x + 5, y + 4, 6, 8);
        if (lit) px(g, E.yellow, x + 5, y + 4, 2, 3);
        px(g, E.ink, x + 8, y + 4, 1, 8);
      }
      if (open.up) {
        px(g, E.steel, x, y, TILE, 4);
        px(g, E.mist, x, y, TILE, 1);
        px(g, E.slate, x, y + 4, TILE, 1);
      }
      if (open.left) px(g, tone(E.brown), x, y, 1, TILE);
      if (open.right) px(g, tone(E.cocoa), x + TILE - 1, y, 1, TILE);
      break;
    }
    case 3: {
      // Rough stone.
      px(g, tone(E.cocoa), x, y, TILE, TILE);
      for (let i = 0; i < 5; i++) {
        px(g, tone(i < 3 ? E.umber : "#2c1f29"), x + Math.floor(hash(c, r, i) * 13), y + Math.floor(hash(r, c, i + 5) * 13), 3, 2);
      }
      if (open.up) {
        px(g, E.umber, x, y, TILE, 3);
        px(g, E.brown, x, y, TILE, 1);
        for (let i = 0; i < 3; i++) px(g, E.tan, x + Math.floor(hash(c, i, r) * 15), y, 1, 1);
      }
      if (open.left) px(g, tone(E.umber), x, y, 1, TILE);
      if (open.right) px(g, tone("#2c1f29"), x + TILE - 1, y, 1, TILE);
      break;
    }
    case 4: {
      // Marble pillars with veins.
      px(g, tone(E.mist), x, y, TILE, TILE);
      const vx = Math.floor(hash(c, seed) * 12);
      for (let i = 0; i < TILE; i++) px(g, tone(E.steel), x + ((vx + i * 0.6) % TILE), y + i, 1, 1);
      if (open.up) {
        px(g, E.white, x, y, TILE, 2);
        px(g, E.steel, x, y + 2, TILE, 1);
        px(g, E.mist, x, y + 3, TILE, 1);
      }
      if (open.left) px(g, tone(E.white), x, y, 2, TILE);
      if (open.right) px(g, tone(E.slate), x + TILE - 1, y, 1, TILE);
      break;
    }
    case 5: {
      // Painted rock: thick strokes.
      px(g, tone(E.clay), x, y, TILE, TILE);
      for (let i = 0; i < 7; i++) {
        const sx = x + Math.floor(hash(c, r, i) * 13);
        const sy = y + Math.floor(hash(r, i, c) * 14);
        const colour = [E.rust, E.amber, E.umber, E.tan][i % 4]!;
        px(g, tone(colour), sx, sy, 3, 1);
        px(g, tone(colour), sx + 1, sy + 1, 2, 1);
      }
      if (open.up) {
        px(g, E.amber, x, y, TILE, 2);
        px(g, E.yellow, x + Math.floor(hash(c, r) * 10), y, 5, 1);
      }
      if (open.left) px(g, tone(E.umber), x, y, 1, TILE);
      if (open.right) px(g, tone(E.umber), x + TILE - 1, y, 1, TILE);
      break;
    }
    case 6: {
      // The Floor's flesh-stone.
      px(g, tone(E.plum), x, y, TILE, TILE);
      for (let i = 0; i < 4; i++) px(g, tone(E.orchid), x + Math.floor(hash(c, r, i) * 13), y + Math.floor(hash(r, c, i) * 14), 2, 2);
      if (open.up) {
        px(g, E.orchid, x, y, TILE, 2);
        px(g, E.pink, x, y, TILE, 1);
      }
      if (open.left) px(g, tone(E.orchid), x, y, 1, TILE);
      if (open.right) px(g, tone(E.ink), x + TILE - 1, y, 1, TILE);
      break;
    }
  }
  if (open.up) px(g, E.ink, x, y - 1, TILE, 1);
  if (open.left) px(g, E.ink, x - 1, y, 1, TILE);
  if (open.right) px(g, E.ink, x + TILE, y, 1, TILE);
  if (open.down) px(g, E.ink, x, y + TILE, TILE, 1);
}

const scenes = new WeakMap<Room, Scene>();

export function buildScene(room: Room): Scene {
  const hit = scenes.get(room);
  if (hit) return hit;
  const look = room.env.look;
  const seed = seedOf(room);
  const maxCam = Math.max(0, room.width - VIEW_W);

  const far = canvas(VIEW_W + maxCam * FAR_PARALLAX + 2);
  const fg = far.getContext("2d")!;
  if (look === 1) farShowroom(fg, far.width, seed);
  else if (look === 2) farRooftops(fg, far.width, seed);
  else if (look === 3) farMines(fg, far.width);
  else if (look === 4) farMirrors(fg, far.width, seed);
  else if (look === 5) farPainting(fg, far.width, seed);
  else farFloor(fg, far.width, seed);

  let wall: HTMLCanvasElement | null = null;
  if (look === 3 || look === 4) {
    wall = canvas(room.width);
    const wg = wall.getContext("2d")!;
    if (look === 3) wallMines(wg, room.width, seed);
    else wallMirrors(wg, room.width, seed);
  }

  let mid: HTMLCanvasElement | null = null;
  if (look === 5) {
    mid = canvas(VIEW_W + maxCam * room.env.parallax + 2);
    const mg = mid.getContext("2d")!;
    // Bushes and a painted fence, at the painted floors' depth.
    for (let i = 0; i < Math.ceil(mid.width / 60); i++) {
      const bx = i * 60 + Math.floor(hash(i, seed, 5) * 30);
      const by = 150 + Math.floor(hash(seed, i, 5) * 20);
      disc(mg, bx, by, 9 + Math.floor(hash(i, 6) * 6), E.moss);
      strokes(mg, bx - 10, by - 10, 20, 20, [E.green, E.pine, E.moss], seed + i, 0.05);
    }
  }

  const rock = canvas(room.width);
  const rg = rock.getContext("2d")!;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < room.cols; c++) if (cellAt(room, c, r) === ROCK) rockTile(rg, room, look, c, r, seed);

  // The Floor's eyes: in the bigger pieces of rock.
  const eyes: Scene["eyes"] = [];
  if (look === 6) {
    for (let c = 1; c < room.cols - 2; c++) {
      for (let r = 12; r < ROWS - 1; r++) {
        if ([0, 1].every((dc) => [0, 1].every((dr) => cellAt(room, c + dc, r + dr) === ROCK)) && hash(c, r, seed) < 0.12) {
          eyes.push({ x: c * TILE + TILE, y: r * TILE + TILE, size: hash(r, c) < 0.5 ? 7 : 6 });
          c += 2;
        }
      }
    }
  }

  const scene: Scene = { look, far, wall, mid, rock, eyes };
  scenes.set(room, scene);
  return scene;
}
