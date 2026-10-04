// DeskOS 98's sounds (Plan/12-cursor-escape.md §9): satisfying retro UI noises. Clicks, windows popping
// open and shrinking shut, the error "ding" of a crash, a chime for every notification (each sabotage
// has one), the hourglass's hum. ZzFX parameter arrays, built once by the shared bank.
import { createSfxBank, type PlayOptions, type ZzfxParams } from "@/engine/audio/sfx-bank";

export const SOUNDS = {
  click: [0.35, 0, 1900, 0, 0.004, 0.018, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.5],
  error: [0.6, 0, 660, 0.005, 0.07, 0.32, 0, 1, 0, 0, -165, 0.07],
  notify: [0.45, 0, 1047, 0.01, 0.06, 0.24, 0, 1.2, 0, 0, 262, 0.07],
  restored: [0.4, 0, 784, 0.01, 0.05, 0.2, 0, 1.2, 0, 0, -196, 0.06],
  open: [0.35, 0.05, 330, 0.01, 0.03, 0.1, 1, 1, 18],
  close: [0.45, 0.05, 700, 0.01, 0.04, 0.18, 1, 1, -14],
  escape: [0.6, 0, 523, 0.01, 0.12, 0.42, 0, 1, 0, 0, 262, 0.09, 0.12],
  freeze: [0.3, 0, 98, 0.03, 0.25, 0.2, 2, 1, 0, 0, 0, 0, 0.06],
  swap: [0.35, 0, 880, 0, 0.025, 0.05, 1, 1, 0, 0, -330, 0.025],
  hop: [0.3, 0, 620, 0, 0.02, 0.06, 1, 1.5, 24],
  grab: [0.3, 0, 180, 0, 0.02, 0.05, 4, 1, 4],
  drop: [0.3, 0, 140, 0, 0.02, 0.06, 4, 1, -4],
  check: [0.35, 0, 1500, 0, 0.008, 0.03, 1],
  wrong: [0.5, 0, 190, 0, 0.05, 0.16, 3, 1],
  scan: [0.3, 0, 1320, 0, 0.04, 0.08, 0, 1, 0, 0, 0, 0, 0.05],
  found: [0.45, 0, 988, 0.01, 0.05, 0.2, 0, 1, 0, 0, 494, 0.05],
} as const satisfies Record<string, ZzfxParams>;

export type SfxName = keyof typeof SOUNDS;
export const SFX_NAMES = Object.keys(SOUNDS) as SfxName[];

const bank = createSfxBank(SOUNDS);

/** Build every sound once (after a click or a key: audio may start). */
export const loadSfx = bank.load;

export function playSfx(name: SfxName, options: PlayOptions = {}) {
  bank.play(name, options);
}
