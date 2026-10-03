// JUMP! A runner heads for a cactus. Tap to jump it.
import { randRange } from "@/engine/rng";
import { at, backdrop, circle, clamp, ellipse, face, floor, INK, line, rect, shadow } from "../render/draw";
import { defineMicrogame, pickTime, Verdict } from "./kit";

const RUNNER_X = 300;
const GROUND = 760;
const RUNNER_R = 46;
/** Time in the air, and the peak height. */
const AIR = 1.2;
const PEAK = 330;
const CACTUS_H = 150;
/** Cactus speed, in scene units per beat. */
const SPEED = 380;

export const jump = defineMicrogame({
  id: "jump",
  instruction: "JUMP!",
  hint: "Tap to jump over the cactus.",
  invertible: false,
  refrain: false,
  bg: "#8FD3FF",
  cue: "boing",
  caption: "boing!",
  create(ctx) {
    // The part of a jump spent above the cactus.
    const above = AIR * Math.sqrt(1 - CACTUS_H / PEAK);
    // Overlap time with a cactus, chosen so the jump window is exactly ±window.
    const half = Math.max(0.12, (above - 2 * ctx.window) / 2);
    const cactusHalfWidth = Math.max(26, half * SPEED - RUNNER_R);
    const rise = (AIR - above) / 2;

    const first = pickTime(ctx.rng, 2.4, 4.0, ctx, ctx.window + 0.3) + AIR / 2;
    const cacti = [first];
    if (ctx.difficulty >= 0.4 && ctx.rng() < 0.4 + ctx.difficulty * 0.6) {
      const second = first + randRange(ctx.rng, 1.65, 2.2);
      if (second + half < 7.8) cacti.push(second);
    }

    const jumps: number[] = [];
    const verdict = new Verdict();
    let crashAt = Infinity;
    let cleared = 0;

    const airborne = (t: number) => jumps.find((j) => t >= j && t <= j + AIR) ?? null;
    const height = (t: number) => {
      const j = airborne(t);
      if (j === null) return 0;
      const x = (t - j) / AIR;
      return 4 * PEAK * x * (1 - x);
    };
    /** When this cactus hits the runner, or null if the jump clears it. */
    const hitTime = (T: number) => {
      const j = airborne(T - half);
      if (j !== null && j + rise <= T - half + 1e-9 && j + rise + above >= T + half - 1e-9) return null;
      if (j === null || j + rise > T - half) return T - half;
      return j + rise + above;
    };

    return {
      update(b) {
        if (verdict.decided) return;
        for (let i = cleared; i < cacti.length; i++) {
          const T = cacti[i]!;
          // Wait a moment past the deadline: a tap can arrive a frame late.
          if (b < T - half + 0.12) break;
          const hit = hitTime(T);
          if (hit !== null) {
            crashAt = hit;
            ctx.emit("thunk");
            verdict.lose(hit);
            return;
          }
          if (b < T + half) break;
          cleared = i + 1;
        }
        if (cleared === cacti.length) verdict.win(cacti[cacti.length - 1]! + half);
      },
      tap(b) {
        if (verdict.value === "lose") return;
        const last = jumps[jumps.length - 1];
        if (last !== undefined && b < last + AIR) return;
        jumps.push(b);
        ctx.emit("boing");
      },
      outcome: (final) => verdict.outcome(final),
      plan: () => cacti.map((T) => T - AIR / 2),
      draw(g, b, view) {
        backdrop(g, view, "#8FD3FF");
        // Distant hills scroll slowly.
        for (let i = -1; i < 6; i++) {
          const x = (((i * 420 - b * SPEED * 0.25) % 2520) + 2520) % 2520 - 600;
          ellipse(g, x, GROUND + 20, 260, 170, "#BDE7FF", { stroke: false });
        }
        floor(g, view, GROUND, "#F4C77B");
        // Ground speckles scroll with the cacti.
        for (let i = 0; i < 18; i++) {
          const x = ((((i * 173) - b * SPEED) % 1900) + 1900) % 1900 - 450;
          line(g, x, GROUND + 50 + (i % 3) * 40, x + 40, GROUND + 50 + (i % 3) * 40, 7, "#D9A653");
        }

        // Cacti.
        for (const T of cacti) {
          const x = RUNNER_X + (T - b) * SPEED;
          if (x < view.left - 200 || x > view.right + 200) continue;
          const w = cactusHalfWidth;
          shadow(g, x, GROUND, w + 20);
          rect(g, x - w * 0.55, GROUND - CACTUS_H, w * 1.1, CACTUS_H + 4, "#3FA34D", { radius: w * 0.5 });
          rect(g, x - w - 6, GROUND - CACTUS_H * 0.72, w * 0.5, CACTUS_H * 0.38, "#3FA34D", { radius: 16 });
          rect(g, x + w * 0.5 + 6, GROUND - CACTUS_H * 0.82, w * 0.5, CACTUS_H * 0.32, "#3FA34D", { radius: 16 });
        }

        // The runner.
        const crashed = b >= crashAt;
        const h = crashed ? 0 : height(b);
        const y = GROUND - RUNNER_R - h;
        shadow(g, RUNNER_X, GROUND, RUNNER_R * clamp(1 - h / 600, 0.4, 1));
        at(g, RUNNER_X, crashed ? GROUND - RUNNER_R * 0.6 : y, () => {
          if (!crashed && h === 0) {
            const step = Math.sin(b * Math.PI * 4) * 16;
            line(g, -14, RUNNER_R - 6, -14 + step, RUNNER_R + 14, 12);
            line(g, 14, RUNNER_R - 6, 14 - step, RUNNER_R + 14, 12);
          }
          circle(g, 0, 0, RUNNER_R, "#FFB703");
          face(g, 8, -4, 0.75, crashed ? "dizzy" : h > 0 ? "happy" : "smug", 1);
        }, { rotate: crashed ? -1.4 : h > 0 ? -0.25 : 0 });
        if (crashed) circle(g, RUNNER_X - 40, GROUND - 10, 26, "#FFFFFF", { width: 6, color: INK });

        verdict.draw(g, b, view);
      },
    };
  },
});
