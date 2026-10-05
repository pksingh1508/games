// Don't Blink's numbers (Plan/14-dont-blink.md §3). Everything runs on a 60 Hz tick.

export const HZ = 60;
export const seconds = (s: number) => Math.round(s * HZ);

/** Every camera is drawn 640 × 400 scene units. */
export const VIEW_W = 640;
export const VIEW_H = 400;

// A blink (§3): eyes closing 80 ms, closed 120 ms, opening 80 ms. Changes only happen while fully closed.
export const BLINK_CLOSING = 5;
export const BLINK_CLOSED = 7;
export const BLINK_OPENING = 5;
/** When strain gives out (§3 "Keeping your eyes open"): a long blink, 1.5 s. */
export const LONG_BLINK = seconds(1.5);

/** Holding your eyes open: up to 8 seconds before they give up. */
export const STRAIN_SECONDS = 8;
/** Letting yourself blink normally: strain drains in about 6 seconds. */
export const STRAIN_RECOVER_SECONDS = 6;

/** Switching cameras: 150 ms of static (from Night 3 it hides changes too). */
export const STATIC_TICKS = 9;

/** Unreported anomalies at once that end the night (§2). */
export const MAX_ACTIVE = 5;

/** No two new anomalies closer together than this (the director's cooldown). */
export const ANOMALY_COOLDOWN = seconds(5);

/** The lying HUD (Night 5): a minute of it. */
export const LYING_HUD_TICKS = seconds(60);

/** A night runs from 00:00 to 06:00. */
export const HOURS = 6;

/** Five unreported changes: they're coming. Report one in this long, or they come for you. */
export const DANGER_TICKS = seconds(8);

/** The Visitor waits this long at the start of a night, between moves, and back on its pedestal. */
export const VISITOR_GRACE = seconds(30);
export const VISITOR_COOLDOWN = seconds(12);
export const VISITOR_REST = seconds(25);
/** Outside your door, it takes its time (one last chance to send it home). */
export const VISITOR_DOOR_COOLDOWN = seconds(16);

/** A fake blink (Night 4): the lids flutter halfway and open again. Nothing changes. */
export const FLUTTER_TICKS = 14;
/** A power flicker (Night 3): the feed drops out for a moment (a change can hide in it). */
export const FLICKER_TICKS = 10;
/** A reference photo stays up this long. */
export const PHOTO_TICKS = seconds(8);
/** A correct report, the fixed thing snaps back with a little glitch. */
export const FIX_TICKS = 8;

/** Eagle Eye: a change reported within a second of the blink that made it. */
export const EAGLE_EYE_TICKS = seconds(1);
/** Iron Eyes: five minutes of eyes held open in one night. */
export const IRON_EYES_TICKS = seconds(5 * 60);
