// What a loop does to the save, and which trophies it earns (Plan/03-99-seconds.md §7). Pure functions.
import { STRETCH_MAX_MS, type LoopResult } from "./core/loop";
import { endLoop, recordClues } from "./core/memory";
import { CHAPTERS, type ChapterId } from "./core/types";
import { CHAPTER_DEFS } from "./rooms";
import type { NinetySave } from "./save";

export type AchievementId = "first-try" | "groundhog" | "a-watched-pot" | "clockwatcher" | "closed-loop" | "paradox";

export type Rank = "time-lord" | "clockwatcher" | "groundhog";

export const RANK_NAMES: Record<Rank, string> = { "time-lord": "Time Lord", clockwatcher: "Clockwatcher", groundhog: "Groundhog" };

/** Ranks by loops (§7): Time Lord in 5 or fewer, Clockwatcher in 6–15, Groundhog in 16 or more. */
export const rankFor = (loops: number): Rank => (loops <= 5 ? "time-lord" : loops <= 15 ? "clockwatcher" : "groundhog");

/** Loops lived for Groundhog. */
export const GROUNDHOG = 50;

export const isDone = (save: NinetySave, id: ChapterId) => save.chapters[id].done > 0;

/** Chapters open one after another. */
export const isOpen = (save: NinetySave, id: ChapterId) => {
  const i = CHAPTERS.indexOf(id);
  return i === 0 || isDone(save, CHAPTERS[i - 1]!);
};

/** The story's next chapter (null once the loop has closed). */
export const storyChapter = (save: NinetySave): ChapterId | null => CHAPTERS.find((c) => !isDone(save, c)) ?? null;

/** Clues found mid-loop go straight into the journal (a reload keeps them). */
export function noteClues(save: NinetySave, id: ChapterId, found: ReadonlyArray<{ id: string; at: number }>): NinetySave {
  const progress = recordClues(save.chapters[id].progress, found);
  if (progress === save.chapters[id].progress) return save;
  return { ...save, chapters: { ...save.chapters, [id]: { ...save.chapters[id], progress } } };
}

export interface LoopReport {
  chapter: ChapterId;
  result: LoopResult;
  found: ReadonlyArray<{ id: string; at: number }>;
  /** Chronostasis gained this loop (ms). */
  stretched: number;
  /** Stared at a heating pot for a whole minute. */
  stared: boolean;
  realMs: number;
  /** A Single Loop challenge (doesn't move the story's loop count). */
  single?: { left: number };
}

/** A loop is over: count it, let the room remember, and see what it earned. */
export function loopEnded(save: NinetySave, r: LoopReport) {
  const unlock: AchievementId[] = [];
  const before = save.chapters[r.chapter];
  const escaped = r.result !== "reset";
  const totalLoops = save.totalLoops + 1;
  let chapter = { ...before, realMs: before.realMs + Math.round(r.realMs) };
  if (r.single) {
    const best = before.single.best;
    const got = escaped && r.result !== "paradox" ? { realMs: Math.round(r.realMs), left: r.single.left } : null;
    chapter = { ...chapter, single: { tries: before.single.tries + 1, best: got && (!best || got.realMs < best.realMs) ? got : best } };
  } else {
    let progress = recordClues(before.progress, r.found);
    const learned = progress !== before.progress;
    progress = endLoop(CHAPTER_DEFS[r.chapter], progress, learned);
    const finished = escaped && r.result !== "paradox";
    chapter = {
      ...chapter,
      progress,
      done: before.done + (finished ? 1 : 0),
      escapedIn: before.escapedIn ?? (finished ? progress.loops : null),
      hints: finished && before.escapedIn === null ? progress.scratches.length : before.hints,
    };
    // First Try (lol): out of Chapter 1 in the very first loop of a fresh save.
    if (finished && r.chapter === "waiting-room" && progress.loops === 1 && totalLoops === 1) unlock.push("first-try");
  }
  const endings = { ...save.endings };
  if (r.result === "true") {
    endings.true++;
    unlock.push("closed-loop");
  }
  if (r.result === "paradox") {
    endings.paradox++;
    unlock.push("paradox");
  }
  if (totalLoops >= GROUNDHOG) unlock.push("groundhog");
  if (r.stretched >= STRETCH_MAX_MS) unlock.push("clockwatcher");
  if (r.stared) unlock.push("a-watched-pot");
  const next: NinetySave = { ...save, totalLoops, endings, stretchBest: Math.max(save.stretchBest, r.stretched), chapters: { ...save.chapters, [r.chapter]: chapter } };
  return { save: next, unlock, escaped };
}

/** The 99 seconds of credits have run. */
export const creditsSeen = (save: NinetySave): NinetySave => (save.credits ? save : { ...save, credits: true });

/** Seconds and minutes, the way the journal writes them. */
export function realTime(ms: number) {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** The share card: nothing leaves the device unless you share it. */
export function shareText(chapter: number, title: string, loops: number, rank: Rank, url: string) {
  return `99 Seconds: Chapter ${chapter}, ${title}\n${"⏳".repeat(Math.min(12, loops))}\nOut in ${loops} loop${loops === 1 ? "" : "s"}. Rank: ${RANK_NAMES[rank]}.\n${url}`;
}
