// Every item's picture (Plan/11-panic-stack.md §9): bright, chunky, toy-like, with thick outlines, and
// convincing (the lie only works if the safe really looks heavy). Drawn in metres around the item's centre,
// y down. The pictures never change with the truth: only the tells do (the vase's crack, the paperweight's
// paper clips, the duck's glue).
import type { ItemId } from "../core/items";

export const INK = "#2E2A4F";
export const LINE = 0.035;

/**
 * The display font for words drawn on the canvas. A canvas can't read `var(--font-…)`, so the renderer
 * resolves the family from the page's styles and puts it here.
 */
export const canvasFont = { family: "system-ui, sans-serif" };

export interface SpriteOpts {
  w: number;
  h: number;
  /** Seconds, for little animations (drips, sheen). */
  t: number;
  /** Per item, for variety (a toy block's letter). */
  seed: number;
}

type G = CanvasRenderingContext2D;

export function rr(g: G, x: number, y: number, w: number, h: number, r: number) {
  const k = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + k, y);
  g.lineTo(x + w - k, y);
  g.quadraticCurveTo(x + w, y, x + w, y + k);
  g.lineTo(x + w, y + h - k);
  g.quadraticCurveTo(x + w, y + h, x + w - k, y + h);
  g.lineTo(x + k, y + h);
  g.quadraticCurveTo(x, y + h, x, y + h - k);
  g.lineTo(x, y + k);
  g.quadraticCurveTo(x, y, x + k, y);
  g.closePath();
}

function paint(g: G, fill: string, line = LINE) {
  g.fillStyle = fill;
  g.fill();
  g.lineWidth = line;
  g.strokeStyle = INK;
  g.lineJoin = "round";
  g.lineCap = "round";
  g.stroke();
}

