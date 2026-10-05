// Super Happy Jump!'s fixed numbers (Plan/04-dont-trust-the-game.md §12). The game inside the game is a
// 480 × 272 pixel-art screen of 16 px tiles (30 × 17), scaled up inside the monitor; levels can be bigger
// than one screen. The jump is the arcade's shared one.
import { DEFAULT_TUNING, type Tuning } from "@/engine/platformer/runner";

export const TILE = 16;
export const VIEW_COLS = 30;
export const VIEW_ROWS = 17;
export const WIDTH = VIEW_COLS * TILE;
export const HEIGHT = VIEW_ROWS * TILE;

export const PLAYER_W = 10;
export const PLAYER_H = 14;

export const TUNING: Tuning = DEFAULT_TUNING;
/** `jump --height 999`: a moon jump, for a few seconds. */
export const MOON_TUNING: Tuning = { ...DEFAULT_TUNING, jumpSpeed: -8.4, gravity: 0.17, apexGravity: 0.4, maxFall: 3.2 };
export const MOON_TICKS = 8 * 60;

/** Input bits, one per tick: left, right, jump. */
export const LEFT = 1;
export const RIGHT = 2;
export const JUMP = 4;

/** Respawn is instant: the death puff plays for this many ticks. */
export const RESPAWN_TICKS = 18;
/** How fast you can push a block. */
export const PUSH_SPEED = 0.9;
/** A block jammed against a wall goes back where it started after this long. */
export const BLOCK_RESET_TICKS = 120;
