// DON'T! A big button that says TAP, with a fly walking on it. Don't tap at all.
// (Opposite Day: DON'T means DO.)
import { at, backdrop, circle, easeOut, ellipse, INK, line, progress, rect, text, WHITE } from "../render/draw";
import { defineMicrogame, Verdict } from "./kit";

const BX = 500;
const BY = 560;

export const dont = defineMicrogame({
  id: "dont",
  instruction: "DON'T!",
  hint: "Don't tap. Not even to swat the fly.",
  invertible: true,
  refrain: true,
  bg: "#A0E7E5",
  cue: "buzz",
  caption: "bzzzz…",
  create(ctx) {
    // The fly's stroll: a few waypoints on the button's top, ending right in the middle.
    const points: Array<[number, number]> = [];
    for (let i = 0; i < 5; i++) points.push([BX - 150 + ctx.rng() * 300, BY - 40 - ctx.rng() * 50]);
    points.push([BX, BY - 40]);
    const settle = 5;

    let slapAt: number | null = null;
    const verdict = new Verdict();

    const flyAt = (t: number): [number, number] => {
      const u = Math.min(points.length - 1, Math.max(0, (t / settle) * (points.length - 1)));
      const i = Math.min(points.length - 2, Math.floor(u));
      const f = u - i;
      const a = points[i]!;
      const c = points[i + 1]!;
      const ease = f * f * (3 - 2 * f);
      return [a[0] + (c[0] - a[0]) * ease, a[1] + (c[1] - a[1]) * ease];
    };

    return {
      update() {},
      tap(b) {
        if (slapAt !== null) return;
        slapAt = b;
        ctx.emit("slap");
        if (ctx.inverted) verdict.win(b);
        else verdict.lose(b);
      },
      // Not tapping wins (or, on Opposite Day, loses).
      outcome: (final) => verdict.outcome(final, ctx.inverted ? "lose" : "win"),
      plan: () => (ctx.inverted ? [2] : []),
      draw(g, b, view) {
        backdrop(g, view, "#A0E7E5");
        // The button: a dark base and a big blue top (the cover's TAP button).
        ellipse(g, BX, BY + 70, 300, 110, "#1C3A7F");
        rect(g, BX - 300, BY, 600, 70, "#1C3A7F", { stroke: false });
        line(g, BX - 300, BY, BX - 300, BY + 70);
        line(g, BX + 300, BY, BX + 300, BY + 70);
        const pressed = slapAt !== null && b >= slapAt ? 26 : 0;
        ellipse(g, BX, BY + pressed, 300, 110, "#2B59C3");
        ellipse(g, BX - 70, BY - 40 + pressed, 120, 30, "rgba(255,255,255,0.28)", { stroke: false });
        text(g, "TAP", BX, BY + 20 + pressed, 120, view, { color: WHITE });

        // The fly.
        const slapped = slapAt !== null && b >= slapAt;
        const [fx, fy] = flyAt(slapped ? slapAt! : b);
        if (!slapped) {
          const buzz = Math.sin(b * 60) * 0.5 + 0.5;
          at(g, fx, fy, () => {
            g.globalAlpha = 0.55;
            ellipse(g, -16, -22, 22, 12 + buzz * 6, WHITE, { width: 4, rotation: -0.5 });
            ellipse(g, 16, -22, 22, 12 + buzz * 6, WHITE, { width: 4, rotation: 0.5 });
            g.globalAlpha = 1;
            ellipse(g, 0, 0, 24, 30, INK, { stroke: false });
            circle(g, -9, -24, 9, "#6B4A2F", { stroke: false });
            circle(g, 9, -24, 9, "#6B4A2F", { stroke: false });
          });
        } else {
          // Splat, and the hand that did it.
          ellipse(g, fx, fy + pressed, 46, 16, INK, { stroke: false });
          const drop = easeOut(progress(b, slapAt!, slapAt! + 0.15));
          at(g, fx + 30, fy - 260 + drop * 210 + pressed, () => {
            rect(g, -90, -40, 180, 150, "#FFD8B5", { radius: 60 });
            for (let i = 0; i < 4; i++) rect(g, -80 + i * 44, -120, 36, 110, "#FFD8B5", { radius: 18 });
            rect(g, -60, 100, 120, 120, "#2B59C3", { radius: 16 });
          }, { rotate: -0.2 });
        }
        verdict.draw(g, b, view);
      },
    };
  },
});
