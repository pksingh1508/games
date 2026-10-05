// CAM 05 · Corridor. A long passage to your office: doors on both sides, a door at the far end under the exit
// sign, lamps, a museum map, a painting, a fire extinguisher, the janitor's cart. The Visitor's last stop.
import { corners, paintBox } from "./box";
import { ellipse, face, figure, glow, line, poly, rect, shadow, words, type G } from "./paint";
import { room, state, type Scene } from "./scene";

// The back wall, far away.
const BX0 = 272;
const BY0 = 104;
const BX1 = 368;
const BY1 = 206;

/** The left wall's top and bottom at screen x (x ≤ BX0), and the right wall's (x ≥ BX1). */
const leftTop = (x: number) => (BY0 * x) / BX0;
const leftBot = (x: number) => 400 + ((BY1 - 400) * x) / BX0;
const rightTop = (x: number) => (BY0 * (640 - x)) / (640 - BX1);
const rightBot = (x: number) => 400 + ((BY1 - 400) * (640 - x)) / (640 - BX1);

/** A point on a side wall: `u` across the screen (x), `v` up the wall (0 floor, 1 ceiling). */
const onLeft = (x: number, v: number): [number, number] => [x, leftBot(x) + (leftTop(x) - leftBot(x)) * v];
const onRight = (x: number, v: number): [number, number] => [x, rightBot(x) + (rightTop(x) - rightBot(x)) * v];

/** A door in a side wall, between screen x a and b; `open` 0 shut … 1 wide open. */
function sideDoor(g: G, side: "left" | "right", a: number, b: number, open: number) {
  const on = side === "left" ? onLeft : onRight;
  const h = 0.6;
  const frameQuad = [on(a - 3, 0), on(b + 3, 0), on(b + 3, h + 0.04), on(a - 3, h + 0.04)];
  poly(g, frameQuad, "#2B1D12");
  const quad = [on(a, 0), on(b, 0), on(b, h), on(a, h)];
  if (open > 0.02) {
    poly(g, quad, "#050505");
    // The leaf swings out into the corridor, hinged at the edge nearer the camera.
    const hinge = side === "left" ? a : b;
    const [hx, hb] = on(hinge, 0);
    const [, ht] = on(hinge, h);
    const swing = (b - a) * (1 - open * 0.75);
    const far = side === "left" ? hx + swing : hx - swing;
    const lift = (b - a) * 0.35 * open;
    poly(g, [
      [hx, hb],
      [far, hb - lift * 0.4 + (side === "left" ? -6 : -6) * open],
      [far, ht - lift * 0.2],
      [hx, ht],
    ], "#4B3020", "#1B120A", 1);
  } else {
    poly(g, quad, "#4B3020", "#1B120A", 1);
    const k = side === "left" ? b - (b - a) * 0.15 : a + (b - a) * 0.15;
    const [kx, ky] = on(k, h * 0.48);
    ellipse(g, kx, ky, 2, 2, "#C9A55A");
  }
}

const r = room("corridor")
  .obj("exit", "the exit sign", "corridor.exit", state(320, 117, "EXIT"), [-22, -9, 22, 9], 1)
  .obj("enddoor", "the door at the end", "corridor.enddoor", state(320, 206, "closed"), [-26, -80, 26, 0], 1)
  .obj("lamps", "the corridor lamps", "corridor.lamps", state(320, 117, "on"), [-100, -16, 100, 14], 2)
  .obj("painting", "the painting on the left wall", "corridor.painting", state(152, 182, "calm"), [-24, -46, 24, 40], 2)
  .obj("map", "the museum map", "corridor.map", state(484, 178, "here"), [-22, -40, 22, 40], 2)
  .obj("doorl1", "the near door on the left", "corridor.doorl1", state(76, 300, "closed"), [-50, -150, 50, 20], 3)
  .obj("doorl2", "the far door on the left", "corridor.doorl2", state(214, 236, "closed"), [-22, -70, 22, 10], 3)
  .obj("doorr1", "the near door on the right", "corridor.doorr1", state(564, 300, "closed"), [-50, -150, 50, 20], 3)
  .obj("doorr2", "the far door on the right", "corridor.doorr2", state(426, 236, "closed"), [-22, -70, 22, 10], 3)
  .obj("extinguisher", "the fire extinguisher", "corridor.extinguisher", state(606, 318), [-16, -56, 16, 4], 4)
  .obj("sign", "the wet floor sign", "corridor.sign", state(276, 342, "base", false), [-20, -48, 20, 4], 5)
  .obj("cart", "the janitor's cart", "corridor.cart", state(492, 360), [-44, -76, 44, 4], 7)
  .obj("figure", "the figure", "corridor.figure", state(266, 246, "base", false), [-18, -100, 18, 4], 2.5)
  .anomaly("exit", "changed", 3, { variant: "STAY" })
  .anomaly("exit", "light", 2, { variant: "off" }, { accept: ["changed"] })
  .anomaly("enddoor", "door", 2, { variant: "open" }, { accept: ["changed"] })
  .anomaly("enddoor", "door", 4, { tint: 1 }, { name: "creak", accept: ["changed"], gradual: 30 })
  .anomaly("lamps", "light", 2, { variant: "left-off" }, { accept: ["changed"] })
  .anomaly("painting", "changed", 3, { variant: "screaming" })
  .anomaly("map", "changed", 5, { variant: "moved" })
  .anomaly("doorl1", "door", 1, { variant: "open" }, { accept: ["changed"] })
  .anomaly("doorl2", "door", 2, { variant: "open" }, { accept: ["changed"] })
  .anomaly("doorr1", "door", 1, { variant: "open" }, { accept: ["changed"] })
  .anomaly("doorr2", "door", 2, { variant: "open" }, { accept: ["changed"] })
  .anomaly("extinguisher", "missing", 2, { visible: false })
  .anomaly("sign", "extra", 3, { visible: true })
  .anomaly("cart", "moved", 2, { x: 168, y: 362 })
  .anomaly("figure", "intruder", 1, { visible: true }, { accept: ["extra"] })
  .anomaly("@view", "mirror", 3, {});

