// CAM 01 · Lobby. The entrance hall: marble floor, the founder's portrait, a clock stopped at three, the
// welcome sign over the front doors, the front desk and its lamp, a coat rack, a bench, a fern, a rug.
import { corners, paintBox } from "./box";
import { clockFace, door, ellipse, face, figure, frame, glow, line, plinth, poly, rect, shadow, words, type G } from "./paint";
import { room, state, type Scene } from "./scene";

const r = room("lobby")
  .obj("clock", "the clock", "lobby.clock", state(320, 92, "3:00"), [-40, -40, 40, 40], 1)
  .obj("founder", "the founder's portrait", "lobby.founder", state(196, 132), [-38, -50, 38, 50], 1)
  .obj("sign", "the welcome sign", "lobby.sign", state(320, 166), [-62, -14, 62, 14], 1)
  .obj("doors", "the front doors", "lobby.doors", state(320, 245, "closed"), [-50, -68, 50, 0], 1)
  .obj("chandelier", "the chandelier", "lobby.chandelier", state(320, 26, "on"), [-40, -26, 40, 24], 2)
  .obj("rug", "the rug", "lobby.rug", state(320, 318), [-110, -26, 110, 26], 3)
  .obj("bench", "the bench", "lobby.bench", state(318, 300), [-60, -34, 60, 6], 4)
  .obj("hats", "the hats on the coat rack", "lobby.hats", state(62, 330, "3"), [-34, -150, 34, 0], 5)
  .obj("lamp", "the desk lamp", "lobby.lamp", state(118, 286, "off"), [-16, -36, 16, 4], 7)
  .obj("fern", "the fern", "lobby.fern", state(548, 366), [-40, -96, 40, 4], 8)
  .obj("donations", "the donation box", "lobby.donations", state(470, 262, "base", false), [-18, -54, 18, 2], 4)
  .obj("figure", "the figure", "lobby.figure", state(598, 344, "base", false), [-30, -156, 30, 4], 9)
  .anomaly("clock", "changed", 3, { variant: "9:15" })
  .anomaly("clock", "missing", 2, { visible: false })
  .anomaly("founder", "changed", 4, { variant: "left" }, { name: "eyes" })
  .anomaly("founder", "changed", 3, { variant: "smile" }, { name: "smile" })
  .anomaly("founder", "missing", 1, { visible: false })
  .anomaly("sign", "changed", 2, { variant: "go-away" })
  .anomaly("doors", "door", 1, { variant: "open" }, { accept: ["changed"] })
  .anomaly("chandelier", "light", 2, { variant: "off" }, { accept: ["changed"] })
  .anomaly("lamp", "light", 2, { variant: "on" }, { accept: ["changed"] })
  .anomaly("bench", "moved", 2, { x: 468, y: 304 })
  .anomaly("hats", "count", 4, { variant: "2" }, { accept: ["missing"] })
  .anomaly("fern", "moved", 2, { x: 452 })
  .anomaly("fern", "missing", 1, { visible: false })
  .anomaly("donations", "extra", 3, { visible: true })
  .anomaly("figure", "intruder", 1, { visible: true }, { accept: ["extra"] })
  .anomaly("rug", "changed", 4, { tint: 1 }, { colour: true, gradual: 26 })
  .anomaly("@view", "mirror", 3, {});

function background(g: G) {
  paintBox(g, {
    back: [110, 40, 530, 245],
    ceiling: "#1B2420",
    wall: "#2F4038",
    side: "#283730",
    floor: "#9C9A8E",
    stripes: "rgba(0,0,0,0.1)",
    wainscot: { h: 44, color: "#3B2B1C" },
    pattern: "checks",
    checks: ["#33342F", "#7D7A6E"],
  });
  // Pilasters either side of the doors.
  for (const x of [250, 390]) {
    rect(g, x - 9, 40, 18, 205, "#3A4B42");
    rect(g, x - 12, 40, 24, 8, "#4A5C52");
  }
  // The front desk, in the foreground.
  shadow(g, 150, 382, 120, 16);
  poly(g, [
    [30, 300],
    [270, 300],
    [262, 384],
    [38, 384],
  ], "#4A3220", "#1E140B", 2);
  rect(g, 22, 290, 256, 14, "#5E412A", "#1E140B", 2);
  for (const x of [80, 150, 220]) rect(g, x - 26, 318, 52, 50, "rgba(0,0,0,0.16)");
  words(g, "RECEPTION", 150, 342, 12, "#C9A55A", { spacing: 2 });
  // A visitors' book on the desk.
  poly(g, [
    [180, 292],
    [222, 290],
    [226, 297],
    [184, 299],
  ], "#E2D8C0", "#3B2A18", 1);
}

