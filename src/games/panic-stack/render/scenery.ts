// Each location's backdrop (Plan/11-panic-stack.md §9: each location has its own palette and props), drawn
// once into a canvas the size of the screen and reused every frame. The wall's pattern fills the screen; the
// props stand in the margins either side of the platform, between the floor and the conveyor, so they never
// sit behind the tower, the goal line or the belt (and on a narrow phone there's just the wall).
import type { LocationId } from "../core/level";
import { canvasFont, INK } from "./sprites";

export interface Palette {
  wall: string;
  wall2: string;
  floor: string;
  trim: string;
  platform: string;
  belt: string;
}

export const PALETTES: Record<LocationId, Palette> = {
  kitchen: { wall: "#FFF1E0", wall2: "#FFE3C4", floor: "#E9C9A6", trim: "#B8460C", platform: "#3E3A63", belt: "#4A4570" },
  warehouse: { wall: "#E8E1D5", wall2: "#D9CDBB", floor: "#B9A991", trim: "#C98A2B", platform: "#3B3F4A", belt: "#45474F" },
  toyroom: { wall: "#E9F1FF", wall2: "#D6E4FF", floor: "#F7D9E8", trim: "#2B7FFF", platform: "#4B3F8F", belt: "#574A9C" },
  museum: { wall: "#F3EEE6", wall2: "#E6DED2", floor: "#C9B79C", trim: "#9C1C2B", platform: "#3A3632", belt: "#4A4540" },
  bakery: { wall: "#FFF4EA", wall2: "#FBE3D2", floor: "#E3B98F", trim: "#D9467A", platform: "#5A3B33", belt: "#6A4A41" },
  space: { wall: "#141B33", wall2: "#1E2850", floor: "#2C3560", trim: "#5EE6C8", platform: "#C9D1DB", belt: "#38406B" },
};

/** Where things are on screen (CSS px). */
export interface SceneLayout {
  w: number;
  h: number;
  /** The platform's top, and the floor below it. */
  floorY: number;
  groundY: number;
  /** The bottom of the conveyor, and the top of the tallest thing riding it. */
  beltBottom: number;
  beltTop: number;
  /** The free wall either side of the stage: [0, left] and [right, w]. */
  left: number;
  right: number;
  /** Pixels per metre. */
  scale: number;
}

type G = CanvasRenderingContext2D;

function box(g: G, x: number, y: number, w: number, h: number, fill: string, line = 2) {
  g.fillStyle = fill;
  g.fillRect(x, y, w, h);
  g.lineWidth = line;
  g.strokeStyle = INK;
  g.strokeRect(x, y, w, h);
}

/** Props are drawn in a 2.4 × 4 "prop space", fitted into a side's free wall, standing on the floor. */
type Prop = (g: G, p: Palette) => void;

