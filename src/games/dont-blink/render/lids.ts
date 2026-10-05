// Your eyelids, and everything else that covers the screen (Plan/14-dont-blink.md §9: "Blinks are drawn as
// eyelids closing from the top and bottom, not just a black flash"; §11: with Reduce flashing, blinks become a
// soft fade to dim, static a gentle blur, and nothing ever goes fully black).

/** The darkest the screen gets with Reduce flashing on (the lids' opacity at most). */
export const SOFT_LIDS = 0.72;

export interface Cover {
  /** How far each lid reaches toward the middle (0 open, 1 they meet). */
  reach: number;
  /** The lids' opacity. */
  alpha: number;
  /** Blur on the picture (px), Reduce flashing only. */
  blur: number;
  /** Brightness of the picture under it (1 normal). */
  brightness: number;
}

/**
 * How the screen looks: `closure` is how shut your eyes are (0–1, a fake blink included); `veil` is static or a
 * power cut over the camera (0–1).
 */
export function cover(closure: number, veil: number, reduce: boolean): Cover {
  const c = Math.max(0, Math.min(1, closure));
  const v = Math.max(0, Math.min(1, veil));
  if (!reduce) return { reach: c, alpha: 1, blur: 0, brightness: 1 };
  // A soft fade: the lids only come part of the way, see-through, and the picture blurs and dims behind them,
  // so a change can't be made out, and the screen never goes black.
  const k = Math.max(c, v);
  return { reach: c * 0.42, alpha: SOFT_LIDS * c, blur: 12 * k, brightness: 1 - 0.5 * k };
}

/** The darkest point on screen, for testing: 0 is black (under the lids, if they're showing at all). */
export const darkest = (c: Cover) => (c.reach > 0 ? 1 - c.alpha : 1) * c.brightness;
