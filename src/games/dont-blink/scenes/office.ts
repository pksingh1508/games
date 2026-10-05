// Your own office (6 / O): not a camera, your own eyes. The desk and its lamp, your mug, the phone, a photo; the
// poster, the calendar, your coat on its hook, the window and its blinds, the door. From Night 4 it changes too.
import { corners } from "./box";
import { ellipse, face, glow, line, poly, rect, shadow, words, type G } from "./paint";
import { room, state, type Scene } from "./scene";

const r = room("office")
  .obj("window", "the window", "office.window", state(150, 122, "open"), [-66, -62, 66, 62], 1)
  .obj("poster", "the poster", "office.poster", state(330, 118, "cat"), [-54, -64, 54, 64], 1)
  .obj("calendar", "the calendar", "office.calendar", state(498, 104, "base"), [-36, -40, 36, 40], 1)
  .obj("coat", "your coat", "office.coat", state(42, 150), [-36, -46, 36, 92], 1)
  .obj("door", "the office door", "office.door", state(602, 286, "closed"), [-40, -196, 40, 0], 1)
  .obj("lamp", "the desk lamp", "office.lamp", state(104, 330, "on"), [-32, -88, 60, 10], 5)
  .obj("photo", "the photo", "office.photo", state(236, 344, "one"), [-32, -54, 32, 6], 5)
  .obj("mug", "your mug", "office.mug", state(440, 356), [-26, -44, 34, 8], 5)
  .obj("phone", "the phone", "office.phone", state(560, 360, "on"), [-46, -42, 40, 6], 5)
  .anomaly("window", "changed", 3, { variant: "closed" })
  .anomaly("window", "intruder", 2, { variant: "face" }, { accept: ["extra"] })
  .anomaly("poster", "changed", 3, { variant: "gone" })
  .anomaly("calendar", "changed", 4, { variant: "crossed" })
  .anomaly("coat", "missing", 2, { visible: false })
  .anomaly("door", "door", 2, { variant: "ajar" }, { accept: ["changed"] })
  .anomaly("lamp", "light", 2, { variant: "off" }, { accept: ["changed"] })
  .anomaly("photo", "changed", 4, { variant: "two" })
  .anomaly("mug", "moved", 3, { x: 330 })
  .anomaly("mug", "moved", 4, { x: 372 }, { name: "slide", gradual: 30 })
  .anomaly("phone", "changed", 3, { variant: "off" });

function background(g: G) {
  rect(g, 0, 0, 640, 400, "#3A3630");
  // A picture rail, and the skirting behind the desk.
  line(g, 0, 36, 640, 36, "rgba(0,0,0,0.3)", 3);
  // The desk, in front of you.
  poly(g, [
    [0, 290],
    [640, 290],
    [640, 400],
    [0, 400],
  ], "#4A3220");
  rect(g, 0, 286, 640, 8, "#5E412A");
  line(g, 0, 294, 640, 294, "#1E140B", 2);
  for (let k = 0; k < 7; k++) line(g, 0, 310 + k * 14, 640, 312 + k * 14, "rgba(0,0,0,0.08)", 2);
  // The CCTV monitor's corner, bottom left, still on.
  rect(g, -10, 352, 96, 60, "#141816", "#050606", 2);
  rect(g, -4, 358, 84, 48, "#1E3A2E");
  for (let k = 0; k < 8; k++) line(g, -4, 362 + k * 6, 80, 362 + k * 6, "rgba(124,255,178,0.12)", 1);
}

/** Draw at k times the size around (x, y): the things on your desk are right in front of you. */
function near(g: G, x: number, y: number, k: number, paint: () => void) {
  g.save();
  g.translate(x, y);
  g.scale(k, k);
  g.translate(-x, -y);
  paint();
  g.restore();
}

