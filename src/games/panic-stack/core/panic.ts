// The panic meter (Plan/11-panic-stack.md §3 "The panic meter"), 0–100. Pure: the simulation tells it what
// happened, it says how panicked you are. At 100% a big real event hits (with a real siren) and it drops back.

export const PANIC = {
  /** An item falls. */
  fall: 15,
  /** An event hits. */
  hit: 8,
  /** An event ends and nothing fell during it. */
  survived: -8,
  /** An item put down gently. */
  gentle: -6,
  /** Per second, while the tower stays still (after two seconds of it). */
  calm: -4,
  /** Per second, in the last 30% of the time, and again in the last 12%. */
  late: 2.5,
  later: 4,
  /** Per second, at most, from the tower wobbling. */
  wobble: 8,
  /** Where it drops back to after a PANIC!. */
  after: 60,
} as const;

export interface PanicInput {
  /** The fraction of the time left (1 when there's no limit). */
  timeLeft: number;
  /** The tower's movement: kinetic energy (J) of the tower's items. */
  energy: number;
  /** Seconds the tower's been still. */
  stillFor: number;
}

/** One tick's drift (per-second rates over 60 ticks). */
export function drift(panic: number, input: PanicInput): number {
  let rate = 0;
  if (input.timeLeft < 0.3) rate += PANIC.late;
  if (input.timeLeft < 0.12) rate += PANIC.later;
  rate += Math.min(PANIC.wobble, input.energy * 1.5);
  if (input.stillFor >= 2) rate += PANIC.calm;
  return clampPanic(panic + rate / 60);
}

export const clampPanic = (p: number) => Math.max(0, Math.min(100, p));
