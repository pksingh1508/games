// Fake Floor's fixed numbers (Plan/05-fake-floor.md §3, §9, §12). The view is 30 × 17 tiles of
// 16 px (a 480 × 272 pixel-art canvas, like TrapSprint); rooms are as tall as the view and up to
// 100 tiles wide, so the camera scrolls sideways.
import { DEFAULT_TUNING, type Tuning } from "@/engine/platformer/runner";

export const TILE = 16;
export const ROWS = 17;
export const VIEW_W = 480;
export const VIEW_H = ROWS * TILE;
export const MIN_COLS = 30;
export const MAX_COLS = 100;

export const PLAYER_W = 10;
export const PLAYER_H = 14;

/** Bump when the physics changes (stored with time-trial records). */
export const ENGINE_VERSION = 1;

/**
 * A careful game: a walk rather than a sprint. Same jump height as TrapSprint (3 tiles), about
 * 4 tiles across at full speed. Coyote time 5 ticks (83 ms), jump buffer 6 ticks (100 ms).
 */
export const TUNING: Tuning = {
  ...DEFAULT_TUNING,
  maxRun: 1.8,
  runAccel: 0.24,
  turnAccel: 0.5,
  groundFriction: 0.42,
  airAccel: 0.2,
};

/** Input bits, one byte per tick: bit 0 left, bit 1 right, bit 2 jump. */
export const LEFT = 1;
export const RIGHT = 2;
export const JUMP = 4;

/** A crumbling floor holds you for 0.4 s after you land on it (Plan §3). */
export const CRUMBLE_TICKS = 24;
/** A fall restarts the room this many ticks later (well under 0.5 s: Plan §10.5). */
export const RESPAWN_TICKS = 22;
/** A safety net bounces you, then puts you back on the last safe floor. */
export const NET_TICKS = 48;
/** An invisible floor glows for 3 s after a pebble hits it. */
export const REVEAL_TICKS = 180;
export const PEBBLE_GRAVITY = 0.2;
/** A footstep every this many pixels walked. */
export const STEP_EVERY = 13;
/** Rooms you know take a minute at most. */
export const MAX_KNOWN_TICKS = 60 * 60;

export const ticksToMs = (ticks: number) => Math.round((ticks * 1000) / 60);
