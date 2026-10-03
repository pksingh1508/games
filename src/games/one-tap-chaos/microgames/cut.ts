// CUT! A sandbag swings on a rope above a sneaking villain. Tap to cut it when it's right above him.
import { at, backdrop, circle, clamp, easeIn, ellipse, face, floor, lerp, line, progress, rect, text } from "../render/draw";
import { defineMicrogame, firstCrossing, inDark, Verdict } from "./kit";

const PIVOT_X = 500;
const PIVOT_Y = 150;
const ROPE = 330;
const SWING = 0.55;
const FLOOR_Y = 860;
/** The villain's speed, units per beat. */
const SNEAK = 75;
/** A cut bag takes this long to land. */
const FALL = 0.35;

export const cut = defineMicrogame({
  id: "cut",
  instruction: "CUT!",
  hint: "Tap to cut the rope when the sandbag will land on the villain.",
  invertible: false,
  refrain: false,
  bg: "#D9C4A8",
  cue: "snip",
  caption: "snip!",
  create(ctx) {
    const period = lerp(2.2, 1.6, ctx.difficulty);
    const phase = ctx.rng() * period;
    const angle = (t: number) => SWING * Math.sin(((t + phase) / period) * Math.PI * 2);
    const bagX = (t: number) => PIVOT_X + ROPE * Math.sin(angle(t));
    const bagY = (t: number) => PIVOT_Y + ROPE * Math.cos(angle(t));
    const fromLeft = ctx.rng() < 0.5;
    const villainX = (t: number) => (fromLeft ? 165 + SNEAK * t : 835 - SNEAK * t);
    const speed = (ROPE * SWING * Math.PI * 2) / period + SNEAK;
    const tol = Math.max(95, speed * ctx.window);

    // The bot: the first moment the falling bag would land on him, in daylight.
    const gap = (t: number) => bagX(t) - villainX(t + FALL);
    let bot = 3;
    for (let from = 2.2; from < 7; ) {
      const t = firstCrossing(gap, 0, from, 7.2, 0.01);
      if (t === null) break;
      bot = t;
      if (!inDark(ctx, t, ctx.window)) break;
      from = t + 0.05;
    }

    let cutAt: number | null = null;
    let dropX = 0;
    let dropY = 0;
    const verdict = new Verdict();

    return {
      update(b) {
        if (cutAt === null || verdict.decided || b < cutAt + FALL) return;
        if (Math.abs(dropX - villainX(cutAt + FALL)) <= tol) {
          ctx.emit("thunk");
          verdict.win(cutAt + FALL);
        } else {
          ctx.emit("thunk");
          verdict.lose(cutAt + FALL);
        }
      },
      tap(b) {
        if (cutAt !== null) return;
        cutAt = b;
        dropX = bagX(b);
        dropY = bagY(b);
        ctx.emit("snip");
      },
      outcome: (final) => verdict.outcome(final),
      plan: () => [bot],
      draw(g, b, view) {
        backdrop(g, view, "#D9C4A8");
        floor(g, view, FLOOR_Y, "#9C7A54");
        rect(g, view.left - 20, 90, view.right - view.left + 40, 40, "#6B4F33");

        // The villain sneaks along (and gets flattened, or gets away).
        const squashed = verdict.value === "win" && b >= verdict.at;
        const vx = squashed ? villainX(verdict.at) : villainX(b);
        const step = Math.sin(b * Math.PI * 4) * 10;
        at(g, vx, FLOOR_Y, () => {
          if (squashed) {
            ellipse(g, 0, -16, 90, 18, "#3D2C8D");
            return;
          }
          rect(g, -48, -170, 96, 150, "#3D2C8D", { radius: 40 });
          line(g, -20, -24, -26 + step, 0, 12);
          line(g, 20, -24, 26 - step, 0, 12);
          circle(g, 0, -200, 46, "#B9F0C8");
          rect(g, -56, -258, 112, 26, "#1B1B1B", { radius: 6 });
          rect(g, -36, -300, 72, 50, "#1B1B1B", { radius: 6 });
          face(g, fromLeft ? 8 : -8, -198, 0.6, verdict.value === "lose" ? "grin" : "smug", fromLeft ? 1 : -1);
          // Twirly moustache.
          line(g, -28, -180, 28, -180, 8);
        });

        // The rope and the bag.
        const falling = cutAt !== null && b >= cutAt;
        const x = falling ? dropX : bagX(b);
        const y = falling ? lerp(dropY, FLOOR_Y - 60, easeIn(progress(b, cutAt!, cutAt! + FALL))) : bagY(b);
        if (!falling) line(g, PIVOT_X, PIVOT_Y, x, y - 60, 8, "#5B4636");
        else line(g, PIVOT_X, PIVOT_Y, PIVOT_X + (dropX - PIVOT_X) * 0.3, PIVOT_Y + 90, 8, "#5B4636");
        circle(g, PIVOT_X, PIVOT_Y, 14, "#1B1B1B");
        at(g, x, y, () => {
          rect(g, -55, -60, 110, 120, "#C9A26B", { radius: 30 });
          text(g, "10T", 0, 6, 40, view, { color: "#5B4636" });
        }, { rotate: falling ? 0 : angle(b) * 0.6 });
        // Where it would land, as you watch.
        if (!falling && !verdict.decided) {
          g.globalAlpha = 0.35;
          ellipse(g, x, FLOOR_Y + 4, 56 * clamp(1 - Math.abs(angle(b)) * 0.3), 12, "#1B1B1B", { stroke: false });
          g.globalAlpha = 1;
        }
        verdict.draw(g, b, view);
      },
    };
  },
});
