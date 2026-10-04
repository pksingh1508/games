// Fake Floor's sound effects (Plan/05-fake-floor.md §9): footsteps for each material, and the
// pebble's three honest sounds: "tok" (solid), "tink" (invisible), and almost nothing, a faint
// "fwip", for a floor that isn't there. ZzFX parameter arrays, built once by the shared bank.
import { createSfxBank, type PlayOptions, type ZzfxParams } from "@/engine/audio/sfx-bank";
import type { Look } from "../core/room";
import type { Surface } from "../core/world";

export const SOUNDS = {
  jump: [0.35, 0.05, 260, 0, 0.02, 0.08, 0, 1.2, 8],
  land: [0.35, 0.1, 80, 0, 0.01, 0.07, 4, 1, -2, 0, 0, 0, 0, 0.6],
  bonk: [0.6, 0, 180, 0, 0.02, 0.12, 1, 1, -10],
  throw: [0.25, 0.05, 600, 0.01, 0.02, 0.07, 4, 1.4, 12, 0, 0, 0, 0, 0.3],
  empty: [0.3, 0, 300, 0, 0, 0.03, 2, 1],
  tok: [1, 0, 330, 0, 0, 0.06, 0, 1.5, -12, 0, 0, 0, 0, 0.1],
  tokSoft: [0.35, 0.05, 380, 0, 0, 0.04, 0, 1.5, -12],
  tink: [0.6, 0, 1800, 0, 0.01, 0.25, 0, 1, 0, 0, 900, 0.03, 0, 0, 0, 0, 0.08],
  fwip: [0.25, 0, 900, 0.02, 0.04, 0.12, 4, 1, -20, 0, 0, 0, 0, 0.2, 0, 0, 0, 0.5],
  creak: [0.4, 0.1, 120, 0.02, 0.1, 0.1, 2, 2, 2, 0, 0, 0, 0.03, 0.4, 0, 0.3],
  crumble: [0.7, 0.1, 90, 0, 0.08, 0.35, 4, 1, -3, 0, 0, 0, 0.05, 1.5, 0, 0.2],
  crack: [0.5, 0.05, 1200, 0, 0.01, 0.06, 4, 1, -30, 0, 0, 0, 0, 1],
  flip: [0.4, 0, 500, 0, 0.03, 0.08, 1, 1, 0, 0, 200, 0.03],
  pickup: [0.5, 0, 700, 0, 0.03, 0.12, 0, 1, 0, 0, 350, 0.04],
  hidden: [0.6, 0, 880, 0, 0.06, 0.35, 0, 1, 0, 0, 440, 0.06, 0.08],
  key: [0.6, 0, 1300, 0, 0.04, 0.2, 1, 1, 0, 0, 650, 0.05, 0.1],
  locked: [0.6, 0, 140, 0, 0.03, 0.08, 2, 1, -4, 0, 0, 0, 0, 0.3],
  net: [0.7, 0, 160, 0.01, 0.12, 0.3, 0, 1, 16, 0, 0, 0, 0, 0, 10],
  fall: [0.5, 0, 900, 0.02, 0.25, 0.1, 0, 1, -30, 0, 0, 0, 0, 0, 0, 0, 0, 0.8],
  respawn: [0.3, 0, 500, 0, 0.02, 0.06, 0, 1, 20],
  door: [0.6, 0, 523, 0, 0.1, 0.4, 0, 1, 0, 0, 262, 0.08, 0.16],
  chain: [0.22, 0.1, 140, 0.05, 0.12, 0.15, 2, 3, 3, 0, 0, 0, 0.02, 0.5, 0, 0.5],
  thump: [0.5, 0, 55, 0, 0.04, 0.2, 0, 1, -2],
  stepTile: [0.22, 0.15, 1100, 0, 0, 0.025, 1, 2, -20],
  stepRoof: [0.22, 0.2, 400, 0, 0.005, 0.05, 4, 1, -5, 0, 0, 0, 0, 0.3],
  stepPlank: [0.3, 0.15, 160, 0, 0.01, 0.05, 1, 1, -6],
  stepMirror: [0.18, 0.1, 2000, 0, 0, 0.03, 0, 1, -10],
  stepPaint: [0.2, 0.2, 250, 0, 0.01, 0.06, 4, 1, -1, 0, 0, 0, 0, 0.2, 0, 0, 0, 0.5],
  stepRock: [0.25, 0.15, 110, 0, 0.01, 0.05, 4, 1, -3, 0, 0, 0, 0, 0.4],
  stepFlesh: [0.25, 0.1, 90, 0, 0.02, 0.08, 0, 1, 4, 0, 0, 0, 0, 0.2, 5],
} as const satisfies Record<string, ZzfxParams>;

export type SfxName = keyof typeof SOUNDS;
export const SFX_NAMES = Object.keys(SOUNDS) as SfxName[];

const bank = createSfxBank(SOUNDS);

/** Build every sound once (after a tap or key press: ZzFX makes an AudioContext when imported). */
export const loadSfx = bank.load;

export function playSfx(name: SfxName, options: PlayOptions = {}) {
  bank.play(name, options);
}

const FLOOR_STEP: Record<Look, SfxName> = {
  1: "stepTile",
  2: "stepRoof",
  3: "stepPlank",
  4: "stepMirror",
  5: "stepPaint",
  6: "stepFlesh",
};

/** Each world's floors sound like what they're made of; rock sounds like rock. */
export const stepSound = (look: Look, surface: Surface): SfxName => (surface === "rock" ? "stepRock" : FLOOR_STEP[look]);
