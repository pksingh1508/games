// LOADING… A loading bar that "needs a tap to skip". Don't tap. On the last beat the
// instruction turns into "…DON'T." The tell: its instruction is in the microgame font.
// (Opposite Day: skip it.)
import { at, backdrop, circle, clamp, easeOut, rect, text, WHITE } from "../render/draw";
import { defineMicrogame, Verdict } from "./kit";

/** The fake system interface uses a plain system font, not the show's. */
const UI_FONT = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";

export const loading = defineMicrogame({
  id: "loading",
  instruction: "LOADING…",
  hint: "Don't tap, even though it says “tap to skip”.",
  invertible: true,
  refrain: true,
  bg: "#E8ECEF",
  cue: "blip",
  caption: "bloop",
  create(ctx) {
    let tappedAt: number | null = null;
    const verdict = new Verdict();
    const bar = (t: number) => Math.min(0.99, easeOut(clamp(t / 6.5)) * 1.02);

    return {
      update() {},
      tap(b) {
        if (tappedAt !== null) return;
        tappedAt = b;
        if (ctx.inverted) {
          ctx.emit("blip");
          verdict.win(b);
        } else {
          ctx.emit("gotcha");
          verdict.lose(b);
        }
      },
      outcome: (final) => verdict.outcome(final, ctx.inverted ? "lose" : "win"),
      plan: () => (ctx.inverted ? [2] : []),
      cues: [2, 4, 6].map((beat) => ({ beat, sound: "blip" as const })),
      label: (b) => (b >= 7 && tappedAt === null && !ctx.inverted ? { text: "…DON'T." } : null),
      draw(g, b, view) {
        backdrop(g, view, "#E8ECEF");
        const shown = tappedAt !== null && b >= tappedAt ? tappedAt : b;
        // A plain "system" card.
        rect(g, 140, 300, 720, 420, WHITE, { radius: 24, width: 4, color: "#C9D1D9" });
        g.font = `600 44px ${UI_FONT}`;
        g.textAlign = "left";
        g.textBaseline = "middle";
        g.fillStyle = "#24292F";
        g.fillText("Loading level…", 200, 390);
        rect(g, 200, 460, 600, 34, "#EAEEF2", { radius: 17, stroke: false });
        rect(g, 200, 460, 600 * bar(shown), 34, "#2B59C3", { radius: 17, stroke: false });
        g.font = `500 30px ${UI_FONT}`;
        g.fillStyle = "#57606A";
        g.fillText(`${Math.floor(bar(shown) * 100)}%`, 200, 545);
        // Spinner.
        at(g, 770, 390, () => {
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            g.globalAlpha = (i + 1) / 8;
            circle(g, Math.cos(a) * 22, Math.sin(a) * 22, 6, "#57606A", { stroke: false });
          }
          g.globalAlpha = 1;
        }, { rotate: view.reducedMotion ? 0 : shown * 4 });
        // The tempting button.
        rect(g, 560, 600, 240, 70, "#F6F8FA", { radius: 12, width: 3, color: "#C9D1D9" });
        g.font = `600 30px ${UI_FONT}`;
        g.textAlign = "center";
        g.fillStyle = "#24292F";
        g.fillText("Tap to skip ›", 680, 636);

        if (tappedAt !== null && b >= tappedAt && !ctx.inverted) {
          at(g, 500, 520, () => {
            rect(g, -330, -90, 660, 180, "#1B1B1B", { radius: 20, stroke: false });
            text(g, "GOTCHA!", 0, 6, 120, view, { color: WHITE });
          }, { rotate: -0.08, scale: easeOut(clamp((b - tappedAt) * 6)) });
        }
        verdict.draw(g, b, view);
      },
    };
  },
});
