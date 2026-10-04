// How the glitches look (Plan/07-glitch-run.md §3, §11): from the glitches warning and on at a tick
// (and the comfort settings) to what the renderer should do: freeze, lag, tear, invert, pixelate,
// flip... and which way the controls are mapped. Pure, so the comfort rules can be tested: with
// reduce flashing nothing flashes more than three times a second and Invert is a soft tint; with
// reduce motion the screen never flips; gentle glitches hit at 30%.
import { endAt, onAt, type GlitchEvent, type GlitchKind } from "./kinds";

export interface Comfort {
  reduceFlashing: boolean;
  reduceMotion: boolean;
}

export interface Look {
  /** Draw the world as it was this many ticks ago (Audio Desync). */
  lag: number;
  /** Hold the picture: Frame Skip's freeze, or Not Responding. */
  hold: "none" | "skip" | "frozen";
  /** Frame Skip's tell: a two-frame stutter just before each freeze. */
  stutter: boolean;
  /** The bottom half's sideways shift (px). */
  tear: number;
  missing: boolean;
  /** 0–1: the colours inverted (never with reduce flashing). */
  invert: number;
  /** 0–1: reduce flashing's soft colour shift instead. */
  tint: number;
  /** 0–1: how much the hidden platforms show (a faint glow before an Invert, all of them during). */
  reveal: number;
  /** 1 is sharp; bigger is chunkier. */
  pixel: number;
  ghost: boolean;
  /** 0–1: the déjà vu tape overlay. */
  dejaVu: number;
  /** 0–1: upside down (eased: the screen turns over, never snaps). */
  flip: number;
  notResponding: boolean;
  /** The input layer: jump and slide swapped. */
  swap: boolean;
  /** RGB split (px) and noise (0–1): the screen's general state of disrepair. */
  rgb: number;
  noise: number;
  /** Glitches being warned about (the HUD's icons), and whether the warning flicker is lit. */
  warnings: GlitchKind[];
  flicker: boolean;
  active: GlitchKind[];
}

export const CALM: Look = {
  lag: 0,
  hold: "none",
  stutter: false,
  tear: 0,
  missing: false,
  invert: 0,
  tint: 0,
  reveal: 0,
  pixel: 1,
  ghost: false,
  dejaVu: 0,
  flip: 0,
  notResponding: false,
  swap: false,
  rgb: 0,
  noise: 0,
  warnings: [],
  flicker: false,
  active: [],
};

/** Ramps in over `inT` ticks after on, out over `outT` before the end. */
function ease(e: GlitchEvent, tick: number, inT = 8, outT = 8): number {
  const into = tick - onAt(e);
  const left = endAt(e) - tick;
  return Math.max(0, Math.min(1, into / inT, left / outT));
}

/** Frame Skip's rhythm while it's on: a 2-tick stutter, then the picture holds 18 ticks (0.3 s). */
export const SKIP_CYCLE = 50;
export const SKIP_HOLD = 18;

export function lookAt(
  glitches: ReadonlyArray<{ event: GlitchEvent; phase: "warning" | "on" }>,
  tick: number,
  state: { corruption: number; panic: boolean },
  comfort: Comfort,
): Look {
  const look: Look = { ...CALM, warnings: [], active: [] };
  for (const { event: e, phase } of glitches) {
    if (phase === "warning") {
      look.warnings.push(e.kind);
      // Hidden platforms glow faintly just before an Invert (Plan §4: the Helpful Glitch).
      if (e.kind === "invert") look.reveal = Math.max(look.reveal, 0.3);
      continue;
    }
    look.active.push(e.kind);
    const k = ease(e, tick);
    const i = e.intensity;
    switch (e.kind) {
      case "frameSkip": {
        const t = (tick - onAt(e)) % SKIP_CYCLE;
        // Not in the last few ticks: it always lets go before it ends.
        if (endAt(e) - tick > SKIP_HOLD + 2) {
          if (t < 2) look.stutter = true;
          else if (t < 2 + SKIP_HOLD) look.hold = look.hold === "frozen" ? "frozen" : "skip";
        }
        break;
      }
      case "inputSwap":
        look.swap = true;
        break;
      case "screenTear":
        look.tear = (e.seed % 2 ? 1 : -1) * (24 + 48 * i) * k;
        break;
      case "missingTexture":
        look.missing = true;
        break;
      case "invert":
        look.reveal = 1;
        if (comfort.reduceFlashing) look.tint = Math.max(look.tint, 0.55 * ease(e, tick, 30, 30));
        else look.invert = Math.max(look.invert, ease(e, tick, 6, 6));
        break;
      case "audioDesync":
        look.lag = Math.round((12 + 12 * i) * ease(e, tick, 20, 20));
        break;
      case "dejaVu":
        look.dejaVu = ease(e, tick, 12, 12);
        break;
      case "lowRes":
        look.pixel = Math.max(look.pixel, 1 + Math.round((3 + 5 * i) * k));
        break;
      case "ghostDouble":
        look.ghost = true;
        break;
      case "notResponding":
        look.hold = "frozen";
        look.notResponding = true;
        break;
      case "upsideDown":
        if (!comfort.reduceMotion) look.flip = ease(e, tick, 30, 30);
        break;
    }
  }
  // The screen's general state: worse with corruption, and in a Kernel Panic.
  const c = state.corruption / 100;
  look.rgb = (c * 2 + (look.active.length ? 1.5 : 0) + (state.panic ? 3 : 0)) * (comfort.reduceFlashing ? 0.5 : 1);
  look.noise = Math.min(comfort.reduceFlashing ? 0.15 : 0.5, c * 0.3 + (state.panic ? 0.25 : 0));
  // The warning flicker: 6 times a second, or under 3 with reduce flashing (WCAG 2.3.1).
  const period = comfort.reduceFlashing ? 24 : 10;
  look.flicker = look.warnings.length > 0 && Math.floor(tick / (period / 2)) % 2 === 0;
  return look;
}
