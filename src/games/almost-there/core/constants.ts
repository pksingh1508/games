// Almost There's fixed numbers (Plan/08-almost-there.md §3, §9, §12). Each screen is 48 × 27 tiles
// of 8 px: a 384 × 216 pixel-art canvas, scaled up in whole pixels (×5 is 1080p). The mountain is a
// grid of screens, two columns wide and forty rows tall; the camera cuts from screen to screen.

export const TILE = 8;
export const COLS = 48;
export const ROWS = 27;
export const VIEW_W = COLS * TILE;
export const VIEW_H = ROWS * TILE;

/** The mountain: screen columns (outside, inside) and rows (0 is the bottom). */
export const GRID_COLS = 2;
export const GRID_ROWS = 40;
export const WORLD_W = GRID_COLS * VIEW_W;
export const WORLD_H = GRID_ROWS * VIEW_H;

/** Pip's hitbox. The art is a little wider (the backpack), never taller. */
export const PIP_W = 8;
export const PIP_H = 12;

/** Input bits, one byte per tick: bit 0 left, bit 1 right, bit 2 jump (held while charging). */
export const LEFT = 1;
export const RIGHT = 2;
export const JUMP = 4;

/** Walking speed on the ground (px per tick). */
export const WALK = 1;
/** Hold for up to 0.6 s; at full charge the jump goes by itself. */
export const CHARGE_MAX = 36;
/** Upward speed of the weakest and the strongest jump (power grows in a straight line with charge). */
export const JUMP_VY_MIN = 1.9;
export const JUMP_VY_MAX = 5.6;
/** Sideways speed of a jump to the left or right (straight up: none). No air control after that. */
export const JUMP_VX = 1.6;
export const GRAVITY = 0.2;
export const MAX_FALL = 6;
/** Hitting a wall in the air sends you back at half speed. */
export const BOUNCE = 0.5;
/** Snow: charged jumps are 15% weaker. */
export const SNOW = 0.85;
/** A mushroom throws you up this fast. */
export const MUSHROOM_VY = 6.4;
/** Ice: you keep sliding after you land, slowing by this much each tick. */
export const ICE_FRICTION = 0.03;
/** Crumbling ledges and clouds go 1 s after you land on them, and come back 3 s later. */
export const CRUMBLE_TICKS = 60;
export const RESPAWN_TICKS = 180;
/** Land after falling this far (px) and Pip faceplants for a moment. */
export const STUN_FALL = 144;
export const STUN_TICKS = 22;
/** A landing this far (px) below where you left the ground counts as a fall. */
export const FALL_MIN = 48;

/** 20 px is a metre: the mountain is 432 m tall. */
export const METRE = 20;
/** The continuous save, every quarter of a second while anything moves (Plan §3: no save-scumming). */
export const AUTOSAVE_TICKS = 15;

/** Bump when the physics changes (stored with the climb; an old climb restarts its screen). */
export const ENGINE_VERSION = 1;

export const ticksToMs = (ticks: number) => Math.round((ticks * 1000) / 60);