const PROPS: Record<LocationId, Prop> = {
  kitchen(g, p) {
    // A window with a sill, and a counter with jars.
    box(g, 0.3, 0.3, 1.8, 1.3, "#BFE3FF", 0.06);
    g.fillStyle = INK;
    g.fillRect(1.17, 0.3, 0.06, 1.3);
    g.fillRect(0.3, 0.92, 1.8, 0.06);
    box(g, 0.2, 1.6, 2.0, 0.12, p.trim, 0.05);
    box(g, 0.1, 2.9, 2.2, 1.1, "#F7E6D2", 0.06);
    box(g, 0.0, 2.78, 2.4, 0.14, "#D9C2A6", 0.05);
    for (const x of [0.35, 1.3]) box(g, x, 3.05, 0.75, 0.8, "#EFD9BF", 0.04);
    ["#FFD23F", "#E63946", "#2BB673"].forEach((c, k) => box(g, 0.3 + k * 0.65, 2.3, 0.4, 0.48, c, 0.05));
  },
  warehouse(g) {
    // Shelving with boxes.
    for (const x of [0.15, 2.15]) box(g, x, 0.2, 0.1, 3.8, "#8C5A2B", 0.04);
    for (let k = 0; k < 3; k++) {
      const y = 1.25 + k * 1.25;
      box(g, 0.1, y, 2.2, 0.1, "#C98A2B", 0.04);
      for (let b = 0; b < 3; b++) box(g, 0.3 + b * 0.62, y - 0.55, 0.52, 0.55, b % 2 ? "#D69A52" : "#C48745", 0.04);
    }
  },
  toyroom(g) {
    // A toy rocket and a pile of blocks.
    box(g, 0.9, 1.6, 0.6, 1.5, "#E63946", 0.05);
    g.beginPath();
    g.moveTo(0.9, 1.6);
    g.lineTo(1.2, 0.9);
    g.lineTo(1.5, 1.6);
    g.closePath();
    g.fillStyle = "#FFD23F";
    g.fill();
    g.lineWidth = 0.05;
    g.strokeStyle = INK;
    g.stroke();
    g.beginPath();
    g.arc(1.2, 2.0, 0.16, 0, Math.PI * 2);
    g.fillStyle = "#BFE3FF";
    g.fill();
    g.stroke();
    for (const [x, y, c] of [
      [0.3, 3.45, "#2B7FFF"],
      [0.85, 3.45, "#FFD23F"],
      [1.4, 3.45, "#2BB673"],
      [0.6, 2.9, "#9B5DE5"],
    ] as const)
      box(g, x, y, 0.55, 0.55, c, 0.05);
  },
  museum(g, p) {
    // A column and a painting on the wall.
    box(g, 0.2, 0.3, 0.6, 3.7, "#EFE9DF", 0.05);
    box(g, 0.05, 0.15, 0.9, 0.2, "#E2DACB", 0.05);
    box(g, 0.05, 3.85, 0.9, 0.15, "#E2DACB", 0.05);
    box(g, 1.15, 0.8, 1.15, 1.0, "#C9A227", 0.05);
    box(g, 1.25, 0.9, 0.95, 0.8, "#5B8DB8", 0.04);
    g.fillStyle = "#2BB673";
    g.beginPath();
    g.moveTo(1.25, 1.7);
    g.lineTo(1.6, 1.2);
    g.lineTo(1.95, 1.7);
    g.fill();
    g.fillStyle = p.trim;
    g.fillRect(1.1, 3.3, 1.3, 0.06);
    box(g, 1.2, 3.3, 0.08, 0.7, "#C9A227", 0.03);
    box(g, 2.2, 3.3, 0.08, 0.7, "#C9A227", 0.03);
  },
  bakery(g) {
    // A chalk menu board over an oven.
    box(g, 0.25, 0.4, 1.9, 1.3, "#2F3B33", 0.06);
    g.save();
    g.scale(0.01, 0.01);
    g.fillStyle = "#F7F4EF";
    g.font = "bold 26px system-ui, sans-serif";
    g.fillText("CAKES", 45, 85);
    g.fillText("BREAD", 45, 130);
    g.restore();
    box(g, 0.1, 2.0, 2.2, 2.0, "#8A8F99", 0.06);
    box(g, 0.35, 2.35, 1.7, 1.1, "#3B3F4A", 0.05);
    g.fillStyle = "rgba(255,158,64,0.6)";
    g.fillRect(0.45, 3.0, 1.5, 0.35);
    for (const x of [0.6, 1.2, 1.8]) {
      g.beginPath();
      g.arc(x, 2.17, 0.07, 0, Math.PI * 2);
      g.fillStyle = "#3B3F4A";
      g.fill();
    }
  },
  space(g) {
    // A porthole onto the Earth, and a panel of lights.
    g.beginPath();
    g.arc(1.2, 1.2, 0.95, 0, Math.PI * 2);
    g.fillStyle = "#C9D1DB";
    g.fill();
    g.beginPath();
    g.arc(1.2, 1.2, 0.78, 0, Math.PI * 2);
    g.fillStyle = "#050814";
    g.fill();
    g.beginPath();
    g.arc(1.45, 1.5, 0.42, 0, Math.PI * 2);
    g.fillStyle = "#2B7FFF";
    g.fill();
    g.fillStyle = "#2BB673";
    g.beginPath();
    g.ellipse(1.35, 1.4, 0.15, 0.1, 0.5, 0, Math.PI * 2);
    g.fill();
    box(g, 0.25, 2.7, 1.9, 1.3, "#38406B", 0.05);
    ["#5EE6C8", "#FFD23F", "#E63946", "#5EE6C8", "#2B7FFF", "#FFD23F"].forEach((c, k) => {
      g.beginPath();
      g.arc(0.55 + (k % 3) * 0.65, 3.05 + Math.floor(k / 3) * 0.55, 0.12, 0, Math.PI * 2);
      g.fillStyle = c;
      g.fill();
    });
  },
};

