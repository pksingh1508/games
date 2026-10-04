// Glitch Run's look (Plan/07-glitch-run.md §9): clean neon outlines on a dark screen, so every glitch
// stands out against it. The runner is a little neon stick figure (cyan and pink copies of it come
// apart as the screen breaks); The Debugger is white, clinical, geometric, calm. Drawn in code.

export const INK = "#07070D";
export const PANEL = "#10102A";
export const GRID = "#15152B";
export const CYAN = "#00F5D4";
export const PINK = "#FF2E88";
export const WHITE = "#E6F1FF";
export const AMBER = "#FFC857";
export const GREEN = "#7CFF6B";
export const VIOLET = "#B388FF";
export const MAGENTA = "#FF00FF";
/** The white void The Debugger reformats the screen into (the finale). */
export const VOID = "#F2F5FA";

type G = CanvasRenderingContext2D;

export type Pose = "run" | "jump" | "fall" | "slide" | "dead";

/**
 * The runner, feet at (0, 0), facing right, 22 px tall (10 when sliding). `t` animates the legs.
 * `inverted`: Input Swap's tell (drawn dark, with a light outline).
 */
export function drawRunner(g: G, pose: Pose, t: number, colour = WHITE, inverted = false) {
  g.save();
  g.lineCap = "round";
  g.lineJoin = "round";
  const stroke = inverted ? INK : colour;
  if (inverted) {
    // A bright halo first, so the dark figure reads.
    g.strokeStyle = colour;
    g.lineWidth = 5;
    figure(g, pose, t);
    g.stroke();
    g.fillStyle = colour;
    head(g, pose, 4.6);
  }
  g.strokeStyle = stroke;
  g.lineWidth = 2.4;
  figure(g, pose, t);
  g.stroke();
  g.fillStyle = stroke;
  head(g, pose, 3.4);
  g.restore();
}

function head(g: G, pose: Pose, r: number) {
  g.beginPath();
  if (pose === "slide") g.arc(9, -6, r, 0, Math.PI * 2);
  else g.arc(1.5, -18.5, r, 0, Math.PI * 2);
  g.fill();
}

function figure(g: G, pose: Pose, t: number) {
  g.beginPath();
  if (pose === "slide") {
    // Low and long, leaning back: feet first.
    g.moveTo(7, -5);
    g.lineTo(-3, -3);
    g.lineTo(-9, -1);
    g.moveTo(-3, -3);
    g.lineTo(-10, -5);
    g.moveTo(5, -5);
    g.lineTo(0, -9);
    return;
  }
  const swing = pose === "run" ? Math.sin(t * 16) : pose === "jump" ? 0.7 : pose === "fall" ? -0.4 : 0;
  // Body.
  g.moveTo(1, -15);
  g.lineTo(-1, -7);
  // Arms.
  g.moveTo(0.5, -13);
  g.lineTo(5 + swing * 2, -9 - swing * 2);
  g.moveTo(0.5, -13);
  g.lineTo(-4 - swing * 2, -10 + swing * 2);
  // Legs.
  g.moveTo(-1, -7);
  g.lineTo(3 + swing * 4, -3);
  g.lineTo(2 + swing * 5, 0);
  g.moveTo(-1, -7);
  g.lineTo(-4 - swing * 4, -3);
  g.lineTo(-6 - swing * 3, 0);
}

