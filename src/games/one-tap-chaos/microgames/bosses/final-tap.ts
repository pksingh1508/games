// BOSS: The Final Tap. One huge button and a 16-beat countdown. The word changes every beat.
// Tap only on the beat where it says NOW.
import { pick, randInt } from "@/engine/rng";
import { backdrop, circle, clamp, ellipse, fitSize, floor, line, poly, rect, text, WHITE } from "../../render/draw";
import type { Boss, Cue } from "../types";
import { Verdict } from "../kit";

const DECOYS = ["NO", "NOT YET", "WAIT", "HOLD", "SOON", "ALMOST", "KNOW", "SNOW", "WOW", "OWN", "NAH", "NOPE"];

export const finalTap: Boss = {
  id: "final-tap",
  name: "The Final Tap",
  instruction: "WAIT FOR IT…",
  hint: "One tap, on the one beat that says NOW. Not KNOW, not SNOW.",
  invertible: false,
  refrain: false,
  bg: "#111111",
  cue: "gong",
  caption: "GONG!",
  create(ctx) {
    const now = randInt(ctx.rng, 8, 14);
    const words: string[] = [];
    for (let k = 0; k < 16; k++) {
      if (k === now) {
        words.push("NOW!");
        continue;
      }
      let w: string;
      do w = pick(ctx.rng, DECOYS);
      while (words.length && words[words.length - 1] === w);
      words.push(w);
    }
    const tail = ctx.window * 0.35;
    const verdict = new Verdict();
    let pressedAt: number | null = null;
    const cues: Cue[] = Array.from({ length: 16 }, (_, k) => ({ beat: k, sound: "tock" }));

    return {
      cues,
      update(b) {
        if (!verdict.decided && b > now + 1 + tail + 0.12) {
          ctx.emit("fail");
          verdict.lose(now + 1);
        }
      },
      tap(b) {
        if (verdict.decided) return;
        pressedAt = b;
        if (Math.floor(b) === now || (b - tail >= 0 && Math.floor(b - tail) === now)) {
          ctx.emit("now");
          verdict.win(b);
        } else {
          ctx.emit("fail");
          verdict.lose(b);
        }
      },
      outcome: (final) => verdict.outcome(final),
      plan: () => [now + 0.45],
      label: (b) => ({ text: words[Math.min(15, Math.max(0, Math.floor(b)))]! }),
      draw(g, b, view) {
        backdrop(g, view, "#111111");
        floor(g, view, 880, "#222222");
        // The spotlight.
        g.globalAlpha = 0.18;
        poly(g, [430, view.top, 570, view.top, 840, 880, 160, 880], "#FFF3B0", { stroke: false });
        g.globalAlpha = 1;
        ellipse(g, 500, 880, 340, 50, "rgba(255,243,176,0.25)", { stroke: false });

        // The LED board with the word of the beat.
        const k = Math.min(15, Math.max(0, Math.floor(b)));
        const word = words[k]!;
        rect(g, 180, 130, 640, 190, "#000000", { radius: 20, color: "#444444" });
        // Every word looks (and sounds) the same: reading is the whole test.
        text(g, word, 500, 232, fitSize(g, word, view, 130, 560), view, { color: "#FFB703" });
        text(g, String(16 - k), 870, 225, 60, view, { color: "#777777" });

        // The button.
        const pressed = pressedAt !== null && b >= pressedAt ? 1 : 0;
        ellipse(g, 500, 760, 300, 100, "#1C3A7F");
        rect(g, 200, 690, 600, 70, "#1C3A7F", { stroke: false });
        line(g, 200, 690, 200, 760);
        line(g, 800, 690, 800, 760);
        const glow = clamp(1 - (b % 1) * 3) * 0.3;
        ellipse(g, 500, 690 + pressed * 30, 300, 100, "#2B59C3");
        ellipse(g, 430, 660 + pressed * 30, 120, 26, `rgba(255,255,255,${0.25 + glow})`, { stroke: false });
        // Beat ticks around the button.
        for (let i = 0; i < 16; i++) {
          const a = Math.PI + (i / 15) * Math.PI;
          circle(g, 500 + Math.cos(a) * 400, 760 + Math.sin(a) * 160 - 60, 12, i < k ? "#555555" : i === k ? WHITE : "#333333", { stroke: false });
        }
        verdict.draw(g, b, view);
      },
    };
  },
};
