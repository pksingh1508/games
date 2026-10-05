// CAM 02 · Gallery. Red damask, gilt frames: the portrait of a lady, a landscape, a still life; brass posts and a
// velvet rope; a bench; a bust; an open doorway to the east wing.
import { corners, paintBox } from "./box";
import { bust, door, ellipse, face, figure, frame, glow, line, plinth, poly, rect, sconce, shadow, words, type G } from "./paint";
import { room, state, type Scene } from "./scene";

const r = room("gallery")
  .obj("sign", "the gallery sign", "gallery.sign", state(320, 50), [-48, -10, 48, 10], 1)
  .obj("lamps", "the wall lamps", "gallery.lamps", state(320, 92, "on"), [-90, -16, 90, 12], 1)
  .obj("lady", "the portrait of the lady", "gallery.lady", state(172, 126), [-42, -54, 42, 54], 2)
  .obj("landscape", "the landscape", "gallery.landscape", state(320, 120, "day"), [-66, -45, 66, 45], 2)
  .obj("stilllife", "the still life", "gallery.stilllife", state(452, 128, "fruit"), [-40, -50, 40, 50], 2)
  .obj("small", "the little painting", "gallery.small", state(392, 198, "base", false), [-24, -20, 24, 20], 2)
  .obj("door", "the east doorway", "gallery.door", state(522, 250, "open"), [-22, -92, 22, 0], 2)
  .obj("rope", "the brass posts", "gallery.rope", state(320, 272, "4"), [-190, -36, 190, 4], 3)
  .obj("bench", "the bench", "gallery.bench", state(330, 322), [-72, -36, 72, 6], 4)
  .obj("bust", "the bust", "gallery.bust", state(566, 360), [-28, -116, 28, 4], 8)
  .obj("figure", "the figure", "gallery.figure", state(440, 300, "base", false), [-24, -132, 24, 4], 3.5)
  .anomaly("lady", "changed", 4, { variant: "left" }, { name: "eyes" })
  .anomaly("lady", "changed", 2, { variant: "turned" }, { name: "turned" })
  .anomaly("lady", "missing", 1, { visible: false })
  .anomaly("lady", "changed", 4, { tint: 1 }, { name: "dress", colour: true, gradual: 30 })
  .anomaly("landscape", "changed", 3, { variant: "night" })
  .anomaly("landscape", "missing", 1, { visible: false })
  .anomaly("stilllife", "changed", 3, { variant: "skull" })
  .anomaly("small", "extra", 3, { visible: true })
  .anomaly("lamps", "light", 2, { variant: "left-off" }, { accept: ["changed"] })
  .anomaly("sign", "changed", 5, { variant: "III" })
  .anomaly("door", "door", 2, { variant: "closed" }, { accept: ["changed"] })
  .anomaly("rope", "count", 4, { variant: "3" }, { accept: ["missing"] })
  .anomaly("bench", "moved", 2, { x: 200 })
  .anomaly("bust", "missing", 1, { visible: false })
  .anomaly("bust", "moved", 2, { x: 470, y: 352 })
  .anomaly("figure", "intruder", 1, { visible: true }, { accept: ["extra"] })
  .anomaly("@view", "mirror", 3, {});

function background(g: G) {
  paintBox(g, {
    back: [90, 36, 550, 250],
    ceiling: "#1E1A1A",
    wall: "#4A2328",
    side: "#3E1E22",
    floor: "#5A3E28",
    stripes: "rgba(255,200,150,0.05)",
    wainscot: { h: 40, color: "#2E1D14" },
    pattern: "planks",
  });
  // A dado rail.
  line(g, 90, 196, 550, 196, "rgba(201,165,90,0.35)", 2);
}