/** The Debugger: a white, calm, geometric eye that sees everything. `charge` 0–1 before a scan. */
export function drawDebugger(g: G, x: number, y: number, size: number, t: number, charge: number) {
  g.save();
  g.translate(x, y);
  const glow = g.createRadialGradient(0, 0, size * 0.2, 0, 0, size * 1.3);
  glow.addColorStop(0, `rgba(230,241,255,${0.25 + charge * 0.4})`);
  glow.addColorStop(1, "rgba(230,241,255,0)");
  g.fillStyle = glow;
  g.beginPath();
  g.arc(0, 0, size * 1.3, 0, Math.PI * 2);
  g.fill();
  // Nested, slowly turning octagons.
  for (let i = 0; i < 3; i++) {
    const r = size * (1 - i * 0.24);
    g.save();
    g.rotate(t * (0.3 + i * 0.25) * (i % 2 ? -1 : 1));
    g.strokeStyle = `rgba(230,241,255,${0.95 - i * 0.2})`;
    g.lineWidth = 2.2 - i * 0.5;
    g.beginPath();
    for (let k = 0; k <= 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (k === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.stroke();
    g.restore();
  }
  // The eye: a pupil that tracks right (toward you).
  g.fillStyle = WHITE;
  g.beginPath();
  g.ellipse(size * 0.12, 0, size * 0.32, size * 0.2, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = INK;
  g.beginPath();
  g.arc(size * 0.2 + Math.sin(t * 2) * 2, 0, size * 0.09 + charge * size * 0.05, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

/** A bit: a floating 0 or 1, with a soft glow behind it. */
export function drawBit(g: G, x: number, y: number, one: boolean, t: number) {
  g.save();
  g.translate(x, y + Math.sin(t * 4 + x * 0.1) * 1.5);
  g.fillStyle = "rgba(0,245,212,0.18)";
  g.beginPath();
  g.arc(0, 0, 7, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = CYAN;
  g.font = "bold 11px ui-monospace, Menlo, monospace";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(one ? "1" : "0", 0, 0.5);
  g.restore();
}

/** A patch: a little green bandage. */
export function drawPatch(g: G, x: number, y: number, t: number) {
  g.save();
  g.translate(x, y + Math.sin(t * 3) * 1.2);
  g.fillStyle = "rgba(124,255,107,0.2)";
  g.beginPath();
  g.arc(0, 0, 10, 0, Math.PI * 2);
  g.fill();
  g.rotate(-0.5);
  g.fillStyle = GREEN;
  g.beginPath();
  g.roundRect(-7, -3.5, 14, 7, 3.5);
  g.fill();
  g.fillStyle = "#1E5B17";
  g.fillRect(-2.5, -2.5, 5, 5);
  g.restore();
}

/** Corrupted spikes: a row of jagged shards, pointing up (or down when they hang). */
export function drawSpikes(g: G, x: number, y: number, size: number, down: boolean, missing: boolean) {
  g.save();
  g.translate(x, y);
  if (down) {
    g.translate(0, size);
    g.scale(1, -1);
  }
  g.fillStyle = missing ? MAGENTA : PINK;
  g.strokeStyle = missing ? "#000" : "#FFB3D1";
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(0, size);
  g.lineTo(size * 0.18, size * 0.25);
  g.lineTo(size * 0.33, size * 0.7);
  g.lineTo(size * 0.5, 0);
  g.lineTo(size * 0.67, size * 0.6);
  g.lineTo(size * 0.82, size * 0.2);
  g.lineTo(size, size);
  g.closePath();
  g.fill();
  g.stroke();
  g.restore();
}

/** A firewall bar: a hot pink beam with warning stripes (slide under it). */
export function drawBar(g: G, x: number, y: number, w: number, h: number, t: number, missing: boolean) {
  g.save();
  if (missing) {
    checker(g, x, y, w, h);
  } else {
    g.fillStyle = `rgba(255,46,136,${0.18 + Math.sin(t * 8) * 0.06})`;
    g.fillRect(x, y - 2, w, h + 4);
    g.fillStyle = PINK;
    g.fillRect(x, y + h * 0.2, w, h * 0.6);
    g.fillStyle = "rgba(7,7,13,0.55)";
    for (let sx = x - 8 + ((t * 30) % 8); sx < x + w; sx += 8) {
      g.beginPath();
      g.moveTo(sx, y + h * 0.8);
      g.lineTo(sx + 4, y + h * 0.2);
      g.lineTo(sx + 7, y + h * 0.2);
      g.lineTo(sx + 3, y + h * 0.8);
      g.fill();
    }
  }
  g.restore();
}

/** The "missing texture" look: magenta and black squares. */
export function checker(g: G, x: number, y: number, w: number, h: number, cell = 8) {
  for (let cy = 0; cy < h; cy += cell) {
    for (let cx = 0; cx < w; cx += cell) {
      g.fillStyle = (Math.floor(cx / cell) + Math.floor(cy / cell)) % 2 ? "#000" : MAGENTA;
      g.fillRect(x + cx, y + cy, Math.min(cell, w - cx), Math.min(cell, h - cy));
    }
  }
}

/** The way out: a neon doorway at `x`, standing on the ground at `ground`. The end of everything is a folder. */
export function drawExit(g: G, x: number, ground: number, label: string, t: number) {
  g.save();
  g.translate(x, ground);
  const pulse = 0.5 + Math.sin(t * 4) * 0.15;
  const root = label.startsWith("/");
  if (root) {
    // A folder, big enough to run into.
    g.fillStyle = `rgba(255,200,87,${0.12 + pulse * 0.1})`;
    g.beginPath();
    g.moveTo(-4, 0);
    g.lineTo(-4, -70);
    g.lineTo(12, -70);
    g.lineTo(18, -62);
    g.lineTo(52, -62);
    g.lineTo(52, 0);
    g.closePath();
    g.fill();
    g.strokeStyle = AMBER;
    g.lineWidth = 2;
    g.stroke();
  } else {
    g.fillStyle = `rgba(0,245,212,${0.1 + pulse * 0.12})`;
    g.fillRect(-4, -56, 26, 56);
    g.strokeStyle = CYAN;
    g.lineWidth = 2;
    g.strokeRect(-4, -56, 26, 56);
  }
  g.fillStyle = root ? AMBER : CYAN;
  g.font = "bold 9px ui-monospace, Menlo, monospace";
  g.textAlign = "center";
  g.fillText(label, root ? 24 : 9, root ? -76 : -62);
  g.restore();
}
