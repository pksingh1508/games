// Glitch Run's fixed numbers (Plan/07-glitch-run.md §3, §12). The screen is 480 × 272 (30 × 17 tiles
// of 16 px). The track is laid out on a beat grid: one beat of music is always six tiles of track, so
// the tempo sets the running speed, and obstacles, sound cues and the music stay in step.

export const TILE = 16;
export const VIEW_W = 480;
export const VIEW_H = 272;
export const ROWS = VIEW_H / TILE;

/** One beat of track. */
export const BEAT_TILES = 6;
export const BEAT_PX = BEAT_TILES * TILE;

/** Where the runner is on screen (the camera keeps it here). */
export const RUNNER_X = 112;

/** The ground's top, on flat track (row 12). */
export const GROUND_ROW = 12;

/** The runner's hitbox, standing and sliding (the feet stay put). */
export const RUNNER_W = 12;
export const RUNNER_H = 22;
export const SLIDE_H = 10;

/** Input bits, one byte per tick (after the input layer: an Input Swap is already applied). */
export const JUMP = 1;
export const SLIDE = 2;
export const GLITCH = 4;

/** Jumping and falling, in pixels and ticks (1/60 s). A full jump: about 58 px up, 33 ticks long. */
export const PHYSICS = {
  gravity: 0.42,
  jumpSpeed: -7,
  /** Letting go of jump early cuts the rise to this. */
  jumpCut: -2.6,
  maxFall: 9,
  /** Holding slide in the air pulls you down faster. */
  fastFall: 0.9,
  coyoteTicks: 5,
  bufferTicks: 6,
} as const;

/** Clip (Plan §3): intangible for 0.35 s. */
export const CLIP_TICKS = 21;
/** If a Clip ends inside something, it lasts this much longer at most (then you're patched). */
export const CLIP_GRACE = 30;
export const BITS_PER_CHARGE = 10;
export const MAX_CHARGES = 3;
export const CLIP_CORRUPTION = 10;
export const PATCH_CORRUPTION = 15;

/** Kernel Panic (Plan §3): ten seconds of chaos at 100% corruption. */
export const PANIC_TICKS = 600;
export const PANIC_BONUS = 5000;
export const PANIC_RESET = 50;

/** Every glitch is announced at least this long before it starts (0.6 s). */
export const TELEGRAPH_MIN = 36;

/** Spikes are forgiving by this much (px). */
export const HAZARD_INSET = 2;

/** Ticks per beat for a tempo (whole ticks, so beats land on ticks): 120 bpm is 30. */
export const bpmOf = (ticksPerBeat: number) => 3600 / ticksPerBeat;
/** Running speed for a tempo: a beat of track (96 px) every beat. */
export const speedOf = (ticksPerBeat: number) => BEAT_PX / ticksPerBeat;

export const ticksToMs = (ticks: number) => Math.round((ticks * 1000) / 60);
