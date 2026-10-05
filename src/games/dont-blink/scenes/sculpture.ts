// CAM 03 · Sculpture Hall. Stone and moonlight: the Visitor's pedestal in the middle (it lives here), two busts,
// a suit of armour, a great urn, a mask on the wall, the high window and the exit sign.
import { corners, paintBox } from "./box";
import { bust, ellipse, face, figure, glow, line, plinth, poly, rect, shadow, words, type G } from "./paint";
import { room, state, type Scene } from "./scene";

const r = room("sculpture")
  .obj("window", "the window", "sculpture.window", state(320, 84, "full"), [-48, -40, 48, 40], 1)
  .obj("exit", "the exit sign", "sculpture.exit", state(470, 58, "on"), [-26, -11, 26, 11], 1)
  .obj("mask", "the mask", "sculpture.mask", state(196, 120, "smile"), [-24, -28, 24, 28], 1)
  .obj("bustl", "the bust on the left", "sculpture.bustl", state(196, 304), [-26, -106, 26, 4], 4)
  .obj("bustr", "the bust on the right", "sculpture.bustr", state(452, 304), [-26, -106, 26, 4], 4)
  .obj("hand", "the stone hand", "sculpture.hand", state(392, 336, "base", false), [-20, -58, 20, 4], 5)
  .obj("armour", "the suit of armour", "sculpture.armour", state(572, 342, "down"), [-30, -150, 30, 4], 7)
  .obj("urn", "the urn", "sculpture.urn", state(82, 360), [-34, -84, 34, 4], 8)
  .obj("figure", "the figure", "sculpture.figure", state(112, 300, "base", false), [-26, -136, 26, 4], 5)
  .anomaly("window", "changed", 4, { variant: "crescent" })
  .anomaly("window", "changed", 4, { tint: 1 }, { name: "redmoon", colour: true, gradual: 28 })
  .anomaly("exit", "light", 2, { variant: "off" }, { accept: ["changed"] })
  .anomaly("mask", "changed", 3, { variant: "frown" })
  .anomaly("mask", "missing", 2, { visible: false })
  .anomaly("bustl", "changed", 3, { variant: "turned" })
  .anomaly("bustl", "missing", 1, { visible: false })
  .anomaly("bustr", "changed", 5, { variant: "noseless" })
  .anomaly("bustr", "moved", 2, { x: 470, y: 360 })
  .anomaly("hand", "extra", 3, { visible: true })
  .anomaly("armour", "changed", 3, { variant: "up" })
  .anomaly("armour", "moved", 2, { x: 500, y: 330 })
  .anomaly("urn", "missing", 1, { visible: false })
  .anomaly("urn", "moved", 2, { x: 150, y: 352 })
  .anomaly("figure", "intruder", 1, { visible: true }, { accept: ["extra"] })
  .anomaly("@view", "mirror", 3, {});

function background(g: G) {
  paintBox(g, {
    back: [100, 30, 540, 245],
    ceiling: "#161C1A",
    wall: "#3C4642",
    side: "#323B37",
    floor: "#5D605A",
    pattern: "flags",
  });
  // Columns either side.
  for (const x of [128, 512]) {
    rect(g, x - 15, 30, 30, 215, "#56605B");
    for (let k = -1; k <= 1; k++) line(g, x + k * 8, 40, x + k * 8, 236, "rgba(0,0,0,0.18)", 2);
    rect(g, x - 20, 30, 40, 10, "#636E68");
    rect(g, x - 20, 235, 40, 10, "#636E68");
  }
  // The Visitor's pedestal, with its plaque (it lives here).
  plinth(g, 320, 300, 70, 38, "#6E7069");
  rect(g, 300, 276, 40, 13, "#3A3020", "#9A7B3C", 1);
  words(g, "THE VISITOR", 320, 282.5, 5.5, "#D9BC72", { spacing: 0.5 });
}

