// STOP! A needle spins around a dial. Tap when it's in the green zone.
import { at, backdrop, circle, lerp, line, rect, star, WHITE } from "../render/draw";
import { defineMicrogame, pickTime, Verdict } from "./kit";

const CX = 500;
const CY = 560;
const R = 300;
const START = 0.6;

const wrap = (a: number) => {
  const tau = Math.PI * 2;
  return ((a % tau) + tau) % tau;
};
const distance = (a: number, b: number) => {
  const d = Math.abs(wrap(a) - wrap(b));
  return Math.min(d, Math.PI * 2 - d);
};

export const stop = defineMicrogame({
  id: "stop",
  instruction: "STOP!",
  hint: "Tap when the needle is in the green zone.",
  invertible: false,
  refrain: false,
  bg: "#C3B1E1",
  cue: "tick",
  caption: "tick tick",
  create(ctx) {
    const omega = (Math.PI * 2) / lerp(2.2, 1.5, ctx.difficulty);
    const angleAt = (t: number) => omega * Math.max(0, t - START);
    // Pick when the needle first meets the zone, then put the zone there.
    const meet = pickTime(ctx.rng, 1.8, 3.4, ctx, ctx.window + 0.15);
    const zone = wrap(angleAt(meet));
    const halfZone = omega * ctx.window;

    let stoppedAt: number | null = null;
    const verdict = new Verdict();

    return {
      update() {},
      tap(b) {
        if (stoppedAt !== null) return;
        stoppedAt = b;
        ctx.emit("clunk");
        if (b >= START && distance(angleAt(b), zone) <= halfZone) verdict.win(b);
        else verdict.lose(b);
      },
      outcome: (final) => verdict.outcome(final),
      plan: () => [meet],
      draw(g, b, view) {
        backdrop(g, view, "#C3B1E1");
        // The dial.
        circle(g, CX, CY + 16, R + 22, "#1B1B1B", { stroke: false });
        circle(g, CX, CY, R + 22, "#F5F1FF");
        // The green zone, with a star so it never relies on colour.
        g.beginPath();
        g.moveTo(CX, CY);
        g.arc(CX, CY, R, zone - halfZone - Math.PI / 2, zone + halfZone - Math.PI / 2);
        g.closePath();
        g.fillStyle = "#2FBF71";
        g.fill();
        g.lineWidth = 8;
        g.strokeStyle = "#1B1B1B";
        g.stroke();
        const sx = CX + Math.sin(zone) * (R + 60);
        const sy = CY - Math.cos(zone) * (R + 60);
        star(g, sx, sy, 34, 15, 5, "#2FBF71", { width: 7 });
        // Ticks.
        for (let i = 0; i < 24; i++) {
          const a = (i / 24) * Math.PI * 2;
          const inner = i % 2 === 0 ? R - 44 : R - 26;
          line(g, CX + Math.sin(a) * inner, CY - Math.cos(a) * inner, CX + Math.sin(a) * (R - 8), CY - Math.cos(a) * (R - 8), 6);
        }
        // The needle.
        const angle = angleAt(stoppedAt !== null && b >= stoppedAt ? stoppedAt : b);
        at(g, CX, CY, () => {
          rect(g, -12, -R + 30, 24, R - 10, "#1B1B1B", { radius: 12, stroke: false });
          circle(g, 0, -R + 46, 12, WHITE, { width: 6 });
        }, { rotate: angle });
        circle(g, CX, CY, 34, "#FFB703");
        verdict.draw(g, b, view);
      },
    };
  },
});
