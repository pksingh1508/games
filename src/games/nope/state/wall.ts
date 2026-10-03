// The stamp wall: every NOPE leaves a stamp on the stage for the rest of the episode
// (Plan/02-nope.md §3). Positions come from the run's seed, so the wall looks the same after a
// reload, and stamps sit in a jittered grid so they never pile up and can always be counted.
import { createRng, shuffle } from "@/engine/rng";

/** At most this many stamps show at once; older ones make room for new ones. */
export const WALL_SLOTS = 20;

export interface WallStamp {
  /** Which NOPE this is (0 = the episode's first). */
  n: number;
  /** Centre, in % of the stage. */
  x: number;
  y: number;
  rotate: number;
  scale: number;
}

/** The stamps currently on the wall, oldest first. */
export function wallLayout(seed: number, count: number, portrait: boolean): WallStamp[] {
  const cols = portrait ? 4 : 5;
  const rows = WALL_SLOTS / cols;
  const order = shuffle(createRng(`wall:${seed}`), Array.from({ length: WALL_SLOTS }, (_, i) => i));
  const first = Math.max(0, count - WALL_SLOTS);
  const stamps: WallStamp[] = [];
  for (let n = first; n < count; n++) {
    const slot = order[n % WALL_SLOTS] ?? 0;
    const rng = createRng(`stamp:${seed}:${n}`);
    const col = slot % cols;
    const row = Math.floor(slot / cols);
    const cellW = 92 / cols;
    // Above the bottom of the stage, where "count the stamps" questions put their card.
    const top = 13;
    const cellH = ((portrait ? 54 : 72) - top) / rows;
    stamps.push({
      n,
      x: 4 + (col + 0.5 + (rng() - 0.5) * 0.4) * cellW,
      y: top + (row + 0.5 + (rng() - 0.5) * 0.4) * cellH,
      rotate: -24 + rng() * 48,
      scale: 0.85 + rng() * 0.3,
    });
  }
  return stamps;
}

/** How many stamps are on screen right now (what "count the stamps" questions ask for). */
export const visibleStamps = (count: number) => Math.min(count, WALL_SLOTS);
