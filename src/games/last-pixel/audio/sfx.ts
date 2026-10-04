// Last Pixel's sounds (Plan/10-last-pixel.md §9): Pix's "!" when it wakes, its giggles and chirps when it
// gets away, a defeated "aww" when it's caught; decoys popping, the net's swoop, bait's sparkle, a freeze,
// the detector's beep, the snow shovel's thud, and the 100% fanfare. ZzFX parameter arrays, built once.
import { createSfxBank, type PlayOptions, type ZzfxParams } from "@/engine/audio/sfx-bank";

export const SOUNDS = {
  click: [0.35, 0, 1900, 0, 0.004, 0.018, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.5],
  wake: [0.7, 0, 1320, 0.005, 0.05, 0.22, 0, 1.4, 0, 0, 660, 0.04, 0, 0, 0, 0, 0, 0.8],
  giggle: [0.4, 0.05, 880, 0.01, 0.03, 0.06, 0, 1.6, 0, 0, 220, 0.03, 0.06, 0, 0, 0, 0, 0.6],
  aww: [0.55, 0, 740, 0.02, 0.12, 0.35, 0, 1.2, -6, 0, 0, 0, 0, 0, 0, 0, 0, 0.7],
  pop: [0.45, 0.1, 520, 0, 0.01, 0.06, 1, 2, -40],
  miss: [0.25, 0.1, 300, 0.01, 0.02, 0.08, 4, 1, 0, 0, 0, 0, 0, 0.3],
  dodge: [0.3, 0, 1600, 0, 0.01, 0.05, 1, 1, 60],
  swoop: [0.35, 0.05, 240, 0.02, 0.06, 0.14, 4, 1, 12, 0, 0, 0, 0, 0.6],
  netted: [0.6, 0, 660, 0.01, 0.08, 0.3, 0, 1.2, 0, 0, 330, 0.06, 0, 0, 0, 0, 0, 0.7],
  thud: [0.45, 0.05, 110, 0, 0.03, 0.12, 4, 1, -2],
  bait: [0.4, 0, 1760, 0.01, 0.06, 0.25, 0, 2, 0, 0, 440, 0.05, 0.05],
  freeze: [0.45, 0, 1400, 0.02, 0.2, 0.4, 0, 1, 0, 0, -350, 0.08, 0.04, 0.2],
  exposed: [0.55, 0, 990, 0.005, 0.04, 0.16, 0, 1.6, 0, 0, 495, 0.03],
  fine: [0.4, 0, 330, 0.03, 0.15, 0.4, 0, 1, -2, 0, 0, 0, 0, 0, 0, 0, 0, 0.6],
  unpaint: [0.2, 0.2, 200, 0, 0.02, 0.05, 4, 1, -8],
  dump: [0.4, 0.1, 90, 0, 0.04, 0.18, 4, 1, -1],
  pile: [0.35, 0.1, 140, 0, 0.03, 0.12, 4, 1, -3],
  done: [0.7, 0, 523, 0.01, 0.2, 0.6, 0, 1, 0, 0, 262, 0.1, 0.12, 0, 0, 0, 0, 0.8],
  star: [0.45, 0, 1568, 0, 0.04, 0.3, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.7],
  beep: [0.18, 0, 1200, 0, 0.012, 0.03, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.5],
  squeak: [0.12, 0.2, 2400, 0, 0.02, 0.04, 0, 1, 30],
  dive: [0.4, 0, 600, 0.01, 0.1, 0.3, 0, 1, -20, 0, 0, 0, 0, 0.1],
} as const satisfies Record<string, ZzfxParams>;

export type SfxName = keyof typeof SOUNDS;
export const SFX_NAMES = Object.keys(SOUNDS) as SfxName[];

const bank = createSfxBank(SOUNDS);

/** Build every sound once (after a tap or a key: audio may start). */
export const loadSfx = bank.load;

export function playSfx(name: SfxName, options: PlayOptions = {}) {
  bank.play(name, options);
}
