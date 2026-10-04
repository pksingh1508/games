// DeskOS 98's numbers (Plan/12-cursor-escape.md §3, §12). Everything happens on a 640 × 400 desktop
// (logical pixels, scaled to fit the screen) with the taskbar along the bottom; every level is a window
// of the same shape: a title bar with the [X] on the right, and a client area of 38 × 21 cells of 16 px.
// The simulation runs at 120 ticks a second, so the cursor feels as quick as a real one.

export const HZ = 120;
export const TICK_MS = 1000 / HZ;
export const seconds = (s: number) => Math.round(s * HZ);
export const ticksToMs = (ticks: number) => Math.round(ticks * TICK_MS);

export const DESK_W = 640;
export const DESK_H = 400;
export const TASKBAR_H = 22;

/** The level window's outer edge. */
export const WIN = { x: 12, y: 8, w: 616, h: 364 } as const;
/** The title bar's open strip (you can move along it). */
export const TITLE = { x: 16, y: 11, w: 608, h: 18 } as const;
/** The bar between the title bar and the client area (openings in it lead up to the title bar). */
export const SEPARATOR = { y: 29, h: 3 } as const;
/** The client area: the maze. */
export const CLIENT = { x: 16, y: 32, w: 608, h: 336 } as const;
export const CELL = 16;
export const COLS = CLIENT.w / CELL;
export const ROWS = CLIENT.h / CELL;

/** The title bar's buttons: [_] and [□] are solid, [X] closes the window. */
export const CLOSE_BUTTON = { x: 607, y: 13, w: 16, h: 14 } as const;
export const MAX_BUTTON = { x: 589, y: 13, w: 16, h: 14 } as const;
export const MIN_BUTTON = { x: 573, y: 13, w: 16, h: 14 } as const;

/** The arrow's hitbox: a circle this size at its tip. */
export const TIP_R = 3;
/** The I-beam's hitbox: a thin, tall box around its middle. */
export const IBEAM_HALF = { w: 1, h: 8 } as const;
/** The forgiving hitbox (assist): just the very tip. */
export const ASSIST_TIP_R = 1;

/** Every sabotage is announced this long before it starts (at least 0.75 s: Plan §10). */
export const WARN_TICKS = seconds(1);
export const MIN_WARN_TICKS = seconds(0.75);

/** Loading zones freeze you this long (once per visit). */
export const BUSY_TICKS = seconds(1.5);
/** Precision zones: half speed. */
export const CROSSHAIR_SPEED = 0.5;
/** Restricted zones push you out this fast (px a tick). */
export const FORBIDDEN_PUSH = 1.2;
/** "Are you sure?" buttons shiver this long, then swap, when you come this close. */
export const DIALOG_SHIVER = seconds(0.35);
export const DIALOG_NEAR = 34;

/** A crash shows for a moment, then the level starts again. */
export const CRASH_TICKS = seconds(0.35);
