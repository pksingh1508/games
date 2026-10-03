// BIGGER! Two numbers take turns lighting up. Tap while the bigger one is lit.
import { randInt, type Rng } from "@/engine/rng";
import { at, backdrop, circle, fitSize, rect, text, WHITE } from "../render/draw";
import { defineMicrogame, inDark, Verdict } from "./kit";

const START = 1;

/** Two different numbers as text, and which is bigger. Harder later: close calls, negatives, decimals. */
function numbers(rng: Rng, difficulty: number): [string, string, number, number] {
  const kind = difficulty < 0.3 ? 0 : difficulty < 0.6 ? randInt(rng, 0, 2) : randInt(rng, 1, 3);
  let a: number;
  let b: number;
  switch (kind) {
    case 0:
      a = randInt(rng, 1, 20);
      do b = randInt(rng, 1, 20);
      while (Math.abs(a - b) < 4);
      return [String(a), String(b), a, b];
    case 1:
      a = randInt(rng, 10, 99);
      do b = randInt(rng, 10, 99);
      while (a === b || Math.abs(a - b) > 6);
      return [String(a), String(b), a, b];
    case 2:
      a = -randInt(rng, 1, 19);
      do b = -randInt(rng, 1, 19);
      while (a === b);
      return [String(a), String(b), a, b];
    default: {
      // 0.5 vs 0.45: the longer one isn't the bigger one. Worked in hundredths, so it's exact.
      const tenths = randInt(rng, 0, 3) * 100 + randInt(rng, 1, 9) * 10;
      const hundredths = tenths - randInt(rng, 1, 9);
      const fmt = (h: number) => (h % 10 === 0 ? (h / 100).toFixed(1) : (h / 100).toFixed(2));
      return rng() < 0.5 ? [fmt(tenths), fmt(hundredths), tenths, hundredths] : [fmt(hundredths), fmt(tenths), hundredths, tenths];
    }
  }
}

export const bigger = defineMicrogame({
  id: "bigger",
  instruction: "BIGGER!",
  hint: "Tap while the bigger number is lit. Size of the writing doesn't count.",
  invertible: false,
  refrain: false,
  bg: "#E2D4F0",
  cue: "ding",
  caption: "ding!",
  create(ctx) {
    const [left, right, a, b2] = numbers(ctx.rng, ctx.difficulty);
    const biggerSide = a > b2 ? 0 : 1;
    const step = ctx.difficulty < 0.6 ? 1 : 0.5;
    const firstSide = ctx.rng() < 0.5 ? 0 : 1;
    // A Stroop twist later on: the smaller number is written larger.
    const trick = ctx.difficulty >= 0.35 && ctx.rng() < 0.55;
    const tail = ctx.window * 0.35;

    const litAt = (t: number) => (t < START ? -1 : (firstSide + Math.floor((t - START) / step)) % 2);

    // The bot: the middle of the first bigger slot in daylight.
    let bot = START + step / 2;
    for (let k = 0; k < 16; k++) {
      const s = START + k * step;
      const mid = s + step / 2;
      if (litAt(mid) === biggerSide && s >= 1.4 && !inDark(ctx, mid, step / 2)) {
        bot = mid;
        break;
      }
    }

    let tappedAt: number | null = null;
    const verdict = new Verdict();

    return {
      update() {},
      tap(t) {
        if (tappedAt !== null) return;
        tappedAt = t;
        const ok = litAt(t) === biggerSide || (t - tail >= START && litAt(t - tail) === biggerSide);
        if (ok) {
          ctx.emit("ding");
          verdict.win(t);
        } else {
          ctx.emit("thunk");
          verdict.lose(t);
        }
      },
      outcome: (final) => verdict.outcome(final),
      plan: () => [bot],
      draw(g, t, view) {
        backdrop(g, view, "#E2D4F0");
        const lit = litAt(tappedAt !== null && t >= tappedAt ? tappedAt : t);
        const values = [left, right];
        [0, 1].forEach((side) => {
          const x = side === 0 ? 270 : 730;
          const on = lit === side;
          const isBigger = side === biggerSide;
          const size = trick ? (isBigger ? 120 : 230) : 190;
          at(g, x, 560, () => {
            rect(g, -190, -230, 380, 460, on ? "#FFFFFF" : "#B8A9CC", { radius: 40 });
            // Bulbs around the lit card: a shape cue, not only brightness.
            if (on) {
              for (let i = 0; i < 10; i++) {
                const a = (i / 10) * Math.PI * 2;
                circle(g, Math.cos(a) * 225, Math.sin(a) * 265, 18, "#FFB703", { width: 5 });
              }
            }
            const value = values[side]!;
            text(g, value, 0, 10, fitSize(g, value, view, size, 320), view, { color: on ? "#1B1B1B" : "rgba(27,27,27,0.45)" });
          });
        });
        text(g, "VS", 500, 560, 60, view, { color: WHITE, outline: 10 });
        verdict.draw(g, t, view);
      },
    };
  },
});
