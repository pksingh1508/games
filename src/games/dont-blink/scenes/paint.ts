// The museum's paint box: small drawing pieces the rooms and their objects are made of. Scene units, y down.
// The look is painted and a little uncanny: flat shapes, soft light pools, dark corners. The CCTV grade (a
// green cast, grain, scanlines) goes over everything afterwards.

export type G = CanvasRenderingContext2D;

/** Resolved by the renderer (a canvas can't read CSS font variables). */
export const sceneFonts = { serif: "Georgia, serif", mono: "ui-monospace, monospace" };

export function poly(g: G, pts: ReadonlyArray<readonly [number, number]>, fill: string, stroke?: string, width = 1.5) {
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.fillStyle = fill;
  g.fill();
  if (stroke) {
    g.lineWidth = width;
    g.strokeStyle = stroke;
    g.stroke();
  }
}

export function rect(g: G, x: number, y: number, w: number, h: number, fill: string, stroke?: string, width = 1.5) {
  g.fillStyle = fill;
  g.fillRect(x, y, w, h);
  if (stroke) {
    g.lineWidth = width;
    g.strokeStyle = stroke;
    g.strokeRect(x, y, w, h);
  }
}

export function ellipse(g: G, x: number, y: number, rx: number, ry: number, fill: string, stroke?: string, width = 1.5) {
  g.beginPath();
  g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
  g.fillStyle = fill;
  g.fill();
  if (stroke) {
    g.lineWidth = width;
    g.strokeStyle = stroke;
    g.stroke();
  }
}

export function line(g: G, x1: number, y1: number, x2: number, y2: number, color: string, width = 1.5) {
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
  g.lineWidth = width;
  g.strokeStyle = color;
  g.lineCap = "round";
  g.stroke();
}

/** A soft pool of light (or shadow): a radial gradient from `color` to nothing. */
export function glow(g: G, x: number, y: number, r: number, color: string, alpha = 1) {
  const grad = g.createRadialGradient(x, y, 0, x, y, r);
  grad.addColorStop(0, color);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.save();
  g.globalAlpha *= alpha;
  g.fillStyle = grad;
  g.fillRect(x - r, y - r, r * 2, r * 2);
  g.restore();
}

/** A soft shadow on the floor under something. */
export function shadow(g: G, x: number, y: number, rx: number, ry = rx * 0.28, alpha = 0.45) {
  g.save();
  g.globalAlpha *= alpha;
  ellipse(g, x, y, rx, ry, "#000");
  g.restore();
}

/** Words in the room (signs, plaques): the CCTV mirror flips them, which is the tell. */
export function words(g: G, text: string, x: number, y: number, size: number, color: string, opts: { font?: "serif" | "mono"; weight?: number; align?: CanvasTextAlign; spacing?: number } = {}) {
  g.save();
  g.font = `${opts.weight ?? 700} ${size}px ${opts.font === "mono" ? sceneFonts.mono : sceneFonts.serif}`;
  g.textAlign = opts.align ?? "center";
  g.textBaseline = "middle";
  g.fillStyle = color;
  if (opts.spacing) (g as unknown as { letterSpacing: string }).letterSpacing = `${opts.spacing}px`;
  g.fillText(text, x, y);
  g.restore();
}

/** A gilt picture frame with a dark inner edge; returns the inside rectangle. */
export function frame(g: G, x: number, y: number, w: number, h: number, gold = "#9A7B3C") {
  rect(g, x - 2, y - 2, w + 4, h + 4, "#1A140C");
  rect(g, x, y, w, h, gold);
  rect(g, x + 3, y + 3, w - 6, h - 6, "#6E5524");
  const inner = { x: x + 7, y: y + 7, w: w - 14, h: h - 14 };
  rect(g, inner.x - 1, inner.y - 1, inner.w + 2, inner.h + 2, "#1A140C");
  return inner;
}

export type Eyes = "front" | "left" | "right" | "closed" | "none";
export type Mouth = "flat" | "smile" | "frown" | "open" | "none";

