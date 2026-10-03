// WAIT… A crossing signal shows a hand. Tap only after it turns to GO (tapping early is a fail).
// (Opposite Day: tap before it turns.)
// Red is reserved for Red Means No, so the "stop" hand is the pedestrian-signal orange.
import { at, backdrop, circle, floor, line, rect, text } from "../render/draw";
import { defineMicrogame, pickTime, Verdict } from "./kit";

const SX = 500;
const SY = 470;

export const wait = defineMicrogame({
  id: "wait",
  instruction: "WAIT…",
  hint: "Tap only after the signal says GO. Tapping early is a fail.",
  invertible: true,
  refrain: false,
  bg: "#B5D8FF",
  cue: "beep",
  caption: "beep beep",
  create(ctx) {
    const go = pickTime(ctx.rng, 3.0, 5.6, ctx, 0.3);
    // A fake-out blink later in a run.
    const blink = ctx.difficulty >= 0.35 ? go - 1.1 - ctx.rng() * 0.4 : null;
    let tappedAt: number | null = null;
    const verdict = new Verdict();

    return {
      update() {},
      tap(b) {
        if (tappedAt !== null) return;
        tappedAt = b;
        const early = b < go;
        if (early === ctx.inverted) {
          ctx.emit("go");
          verdict.win(b);
        } else {
          ctx.emit("honk");
          verdict.lose(b);
        }
      },
      outcome: (final) => verdict.outcome(final),
      plan: () => (ctx.inverted ? [1.6] : [go + 0.35]),
      cues: [{ beat: go, sound: "beep" }],
      draw(g, b, view) {
        backdrop(g, view, "#B5D8FF");
        floor(g, view, 820, "#6C757D");
        for (let i = -6; i < 12; i++) rect(g, i * 140 + 20, 860, 90, 140, "#FFFFFF", { stroke: false });
        // The pole and the signal box.
        rect(g, SX - 18, SY + 150, 36, 380, "#3D3D3D");
        rect(g, SX - 170, SY - 200, 340, 360, "#2E2E2E", { radius: 36 });
        const isGo = b >= go;
        const blinking = blink !== null && b >= blink && b < blink + 0.18;
        // Top lamp: the stop hand (orange).
        circle(g, SX, SY - 95, 88, isGo || blinking ? "#4A3A2A" : "#FF8C1A");
        if (!isGo && !blinking) {
          at(g, SX, SY - 95, () => {
            rect(g, -30, -20, 60, 70, "#FFFFFF", { radius: 18, stroke: false });
            for (let i = 0; i < 4; i++) rect(g, -30 + i * 16, -62, 12, 50, "#FFFFFF", { radius: 6, stroke: false });
            rect(g, 22, -6, 26, 14, "#FFFFFF", { radius: 7, stroke: false });
          });
        }
        // Bottom lamp: the walking GO.
        circle(g, SX, SY + 75, 88, isGo ? "#2FBF71" : "#203A2C");
        if (isGo) {
          at(g, SX, SY + 75, () => {
            circle(g, 6, -44, 14, "#FFFFFF", { stroke: false });
            line(g, 0, -26, -6, 14, 14, "#FFFFFF");
            const swing = Math.sin(b * 8) * 14;
            line(g, -6, 14, -24 + swing, 52, 12, "#FFFFFF");
            line(g, -6, 14, 14 - swing, 52, 12, "#FFFFFF");
            line(g, 0, -18, 28, 2 - swing, 10, "#FFFFFF");
            line(g, 0, -18, -26, 0 + swing, 10, "#FFFFFF");
          });
          text(g, "GO", SX + 260, SY + 75, 90, view, { color: "#1E8C4E", outline: 10, outlineColor: "#FFFFFF" });
        }
        // A waiting pedestrian, tapping their foot.
        const tapFoot = Math.max(0, Math.sin(b * Math.PI * 2)) * 12;
        rect(g, 760, 660, 70, 140, "#FFB703", { radius: 30 });
        circle(g, 795, 630, 40, "#FFD8B5");
        line(g, 775, 800, 770, 820 - tapFoot, 12);
        verdict.draw(g, b, view);
      },
    };
  },
});
