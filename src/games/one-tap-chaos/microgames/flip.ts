// FLIP! A pancake browns in the pan. Tap when it's golden, not burnt.
import { at, backdrop, circle, clamp, easeOut, ellipse, face, floor, lerp, progress, rect } from "../render/draw";
import { defineMicrogame, pickTime, Verdict } from "./kit";

const PX = 500;
const PY = 620;

/** Mix two hex colours. */
function mix(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (shift: number) => Math.round(lerp((pa >> shift) & 255, (pb >> shift) & 255, clamp(t)));
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
}

const RAW = "#F8EBC8";
const GOLDEN = "#E8A13A";
const BURNT = "#4A2E17";

export const flip = defineMicrogame({
  id: "flip",
  instruction: "FLIP!",
  hint: "Tap when the pancake is golden. Not raw, not burnt.",
  invertible: false,
  refrain: false,
  bg: "#FFB38A",
  cue: "sizzle",
  caption: "sizzle…",
  create(ctx) {
    const half = ctx.window * 1.6;
    const golden = pickTime(ctx.rng, 3.4, 6.0, ctx, half + 0.1);
    let flippedAt: number | null = null;
    const verdict = new Verdict();

    /** 0 raw → 1 golden → 2 burnt. */
    const cook = (t: number) => (t <= golden ? clamp(t / golden) : 1 + clamp((t - golden) / 1.6));
    const colour = (t: number) => {
      const c = cook(t);
      return c <= 1 ? mix(RAW, GOLDEN, c ** 1.6) : mix(GOLDEN, BURNT, c - 1);
    };

    return {
      update(b) {
        if (!verdict.decided && flippedAt === null && b > golden + half + 0.12) {
          ctx.emit("thunk");
          verdict.lose(golden + half);
        }
      },
      tap(b) {
        if (flippedAt !== null || verdict.decided) return;
        flippedAt = b;
        ctx.emit("flip");
        if (Math.abs(b - golden) <= half) verdict.win(b);
        else verdict.lose(b);
      },
      outcome: (final) => verdict.outcome(final),
      plan: () => [golden],
      draw(g, b, view) {
        backdrop(g, view, "#FFB38A");
        floor(g, view, 860, "#E07A4F");
        // The stove.
        rect(g, 170, 700, 660, 180, "#3D3D3D", { radius: 20 });
        for (let i = 0; i < 6; i++) {
          const flick = Math.sin(b * 9 + i) * 8;
          ellipse(g, 300 + i * 80, 712, 26, 30 + flick, "#2B59C3", { width: 5 });
        }

        // The pan.
        rect(g, PX + 250, PY + 10, 240, 40, "#1B1B1B", { radius: 20, stroke: false });
        ellipse(g, PX, PY + 30, 280, 70, "#3D3D3D");
        ellipse(g, PX, PY, 280, 70, "#555555");

        // The pancake: browns, then smokes.
        const shown = flippedAt !== null && b >= flippedAt ? flippedAt : b;
        const toss = flippedAt !== null ? progress(b, flippedAt, flippedAt + 0.6) : 0;
        const lift = Math.sin(toss * Math.PI) * 260;
        at(g, PX, PY - 10 - lift, () => {
          ellipse(g, 0, 0, 190, 46 * (toss > 0 ? Math.abs(Math.cos(toss * Math.PI)) + 0.1 : 1), colour(shown));
          if (toss === 0 || toss >= 1) {
            for (let i = 0; i < 6; i++) circle(g, -110 + i * 44, -6 + (i % 2) * 14, 7, "rgba(27,27,27,0.18)", { stroke: false });
            face(g, 0, -4, 0.7, cook(shown) > 1.25 ? "dizzy" : Math.abs(shown - golden) <= half ? "grin" : "sleep");
          }
        }, { rotate: toss * Math.PI * 2 });

        // Smoke once it's past golden.
        const smoke = clamp(cook(shown) - 1.15);
        if (smoke > 0) {
          for (let i = 0; i < 4; i++) {
            const rise = ((b * 0.8 + i * 0.25) % 1) * 260;
            g.globalAlpha = smoke * (1 - rise / 260) * 0.8;
            circle(g, PX - 90 + i * 60, PY - 80 - rise, 36 + rise * 0.15, "#6E6E6E", { stroke: false });
          }
          g.globalAlpha = 1;
        }
        // The golden moment sparkles (a shape cue, not only colour).
        const near = 1 - Math.abs(b - golden) / (half * 2.5);
        if (near > 0 && flippedAt === null) {
          for (const [dx, dy] of [
            [-210, -60],
            [210, -40],
            [0, -120],
          ] as const) {
            at(g, PX + dx, PY + dy, () => {
              rect(g, -5, -26, 10, 52, "#FFFFFF", { stroke: false });
              rect(g, -26, -5, 52, 10, "#FFFFFF", { stroke: false });
            }, { scale: easeOut(near), rotate: b * 2 });
          }
        }
        verdict.draw(g, b, view);
      },
    };
  },
});