function background(g: G) {
  paintBox(g, {
    back: [BX0, BY0, BX1, BY1],
    ceiling: "#161B19",
    wall: "#30403A",
    side: "#2C3A35",
    floor: "#3E3A32",
    pattern: "planks",
  });
  // The carpet runner down the middle.
  poly(g, [
    [300, BY1],
    [340, BY1],
    [470, 400],
    [170, 400],
  ], "#24402E");
  for (let k = 0; k < 6; k++) {
    const t = (k + 0.5) / 6;
    const y = BY1 + (400 - BY1) * t * t;
    const w = 20 + 130 * t * t;
    ellipse(g, 320, y, w * 0.25, 3 + 8 * t * t, "rgba(201,165,90,0.25)");
  }
  // Ceiling lights, dark, receding.
  for (const t of [0.25, 0.5, 0.75]) {
    const y = BY0 * (1 - t);
    const x0 = BX0 * (1 - t);
    rect(g, 320 - (320 - x0) * 0.25, y - 2, (320 - x0) * 0.5, 4, "rgba(255,255,255,0.08)");
  }
}

const draw: Scene["draw"] = {
  "corridor.exit"(g, s) {
    const on = s.variant !== "off";
    if (on) glow(g, s.x, s.y, 34, "rgba(80,255,140,0.3)");
    rect(g, s.x - 20, s.y - 8, 40, 16, on ? "#0E6B34" : "#18291F", "#0A1A10", 1.2);
    words(g, s.variant === "STAY" ? "STAY" : "EXIT", s.x, s.y + 1, 9, on ? "#C8FFD8" : "#3E5A46", { font: "mono", spacing: 1.5 });
  },
  "corridor.enddoor"(g, s) {
    const open = s.variant === "open" ? 1 : s.tint;
    const w = 44;
    const h = 76;
    rect(g, s.x - w / 2 - 4, s.y - h - 4, w + 8, h + 4, "#2B1D12");
    if (open > 0.02) {
      rect(g, s.x - w / 2, s.y - h, w, h, "#030303");
      const leaf = w * (1 - open * 0.8);
      poly(g, [
        [s.x - w / 2, s.y - h],
        [s.x - w / 2 + leaf, s.y - h + 3 * open],
        [s.x - w / 2 + leaf, s.y - 2 * open],
        [s.x - w / 2, s.y],
      ], "#4B3020", "#1B120A", 1);
    } else {
      rect(g, s.x - w / 2, s.y - h, w, h, "#4B3020", "#1B120A", 1);
      ellipse(g, s.x + w / 2 - 6, s.y - h * 0.48, 1.8, 1.8, "#C9A55A");
    }
  },
  "corridor.lamps"(g, s) {
    for (const [side, x] of [
      ["left", s.x - 90],
      ["right", s.x + 90],
    ] as const) {
      const on = !(side === "left" && s.variant === "left-off");
      const [px, py] = side === "left" ? onLeft(x, 0.8) : onRight(x, 0.8);
      if (on) glow(g, px, py, 60, "rgba(255,214,140,0.38)");
      rect(g, px - 3, py - 2, 6, 10, "#4A3A22");
      ellipse(g, px, py - 4, 6, 4, on ? "#F4D58C" : "#5B5142", "#2A2014", 1);
    }
  },
  "corridor.painting"(g, s) {
    // A small framed painting on the left wall, in perspective.
    const a = s.x - 20;
    const b = s.x + 20;
    poly(g, [onLeft(a, 0.66), onLeft(b, 0.66), onLeft(b, 0.86), onLeft(a, 0.86)], "#9A7B3C", "#1A140C", 1);
    const [cx, cy] = onLeft(s.x, 0.76);
    poly(g, [onLeft(a + 4, 0.69), onLeft(b - 4, 0.69), onLeft(b - 4, 0.83), onLeft(a + 4, 0.83)], "#2A3530");
    face(g, cx, cy, 8, { skin: "#C9BFB0", hair: "#1A1A1A", eyes: s.variant === "screaming" ? "closed" : "front", mouth: s.variant === "screaming" ? "open" : "flat" });
  },
  "corridor.map"(g, s) {
    const a = s.x - 18;
    const b = s.x + 18;
    poly(g, [onRight(a, 0.6), onRight(b, 0.6), onRight(b, 0.86), onRight(a, 0.86)], "#D8D0BC", "#2A2014", 1);
    const [cx, cy] = onRight(s.x, 0.73);
    for (let k = 0; k < 4; k++) rect(g, cx - 12 + (k % 2) * 13, cy - 12 + Math.floor(k / 2) * 13, 10, 10, "rgba(60,90,80,0.55)");
    // You are here.
    const [hx, hy] = s.variant === "moved" ? [cx + 8, cy - 8] : [cx - 6, cy + 8];
    ellipse(g, hx, hy, 2.6, 2.6, "#C42A2A");
  },
  "corridor.doorl1": (g, s) => sideDoor(g, "left", s.x - 42, s.x + 30, s.variant === "open" ? 1 : 0),
  "corridor.doorl2": (g, s) => sideDoor(g, "left", s.x - 18, s.x + 14, s.variant === "open" ? 1 : 0),
  "corridor.doorr1": (g, s) => sideDoor(g, "right", s.x - 30, s.x + 42, s.variant === "open" ? 1 : 0),
  "corridor.doorr2": (g, s) => sideDoor(g, "right", s.x - 14, s.x + 18, s.variant === "open" ? 1 : 0),
  "corridor.extinguisher"(g, s) {
    rect(g, s.x - 8, s.y - 50, 16, 46, "#B8282A", "#3A0A0A", 1.2);
    rect(g, s.x - 4, s.y - 56, 8, 7, "#2A2A2A");
    line(g, s.x + 4, s.y - 52, s.x + 12, s.y - 40, "#1A1A1A", 2);
    rect(g, s.x - 6, s.y - 36, 12, 10, "#E8E0D0");
  },
  "corridor.sign"(g, s) {
    shadow(g, s.x, s.y, 18, 5);
    poly(g, [
      [s.x - 14, s.y],
      [s.x - 6, s.y - 46],
      [s.x + 6, s.y - 46],
      [s.x + 14, s.y],
    ], "#E8C830", "#3A3008", 1.2);
    poly(g, [
      [s.x, s.y - 34],
      [s.x - 6, s.y - 22],
      [s.x + 6, s.y - 22],
    ], "#1A1A1A");
  },
  "corridor.cart"(g, s) {
    shadow(g, s.x, s.y, 44, 8);
    rect(g, s.x - 38, s.y - 46, 76, 34, "#3A5A7A", "#14222E", 1.5);
    rect(g, s.x - 38, s.y - 50, 76, 5, "#5A7A9A");
    line(g, s.x + 38, s.y - 46, s.x + 46, s.y - 72, "#8A8A8A", 3);
    rect(g, s.x - 30, s.y - 66, 18, 20, "#D8D2C0", "#6A665A", 1);
    line(g, s.x - 4, s.y - 46, s.x + 6, s.y - 92, "#8A6A44", 3);
    for (const dx of [-30, 30]) ellipse(g, s.x + dx, s.y - 6, 6, 6, "#1A1A1A");
  },
  "corridor.figure": (g, s) => figure(g, s.x, s.y, 96),
};

export const CORRIDOR: Scene = {
  camera: "corridor",
  room: background,
  objects: r.objects,
  anomalies: r.anomalies,
  draw,
  visitor: { x: 320, y: 352, scale: 0.98 },
  light: (g) => corners(g, 0.65),
};