/** A painted face (portraits, busts, figures). */
export function face(g: G, cx: number, cy: number, r: number, opts: { skin: string; hair?: string; eyes?: Eyes; mouth?: Mouth; ink?: string; turned?: boolean; mustache?: boolean }) {
  const ink = opts.ink ?? "#2A1E1A";
  if (opts.turned) {
    // The back of the head: just hair.
    ellipse(g, cx, cy, r, r * 1.18, opts.hair ?? opts.skin);
    ellipse(g, cx + r * 0.15, cy - r * 0.2, r * 0.6, r * 0.5, "rgba(255,255,255,0.05)");
    return;
  }
  ellipse(g, cx, cy, r, r * 1.18, opts.skin);
  if (opts.hair) {
    g.save();
    g.beginPath();
    g.ellipse(cx, cy - r * 0.45, r * 1.04, r * 0.85, 0, Math.PI, 0);
    g.fillStyle = opts.hair;
    g.fill();
    g.restore();
  }
  const ey = cy - r * 0.08;
  const ex = r * 0.38;
  const eyes = opts.eyes ?? "front";
  if (eyes !== "none") {
    for (const side of [-1, 1]) {
      const x = cx + side * ex;
      if (eyes === "closed") line(g, x - r * 0.16, ey, x + r * 0.16, ey, ink, Math.max(1, r * 0.08));
      else {
        ellipse(g, x, ey, r * 0.17, r * 0.11, "#EDE6D6");
        const look = eyes === "left" ? -r * 0.09 : eyes === "right" ? r * 0.09 : 0;
        ellipse(g, x + look, ey, r * 0.08, r * 0.09, ink);
      }
    }
  }
  if (opts.mustache) {
    g.save();
    g.beginPath();
    g.moveTo(cx - r * 0.42, cy + r * 0.42);
    g.quadraticCurveTo(cx, cy + r * 0.16, cx + r * 0.42, cy + r * 0.42);
    g.quadraticCurveTo(cx, cy + r * 0.3, cx - r * 0.42, cy + r * 0.42);
    g.fillStyle = opts.hair ?? ink;
    g.fill();
    g.restore();
  }
  const my = cy + r * 0.52;
  const mouth = opts.mouth ?? "flat";
  g.save();
  g.lineWidth = Math.max(1, r * 0.08);
  g.strokeStyle = ink;
  g.lineCap = "round";
  g.beginPath();
  if (mouth === "flat") {
    g.moveTo(cx - r * 0.22, my);
    g.lineTo(cx + r * 0.22, my);
  } else if (mouth === "smile") {
    g.moveTo(cx - r * 0.3, my - r * 0.06);
    g.quadraticCurveTo(cx, my + r * 0.22, cx + r * 0.3, my - r * 0.06);
  } else if (mouth === "frown") {
    g.moveTo(cx - r * 0.28, my + r * 0.1);
    g.quadraticCurveTo(cx, my - r * 0.14, cx + r * 0.28, my + r * 0.1);
  } else if (mouth === "open") {
    g.ellipse(cx, my, r * 0.14, r * 0.18, 0, 0, Math.PI * 2);
    g.fillStyle = ink;
    g.fill();
  }
  if (mouth !== "none" && mouth !== "open") g.stroke();
  g.restore();
}

/** A shadowy figure standing (an intruder): a silhouette with two faint points for eyes. */
export function figure(g: G, x: number, y: number, h: number, color = "#07090A") {
  const w = h * 0.34;
  shadow(g, x, y, w * 0.8, w * 0.22, 0.6);
  g.save();
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(x - w * 0.5, y);
  g.quadraticCurveTo(x - w * 0.62, y - h * 0.5, x - w * 0.42, y - h * 0.7);
  g.lineTo(x + w * 0.42, y - h * 0.7);
  g.quadraticCurveTo(x + w * 0.62, y - h * 0.5, x + w * 0.5, y);
  g.closePath();
  g.fill();
  g.beginPath();
  g.ellipse(x, y - h * 0.82, w * 0.3, h * 0.13, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
  ellipse(g, x - w * 0.11, y - h * 0.83, h * 0.012, h * 0.01, "rgba(220,240,230,0.85)");
  ellipse(g, x + w * 0.11, y - h * 0.83, h * 0.012, h * 0.01, "rgba(220,240,230,0.85)");
}

/** A wall lamp or sconce with its pool of light. */
export function sconce(g: G, x: number, y: number, on: boolean, size = 1) {
  if (on) glow(g, x, y, 70 * size, "rgba(255,214,140,0.42)");
  rect(g, x - 3 * size, y, 6 * size, 10 * size, "#4A3A22");
  poly(g, [
    [x - 9 * size, y],
    [x + 9 * size, y],
    [x + 6 * size, y - 12 * size],
    [x - 6 * size, y - 12 * size],
  ], on ? "#F4D58C" : "#5B5142", "#2A2014", 1);
}

/** A door in its frame: shut, open (a dark gap and the leaf swung in) or ajar. */
export function door(g: G, x: number, y: number, w: number, h: number, state: string, leaf = "#5A3A22") {
  // (x, y) is the bottom centre.
  const left = x - w / 2;
  const top = y - h;
  rect(g, left - 5, top - 5, w + 10, h + 5, "#2B1D12");
  if (state === "open" || state === "ajar") {
    rect(g, left, top, w, h, "#050505");
    glow(g, x, y - h * 0.3, w * 0.9, "rgba(40,60,55,0.35)");
    const swing = state === "open" ? w * 0.82 : w * 0.3;
    poly(g, [
      [left, top],
      [left + w - swing, top + h * 0.05],
      [left + w - swing, y - h * 0.03],
      [left, y],
    ], leaf, "#1B120A", 1);
  } else {
    rect(g, left, top, w, h, leaf, "#1B120A", 1);
    rect(g, left + w * 0.12, top + h * 0.08, w * 0.76, h * 0.36, "rgba(0,0,0,0.18)");
    rect(g, left + w * 0.12, top + h * 0.52, w * 0.76, h * 0.4, "rgba(0,0,0,0.18)");
    ellipse(g, left + w * 0.84, top + h * 0.55, w * 0.04, w * 0.04, "#C9A55A");
  }
}

/** A clock face showing hours:minutes. */
export function clockFace(g: G, x: number, y: number, r: number, time: string, body = "#3B2A18") {
  ellipse(g, x, y, r + 5, r + 5, body, "#1A1209", 2);
  ellipse(g, x, y, r, r, "#E6DCC4");
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    line(g, x + Math.sin(a) * r * 0.82, y - Math.cos(a) * r * 0.82, x + Math.sin(a) * r * 0.94, y - Math.cos(a) * r * 0.94, "#3B2A18", k % 3 ? 1 : 2.4);
  }
  const [hh, mm] = time.split(":").map(Number) as [number, number];
  const ma = (mm / 60) * Math.PI * 2;
  const ha = (((hh % 12) + mm / 60) / 12) * Math.PI * 2;
  line(g, x, y, x + Math.sin(ha) * r * 0.5, y - Math.cos(ha) * r * 0.5, "#1A1209", 3);
  line(g, x, y, x + Math.sin(ma) * r * 0.78, y - Math.cos(ma) * r * 0.78, "#1A1209", 2);
  ellipse(g, x, y, 2.2, 2.2, "#1A1209");
}

