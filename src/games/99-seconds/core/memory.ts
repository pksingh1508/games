// What a chapter remembers between loops (Plan/03-99-seconds.md §3 "What persists", "Room memory"): your journal
// (every clue, with the loop and the second you found it), the loop count, and the room's memory: scratches in
// your own handwriting that appear when you've gone a while without learning anything. Pure functions.
import type { ChapterDef, Goal } from "./types";

export interface ChapterProgress {
  /** Loops lived through in this chapter (the one you're in is loops + 1). */
  loops: number;
  /** The journal: clue → when you found it. */
  clues: Record<string, { loop: number; at: number }>;
  /** How much the room thinks you're struggling: +1 a loop without a new clue, −5 for one with. */
  stuck: number;
  /** Loops in a row without a new clue (the room's colour drains; it comes back the moment you learn something). */
  streak: number;
  /** How far each goal's scratches have got (1–3). */
  hints: Record<string, number>;
  /** The scratches on the wall, in the order they appeared. */
  scratches: string[];
}

export const emptyProgress = (): ChapterProgress => ({ loops: 0, clues: {}, stuck: 0, streak: 0, hints: {}, scratches: [] });

/** Scratches appear after this many loops of being stuck: something vague, then clearer, then plain. */
export const HINT_AT = [5, 10, 15] as const;

export const stageFor = (stuck: number) => (stuck >= HINT_AT[2] ? 3 : stuck >= HINT_AT[1] ? 2 : stuck >= HINT_AT[0] ? 1 : 0);

/** The goal the room is helping with now: the first one you haven't done. */
export function currentGoal(chapter: ChapterDef, known: ReadonlySet<string>): Goal | null {
  return chapter.goals.find((g) => !known.has(g.done)) ?? null;
}

/** Clues found during a loop go straight into the journal (so a reload keeps them). */
export function recordClues(progress: ChapterProgress, found: ReadonlyArray<{ id: string; at: number }>): ChapterProgress {
  const fresh = found.filter((f) => !progress.clues[f.id]);
  if (fresh.length === 0) return progress;
  const clues = { ...progress.clues };
  for (const f of fresh) clues[f.id] = { loop: progress.loops + 1, at: f.at };
  return { ...progress, clues };
}

/** A loop is over (reset or escape): count it, and let the room remember how it went. */
export function endLoop(chapter: ChapterDef, progress: ChapterProgress, learned: boolean): ChapterProgress {
  const stuck = learned ? Math.max(0, progress.stuck - 5) : progress.stuck + 1;
  const next: ChapterProgress = { ...progress, loops: progress.loops + 1, stuck, streak: learned ? 0 : progress.streak + 1 };
  const goal = currentGoal(chapter, new Set(Object.keys(progress.clues)));
  if (!goal) return next;
  const before = progress.hints[goal.id] ?? 0;
  const stage = Math.max(before, stageFor(stuck));
  if (stage === before) return next;
  const scratches = [...progress.scratches];
  for (let k = before + 1; k <= stage; k++) scratches.push(goal.stages[k - 1]!);
  return { ...next, hints: { ...progress.hints, [goal.id]: stage }, scratches };
}

/** How washed-out the room looks: full colour, draining with each loop in a row without progress. */
export const saturation = (streak: number) => Math.max(0.35, 1 - 0.07 * streak);
