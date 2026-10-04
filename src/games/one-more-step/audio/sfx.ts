// One More Step's other sounds (Plan/01-one-more-step.md §9): Doory's tiny squeaky footsteps when it runs,
// crumbling floors, spikes, plates and gates, a stone sentinel's thud, a door slamming, the finale's reset.
// ZzFX parameter arrays, built once by the shared bank.
import { createSfxBank, type PlayOptions, type ZzfxParams } from "@/engine/audio/sfx-bank";

export const SOUNDS = {
  click: [0.35, 0, 1900, 0, 0.004, 0.018, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.5],
  squeak: [0.35, 0.1, 1700, 0, 0.01, 0.04, 1, 1.5, 40],
  sweat: [0.25, 0, 1200, 0, 0.01, 0.08, 0, 1, -20],
  crumble: [0.35, 0.2, 180, 0, 0.03, 0.15, 4, 1, -2, 0, 0, 0, 0, 0.6],
  spikes: [0.2, 0, 2400, 0, 0.01, 0.05, 1, 1, 0, 0, 0, 0, 0, 0.2],
  plate: [0.3, 0, 520, 0, 0.01, 0.05, 1, 1],
  gate: [0.35, 0.05, 150, 0, 0.04, 0.12, 4, 1, 0, 0, 0, 0, 0, 0.4],
  push: [0.2, 0.1, 400, 0.01, 0.03, 0.08, 4, 1, 6],
  thud: [0.45, 0.05, 90, 0, 0.03, 0.14, 4, 1, -1],
  reveal: [0.45, 0, 880, 0.01, 0.06, 0.3, 0, 1.2, 0, 0, 440, 0.06],
  slam: [0.6, 0.05, 110, 0, 0.04, 0.22, 4, 1, -3, 0, 0, 0, 0, 0.5],
  fall: [0.4, 0, 500, 0.01, 0.1, 0.4, 0, 1, -30],
  reset: [0.5, 0, 300, 0.02, 0.18, 0.2, 0, 1, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0.6],
} as const satisfies Record<string, ZzfxParams>;

export type SfxName = keyof typeof SOUNDS;

const bank = createSfxBank(SOUNDS);

export const loadSfx = bank.load;

export function playSfx(name: SfxName, options: PlayOptions = {}) {
  bank.play(name, options);
}
