// PUMP! A balloon and a line. Tap to pump it up to the line, but don't pop it.
// Hold mode (comfort option): hold to pump instead of tapping fast.
import { randInt } from "@/engine/rng";
import { at, backdrop, circle, clamp, easeOut, face, floor, line, poly, rect, WHITE } from "../render/draw";
import { defineMicrogame, Verdict } from "./kit";

const STEP = 0.1;
const START = 0.25;
/** How fast holding pumps, per beat. */
const HOLD_RATE = 0.42;
const BX = 500;
const BY = 470;
const MAX_R = 300;

export const pump = defineMicrogame({
  id: "pump",
  instruction: "PUMP!",
  hint: "Tap to pump the balloon up to the line. Don't pop it.",
  invertible: false,
  refrain: false,
  bg: "#FFE3A3",
  cue: "pump",
  caption: "fwump!",
  create(ctx) {
    const needed = randInt(ctx.rng, ctx.difficulty < 0.5 ? 5 : 6, ctx.difficulty < 0.5 ? 6 : 7);
    const target = START + needed * STEP - 0.05;
    const popAt = target + STEP * (ctx.difficulty < 0.5 ? 2.6 : 1.6);

    let size = START;
    let shown = START;
    let lastPump = -1;
    let holdFrom: number | null = null;
    let poppedAt: number | null = null;
    const verdict = new Verdict();

    const check = (b: number) => {
      if (poppedAt === null && size >= popAt) {
        poppedAt = b;
        ctx.emit("pop");
        verdict.lose(b);
      }
    };

    return {
      update(b) {
        if (holdFrom !== null && poppedAt === null) {
          size += (b - holdFrom) * HOLD_RATE;
          holdFrom = b;
          check(b);
        }
        shown += (size - shown) * 0.35;
      },
      tap(b) {
        if (poppedAt !== null) return;
        lastPump = b;
        if (ctx.holdMode) {
          holdFrom = b;
          ctx.emit("pump");
          return;
        }
        size += STEP;
        ctx.emit("pump");
        check(b);
      },
      release(b) {
        if (holdFrom === null) return;
        size += (b - holdFrom) * HOLD_RATE;
        holdFrom = null;
        check(b);
      },
      outcome(final) {
        if (verdict.decided || !final) return verdict.value;
        return size >= target ? "win" : "lose";
      },
      plan: () => Array.from({ length: needed }, (_, i) => 1.4 + i * 0.45),
      draw(g, b, view) {
        backdrop(g, view, "#FFE3A3");
        floor(g, view, 900, "#F2B65A");
        const r = (s: number) => clamp(s, 0, 1.4) * MAX_R * 0.78;

        // The line to reach: a dashed ring, solid with a tick once you're there.
        const reached = size >= target && poppedAt === null;
        g.setLineDash(reached ? [] : [26, 18]);
        circle(g, BX, BY, r(target), null, { width: 10, color: reached ? "#1E8C4E" : "#1B1B1B" });
        g.setLineDash([]);

        // The pump.
        const push = easeOut(clamp(1 - (b - lastPump) * 5, 0, 1)) * 40;
        rect(g, 760, 690, 90, 210, "#2B59C3", { radius: 14 });
        rect(g, 795, 600 + push, 20, 100, "#1B1B1B", { stroke: false });
        rect(g, 740, 590 + push, 130, 26, "#1B1B1B", { radius: 12, stroke: false });
        g.beginPath();
        g.moveTo(760, 860);
        g.bezierCurveTo(620, 900, 560, 900, BX, BY + r(shown) + 50);
        g.lineWidth = 12;
        g.strokeStyle = "#1B1B1B";
        g.stroke();

        if (poppedAt !== null && b >= poppedAt) {
          // Pop! Bits of rubber fly out.
          const t = clamp((b - poppedAt) * 3);
          for (let i = 0; i < 10; i++) {
            const a = (i / 10) * Math.PI * 2;
            const d = r(popAt) * (0.6 + t * 0.8);
            at(g, BX + Math.cos(a) * d, BY + Math.sin(a) * d, () => poly(g, [-16, -10, 20, -4, 4, 18], "#9B5DE5", { width: 5 }), { rotate: a + t * 3 });
          }
          return verdict.draw(g, b, view);
        }

        // The balloon.
        const rr = r(shown);
        poly(g, [BX - 16, BY + rr + 4, BX + 16, BY + rr + 4, BX, BY + rr + 30], "#7B3FC4", { width: 6 });
        circle(g, BX, BY, rr, "#9B5DE5");
        circle(g, BX - rr * 0.38, BY - rr * 0.4, rr * 0.16, "rgba(255,255,255,0.55)", { stroke: false });
        if (rr > 90) face(g, BX, BY + 10, rr / 160, size > target + STEP ? "shock" : reached ? "grin" : "happy");
        if (size >= popAt - STEP * 0.6) {
          // Strained: little stress marks.
          for (const s of [-1, 1]) line(g, BX + s * (rr + 20), BY - rr * 0.5, BX + s * (rr + 50), BY - rr * 0.7, 8, WHITE);
        }
        verdict.draw(g, b, view);
      },
    };
  },
});
