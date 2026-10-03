// SNAP! A group photo. Tap when everyone is smiling.
import { pick, randRange } from "@/engine/rng";
import { at, backdrop, circle, clamp, face, floor, line, rect, type Mood } from "../render/draw";
import { defineMicrogame, pickTime, Verdict } from "./kit";

const COLOURS = ["#2B59C3", "#FFB703", "#9B5DE5", "#2FBF71"];
const SKIN = ["#FFD8B5", "#C68B59", "#8D5524", "#F1C27D"];
const GLUM: Mood[] = ["sleep", "shock", "sad", "angry", "dizzy"];

interface Frown {
  from: number;
  to: number;
  mood: Mood;
}

export const snap = defineMicrogame({
  id: "snap",
  instruction: "SNAP!",
  hint: "Tap when everyone in the photo is smiling.",
  invertible: false,
  refrain: false,
  bg: "#C9E4DE",
  cue: "shutter",
  caption: "click!",
  create(ctx) {
    const people = ctx.difficulty < 0.5 ? 3 : 4;
    const half = Math.max(ctx.window * 1.3, 0.22);
    const moment = pickTime(ctx.rng, 3.4, 6.4, ctx, half + 0.1);
    const frowns: Frown[][] = Array.from({ length: people }, () => []);

    // Somebody is always not smiling, except during the one moment.
    const cover = (from: number, to: number) => {
      let cursor = from;
      let last = -1;
      while (cursor < to - 1e-6) {
        let end = Math.min(to, cursor + randRange(ctx.rng, 0.5, 1.15));
        if (to - end < 0.3) end = to;
        let who = Math.floor(ctx.rng() * people);
        if (who === last) who = (who + 1) % people;
        last = who;
        frowns[who]!.push({ from: Math.max(from, cursor - 0.06), to: end, mood: pick(ctx.rng, GLUM) });
        cursor = end;
      }
    };
    cover(0, moment - half);
    cover(moment + half, 8.5);

    const smiling = (p: number, t: number) => !frowns[p]!.some((f) => t >= f.from && t < f.to);
    const moodOf = (p: number, t: number): Mood => frowns[p]!.find((f) => t >= f.from && t < f.to)?.mood ?? "grin";

    let snappedAt: number | null = null;
    const verdict = new Verdict();

    return {
      update() {},
      tap(b) {
        if (snappedAt !== null) return;
        snappedAt = b;
        ctx.emit("shutter");
        const everyone = Array.from({ length: people }, (_, p) => smiling(p, b)).every(Boolean);
        if (everyone && Math.abs(b - moment) <= half + 1e-9) verdict.win(b);
        else verdict.lose(b);
      },
      outcome: (final) => verdict.outcome(final),
      plan: () => [moment],
      draw(g, b, view) {
        backdrop(g, view, "#C9E4DE");
        floor(g, view, 860, "#8FB8AE");
        const shown = snappedAt !== null && b >= snappedAt ? snappedAt : b;
        const spread = 560 / (people - 1);
        for (let p = 0; p < people; p++) {
          const x = 220 + p * spread;
          const hop = Math.abs(Math.sin((b + p * 0.3) * Math.PI)) * (view.reducedMotion || snappedAt !== null ? 0 : 6);
          at(g, x, 640 - hop, () => {
            rect(g, -70, 40, 140, 200, COLOURS[p % COLOURS.length]!, { radius: 50 });
            circle(g, 0, -20, 78, SKIN[p % SKIN.length]!);
            if (p % 2 === 0) rect(g, -70, -110, 140, 50, "#3D2C1E", { radius: 25 });
            else circle(g, 0, -86, 46, "#3D2C1E");
            face(g, 0, -10, 1.15, moodOf(p, shown));
          });
        }

        // The viewfinder.
        const corner = (x: number, y: number, dx: number, dy: number) => {
          line(g, x, y, x + dx * 90, y, 12);
          line(g, x, y, x, y + dy * 90, 12);
        };
        corner(90, 260, 1, 1);
        corner(910, 260, -1, 1);
        corner(90, 900, 1, -1);
        corner(910, 900, -1, -1);
        circle(g, 900, 200, 16, "#1B1B1B", { stroke: false });

        if (snappedAt !== null && b >= snappedAt) {
          const flash = clamp(1 - (b - snappedAt) * 3);
          if (flash > 0) {
            g.globalAlpha = view.reduceFlashing ? flash * 0.25 : flash * 0.9;
            g.fillStyle = "#FFFFFF";
            g.fillRect(view.left, view.top, view.right - view.left, view.bottom - view.top);
            g.globalAlpha = 1;
          }
        }
        verdict.draw(g, b, view);
      },
    };
  },
});
