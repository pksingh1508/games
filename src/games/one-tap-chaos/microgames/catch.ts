// CATCH! An egg falls; a basket slides back and forth. Tap to stop the basket under the egg.
import { randRange } from "@/engine/rng";
import { at, backdrop, circle, easeIn, ellipse, face, floor, INK, lerp, pingPong, poly, progress, rect, shadow } from "../render/draw";
import { defineMicrogame, firstCrossing, inDark, Verdict } from "./kit";

const LEFT = 180;
const RIGHT = 820;
const RIM = 770;
const DROP_AT = 0.8;
const HEN_Y = 210;

export const catchGame = defineMicrogame({
  id: "catch",
  instruction: "CATCH!",
  hint: "Tap to stop the basket right under the egg.",
  invertible: false,
  refrain: false,
  bg: "#B8E986",
  cue: "plop",
  caption: "plop!",
  create(ctx) {
    const period = lerp(2.6, 1.7, ctx.difficulty);
    const speed = (2 * (RIGHT - LEFT)) / period;
    const tol = Math.max(48, speed * ctx.window);
    const phase = ctx.rng() * period;
    const basketAt = (t: number) => lerp(LEFT, RIGHT, pingPong(t + phase, period));

    const eggX = randRange(ctx.rng, 280, 720);
    // Land when the moving basket is clearly elsewhere, so nobody catches it by accident.
    let land = randRange(ctx.rng, 5.8, 6.9);
    for (let i = 0; i < 40 && Math.abs(basketAt(land) - eggX) < tol + 90; i++) land = 5.8 + ((land - 5.8 + 0.137) % 1.1);

    // The bot's moment: the first time the basket passes under the egg, in daylight.
    let bot = 1.5;
    for (let from = 1.5; from < land - 0.3; ) {
      const t = firstCrossing(basketAt, eggX, from, land - 0.3, 0.02);
      if (t === null) break;
      bot = t;
      if (!inDark(ctx, t, ctx.window)) break;
      from = t + 0.05;
    }

    let stopped: number | null = null;
    let stopX = 0;
    const verdict = new Verdict();

    const eggY = (t: number) => (t < DROP_AT ? HEN_Y + 40 : lerp(HEN_Y + 40, RIM, easeIn(progress(t, DROP_AT, land))));

    return {
      update(b) {
        if (verdict.decided || b < land) return;
        if (stopped !== null && Math.abs(stopX - eggX) <= tol) {
          ctx.emit("plop");
          verdict.win(land);
        } else {
          ctx.emit("thunk");
          verdict.lose(land);
        }
      },
      tap(b) {
        if (stopped !== null || b >= land) return;
        stopped = b;
        stopX = basketAt(b);
        ctx.emit("clunk");
      },
      outcome: (final) => verdict.outcome(final),
      plan: () => [bot],
      draw(g, b, view) {
        backdrop(g, view, "#B8E986");
        floor(g, view, 860, "#7FC46A");

        // The hen on her shelf.
        rect(g, 380, HEN_Y + 40, 240, 26, "#A0703C", { radius: 10 });
        at(g, 500, HEN_Y - 10, () => {
          ellipse(g, 0, 0, 70, 56, "#FFFFFF");
          poly(g, [-14, -54, 0, -84, 14, -54], "#FFB703");
          poly(g, [56, -6, 84, 4, 56, 14], "#FFB703");
          face(g, 18, -8, 0.55, b < DROP_AT + 0.4 ? "shock" : "smug");
        });

        // The egg.
        const landed = b >= land;
        const caught = verdict.value === "win";
        const ey = landed ? RIM : eggY(b);
        if (!landed || caught) {
          ellipse(g, caught ? stopX : eggX, caught ? RIM - 18 : ey, 34, 44, "#FFF8E7");
        } else {
          // Splat.
          ellipse(g, eggX, 862, 80, 18, "#FFF8E7");
          circle(g, eggX + 6, 856, 18, "#FFC233");
        }

        // The basket.
        const x = stopped !== null && b >= stopped ? stopX : basketAt(b);
        shadow(g, x, 860, tol + 30);
        at(g, x, RIM, () => {
          const w = tol + 34;
          poly(g, [-w, 0, w, 0, w * 0.75, 86, -w * 0.75, 86], "#C98A3F");
          for (let i = 1; i < 4; i++) {
            g.beginPath();
            g.moveTo(-w + (i * w) / 2, 6);
            g.lineTo(-w * 0.75 + (i * w * 0.75) / 2, 80);
            g.strokeStyle = "rgba(27,27,27,0.35)";
            g.lineWidth = 5;
            g.stroke();
          }
          rect(g, -w - 8, -8, w * 2 + 16, 20, "#E0A65A", { radius: 10 });
        });
        if (stopped === null && !landed) {
          // Motion lines tell you it's moving.
          g.globalAlpha = 0.5;
          rect(g, x - tol - 70, RIM + 30, 16, 6, INK, { stroke: false });
          rect(g, x + tol + 54, RIM + 30, 16, 6, INK, { stroke: false });
          g.globalAlpha = 1;
        }

        verdict.draw(g, b, view);
      },
    };
  },
});
