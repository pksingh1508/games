// The shared art kit (Plan/09-one-tap-chaos.md §9): bold, flat shapes with thick ink outlines,
// readable in a split second. Scenes draw on a 1000 × 1000 square (the canvas is already scaled).
import type { View } from "../microgames/types";

export const INK = "#1B1B1B";
export const WHITE = "#FFFFFF";
export const LINE = 9;
/** Red is only ever used for Red Means No, always with its ✖ stripes. */
export const NO_RED = "#D62839";

// ---------------------------------------------------------------------------------------------
// Numbers and easing.
// ---------------------------------------------------------------------------------------------

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** 0 → 1 as `v` goes from `a` to `b`, clamped. */
export const progress = (v: number, a: number, b: number) => clamp((v - a) / (b - a));
export const smooth = (t: number) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};
export const easeOut = (t: number) => 1 - (1 - clamp(t)) ** 3;
export const easeIn = (t: number) => clamp(t) ** 2;
export const easeOutBack = (t: number) => {
  const x = clamp(t);
  const c = 1.9;
  return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2;
};
/** 1 right on the beat, fading to 0 within `1 / sharp` of a beat. */
export const onBeat = (b: number, sharp = 4) => Math.max(0, 1 - (((b % 1) + 1) % 1) * sharp);
/** A bounce that follows the beat (0 → 1 → 0 each beat), calm when motion is reduced. */
export const bob = (b: number, view: View, amount = 1) => (view.reducedMotion ? 0 : Math.sin(((b % 1) + 1) % 1 * Math.PI) * amount);
/** Ping-pong between 0 and 1 with the given period. */
export const pingPong = (t: number, period: number) => {
  const x = (((t / period) % 1) + 1) % 1;
  return x < 0.5 ? x * 2 : 2 - x * 2;
};

// ---------------------------------------------------------------------------------------------
// Shapes. Every shape is filled, then outlined in ink.
// ---------------------------------------------------------------------------------------------

type Fill = string | CanvasGradient | CanvasPattern | null;

export interface StrokeOptions {
  stroke?: boolean;
  width?: number;
  color?: string;
}

function finish(g: CanvasRenderingContext2D, fill: Fill, { stroke = true, width = LINE, color = INK }: StrokeOptions = {}) {
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (stroke && width > 0) {
    g.lineWidth = width;
    g.strokeStyle = color;
    g.lineJoin = "round";
    g.lineCap = "round";
    g.stroke();
  }
}

export function circle(g: CanvasRenderingContext2D, x: number, y: number, r: number, fill: Fill, options?: StrokeOptions) {
  g.beginPath();
  g.arc(x, y, Math.max(0, r), 0, Math.PI * 2);
  finish(g, fill, options);
}

export function ellipse(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  fill: Fill,
  options?: StrokeOptions & { rotation?: number },
) {
  g.beginPath();
  g.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), options?.rotation ?? 0, 0, Math.PI * 2);
  finish(g, fill, options);
}

export function rect(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: Fill,
  options?: StrokeOptions & { radius?: number },
) {
  g.beginPath();
  g.roundRect(x, y, w, h, options?.radius ?? 0);
  finish(g, fill, options);
}