/** Words in metres: drawn a hundred times bigger and scaled down (tiny font sizes misbehave). */
export function text(g: G, words: string, x: number, y: number, size: number, weight = 900) {
  g.save();
  g.translate(x, y);
  g.scale(0.01, 0.01);
  g.font = `${weight} ${size * 100}px ${canvasFont.family}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(words, 0, 0);
  g.restore();
}

function line(g: G, pts: Array<[number, number]>, width = LINE * 0.7, color = INK) {
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.lineWidth = width;
  g.strokeStyle = color;
  g.lineCap = "round";
  g.lineJoin = "round";
  g.stroke();
}

function dot(g: G, x: number, y: number, r: number, fill: string, stroke = false) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fillStyle = fill;
  g.fill();
  if (stroke) {
    g.lineWidth = LINE * 0.6;
    g.strokeStyle = INK;
    g.stroke();
  }
}

/** A soft highlight along the top-left. */
function shine(g: G, x: number, y: number, w: number, h: number, alpha = 0.35) {
  g.fillStyle = `rgba(255,255,255,${alpha})`;
  rr(g, x, y, w, h, Math.min(w, h) / 2);
  g.fill();
}

const BLOCK_COLOURS = ["#E63946", "#2B7FFF", "#FFD23F", "#2BB673", "#9B5DE5"];
const BLOCK_LETTERS = "ABCPSK";

export const SPRITES: Record<ItemId, (g: G, o: SpriteOpts) => void> = {
  brick(g, { w, h }) {
    rr(g, -w / 2, -h / 2, w, h, 0.05);
    paint(g, "#C8553D");
    // Mortar lines: two courses.
    g.save();
    rr(g, -w / 2, -h / 2, w, h, 0.05);
    g.clip();
    line(g, [[-w / 2, 0], [w / 2, 0]], 0.025, "#8E3A2A");
    line(g, [[-w * 0.1, -h / 2], [-w * 0.1, 0]], 0.025, "#8E3A2A");
    line(g, [[w * 0.22, 0], [w * 0.22, h / 2]], 0.025, "#8E3A2A");
    line(g, [[-w * 0.36, 0], [-w * 0.36, h / 2]], 0.025, "#8E3A2A");
    g.restore();
    shine(g, -w / 2 + 0.06, -h / 2 + 0.05, w * 0.45, 0.05, 0.3);
  },
  bowling(g, { w }) {
    const r = w / 2;
    g.beginPath();
    g.arc(0, 0, r, 0, Math.PI * 2);
    paint(g, "#2B2D6E");
    // The finger holes.
    dot(g, -r * 0.25, -r * 0.35, r * 0.11, "#121334");
    dot(g, r * 0.08, -r * 0.42, r * 0.11, "#121334");
    dot(g, -r * 0.05, -r * 0.08, r * 0.13, "#121334");
    g.beginPath();
    g.arc(-r * 0.3, -r * 0.3, r * 0.55, Math.PI * 1.05, Math.PI * 1.45);
    g.lineWidth = r * 0.12;
    g.strokeStyle = "rgba(255,255,255,0.35)";
    g.stroke();
  },
  safe(g, { w, h }) {
    rr(g, -w / 2, -h / 2, w, h, 0.06);
    paint(g, "#5B6675");
    // A heavy door, a dial, a handle, rivets: it looks like it weighs a ton.
    rr(g, -w / 2 + 0.08, -h / 2 + 0.08, w - 0.16, h - 0.16, 0.04);
    paint(g, "#6F7B8B", LINE * 0.8);
    const r = Math.min(w, h) * 0.17;
    g.beginPath();
    g.arc(-w * 0.08, 0, r, 0, Math.PI * 2);
    paint(g, "#3E4652", LINE * 0.7);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      line(g, [[-w * 0.08 + Math.cos(a) * r * 0.65, Math.sin(a) * r * 0.65], [-w * 0.08 + Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85]], 0.012, "#D7DCE2");
    }
    dot(g, -w * 0.08, 0, r * 0.25, "#D7DCE2");
    rr(g, w * 0.2, -h * 0.16, 0.06, h * 0.32, 0.03);
    paint(g, "#D7DCE2", LINE * 0.6);
    for (const [x, y] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) dot(g, x * (w / 2 - 0.045), y * (h / 2 - 0.045), 0.018, "#AEB6C0");
    shine(g, -w / 2 + 0.1, -h / 2 + 0.1, w * 0.5, 0.04, 0.25);
  },
  feather(g, { w, h }) {
    // A big, soft, white feather: it looks like it weighs nothing.
    g.beginPath();
    g.moveTo(-w / 2, h * 0.18);
    g.bezierCurveTo(-w * 0.2, -h * 0.7, w * 0.3, -h * 0.65, w / 2, -h * 0.05);
    g.bezierCurveTo(w * 0.25, h * 0.45, -w * 0.2, h * 0.55, -w / 2, h * 0.18);
    g.closePath();
    paint(g, "#FFFFFF");
    g.save();
    g.clip();
    for (let k = 1; k < 9; k++) {
      const x = -w / 2 + (k / 9) * w;
      line(g, [[x, h * 0.02], [x + w * 0.06, -h * 0.4]], 0.01, "#C9D3F0");
      line(g, [[x, h * 0.02], [x + w * 0.05, h * 0.42]], 0.01, "#C9D3F0");
    }
    g.restore();
    // The quill.
    g.beginPath();
    g.moveTo(-w / 2 - 0.02, h * 0.22);
    g.quadraticCurveTo(0, h * 0.05, w / 2, -h * 0.05);
    g.lineWidth = 0.03;
    g.strokeStyle = INK;
    g.stroke();
    // A couple of notches in the vanes.
    line(g, [[w * 0.05, -h * 0.28], [w * 0.1, -h * 0.12]], 0.02, INK);
    line(g, [[-w * 0.18, h * 0.34], [-w * 0.13, h * 0.17]], 0.02, INK);
  },
  box(g, { w, h }) {
    rr(g, -w / 2, -h / 2, w, h, 0.03);
    paint(g, "#C9955C");
    rr(g, -0.06, -h / 2, 0.12, h, 0);
    g.fillStyle = "#E6C79A";
    g.fill();
    line(g, [[-w / 2, -h / 2 + 0.12], [w / 2, -h / 2 + 0.12]], 0.015, "#8C6339");
    // "This side up" arrows.
    for (const x of [-w * 0.3, w * 0.3]) {
      line(g, [[x, h * 0.2], [x, -h * 0.12]], 0.025, "#7A4F26");
      line(g, [[x - 0.05, -h * 0.04], [x, -h * 0.13], [x + 0.05, -h * 0.04]], 0.025, "#7A4F26");
    }
    rr(g, -w / 2, -h / 2, w, h, 0.03);
    g.lineWidth = LINE;
    g.strokeStyle = INK;
    g.stroke();
  },
  duck(g, { w, h, t }) {
    // Body.
    g.beginPath();
    g.ellipse(-w * 0.04, h * 0.14, w * 0.47, h * 0.33, 0, 0, Math.PI * 2);
    paint(g, "#FFD23F");
    // Head and beak.
    g.beginPath();
    g.arc(w * 0.12, -h * 0.2, h * 0.24, 0, Math.PI * 2);
    paint(g, "#FFD23F");
    g.beginPath();
    g.moveTo(w * 0.3, -h * 0.22);
    g.quadraticCurveTo(w * 0.52, -h * 0.2, w * 0.42, -h * 0.08);
    g.quadraticCurveTo(w * 0.34, -h * 0.06, w * 0.29, -h * 0.12);
    g.closePath();
    paint(g, "#FF8A3D", LINE * 0.7);
    dot(g, w * 0.17, -h * 0.27, 0.03, INK);
    // A wing.
    g.beginPath();
    g.ellipse(-w * 0.12, h * 0.12, w * 0.2, h * 0.12, -0.3, 0, Math.PI * 2);
    paint(g, "#F5C21A", LINE * 0.6);
    // The tell: it's glossy with glue, and a drip hangs off its tail.
    g.fillStyle = "rgba(255,255,255,0.55)";
    g.beginPath();
    g.ellipse(-w * 0.2, -h * 0.02, w * 0.12, h * 0.04, -0.2, 0, Math.PI * 2);
    g.fill();
    const drip = 0.05 + 0.03 * (0.5 + 0.5 * Math.sin(t * 2.2));
    g.beginPath();
    g.moveTo(-w * 0.46, h * 0.18);
    g.quadraticCurveTo(-w * 0.5, h * 0.18 + drip, -w * 0.45, h * 0.2 + drip);
    g.quadraticCurveTo(-w * 0.4, h * 0.2, -w * 0.42, h * 0.16);
    g.fillStyle = "rgba(220,240,255,0.85)";
    g.fill();
    g.lineWidth = 0.01;
    g.strokeStyle = "rgba(46,42,79,0.5)";
    g.stroke();
  },
  jelly(g, { w, h }) {
    // A firm-looking, glossy jelly with a cherry.
    g.beginPath();
    g.moveTo(-w / 2 + 0.06, h / 2);
    g.lineTo(-w / 2 + 0.02, -h / 2 + 0.12);
    g.quadraticCurveTo(-w / 2 + 0.02, -h / 2, -w / 2 + 0.14, -h / 2);
    g.lineTo(w / 2 - 0.14, -h / 2);
    g.quadraticCurveTo(w / 2 - 0.02, -h / 2, w / 2 - 0.02, -h / 2 + 0.12);
    g.lineTo(w / 2 - 0.06, h / 2);
    g.closePath();
    paint(g, "#E8445A");
    for (const x of [-w * 0.2, w * 0.05, w * 0.28]) line(g, [[x, -h / 2 + 0.06], [x - 0.02, h / 2 - 0.04]], 0.02, "#C22F45");
    shine(g, -w / 2 + 0.08, -h / 2 + 0.06, 0.06, h * 0.6, 0.45);
    dot(g, w * 0.1, -h / 2 - 0.05, 0.065, "#B5172D", true);
    line(g, [[w * 0.1, -h / 2 - 0.1], [w * 0.17, -h / 2 - 0.2]], 0.015, "#2B7A3F");
  },
  ice(g, { w, h }) {
    rr(g, -w / 2, -h / 2, w, h, 0.08);
    paint(g, "rgba(182,227,255,0.9)");
    rr(g, -w / 2 + 0.07, -h / 2 + 0.07, w - 0.14, h - 0.14, 0.05);
    g.fillStyle = "rgba(230,248,255,0.8)";
    g.fill();
    line(g, [[-w * 0.28, -h * 0.3], [-w * 0.05, -h * 0.3]], 0.03, "#FFFFFF");
    line(g, [[-w * 0.3, -h * 0.12], [-w * 0.3, h * 0.1]], 0.03, "#FFFFFF");
    line(g, [[w * 0.15, h * 0.2], [w * 0.28, h * 0.08]], 0.02, "#8CCBF2");
  },
  balloon(g, { w, h }) {
    const rx = w / 2;
    const ry = (h / 2) * 0.92;
    g.beginPath();
    g.ellipse(0, -h * 0.04, rx, ry, 0, 0, Math.PI * 2);
    paint(g, "#E63946");
    g.beginPath();
    g.moveTo(-0.04, ry - h * 0.04);
    g.lineTo(0.04, ry - h * 0.04);
    g.lineTo(0, ry + 0.02);
    g.closePath();
    paint(g, "#C1121F", LINE * 0.6);
    g.beginPath();
    g.ellipse(-rx * 0.38, -ry * 0.42, rx * 0.18, ry * 0.28, -0.5, 0, Math.PI * 2);
    g.fillStyle = "rgba(255,255,255,0.45)";
    g.fill();
  },
  vase(g, { w, h }) {
    g.beginPath();
    g.moveTo(-w * 0.3, h / 2);
    g.bezierCurveTo(-w * 0.62, h * 0.15, -w * 0.62, -h * 0.12, -w * 0.22, -h * 0.3);
    g.lineTo(-w * 0.2, -h * 0.42);
    g.lineTo(-w * 0.3, -h / 2);
    g.lineTo(w * 0.3, -h / 2);
    g.lineTo(w * 0.2, -h * 0.42);
    g.lineTo(w * 0.22, -h * 0.3);
    g.bezierCurveTo(w * 0.62, -h * 0.12, w * 0.62, h * 0.15, w * 0.3, h / 2);
    g.closePath();
    paint(g, "#F7F4EF");
    g.save();
    g.clip();
    // Blue-and-white bands and a flower.
    g.fillStyle = "#2F5DA8";
    g.fillRect(-w, h * 0.32, w * 2, 0.04);
    g.fillRect(-w, -h * 0.26, w * 2, 0.03);
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      dot(g, Math.cos(a) * 0.055, h * 0.05 + Math.sin(a) * 0.055, 0.035, "#2F5DA8");
    }
    dot(g, 0, h * 0.05, 0.025, "#F7F4EF");
    g.restore();
    // The tell: a hairline crack.
    line(g, [[w * 0.16, -h * 0.28], [w * 0.22, -h * 0.17], [w * 0.15, -h * 0.08], [w * 0.21, h * 0.02]], 0.012, INK);
  },
  cake(g, { w, h }) {
    rr(g, -w / 2, -h / 2 + h * 0.18, w, h * 0.82, 0.05);
    paint(g, "#F3D2A2");
    line(g, [[-w / 2, h * 0.12], [w / 2, h * 0.12]], 0.025, "#E07A9A");
    // Pink icing with drips.
    g.beginPath();
    g.moveTo(-w / 2, -h / 2 + h * 0.2);
    g.lineTo(-w / 2, -h / 2 + 0.06);
    g.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + 0.06, -h / 2);
    g.lineTo(w / 2 - 0.06, -h / 2);
    g.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + 0.06);
    g.lineTo(w / 2, -h / 2 + h * 0.2);
    for (let k = 5; k >= 0; k--) {
      const x = -w / 2 + (k / 5) * w;
      g.quadraticCurveTo(x + w * 0.05, -h / 2 + h * (k % 2 ? 0.42 : 0.3), x, -h / 2 + h * 0.2);
    }
    g.closePath();
    paint(g, "#FF9EBB");
    dot(g, 0, -h / 2 - 0.05, 0.06, "#E63946", true);
  },
  magnet(g, { w, h }) {
    // A plain painted paperweight on a felt base...
    rr(g, -w / 2, -h / 2, w, h * 0.85, 0.06);
    paint(g, "#4D6CA8");
    rr(g, -w / 2, h / 2 - h * 0.18, w, h * 0.18, 0.03);
    paint(g, "#2E7D4F", LINE * 0.7);
    shine(g, -w / 2 + 0.06, -h / 2 + 0.05, w * 0.5, 0.05, 0.3);
    // ...with paper clips stuck to its side (the tell).
    for (const [y, a] of [
      [-h * 0.1, -0.3],
      [h * 0.12, 0.25],
    ] as const) {
      g.save();
      g.translate(w / 2 - 0.02, y);
      g.rotate(a);
      rr(g, 0, -0.03, 0.14, 0.06, 0.03);
      g.lineWidth = 0.014;
      g.strokeStyle = "#B8C0CC";
      g.stroke();
      rr(g, 0.02, -0.015, 0.09, 0.03, 0.015);
      g.stroke();
      g.restore();
    }
  },
  plate(g, { w, h }) {
    g.beginPath();
    g.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
    paint(g, "#FFFFFF");
    g.beginPath();
    g.ellipse(0, -h * 0.08, w * 0.42, h * 0.26, 0, 0, Math.PI * 2);
    g.lineWidth = 0.02;
    g.strokeStyle = "#2B7FFF";
    g.stroke();
  },
  crate(g, { w, h }) {
    rr(g, -w / 2, -h / 2, w, h, 0.03);
    paint(g, "#D69A52");
    g.save();
    rr(g, -w / 2, -h / 2, w, h, 0.03);
    g.clip();
    for (let k = 1; k < 4; k++) line(g, [[-w / 2, -h / 2 + (k * h) / 4], [w / 2, -h / 2 + (k * h) / 4]], 0.015, "#A86F33");
    g.restore();
    rr(g, -w / 2 + 0.05, -h / 2 + 0.05, w - 0.1, h - 0.1, 0.02);
    g.lineWidth = 0.035;
    g.strokeStyle = "#8C5A2B";
    g.stroke();
    line(g, [[-w / 2 + 0.07, h / 2 - 0.07], [w / 2 - 0.07, -h / 2 + 0.07]], 0.05, "#8C5A2B");
    rr(g, -w / 2, -h / 2, w, h, 0.03);
    g.lineWidth = LINE;
    g.strokeStyle = INK;
    g.stroke();
  },
  anvil(g, { w, h }) {
    g.beginPath();
    g.moveTo(-w / 2, -h / 2);
    g.lineTo(w / 2 - 0.05, -h / 2);
    g.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + 0.05);
    g.lineTo(w / 2, -h / 2 + h * 0.2);
    g.quadraticCurveTo(w * 0.2, -h / 2 + h * 0.25, w * 0.15, -h / 2 + h * 0.42);
    g.lineTo(w * 0.15, h * 0.2);
    g.lineTo(w * 0.3, h / 2);
    g.lineTo(-w * 0.3, h / 2);
    g.lineTo(-w * 0.15, h * 0.2);
    g.lineTo(-w * 0.15, -h / 2 + h * 0.42);
    g.quadraticCurveTo(-w * 0.32, -h / 2 + h * 0.3, -w / 2, -h / 2 + h * 0.36);
    g.closePath();
    paint(g, "#3B3F4A");
    shine(g, -w / 2 + 0.08, -h / 2 + 0.04, w * 0.6, 0.04, 0.25);
  },
  block(g, { w, h, seed }) {
    const colour = BLOCK_COLOURS[seed % BLOCK_COLOURS.length]!;
    rr(g, -w / 2, -h / 2, w, h, 0.05);
    paint(g, colour);
    rr(g, -w / 2 + 0.06, -h / 2 + 0.06, w - 0.12, h - 0.12, 0.04);
    g.fillStyle = "rgba(255,255,255,0.85)";
    g.fill();
    g.fillStyle = colour;
    text(g, BLOCK_LETTERS[seed % BLOCK_LETTERS.length]!, 0, h * 0.04, h * 0.58);
  },
  statue(g, { w, h }) {
    // A marble bust on a plinth.
    rr(g, -w / 2, h * 0.18, w, h * 0.32, 0.03);
    paint(g, "#E9E4DA");
    rr(g, -w * 0.4, h * 0.08, w * 0.8, h * 0.12, 0.02);
    paint(g, "#DAD3C6", LINE * 0.7);
    g.beginPath();
    g.moveTo(-w * 0.42, h * 0.08);
    g.quadraticCurveTo(-w * 0.4, -h * 0.12, -w * 0.12, -h * 0.14);
    g.lineTo(w * 0.12, -h * 0.14);
    g.quadraticCurveTo(w * 0.4, -h * 0.12, w * 0.42, h * 0.08);
    g.closePath();
    paint(g, "#F1EDE6");
    g.beginPath();
    g.ellipse(0, -h * 0.3, w * 0.24, h * 0.18, 0, 0, Math.PI * 2);
    paint(g, "#F1EDE6");
    // Curls.
    for (const [x, y] of [
      [-0.07, -0.42],
      [0.02, -0.45],
      [0.09, -0.4],
    ] as const)
      dot(g, x * w * 2, y * h, 0.04, "#E3DDD2", true);
    line(g, [[w * 0.04, -h * 0.3], [w * 0.1, -h * 0.26]], 0.015, "#9C968C");
  },
  loaf(g, { w, h }) {
    g.beginPath();
    g.moveTo(-w / 2, h / 2);
    g.lineTo(-w / 2, -h * 0.05);
    g.bezierCurveTo(-w / 2, -h * 0.65, w / 2, -h * 0.65, w / 2, -h * 0.05);
    g.lineTo(w / 2, h / 2);
    g.closePath();
    paint(g, "#D9923B");
    for (const x of [-w * 0.22, 0, w * 0.22]) line(g, [[x - 0.05, -h * 0.18], [x + 0.06, -h * 0.34]], 0.03, "#F3D29B");
    shine(g, -w / 2 + 0.08, -h * 0.28, w * 0.35, 0.04, 0.25);
  },
  cargo(g, { w, h }) {
    rr(g, -w / 2, -h / 2, w, h, 0.07);
    paint(g, "#9AA6B4");
    g.save();
    rr(g, -w / 2, -h / 2, w, h, 0.07);
    g.clip();
    // Hazard stripes along the bottom.
    g.fillStyle = "#FFD23F";
    g.fillRect(-w / 2, h / 2 - 0.12, w, 0.12);
    g.fillStyle = INK;
    for (let x = -w / 2 - 0.1; x < w / 2; x += 0.14) {
      g.beginPath();
      g.moveTo(x, h / 2);
      g.lineTo(x + 0.07, h / 2 - 0.12);
      g.lineTo(x + 0.13, h / 2 - 0.12);
      g.lineTo(x + 0.06, h / 2);
      g.closePath();
      g.fill();
    }
    g.restore();
    rr(g, -w * 0.3, -h * 0.28, w * 0.6, h * 0.3, 0.03);
    paint(g, "#C9D1DB", LINE * 0.6);
    g.fillStyle = INK;
    text(g, "CARGO", 0, -h * 0.13, h * 0.16);
    for (const x of [-1, 1]) dot(g, x * (w / 2 - 0.06), -h / 2 + 0.06, 0.018, "#5B6675");
  },
};

/** X-ray glasses (a belt power-up). */
export function drawGlasses(g: G, w: number) {
  const r = w * 0.2;
  for (const x of [-w * 0.23, w * 0.23]) {
    g.beginPath();
    g.arc(x, 0, r, 0, Math.PI * 2);
    paint(g, "#BFF7E8", LINE * 0.8);
    g.beginPath();
    for (let k = 0; k < 40; k++) {
      const a = k * 0.45;
      const d = (k / 40) * r * 0.85;
      if (k) g.lineTo(x + Math.cos(a) * d, Math.sin(a) * d);
      else g.moveTo(x, 0);
    }
    g.lineWidth = 0.012;
    g.strokeStyle = "#0F7366";
    g.stroke();
  }
  line(g, [[-w * 0.03, 0], [w * 0.03, 0]], LINE * 0.8);
  line(g, [[-w * 0.43, -r * 0.4], [-w / 2, -r]], LINE * 0.8);
  line(g, [[w * 0.43, -r * 0.4], [w / 2, -r]], LINE * 0.8);
}

/** The cat (y down, centred on its body; dir 1 faces right). */
export function drawCat(g: G, sitting: boolean, t: number, dir: number) {
  g.save();
  g.scale(dir, 1);
  const fur = "#F29E4C";
  // Tail.
  const sway = Math.sin(t * 3) * 0.06;
  g.beginPath();
  g.moveTo(-0.32, 0.05);
  g.quadraticCurveTo(-0.55, -0.1 + sway, -0.48, -0.32 + sway);
  g.lineWidth = 0.08;
  g.strokeStyle = INK;
  g.lineCap = "round";
  g.stroke();
  g.lineWidth = 0.05;
  g.strokeStyle = fur;
  g.stroke();
  // Body.
  rr(g, -0.36, sitting ? -0.14 : -0.12, 0.66, sitting ? 0.36 : 0.3, 0.14);
  paint(g, fur);
  // Legs.
  if (!sitting) {
    const step = Math.sin(t * 10) * 0.04;
    for (const [x, s] of [
      [-0.24, step],
      [-0.1, -step],
      [0.12, step],
      [0.24, -step],
    ] as const) {
      rr(g, x - 0.035 + s, 0.12, 0.07, 0.11, 0.03);
      paint(g, fur, LINE * 0.6);
    }
  }
  // Stripes.
  for (const x of [-0.18, -0.04, 0.1]) line(g, [[x, -0.1], [x + 0.03, 0.02]], 0.025, "#C0702A");
  // Head.
  g.beginPath();
  g.arc(0.3, -0.18, 0.17, 0, Math.PI * 2);
  paint(g, fur);
  for (const x of [0.2, 0.36]) {
    g.beginPath();
    g.moveTo(x - 0.06, -0.3);
    g.lineTo(x, -0.42);
    g.lineTo(x + 0.06, -0.3);
    g.closePath();
    paint(g, fur, LINE * 0.7);
  }
  dot(g, 0.36, -0.2, 0.022, INK);
  dot(g, 0.25, -0.2, 0.022, INK);
  dot(g, 0.42, -0.14, 0.02, "#FF9EBB");
  line(g, [[0.43, -0.12], [0.55, -0.1]], 0.01);
  line(g, [[0.43, -0.14], [0.55, -0.16]], 0.01);
  g.restore();
}

/** The bird: a plump pigeon (y down, centred). */
export function drawBird(g: G, flying: boolean, t: number, dir: number) {
  g.save();
  g.scale(dir, 1);
  g.beginPath();
  g.ellipse(0, 0.02, 0.22, 0.16, 0, 0, Math.PI * 2);
  paint(g, "#8E9AAF");
  g.beginPath();
  g.arc(0.15, -0.12, 0.1, 0, Math.PI * 2);
  paint(g, "#7C88A0");
  g.beginPath();
  g.moveTo(0.24, -0.13);
  g.lineTo(0.33, -0.1);
  g.lineTo(0.24, -0.07);
  g.closePath();
  paint(g, "#F2A541", LINE * 0.5);
  dot(g, 0.18, -0.14, 0.018, INK);
  line(g, [[0.06, -0.04], [0.12, 0.04]], 0.03, "#5DBB9B");
  const flap = flying ? Math.sin(t * 22) * 0.18 : 0;
  g.beginPath();
  g.ellipse(-0.04, -0.02 - flap, 0.15, 0.07, -0.3 - flap * 2, 0, Math.PI * 2);
  paint(g, "#6F7B94", LINE * 0.7);
  if (!flying) {
    line(g, [[-0.04, 0.17], [-0.04, 0.22]], 0.02, "#F2A541");
    line(g, [[0.05, 0.17], [0.05, 0.22]], 0.02, "#F2A541");
  }
  g.restore();
}
