// SHOOT! A target slides across. Tap when it's in the crosshair.
// (Opposite Day: hold your fire.)
import { backdrop, circle, floor, lerp, line, rect } from "../render/draw";
import { defineMicrogame, pickTime, Verdict } from "./kit";

const CROSS_X = 500;
const RAIL_Y = 520;

export const shoot = defineMicrogame({
  id: "shoot",
  instruction: "SHOOT!",
  hint: "Tap when the target is in the crosshair.",
  invertible: true,
  refrain: false,
  invertedRefrain: true,
  bg: "#F7D9A8",
  cue: "pew",
  caption: "pew!",
  create(ctx) {
    const speed = lerp(380, 520, ctx.difficulty);
    const cross = pickTime(ctx.rng, 2.4, 4.8, ctx, ctx.window + 0.2);
    const fromLeft = ctx.rng() < 0.5;
    const xAt = (t: number) => CROSS_X + (fromLeft ? 1 : -1) * (t - cross) * speed;
    const tol = speed * ctx.window;

    let shotAt: number | null = null;
    let shotX = 0;
    const verdict = new Verdict();

    return {
      update() {},
      tap(b) {
        if (shotAt !== null) return;
        shotAt = b;
        shotX = xAt(b);
        ctx.emit("pew");
        const hit = Math.abs(shotX - CROSS_X) <= tol;
        if (ctx.inverted) verdict.lose(b);
        else if (hit) verdict.win(b);
        else verdict.lose(b);
      },
      outcome: (final) => verdict.outcome(final, ctx.inverted ? "win" : "lose"),
      plan: () => (ctx.inverted ? [] : [cross]),
      draw(g, b, view) {
        backdrop(g, view, "#F7D9A8");
        // The stall: planks, a rail and a canopy.
        for (let i = -4; i < 14; i++) line(g, i * 110, view.top - 10, i * 110, view.bottom + 10, 4, "rgba(27,27,27,0.12)");
        floor(g, view, 760, "#B5763A");
        rect(g, view.left - 20, RAIL_Y + 110, view.right - view.left + 40, 24, "#8A5A2B");
        for (let i = -3; i < 12; i++) {
          const x = i * 120 - ((b * 30) % 120);
          rect(g, x, 120, 60, 70, i % 2 ? "#2B59C3" : "#FFFFFF", { width: 6 });
        }

        // The target on its stick.
        const hit = verdict.value === "win";
        const x = shotAt !== null && b >= shotAt ? shotX : xAt(b);
        rect(g, x - 10, RAIL_Y, 20, 120, "#8A5A2B");
        const r = Math.max(70, tol + 10);
        circle(g, x, RAIL_Y, r, "#FFFFFF");
        circle(g, x, RAIL_Y, r * 0.66, "#2B59C3");
        circle(g, x, RAIL_Y, r * 0.33, "#FFFFFF");
        if (shotAt !== null && b >= shotAt) {
          circle(g, CROSS_X, RAIL_Y, 14, "#1B1B1B", { stroke: false });
          if (hit) {
            for (let i = 0; i < 8; i++) {
              const a = (i / 8) * Math.PI * 2;
              line(g, x + Math.cos(a) * (r + 20), RAIL_Y + Math.sin(a) * (r + 20), x + Math.cos(a) * (r + 50), RAIL_Y + Math.sin(a) * (r + 50), 8);
            }
          }
        }

        // The crosshair never moves.
        g.globalAlpha = 0.9;
        circle(g, CROSS_X, RAIL_Y, 120, null, { width: 10 });
        line(g, CROSS_X - 170, RAIL_Y, CROSS_X - 60, RAIL_Y, 10);
        line(g, CROSS_X + 60, RAIL_Y, CROSS_X + 170, RAIL_Y, 10);
        line(g, CROSS_X, RAIL_Y - 170, CROSS_X, RAIL_Y - 60, 10);
        line(g, CROSS_X, RAIL_Y + 60, CROSS_X, RAIL_Y + 170, 10);
        g.globalAlpha = 1;
        verdict.draw(g, b, view);
      },
    };
  },
});