const draw: Scene["draw"] = {
  "office.window"(g, s) {
    const x = s.x - 62;
    const y = s.y - 58;
    rect(g, x - 6, y - 6, 136, 128, "#2A2620");
    rect(g, x, y, 124, 116, "#0B1220");
    glow(g, x + 90, y + 26, 40, "rgba(200,220,255,0.25)");
    ellipse(g, x + 90, y + 26, 9, 9, "#DCE4E8");
    // Trees outside.
    poly(g, [
      [x, y + 116],
      [x, y + 70],
      [x + 30, y + 60],
      [x + 60, y + 80],
      [x + 90, y + 66],
      [x + 124, y + 84],
      [x + 124, y + 116],
    ], "#0E1A14");
    if (s.variant === "face") {
      // A pale face, pressed to the glass.
      face(g, x + 56, y + 62, 17, { skin: "#C8D2C8", eyes: "front", mouth: "flat", ink: "#1A1E1A" });
      ellipse(g, x + 40, y + 78, 6, 4, "#C8D2C8");
      ellipse(g, x + 72, y + 78, 6, 4, "#C8D2C8");
    }
    line(g, x + 62, y, x + 62, y + 116, "#2A2620", 4);
    line(g, x, y + 58, x + 124, y + 58, "#2A2620", 4);
    // The blinds: pulled up, or let down.
    if (s.variant === "closed") {
      for (let k = 0; k < 15; k++) rect(g, x - 2, y + k * 8, 128, 7, "#B8AC90", "#6E6450", 0.6);
    } else {
      for (let k = 0; k < 3; k++) rect(g, x - 2, y + k * 5, 128, 4, "#B8AC90", "#6E6450", 0.6);
    }
    line(g, x + 110, y, x + 110, y + 60, "#6E6450", 1);
  },
  "office.poster"(g, s) {
    rect(g, s.x - 52, s.y - 62, 104, 124, "#D8CCAA", "#2A2418", 1.5);
    rect(g, s.x - 46, s.y - 56, 92, 88, "#6A8AA8");
    // The branch, and (usually) a cat hanging from it by its front paws.
    line(g, s.x - 46, s.y - 44, s.x + 46, s.y - 38, "#4A3220", 5);
    if (s.variant !== "gone") {
      const fur = "#E8A040";
      const ink = "#3A2410";
      line(g, s.x - 8, s.y - 26, s.x - 12, s.y - 42, fur, 5);
      line(g, s.x + 8, s.y - 26, s.x + 12, s.y - 41, fur, 5);
      line(g, s.x - 6, s.y + 18, s.x - 8, s.y + 28, fur, 4);
      line(g, s.x + 6, s.y + 18, s.x + 8, s.y + 28, fur, 4);
      line(g, s.x + 9, s.y + 12, s.x + 19, s.y + 22, fur, 3);
      ellipse(g, s.x, s.y + 2, 12, 17, fur, ink, 1);
      poly(g, [
        [s.x - 11, s.y - 25],
        [s.x - 9, s.y - 36],
        [s.x - 2, s.y - 30],
      ], fur, ink, 1);
      poly(g, [
        [s.x + 11, s.y - 25],
        [s.x + 9, s.y - 36],
        [s.x + 2, s.y - 30],
      ], fur, ink, 1);
      ellipse(g, s.x, s.y - 22, 12, 10, fur, ink, 1);
      ellipse(g, s.x - 4, s.y - 23, 1.8, 2.4, "#1A1008");
      ellipse(g, s.x + 4, s.y - 23, 1.8, 2.4, "#1A1008");
      ellipse(g, s.x, s.y - 18.5, 1.6, 1.1, "#B8504A");
    } else {
      // Just claw marks, all the way down.
      for (const dx of [-6, -2, 2]) line(g, s.x + dx, s.y - 36, s.x + dx + 3, s.y + 24, "rgba(40,20,10,0.6)", 1.2);
    }
    words(g, "HANG IN THERE", s.x, s.y + 46, 9, "#2A2418", { spacing: 0.6 });
  },
  "office.calendar"(g, s) {
    rect(g, s.x - 34, s.y - 38, 68, 76, "#E8E2D2", "#2A2418", 1.2);
    rect(g, s.x - 34, s.y - 38, 68, 16, "#B8302A");
    words(g, "OCTOBER", s.x, s.y - 30, 8, "#F4EEE0", { spacing: 1 });
    for (let k = 0; k < 28; k++) {
      const cx = s.x - 27 + (k % 7) * 9;
      const cy = s.y - 14 + Math.floor(k / 7) * 12;
      rect(g, cx - 3, cy - 4, 7, 8, "rgba(0,0,0,0.08)");
      const crossed = s.variant === "crossed" || k < 4;
      if (crossed) {
        line(g, cx - 3, cy - 4, cx + 4, cy + 4, "#B8302A", 1);
        line(g, cx + 4, cy - 4, cx - 3, cy + 4, "#B8302A", 1);
      }
    }
  },
  "office.coat"(g, s) {
    ellipse(g, s.x, s.y - 41, 3.5, 3.5, "#8A8A8A");
    line(g, s.x, s.y - 40, s.x, s.y - 30, "#8A8A8A", 3);
    const navy = "#1F2B4A";
    const edge = "#0D1426";
    poly(g, [
      [s.x - 6, s.y - 30],
      [s.x + 6, s.y - 30],
      [s.x + 24, s.y - 20],
      [s.x + 26, s.y + 88],
      [s.x - 26, s.y + 88],
      [s.x - 24, s.y - 20],
    ], navy, edge, 1.2);
    for (const side of [-1, 1]) {
      poly(g, [
        [s.x + side * 24, s.y - 20],
        [s.x + side * 32, s.y - 14],
        [s.x + side * 33, s.y + 50],
        [s.x + side * 24, s.y + 52],
      ], "#1A2440", edge, 1);
    }
    poly(g, [
      [s.x - 7, s.y - 30],
      [s.x, s.y + 12],
      [s.x + 7, s.y - 30],
    ], "#2E3C60", edge, 1);
    for (let k = 0; k < 4; k++) ellipse(g, s.x + 3, s.y + 22 + k * 16, 2, 2, "#C9A227");
    rect(g, s.x - 18, s.y - 6, 9, 11, "#C9A227", "#6A5410", 0.8);
  },
  "office.door"(g, s) {
    const w = 76;
    const h = 192;
    const left = s.x - w / 2;
    rect(g, left - 6, s.y - h - 6, w + 12, h + 6, "#2B241C");
    if (s.variant === "ajar") {
      rect(g, left, s.y - h, w, h, "#050505");
      poly(g, [
        [left, s.y - h],
        [left + w * 0.72, s.y - h + 4],
        [left + w * 0.72, s.y - 3],
        [left, s.y],
      ], "#5A4632", "#2A2014", 1);
    } else {
      rect(g, left, s.y - h, w, h, "#5A4632", "#2A2014", 1);
      ellipse(g, left + 10, s.y - h * 0.48, 3, 3, "#C9A55A");
      rect(g, left + 14, s.y - h + 18, w - 28, 60, "rgba(0,0,0,0.12)");
    }
  },
  "office.lamp"(g, s) {
    const on = s.variant === "on";
    if (on) glow(g, s.x + 44, s.y - 30, 240, "rgba(255,210,140,0.32)");
    near(g, s.x, s.y, 1.5, () => lamp(g, s.x, s.y, on));
  },
  "office.photo"(g, s) {
    near(g, s.x, s.y, 1.5, () => photo(g, s.x, s.y, s.variant === "two"));
  },
  "office.mug"(g, s) {
    near(g, s.x, s.y, 1.5, () => mug(g, s.x, s.y));
  },
  "office.phone"(g, s) {
    near(g, s.x, s.y, 1.3, () => phone(g, s.x, s.y, s.variant === "off"));
  },
};

