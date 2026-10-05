// Panic Stack's numbers (Plan/11-panic-stack.md). The world is in metres and kilograms, y up, the platform's
// top at y = 0. The simulation runs 60 ticks a second, each split into four physics sub-steps (240 Hz): tall
// towers of mixed weights stand perfectly still at that rate, where 60 Hz lets a 20-item stack creep.

export const HZ = 60;
export const seconds = (s: number) => Math.round(s * HZ);

export const SUBSTEPS = 4;
export const DT = 1 / HZ / SUBSTEPS;
export const VELOCITY_ITERATIONS = 8;
export const POSITION_ITERATIONS = 4;

export const GRAVITY = 10;

// The hand (§12 "Dragging"): a pull toward the pointer with a fixed strength. It holds an item's weight
// first and moves it with what's left, so a heavy item trails behind your hand and a light one zips about.
// That's the drag-weight tell, straight from the physics.
export const HAND_FORCE = 130;
/** How quickly the hand closes the gap (1/s), and the top speed it asks for (m/s). */
export const HAND_GAIN = 18;
export const HAND_TOP_SPEED = 9;
/** How firmly it matches the speed it wants: light things (under LIGHT_MASS) are held loosely and wobble. */
export const HAND_GRIP = 22;
export const HAND_GRIP_LIGHT = 9;
export const LIGHT_MASS = 1;
/** The wrist: turns a held item toward the angle you set, with a fixed strength (heavy things turn slowly). */
export const WRIST_TORQUE = 30;
export const WRIST_GAIN = 14;
export const WRIST_GRIP = 18;
/** Q / E, the wheel, the turn buttons: 15° a step. */
export const ROTATE_STEP = Math.PI / 12;
/** Let go while moving and an item keeps some of the speed, never more than this (m/s). */
export const RELEASE_SPEED = 2.5;

// Winning (§3): the tower's top above the goal line and nothing moving much, for three seconds.
export const STABLE_TICKS = seconds(3);
export const STILL_SPEED = 0.06;
export const STILL_SPIN = 0.15;

// Losing: three items fall (off the platform, off the belt, or float away), the time runs out, or something
// fragile breaks.
export const MAX_FALLS = 3;
/** An item whose centre is this far below the platform's top has fallen. */
export const FALL_Y = -0.6;
/** The floor far below, where fallen things land (and vanish in a puff). */
export const FLOOR_Y = -1.15;

/** The platform's slab. */
export const PLATFORM_THICKNESS = 0.35;

// The conveyor (§2): the next items ride in from the right and drop off the left end.
/** Items on the belt at once (the next three are visible). */
export const BELT_SLOTS = 3;

// Panic events (§3, §10 rule 3): at least 1.5 s of warning, always. Every event gets two.
export const WARN_TICKS = seconds(2);

/** X-ray glasses (§3): every item's true shape and weight, for five seconds. */
export const XRAY_TICKS = seconds(5);

/** Endless (§5): items this far below the top that have stopped are set in place (static), for speed. */
export const SET_DEPTH = 4.5;