/** A closed (or open) polygon from flat [x, y, x, y…] points. */
export function poly(g: CanvasRenderingContext2D, points: number[], fill: Fill, options?: StrokeOptions & { open?: boolean }) {
  g.beginPath();
  for (let i = 0; i < points.length; i += 2) {
    const x = points[i] ?? 0;
    const y = points[i + 1] ?? 0;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  if (!options?.open) g.closePath();
  finish(g, options?.open ? null : fill, options);
}

export function line(g: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, width = LINE, color = INK) {
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
  g.lineWidth = width;
  g.strokeStyle = color;
  g.lineCap = "round";
  g.stroke();
}

export function star(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  outer: number,
  inner: number,
  points: number,
  fill: Fill,
  options?: StrokeOptions & { rotation?: number },
) {
  const pts: number[] = [];
  const rot = (options?.rotation ?? 0) - Math.PI / 2;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rot + (i * Math.PI) / points;
    pts.push(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  poly(g, pts, fill, options);
}

/** A regular polygon (triangle, square, pentagon…). */
export function regular(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  sides: number,
  fill: Fill,
  options?: StrokeOptions & { rotation?: number },
) {
  const pts: number[] = [];
  const rot = (options?.rotation ?? 0) - Math.PI / 2;
  for (let i = 0; i < sides; i++) {
    const a = rot + (i * Math.PI * 2) / sides;
    pts.push(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  poly(g, pts, fill, options);
}

/** Text in the show font (Bungee), with an optional ink outline for readability. */
export function text(
  g: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  size: number,
  view: View,
  {
    color = INK,
    align = "center",
    outline = 0,
    outlineColor = INK,
    baseline = "middle",
  }: { color?: string; align?: CanvasTextAlign; outline?: number; outlineColor?: string; baseline?: CanvasTextBaseline } = {},
) {
  g.font = `${Math.round(size)}px ${view.font}`;
  g.textAlign = align;
  g.textBaseline = baseline;
  if (outline > 0) {
    g.lineWidth = outline;
    g.strokeStyle = outlineColor;
    g.lineJoin = "round";
    g.strokeText(value, x, y);
  }
  g.fillStyle = color;
  g.fillText(value, x, y);
}

/** The biggest font size (up to `max`) at which `value` fits in `width`, in the show font. */
export function fitSize(g: CanvasRenderingContext2D, value: string, view: View, max: number, width: number): number {
  g.font = `100px ${view.font}`;
  const measured = g.measureText(value).width || value.length * 70;
  return Math.min(max, (width / measured) * 100);
}

/** Fill everything visible (the square and beyond) with the scene's colour. */
export function backdrop(g: CanvasRenderingContext2D, view: View, color: string) {
  g.fillStyle = color;
  g.fillRect(view.left, view.top, view.right - view.left, view.bottom - view.top);
}

/** A floor from `y` down to the bottom of the screen, edge to edge. */
export function floor(g: CanvasRenderingContext2D, view: View, y: number, color: string, edge = true) {
  g.fillStyle = color;
  g.fillRect(view.left, y, view.right - view.left, view.bottom - y);
  if (edge) line(g, view.left - 20, y, view.right + 20, y, LINE);
}

/** Run `paint` with the canvas moved, rotated and scaled; always restored. */
export function at(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  paint: () => void,
  { rotate = 0, scale = 1, scaleY }: { rotate?: number; scale?: number; scaleY?: number } = {},
) {
  g.save();
  g.translate(x, y);
  if (rotate) g.rotate(rotate);
  if (scale !== 1 || scaleY !== undefined) g.scale(scale, scaleY ?? scale);
  paint();
  g.restore();
}

/** Faint, everywhere: the instruction is the star, the scene is the stage. */
export function shadow(g: CanvasRenderingContext2D, x: number, y: number, rx: number, ry = rx * 0.22) {
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  g.fillStyle = "rgba(27, 27, 27, 0.18)";
  g.fill();
}

// ---------------------------------------------------------------------------------------------
// Faces: the cast all share the same simple face.
// ---------------------------------------------------------------------------------------------

export type Mood = "happy" | "smug" | "shock" | "sad" | "sleep" | "angry" | "dizzy" | "grin";

/** A face centred at (x, y); `s` is its scale (1 ≈ a 100-unit-wide head). */
export function face(g: CanvasRenderingContext2D, x: number, y: number, s: number, mood: Mood, look = 0) {
  const eye = (ex: number) => {
    const cx = x + ex * s;
    const cy = y - 8 * s;
    if (mood === "sleep") {
      g.beginPath();
      g.arc(cx, cy, 9 * s, 0.15 * Math.PI, 0.85 * Math.PI);
      g.lineWidth = 6 * s;
      g.strokeStyle = INK;
      g.stroke();
    } else if (mood === "dizzy") {
      line(g, cx - 8 * s, cy - 8 * s, cx + 8 * s, cy + 8 * s, 6 * s);
      line(g, cx - 8 * s, cy + 8 * s, cx + 8 * s, cy - 8 * s, 6 * s);
    } else if (mood === "happy" || mood === "grin") {
      g.beginPath();
      g.arc(cx, cy + 4 * s, 9 * s, 1.15 * Math.PI, 1.85 * Math.PI);
      g.lineWidth = 6 * s;
      g.strokeStyle = INK;
      g.stroke();
    } else {
      circle(g, cx, cy, (mood === "shock" ? 11 : 9) * s, WHITE, { width: 5 * s });
      circle(g, cx + look * 3 * s, cy + (mood === "smug" ? 3 : 1) * s, 4.5 * s, INK, { stroke: false });
      if (mood === "smug") line(g, cx - 11 * s, cy - 6 * s, cx + 11 * s, cy - 4 * s, 6 * s);
      if (mood === "angry") line(g, cx - 11 * s, cy - 15 * s + (ex < 0 ? -4 : 4) * s, cx + 11 * s, cy - 15 * s + (ex < 0 ? 4 : -4) * s, 6 * s);
    }
  };
  eye(-20);
  eye(20);

  g.beginPath();
  const my = y + 22 * s;
  switch (mood) {
    case "happy":
    case "smug":
      g.arc(x, my - 10 * s, 16 * s, 0.2 * Math.PI, 0.8 * Math.PI);
      break;
    case "grin":
      g.moveTo(x - 20 * s, my - 6 * s);
      g.quadraticCurveTo(x, my + 16 * s, x + 20 * s, my - 6 * s);
      g.closePath();
      g.fillStyle = WHITE;
      g.fill();
      break;
    case "shock":
      g.ellipse(x, my, 9 * s, 12 * s, 0, 0, Math.PI * 2);
      g.fillStyle = INK;
      g.fill();
      break;
    case "sad":
    case "angry":
      g.arc(x, my + 10 * s, 14 * s, 1.2 * Math.PI, 1.8 * Math.PI);
      break;
    case "sleep":
      g.ellipse(x, my, 6 * s, 4 * s, 0, 0, Math.PI * 2);
      break;
    case "dizzy":
      g.moveTo(x - 14 * s, my);
      g.bezierCurveTo(x - 7 * s, my - 8 * s, x + 7 * s, my + 8 * s, x + 14 * s, my);
      break;
  }
  g.lineWidth = 6 * s;
  g.strokeStyle = INK;
  g.lineCap = "round";
  g.stroke();
}

/** A big ✓ or ✖ stamp, shown the moment a round is decided. */
export function verdict(g: CanvasRenderingContext2D, x: number, y: number, size: number, win: boolean, amount: number) {
  if (amount <= 0) return;
  const s = size * easeOutBack(amount);
  at(g, x, y, () => {
    circle(g, 0, 0, s, win ? "#2FBF71" : INK, { width: s * 0.12, color: WHITE });
    g.lineWidth = s * 0.22;
    g.strokeStyle = WHITE;
    g.lineCap = "round";
    g.lineJoin = "round";
    g.beginPath();
    if (win) {
      g.moveTo(-s * 0.42, 0);
      g.lineTo(-s * 0.1, s * 0.32);
      g.lineTo(s * 0.45, -s * 0.34);
    } else {
      g.moveTo(-s * 0.36, -s * 0.36);
      g.lineTo(s * 0.36, s * 0.36);
      g.moveTo(s * 0.36, -s * 0.36);
      g.lineTo(-s * 0.36, s * 0.36);
    }
    g.stroke();
  }, { rotate: win ? -0.12 : 0.12 });
}
