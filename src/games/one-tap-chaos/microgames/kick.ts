// KICK! A penalty. The arrow shows where you'll shoot. Tap when the keeper dives the wrong way.
import { randRange } from "@/engine/rng";
import { at, backdrop, circle, clamp, easeOut, face, floor, lerp, line, poly, progress, rect, regular } from "../render/draw";
import { defineMicrogame, pickTime, Verdict } from "./kit";

type Side = -1 | 1;
interface Move {
  start: number;
  /** A feint is a lean; a dive is a commitment. */
  kind: "feint" | "dive";
  side: Side;
}

const GOAL_Y = 330;
const KEEPER_X = 500;
const GETUP = 0.5;
const FEINT = 0.45;

export const kick = defineMicrogame({
  id: "kick",
  instruction: "KICK!",
  hint: "The arrow shows where you'll shoot. Tap when the keeper dives the other way.",
  invertible: false,
  refrain: false,
  bg: "#9ED98A",
  cue: "whistle",
  caption: "tweet!",
  create(ctx) {
    const aim: Side = ctx.rng() < 0.5 ? -1 : 1;
    // How long the keeper stays committed in his dive.
    const committed = lerp(0.8, 0.5, ctx.difficulty);
    // He's down for the whole dive; the first tenth of a beat is the jump itself.
    const DIVE = 0.1 + committed;
    const good = pickTime(ctx.rng, 3.6, 6.3, ctx, committed / 2 + 0.1);
    const goodStart = good - 0.1 - committed / 2;
    const moves: Move[] = [];
    // Before the real chance: a dive the wrong way for you, and some feints.
    let t = 1.2;
    if (ctx.difficulty >= 0.25 && goodStart - (DIVE + GETUP) - 0.2 > t) {
      const trap = randRange(ctx.rng, t, goodStart - (DIVE + GETUP) - 0.2);
      if (trap - t > FEINT + 0.2 && ctx.rng() < 0.6) moves.push({ start: t + 0.1, kind: "feint", side: aim });
      moves.push({ start: trap, kind: "dive", side: aim });
      t = trap + DIVE + GETUP + 0.1;
    }
    while (t + FEINT + 0.1 < goodStart) {
      moves.push({ start: t, kind: "feint", side: (ctx.rng() < 0.5 ? -1 : 1) as Side });
      t += FEINT + randRange(ctx.rng, 0.2, 0.5);
    }
    moves.push({ start: goodStart, kind: "dive", side: (-aim) as Side });
    moves.push({ start: goodStart + DIVE + GETUP + 0.2, kind: "dive", side: aim });

    /** The keeper's sideways lean (-1…1), and whether he's committed. */
    const keeper = (time: number) => {
      for (const m of moves) {
        const u = time - m.start;
        if (m.kind === "feint" && u >= 0 && u < FEINT) return { lean: m.side * Math.sin((u / FEINT) * Math.PI) * 0.3, down: false, committed: false };
        if (m.kind === "dive" && u >= 0 && u < DIVE + GETUP) {
          if (u < DIVE) {
            const lean = m.side * easeOut(u / 0.25);
            return { lean, down: true, committed: u >= 0.1 && m.side !== aim };
          }
          return { lean: m.side * (1 - progress(u, DIVE, DIVE + GETUP)), down: false, committed: false };
        }
      }
      return { lean: 0, down: false, committed: false };
    };

    let kickedAt: number | null = null;
    let leanAtKick = 0;
    const verdict = new Verdict();

    return {
      update() {},
      tap(b) {
        if (kickedAt !== null) return;
        kickedAt = b;
        const state = keeper(b);
        leanAtKick = state.lean;
        ctx.emit("kick");
        if (state.committed) verdict.win(b + 0.3);
        else verdict.lose(b + 0.3);
      },
      outcome: (final) => verdict.outcome(final),
      plan: () => [good],
      draw(g, b, view) {
        backdrop(g, view, "#BDE7FF");
        floor(g, view, 560, "#9ED98A", false);
        for (let i = -4; i < 12; i++) rect(g, i * 140, 560, 70, view.bottom - 560, "rgba(255,255,255,0.12)", { stroke: false });
        // The goal.
        rect(g, 150, GOAL_Y - 10, 700, 240, "rgba(255,255,255,0.35)", { width: 6 });
        for (let i = 0; i < 14; i++) line(g, 150 + i * 50, GOAL_Y, 150 + i * 50, GOAL_Y + 230, 3, "rgba(27,27,27,0.25)");
        for (let i = 0; i < 5; i++) line(g, 150, GOAL_Y + i * 50, 850, GOAL_Y + i * 50, 3, "rgba(27,27,27,0.25)");
        rect(g, 140, GOAL_Y - 24, 720, 24, "#FFFFFF");
        rect(g, 140, GOAL_Y - 24, 24, 270, "#FFFFFF");
        rect(g, 836, GOAL_Y - 24, 24, 270, "#FFFFFF");

        // The keeper.
        const kicked = kickedAt !== null && b >= kickedAt;
        const state = kicked ? { lean: leanAtKick + (verdict.value === "lose" ? aim * 0.6 : 0) * clamp((b - kickedAt!) * 4), down: true } : keeper(b);
        const kx = KEEPER_X + state.lean * 260;
        at(g, kx, GOAL_Y + 150, () => {
          rect(g, -55, -60, 110, 130, "#FF8C1A", { radius: 30 });
          circle(g, -82, -70, 26, "#FFFFFF");
          circle(g, 82, -70, 26, "#FFFFFF");
          circle(g, 0, -100, 46, "#FFD8B5");
          face(g, 0, -96, 0.65, verdict.value === "win" ? "shock" : verdict.value === "lose" ? "smug" : "angry", state.lean > 0 ? 1 : -1);
        }, { rotate: state.lean * (state.down ? 1.1 : 0.5) });

        // The ball and your aim.
        const flight = kicked ? easeOut(progress(b, kickedAt!, kickedAt! + 0.3)) : 0;
        const ballX = lerp(500, 500 + aim * 270, flight);
        const ballY = lerp(840, GOAL_Y + 120, flight);
        circle(g, ballX, ballY, lerp(52, 30, flight), "#FFFFFF");
        regular(g, ballX, ballY, lerp(18, 10, flight), 5, "#1B1B1B", { stroke: false });
        if (!kicked) {
          const pulse = Math.abs(Math.sin(b * Math.PI)) * 10;
          at(g, 500 + aim * (130 + pulse), 790, () => poly(g, [-40, -26, 20, -26, 20, -50, 64, 0, 20, 50, 20, 26, -40, 26], "#FFB703"), {
            scale: aim,
            scaleY: 1,
          });
          circle(g, 500 + aim * 270, GOAL_Y + 120, 34, null, { width: 7, color: "#FFFFFF" });
        }
        verdict.draw(g, b, view);
      },
    };
  },
});
