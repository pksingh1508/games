// The Conductor and The Liar both fire eight quick commands at you, one every 1.75 beats.
// Each command has a window to act in; the short gap after it is free (taps there don't count).
import { Verdict } from "../kit";

export const COMMANDS = 8;
export const FIRST = 1.5;
export const GAP = 1.75;
export const OPEN = 1.55;

export const commandAt = (k: number) => FIRST + k * GAP;

/** The command whose window contains `b`, or -1 between windows. */
export function windowAt(b: number): number {
  const k = Math.floor((b - FIRST) / GAP);
  if (k < 0 || k >= COMMANDS) return -1;
  return b - commandAt(k) < OPEN ? k : -1;
}

/** The latest command shown at `b` (it stays up until the next one), or -1 before the first. */
export function shownAt(b: number): number {
  if (b < FIRST) return -1;
  return Math.min(COMMANDS - 1, Math.floor((b - FIRST) / GAP));
}

/**
 * Judges a run of commands: `must[k]` says whether command k wants a tap. A tap in a "don't"
 * window loses at once; a "tap" window that closes untouched loses (a moment later, since taps
 * can arrive a frame late). Everything right: a win at the end.
 */
export function commandJudge(must: boolean[], emit: { good(): void; bad(): void }) {
  const tapped = must.map(() => false);
  const verdict = new Verdict();
  const end = commandAt(COMMANDS - 1) + OPEN;

  return {
    verdict,
    tapped,
    tap(b: number) {
      if (verdict.decided) return;
      const k = windowAt(b);
      if (k < 0) return;
      if (!must[k]) {
        emit.bad();
        verdict.lose(b);
      } else if (!tapped[k]) {
        tapped[k] = true;
        emit.good();
      }
    },
    update(b: number) {
      if (verdict.decided) return;
      for (let k = 0; k < COMMANDS; k++) {
        if (must[k] && !tapped[k] && b > commandAt(k) + OPEN + 0.12) {
          emit.bad();
          verdict.lose(commandAt(k) + OPEN);
          return;
        }
      }
      if (b > end + 0.12) verdict.win(end);
    },
    plan: () => must.flatMap((m, k) => (m ? [commandAt(k) + 0.5] : [])),
  };
}
