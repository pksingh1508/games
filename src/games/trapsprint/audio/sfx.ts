// TrapSprint's sound effects (Plan/06-trapsprint.md §9): comedic bonks, splats and boings, and a
// clear cue for every trap (saws "shing" before they fly in). Made with ZzFX's sample builder and
// played through the arcade's audio engine, so the sound switch and volumes apply.
import { createSfxBank, type ZzfxParams } from "@/engine/audio/sfx-bank";

export const SOUNDS = {
  jump: [0.6, 0.05, 250, 0, 0.03, 0.09, 5, 0.5, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0.8],
  land: [0.4, 0.1, 90, 0, 0.01, 0.06, 4, 1, -2, 0, 0, 0, 0, 0.5],
  bonk: [0.8, 0, 190, 0, 0.02, 0.13, 1, 1, -10, 0, -60, 0.03, 0, 0, 0, 0, 0, 0.7],
  splat: [1, 0.1, 150, 0, 0.06, 0.32, 4, 1, -4, 0, 0, 0, 0, 1.2, 0, 0.2],
  tick: [0.35, 0, 1700, 0, 0, 0.025, 1],
  boing: [0.8, 0, 170, 0.01, 0.12, 0.26, 0, 1, 18, 0, 0, 0, 0, 0, 12],
  coin: [0.6, 0, 1046, 0, 0.04, 0.22, 1, 1, 0, 0, 523, 0.06],
  checkpoint: [0.6, 0, 523, 0, 0.12, 0.3, 1, 1, 0, 0, 262, 0.09],
  shing: [0.5, 0, 1900, 0.02, 0.14, 0.28, 3, 1, 5, 0, 0, 0, 0, 0.25, 0, 0, 0.07],
  whirr: [0.35, 0, 1100, 0.01, 0.25, 0.08, 2, 1, -2, 0, 0, 0, 0.02, 0.1],
  pop: [0.8, 0, 520, 0, 0.01, 0.07, 2, 1, 30, 0, 0, 0, 0, 0.6],
  drop: [0.6, 0.1, 230, 0, 0.05, 0.26, 4, 1, -8, 0, 0, 0, 0, 0.5],
  slam: [1.2, 0.05, 62, 0, 0.05, 0.36, 4, 1, -3, 0, 0, 0, 0, 2, 0, 0.4],
  rumble: [0.4, 0, 52, 0.02, 0.16, 0.1, 4, 1, 0, 0, 0, 0, 0.05, 0.6],
  wheels: [0.35, 0, 900, 0, 0.26, 0.06, 1, 1, 4, 0, 0, 0, 0.07, 0, 0, 0, 0, 0.6],
  reveal: [0.5, 0, 300, 0.01, 0.06, 0.2, 0, 1, -6, 0, 300, 0.05],
  flip: [0.6, 0, 330, 0, 0.04, 0.12, 5, 0.5, -20, 0, 0, 0, 0, 0, 0, 0.3],
  squeeze: [0.6, 0.05, 90, 0.05, 0.6, 0.2, 2, 1, 0, 0, 0, 0, 0.04, 0.5, 0, 0.3],
  hiss: [0.4, 0, 400, 0.05, 0.4, 0.2, 4, 1, -1, 0, 0, 0, 0, 0.2, 0, 0, 0, 0.6, 0, 0, 2000],
  wake: [0.6, 0, 440, 0.01, 0.08, 0.15, 5, 0.6, 0, 0, -110, 0.1],
  launch: [0.9, 0, 120, 0.01, 0.15, 0.3, 0, 1, 26, 0, 0, 0, 0, 0, 16],
  whoosh: [0.5, 0, 200, 0.05, 0.1, 0.2, 4, 1, -5, 0, 0, 0, 0, 0.3, 0, 0, 0, 0.8, 0, 0, -1500],
  crack: [0.6, 0.05, 300, 0, 0.02, 0.1, 4, 1, -10, 0, 0, 0, 0, 1],
  respawn: [0.3, 0, 600, 0, 0.02, 0.05, 1, 1, 20],
} as const satisfies Record<string, ZzfxParams>;

export type SfxName = keyof typeof SOUNDS;
export const SFX_NAMES = Object.keys(SOUNDS) as SfxName[];

const bank = createSfxBank(SOUNDS);

/** Build every sound once (after a tap or key press: ZzFX makes an AudioContext when imported). */
export const loadSfx = bank.load;

export function playSfx(name: SfxName, options: { volume?: number; rate?: number } = {}) {
  bank.play(name, options);
}
