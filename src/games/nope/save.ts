// NOPE!'s local save (Plan/gameStack.md §5.5): episode progress, best scores, the NOPE count,
// achievements, and the current run (hearts, skip, stamps) so a run survives a reload.
import * as v from "valibot";
import { defineSave } from "@/engine/save";

export const EPISODE_IDS = [1, 2, 3, 4] as const;
export type EpisodeId = (typeof EPISODE_IDS)[number];

export const QUESTIONS_PER_EPISODE = 15;
export const MAX_HEARTS = 3;

const Count = v.pipe(v.number(), v.integer(), v.minValue(0));

export const ResultSchema = v.picklist(["first", "retry", "skip"]);
/** How a question went: right first time, right after a NOPE, or skipped with a fly. */
export type QuestionResult = v.InferOutput<typeof ResultSchema>;

const RunSchema = v.object({
  episode: v.picklist(EPISODE_IDS),
  /** Seeds the stamp wall, the skip flies and the boss variants. */
  seed: Count,
  /** Which try at this episode (0 = first). Bosses change slightly on later tries. */
  attempt: Count,
  /** The question being played (0–14). */
  index: v.pipe(Count, v.maxValue(QUESTIONS_PER_EPISODE - 1)),
  hearts: v.pipe(Count, v.maxValue(MAX_HEARTS)),
  /** Holding a skip (caught a fly). */
  skip: v.boolean(),
  results: v.array(ResultSchema),
  /** NOPEs per question id, this attempt. */
  fails: v.record(v.string(), Count),
  /** NOPEs this attempt. */
  nopes: Count,
  /** NOPEs this episode across attempts: the stamps on the wall. */
  wall: Count,
  /** Time spent this attempt, pauses excluded. */
  elapsedMs: Count,
});
export type Run = v.InferOutput<typeof RunSchema>;

const EpisodeRecordSchema = v.object({
  /** Finished attempts (cleared or out of hearts). */
  attempts: Count,
  clears: Count,
  bestScore: v.nullable(Count),
  bestTimeMs: v.nullable(Count),
  /** The emoji grid of the best clear. */
  bestGrid: v.nullable(v.string()),
  /** Cleared without losing a heart. */
  perfect: v.boolean(),
});
export type EpisodeRecord = v.InferOutput<typeof EpisodeRecordSchema>;

const NopeSaveV1 = v.object({
  v: v.literal(1),
  /** The highest episode you can play. */
  unlocked: v.pipe(Count, v.minValue(1), v.maxValue(EPISODE_IDS.length)),
  episodes: v.object({
    "1": EpisodeRecordSchema,
    "2": EpisodeRecordSchema,
    "3": EpisodeRecordSchema,
    "4": EpisodeRecordSchema,
  }),
  run: v.nullable(RunSchema),
  /** Things you did that later questions ask about (what you typed for the sky…). */
  memory: v.record(v.string(), v.string()),
  stats: v.object({
    /** Every NOPE, ever. */
    nopes: Count,
    flies: Count,
    /** Times you believed a winking Mr. Nope. */
    winkedAt: Count,
    correct: Count,
    firstTry: Count,
    /** "Wait" questions passed on the first try. */
    patience: v.array(v.string()),
    playMs: Count,
  }),
  /** NOPE! achievement id → unlock time. */
  achievements: v.record(v.string(), v.number()),
  prefs: v.object({ laughTrack: v.boolean() }),
  /** Saw the credits: NOPE'd Mr. Nope. */
  finished: v.boolean(),
});
export type NopeSave = v.InferOutput<typeof NopeSaveV1>;

const emptyRecord = (): EpisodeRecord => ({
  attempts: 0,
  clears: 0,
  bestScore: null,
  bestTimeMs: null,
  bestGrid: null,
  perfect: false,
});

export const defaultNopeSave = (): NopeSave => ({
  v: 1,
  unlocked: 1,
  episodes: { "1": emptyRecord(), "2": emptyRecord(), "3": emptyRecord(), "4": emptyRecord() },
  run: null,
  memory: {},
  stats: { nopes: 0, flies: 0, winkedAt: 0, correct: 0, firstTry: 0, patience: [], playMs: 0 },
  achievements: {},
  prefs: { laughTrack: true },
  finished: false,
});

export const nopeSave = defineSave<NopeSave>({
  key: "mfg:game:nope",
  version: 1,
  schema: NopeSaveV1,
  defaults: defaultNopeSave,
});

export const episodeKey = (id: EpisodeId) => String(id) as keyof NopeSave["episodes"];
