// COUNT! Sheep jump over a fence. Tap exactly once per sheep.
import { randInt, randRange } from "@/engine/rng";
import { at, backdrop, circle, ellipse, face, floor, line, rect } from "../render/draw";
import { defineMicrogame, inDark, Verdict } from "./kit";

const FENCE_X = 500;
const GROUND = 800;
/** A sheep runs this many units per beat. */
const RUN = 300;
const HOP = 0.7;

interface Sheep {
  /** When it's over the fence. */
  at: number;
  /** Runs up, then thinks better of it (doesn't count). */
  balks: boolean;
}

export const count = defineMicrogame({
  id: "count",
  instruction: "COUNT!",
  hint: "Tap once for every sheep that jumps the fence. No more, no less.",
  invertible: false,
  refrain: false,
  bg: "#CDEBFA",
  cue: "baa",
  caption: "baa!",
  create(ctx) {
    const d = ctx.difficulty;
    const n = randInt(ctx.rng, d < 0.5 ? 2 : 3, d < 0.5 ? 4 : 5);
    const sheep: Sheep[] = [];
    let t = randRange(ctx.rng, 1.5, 2.2);
    for (let i = 0; i < n && t < 7.1; i++) {
      // Keep each jump out of the dark beats.
      for (let k = 0; k < 20 && inDark(ctx, t, 0.15); k++) t += 0.1;
      if (t >= 7.1) break;
      sheep.push({ at: t, balks: false });
      t += d < 0.5 ? randRange(ctx.rng, 0.8, 1.4) : randRange(ctx.rng, 0.6, 1.05);
    }
    // Later on, one sheep chickens out at the fence.
    if (d >= 0.45 && sheep.length >= 2) {
      const i = randInt(ctx.rng, 1, sheep.length - 1);
      sheep.splice(i, 0, { at: (sheep[i - 1]!.at + sheep[i]!.at) / 2, balks: true });
    }
    const jumpers = sheep.filter((s) => !s.balks);

    const taps: number[] = [];
    const verdict = new Verdict();

    return {
      update() {},
      tap(b) {
        if (verdict.decided) return;
        taps.push(b);
        ctx.emit("tap");
        if (taps.length > jumpers.length) verdict.lose(b);
      },
      outcome(final) {
        if (verdict.decided || !final) return verdict.value;
        return taps.length === jumpers.length ? "win" : "lose";
      },
      plan: () => jumpers.map((s) => s.at),
      cues: jumpers.map((s) => ({ beat: s.at - 0.25, sound: "baa" as const })),
      draw(g, b, view) {
        backdrop(g, view, "#CDEBFA");
        floor(g, view, GROUND, "#8BD17C");
        // The fence.
        for (const dx of [-60, 60]) rect(g, FENCE_X + dx - 14, GROUND - 190, 28, 200, "#C98A3F");
        rect(g, FENCE_X - 110, GROUND - 160, 220, 26, "#E0A65A");
        rect(g, FENCE_X - 110, GROUND - 90, 220, 26, "#E0A65A");

        for (const s of sheep) {
          const u = b - s.at;
          let x: number;
          let y = GROUND - 70;
          let flipX = 1;
          if (s.balks) {
            // Runs up to the fence, stops, runs back.
            x = u < -0.15 ? FENCE_X - 170 + (u + 0.15) * RUN : u < 0.35 ? FENCE_X - 170 : FENCE_X - 170 - (u - 0.35) * RUN;
            flipX = u >= 0.35 ? -1 : 1;
          } else {
            x = FENCE_X + u * RUN;
            if (Math.abs(u) < HOP / 2) y -= Math.cos((u / HOP) * Math.PI) * 230;
          }
          if (x < view.left - 150 || x > view.right + 150) continue;
          at(g, x, y, () => {
            for (const lx of [-34, -12, 14, 34]) line(g, lx, 30, lx + (Math.abs(u) < HOP / 2 ? 10 : 0), 70, 10);
            for (let i = 0; i < 7; i++) circle(g, -40 + (i % 4) * 26, -16 + Math.floor(i / 4) * 30, 34, "#FFFFFF", { width: 6 });
            ellipse(g, 0, 0, 70, 46, "#FFFFFF", { stroke: false });
            ellipse(g, 62, -20, 30, 36, "#3D3D3D");
            face(g, 66, -22, 0.4, s.balks && u > 0 && u < 0.6 ? "shock" : "happy");
          }, { scale: flipX, scaleY: 1 });
        }

        // Your tally, chalked on a board.
        rect(g, 70, 90, 300, 150, "#2E4A3A", { radius: 16 });
        taps.forEach((_, i) => {
          const group = Math.floor(i / 5);
          const k = i % 5;
          const bx = 110 + group * 120;
          if (k < 4) line(g, bx + k * 22, 125, bx + k * 22, 205, 9, "#FFFFFF");
          else line(g, bx - 12, 195, bx + 80, 135, 9, "#FFFFFF");
        });
        verdict.draw(g, b, view);
      },
    };
  },
});
