// What's on the canvas between microgames: the show's yellow, with rays turning to the beat.
import type { View } from "../microgames/types";
import { backdrop } from "./draw";

export const SHOW_YELLOW = "#FFD23F";
const RAY = "#FFE27A";

export function drawLobby(g: CanvasRenderingContext2D, view: View, beat: number, colour = SHOW_YELLOW) {
  backdrop(g, view, colour);
  const turn = view.reducedMotion ? 0 : beat * 0.08;
  const reach = Math.max(view.right - view.left, view.bottom - view.top) * 1.2;
  g.fillStyle = RAY;
  g.globalAlpha = 0.75;
  for (let i = 0; i < 16; i += 2) {
    const a1 = turn + (i / 16) * Math.PI * 2;
    const a2 = a1 + Math.PI / 16;
    g.beginPath();
    g.moveTo(500, 500);
    g.lineTo(500 + Math.cos(a1) * reach, 500 + Math.sin(a1) * reach);
    g.lineTo(500 + Math.cos(a2) * reach, 500 + Math.sin(a2) * reach);
    g.closePath();
    g.fill();
  }
  g.globalAlpha = 1;
}