function lamp(g: G, x: number, y: number, on: boolean) {
  ellipse(g, x, y, 20, 5, "#2A2A26");
  line(g, x, y, x + 10, y - 34, "#3A3A36", 3);
  line(g, x + 10, y - 34, x + 26, y - 44, "#3A3A36", 3);
  poly(g, [
    [x + 14, y - 56],
    [x + 38, y - 46],
    [x + 30, y - 30],
    [x + 8, y - 40],
  ], on ? "#2E5A3E" : "#203828", "#0E1A12", 1);
  if (on) glow(g, x + 24, y - 32, 16, "rgba(255,240,200,0.8)");
}

function photo(g: G, x: number, y: number, two: boolean) {
  shadow(g, x, y + 2, 18, 4);
  rect(g, x - 20, y - 34, 40, 34, "#8A6A3A", "#2A1E12", 1.2);
  rect(g, x - 16, y - 30, 32, 26, "#7A90A0");
  face(g, x - (two ? 6 : 0), y - 18, 6, { skin: "#D6B596", hair: "#3A2A1C", eyes: "front", mouth: "smile" });
  // Someone else in your photo, pale as stone.
  if (two) face(g, x + 8, y - 20, 6, { skin: "#D2DCD3", eyes: "closed", mouth: "flat", ink: "#5A6A60" });
}

function mug(g: G, x: number, y: number) {
  shadow(g, x, y, 16, 4);
  rect(g, x - 12, y - 26, 24, 26, "#E8E2D2", "#3A3630", 1.2);
  g.save();
  g.beginPath();
  g.arc(x + 14, y - 13, 7, -Math.PI / 2, Math.PI / 2);
  g.lineWidth = 3;
  g.strokeStyle = "#E8E2D2";
  g.stroke();
  g.restore();
  words(g, "#1", x, y - 16, 7, "#B8302A");
  words(g, "GUARD", x, y - 8, 4, "#B8302A");
  ellipse(g, x, y - 26, 11, 2.5, "#3A2A1A");
}

function phone(g: G, x: number, y: number, off: boolean) {
  shadow(g, x, y, 32, 6);
  poly(g, [
    [x - 28, y],
    [x + 28, y],
    [x + 22, y - 18],
    [x - 22, y - 18],
  ], "#2A2A28", "#0A0A0A", 1.2);
  ellipse(g, x, y - 10, 8, 5, "#4A4A46");
  if (off) {
    // The receiver's been lifted and left on the desk.
    g.save();
    g.translate(x - 44, y - 6);
    g.rotate(-0.4);
    rect(g, -18, -5, 36, 10, "#2A2A28", "#0A0A0A", 1);
    g.restore();
    line(g, x - 22, y - 8, x - 34, y - 4, "#1A1A1A", 1.5);
  } else {
    rect(g, x - 26, y - 28, 52, 10, "#2A2A28", "#0A0A0A", 1);
    ellipse(g, x - 22, y - 26, 6, 5, "#2A2A28");
    ellipse(g, x + 22, y - 26, 6, 5, "#2A2A28");
  }
}

export const OFFICE: Scene = {
  camera: "office",
  room: background,
  objects: r.objects,
  anomalies: r.anomalies,
  draw,
  // Where it stands when it's reached you.
  visitor: { x: 330, y: 470, scale: 2.1 },
  light: (g) => corners(g, 0.55),
};
