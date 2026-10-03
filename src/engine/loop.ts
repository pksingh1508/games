// The fixed-timestep game loop (Plan/gameStack.md §6.3). The simulation always advances in whole
// 1/60 s ticks using an accumulator, so physics plays out identically on 60, 90, 120 and 144 Hz
// screens; rendering gets the leftover fraction for interpolation. Long frames (a hitch, a tab
// switch) are clamped, so the game never tries to catch up hundreds of ticks.

export const TICK = 1 / 60;

/** The accumulator on its own: pure, so any frame cadence can be tested. */
export class Accumulator {
  private acc = 0;

  constructor(
    private readonly step = TICK,
    private readonly maxFrame = 0.25,
  ) {}

  /** A frame of `seconds` went by (at `speed`, e.g. 0.5 for slow motion): how many ticks to run. */
  advance(seconds: number, speed = 1): number {
    this.acc += Math.min(this.maxFrame, Math.max(0, seconds)) * speed;
    const ticks = Math.floor(this.acc / this.step + 1e-7);
    this.acc = Math.max(0, this.acc - ticks * this.step);
    return ticks;
  }

  /** How far into the next tick we are (0–1), for interpolated drawing. */
  get alpha(): number {
    return Math.min(1, this.acc / this.step);
  }

  reset() {
    this.acc = 0;
  }
}

export interface Loop {
  start(): void;
  stop(): void;
  readonly running: boolean;
}

export function createLoop({
  update,
  render,
  speed,
  step = TICK,
}: {
  /** One simulation tick. */
  update: () => void;
  /** Draw; `alpha` is the fraction of a tick since the last update. */
  render: (alpha: number) => void;
  /** Slow motion (assist modes): 1 is normal speed. */
  speed?: () => number;
  step?: number;
}): Loop {
  const acc = new Accumulator(step);
  let raf = 0;
  let last = 0;
  let running = false;

  const frame = (now: number) => {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const seconds = last ? (now - last) / 1000 : 0;
    last = now;
    const ticks = acc.advance(seconds, speed?.() ?? 1);
    for (let i = 0; i < ticks && running; i++) update();
    render(acc.alpha);
  };

  return {
    start() {
      if (running) return;
      running = true;
      last = 0;
      acc.reset();
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    get running() {
      return running;
    },
  };
}
