// Almost There's sound effects (Plan/08-almost-there.md §9): thuds, an "oof", crumbles, boings,
// Chirp's tweets. ZzFX parameter arrays, built once by the shared bank. The charge tone and the
// fall's whoosh change while they play, so they're synthesized live (live.ts).
import { createSfxBank, type PlayOptions, type ZzfxParams } from "@/engine/audio/sfx-bank";
import type { Surface } from "../core/sim";

export const SOUNDS = {
  jump: [0.4, 0.05, 220, 0.01, 0.03, 0.08, 0, 1.4, 9],
  land: [0.4, 0.1, 85, 0, 0.01, 0.08, 4, 1, -2, 0, 0, 0, 0, 0.6],
  thud: [1, 0.05, 60, 0, 0.04, 0.3, 4, 1, -3, 0, 0, 0, 0, 1.2],
  oof: [0.6, 0, 170, 0.01, 0.05, 0.12, 2, 1.6, -6, 0, 0, 0, 0, 0, 2],
  bonk: [0.6, 0, 190, 0, 0.02, 0.12, 1, 1, -10],
  bounce: [0.45, 0.05, 140, 0, 0.01, 0.09, 4, 1, 3, 0, 0, 0, 0, 0.4],
  boing: [0.7, 0, 160, 0.01, 0.12, 0.25, 0, 1, 12, 0, 0, 0, 0, 0, 8],
  stepRock: [0.22, 0.15, 110, 0, 0.01, 0.05, 4, 1, -3, 0, 0, 0, 0, 0.4],
  stepGrass: [0.18, 0.2, 300, 0, 0.005, 0.05, 4, 1, -2, 0, 0, 0, 0, 0.8],
  stepRoof: [0.24, 0.15, 420, 0, 0.005, 0.04, 4, 1, -5, 0, 0, 0, 0, 0.3],
  stepMetal: [0.2, 0.1, 900, 0, 0, 0.04, 1, 2, -20, 0, 0, 0, 0, 0.1],
  stepSnow: [0.25, 0.25, 600, 0, 0.02, 0.06, 4, 1, 0, 0, 0, 0, 0, 1.6],
  stepIce: [0.16, 0.1, 2200, 0, 0, 0.03, 0, 1, -10],
  stepCloud: [0.14, 0.2, 260, 0.01, 0.03, 0.08, 4, 1, 0, 0, 0, 0, 0, 2],
  creak: [0.4, 0.1, 120, 0.02, 0.1, 0.1, 2, 2, 2, 0, 0, 0, 0.03, 0.4, 0, 0.3],
  crumble: [0.7, 0.1, 90, 0, 0.08, 0.35, 4, 1, -3, 0, 0, 0, 0.05, 1.5, 0, 0.2],
  poof: [0.3, 0.1, 500, 0.02, 0.05, 0.15, 4, 1, -10, 0, 0, 0, 0, 2.5],
  back: [0.2, 0, 700, 0.01, 0.02, 0.06, 0, 1, 10],
  feather: [0.6, 0, 880, 0, 0.06, 0.4, 0, 1, 0, 0, 440, 0.06, 0.08],
  joke: [0.45, 0, 300, 0.02, 0.15, 0.25, 2, 1, -2, 0, -80, 0.12],
  ding: [0.5, 0, 1320, 0, 0.05, 0.6, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.6],
  descend: [0.4, 0, 300, 0.05, 0.6, 0.3, 1, 1, -2, 0, 0, 0, 0.06, 0.1],
  tick: [0.12, 0, 2400, 0, 0, 0.015, 1, 1],
  plant: [0.6, 0.05, 150, 0, 0.03, 0.15, 4, 1, -6, 0, 0, 0, 0, 0.8],
  checkpoint: [0.35, 0, 1100, 0, 0.03, 0.12, 0, 1, 0, 0, 550, 0.03],
  warp: [0.4, 0, 600, 0.02, 0.1, 0.2, 0, 1, -25, 0, 0, 0, 0, 0, 0, 0, 0, 0.7],
  rumble: [1, 0.2, 40, 0.2, 0.8, 0.8, 4, 1, -1, 0, 0, 0, 0.08, 2, 0, 0.3],
  collapse: [1, 0.1, 70, 0.02, 0.3, 0.9, 4, 1, -4, 0, 0, 0, 0.1, 2, 0, 0.2],
  tweet0: [0.25, 0, 2400, 0, 0.02, 0.04, 0, 1, 30],
  tweet1: [0.25, 0, 2900, 0, 0.015, 0.035, 0, 1, -30],
  tweet2: [0.25, 0, 2100, 0, 0.02, 0.05, 0, 1, 50],
} as const satisfies Record<string, ZzfxParams>;

export type SfxName = keyof typeof SOUNDS;
export const SFX_NAMES = Object.keys(SOUNDS) as SfxName[];

const bank = createSfxBank(SOUNDS);

/** Build every sound once (after a tap or key press: ZzFX makes an AudioContext when imported). */
export const loadSfx = bank.load;

export function playSfx(name: SfxName, options: PlayOptions = {}) {
  bank.play(name, options);
}

/** What a footstep sounds like, by zone and surface. */
export function stepSound(surface: Surface, zone: string): SfxName {
  switch (surface) {
    case "snow":
      return "stepSnow";
    case "ice":
      return "stepIce";
    case "gear":
      return "stepMetal";
    case "cloud":
      return "stepCloud";
    case "plank":
      return "stepRoof";
    default:
      return zone === "foothills" ? "stepGrass" : zone === "rooftops" ? "stepRoof" : "stepRock";
  }
}

/** Chirp's babble: a tweet for every few letters of what it says. */
export function babble(text: string, mood: "sincere" | "troll") {
  const syllables = Math.min(9, Math.max(2, Math.round(text.length / 7)));
  for (let i = 0; i < syllables; i++) {
    const name = `tweet${(i * 7 + text.length) % 3}` as SfxName;
    setTimeout(() => playSfx(name, { volume: 0.7, rate: mood === "troll" ? 1.15 : 1 - (i % 2) * 0.06 }), i * 95);
  }
}
