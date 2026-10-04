// Last Pixel's numbers (Plan/10-last-pixel.md). The simulation runs at 60 ticks a second on a grid of
// coverage cells (128 × 72 for most canvases); everything here is in ticks and cells.

export const HZ = 60;
export const seconds = (s: number) => Math.round(s * HZ);

/** The usual canvas, in cells (16:9). */
export const GRID_W = 128;
export const GRID_H = 72;

/** A cell's paint when it's done (cells fill from 0 to this). */
export const FULL = 255;

// The switch: Pix wakes ("!"), the music cuts, and it dashes off.
export const WAKE_TICKS = seconds(1.1);
/** How far Pix dashes from your cursor when it wakes (cells). */
export const WAKE_DASH = 22;

// Pix gets tired (§3 "Pix gets tired", §10 rule 1): slower after 30 s, gives up at 60 s.
export const TIRED_TICKS = seconds(30);
export const GIVE_UP_TICKS = seconds(60);
export const TIRED_SPEED = 0.55;

// Its tricks.
/** Camouflage: within 2% of the background's brightness, and a shimmer every 2 seconds. */
export const CAMO_DELTA = 0.02;
export const SHIMMER_EVERY = seconds(2);
export const SHIMMER_TICKS = seconds(0.3);
/** The chase music's beat (the real Pix blinks on it; decoys don't). */
export const BPM = 120;
export const BEAT_TICKS = Math.round((60 / BPM) * HZ);
export const BLINK_TICKS = 7;
/** Caught out (a trick exposed): sits still with a "!" for this long. */
export const STUN_TICKS = seconds(1.3);
/** Free running between one trick and the next. */
export const TRICK_GAP = seconds(4);
/** How close your cursor gets before a fleeing Pix runs (cells). */
export const NOTICE_R = 15;
/** Closer than this, it dodges sideways (cells), at most once in this long. */
export const JUKE_R = 4.5;
export const JUKE_COOLDOWN = seconds(0.9);
/** A mimic cursor drops the act when yours comes this close (cells). */
export const MIMIC_TOUCH = 3;

// Hunt tools (§3).
/** A net drawn for longer than this gives Pix time to slip out of it. */
export const NET_NOTICE = seconds(0.5);
export const BAIT_TICKS = seconds(2);
export const FREEZE_TICKS = seconds(1);
/** The catch radius: at least this many cells, and at least this many screen px (more for fingers). */
export const CATCH_CELLS = 2;
export const CATCH_PX = 14;
export const CATCH_PX_TOUCH = 24;
/** Hunt assist (§11): Pix slower, its shimmer twice as often, the catch radius bigger. */
export const ASSIST_SPEED = 0.7;
export const ASSIST_CATCH = 1.4;

// Stars and trophies (§7).
export const STAR_HUNT_TICKS = seconds(10);
export const GOTCHA_TICKS = seconds(2);
