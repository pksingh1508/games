// Wrong Door's sound effects (Plan/13-wrong-door.md §9 "Audio"): knocks, creaks, a slam, a tumble down the
// stairs, a key slipping away, a curse, a coin, a page of the codex. ZzFX parameter arrays, built once by
// the shared bank.
import { getAudio } from "@/engine/audio/engine";
import { createSfxBank, type PlayOptions, type ZzfxParams } from "@/engine/audio/sfx-bank";

export const SOUNDS = {
  knock: [0.9, 0, 120, 0, 0.012, 0.06, 4, 0.8, -6, 0, 0, 0, 0, 1.4],
  creak: [0.5, 0.05, 210, 0.08, 0.35, 0.35, 2, 2.4, -1.2, 0, 0, 0, 0.09, 0.4],
  slam: [1.2, 0, 70, 0, 0.05, 0.4, 4, 1.4, -2, 0, 0, 0, 0, 1.2],
  tumble: [0.8, 0.1, 90, 0, 0.04, 0.12, 4, 1, 0, 0, 0, 0, 0.11, 0.9, 0, 0, 0, 0.5, 0.08],
  keyLost: [0.5, 0, 1650, 0, 0.02, 0.4, 0, 1.6, 0, 0, 380, 0.06, 0.12],
  curse: [0.45, 0.05, 330, 0.12, 0.3, 0.5, 3, 0.4, -12, 0, 0, 0, 0, 0.3, 4],
  pickup: [0.5, 0, 700, 0, 0.04, 0.2, 0, 1.6, 0, 0, 350, 0.05],
  coin: [0.55, 0, 1400, 0, 0.03, 0.35, 1, 2.2, 0, 0, 700, 0.07],
  page: [0.35, 0.3, 3000, 0.02, 0.05, 0.12, 4, 0.6, 0, 0, 0, 0, 0, 2.5],
  up: [0.55, 0, 523, 0.02, 0.18, 0.4, 0, 1.4, 0, 0, 262, 0.1, 0.1],
  click: [0.3, 0, 900, 0, 0.004, 0.02, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.6],
  flicker: [0.35, 0.2, 60, 0, 0.3, 0.2, 2, 0.5, 0, 0, 0, 0, 0.04, 0.6],
  hmm: [0.35, 0, 110, 0.04, 0.12, 0.15, 0, 1, 0, 0, 0, 0, 0, 0, 2],
} as const satisfies Record<string, ZzfxParams>;

export type SfxName = keyof typeof SOUNDS;

const bank = createSfxBank(SOUNDS);

export const loadSfx = bank.load;

export function playSfx(name: SfxName, options: PlayOptions = {}) {
  bank.play(name, options);
}

/** Three knocks, a step apart, on the audio clock (panned to the door). */
export function knockKnock(pan: number) {
  const now = getAudio()?.ctx.currentTime ?? 0;
  [0, 0.16, 0.32].forEach((t, k) => playSfx("knock", { pan, rate: k === 2 ? 0.92 : 1, at: now + t }));
}
