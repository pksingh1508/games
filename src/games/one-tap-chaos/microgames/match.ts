// MATCH! A shape keeps changing. Tap when it's the same shape as the one in the frame.
// Colour is a distraction: only the shape counts.
import { pick } from "@/engine/rng";
import { at, backdrop, circle, rect, regular, star, text, WHITE } from "../render/draw";
import { defineMicrogame, inDark, Verdict } from "./kit";

type Shape = "circle" | "triangle" | "square" | "star" | "diamond" | "hexagon" | "flipped" | "star6" | "pentagon" | "octagon";

const TARGETS: Shape[] = ["circle", "triangle", "square", "star", "diamond", "hexagon"];
/** Shapes that look a lot like each target. */
const LOOKALIKES: Record<string, Shape[]> = {
  circle: ["octagon"],
  triangle: ["flipped"],
  square: ["diamond"],
  star: ["star6"],
  diamond: ["square"],
  hexagon: ["pentagon", "octagon"],
};
const ALL: Shape[] = ["circle", "triangle", "square", "star", "diamond", "hexagon", "flipped", "star6", "pentagon", "octagon"];
const COLOURS = ["#2B59C3", "#FFB703", "#2FBF71", "#9B5DE5", "#FF8C1A", "#1B1B1B"];

export function drawShape(g: CanvasRenderingContext2D, shape: Shape, x: number, y: number, r: number, fill: string) {
  const o = { width: Math.max(6, r * 0.07) };
  switch (shape) {
    case "circle":
      return circle(g, x, y, r, fill, o);
    case "triangle":
      return regular(g, x, y + r * 0.15, r * 1.1, 3, fill, o);
    case "flipped":
      return regular(g, x, y - r * 0.15, r * 1.1, 3, fill, { ...o, rotation: Math.PI });
    case "square":
      return rect(g, x - r * 0.82, y - r * 0.82, r * 1.64, r * 1.64, fill, o);
    case "diamond":
      return regular(g, x, y, r * 1.05, 4, fill, o);
    case "star":
      return star(g, x, y, r * 1.1, r * 0.48, 5, fill, o);
    case "star6":
      return star(g, x, y, r * 1.1, r * 0.55, 6, fill, o);
    case "hexagon":
      return regular(g, x, y, r, 6, fill, { ...o, rotation: Math.PI / 6 });
    case "pentagon":
      return regular(g, x, y, r, 5, fill, o);
    case "octagon":
      return regular(g, x, y, r, 8, fill, { ...o, rotation: Math.PI / 8 });
  }
}

export const match = defineMicrogame({
  id: "match",
  instruction: "MATCH!",
  hint: "Tap when the big shape is the same shape as the one in the frame. Colour doesn't matter.",
  invertible: false,
  refrain: false,
  bg: "#BDE0FE",
  cue: "chime",
  caption: "chime!",
  create(ctx) {
    const target = pick(ctx.rng, TARGETS);
    const targetColour = pick(ctx.rng, COLOURS);
    const step = ctx.difficulty < 0.6 ? 1 : 0.5;
    const start = 1;
    const slots = Math.floor((8 - start) / step);
    // The target turns up once (twice early in a run), never in the first beat, never in the dark.
    const candidates: number[] = [];
    for (let k = 0; k < slots; k++) {
      const s = start + k * step;
      if (s >= 2 && s + step <= 6.8 && !inDark(ctx, s + step / 2, step / 2)) candidates.push(k);
    }
    const hits = new Set<number>([candidates.length ? pick(ctx.rng, candidates) : Math.min(slots - 1, Math.ceil(1 / step))]);
    if (ctx.difficulty < 0.4) {
      const later = candidates.filter((k) => k > Math.max(...hits) + 1);
      if (later.length) hits.add(pick(ctx.rng, later));
    }

    const lookalikes = LOOKALIKES[target] ?? [];
    const others = ALL.filter((s) => s !== target);
    const sequence: Array<{ shape: Shape; colour: string }> = [];
    for (let k = 0; k < slots; k++) {
      if (hits.has(k)) {
        sequence.push({ shape: target, colour: pick(ctx.rng, COLOURS.filter((c) => c !== targetColour)) });
        continue;
      }
      let shape: Shape;
      do {
        shape = ctx.difficulty >= 0.4 && lookalikes.length && ctx.rng() < 0.45 ? pick(ctx.rng, lookalikes) : pick(ctx.rng, others);
      } while (sequence.length && sequence[sequence.length - 1]!.shape === shape);
      // Lookalikes later on even wear the target's colour.
      const colour = ctx.difficulty >= 0.5 && lookalikes.includes(shape) ? targetColour : pick(ctx.rng, COLOURS);
      sequence.push({ shape, colour });
    }
    const slotAt = (t: number) => (t < start ? -1 : Math.min(slots - 1, Math.floor((t - start) / step)));
    const tail = ctx.window * 0.35;
    const first = Math.min(...hits);

    let tappedAt: number | null = null;
    const verdict = new Verdict();

    return {
      update() {},
      tap(t) {
        if (tappedAt !== null) return;
        tappedAt = t;
        const ok = hits.has(slotAt(t)) || (t - tail >= start && hits.has(slotAt(t - tail)));
        if (ok) {
          ctx.emit("chime");
          verdict.win(t);
        } else {
          ctx.emit("thunk");
          verdict.lose(t);
        }
      },
      outcome: (final) => verdict.outcome(final),
      plan: () => [start + first * step + step / 2],
      draw(g, t, view) {
        backdrop(g, view, "#BDE0FE");
        // The frame with the target.
        rect(g, 60, 70, 260, 260, WHITE, { radius: 30 });
        drawShape(g, target, 190, 210, 80, targetColour);
        text(g, "SHAPE", 190, 108, 34, view, { color: "#1B1B1B" });
        // The changing shape.
        const k = slotAt(tappedAt !== null && t >= tappedAt ? tappedAt : t);
        circle(g, 560, 600, 300, "rgba(255,255,255,0.5)", { stroke: false });
        if (k >= 0) {
          const { shape, colour } = sequence[k]!;
          const pop = view.reducedMotion ? 1 : 1 + Math.max(0, 0.12 - ((t - start) % step) * 0.5);
          at(g, 560, 600, () => drawShape(g, shape, 0, 0, 200, colour), { scale: pop });
        } else {
          text(g, "?", 560, 600, 200, view, { color: "rgba(27,27,27,0.3)" });
        }
        verdict.draw(g, t, view);
      },
    };
  },
});

