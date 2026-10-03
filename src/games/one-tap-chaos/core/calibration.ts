// Input calibration (Plan/09-one-tap-chaos.md §8, §10.1): tap along to a beat; how late your
// taps land, on average, becomes the offset the game corrects for (touch delay, Bluetooth audio…).
import { TAP_OFFSET_RANGE } from "@/engine/settings";

export const CALIBRATION_BPM = 100;
/** Listen for 4 beats, then tap along for 12. */
export const LISTEN_BEATS = 4;
export const TAP_BEATS = 12;
/** Taps further than this from any beat are ignored (a stray tap, or a lost one). */
const MAX_ERROR = 0.32;
/** Enough taps for a trustworthy answer. */
export const MIN_TAPS = 6;

export interface CalibrationResult {
  /** Milliseconds: positive means your taps land late. */
  offsetMs: number;
  /** How spread out the taps were (ms), to say how steady they were. */
  spreadMs: number;
  used: number;
}

/** Each tap's distance (seconds) from its nearest beat. `beats` are beat times in seconds. */
export function tapErrors(taps: number[], beats: number[]): number[] {
  return taps.flatMap((tap) => {
    let best = Infinity;
    for (const beat of beats) if (Math.abs(tap - beat) < Math.abs(best)) best = tap - beat;
    return Math.abs(best) <= MAX_ERROR ? [best] : [];
  });
}

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
};

/** The offset from a set of taps, or null if there weren't enough steady ones. */
export function measureOffset(taps: number[], beats: number[]): CalibrationResult | null {
  const errors = tapErrors(taps, beats);
  if (errors.length < MIN_TAPS) return null;
  // The median ignores the odd fumble; then drop anything far from it and average the rest.
  const centre = median(errors);
  const steady = errors.filter((e) => Math.abs(e - centre) <= 0.08);
  if (steady.length < MIN_TAPS) return null;
  const mean = steady.reduce((a, b) => a + b, 0) / steady.length;
  const spread = Math.sqrt(steady.reduce((a, b) => a + (b - mean) ** 2, 0) / steady.length);
  const offsetMs = Math.round(Math.min(TAP_OFFSET_RANGE[1], Math.max(TAP_OFFSET_RANGE[0], mean * 1000)));
  return { offsetMs, spreadMs: Math.round(spread * 1000), used: steady.length };
}
