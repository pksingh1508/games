// FREEZE! You're sneaking up behind a guard. Tap to freeze whenever he turns around.
import { randRange } from "@/engine/rng";
import { at, backdrop, circle, face, floor, line, rect, text, WHITE } from "../render/draw";
import { defineMicrogame, inDark, Verdict } from "./kit";

/** A tap holds you still this long; tapping again while frozen starts it over. */
const FREEZE = 1.5;
const WARN = 0.35;
const SNEAK = 60;

interface Look {
  /** The head-jerk warning; he faces you from `at + WARN`. */
  at: number;
  facing: number;
}

export const freeze = defineMicrogame({
  id: "freeze",
  instruction: "FREEZE!",
  hint: "Tap to freeze whenever the guard turns around. Each tap holds you still for a moment.",
  invertible: false,
  refrain: false,
  bg: "#E9EDC9",
  cue: "tiptoe",
  caption: "tiptoe…",
  create(ctx) {
    const count = ctx.difficulty < 0.5 ? 2 : 3;
    const looks: Look[] = [];
    let t = randRange(ctx.rng, 1.9, 2.8);
    for (let i = 0; i < count; i++) {
      for (let k = 0; k < 20 && inDark(ctx, t, 0.2); k++) t += 0.1;
      const facing = randRange(ctx.rng, 0.6, 0.9);
      if (t + WARN + facing > 7.8) break;
      looks.push({ at: t, facing });
      t += WARN + facing + randRange(ctx.rng, 0.7, 1.3);
    }

    const taps: number[] = [];
    const verdict = new Verdict();
    let checkedTo = 0;

    const frozen = (time: number) => taps.some((p) => time >= p && time <= p + FREEZE);
    const watching = (time: number) => looks.some((l) => time >= l.at + WARN && time <= l.at + WARN + l.facing);

    return {
      update(b) {
        if (verdict.decided) return;
        // Taps can arrive a frame late, so only judge moments a little in the past.
        const until = b - 0.12;
        for (let time = checkedTo; time <= until; time += 0.02) {
          if (watching(time) && !frozen(time)) {
            ctx.emit("alert");
            verdict.lose(time);
            return;
          }
          checkedTo = time;
        }
        const last = looks[looks.length - 1];
        if (last && b > last.at + WARN + last.facing + 0.15) verdict.win(last.at + WARN + last.facing);
      },
      tap(b) {
        if (verdict.decided) return;
        taps.push(b);
        ctx.emit("tap");
      },
      outcome: (final) => verdict.outcome(final),
      plan: () => looks.map((l) => l.at + WARN - 0.25),
      cues: looks.map((l) => ({ beat: l.at, sound: "alert" as const })),
      draw(g, b, view) {
        backdrop(g, view, "#E9EDC9");
        floor(g, view, 820, "#B5A886");
        // Paintings on the wall.
        rect(g, 120, 200, 200, 150, "#FFFFFF", { width: 14, color: "#C98A3F" });
        circle(g, 220, 275, 40, "#FFB703", { stroke: false });
        rect(g, 420, 170, 160, 210, "#FFFFFF", { width: 14, color: "#C98A3F" });
        vase(g);

        // You, sneaking (or stuck in a pose).
        let moved = 0;
        for (let time = 0; time < b; time += 0.05) if (!frozen(time)) moved += SNEAK * 0.05;
        const x = Math.min(640, 140 + moved);
        const still = frozen(b);
        const caught = verdict.value === "lose" && b >= verdict.at;
        at(g, x, 820, () => {
          const step = still || caught ? 0 : Math.sin(b * Math.PI * 4) * 12;
          line(g, -14, -40, -20 + step, 0, 12);
          line(g, 14, -40, 20 - step, 0, 12);
          rect(g, -40, -150, 80, 120, "#3D3D3D", { radius: 30 });
          circle(g, 0, -180, 42, "#FFD8B5");
          rect(g, -44, -196, 88, 24, "#1B1B1B", { radius: 10, stroke: false });
          face(g, 0, -172, 0.55, caught ? "shock" : still ? "smug" : "happy");
          if (still) {
            // Statue pose: arms out.
            line(g, -40, -120, -90, -150, 12);
            line(g, 40, -120, 90, -160, 12);
          }
        });

        // The guard.
        const look = looks.find((l) => b >= l.at && b <= l.at + WARN + l.facing);
        const turning = look && b < look.at + WARN;
        const facingYou = (look && !turning) || caught;
        at(g, 820, 820, () => {
          line(g, -20, -60, -24, 0, 16);
          line(g, 20, -60, 24, 0, 16);
          rect(g, -70, -260, 140, 210, "#2B59C3", { radius: 40 });
          circle(g, 0, -300, 56, "#FFD8B5");
          rect(g, -64, -364, 128, 40, "#1B1B1B", { radius: 12 });
          rect(g, -70, -334, facingYou ? 140 : 80, 14, "#1B1B1B", { stroke: false });
          if (facingYou) face(g, 0, -296, 0.8, caught ? "angry" : "smug");
        }, { scale: facingYou ? -1 : 1, scaleY: 1 });
        if (turning || facingYou) text(g, caught ? "HEY!" : "!", 820, 380, caught ? 90 : 110, view, { color: WHITE, outline: 12 });
        verdict.draw(g, b, view);
      },
    };
  },
});

/** A tall vase in the middle painting. */
function vase(g: CanvasRenderingContext2D) {
  rect(g, 470, 220, 60, 120, "#9B5DE5", { radius: 30, width: 6 });
}
