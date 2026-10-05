// CAM 04 · Storage. Concrete and clutter under one hanging bulb: a shelf of books and a stuffed owl, a stack of
// crates, a mannequin, a globe, a ladder, a painting under a dust sheet, and the loading-bay shutter.
import { corners, paintBox } from "./box";
import { ellipse, face, figure, glow, line, poly, rect, shadow, type G } from "./paint";
import { room, state, type Scene } from "./scene";

const r = room("storage")
  .obj("bulb", "the light bulb", "storage.bulb", state(320, 34, "on"), [-16, -34, 16, 16], 9)
  .obj("books", "the books on the top shelf", "storage.books", state(170, 98, "7"), [-60, -24, 60, 4], 2)
  .obj("owl", "the owl", "storage.owl", state(136, 164, "front"), [-18, -40, 18, 2], 2)
  .obj("shutter", "the loading-bay shutter", "storage.shutter", state(420, 250, "closed"), [-56, -132, 56, 0], 1)
  .obj("sheet", "the painting under the sheet", "storage.sheet", state(286, 252, "covered"), [-34, -78, 34, 2], 3)
  .obj("crates", "the stack of crates", "storage.crates", state(528, 344, "3"), [-50, -132, 50, 4], 5)
  .obj("globe", "the globe", "storage.globe", state(262, 340, "europe"), [-26, -66, 26, 4], 6)
  .obj("mannequin", "the mannequin", "storage.mannequin", state(92, 350, "down"), [-30, -164, 30, 4], 7)
  .obj("bucket", "the mop and bucket", "storage.bucket", state(372, 352, "base", false), [-24, -72, 24, 4], 6)
  .obj("ladder", "the ladder", "storage.ladder", state(606, 318), [-24, -190, 24, 4], 4)
  .obj("figure", "the figure", "storage.figure", state(440, 326, "base", false), [-28, -146, 28, 4], 6)
  .anomaly("bulb", "light", 2, { variant: "off" }, { accept: ["changed"] })
  .anomaly("books", "count", 5, { variant: "6" }, { accept: ["missing"] })
  .anomaly("owl", "changed", 4, { variant: "turned" })
  .anomaly("owl", "missing", 2, { visible: false })
  .anomaly("shutter", "door", 1, { variant: "open" }, { accept: ["changed"] })
  .anomaly("sheet", "changed", 3, { variant: "uncovered" })
  .anomaly("crates", "count", 4, { variant: "2" }, { accept: ["missing"] })
  .anomaly("globe", "changed", 4, { variant: "americas" })
  .anomaly("globe", "missing", 1, { visible: false })
  .anomaly("mannequin", "moved", 2, { x: 196, y: 356 })
  .anomaly("mannequin", "changed", 3, { variant: "up" })
  .anomaly("mannequin", "moved", 4, { x: 150, y: 384 }, { name: "creep", gradual: 30 })
  .anomaly("bucket", "extra", 3, { visible: true })
  .anomaly("ladder", "moved", 2, { x: 520, y: 312 })
  .anomaly("figure", "intruder", 1, { visible: true }, { accept: ["extra"] })
  .anomaly("@view", "mirror", 3, {});

function background(g: G) {
  paintBox(g, {
    back: [80, 40, 560, 250],
    ceiling: "#151816",
    wall: "#3A403B",
    side: "#313632",
    floor: "#4B4E48",
    pattern: "concrete",
  });
  // Stains and a pipe.
  ellipse(g, 220, 200, 40, 22, "rgba(0,0,0,0.12)");
  ellipse(g, 500, 120, 30, 50, "rgba(0,0,0,0.1)");
  line(g, 80, 60, 560, 60, "#2A2E2B", 6);
  line(g, 80, 60, 560, 60, "rgba(255,255,255,0.08)", 2);
  // The shelving unit (its books and owl are objects).
  const sx = 100;
  for (const y of [100, 168, 236]) rect(g, sx, y, 150, 6, "#5A4632", "#22180E", 1);
  rect(g, sx - 4, 50, 6, 196, "#4A3826");
  rect(g, sx + 148, 50, 6, 196, "#4A3826");
  // Boxes on the bottom shelf.
  rect(g, 120, 200, 40, 36, "#8A6A44", "#2A1E12", 1);
  rect(g, 168, 210, 50, 26, "#7A5C3A", "#2A1E12", 1);
  // Middle shelf: jars.
  for (const x of [184, 204, 224]) {
    rect(g, x - 6, 146, 12, 22, "rgba(180,200,190,0.35)", "#2A2E2B", 1);
    rect(g, x - 6, 156, 12, 12, "rgba(120,90,60,0.5)");
  }
}

