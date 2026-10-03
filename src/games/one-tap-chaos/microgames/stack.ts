// STACK! A block slides back and forth above a tower. Tap to drop it onto the tower.
import { at, backdrop, clamp, easeIn, floor, lerp, line, pingPong, progress, rect } from "../render/draw";
import { defineMicrogame, firstCrossing, inDark, Verdict } from "./kit";

const LEFT = 230;
const RIGHT = 770;
const SLIDE_Y = 300;
const BLOCK_W = 220;
const BLOCK_H = 90;
const BASE_Y = 900;
const FALL = 0.3;
const COLOURS = ["#2B59C3", "#FFB703", "#2FBF71", "#9B5DE5", "#FF8C1A"];

export const stack = defineMicrogame({
  id: "stack",
  instruction: "STACK!",
  hint: "Tap to drop the sliding block right on top of the tower.",
  invertible: false,
  refrain: false,
  bg: "#FFD6A5",
  cue: "thunk",
  caption: "thunk!",
  create(ctx) {
    const period = lerp(2.4, 1.6, ctx.difficulty);
    const speed = (2 * (RIGHT - LEFT)) / period;
    const tol = Math.min(BLOCK_W / 2 - 10, Math.max(45, speed * ctx.window));
    const blocks = ctx.difficulty >= 0.55 ? 2 : 1;
    const phases = [ctx.rng() * period, ctx.rng() * period];
    const colour = Math.floor(ctx.rng() * COLOURS.length);

    /** Where block `i` is while sliding (it appears at `from`). */
    const slideX = (i: number, t: number, from: number) => lerp(LEFT, RIGHT, pingPong(t - from + phases[i]!, period));

    const drops: Array<{ at: number; x: number }> = [];
    const verdict = new Verdict();
    const towerTop = (n: number) => BASE_Y - 2 * BLOCK_H - n * BLOCK_H;
    const spawn = (i: number) => (i === 0 ? 0 : drops[i - 1]!.at + FALL + 0.2);

    const firstGood = (i: number, target: number, from: number, spawnAt: number) => {
      let best = from;
      for (let s = from; s < 7.6; ) {
        const t = firstCrossing((x) => slideX(i, x, spawnAt), target, s, 7.6, 0.01);
        if (t === null) break;
        best = t;
        if (!inDark(ctx, t, ctx.window)) break;
        s = t + 0.05;
      }
      return best;
    };

    return {
      update(b) {
        if (verdict.decided) return;
        const last = drops[drops.length - 1];
        if (!last || b < last.at + FALL) return;
        const i = drops.length - 1;
        const under = i === 0 ? 500 : drops[i - 1]!.x;
        if (Math.abs(last.x - under) > tol) {
          ctx.emit("thunk");
          verdict.lose(last.at + FALL);
        } else if (drops.length === blocks) {
          ctx.emit("thunk");
          verdict.win(last.at + FALL);
        }
      },
      tap(b) {
        if (verdict.decided || drops.length >= blocks) return;
        const i = drops.length;
        // The next block isn't out yet (still landing the last one).
        if (b < spawn(i)) return;
        drops.push({ at: b, x: slideX(i, b, spawn(i)) });
        ctx.emit("whoosh");
      },
      outcome: (final) => verdict.outcome(final),
      plan() {
        const first = firstGood(0, 500, 1.5, 0);
        if (blocks === 1) return [first];
        const x1 = slideX(0, first, 0);
        const spawnAt = first + FALL + 0.2;
        return [first, firstGood(1, x1, spawnAt + 0.3, spawnAt)];
      },
      draw(g, b, view) {
        backdrop(g, view, "#FFD6A5");
        floor(g, view, BASE_Y, "#C98A3F");
        // The tower so far.
        rect(g, 500 - BLOCK_W / 2 - 30, BASE_Y - BLOCK_H * 2, BLOCK_W + 60, BLOCK_H, "#8A5A2B");
        rect(g, 500 - BLOCK_W / 2, BASE_Y - BLOCK_H, BLOCK_W, BLOCK_H, "#A0703C");
        drops.forEach((d, i) => {
          if (b < d.at) return;
          const landed = b >= d.at + FALL;
          const under = i === 0 ? 500 : drops[i - 1]!.x;
          const toppled = landed && Math.abs(d.x - under) > tol;
          const y = landed ? towerTop(i) : lerp(SLIDE_Y, towerTop(i), easeIn(progress(b, d.at, d.at + FALL)));
          const tip = toppled ? clamp((b - d.at - FALL) * 3) : 0;
          at(g, d.x + Math.sign(d.x - under) * tip * 160, y + BLOCK_H / 2 + tip * 220, () => {
            rect(g, -BLOCK_W / 2, -BLOCK_H / 2, BLOCK_W, BLOCK_H, COLOURS[(colour + i) % COLOURS.length]!, { radius: 10 });
          }, { rotate: Math.sign(d.x - under) * tip * 1.4 });
        });
        // The sliding block, with a guide line down to the tower.
        const i = drops.length;
        if (i < blocks && !verdict.decided && b >= spawn(i)) {
          const x = slideX(i, b, spawn(i));
          g.setLineDash([16, 16]);
          line(g, x, SLIDE_Y + BLOCK_H / 2, x, towerTop(i) - 10, 5, "rgba(27,27,27,0.4)");
          g.setLineDash([]);
          rect(g, x - BLOCK_W / 2, SLIDE_Y - BLOCK_H / 2, BLOCK_W, BLOCK_H, COLOURS[(colour + i) % COLOURS.length]!, { radius: 10 });
          rect(g, 490, SLIDE_Y - 140, 20, 60, "#1B1B1B", { stroke: false });
        }
        verdict.draw(g, b, view);
      },
    };
  },
});
