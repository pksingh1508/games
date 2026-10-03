// BOSS: The Liar. A smooth host fires eight commands, but only the ones with the crown are real.
// No crown: don't tap, whatever he says.
import { pick, shuffle } from "@/engine/rng";
import { at, backdrop, circle, ellipse, face, fitSize, floor, line, poly, rect, text, WHITE } from "../../render/draw";
import type { Boss } from "../types";
import { COMMANDS, commandAt, commandJudge, shownAt } from "./commands";

const TAP_WORDS = ["TAP!", "TAP NOW!", "QUICK, TAP!", "HIT IT!"];
const STOP_WORDS = ["DON'T!", "HANDS OFF!"];

export function crownShape(g: CanvasRenderingContext2D, x: number, y: number, s: number) {
  poly(g, [x - 60 * s, y + 30 * s, x - 70 * s, y - 30 * s, x - 30 * s, y, x, y - 46 * s, x + 30 * s, y, x + 70 * s, y - 30 * s, x + 60 * s, y + 30 * s], "#FFB703", {
    width: 8 * s,
  });
}

export const liar: Boss = {
  id: "liar",
  name: "The Liar",
  instruction: "TRUST ME!",
  hint: "Only commands with a crown are real. No crown: don't tap.",
  invertible: false,
  refrain: false,
  bg: "#0F5257",
  cue: "sleaze",
  caption: "bow-chicka…",
  create(ctx) {
    // Exactly half come with the crown. Some real ones say DON'T; some fake ones say TAP.
    const crowned = shuffle(ctx.rng, [true, true, true, true, false, false, false, false]);
    const tapWords = crowned.map((c) => (c ? ctx.rng() < 0.75 : ctx.rng() < 0.7));
    // Make sure there's something to do, and a trap to resist.
    if (!crowned.some((c, k) => c && tapWords[k])) tapWords[crowned.indexOf(true)] = true;
    if (!crowned.some((c, k) => !c && tapWords[k])) tapWords[crowned.indexOf(false)] = true;
    const words = tapWords.map((t) => (t ? pick(ctx.rng, TAP_WORDS) : pick(ctx.rng, STOP_WORDS)));
    const must = crowned.map((c, k) => c && tapWords[k]!);
    const judge = commandJudge(must, { good: () => ctx.emit("ding"), bad: () => ctx.emit("fail") });

    return {
      cues: Array.from({ length: COMMANDS }, (_, k) => ({ beat: commandAt(k), sound: "tock" as const })),
      update: judge.update,
      tap: judge.tap,
      outcome: (final) => judge.verdict.outcome(final, "win"),
      plan: judge.plan,
      label(b) {
        const k = shownAt(b);
        return k < 0 ? { text: "TRUST ME!" } : { text: words[k]!, crown: crowned[k] };
      },
      draw(g, b, view) {
        backdrop(g, view, "#0F5257");
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2 + b * 0.2;
          g.globalAlpha = 0.12;
          poly(g, [500, 300, 500 + Math.cos(a) * 1400, 300 + Math.sin(a) * 1400, 500 + Math.cos(a + 0.2) * 1400, 300 + Math.sin(a + 0.2) * 1400], WHITE, { stroke: false });
          g.globalAlpha = 1;
        }
        floor(g, view, 880, "#0A3A3D");
        const k = shownAt(b);

        // The host: shiny suit, big grin, cue card held up high.
        at(g, 500, 880, () => {
          rect(g, -110, -360, 220, 330, "#C0C0C0", { radius: 60 });
          poly(g, [-40, -350, 0, -250, 40, -350], "#9B5DE5");
          circle(g, 0, -430, 80, "#FFD8B5");
          ellipse(g, 0, -500, 86, 34, "#1B1B1B", { stroke: false });
          face(g, 0, -424, 1.05, "grin");
          line(g, 100, -300, 190, -420, 22);
          line(g, -100, -300, -170, -200, 22);
        });
        at(g, 700, 380, () => {
          rect(g, -180, -100, 360, 200, WHITE, { radius: 18 });
          if (k >= 0) {
            const word = words[k]!;
            text(g, word, 0, 6, fitSize(g, word, view, 90, 310), view);
          }
        }, { rotate: 0.06 });
        // The crown floats over the card when the command is real; an empty dashed slot when not.
        if (k >= 0) {
          if (crowned[k]) crownShape(g, 700, 230, 1);
          else {
            g.setLineDash([14, 12]);
            rect(g, 640, 200, 120, 60, null, { radius: 12, width: 6, color: "rgba(255,255,255,0.6)" });
            g.setLineDash([]);
          }
        }
        judge.verdict.draw(g, b, view);
      },
    };
  },
};
