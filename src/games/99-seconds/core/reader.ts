// The hint reader (Plan/03-99-seconds.md §10 rule 4: "Nobody stays stuck forever"): a player who works nothing out
// alone. Each loop it does only the parts of the golden path it has been told outright, by the room's plainest
// scratches (or that it has already done once), and otherwise stands facing the way it woke. If even it gets out,
// the room's memory is doing its job. Used by the tests.
import { CHAPTER_DEFS } from "../rooms";
import { SOLUTIONS } from "../rooms/solutions";
import { Loop } from "./loop";
import { emptyProgress, endLoop, recordClues, type ChapterProgress } from "./memory";
import { play } from "./script";
import type { ChapterId } from "./types";

export interface Read {
  loops: number;
  result: string | null;
  progress: ChapterProgress;
}

export function readHints(id: ChapterId, { seconds = 99, limit = 80 }: { seconds?: number; limit?: number } = {}): Read {
  const chapter = CHAPTER_DEFS[id];
  let progress = emptyProgress();
  for (let n = 1; n <= limit; n++) {
    const known = new Set(Object.keys(progress.clues));
    const knows = (goal: string) => {
      const g = chapter.goals.find((x) => x.id === goal)!;
      return known.has(g.done) || (progress.hints[goal] ?? 0) >= 3;
    };
    const loop = new Loop(chapter, { seconds, known });
    const steps = SOLUTIONS[id].filter((s) => knows(s.goal)).flatMap((s) => s.steps);
    play(loop, steps);
    progress = recordClues(progress, loop.found);
    progress = endLoop(chapter, progress, loop.found.length > 0);
    if (loop.result && loop.result !== "reset") return { loops: n, result: loop.result, progress };
  }
  return { loops: limit, result: null, progress };
}
