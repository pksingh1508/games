// BEAT! A drum. The sticks count you in (1, 2, 3), then you tap on the next 4 beats.
import { at, backdrop, circle, clamp, ellipse, floor, line, rect, text, WHITE } from "../render/draw";
import { defineMicrogame, Verdict } from "./kit";

const DX = 500;
const DY = 600;

export const beat = defineMicrogame({
  id: "beat",
  instruction: "BEAT!",
  hint: "The sticks count you in. Then tap on the next 4 beats, no extra taps.",
  invertible: false,
  refrain: false,
  bg: "#F4A6C6",
  cue: "drum",
  caption: "dum!",
  create(ctx) {
    // Later in a run the rhythm gets a skip in it.
    const patterns: number[][] = ctx.difficulty < 0.55 ? [[4, 5, 6, 7]] : [[4, 5, 6, 7], [4, 5, 5.5, 6], [4, 4.5, 5, 6], [4, 5, 6, 6.5]];
    const targets = patterns[Math.floor(ctx.rng() * patterns.length)]!;
    const tol = Math.max(ctx.window * 1.3, 0.14);
    const hit = targets.map(() => false);
    const verdict = new Verdict();
    let lastHit = -10;

    return {
      update(b) {
        if (verdict.decided) return;
        // A missed beat (with a little slack for late taps).
        targets.forEach((t, i) => {
          if (!hit[i] && b > t + tol + 0.12) {
            ctx.emit("thunk");
            verdict.lose(t + tol);
          }
        });
        if (!verdict.decided && hit.every(Boolean)) verdict.win(targets[targets.length - 1]!);
      },
      tap(b) {
        if (verdict.decided) return;
        const i = targets.findIndex((t, k) => !hit[k] && Math.abs(b - t) <= tol);
        if (i < 0) {
          ctx.emit("thunk");
          verdict.lose(b);
          return;
        }
        hit[i] = true;
        lastHit = b;
        ctx.emit("drum");
      },
      outcome: (final) => verdict.outcome(final),
      plan: () => [...targets],
      cues: [1, 2, 3].map((t) => ({ beat: t, sound: "sticks" as const })),
      draw(g, b, view) {
        backdrop(g, view, "#F4A6C6");
        floor(g, view, 900, "#C9789B");

        // The drum: shell, rim and head.
        const thump = clamp(1 - (b - lastHit) * 6);
        rect(g, DX - 230, DY - 30, 460, 230, "#2B59C3", { radius: 30 });
        for (let i = 0; i < 6; i++) line(g, DX - 210 + i * 84, DY, DX - 170 + i * 84, DY + 170, 6, "#FFB703");
        at(g, DX, DY - 30, () => ellipse(g, 0, 0, 230, 70, "#FFF8E7"), { scale: 1 + thump * 0.06 });

        // The count-in: sticks click on 1, 2, 3.
        for (const [i, t] of [1, 2, 3].entries()) {
          const lit = b >= t && b < t + 0.6;
          text(g, String(i + 1), DX - 200 + i * 200, 190, lit ? 110 : 80, view, {
            color: lit ? WHITE : "rgba(27,27,27,0.25)",
            outline: lit ? 12 : 0,
          });
        }
        const click = [1, 2, 3].some((t) => b >= t && b < t + 0.2);
        line(g, DX - 120, DY - 230, DX + (click ? 20 : -10), DY - 120, 16, "#C98A3F");
        line(g, DX + 120, DY - 230, DX + (click ? -20 : 10), DY - 120, 16, "#C98A3F");

        // The beats to hit: rings that close in on the drum.
        targets.forEach((t, i) => {
          const x = DX - 270 + i * 180;
          const done = hit[i];
          circle(g, x, 400, 40, done ? "#2FBF71" : WHITE, { width: 8 });
          if (!done && b > t - 1.2 && b < t + tol) {
            const r = 40 + Math.max(0, t - b) * 90;
            circle(g, x, 400, r, null, { width: 7 });
          }
        });
        verdict.draw(g, b, view);
      },
    };
  },
});
