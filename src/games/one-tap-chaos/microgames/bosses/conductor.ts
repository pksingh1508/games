// BOSS: The Chaos Conductor. Eight rapid commands (PLAY! / REST!), and halfway through he flips
// the rule: from then on, PLAY means don't and REST means tap.
import { pick, shuffle } from "@/engine/rng";
import { at, backdrop, circle, clamp, ellipse, face, fitSize, floor, line, poly, rect, text, WHITE } from "../../render/draw";
import type { Boss, Cue } from "../types";
import { COMMANDS, commandAt, commandJudge, shownAt } from "./commands";

/** From this command on, it's Opposite Day. */
const FLIP = 4;
const FLIP_AT = commandAt(FLIP) - 0.5;

export const conductor: Boss = {
  id: "conductor",
  name: "The Chaos Conductor",
  instruction: "FOLLOW ME!",
  hint: "PLAY! means tap, REST! means don't. Halfway through he flips it: then do the opposite.",
  invertible: false,
  refrain: false,
  bg: "#3D2C8D",
  cue: "gong",
  caption: "GONG!",
  create(ctx) {
    // At least three of each, in a shuffled order.
    const plays = shuffle(ctx.rng, [true, true, true, false, false, false, ctx.rng() < 0.5, ctx.rng() < 0.5]);
    const words = plays.map((p) => (p ? pick(ctx.rng, ["PLAY!", "TAP!"]) : pick(ctx.rng, ["REST!", "DON'T!"])));
    const must = plays.map((p, k) => p !== k >= FLIP);
    const judge = commandJudge(must, { good: () => ctx.emit("drum"), bad: () => ctx.emit("fail") });
    const cues: Cue[] = [
      ...Array.from({ length: COMMANDS }, (_, k) => ({ beat: commandAt(k), sound: "baton" as const })),
      { beat: FLIP_AT, sound: "card" },
    ];

    return {
      cues,
      update: judge.update,
      tap: judge.tap,
      outcome: (final) => judge.verdict.outcome(final, "win"),
      plan: judge.plan,
      label(b) {
        const k = shownAt(b);
        const rule = b >= FLIP_AT ? "OPPOSITE!" : undefined;
        return { text: k < 0 ? "FOLLOW ME!" : words[k]!, rule };
      },
      draw(g, b, view) {
        backdrop(g, view, "#3D2C8D");
        // Curtains and the stage.
        for (let i = -6; i < 16; i++) rect(g, i * 80, view.top - 10, 80, 330 - view.top, i % 2 ? "#5B3FBF" : "#4C33A8", { stroke: false });
        floor(g, view, 860, "#8A5A2B");
        const k = shownAt(b);
        const flipped = b >= FLIP_AT;

        // The music stand with the command card.
        line(g, 700, 860, 700, 600, 12);
        at(g, 700, 520, () => {
          rect(g, -170, -110, 340, 220, WHITE, { radius: 16 });
          if (k >= 0) {
            const word = words[k]!;
            text(g, word, 0, 6, fitSize(g, word, view, 96, 290), view);
          }
        }, { rotate: -0.05 });

        // The OPPOSITE sign drops in halfway.
        if (flipped) {
          const drop = clamp((b - FLIP_AT) * 4);
          at(g, 500, 120 + drop * 80, () => {
            rect(g, -260, -60, 520, 120, "#FFB703", { radius: 20 });
            text(g, "OPPOSITE!", 0, 4, 76, view);
          }, { rotate: Math.sin(b * 3) * 0.04 });
        }

        // The conductor: wild hair, tails, and a baton on every command.
        const swing = k >= 0 ? Math.max(0, 1 - (b - commandAt(k)) * 3) : 0;
        at(g, 330, 860, () => {
          rect(g, -90, -330, 180, 300, "#1B1B1B", { radius: 50 });
          poly(g, [-30, -320, 0, -260, 30, -320], WHITE);
          circle(g, 0, -390, 70, "#FFD8B5");
          for (let i = 0; i < 7; i++) circle(g, -70 + i * 23, -450 + Math.abs(i - 3) * 12, 30, WHITE);
          face(g, 0, -384, 0.95, flipped ? "grin" : "smug", 1);
          // Baton arm.
          at(g, 80, -250, () => {
            line(g, 0, 0, 110, -60, 18);
            line(g, 110, -60, 230, -150, 7, WHITE);
          }, { rotate: -swing * 0.9 + Math.sin(b * Math.PI) * 0.15 });
          ellipse(g, -100, -200, 30, 22, WHITE);
        });
        judge.verdict.draw(g, b, view);
      },
    };
  },
};