const draw: Scene["draw"] = {
  "storage.bulb"(g, s) {
    const on = s.variant === "on";
    if (on) {
      glow(g, s.x, s.y + 10, 300, "rgba(255,230,170,0.22)");
      glow(g, s.x, s.y + 4, 30, "rgba(255,240,200,0.7)");
    }
    line(g, s.x, 0, s.x, s.y - 6, "#1A1A1A", 1.5);
    rect(g, s.x - 4, s.y - 8, 8, 6, "#3A3A36");
    ellipse(g, s.x, s.y + 2, 7, 9, on ? "#FFF2C8" : "#5A5A50", "#2A2A26", 1);
  },
  "storage.books"(g, s) {
    const n = Number(s.variant);
    const colours = ["#7A2A2A", "#2A4A6A", "#5A6A2A", "#6A4A2A", "#3A2A5A", "#8A6A2A", "#2A5A4A", "#6A2A4A"];
    const w = 13;
    const start = s.x - 56;
    for (let k = 0; k < n; k++) {
      const h = 22 + ((k * 7) % 6);
      rect(g, start + k * (w + 2), s.y - h, w, h, colours[k]!, "#140E08", 1);
      line(g, start + k * (w + 2) + 2, s.y - h + 5, start + k * (w + 2) + w - 2, s.y - h + 5, "rgba(255,230,160,0.4)", 1);
    }
  },
  "storage.owl"(g, s) {
    // A stuffed owl on a wooden perch.
    rect(g, s.x - 14, s.y - 4, 28, 4, "#4A3826");
    ellipse(g, s.x, s.y - 16, 13, 15, "#7A6248", "#2A2014", 1);
    ellipse(g, s.x, s.y - 12, 8, 9, "#A88E6A");
    if (s.variant === "turned") {
      ellipse(g, s.x, s.y - 33, 11, 10, "#6A5238", "#2A2014", 1);
      line(g, s.x - 6, s.y - 34, s.x + 6, s.y - 34, "rgba(0,0,0,0.25)", 1);
    } else {
      ellipse(g, s.x, s.y - 33, 11, 10, "#7A6248", "#2A2014", 1);
      ellipse(g, s.x - 5, s.y - 34, 4, 4, "#E8C850");
      ellipse(g, s.x + 5, s.y - 34, 4, 4, "#E8C850");
      ellipse(g, s.x - 5, s.y - 34, 1.6, 2, "#140E08");
      ellipse(g, s.x + 5, s.y - 34, 1.6, 2, "#140E08");
      poly(g, [
        [s.x, s.y - 30],
        [s.x - 2, s.y - 27],
        [s.x + 2, s.y - 27],
      ], "#3A2A14");
    }
    poly(g, [
      [s.x - 9, s.y - 42],
      [s.x - 6, s.y - 36],
      [s.x - 11, s.y - 37],
    ], "#5A4430");
    poly(g, [
      [s.x + 9, s.y - 42],
      [s.x + 6, s.y - 36],
      [s.x + 11, s.y - 37],
    ], "#5A4430");
  },
  "storage.shutter"(g, s) {
    const left = s.x - 54;
    const top = s.y - 130;
    rect(g, left - 6, top - 6, 120, 136, "#2A2E2B");
    if (s.variant === "open") {
      rect(g, left, top, 108, 130, "#040504");
      glow(g, s.x, s.y - 30, 70, "rgba(60,80,110,0.35)");
      rect(g, left, top, 108, 18, "#5A605A", "#1A1C1A", 1);
    } else {
      rect(g, left, top, 108, 130, "#5A605A", "#1A1C1A", 1);
      for (let y = top + 8; y < s.y; y += 8) line(g, left, y, left + 108, y, "rgba(0,0,0,0.3)", 1.2);
    }
    rect(g, s.x - 42, s.y - 6, 84, 4, "#C9A23A");
  },
  "storage.sheet"(g, s) {
    shadow(g, s.x, s.y, 36, 6);
    if (s.variant === "uncovered") {
      // The sheet's slipped: a portrait, staring out.
      rect(g, s.x - 32, s.y - 76, 64, 76, "#6E5524", "#1A140C", 1.5);
      rect(g, s.x - 26, s.y - 70, 52, 64, "#1E1A20");
      face(g, s.x, s.y - 42, 14, { skin: "#B8B0A0", hair: "#141414", eyes: "front", mouth: "open" });
      poly(g, [
        [s.x - 34, s.y],
        [s.x + 34, s.y],
        [s.x + 30, s.y - 14],
        [s.x - 30, s.y - 10],
      ], "#C9C4B6", "#6A665A", 1);
    } else {
      g.save();
      g.beginPath();
      g.moveTo(s.x - 34, s.y);
      g.quadraticCurveTo(s.x - 40, s.y - 50, s.x - 26, s.y - 80);
      g.lineTo(s.x + 26, s.y - 80);
      g.quadraticCurveTo(s.x + 40, s.y - 50, s.x + 34, s.y);
      g.closePath();
      g.fillStyle = "#C9C4B6";
      g.fill();
      g.lineWidth = 1.2;
      g.strokeStyle = "#6A665A";
      g.stroke();
      g.restore();
      for (const dx of [-14, 2, 16]) line(g, s.x + dx, s.y - 76, s.x + dx * 1.3, s.y - 4, "rgba(0,0,0,0.12)", 2);
    }
  },
  "storage.crates"(g, s) {
    const n = Number(s.variant);
    shadow(g, s.x, s.y, 50, 9);
    const spots: Array<readonly [number, number, number]> = [
      [-46, 0, 50],
      [4, 0, 46],
      [-24, -46, 48],
    ];
    for (let k = 0; k < n; k++) {
      const [dx, dy, w] = spots[k]!;
      const x = s.x + dx;
      const y = s.y + dy;
      rect(g, x, y - 46, w, 46, "#8A6A44", "#2A1E12", 1.5);
      line(g, x + 3, y - 43, x + w - 3, y - 3, "#5A4428", 3);
      rect(g, x, y - 46, w, 5, "rgba(255,230,180,0.08)");
    }
  },
  "storage.globe"(g, s) {
    shadow(g, s.x, s.y, 20, 5);
    line(g, s.x, s.y, s.x, s.y - 24, "#4A3826", 4);
    ellipse(g, s.x, s.y, 14, 4, "#4A3826");
    ellipse(g, s.x, s.y - 44, 22, 22, "#2A5A7A", "#14222E", 1.5);
    g.save();
    g.beginPath();
    g.arc(s.x, s.y - 44, 22, 0, Math.PI * 2);
    g.clip();
    if (s.variant === "americas") {
      poly(g, [
        [s.x - 12, s.y - 62],
        [s.x + 2, s.y - 60],
        [s.x - 2, s.y - 48],
        [s.x + 6, s.y - 36],
        [s.x - 2, s.y - 26],
        [s.x - 8, s.y - 40],
        [s.x - 14, s.y - 50],
      ], "#7A9A4A");
    } else {
      poly(g, [
        [s.x - 4, s.y - 60],
        [s.x + 14, s.y - 58],
        [s.x + 18, s.y - 46],
        [s.x + 6, s.y - 40],
        [s.x + 10, s.y - 30],
        [s.x - 2, s.y - 34],
        [s.x - 8, s.y - 50],
      ], "#7A9A4A");
    }
    g.restore();
    g.save();
    g.beginPath();
    g.arc(s.x, s.y - 44, 26, Math.PI * 1.15, Math.PI * 1.85);
    g.lineWidth = 2.5;
    g.strokeStyle = "#B8963E";
    g.stroke();
    g.restore();
  },
  "storage.mannequin"(g, s) {
    shadow(g, s.x, s.y, 22, 6);
    const skin = "#C8BCA8";
    const dark = "#5E5446";
    line(g, s.x, s.y, s.x, s.y - 40, "#3A3226", 3);
    ellipse(g, s.x, s.y, 14, 4, "#3A3226");
    // Torso, with a dress-form waist.
    poly(g, [
      [s.x - 16, s.y - 40],
      [s.x + 16, s.y - 40],
      [s.x + 12, s.y - 80],
      [s.x + 20, s.y - 120],
      [s.x - 20, s.y - 120],
      [s.x - 12, s.y - 80],
    ], skin, dark, 1.2);
    if (s.variant === "up") {
      line(g, s.x + 18, s.y - 116, s.x + 34, s.y - 156, skin, 6);
      line(g, s.x - 18, s.y - 116, s.x - 26, s.y - 76, skin, 6);
    } else {
      line(g, s.x + 18, s.y - 116, s.x + 26, s.y - 76, skin, 6);
      line(g, s.x - 18, s.y - 116, s.x - 26, s.y - 76, skin, 6);
    }
    rect(g, s.x - 4, s.y - 130, 8, 10, skin);
    ellipse(g, s.x, s.y - 142, 11, 13, skin, dark, 1.2);
  },
  "storage.bucket"(g, s) {
    shadow(g, s.x, s.y, 20, 5);
    poly(g, [
      [s.x - 16, s.y - 24],
      [s.x + 16, s.y - 24],
      [s.x + 12, s.y],
      [s.x - 12, s.y],
    ], "#3A5A7A", "#14222E", 1.2);
    ellipse(g, s.x, s.y - 24, 16, 4, "#2A3A4A");
    line(g, s.x + 4, s.y - 22, s.x + 18, s.y - 70, "#8A6A44", 3);
    poly(g, [
      [s.x + 2, s.y - 26],
      [s.x + 12, s.y - 26],
      [s.x + 8, s.y - 14],
      [s.x - 2, s.y - 14],
    ], "#D8D2C0");
  },
  "storage.ladder"(g, s) {
    shadow(g, s.x - 10, s.y, 22, 5);
    line(g, s.x - 18, s.y, s.x - 2, s.y - 186, "#8A6A44", 4);
    line(g, s.x + 8, s.y, s.x + 22, s.y - 186, "#8A6A44", 4);
    for (let k = 1; k < 9; k++) {
      const t = k / 9;
      line(g, s.x - 18 + 16 * t, s.y - 186 * t, s.x + 8 + 14 * t, s.y - 186 * t, "#6A5034", 3);
    }
  },
  "storage.figure": (g, s) => figure(g, s.x, s.y, 146),
};

export const STORAGE: Scene = {
  camera: "storage",
  room: background,
  objects: r.objects,
  anomalies: r.anomalies,
  draw,
  light: (g) => corners(g, 0.65),
};