const draw: Scene["draw"] = {
  "gallery.sign"(g, s) {
    rect(g, s.x - 46, s.y - 9, 92, 18, "#1E140C", "#9A7B3C", 1.5);
    words(g, `GALLERY ${s.variant === "III" ? "III" : "II"}`, s.x, s.y + 1, 10, "#D9BC72", { spacing: 2 });
  },
  "gallery.lamps"(g, s) {
    sconce(g, s.x - 76, s.y, s.variant !== "left-off", 0.8);
    sconce(g, s.x + 72, s.y, true, 0.8);
  },
  "gallery.lady"(g, s) {
    const inner = frame(g, s.x - 40, s.y - 52, 80, 104);
    rect(g, inner.x, inner.y, inner.w, inner.h, "#1F2A26");
    glow(g, s.x, s.y - 10, 40, "rgba(160,170,140,0.3)");
    // Her dress (a slow change turns it from green to red).
    const k = s.tint;
    const c = [42 + (150 - 42) * k, 92 + (38 - 92) * k, 70 + (44 - 70) * k].map(Math.round);
    poly(g, [
      [inner.x + 6, inner.y + inner.h],
      [inner.x + inner.w - 6, inner.y + inner.h],
      [s.x + 16, s.y + 8],
      [s.x - 16, s.y + 8],
    ], `rgb(${c[0]},${c[1]},${c[2]})`);
    rect(g, s.x - 5, s.y + 2, 10, 9, "#D6B596");
    face(g, s.x, s.y - 12, 15, { skin: "#D6B596", hair: "#2A1A12", eyes: s.variant === "left" ? "left" : "front", mouth: "flat", turned: s.variant === "turned" });
    if (s.variant !== "turned") {
      ellipse(g, s.x - 17, s.y - 14, 5, 12, "#2A1A12");
      ellipse(g, s.x + 17, s.y - 14, 5, 12, "#2A1A12");
    }
  },
  "gallery.landscape"(g, s) {
    const inner = frame(g, s.x - 64, s.y - 43, 128, 86);
    const night = s.variant === "night";
    rect(g, inner.x, inner.y, inner.w, inner.h, night ? "#121B2E" : "#7FA4B8");
    if (night) ellipse(g, inner.x + inner.w * 0.78, inner.y + 16, 7, 7, "#E8E4C8");
    else ellipse(g, inner.x + inner.w * 0.78, inner.y + 16, 8, 8, "#F0D98C");
    poly(g, [
      [inner.x, inner.y + inner.h],
      [inner.x, inner.y + inner.h * 0.55],
      [inner.x + inner.w * 0.35, inner.y + inner.h * 0.38],
      [inner.x + inner.w * 0.7, inner.y + inner.h * 0.6],
      [inner.x + inner.w, inner.y + inner.h * 0.46],
      [inner.x + inner.w, inner.y + inner.h],
    ], night ? "#1B2A20" : "#5E8A4C");
    // A little white house.
    const hx = inner.x + inner.w * 0.32;
    const hy = inner.y + inner.h * 0.62;
    rect(g, hx, hy, 16, 11, night ? "#4A4A3C" : "#ECE6D2");
    poly(g, [
      [hx - 2, hy],
      [hx + 8, hy - 8],
      [hx + 18, hy],
    ], "#7A3A2A");
    rect(g, hx + 6, hy + 4, 4, 5, night ? "#F4D58C" : "#3A2A1A");
  },
  "gallery.stilllife"(g, s) {
    const inner = frame(g, s.x - 38, s.y - 48, 76, 96);
    rect(g, inner.x, inner.y, inner.w, inner.h, "#2A2218");
    rect(g, inner.x, inner.y + inner.h * 0.68, inner.w, inner.h * 0.32, "#4A3A28");
    if (s.variant === "skull") {
      ellipse(g, s.x, s.y + 8, 15, 13, "#D8D0BC");
      rect(g, s.x - 8, s.y + 16, 16, 9, "#D8D0BC");
      ellipse(g, s.x - 6, s.y + 7, 4, 4.5, "#1A140C");
      ellipse(g, s.x + 6, s.y + 7, 4, 4.5, "#1A140C");
      poly(g, [
        [s.x, s.y + 12],
        [s.x - 2, s.y + 16],
        [s.x + 2, s.y + 16],
      ], "#1A140C");
      for (let k = -2; k <= 2; k++) line(g, s.x + k * 3, s.y + 19, s.x + k * 3, s.y + 24, "#1A140C", 1);
    } else {
      ellipse(g, s.x, s.y + 20, 24, 8, "#8A6A3A");
      ellipse(g, s.x - 9, s.y + 10, 8, 8, "#B8302A");
      ellipse(g, s.x + 7, s.y + 9, 8, 8, "#C9A23A");
      ellipse(g, s.x, s.y + 2, 7, 7, "#6A8A3A");
      ellipse(g, s.x + 14, s.y + 14, 6, 6, "#7A3A6A");
    }
  },
  "gallery.small"(g, s) {
    const inner = frame(g, s.x - 22, s.y - 18, 44, 36, "#8A8A8A");
    rect(g, inner.x, inner.y, inner.w, inner.h, "#2A2A30");
    // A child's face. Nobody remembers hanging it.
    face(g, s.x, s.y, 7, { skin: "#C9BFB0", hair: "#1A1A1A", eyes: "front", mouth: "flat" });
  },
  "gallery.door"(g, s) {
    if (s.variant === "open") {
      rect(g, s.x - 24, s.y - 95, 48, 95, "#2B1D12");
      rect(g, s.x - 19, s.y - 90, 38, 90, "#050505");
      glow(g, s.x, s.y - 30, 30, "rgba(40,60,55,0.4)");
    } else door(g, s.x, s.y, 38, 90, "closed", "#4B3020");
  },
  "gallery.rope"(g, s) {
    const n = Number(s.variant);
    const xs = [-180, -60, 60, 180].slice(0, n);
    const top = s.y - 22;
    for (let k = 0; k < xs.length - 1; k++) {
      const a = s.x + xs[k]!;
      const b = s.x + xs[k + 1]!;
      g.save();
      g.beginPath();
      g.moveTo(a, top);
      g.quadraticCurveTo((a + b) / 2, s.y - 8, b, top);
      g.lineWidth = 4;
      g.strokeStyle = "#7A1A24";
      g.stroke();
      g.restore();
    }
    for (const dx of xs) {
      const x = s.x + dx;
      shadow(g, x, s.y, 9, 3);
      rect(g, x - 2, s.y - 26, 4, 26, "#B8963E");
      ellipse(g, x, s.y - 27, 4.5, 4.5, "#D9B65A");
      ellipse(g, x, s.y, 8, 2.5, "#8A6E2E");
    }
  },
  "gallery.bench"(g, s) {
    shadow(g, s.x, s.y + 2, 74, 10);
    rect(g, s.x - 70, s.y - 28, 140, 12, "#3A2418", "#140C08", 1.5);
    rect(g, s.x - 66, s.y - 25, 132, 6, "#5A2A2E");
    for (const dx of [-60, 54]) rect(g, s.x + dx, s.y - 16, 6, 18, "#1E140B");
  },
  "gallery.bust"(g, s) {
    plinth(g, s.x, s.y, 34, 54);
    bust(g, s.x, s.y - 59, 1);
  },
  "gallery.figure": (g, s) => figure(g, s.x, s.y, 128),
};

export const GALLERY: Scene = {
  camera: "gallery",
  room: background,
  objects: r.objects,
  anomalies: r.anomalies,
  draw,
  visitor: { x: 212, y: 340, scale: 0.9 },
  light: (g) => corners(g, 0.6),
};
