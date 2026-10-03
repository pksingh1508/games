// SWAT! A mosquito buzzes around. Tap when it lands and stays still.
// (Opposite Day: let it live.)
import { randRange } from "@/engine/rng";
import { at, backdrop, circle, clamp, easeOut, ellipse, lerp, line, progress, rect, WHITE } from "../render/draw";
import { defineMicrogame, pickTime, Verdict } from "./kit";

/** Wings stop this long after touching down: that's the "stays still" tell. */
const SETTLE = 0.12;

interface Stop {
  at: number;
  length: number;
  real: boolean;
  x: number;
  y: number;
}

export const swat = defineMicrogame({
  id: "swat",
  instruction: "SWAT!",
  hint: "Tap when the mosquito lands and its wings stop. Quick touch-downs don't count.",
  invertible: true,
  refrain: false,
  invertedRefrain: true,
  bg: "#FAEDCD",
  cue: "whine",
  caption: "eeeeee…",
  create(ctx) {
    const stay = lerp(1.4, 1.0, ctx.difficulty);
    const landAt = pickTime(ctx.rng, 3.0, 5.8, ctx, stay / 2);
    const spot = () => ({ x: randRange(ctx.rng, 220, 780), y: randRange(ctx.rng, 300, 720) });
    const stops: Stop[] = [{ at: landAt, length: stay, real: true, ...spot() }];
    // Touch-and-go fakes.
    const fakes = ctx.difficulty < 0.4 ? 1 : 2;
    for (let i = 0; i < fakes; i++) {
      for (let k = 0; k < 10; k++) {
        const t = randRange(ctx.rng, 1.2, 7.2);
        if (stops.every((s) => t + 0.25 < s.at - 0.5 || t > s.at + s.length + 0.5)) {
          stops.push({ at: t, length: 0.22, real: false, ...spot() });
          break;
        }
      }
    }
    stops.sort((a, b) => a.at - b.at);
    const start = { x: 500, y: 200 };

    /** Where the mosquito is, and whether it's sitting still. */
    const where = (t: number) => {
      let prev = { x: start.x, y: start.y, until: 0 };
      for (const s of stops) {
        if (t < s.at) {
          const u = progress(t, prev.until, s.at);
          const wob = Math.sin(t * 9) * 60 * Math.sin(u * Math.PI) + Math.sin(t * 23) * 12;
          return { x: lerp(prev.x, s.x, u) + wob, y: lerp(prev.y, s.y, u) + Math.cos(t * 7) * 50 * Math.sin(u * Math.PI), still: false, landed: false };
        }
        if (t <= s.at + s.length) return { x: s.x, y: s.y, still: s.real && t >= s.at + SETTLE, landed: true };
        prev = { x: s.x, y: s.y, until: s.at + s.length };
      }
      const u = t - prev.until;
      return { x: prev.x + Math.sin(t * 8) * 80 + u * 60, y: prev.y - u * 120, still: false, landed: false };
    };

    let swattedAt: number | null = null;
    let hitAt = { x: 0, y: 0 };
    const verdict = new Verdict();
    const tail = ctx.window * 0.35;

    return {
      update() {},
      tap(b) {
        if (swattedAt !== null) return;
        swattedAt = b;
        const p = where(b);
        hitAt = { x: p.x, y: p.y };
        ctx.emit("swat");
        const still = p.still || (b - tail >= 0 && where(b - tail).still);
        if (ctx.inverted) verdict.lose(b);
        else if (still) verdict.win(b);
        else verdict.lose(b);
      },
      outcome: (final) => verdict.outcome(final, ctx.inverted ? "win" : "lose"),
      plan: () => (ctx.inverted ? [] : [landAt + SETTLE + (stay - SETTLE) / 2]),
      cues: stops.map((s) => ({ beat: s.at + s.length, sound: "whine" as const })),
      draw(g, b, view) {
        backdrop(g, view, "#FAEDCD");
        for (let x = -400; x < 1500; x += 120) line(g, x, view.top, x, view.bottom, 3, "rgba(27,27,27,0.08)");
        for (let y = 0; y < 1100; y += 120) line(g, view.left, y, view.right, y, 3, "rgba(27,27,27,0.08)");
        rect(g, 640, 160, 220, 170, WHITE, { width: 12, color: "#C98A3F" });
        circle(g, 750, 245, 45, "#8FD3FF", { stroke: false });

        const swatted = swattedAt !== null && b >= swattedAt;
        const p = swatted ? { ...hitAt, still: true, landed: true } : where(b);
        const squashed = swatted && verdict.value === "win";
        if (squashed) {
          ellipse(g, p.x, p.y, 56, 18, "#1B1B1B", { stroke: false });
        } else {
          at(g, swatted ? p.x + (b - swattedAt!) * 400 : p.x, swatted ? p.y - (b - swattedAt!) * 500 : p.y, () => {
            // Wings blur while flying (or faking a landing); they fold when it truly sits still.
            const blur = !p.still;
            g.globalAlpha = blur ? 0.45 : 0.9;
            const flap = blur ? Math.abs(Math.sin(b * 70)) * 18 : 0;
            ellipse(g, -20, -26, 26, 10 + flap, WHITE, { width: 4, rotation: blur ? -0.6 : -0.2 });
            ellipse(g, 20, -26, 26, 10 + flap, WHITE, { width: 4, rotation: blur ? 0.6 : 0.2 });
            g.globalAlpha = 1;
            for (const s of [-1, 1]) {
              line(g, s * 6, 0, s * 34, 26, 4);
              line(g, s * 4, 6, s * 22, 38, 4);
            }
            ellipse(g, 0, 0, 12, 30, "#3D3D3D", { stroke: false });
            circle(g, 0, -30, 11, "#3D3D3D", { stroke: false });
            line(g, 0, -40, 0, -64, 3);
          }, { scale: 1.7 });
        }

        // The swatter.
        if (swatted) {
          const slam = easeOut(progress(b, swattedAt!, swattedAt! + 0.12));
          const lift = clamp((b - swattedAt! - 0.5) * 2);
          at(g, hitAt.x + 40, hitAt.y - 40 - (1 - slam) * 200 - lift * 300, () => {
            rect(g, -90, -90, 180, 180, "#2FBF71", { radius: 30 });
            for (let i = 1; i < 4; i++) {
              line(g, -90 + i * 45, -80, -90 + i * 45, 80, 4);
              line(g, -80, -90 + i * 45, 80, -90 + i * 45, 4);
            }
            rect(g, 70, 70, 150, 26, "#8A5A2B", { radius: 13 });
          }, { rotate: 0.6 });
        }
        verdict.draw(g, b, view);
      },
    };
  },
});
