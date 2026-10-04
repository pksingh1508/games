// Glitch Run's sounds (Plan/07-glitch-run.md §9): chiptune blips for the moves and the pickups, a
// crackle before every glitch, a zap when The Debugger fires, a crunch when you're patched. And the
// cues: one sound per move, played exactly a beat before you need to make it, so you can run on
// sound alone. ZzFX parameter arrays, built once by the shared bank.
import { createSfxBank, type PlayOptions, type ZzfxParams } from "@/engine/audio/sfx-bank";
import type { Cue } from "../core/reference";

export const SOUNDS = {
  jump: [0.35, 0.05, 330, 0, 0.02, 0.08, 1, 1.4, 10],
  land: [0.3, 0.1, 90, 0, 0.01, 0.06, 4, 1, -3, 0, 0, 0, 0, 0.5],
  slide: [0.3, 0.2, 260, 0, 0.04, 0.1, 4, 1, -8, 0, 0, 0, 0, 0.6],
  clip: [0.5, 0, 900, 0, 0.05, 0.2, 2, 2, -40, 0, 0, 0, 0.02, 0.8, 0, 0.3],
  noCharge: [0.3, 0, 140, 0, 0.02, 0.05, 2, 1, 0, 0, -40, 0.02],
  bit: [0.25, 0, 1200, 0, 0.01, 0.05, 1, 1.5, 0, 0, 400, 0.02],
  charge: [0.45, 0, 600, 0, 0.06, 0.18, 1, 1, 0, 0, 600, 0.04, 0.06],
  patch: [0.45, 0, 520, 0, 0.08, 0.2, 0, 1, 0, 0, 260, 0.06],
  nearMiss: [0.25, 0.1, 1600, 0, 0.01, 0.04, 3, 1, 20],
  phased: [0.35, 0, 700, 0, 0.04, 0.12, 2, 1, 30, 0, 0, 0, 0, 0.4],
  patched: [0.7, 0, 200, 0, 0.08, 0.35, 3, 1, -15, 0, 0, 0, 0.04, 1, 0, 0.5],
  exit: [0.6, 0, 523, 0, 0.12, 0.4, 1, 1, 0, 0, 262, 0.08, 0.15],
  crackle: [0.4, 0.4, 2400, 0, 0.12, 0.08, 4, 2, 0, 0, 0, 0, 0.03, 1.4, 0, 0.6],
  panic: [0.6, 0, 440, 0, 0.3, 0.2, 1, 1, 0, 0, -220, 0.15, 0.15],
  panicSurvived: [0.6, 0, 660, 0, 0.15, 0.4, 1, 1, 0, 0, 330, 0.08, 0.16],
  scan: [0.45, 0, 1800, 0.05, 0.12, 0.1, 2, 1, -60, 0, 0, 0, 0, 0.2],
  cueJump: [0.4, 0, 523, 0, 0.03, 0.07, 0, 1.6, 22],
  cueHop: [0.35, 0, 784, 0, 0.01, 0.04, 0, 1.6, 10],
  cueSlide: [0.4, 0, 392, 0, 0.03, 0.08, 0, 1.6, -22],
  cueClip: [0.4, 0, 1047, 0, 0.03, 0.08, 2, 1, -10, 0, 0, 0, 0.02],
  tick: [0.2, 0, 2000, 0, 0, 0.015, 0, 1],
} as const satisfies Record<string, ZzfxParams>;

export type SfxName = keyof typeof SOUNDS;
export const SFX_NAMES = Object.keys(SOUNDS) as SfxName[];

const bank = createSfxBank(SOUNDS);

/** Build every sound once (after a tap or key press). */
export const loadSfx = bank.load;

export function playSfx(name: SfxName, options: PlayOptions = {}) {
  bank.play(name, options);
}

/** The cue sound for a move. */
export const CUE_SOUND: Record<Cue["move"], SfxName> = { jump: "cueJump", hop: "cueHop", slide: "cueSlide", clip: "cueClip" };
