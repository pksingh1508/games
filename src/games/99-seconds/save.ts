// 99 Seconds' local save (Plan/03-99-seconds.md §3 "What persists", §12 "PersistentState"): for each chapter, your
// journal, the loop count and the room's memory (they survive reloads: only the room resets), how it went when you
// escaped, and your Single Loop records; total loops, the endings, achievements and the game's options.
import * as v from "valibot";
import { defineSave, type SaveDef } from "@/engine/save";
import { emptyProgress } from "./core/memory";
import { CHAPTERS, type ChapterId } from "./core/types";

const Count = v.pipe(v.number(), v.integer(), v.minValue(0));

const ProgressSchema = v.object({
  loops: Count,
  clues: v.record(v.string(), v.object({ loop: Count, at: Count })),
  stuck: Count,
  streak: Count,
  hints: v.record(v.string(), v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(3))),
  scratches: v.array(v.string()),
});

const ChapterRecord = v.object({
  progress: ProgressSchema,
  /** Times escaped. */
  done: Count,
  /** Loops it took the first time (the rank), and how many scratches you'd seen by then. */
  escapedIn: v.nullable(Count),
  hints: Count,
  /** Real time spent in the chapter (ms). */
  realMs: Count,
  /** The Single Loop challenge: tries, and the best escape (real ms, and seconds left when you got out). */
  single: v.object({ tries: Count, best: v.nullable(v.object({ realMs: Count, left: v.number() })) }),
});
export type ChapterRecord = v.InferOutput<typeof ChapterRecord>;

const NinetySaveV1 = v.object({
  v: v.literal(1),
  chapters: v.object(Object.fromEntries(CHAPTERS.map((c) => [c, ChapterRecord])) as Record<ChapterId, typeof ChapterRecord>),
  /** Every loop lived, story and challenges (Groundhog). */
  totalLoops: Count,
  endings: v.object({ true: Count, paradox: Count }),
  /** The credits (99 seconds of them) have run: the title knows you've been here before. */
  credits: v.boolean(),
  achievements: v.record(v.string(), v.number()),
  /** The most chronostasis gained in one loop (ms). */
  stretchBest: Count,
  prefs: v.object({
    /** Normal (the journal pauses time), Hardcore (no journal, nothing pauses) or Relaxed (150-second loops, reading pauses). */
    mode: v.picklist(["normal", "hardcore", "relaxed"]),
    /** Subtitles for the sounds that matter. */
    subtitles: v.boolean(),
  }),
});
export type NinetySave = v.InferOutput<typeof NinetySaveV1>;

export const emptyChapter = (): ChapterRecord => ({ progress: emptyProgress(), done: 0, escapedIn: null, hints: 0, realMs: 0, single: { tries: 0, best: null } });

export const defaultNinetySave = (): NinetySave => ({
  v: 1,
  chapters: Object.fromEntries(CHAPTERS.map((c) => [c, emptyChapter()])) as Record<ChapterId, ChapterRecord>,
  totalLoops: 0,
  endings: { true: 0, paradox: 0 },
  credits: false,
  achievements: {},
  stretchBest: 0,
  prefs: { mode: "normal", subtitles: true },
});

export const ninetySaveDefinition: SaveDef<NinetySave> = {
  key: "mfg:game:99-seconds",
  version: 1,
  schema: NinetySaveV1,
  defaults: defaultNinetySave,
};

export const ninetySave = defineSave<NinetySave>(ninetySaveDefinition);