const SIGNS: Record<LocationId, string> = {
  kitchen: "THE KITCHEN",
  warehouse: "WAREHOUSE 7",
  toyroom: "THE TOY ROOM",
  museum: "MUSEUM OF STACKING",
  bakery: "THE BAKERY",
  space: "STATION PANIC-1",
};

/** Draw the backdrop for a location into `g` (the whole canvas). */
export function drawScenery(g: G, location: LocationId, at: SceneLayout) {
  const p = PALETTES[location];
  const { w, h } = at;
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, p.wall2);
  grad.addColorStop(0.7, p.wall);
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);

  // The wall's pattern.
  g.save();
  switch (location) {
    case "kitchen": {
      g.strokeStyle = "rgba(184,70,12,0.08)";
      g.lineWidth = 1;
      const tile = at.scale * 0.5;
      for (let y = at.groundY; y > at.beltBottom; y -= tile) for (let x = 0; x < w; x += tile) g.strokeRect(x, y - tile, tile, tile);
      break;
    }
    case "warehouse":
      g.fillStyle = "rgba(46,42,79,0.05)";
      for (let x = 0; x < w; x += at.scale * 0.9) g.fillRect(x, 0, 2, h);
      break;
    case "toyroom":
      g.fillStyle = "rgba(43,127,255,0.1)";
      for (let k = 0; k < 40; k++) star(g, (((k * 97) % 100) / 100) * w, (((k * 53) % 100) / 100) * at.groundY, 5 + (k % 3) * 3);
      break;
    case "museum":
      g.fillStyle = "rgba(46,42,79,0.04)";
      g.fillRect(0, at.floorY - at.scale * 1.1, w, at.scale * 0.08);
      break;
    case "bakery":
      ["#FF9EBB", "#FFD23F", "#9BE3D0"].forEach((c, k) => {
        g.fillStyle = c;
        for (let x = k * 40; x < w; x += 120) {
          g.beginPath();
          g.moveTo(x, at.beltBottom + 14);
          g.lineTo(x + 30, at.beltBottom + 14);
          g.lineTo(x + 15, at.beltBottom + 40);
          g.closePath();
          g.fill();
        }
      });
      break;
    case "space":
      g.fillStyle = "#FFFFFF";
      for (let k = 0; k < 90; k++) {
        g.globalAlpha = 0.3 + ((k * 13) % 7) / 10;
        const s = k % 5 ? 2 : 3;
        g.fillRect((((k * 7919) % 1000) / 1000) * w, (((k * 104729) % 1000) / 1000) * at.groundY, s, s);
      }
      g.globalAlpha = 1;
      break;
  }
  g.restore();

  // The floor far below the platform.
  g.fillStyle = p.floor;
  g.fillRect(0, at.groundY, w, h - at.groundY);
  g.fillStyle = "rgba(46,42,79,0.14)";
  g.fillRect(0, at.groundY, w, 4);

  // On a tall screen there's wall above the belt: the location's sign hangs there.
  if (at.beltTop > 120) {
    const sw = Math.min(w * 0.72, 380);
    const sh = Math.min(64, at.beltTop * 0.32);
    const sx = (w - sw) / 2;
    const sy = at.beltTop * 0.42 - sh / 2;
    g.strokeStyle = INK;
    g.lineWidth = 2;
    for (const x of [sx + sw * 0.15, sx + sw * 0.85]) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, sy);
      g.stroke();
    }
    box(g, sx, sy, sw, sh, p.trim, 3);
    g.fillStyle = location === "space" ? "#141B33" : "#FFFFFF";
    g.font = `900 ${Math.round(sh * 0.42)}px ${canvasFont.family}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(SIGNS[location], w / 2, sy + sh / 2 + 1, sw - 16);
  }

  // Props in the free wall either side.
  const top = at.beltBottom + 16;
  const bottom = at.floorY;
  const zh = bottom - top;
  for (const [x0, zw] of [
    [0, at.left],
    [at.right, w - at.right],
  ] as const) {
    if (zw < 70 || zh < 100) continue;
    const k = Math.min((zw - 16) / 2.4, zh / 4);
    g.save();
    g.translate(x0 + (zw - 2.4 * k) / 2, bottom - 4 * k);
    g.scale(k, k);
    PROPS[location](g, p);
    g.restore();
  }
}

function star(g: G, x: number, y: number, r: number) {
  g.beginPath();
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2 - Math.PI / 2;
    const d = k % 2 ? r * 0.45 : r;
    if (k) g.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
    else g.moveTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
  }
  g.closePath();
  g.fill();
}
