// Scripted play (Plan/03-99-seconds.md §12 "Testing the puzzles"): a list of moves with a human pace, run through
// the real rules with a fake clock. Each chapter's golden path is one of these, and so is the tests' hint-reading
// player. A move costs time like a person's would: a click takes 0.4 s, a glance 0.25 s, and actions take as long
// as they take.
import type { Loop, LoopResult } from "./loop";
import type { ViewId } from "./types";

export type Step =
  /** Look at a wall or close-up (in the room's own terms: a mirrored room's west is its west). */
  | { look: ViewId }
  /** Click a hotspot (with an item in hand). Waits for the action to finish. */
  | { tap: string; use?: string }
  /** Type a code on the keypad, then press enter. */
  | { code: string }
  | { waitLeft: number }
  | { waitFlag: string }
  | { waitExtra: true };

export interface Pace {
  tap: number;
  look: number;
}

export const HUMAN: Pace = { tap: 400, look: 250 };

export interface Played {
  result: LoopResult | null;
  /** Time spent doing things (clicking, looking, actions), not waiting. */
  activeMs: number;
  /** Seconds left on the clock when the chapter ended (null: it didn't). */
  leftAtEnd: number | null;
  /** The step that didn't work (a tap that did nothing), if any. */
  failed: number | null;
}

const TICK = 16;

function pass(loop: Loop, ms: number) {
  loop.tick(ms);
  loop.events.length = 0;
}

/** The loop's over (read fresh: actions and events change it behind TypeScript's back). */
const over = (loop: Loop) => loop.status === "over";

/** Wait, in small ticks, until `done` (or the loop is over). */
function waitFor(loop: Loop, done: () => boolean) {
  while (!over(loop) && !done()) pass(loop, TICK);
}

/** Play a script through a loop, then let the loop run to its end. */
export function play(loop: Loop, steps: readonly Step[], pace: Pace = HUMAN, { toTheEnd = true } = {}): Played {
  let active = 0;
  let failed: number | null = null;
  let left: number | null = null;
  const spend = (ms: number) => {
    active += ms;
    pass(loop, ms);
  };
  for (let i = 0; i < steps.length && !over(loop); i++) {
    const s = steps[i]!;
    if ("look" in s) {
      loop.look(loop.shownAs(s.look));
      spend(pace.look);
    } else if ("tap" in s) {
      const did = loop.interact(s.tap, s.use ?? null);
      if (did === "nothing") failed ??= i;
      spend(pace.tap);
      while (loop.action && !over(loop)) {
        const before = loop.elapsed;
        pass(loop, TICK);
        active += Math.max(TICK, loop.elapsed - before);
      }
    } else if ("code" in s) {
      for (const d of s.code) {
        if (loop.interact(`k${d}`) === "nothing") failed ??= i;
        spend(pace.tap);
      }
      if (loop.interact("kOK") === "nothing") failed ??= i;
      spend(pace.tap);
    } else if ("waitLeft" in s) waitFor(loop, () => loop.left <= s.waitLeft);
    else if ("waitFlag" in s) waitFor(loop, () => loop.flags.has(s.waitFlag));
    else waitFor(loop, () => loop.status === "extra");
    if (over(loop) && left === null) left = loop.left;
  }
  if (toTheEnd) waitFor(loop, () => false);
  if (over(loop) && left === null) left = loop.left;
  return { result: loop.result, activeMs: active, leftAtEnd: left, failed };
}
