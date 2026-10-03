// DODGE! Your car speeds up a two-lane road and obstacles come at you. Tap to switch lanes.
import { randInt, randRange } from "@/engine/rng";
import { at, backdrop, circle, poly, rect, smooth } from "../render/draw";
import { defineMicrogame, inDark, Verdict } from "./kit";

const LANES = [380, 620] as const;
const CAR_Y = 780;
/** Road speed, units per beat. */
const SPEED = 520;
/** Time to slide into the other lane. */
const SLIDE = 0.3;
/** Half the time a cone overlaps the car. */
const OVERLAP = 0.24;

export const dodge = defineMicrogame({
  id: "dodge",
  instruction: "DODGE!",
  hint: "Tap to switch lanes before you hit the cone.",
  invertible: false,
  refrain: false,
  bg: "#7ED3B2",
  cue: "honk",
  caption: "honk!",
  create(ctx) {
    const n = ctx.difficulty < 0.5 ? 2 : 3;
    const cones: Array<{ at: number; lane: 0 | 1 }> = [];
    let t = randRange(ctx.rng, 2.6, 3.4);
    let lane: 0 | 1 = 0;
    for (let i = 0; i < n && t < 7.4; i++) {
      for (let k = 0; k < 20 && inDark(ctx, t - OVERLAP - 0.3, 0.1); k++) t += 0.1;
      if (t >= 7.4) break;
      // The first cone is always in your lane.
      if (i > 0) lane = randInt(ctx.rng, 0, 1) as 0 | 1;
      cones.push({ at: t, lane });
      t += randRange(ctx.rng, 1.2, 1.7);
    }

    const switches: number[] = [];
    const verdict = new Verdict();
    let checked = 0;

    /** Which lane the car is in (and how far through a slide) at time t. */
    const xAt = (time: number) => {
      let x: number = LANES[0];
      let current = 0;
      for (const s of switches) {
        if (s > time) break;
        const from = LANES[current as 0 | 1];
        current = 1 - current;
        const to = LANES[current as 0 | 1];
        x = from + (to - from) * smooth((time - s) / SLIDE);
      }
      return x;
    };
    const hits = (cone: { at: number; lane: 0 | 1 }) => {
      for (let time = cone.at - OVERLAP; time <= cone.at + OVERLAP; time += 0.02) {
        if (Math.abs(xAt(time) - LANES[cone.lane]) < 110) return time;
      }
      return null;
    };

    return {
      update(b) {
        if (verdict.decided) return;
        while (checked < cones.length && b >= cones[checked]!.at + OVERLAP + 0.1) {
          const hit = hits(cones[checked]!);
          if (hit !== null) {
            ctx.emit("crash");
            verdict.lose(hit);
            return;
          }
          checked++;
        }
        if (checked === cones.length) verdict.win(cones[cones.length - 1]!.at + OVERLAP);
      },
      tap(b) {
        if (verdict.value === "lose") return;
        // A new switch can't start mid-slide.
        const last = switches[switches.length - 1];
        if (last !== undefined && b < last + SLIDE) return;
        switches.push(b);
        ctx.emit("whoosh");
      },
      outcome: (final) => verdict.outcome(final),
      plan() {
        const plan: number[] = [];
        let current = 0;
        let free = 1.6;
        for (const cone of cones) {
          if (cone.lane === current) {
            const latest = cone.at - OVERLAP - 0.35;
            const tap = Math.max(free, latest - 0.3);
            plan.push(Math.min(tap, latest));
            current = 1 - current;
          }
          free = cone.at + OVERLAP + 0.15;
        }
        return plan;
      },
      draw(g, b, view) {
        backdrop(g, view, "#7ED3B2");
        rect(g, 230, view.top - 20, 540, view.bottom - view.top + 40, "#4A4E57");
        // Lane dashes and roadside stripes scroll down.
        const scroll = (b * SPEED) % 160;
        for (let y = view.top - 160; y < view.bottom + 160; y += 160) {
          rect(g, 492, y + scroll, 16, 80, "#FFFFFF", { stroke: false });
          rect(g, 236, y + scroll, 14, 80, "#FFFFFF", { stroke: false });
          rect(g, 750, y + scroll, 14, 80, "#FFFFFF", { stroke: false });
        }

        for (const cone of cones) {
          const y = CAR_Y - (cone.at - b) * SPEED;
          if (y < view.top - 120 || y > view.bottom + 120) continue;
          at(g, LANES[cone.lane], y, () => {
            rect(g, -62, 40, 124, 22, "#1B1B1B", { radius: 6 });
            poly(g, [-50, 44, 50, 44, 18, -60, -18, -60], "#FF8C1A");
            rect(g, -36, -6, 72, 18, "#FFFFFF", { stroke: false });
          });
        }

        // The car (top view).
        const crashed = verdict.value === "lose" && b >= verdict.at;
        const x = xAt(crashed ? verdict.at : b);
        at(g, x, CAR_Y, () => {
          rect(g, -55, -80, 110, 160, "#FFB703", { radius: 30 });
          rect(g, -40, -50, 80, 44, "#BDE0FE", { radius: 10 });
          rect(g, -40, 26, 80, 30, "#BDE0FE", { radius: 10 });
          for (const [wx, wy] of [
            [-62, -46],
            [62, -46],
            [-62, 46],
            [62, 46],
          ] as const) rect(g, wx - 9, wy - 20, 18, 40, "#1B1B1B", { radius: 6, stroke: false });
          if (crashed) {
            for (let i = 0; i < 5; i++) circle(g, -30 + i * 15, -100 - (i % 2) * 20, 22, "#FFFFFF", { width: 5 });
          }
        }, { rotate: crashed ? 0.5 : (x - xAt(b - 0.08)) / 600 });
        verdict.draw(g, b, view);
      },
    };
  },
});