const draw: Scene["draw"] = {
  "lobby.clock": (g, s) => clockFace(g, s.x, s.y, 30, s.variant),
  "lobby.founder"(g, s) {
    const inner = frame(g, s.x - 36, s.y - 48, 72, 96);
    rect(g, inner.x, inner.y, inner.w, inner.h, "#26302B");
    glow(g, s.x, s.y - 4, 34, "rgba(120,140,120,0.35)");
    // His coat, then his face.
    poly(g, [
      [inner.x + 4, inner.y + inner.h],
      [inner.x + inner.w - 4, inner.y + inner.h],
      [s.x + 18, s.y + 10],
      [s.x - 18, s.y + 10],
    ], "#1A1F2A");
    poly(g, [
      [s.x - 6, s.y + 10],
      [s.x + 6, s.y + 10],
      [s.x, s.y + 26],
    ], "#D9D2C0");
    face(g, s.x, s.y - 10, 15, { skin: "#C9A88A", hair: "#3A2A1C", eyes: s.variant === "left" ? "left" : "front", mouth: s.variant === "smile" ? "smile" : "flat", mustache: true });
    words(g, "A. MARLOW", s.x, s.y + 42, 7, "#C9A55A", { spacing: 1 });
  },
  "lobby.sign"(g, s) {
    rect(g, s.x - 60, s.y - 12, 120, 24, "#2A1E12", "#C9A55A", 2);
    words(g, s.variant === "go-away" ? "GO AWAY" : "WELCOME", s.x, s.y + 1, 14, "#E0C27A", { spacing: 3 });
  },
  "lobby.doors"(g, s) {
    door(g, s.x - 23, s.y, 44, 66, s.variant, "#4B3020");
    door(g, s.x + 23, s.y, 44, 66, s.variant, "#4B3020");
    rect(g, s.x - 2, s.y - 66, 4, 66, "#2B1D12");
  },
  "lobby.chandelier"(g, s) {
    const on = s.variant === "on";
    if (on) glow(g, s.x, s.y + 40, 230, "rgba(255,226,170,0.2)");
    line(g, s.x, 0, s.x, s.y - 8, "#2B2418", 2);
    poly(g, [
      [s.x - 34, s.y + 6],
      [s.x + 34, s.y + 6],
      [s.x + 18, s.y + 18],
      [s.x - 18, s.y + 18],
    ], "#6E5524", "#2B2418", 1);
    for (let k = -3; k <= 3; k++) {
      const x = s.x + k * 10;
      line(g, x, s.y + 6, x, s.y - 4, "#6E5524", 2);
      ellipse(g, x, s.y - 7, 2.6, 4, on ? "#FFE7A8" : "#5C5040");
      if (on) glow(g, x, s.y - 7, 12, "rgba(255,230,160,0.55)");
    }
  },
  "lobby.rug"(g, s) {
    // An oriental rug in perspective; a slow change turns it from red to blue.
    const red = [122, 34, 34];
    const blue = [34, 62, 122];
    const k = s.tint;
    const c = red.map((v, i) => Math.round(v + (blue[i]! - v) * k));
    poly(g, [
      [s.x - 86, s.y - 22],
      [s.x + 86, s.y - 22],
      [s.x + 108, s.y + 24],
      [s.x - 108, s.y + 24],
    ], `rgb(${c[0]},${c[1]},${c[2]})`, "#2A1A12", 2);
    poly(g, [
      [s.x - 70, s.y - 15],
      [s.x + 70, s.y - 15],
      [s.x + 88, s.y + 17],
      [s.x - 88, s.y + 17],
    ], "rgba(0,0,0,0)", "#C9A55A", 2);
    ellipse(g, s.x, s.y + 1, 26, 9, "rgba(201,165,90,0.55)");
  },
  "lobby.bench"(g, s) {
    shadow(g, s.x, s.y + 2, 62, 9);
    rect(g, s.x - 58, s.y - 26, 116, 10, "#5C3E26", "#1E140B", 1.5);
    rect(g, s.x - 58, s.y - 16, 116, 6, "#47301D");
    for (const dx of [-50, 46]) rect(g, s.x + dx, s.y - 12, 6, 14, "#2B1D12");
  },
  "lobby.hats"(g, s) {
    shadow(g, s.x, s.y, 22, 6);
    line(g, s.x, s.y, s.x, s.y - 142, "#3B2A18", 4);
    line(g, s.x - 16, s.y, s.x + 16, s.y, "#3B2A18", 4);
    const n = Number(s.variant);
    const spots: Array<readonly [number, number]> = [
      [-16, -136],
      [16, -128],
      [-14, -112],
      [15, -104],
    ];
    for (let k = 0; k < n; k++) {
      const [dx, dy] = spots[k]!;
      const x = s.x + dx;
      const y = s.y + dy;
      line(g, s.x, y + 6, x, y + 4, "#3B2A18", 2);
      ellipse(g, x, y + 4, 12, 3.2, "#15161B");
      poly(g, [
        [x - 8, y + 4],
        [x + 8, y + 4],
        [x + 6, y - 7],
        [x - 6, y - 7],
      ], k % 2 ? "#3C2A1F" : "#22262E");
    }
  },
  "lobby.lamp"(g, s) {
    const on = s.variant === "on";
    if (on) glow(g, s.x, s.y - 18, 80, "rgba(150,255,170,0.32)");
    rect(g, s.x - 9, s.y - 2, 18, 4, "#2B2418");
    line(g, s.x, s.y - 2, s.x, s.y - 22, "#2B2418", 2);
    poly(g, [
      [s.x - 13, s.y - 20],
      [s.x + 13, s.y - 20],
      [s.x + 8, s.y - 32],
      [s.x - 8, s.y - 32],
    ], on ? "#9CFFB8" : "#2E5A3E", "#13241A", 1);
  },
  "lobby.fern"(g, s) {
    shadow(g, s.x, s.y, 26, 6);
    poly(g, [
      [s.x - 18, s.y],
      [s.x + 18, s.y],
      [s.x + 22, s.y - 30],
      [s.x - 22, s.y - 30],
    ], "#6B4A30", "#2B1D12", 1.5);
    for (let k = 0; k < 9; k++) {
      const a = -Math.PI / 2 + (k - 4) * 0.32;
      const len = 58 + (k % 3) * 9;
      g.save();
      g.beginPath();
      g.moveTo(s.x, s.y - 30);
      g.quadraticCurveTo(s.x + Math.cos(a) * len * 0.5, s.y - 30 + Math.sin(a) * len * 0.75, s.x + Math.cos(a) * len, s.y - 30 + Math.sin(a) * len * 0.6 + 16);
      g.lineWidth = 7;
      g.strokeStyle = k % 2 ? "#2F5A34" : "#3B6E40";
      g.lineCap = "round";
      g.stroke();
      g.restore();
    }
  },
  "lobby.donations"(g, s) {
    plinth(g, s.x, s.y, 22, 30, "#4A3A28");
    rect(g, s.x - 14, s.y - 54, 28, 22, "#B8C4C8", "#2B2A26", 1.5);
    rect(g, s.x - 7, s.y - 51, 14, 2.5, "#2B2A26");
    words(g, "GIVE", s.x, s.y - 41, 7, "#2B2A26");
  },
  "lobby.figure": (g, s) => figure(g, s.x, s.y, 150),
};

export const LOBBY: Scene = {
  camera: "lobby",
  room: background,
  objects: r.objects,
  anomalies: r.anomalies,
  draw,
  visitor: { x: 440, y: 338, scale: 0.92 },
  light: (g) => corners(g, 0.55),
};
