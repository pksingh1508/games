// Gravity Is Lying's fixed numbers (Plan/15-gravity-is-lying.md §3, §12). Rooms are one screen:
// 30 × 17 tiles of 16 px (480 × 272), or 17 × 17 in Tilted Town, where the camera turns (a square
// room fits the screen at any quarter turn). Orbit rooms are open space of the same size.
import { DEFAULT_TUNING, type Tuning } from "@/engine/platformer/runner";

export const TILE = 16;
export const VIEW_W = 480;
export const VIEW_H = 272;
export const COLS = VIEW_W / TILE;
export const ROWS = VIEW_H / TILE;

/** Newt's hitbox: square, so a gravity change never changes its shape (or pushes it into a wall). */
export const NEWT = 12;

/** The shared platformer feel (about 3 tiles up and 4.5 across), the same whichever way is down. */
export const TUNING: Tuning = { ...DEFAULT_TUNING };

/** Input bits, one byte per tick. Left and right are along Newt's floor; jump is away from it. */
export const LEFT = 1;
export const RIGHT = 2;
export const JUMP = 4;
export const FLIP = 8;

/** Every gravity change that isn't yours is announced by the hum at least this long before (0.75 s). */
export const HUM_TICKS = 45;

/** Spikes and the room's edge are forgiving by this much (px). */
export const HAZARD_INSET = 3;

/** A death restarts the room after this many ticks (the instant restart, with a beat to see why). */
export const RESTART_TICKS = 18;

/** Camera turns take at least this long for a quarter turn (Plan §10.4: 0.6 s). */
export const TURN_TICKS_PER_QUARTER = 40;

/** Rooms are known to take no longer than this (the solver's limit, the clock's sanity check). */
export const MAX_ROOM_TICKS = 60 * 120;

export const ticksToMs = (ticks: number) => Math.round((ticks * 1000) / 60);