/** A classical bust on its own (the head and shoulders), facing front or turned to the wall. */
export function bust(g: G, x: number, y: number, s: number, opts: { turned?: boolean; noseless?: boolean; stone?: string } = {}) {
  const stone = opts.stone ?? "#C9C2B2";
  // (x, y): the bottom of the shoulders.
  poly(g, [
    [x - 22 * s, y],
    [x + 22 * s, y],
    [x + 17 * s, y - 14 * s],
    [x + 8 * s, y - 20 * s],
    [x - 8 * s, y - 20 * s],
    [x - 17 * s, y - 14 * s],
  ], stone, "#5E584C", 1);
  rect(g, x - 5 * s, y - 27 * s, 10 * s, 9 * s, stone);
  if (opts.turned) {
    ellipse(g, x, y - 38 * s, 12 * s, 14 * s, stone, "#5E584C", 1);
    for (let k = -2; k <= 2; k++) ellipse(g, x + k * 4.5 * s, y - 44 * s, 3.4 * s, 3 * s, "#B5AE9E");
    return;
  }
  ellipse(g, x, y - 38 * s, 12 * s, 14 * s, stone, "#5E584C", 1);
  for (let k = -2; k <= 2; k++) ellipse(g, x + k * 4.5 * s, y - 49 * s, 3.4 * s, 3 * s, "#B5AE9E");
  ellipse(g, x - 4.5 * s, y - 40 * s, 2.2 * s, 1.4 * s, "#8F897B");
  ellipse(g, x + 4.5 * s, y - 40 * s, 2.2 * s, 1.4 * s, "#8F897B");
  if (!opts.noseless) poly(g, [
    [x, y - 39 * s],
    [x + 2.4 * s, y - 33 * s],
    [x - 2.4 * s, y - 33 * s],
  ], "#B0A999");
  line(g, x - 3 * s, y - 29.5 * s, x + 3 * s, y - 29.5 * s, "#8F897B", 1);
}

/** A plinth or pedestal (x, y: the bottom centre). */
export function plinth(g: G, x: number, y: number, w: number, h: number, stone = "#7C766A") {
  shadow(g, x, y, w * 0.7);
  rect(g, x - w / 2, y - h, w, h, stone, "#3F3B33", 1);
  rect(g, x - w / 2 - 3, y - h - 5, w + 6, 5, "#8E887B", "#3F3B33", 1);
  rect(g, x - w / 2 - 3, y - 4, w + 6, 4, "#6A655A");
  rect(g, x - w / 2 + 3, y - h + 3, 4, h - 8, "rgba(255,255,255,0.06)");
}
