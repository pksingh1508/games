// SLEEP! A baby is sleeping. An alarm clock starts ringing. Don't tap, even when it rings.
// (Opposite Day: tap to switch the alarm off.)
import { at, backdrop, circle, clamp, ellipse, face, floor, line, rect, text, WHITE } from "../render/draw";
import type { Cue } from "./types";
import { defineMicrogame, pickTime, Verdict } from "./kit";

export const sleep = defineMicrogame({
  id: "sleep",
  instruction: "SLEEP!",
  hint: "Don't tap. Not even when the alarm rings.",
  invertible: true,
  refrain: true,
  bg: "#2E3A59",
  cue: "lullaby",
  caption: "lullaby…",
  create(ctx) {
    const ringsAt = pickTime(ctx.rng, 2.6, 4.4, ctx, 0.2);
    const cues: Cue[] = [];
    for (let t = ringsAt; t < 7.2; t += 1) cues.push({ beat: t, sound: "ring" });

    let tappedAt: number | null = null;
    const verdict = new Verdict();

    return {
      cues,
      update() {},
      tap(b) {
        if (tappedAt !== null) return;
        tappedAt = b;
        if (ctx.inverted) {
          // Alarm off: drop the rings still to come.
          for (let i = cues.length - 1; i >= 0; i--) if (cues[i]!.beat > b) cues.splice(i, 1);
          ctx.emit("clunk");
          verdict.win(b);
        } else {
          ctx.emit("cry");
          verdict.lose(b);
        }
      },
      outcome: (final) => verdict.outcome(final, ctx.inverted ? "lose" : "win"),
      plan: () => (ctx.inverted ? [ringsAt + 0.4] : []),
      draw(g, b, view) {
        backdrop(g, view, "#2E3A59");
        floor(g, view, 860, "#46557A");
        // The window, the moon, a few stars.
        rect(g, 600, 120, 300, 260, "#1B2238", { radius: 20, color: "#BFC8E0" });
        circle(g, 790, 210, 50, "#FFF3B0", { stroke: false });
        circle(g, 812, 196, 44, "#1B2238", { stroke: false });
        for (const [x, y] of [
          [650, 170],
          [700, 300],
          [860, 330],
        ] as const) circle(g, x, y, 6, WHITE, { stroke: false });

        const awake = !ctx.inverted && tappedAt !== null && b >= tappedAt;
        const off = ctx.inverted && tappedAt !== null && b >= tappedAt;
        const ringing = b >= ringsAt && b < 7.4 && !off;

        // The crib.
        rect(g, 120, 560, 460, 240, "#FFFFFF", { radius: 20 });
        for (let i = 1; i < 8; i++) line(g, 120 + i * 57, 580, 120 + i * 57, 790, 8, "#C9CED9");
        ellipse(g, 350, 600, 170, 60, "#BDE0FE");
        at(g, 290, 570, () => {
          circle(g, 0, 0, 62, "#FFD8B5");
          face(g, 0, 4, 0.75, awake ? "sad" : "sleep");
        });
        if (awake) {
          // Tears.
          for (const s of [-1, 1]) ellipse(g, 290 + s * 40, 600 + ((b * 300) % 90), 8, 14, "#8FD3FF", { stroke: false });
        } else {
          for (let i = 0; i < 3; i++) {
            const u = (b * 0.6 + i / 3) % 1;
            g.globalAlpha = 1 - u;
            text(g, "z", 380 + u * 90, 480 - u * 150, 40 + i * 12, view, { color: WHITE });
          }
          g.globalAlpha = 1;
        }

        // The nightstand and the alarm clock.
        rect(g, 700, 680, 200, 180, "#8A5A2B");
        const shake = ringing && !view.reducedMotion ? Math.sin(b * 90) * 10 : 0;
        at(g, 800 + shake, 600, () => {
          circle(g, -50, -64, 26, "#FFB703");
          circle(g, 50, -64, 26, "#FFB703");
          circle(g, 0, 0, 80, "#FFB703");
          circle(g, 0, 0, 62, WHITE, { width: 6 });
          line(g, 0, 0, 0, -40, 8);
          line(g, 0, 0, 28, 10, 8);
          line(g, -50, 70, -60, 92, 10);
          line(g, 50, 70, 60, 92, 10);
        }, { rotate: shake / 120 });
        if (ringing) {
          const flare = clamp(Math.sin(b * Math.PI * 4) * 0.5 + 0.5);
          for (const s of [-1, 1]) {
            line(g, 800 + s * 110, 520, 800 + s * (140 + flare * 20), 490, 10, WHITE);
            line(g, 800 + s * 120, 580, 800 + s * (160 + flare * 20), 580, 10, WHITE);
          }
        }
        verdict.draw(g, b, view);
      },
    };
  },
});
