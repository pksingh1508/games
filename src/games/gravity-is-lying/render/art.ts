// The characters and things, drawn with clean vector shapes (Plan/15-gravity-is-lying.md §9: bold
// silhouettes that read at any rotation). Each function draws around its own centre, upright;
// callers turn the context first.
import type { Dir } from "../core/gravity";
import { TURN } from "../core/gravity";
import { DANGER, GOLD, INK, ISAAC_RED, LEAF, SCARF } from "./palette";

type G = CanvasRenderingContext2D;

export function roundRect(g: G, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + rr, y);
  g.arcTo(x + w, y, x + w, y + h, rr);
  g.arcTo(x + w, y + h, x, y + h, rr);
  g.arcTo(x, y + h, x, y, rr);
  g.arcTo(x, y, x + w, y, rr);
  g.closePath();
}

/** Newt: a small round explorer with a big helmet-lamp eye (12 px across, drawn a little larger). */
export function drawNewt(g: G, facing: 1 | -1, t: number, opts: { squash?: number; blink?: boolean; dead?: boolean } = {}) {
  const squash = opts.squash ?? 0;
  g.save();
  g.scale(facing * (1 + squash * 0.25), 1 - squash * 0.25);
  // Feet.
  g.fillStyle = INK;
  const step = Math.sin(t * 14) * 1.2;
  g.fillRect(-4.5, 4.5, 3.4, 2.6 + step * 0.3);
  g.fillRect(1.1, 4.5, 3.4, 2.6 - step * 0.3);
  // Body.
  g.fillStyle = "#2A9D8F";
  roundRect(g, -6.5, -7, 13, 12.5, 5.5);
  g.fill();
  g.lineWidth = 1.2;
  g.strokeStyle = INK;
  g.stroke();
  // Face plate.
  g.fillStyle = "#F1FAEE";
  roundRect(g, -2.5, -4.6, 8.4, 6.6, 3);
  g.fill();
  // Eye(s).
  g.fillStyle = INK;
  if (opts.dead) {
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(0.5, -3);
    g.lineTo(3.5, 0);
    g.moveTo(3.5, -3);
    g.lineTo(0.5, 0);
    g.stroke();
  } else if (opts.blink) g.fillRect(1, -1.6, 3.6, 0.9);
  else {
    g.beginPath();
    g.arc(2.6, -1.4, 1.5, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#fff";
    g.fillRect(2.9, -2.3, 0.7, 0.7);
  }
  g.restore();
}

/** The scarf: thick, bright, and always telling the truth. */
export function drawScarf(g: G, points: ReadonlyArray<{ x: number; y: number }>) {
  if (points.length < 2) return;
  g.save();
  g.lineCap = "round";
  g.lineJoin = "round";
  g.strokeStyle = "#C58B00";
  g.lineWidth = 4.4;
  g.beginPath();
  g.moveTo(points[0]!.x, points[0]!.y);
  for (let i = 1; i < points.length; i++) g.lineTo(points[i]!.x, points[i]!.y);
  g.stroke();
  g.strokeStyle = SCARF;
  g.lineWidth = 3.2;
  g.stroke();
  // Stripes.
  g.strokeStyle = "#FB8500";
  g.lineWidth = 3.2;
  for (let i = 2; i < points.length - 1; i += 3) {
    g.beginPath();
    g.moveTo(points[i]!.x, points[i]!.y);
    g.lineTo(points[i + 1]!.x, points[i + 1]!.y);
    g.stroke();
  }
  g.restore();
}

/** Isaac, a pompous apple with a monocle. His leaf stands up when he's telling the truth, droops when he lies. */
export function drawIsaac(g: G, t: number, opts: { lying: boolean; talking: boolean }) {
  g.save();
  const bob = Math.sin(t * 2.2) * 1.2;
  g.translate(0, bob);
  // Body.
  g.fillStyle = ISAAC_RED;
  g.beginPath();
  g.moveTo(0, -7);
  g.bezierCurveTo(6, -11, 12, -4, 10, 3);
  g.bezierCurveTo(9, 9, 3, 11, 0, 9);
  g.bezierCurveTo(-3, 11, -9, 9, -10, 3);
  g.bezierCurveTo(-12, -4, -6, -11, 0, -7);
  g.fill();
  g.strokeStyle = "#8D1C25";
  g.lineWidth = 1.2;
  g.stroke();
  // Shine.
  g.fillStyle = "rgba(255,255,255,0.45)";
  g.beginPath();
  g.ellipse(-5, -3, 1.6, 3, 0.4, 0, Math.PI * 2);
  g.fill();
  // Stem.
  g.strokeStyle = "#6B4226";
  g.lineWidth = 1.6;
  g.beginPath();
  g.moveTo(0, -7);
  g.quadraticCurveTo(0.5, -10, 1.5, -12);
  g.stroke();
  // The leaf: the tell.
  g.save();
  g.translate(1.5, -11.5);
  g.rotate(opts.lying ? 1.9 : -0.55);
  g.fillStyle = LEAF;
  g.beginPath();
  g.moveTo(0, 0);
  g.quadraticCurveTo(4, -4, 9, -1);
  g.quadraticCurveTo(4, 3, 0, 0);
  g.fill();
  g.strokeStyle = "#2D6A4F";
  g.lineWidth = 0.7;
  g.beginPath();
  g.moveTo(0.5, 0);
  g.lineTo(7.5, -1);
  g.stroke();
  g.restore();
  // Face: eyes, a monocle, a moustache.
  g.fillStyle = INK;
  g.beginPath();
  g.arc(-3, 0, 1.2, 0, Math.PI * 2);
  g.arc(3.4, 0, 1.2, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = GOLD;
  g.lineWidth = 0.9;
  g.beginPath();
  g.arc(3.4, 0, 2.6, 0, Math.PI * 2);
  g.stroke();
  g.strokeStyle = INK;
  g.lineWidth = 1.3;
  const open = opts.talking ? Math.abs(Math.sin(t * 16)) * 1.6 : 0;
  g.beginPath();
  g.moveTo(-3.5, 4);
  g.quadraticCurveTo(-1.5, 2.8, 0.2, 4);
  g.quadraticCurveTo(2, 2.8, 4, 4);
  g.stroke();
  if (open > 0.2) {
    g.fillStyle = "#5C0F16";
    g.beginPath();
    g.ellipse(0.2, 5.6, 1.4, open * 0.8, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}

/** A golden apple. */
export function drawApple(g: G, t: number) {
  g.save();
  g.translate(0, Math.sin(t * 3) * 1.2);
  g.fillStyle = "rgba(244,180,0,0.2)";
  g.beginPath();
  g.arc(0, 0.5, 8 + Math.sin(t * 5) * 0.8, 0, Math.PI * 2);
  g.fill();
  // The body: an apple's shape, a dimple at the top.
  g.fillStyle = GOLD;
  g.beginPath();
  g.moveTo(0, -3.2);
  g.bezierCurveTo(2.4, -5.2, 5.6, -3.2, 5.2, 0.4);
  g.bezierCurveTo(4.8, 4, 2.4, 5.6, 0, 4.8);
  g.bezierCurveTo(-2.4, 5.6, -4.8, 4, -5.2, 0.4);
  g.bezierCurveTo(-5.6, -3.2, -2.4, -5.2, 0, -3.2);
  g.closePath();
  g.fill();
  g.strokeStyle = "#9A6B00";
  g.lineWidth = 0.9;
  g.stroke();
  g.fillStyle = "rgba(255,255,255,0.75)";
  g.beginPath();
  g.ellipse(-2.4, -1, 0.9, 1.7, 0.35, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#6B4226";
  g.lineWidth = 1.1;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(0, -3.2);
  g.lineTo(0.6, -6);
  g.stroke();
  g.fillStyle = LEAF;
  g.beginPath();
  g.ellipse(2.4, -5.4, 2.1, 1, -0.45, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

/** A lab dropper, its tip pointing the way its water falls (drawn pointing down; turn first). */
export function drawDropper(g: G, water: string) {
  // The rubber bulb.
  g.fillStyle = "#E76F51";
  g.beginPath();
  g.ellipse(0, -6.5, 3.4, 3, 0, 0, Math.PI * 2);
  g.fill();
  // The glass.
  g.fillStyle = "rgba(220,240,245,0.9)";
  g.strokeStyle = "#5C677D";
  g.lineWidth = 0.9;
  g.beginPath();
  g.moveTo(-2.2, -4);
  g.lineTo(2.2, -4);
  g.lineTo(2.2, 1.5);
  g.lineTo(0.6, 4.5);
  g.lineTo(-0.6, 4.5);
  g.lineTo(-2.2, 1.5);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = water;
  g.fillRect(-1.6, -1, 3.2, 2.4);
}

/** The portal: a ring that swirls. */
export function drawPortal(g: G, t: number) {
  g.save();
  for (let i = 0; i < 3; i++) {
    g.strokeStyle = i === 0 ? "#7B2CBF" : i === 1 ? "#C77DFF" : "#E0AAFF";
    g.lineWidth = 2.2 - i * 0.5;
    g.beginPath();
    const r = 7.5 - i * 2;
    g.arc(0, 0, r, t * (2 + i) + i, t * (2 + i) + i + Math.PI * 1.5);
    g.stroke();
  }
  g.fillStyle = "rgba(199,125,255,0.35)";
  g.beginPath();
  g.arc(0, 0, 3 + Math.sin(t * 4), 0, Math.PI * 2);
  g.fill();
  g.restore();
}

/** A lever on a plate; its handle points the way it sets gravity. Lit when that's the room's gravity. */
export function drawLever(g: G, dir: Dir, on: boolean) {
  g.save();
  g.fillStyle = on ? "#2A9D8F" : "#5C677D";
  roundRect(g, -6.5, -6.5, 13, 13, 3);
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = 1.1;
  g.stroke();
  g.rotate(TURN[dir]);
  // An arrow pointing "down" in its own frame, turned to its direction.
  g.fillStyle = on ? "#F1FAEE" : "#DDE3EA";
  g.beginPath();
  g.moveTo(0, 5);
  g.lineTo(-3.8, 0.5);
  g.lineTo(-1.3, 0.5);
  g.lineTo(-1.3, -4.5);
  g.lineTo(1.3, -4.5);
  g.lineTo(1.3, 0.5);
  g.lineTo(3.8, 0.5);
  g.closePath();
  g.fill();
  g.restore();
}

/** Spikes on a tile, pointing away from what they sit on ("down" here means: pointing down). */
export function drawSpikes(g: G, x: number, y: number, size: number, point: Dir) {
  g.save();
  g.translate(x + size / 2, y + size / 2);
  // Draw pointing up, then turn: pointing up = sitting on the floor.
  g.rotate(TURN[point] + Math.PI);
  g.fillStyle = DANGER;
  g.strokeStyle = "#7A0C1B";
  g.lineWidth = 0.9;
  const half = size / 2;
  for (let i = 0; i < 3; i++) {
    const x0 = -half + (i * size) / 3;
    g.beginPath();
    g.moveTo(x0, half);
    g.lineTo(x0 + size / 6, -half + 3);
    g.lineTo(x0 + size / 3, half);
    g.closePath();
    g.fill();
    g.stroke();
  }
  g.restore();
}

/** A painted arrow (zones' floors, the HUD), pointing "down" in its own frame; turn first. */
export function arrowPath(g: G, size: number) {
  const s = size;
  g.beginPath();
  g.moveTo(0, s * 0.5);
  g.lineTo(-s * 0.42, s * 0.05);
  g.lineTo(-s * 0.16, s * 0.05);
  g.lineTo(-s * 0.16, -s * 0.5);
  g.lineTo(s * 0.16, -s * 0.5);
  g.lineTo(s * 0.16, s * 0.05);
  g.lineTo(s * 0.42, s * 0.05);
  g.closePath();
}

export function drawSign(g: G) {
  g.fillStyle = "#8D6A3F";
  g.fillRect(-1, -2, 2, 8);
  g.fillStyle = "#F7E6C4";
  roundRect(g, -6, -8, 12, 7, 1.5);
  g.fill();
  g.strokeStyle = "#6B4F2A";
  g.lineWidth = 1;
  g.stroke();
  g.fillStyle = "#6B4F2A";
  g.fillRect(-4, -6, 8, 1);
  g.fillRect(-4, -4, 6, 1);
}

/** A hanging lamp (drawn from the hook along the chain's angle). */
export function drawLamp(g: G, x: number, y: number, angle: number, chain: number, t: number) {
  const bx = x + Math.cos(angle) * chain;
  const by = y + Math.sin(angle) * chain;
  g.save();
  g.strokeStyle = "#5C677D";
  g.lineWidth = 1;
  g.setLineDash([2, 1.5]);
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(bx, by);
  g.stroke();
  g.setLineDash([]);
  g.fillStyle = "#5C677D";
  g.beginPath();
  g.arc(x, y, 1.6, 0, Math.PI * 2);
  g.fill();
  // The glow.
  const glow = g.createRadialGradient(bx, by, 1, bx, by, 18);
  glow.addColorStop(0, `rgba(255,214,102,${0.42 + Math.sin(t * 3) * 0.04})`);
  glow.addColorStop(1, "rgba(255,214,102,0)");
  g.fillStyle = glow;
  g.beginPath();
  g.arc(bx, by, 18, 0, Math.PI * 2);
  g.fill();
  g.translate(bx, by);
  g.rotate(angle - Math.PI / 2);
  g.fillStyle = "#3D405B";
  g.beginPath();
  g.moveTo(-4.5, 0);
  g.lineTo(4.5, 0);
  g.lineTo(3, -4.5);
  g.lineTo(-3, -4.5);
  g.closePath();
  g.fill();
  g.fillStyle = "#FFD166";
  g.beginPath();
  g.arc(0, 1.2, 2.2, 0, Math.PI);
  g.fill();
  g.restore();
}

/** Tilted Town's scenery, upright for the camera (house fronts get their colour from their house). */
export function drawDecor(g: G, kind: "facade" | "window" | "door" | "roof" | "tree" | "bench", t: number, wall = "#F7D6E0") {
  switch (kind) {
    case "facade":
      g.fillStyle = wall;
      g.fillRect(-8.3, -8.3, 16.6, 16.6);
      return;
    case "roof":
      g.fillStyle = "#C8553D";
      g.fillRect(-8.3, -2, 16.6, 10.3);
      g.fillStyle = "#A63F2B";
      g.fillRect(-8.3, 5.5, 16.6, 2.8);
      g.strokeStyle = "rgba(255,255,255,0.25)";
      g.lineWidth = 0.8;
      g.beginPath();
      g.moveTo(-8, 1.5);
      g.lineTo(8, 1.5);
      g.stroke();
      return;
    case "window":
      g.fillStyle = wall;
      g.fillRect(-8.3, -8.3, 16.6, 16.6);
      g.fillStyle = "#FFF4C2";
      roundRect(g, -4.5, -5.5, 9, 11, 1.5);
      g.fill();
      g.strokeStyle = "#5E6278";
      g.lineWidth = 1.2;
      g.stroke();
      g.beginPath();
      g.moveTo(0, -5.5);
      g.lineTo(0, 5.5);
      g.moveTo(-4.5, 0);
      g.lineTo(4.5, 0);
      g.stroke();
      // A window box.
      g.fillStyle = "#8D6A3F";
      g.fillRect(-5.5, 5.5, 11, 2);
      g.fillStyle = "#E76F51";
      g.beginPath();
      g.arc(-3, 5, 1.3, 0, Math.PI * 2);
      g.arc(1, 4.8, 1.3, 0, Math.PI * 2);
      g.arc(4, 5.2, 1.1, 0, Math.PI * 2);
      g.fill();
      return;
    case "door":
      g.fillStyle = wall;
      g.fillRect(-8.3, -8.3, 16.6, 16.6);
      g.fillStyle = "#6D597A";
      roundRect(g, -4.5, -6, 9, 14.3, 4);
      g.fill();
      g.strokeStyle = "#3D2F45";
      g.lineWidth = 1;
      g.stroke();
      g.fillStyle = "#FFD166";
      g.beginPath();
      g.arc(2.3, 2, 0.9, 0, Math.PI * 2);
      g.fill();
      return;
    case "tree": {
      g.fillStyle = "#8D6A3F";
      g.fillRect(-1.3, 0, 2.6, 8);
      g.fillStyle = "#74C69D";
      const sway = Math.sin(t * 1.3) * 0.6;
      g.beginPath();
      g.arc(sway, -3, 6.5, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#52B788";
      g.beginPath();
      g.arc(sway - 2, -1.5, 3.4, 0, Math.PI * 2);
      g.fill();
      return;
    }
    case "bench":
      g.fillStyle = "#8D6A3F";
      g.fillRect(-7, 1, 14, 2);
      g.fillRect(-7, -3, 14, 1.6);
      g.fillRect(-6, 3, 1.4, 4);
      g.fillRect(4.6, 3, 1.4, 4);
      return;
  }
}

/** A planet: a body with bands and a rim of light. A painted one looks nearly the same: just a little flat. */
export function drawPlanet(g: G, x: number, y: number, r: number, hue: number, fake: boolean, t: number) {
  g.save();
  const halo = g.createRadialGradient(x, y, r, x, y, r * 1.6);
  halo.addColorStop(0, `hsla(${hue},80%,70%,0.25)`);
  halo.addColorStop(1, `hsla(${hue},80%,70%,0)`);
  g.fillStyle = halo;
  g.beginPath();
  g.arc(x, y, r * 1.6, 0, Math.PI * 2);
  g.fill();
  const body = g.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.2, x, y, r);
  body.addColorStop(0, `hsl(${hue},70%,${fake ? 66 : 70}%)`);
  body.addColorStop(1, `hsl(${hue},${fake ? 50 : 60}%,${fake ? 46 : 38}%)`);
  g.fillStyle = body;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
  g.save();
  g.clip();
  g.strokeStyle = `hsla(${hue},60%,82%,0.35)`;
  g.lineWidth = r * 0.12;
  for (let i = -1; i <= 1; i++) {
    g.beginPath();
    // Real planets' bands drift; painted ones are, well, painted.
    const drift = fake ? 0 : Math.sin(t * 0.4 + i) * 1.5;
    g.ellipse(x, y + i * r * 0.42 + drift, r * 1.1, r * 0.16, 0, 0, Math.PI * 2);
    g.stroke();
  }
  g.restore();
  if (!fake) {
    g.strokeStyle = `hsla(${hue},90%,88%,0.8)`;
    g.lineWidth = 1.4;
    g.beginPath();
    g.arc(x, y, r - 0.7, Math.PI * 0.9, Math.PI * 1.6);
    g.stroke();
  }
  g.restore();
}

export function drawAsteroid(g: G, x: number, y: number, r: number, t: number) {
  g.save();
  g.translate(x, y);
  g.rotate(t * 0.8);
  g.fillStyle = DANGER;
  g.beginPath();
  const spikes = 9;
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i / (spikes * 2)) * Math.PI * 2;
    const rr = i % 2 ? r * 0.62 : r;
    g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  g.closePath();
  g.fill();
  g.fillStyle = "#5A0C18";
  g.beginPath();
  g.arc(0, 0, r * 0.45, 0, Math.PI * 2);
  g.fill();
  g.restore();
}
