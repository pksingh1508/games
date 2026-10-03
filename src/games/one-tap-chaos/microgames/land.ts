// LAND! A rocket falls toward a pad. Tap for thruster bursts and touch down softly.
import { at, backdrop, circle, clamp, ellipse, floor, lerp, poly, rect, text, WHITE } from "../render/draw";
import { defineMicrogame, Verdict } from "./kit";

const PAD_Y = 860;
const START_ALT = 600;
/** Units per beat², per beat. */
const GRAVITY = 230;
const BURST = 260;
/** The fastest safe touchdown. */
const SAFE = 260;
const HOVER_UNTIL = 0.5;
const STEP = 1 / 240;
/** Bursts can't push you up faster than this. */
const MAX_UP = -160;

interface Flight {
  t: number;
  alt: number;
  /** Downwards is positive. */
  v: number;
}

function stepTo(f: Flight, until: number) {
  while (f.t < until - 1e-9) {
    const dt = Math.min(STEP, until - f.t);
    if (f.t >= HOVER_UNTIL) {
      f.v += GRAVITY * dt;
      f.alt -= f.v * dt;
    }
    f.t += dt;
    if (f.alt <= 0) break;
  }
}

export const land = defineMicrogame({
  id: "land",
  instruction: "LAND!",
  hint: "Tap for thruster bursts. Touch down slowly, inside the green.",
  invertible: false,
  refrain: false,
  bg: "#1E1B4B",
  cue: "thrust",
  caption: "fwoosh…",
  create(ctx) {
    const v0 = lerp(0, 110, ctx.difficulty);
    const flight: Flight = { t: 0, alt: START_ALT, v: v0 };
    const verdict = new Verdict();
    let landedAt: number | null = null;
    let landedSpeed = 0;
    let lastBurst = -10;

    const burst = (f: Flight) => {
      f.v = Math.max(MAX_UP, f.v - BURST);
    };

    // The bot: a simple pilot, flown ahead of time on a copy of the same physics.
    const plan: number[] = [];
    {
      const sim: Flight = { t: 0, alt: START_ALT, v: v0 };
      let last = -10;
      for (let t = HOVER_UNTIL; t < 7.8 && sim.alt > 0; t += STEP) {
        stepTo(sim, t);
        if (sim.alt <= 0 || t - last < 0.35) continue;
        const tooFast = sim.v > 380;
        const finalBurn = sim.alt <= 110 && sim.v > SAFE - 60;
        if (tooFast || finalBurn) {
          plan.push(t);
          burst(sim);
          last = t;
        }
      }
    }

    return {
      update(b) {
        if (landedAt !== null || verdict.decided) return;
        stepTo(flight, b);
        if (flight.alt <= 0) {
          landedAt = flight.t;
          landedSpeed = flight.v;
          flight.alt = 0;
          if (landedSpeed <= SAFE) {
            ctx.emit("thunk");
            verdict.win(landedAt);
          } else {
            ctx.emit("crash");
            verdict.lose(landedAt);
          }
        } else if (flight.alt > 950) {
          verdict.lose(b);
        }
      },
      tap(b) {
        if (landedAt !== null || verdict.decided) return;
        stepTo(flight, b);
        if (flight.alt <= 0) return;
        burst(flight);
        lastBurst = b;
        ctx.emit("thrust");
      },
      outcome: (final) => verdict.outcome(final),
      plan: () => plan,
      draw(g, b, view) {
        backdrop(g, view, "#1E1B4B");
        for (let i = 0; i < 40; i++) {
          const x = ((i * 397) % 1600) - 300;
          const y = (i * 211) % 800;
          circle(g, x, y, (i % 3) + 2, WHITE, { stroke: false });
        }
        floor(g, view, PAD_Y + 30, "#8E8AA8");
        for (const [x, r] of [
          [180, 50],
          [820, 70],
          [-80, 40],
        ] as const) ellipse(g, x, PAD_Y + 70, r, r * 0.3, "#6F6A8C", { width: 5 });
        // The pad, with blinking landing lights.
        rect(g, 380, PAD_Y, 240, 30, "#FFB703");
        const blink = Math.floor(b * 2) % 2 === 0;
        circle(g, 395, PAD_Y - 6, 10, blink ? "#2FBF71" : "#3D3D3D", { width: 5 });
        circle(g, 605, PAD_Y - 6, 10, blink ? "#3D3D3D" : "#2FBF71", { width: 5 });

        // The rocket.
        const alt = landedAt !== null ? 0 : flight.alt;
        const crashed = verdict.value === "lose" && landedAt !== null;
        const y = PAD_Y - alt;
        const flame = clamp(1 - (b - lastBurst) * 3.5);
        at(g, 500, y, () => {
          if (crashed) {
            for (let i = 0; i < 7; i++) {
              const a = (i / 7) * Math.PI * 2;
              circle(g, Math.cos(a) * 70, -50 + Math.sin(a) * 50, 34, i % 2 ? "#FF8C1A" : "#FFB703");
            }
            return;
          }
          if (flame > 0) poly(g, [-30, 0, 30, 0, 0, 60 + flame * 120], "#FF8C1A");
          poly(g, [-80, -10, -40, -70, -40, -10], "#2B59C3");
          poly(g, [80, -10, 40, -70, 40, -10], "#2B59C3");
          rect(g, -46, -200, 92, 196, WHITE, { radius: 20 });
          poly(g, [-46, -190, 0, -270, 46, -190], "#2B59C3");
          circle(g, 0, -130, 24, "#8FD3FF", { width: 7 });
        });

        // Speed gauge: green means a safe landing speed.
        const speed = landedAt !== null ? landedSpeed : flight.v;
        rect(g, 880, 300, 50, 420, "#2E2A5C", { color: WHITE, width: 6 });
        const safeH = (SAFE / 600) * 420;
        rect(g, 883, 720 - safeH, 44, safeH - 3, "#2FBF71", { stroke: false });
        const marker = 720 - clamp(speed / 600) * 420;
        poly(g, [870, marker, 840, marker - 18, 840, marker + 18], WHITE);
        text(g, "SPEED", 905, 270, 30, view, { color: WHITE });
        verdict.draw(g, b, view);
      },
    };
  },
});