const draw: Scene["draw"] = {
  "sculpture.window"(g, s) {
    rect(g, s.x - 44, s.y - 38, 88, 76, "#0C1424", "#2A2F2C", 4);
    // Moonlight: the moon can slowly redden (Night 4).
    const k = s.tint;
    const moon = `rgb(${Math.round(232 + (200 - 232) * k)},${Math.round(232 + (70 - 232) * k)},${Math.round(212 + (60 - 212) * k)})`;
    glow(g, s.x + 14, s.y - 12, 40, k > 0.5 ? "rgba(200,80,60,0.25)" : "rgba(200,220,255,0.22)");
    ellipse(g, s.x + 14, s.y - 12, 11, 11, moon);
    if (s.variant === "crescent") ellipse(g, s.x + 19, s.y - 15, 10, 10, "#0C1424");
    line(g, s.x, s.y - 38, s.x, s.y + 38, "#2A2F2C", 3);
    line(g, s.x - 44, s.y, s.x + 44, s.y, "#2A2F2C", 3);
  },
  "sculpture.exit"(g, s) {
    const on = s.variant === "on";
    if (on) glow(g, s.x, s.y, 44, "rgba(80,255,140,0.3)");
    rect(g, s.x - 24, s.y - 9, 48, 18, on ? "#0E6B34" : "#18291F", "#0A1A10", 1.5);
    words(g, "EXIT", s.x, s.y + 1, 11, on ? "#C8FFD8" : "#3E5A46", { font: "mono", spacing: 2 });
  },
  "sculpture.mask"(g, s) {
    ellipse(g, s.x, s.y, 20, 26, "#B8925A", "#3A2A14", 1.5);
    face(g, s.x, s.y + 2, 15, { skin: "#B8925A", eyes: "none", mouth: s.variant === "frown" ? "frown" : "smile", ink: "#2A1A08" });
    ellipse(g, s.x - 7, s.y - 4, 4.5, 3, "#1A1008");
    ellipse(g, s.x + 7, s.y - 4, 4.5, 3, "#1A1008");
    line(g, s.x - 20, s.y - 6, s.x - 28, s.y - 10, "#5A3A14", 2);
    line(g, s.x + 20, s.y - 6, s.x + 28, s.y - 10, "#5A3A14", 2);
  },
  "sculpture.bustl"(g, s) {
    plinth(g, s.x, s.y, 34, 50);
    bust(g, s.x, s.y - 55, 1, { turned: s.variant === "turned" });
  },
  "sculpture.bustr"(g, s) {
    plinth(g, s.x, s.y, 34, 50);
    bust(g, s.x, s.y - 55, 1, { noseless: s.variant === "noseless" });
  },
  "sculpture.hand"(g, s) {
    plinth(g, s.x, s.y, 24, 18);
    // A stone hand, reaching up.
    rect(g, s.x - 6, s.y - 40, 12, 18, "#C9C2B2", "#5E584C", 1);
    for (let k = 0; k < 4; k++) rect(g, s.x - 6 + k * 3.2, s.y - 56 + Math.abs(k - 1.5) * 2, 2.6, 18, "#C9C2B2");
    line(g, s.x + 6, s.y - 36, s.x + 11, s.y - 46, "#C9C2B2", 3);
  },
  "sculpture.armour"(g, s) {
    shadow(g, s.x, s.y, 26, 7);
    const metal = "#8E9696";
    const dark = "#3A4040";
    // Legs, body, arms.
    rect(g, s.x - 12, s.y - 56, 9, 56, metal, dark, 1);
    rect(g, s.x + 3, s.y - 56, 9, 56, metal, dark, 1);
    poly(g, [
      [s.x - 20, s.y - 58],
      [s.x + 20, s.y - 58],
      [s.x + 18, s.y - 108],
      [s.x - 18, s.y - 108],
    ], metal, dark, 1.2);
    line(g, s.x, s.y - 106, s.x, s.y - 62, "rgba(0,0,0,0.25)", 2);
    rect(g, s.x - 28, s.y - 104, 8, 44, metal, dark, 1);
    rect(g, s.x + 20, s.y - 104, 8, 44, metal, dark, 1);
    // A spear in its right hand.
    line(g, s.x + 24, s.y - 4, s.x + 24, s.y - 160, "#4A3A28", 3);
    poly(g, [
      [s.x + 24, s.y - 172],
      [s.x + 28, s.y - 160],
      [s.x + 20, s.y - 160],
    ], "#9AA0A0");
    // The helmet: visor down, or raised (and something's in there).
    ellipse(g, s.x, s.y - 122, 15, 17, metal, dark, 1.2);
    if (s.variant === "up") {
      rect(g, s.x - 11, s.y - 128, 22, 10, "#050606");
      ellipse(g, s.x - 4, s.y - 123, 1.5, 1.5, "#CFE8DC");
      ellipse(g, s.x + 4, s.y - 123, 1.5, 1.5, "#CFE8DC");
      poly(g, [
        [s.x - 14, s.y - 132],
        [s.x + 14, s.y - 132],
        [s.x + 12, s.y - 142],
        [s.x - 12, s.y - 142],
      ], metal, dark, 1);
    } else {
      for (let k = 0; k < 3; k++) line(g, s.x - 10, s.y - 128 + k * 4, s.x + 10, s.y - 128 + k * 4, dark, 1.5);
    }
  },
  "sculpture.urn"(g, s) {
    shadow(g, s.x, s.y, 30, 7);
    g.save();
    g.beginPath();
    g.moveTo(s.x - 14, s.y);
    g.quadraticCurveTo(s.x - 36, s.y - 34, s.x - 18, s.y - 64);
    g.lineTo(s.x - 22, s.y - 78);
    g.lineTo(s.x + 22, s.y - 78);
    g.lineTo(s.x + 18, s.y - 64);
    g.quadraticCurveTo(s.x + 36, s.y - 34, s.x + 14, s.y);
    g.closePath();
    g.fillStyle = "#6A4A32";
    g.fill();
    g.lineWidth = 1.5;
    g.strokeStyle = "#2A1A10";
    g.stroke();
    g.restore();
    line(g, s.x - 28, s.y - 38, s.x + 28, s.y - 38, "#C9A55A", 2);
    line(g, s.x - 24, s.y - 46, s.x + 24, s.y - 46, "#C9A55A", 1);
  },
  "sculpture.figure": (g, s) => figure(g, s.x, s.y, 136),
};

export const SCULPTURE: Scene = {
  camera: "sculpture",
  room: background,
  objects: r.objects,
  anomalies: r.anomalies,
  draw,
  // On its pedestal.
  visitor: { x: 320, y: 262, scale: 0.92 },
  light: (g) => corners(g, 0.6),
};
