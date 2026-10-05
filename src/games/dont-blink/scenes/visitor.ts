// The Visitor (Plan/14-dont-blink.md §3): a pale statue of a robed figure, hands over its face. It only
// moves while you blink, and while you're not watching it. The closer it gets, the less it hides its face.
import { ellipse, line, poly, shadow, type G } from "./paint";

export type VisitorPose = "cover" | "peek" | "reach";

const STONE = "#D2DCD3";
const SHADE = "#A6B4AA";
const DARK = "#7D8A80";

/** (x, y): the bottom centre of its feet. Height 150 × scale. */
export function drawVisitor(g: G, x: number, y: number, scale: number, pose: VisitorPose, hat = false) {
  const s = scale;
  const h = 150 * s;
  shadow(g, x, y, 34 * s, 9 * s, 0.55);
  // The robe.
  poly(g, [
    [x - 30 * s, y],
    [x + 30 * s, y],
    [x + 22 * s, y - h * 0.45],
    [x + 18 * s, y - h * 0.7],
    [x - 18 * s, y - h * 0.7],
    [x - 22 * s, y - h * 0.45],
  ], STONE, DARK, 1.2);
  for (const k of [-14, -4, 6, 16]) line(g, x + k * s, y - 4 * s, x + k * 0.55 * s, y - h * 0.62, SHADE, 1.4 * s);
  // Shoulders and head.
  ellipse(g, x, y - h * 0.72, 22 * s, 10 * s, STONE);
  ellipse(g, x, y - h * 0.84, 13 * s, 16 * s, STONE, DARK, 1);
  // The hood.
  g.save();
  g.beginPath();
  g.ellipse(x, y - h * 0.86, 16 * s, 19 * s, 0, Math.PI * 1.05, Math.PI * 1.95);
  g.lineWidth = 5 * s;
  g.strokeStyle = SHADE;
  g.stroke();
  g.restore();
  if (pose === "cover") {
    // Both hands over its face.
    ellipse(g, x - 5 * s, y - h * 0.84, 7 * s, 10 * s, "#E3EBE4", DARK, 1);
    ellipse(g, x + 5 * s, y - h * 0.84, 7 * s, 10 * s, "#E3EBE4", DARK, 1);
    line(g, x - 9 * s, y - h * 0.72, x - 6 * s, y - h * 0.8, SHADE, 4 * s);
    line(g, x + 9 * s, y - h * 0.72, x + 6 * s, y - h * 0.8, SHADE, 4 * s);
  } else if (pose === "peek") {
    // One hand down: one blank stone eye looks out.
    ellipse(g, x + 5 * s, y - h * 0.84, 7 * s, 10 * s, "#E3EBE4", DARK, 1);
    ellipse(g, x - 5 * s, y - h * 0.86, 2.6 * s, 2 * s, "#2C3530");
    line(g, x + 9 * s, y - h * 0.72, x + 6 * s, y - h * 0.8, SHADE, 4 * s);
    line(g, x - 16 * s, y - h * 0.68, x - 24 * s, y - h * 0.45, SHADE, 5 * s);
  } else {
    // Reaching out, both eyes open.
    ellipse(g, x - 5 * s, y - h * 0.86, 2.6 * s, 2 * s, "#2C3530");
    ellipse(g, x + 5 * s, y - h * 0.86, 2.6 * s, 2 * s, "#2C3530");
    line(g, x - 4 * s, y - h * 0.78, x + 4 * s, y - h * 0.78, DARK, 1.2 * s);
    line(g, x - 16 * s, y - h * 0.68, x - 44 * s, y - h * 0.62, STONE, 6 * s);
    line(g, x + 16 * s, y - h * 0.68, x + 44 * s, y - h * 0.66, STONE, 6 * s);
    ellipse(g, x - 46 * s, y - h * 0.62, 5 * s, 4 * s, "#E3EBE4");
    ellipse(g, x + 46 * s, y - h * 0.66, 5 * s, 4 * s, "#E3EBE4");
  }
  if (hat) {
    // The night guard's cap (the post-credits photo).
    poly(g, [
      [x - 15 * s, y - h * 0.93],
      [x + 15 * s, y - h * 0.93],
      [x + 13 * s, y - h * 1.02],
      [x - 13 * s, y - h * 1.02],
    ], "#1F2B4A", "#0D1426", 1);
    poly(g, [
      [x - 16 * s, y - h * 0.93],
      [x + 22 * s, y - h * 0.93],
      [x + 18 * s, y - h * 0.9],
      [x - 16 * s, y - h * 0.9],
    ], "#0D1426");
    ellipse(g, x, y - h * 0.975, 3 * s, 3 * s, "#C9A227");
  }
}
