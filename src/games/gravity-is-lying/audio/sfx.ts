// Gravity Is Lying's sound effects (Plan/15-gravity-is-lying.md §9): springy jumps, soft lab
// footsteps, a "whoomp" whenever gravity flips, a lever's clunk, golden-apple chimes, and Isaac's
// pompous little babble. ZzFX parameter arrays, built once by the shared bank. (The hum before a
// timed turn is synthesized live: see hum.ts.)
import { createSfxBank, type PlayOptions, type ZzfxParams } from "@/engine/audio/sfx-bank";

export const SOUNDS = {
  jump: [0.4, 0.05, 300, 0, 0.02, 0.1, 0, 1.4, 9],
  land: [0.4, 0.1, 90, 0, 0.01, 0.08, 4, 1, -3, 0, 0, 0, 0, 0.5],
  step: [0.16, 0.2, 700, 0, 0, 0.03, 1, 2, -12],
  bonk: [0.5, 0, 200, 0, 0.02, 0.1, 1, 1, -10],
  /** Your own flip. */
  whoomp: [0.9, 0, 110, 0.02, 0.07, 0.2, 0, 1, 7, 0, 0, 0, 0, 0.25, 0, 0, 0.04],
  /** A timed turn (bigger, lower). */
  turn: [1, 0, 70, 0.03, 0.14, 0.3, 0, 1, 4, 0, 0, 0, 0, 0.35, 0, 0, 0.06],
  /** Tried to flip in the air, or in a zone. */
  noFlip: [0.3, 0, 180, 0, 0.02, 0.06, 2, 1, 0, 0, -60, 0.03],
  lever: [0.6, 0, 400, 0, 0.03, 0.1, 1, 1, 0, 0, 200, 0.04],
  /** Newt's own gravity changed (a zone): a soft swish. */
  shift: [0.22, 0, 600, 0.02, 0.04, 0.12, 4, 1, -8, 0, 0, 0, 0, 0.3],
  apple: [0.55, 0, 880, 0, 0.05, 0.25, 0, 1, 0, 0, 440, 0.05, 0.1],
  portal: [0.65, 0, 523, 0, 0.12, 0.45, 0, 1, 0, 0, 262, 0.08, 0.16],
  death: [0.6, 0, 300, 0, 0.05, 0.28, 3, 1, -12, 0, 0, 0, 0, 0.8],
  net: [0.65, 0, 160, 0.01, 0.12, 0.3, 0, 1, 16, 0, 0, 0, 0, 0, 10],
  respawn: [0.3, 0, 500, 0, 0.02, 0.06, 0, 1, 20],
  orbital: [0.55, 0, 660, 0, 0.08, 0.3, 0, 1, 0, 0, 330, 0.06, 0.12],
  /** Isaac's syllables (played at different speeds: a pompous babble). */
  babbleA: [0.32, 0.1, 170, 0.01, 0.04, 0.05, 2, 1, 2, 0, 0, 0, 0, 0, 30],
  babbleB: [0.3, 0.1, 210, 0.01, 0.03, 0.05, 2, 1, -3, 0, 0, 0, 0, 0, 25],
  babbleC: [0.32, 0.1, 140, 0.01, 0.05, 0.06, 2, 1, 1, 0, 0, 0, 0, 0, 35],
} as const satisfies Record<string, ZzfxParams>;

export type SfxName = keyof typeof SOUNDS;
export const SFX_NAMES = Object.keys(SOUNDS) as SfxName[];

const bank = createSfxBank(SOUNDS);

/** Build every sound once (after a tap or key press: ZzFX makes an AudioContext when imported). */
export const loadSfx = bank.load;

export function playSfx(name: SfxName, options: PlayOptions = {}) {
  bank.play(name, options);
}

const SYLLABLES: readonly SfxName[] = ["babbleA", "babbleB", "babbleC"];

/** Isaac's babble for a line: a syllable for every word or so (up to 9), at a pompous pace. */
export function babblePlan(text: string, lying: boolean): Array<{ name: SfxName; at: number; rate: number }> {
  const words = text.split(/\s+/).filter(Boolean);
  const count = Math.min(9, Math.max(2, Math.ceil(words.length * 0.7)));
  return Array.from({ length: count }, (_, i) => {
    const word = words[i % words.length] ?? "";
    const h = [...word].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) % 997, 7);
    return {
      name: SYLLABLES[h % 3]!,
      at: i * 95,
      // A lie wobbles a little lower.
      rate: (lying ? 0.82 : 1) * (0.9 + (h % 5) * 0.06),
    };
  });
}
