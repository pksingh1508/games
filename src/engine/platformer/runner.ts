// The shared platformer "feel" (Plan/06-trapsprint.md §3): quick acceleration, a high top speed,
// snappy turns, variable jump height, coyote time and a jump buffer. Units are pixels and ticks
// (1/60 s); every game tunes its own numbers.
import { approach, moveX, moveY, onGround, type Body, type Solids } from "./physics";

export interface Tuning {
  maxRun: number;
  runAccel: number;
  /** Acceleration when pushing against your current direction. */
  turnAccel: number;
  groundFriction: number;
  airAccel: number;
  airFriction: number;
  gravity: number;
  maxFall: number;
  /** Upward speed of a jump (negative is up). */
  jumpSpeed: number;
  /** Letting go of jump cuts the rise to this speed. */
  jumpCut: number;
  /** Near the top of a held jump, gravity is gentler (a little hang time). */
  apexSpeed: number;
  apexGravity: number;
  /** Ticks after walking off a ledge when jumping still works. */
  coyoteTicks: number;
  /** Ticks a jump press is remembered before landing. */
  bufferTicks: number;
}

/** 16 px tiles: about 3 tiles of jump height and 4.5 tiles of jump distance at full speed. */
export const DEFAULT_TUNING: Tuning = {
  maxRun: 2.2,
  runAccel: 0.3,
  turnAccel: 0.55,
  groundFriction: 0.45,
  airAccel: 0.24,
  airFriction: 0.1,
  gravity: 0.34,
  maxFall: 5.4,
  jumpSpeed: -5.7,
  jumpCut: -1.8,
  apexSpeed: 0.8,
  apexGravity: 0.55,
  coyoteTicks: 5,
  bufferTicks: 6,
};

export interface Runner extends Body {
  grounded: boolean;
  coyote: number;
  buffer: number;
  /** Rising from a jump, with the button still held. */
  rising: boolean;
  /** Last tick's jump button (to spot new presses). */
  held: boolean;
  facing: 1 | -1;
}

export interface RunnerInput {
  left: boolean;
  right: boolean;
  jump: boolean;
}

export interface RunnerEvents {
  jumped: boolean;
  landed: boolean;
  /** Hit a ceiling (bonk). */
  bonked: boolean;
  /** Fall speed when landing (for dust and sounds). */
  impact: number;
}

export function createRunner(x: number, y: number, w: number, h: number): Runner {
  return { x, y, w, h, vx: 0, vy: 0, rx: 0, ry: 0, grounded: false, coyote: 0, buffer: 0, rising: false, held: false, facing: 1 };
}

/**
 * One tick of running and jumping. `carry` moves the runner without being its own speed
 * (a conveyor belt under its feet).
 */
export function stepRunner(r: Runner, input: RunnerInput, solids: Solids, t: Tuning = DEFAULT_TUNING, carry = 0): RunnerEvents {
  const events: RunnerEvents = { jumped: false, landed: false, bonked: false, impact: 0 };
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (dir !== 0) r.facing = dir as 1 | -1;

  // Horizontal: accelerate toward the target speed; turn harder; slide to a stop.
  if (dir !== 0) {
    const turning = r.vx !== 0 && Math.sign(r.vx) !== dir;
    const accel = r.grounded ? (turning ? t.turnAccel : t.runAccel) : turning ? t.airAccel * 1.4 : t.airAccel;
    // Faster than top speed (a launch, a jump off a moving belt)? In the air, holding that way keeps
    // the momentum; on the ground it eases back down.
    if (Math.abs(r.vx) > t.maxRun && Math.sign(r.vx) === dir) {
      if (r.grounded) r.vx = approach(r.vx, dir * t.maxRun, t.groundFriction);
    } else r.vx = approach(r.vx, dir * t.maxRun, accel);
  } else {
    r.vx = approach(r.vx, 0, r.grounded ? t.groundFriction : t.airFriction);
  }

  // Jumping: a press is buffered for a few ticks, and works for a few ticks after leaving a ledge.
  const pressed = input.jump && !r.held;
  r.held = input.jump;
  if (pressed) r.buffer = t.bufferTicks;
  if (r.buffer > 0 && r.coyote > 0) {
    r.vy = t.jumpSpeed;
    // Jumping off something moving takes its speed along.
    r.vx += carry;
    r.rising = true;
    r.buffer = 0;
    r.coyote = 0;
    r.grounded = false;
    events.jumped = true;
  }
  if (r.buffer > 0) r.buffer--;
  if (r.rising && (!input.jump || r.vy >= 0)) {
    if (!input.jump && r.vy < t.jumpCut) r.vy = t.jumpCut;
    r.rising = false;
  }

  // Gravity, gentler at the top of a held jump.
  const hang = input.jump && Math.abs(r.vy) < t.apexSpeed ? t.apexGravity : 1;
  r.vy = Math.min(t.maxFall, r.vy + t.gravity * hang);

  if (moveX(r, r.vx + carry, solids)) r.vx = 0;
  const falling = r.vy;
  if (moveY(r, r.vy, solids)) {
    if (falling > 0) {
      events.landed = !r.grounded;
      events.impact = falling;
    } else {
      events.bonked = true;
      r.rising = false;
    }
    r.vy = 0;
  }

  const wasGrounded = r.grounded;
  r.grounded = onGround(r, solids);
  if (r.grounded) {
    r.coyote = t.coyoteTicks;
    if (!wasGrounded && !events.landed) events.landed = true;
  } else if (r.coyote > 0) {
    r.coyote--;
  }
  return events;
}
