// HIGH FIVE! Two hands swing toward each other. Tap when they meet.
// (Opposite Day: leave him hanging.)
import { randRange } from "@/engine/rng";
import { at, backdrop, circle, rect, star } from "../render/draw";
import { defineMicrogame, pickTime, Verdict } from "./kit";

/** The gap between the palms at rest. */
const REST = 640;
const SWING = 1.2;

/** A gloved hand, palm facing right, with its sleeve running off to the left. */
function hand(g: CanvasRenderingContext2D) {
  rect(g, -600, -40, 560, 80, "#2B59C3", { radius: 30 });
  rect(g, -60, -70, 120, 150, "#FFFFFF", { radius: 50 });
  for (let i = 0; i < 4; i++) rect(g, -54 + i * 30, -150, 26, 100, "#FFFFFF", { radius: 13 });
  rect(g, 30, -20, 60, 32, "#FFFFFF", { radius: 16 });
}

export const highFive = defineMicrogame({
  id: "high-five",
  instruction: "HIGH FIVE!",
  hint: "Tap the moment the hands meet. Near misses don't count.",
  invertible: true,
  refrain: false,
  invertedRefrain: true,
  bg: "#FFDFBA",
  cue: "clap",
  caption: "clap!",
  create(ctx) {
    const half = Math.max(ctx.window * 1.2, 0.18);
    const meet = pickTime(ctx.rng, 3.2, 6.6, ctx, half + 0.1);
    // Near misses: they swing in and stop short.
    const swings: Array<{ at: number; gap: number }> = [{ at: meet, gap: 0 }];
    if (meet - 1.4 >= 1.3) swings.push({ at: randRange(ctx.rng, 1.3, meet - 1.4), gap: randRange(ctx.rng, 140, 210) });
    if (ctx.difficulty >= 0.4 && meet + 1.4 <= 7.4) swings.push({ at: randRange(ctx.rng, meet + 1.4, 7.4), gap: randRange(ctx.rng, 120, 180) });

    const gapAt = (t: number) => {
      let gap = REST;
      for (const s of swings) {
        const u = (t - s.at) / SWING;
        if (Math.abs(u) <= 0.5) gap = Math.min(gap, s.gap + (REST - s.gap) * (1 - Math.cos(u * Math.PI) ** 2));
      }
      return gap;
    };

    let clappedAt: number | null = null;
    const verdict = new Verdict();

    return {
      update() {},
      tap(b) {
        if (clappedAt !== null) return;
        clappedAt = b;
        const good = Math.abs(b - meet) <= half;
        if (ctx.inverted) {
          ctx.emit("whoosh");
          verdict.lose(b);
        } else if (good) {
          ctx.emit("clap");
          verdict.win(b);
        } else {
          ctx.emit("whoosh");
          verdict.lose(b);
        }
      },
      outcome: (final) => verdict.outcome(final, ctx.inverted ? "win" : "lose"),
      plan: () => (ctx.inverted ? [] : [meet]),
      draw(g, b, view) {
        backdrop(g, view, "#FFDFBA");
        const gap = gapAt(clappedAt !== null && b >= clappedAt && verdict.value === "win" ? clappedAt : b);
        at(g, 500 - gap / 2 - 60, 540, () => hand(g), { rotate: 0.08 });
        at(g, 500 + gap / 2 + 60, 540, () => hand(g), { scale: -1, scaleY: 1, rotate: -0.08 });
        if (verdict.value === "win" && b >= verdict.at) {
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 + 0.3;
            const d = 150 + (b - verdict.at) * 200;
            star(g, 500 + Math.cos(a) * d, 470 + Math.sin(a) * d, 30, 13, 5, "#FFB703", { width: 6 });
          }
          circle(g, 500, 470, 40, null, { width: 8 });
        }
        verdict.draw(g, b, view);
      },
    };
  },
});
