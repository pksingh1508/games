// The glitches (Plan/07-glitch-run.md §3): what each one does, which layer it touches (the screen or
// the controls, never the simulation), and its tell.

export type GlitchKind =
  | "frameSkip"
  | "inputSwap"
  | "screenTear"
  | "missingTexture"
  | "invert"
  | "audioDesync"
  | "dejaVu"
  | "lowRes"
  | "ghostDouble"
  | "notResponding"
  | "upsideDown";

export interface GlitchInfo {
  name: string;
  /** "presentation": what you see. "input": how your keys are read. Never the simulation. */
  layer: "presentation" | "input";
  /** What happens, and how to beat it (the tell, or the truth anchor). */
  what: string;
  tell: string;
  /** The HUD's warning icon (a short code, drawn as a pictogram). */
  icon: string;
}

export const GLITCHES: Record<GlitchKind, GlitchInfo> = {
  frameSkip: { name: "Frame Skip", layer: "presentation", what: "The picture freezes for a moment, then jumps ahead.", tell: "It stutters first. Your shadow keeps moving.", icon: "skip" },
  inputSwap: { name: "Input Swap", layer: "input", what: "Jump and slide trade places.", tell: "The control icons flip, and you turn inside out.", icon: "swap" },
  screenTear: { name: "Screen Tear", layer: "presentation", what: "The bottom half of the screen slides sideways.", tell: "Your shadow is always where you really are; the top half is honest.", icon: "tear" },
  missingTexture: { name: "Missing Texture", layer: "presentation", what: "Everything turns into magenta checkerboards.", tell: "The shapes don't change. Read the outlines.", icon: "texture" },
  invert: { name: "Invert", layer: "presentation", what: "The colours flip, and hidden platforms show.", tell: "Hidden platforms glow faintly just before.", icon: "invert" },
  audioDesync: { name: "Audio Desync", layer: "presentation", what: "The picture lags behind the sound.", tell: "The sounds are on time. So is your shadow.", icon: "desync" },
  dejaVu: { name: "Déjà Vu", layer: "presentation", what: "The last stretch of track comes round again, with one change.", tell: "Spot the difference.", icon: "dejavu" },
  lowRes: { name: "Low Res", layer: "presentation", what: "The screen goes chunky.", tell: "Read the shapes. The cues still sound.", icon: "lowres" },
  ghostDouble: { name: "Ghost Double", layer: "presentation", what: "There are two of you.", tell: "The real one has a shadow, and moves first.", icon: "ghost" },
  notResponding: { name: "Not Responding", layer: "presentation", what: "The screen freezes. The game doesn't.", tell: "Run on the sound (and the beat bar).", icon: "frozen" },
  upsideDown: { name: "Upside Down", layer: "presentation", what: "The screen flips over. Your controls don't.", tell: "Jump is still jump. Trust your hands.", icon: "flip" },
};

export const GLITCH_KINDS = Object.keys(GLITCHES) as GlitchKind[];

/** A glitch on the timeline. Ticks are the run's ticks. */
export interface GlitchEvent {
  id: number;
  kind: GlitchKind;
  /** When the warning starts. */
  start: number;
  /** Warning ticks (at least 36: 0.6 s). */
  telegraph: number;
  /** Ticks it lasts once it's on. */
  duration: number;
  /** 0–1: how hard it hits (corruption raises it; gentle glitches lower it). */
  intensity: number;
  /** For the glitches that vary (which way the screen tears): stable per event. */
  seed: number;
}

export const onAt = (e: GlitchEvent) => e.start + e.telegraph;
export const endAt = (e: GlitchEvent) => e.start + e.telegraph + e.duration;

export type Phase = "warning" | "on";

export function phaseOf(e: GlitchEvent, tick: number): Phase | null {
  if (tick < e.start || tick >= endAt(e)) return null;
  return tick < onAt(e) ? "warning" : "on";
}
