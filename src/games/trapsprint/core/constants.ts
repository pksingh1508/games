// TrapSprint's fixed numbers (Plan/06-trapsprint.md §3, §12). One screen is 30 × 17 tiles of 16 px:
// a 480 × 272 pixel-art canvas, scaled up by whole numbers where the screen allows.
import { DEFAULT_TUNING, type Tuning } from "@/engine/platformer/runner";

export const TILE = 16;
export const COLS = 30;
export const ROWS = 17;
export const WIDTH = COLS * TILE;
export const HEIGHT = ROWS * TILE;

export const PLAYER_W = 10;
export const PLAYER_H = 14;

/** Bump when the physics changes: older ghosts are kept but no longer raced. */
export const ENGINE_VERSION = 1;

export const TUNING: Tuning = DEFAULT_TUNING;

/** Input bits, one byte per tick (Plan §12): bit 0 left, bit 1 right, bit 2 jump. */
export const LEFT = 1;
export const RIGHT = 2;
export const JUMP = 4;

/** Respawn is instant: the death animation plays for this many ticks (under 0.3 s). */
export const RESPAWN_TICKS = 16;
/** The Follower runs your exact path this far behind (2 s). */
export const FOLLOW_DELAY = 120;
/** A level you know takes 15 s or less (Plan §14). */
export const MAX_KNOWN_TICKS = 15 * 60;

export const SPRING_SPEED = -8.6;
export const CHECKPOINT_LAUNCH = -10.5;
export const SIDE_SPRING = { vx: 7.4, vy: -3.2 };
export const CONVEYOR_SPEED = 1.1;

export const ticksToMs = (ticks: number) => Math.round((ticks * 1000) / 60);
