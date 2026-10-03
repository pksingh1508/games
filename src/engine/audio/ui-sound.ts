// Tiny UI sound effects generated with ZzFX (no audio files). ZzFX creates its AudioContext
// when imported, so it is only ever loaded lazily, in the browser.
import { settingsSave } from "../settings";

export type UISound =
  | "click"
  | "tick"
  | "toggleOn"
  | "toggleOff"
  | "open"
  | "close"
  | "success"
  | "nope"
  | "error"
  | "coin";

// ZzFX parameters: volume, randomness, frequency, attack, sustain, release, shape, shapeCurve,
// slide, deltaSlide, pitchJump, pitchJumpTime, repeatTime, noise, modulation, bitCrush, delay,
// sustainVolume, decay, tremolo, filter.
const PRESETS: Record<UISound, Array<number | undefined>> = {
  click: [0.35, 0, 1400, 0, 0.01, 0.04, 1, 1.5],
  tick: [0.18, 0, 2200, 0, 0, 0.02, 0],
  toggleOn: [0.35, 0, 520, 0, 0.03, 0.08, 1, 1, 0, 0, 260, 0.04],
  toggleOff: [0.35, 0, 780, 0, 0.03, 0.08, 1, 1, 0, 0, -260, 0.04],
  open: [0.3, 0, 320, 0.01, 0.05, 0.12, 0, 1, 18],
  close: [0.3, 0, 520, 0.01, 0.03, 0.1, 0, 1, -18],
  success: [0.45, 0, 523, 0, 0.08, 0.3, 1, 1, 0, 0, 262, 0.07, 0.14],
  coin: [0.4, 0, 988, 0, 0.04, 0.22, 1, 1, 0, 0, 330, 0.05],
  nope: [0.6, 0, 110, 0, 0.04, 0.22, 1, 2, -6, 0, 0, 0, 0, 0, 0, 0.2],
  error: [0.3, 0, 160, 0, 0.08, 0.08, 2, 1, 0, 0, 0, 0, 0.05],
};

type ZzfxModule = typeof import("zzfx");
let zzfxModule: Promise<ZzfxModule> | null = null;

/** Play a UI sound, respecting the sound switch and volume settings. */
export function playSound(name: UISound) {
  if (typeof window === "undefined") return;
  const settings = settingsSave.get();
  const gain = settings.volume.master * settings.volume.sfx;
  if (!settings.sound || gain <= 0) return;

  zzfxModule ??= import("zzfx");
  void zzfxModule
    .then(({ ZZFX }) => {
      const context = ZZFX.audioContext as AudioContext;
      if (context.state === "suspended") void context.resume();
      const samples = ZZFX.buildSamples(...(PRESETS[name] as number[]));
      ZZFX.playSamples([samples], gain);
    })
    .catch(() => {
      // Audio unavailable (or blocked): stay silent.
    });
}
