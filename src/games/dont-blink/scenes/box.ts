// A room seen from a camera high on the far wall's opposite side: one-point perspective. The back wall, the two
// side walls, the ceiling and the floor, each painted in its own way.
import { line, poly, rect, type G } from "./paint";

export interface Box {
  /** The back wall: left, top, right, bottom (the floor line). */
  back: readonly [number, number, number, number];
  ceiling: string;
  wall: string;
  side: string;
  floor: string;
  /** A wainscot (lower wall panelling) on the back and side walls: its height above the floor, and colour. */
  wainscot?: { h: number; color: string };
  /** The floor's pattern. */
  pattern?: "checks" | "planks" | "flags" | "concrete" | "carpet";
  checks?: readonly [string, string];
  /** Vertical stripes in the wallpaper. */
  stripes?: string;
}

const W = 640;
const H = 400;

/** Where a point on the back wall's floor line projects to at the front edge (for perspective lines). */
function toFront(b: Box["back"], x: number): number {
  const [x0, , x1] = b;
  const k = (x - x0) / (x1 - x0);
  return -60 + k * (W + 120);
}

export function paintBox(g: G, b: Box) {
  const [x0, y0, x1, y1] = b.back;
  // Ceiling, side walls, back wall, floor.
  poly(g, [
    [0, 0],
    [W, 0],
    [x1, y0],
    [x0, y0],
  ], b.ceiling);
  poly(g, [
    [0, 0],
    [x0, y0],
    [x0, y1],
    [0, H],
  ], b.side);
  poly(g, [
    [W, 0],
    [x1, y0],
    [x1, y1],
    [W, H],
  ], b.side);
  rect(g, x0, y0, x1 - x0, y1 - y0, b.wall);
  if (b.stripes) {
    for (let x = x0 + 10; x < x1; x += 20) rect(g, x, y0, 6, y1 - y0, b.stripes);
  }
  poly(g, [
    [0, H],
    [x0, y1],
    [x1, y1],
    [W, H],
  ], b.floor);

  // Floor pattern, converging on the back wall.
  g.save();
  g.beginPath();
  g.moveTo(0, H);
  g.lineTo(x0, y1);
  g.lineTo(x1, y1);
  g.lineTo(W, H);
  g.closePath();
  g.clip();
  const rows = [0, 0.1, 0.22, 0.37, 0.56, 0.79, 1];
  const yAt = (k: number) => y1 + (H - y1) * k;
  if (b.pattern === "checks" && b.checks) {
    const cols = 12;
    for (let r = 0; r < rows.length - 1; r++) {
      for (let c = 0; c < cols; c++) {
        const ya = yAt(rows[r]!);
        const yb = yAt(rows[r + 1]!);
        const xa = (ka: number, y: number) => {
          const top = x0 + ((x1 - x0) * c) / cols + ((x1 - x0) * ka) / cols;
          const bottom = toFront(b.back, top);
          const t = (y - y1) / (H - y1);
          return top + (bottom - top) * t;
        };
        poly(g, [
          [xa(0, ya), ya],
          [xa(1, ya), ya],
          [xa(1, yb), yb],
          [xa(0, yb), yb],
        ], (r + c) % 2 ? b.checks[0] : b.checks[1]);
      }
    }
  } else {
    const color = b.pattern === "planks" ? "rgba(0,0,0,0.28)" : b.pattern === "flags" ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.14)";
    const n = b.pattern === "planks" ? 14 : b.pattern === "flags" ? 8 : b.pattern === "carpet" ? 0 : 6;
    for (let c = 0; c <= n; c++) {
      const top = x0 + ((x1 - x0) * c) / n;
      line(g, top, y1, toFront(b.back, top), H, color, 1.2);
    }
    if (b.pattern === "flags" || b.pattern === "concrete") for (const k of rows.slice(1, -1)) line(g, 0, yAt(k), W, yAt(k), color, 1);
  }
  g.restore();

  // Wainscot.
  if (b.wainscot) {
    const { h, color } = b.wainscot;
    rect(g, x0, y1 - h, x1 - x0, h, color);
    line(g, x0, y1 - h, x1, y1 - h, "rgba(255,255,255,0.12)", 2);
    poly(g, [
      [0, H - h * 1.9],
      [x0, y1 - h],
      [x0, y1],
      [0, H],
    ], color);
    poly(g, [
      [W, H - h * 1.9],
      [x1, y1 - h],
      [x1, y1],
      [W, H],
    ], color);
  }
  // Corners and the skirting.
  line(g, x0, y0, x0, y1, "rgba(0,0,0,0.45)", 2);
  line(g, x1, y0, x1, y1, "rgba(0,0,0,0.45)", 2);
  line(g, x0, y1, x1, y1, "rgba(0,0,0,0.55)", 3);
  line(g, 0, H, x0, y1, "rgba(0,0,0,0.4)", 2);
  line(g, W, H, x1, y1, "rgba(0,0,0,0.4)", 2);
}

/** Depth shading: darker toward the edges of the picture (a cheap ambient occlusion), drawn over the room. */
export function corners(g: G, amount = 0.5) {
  const grad = g.createRadialGradient(W / 2, H * 0.55, H * 0.25, W / 2, H * 0.55, W * 0.62);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, `rgba(0,0,0,${amount})`);
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
}
