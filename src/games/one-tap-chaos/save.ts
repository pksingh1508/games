// One Tap Chaos's local save (Plan/gameStack.md §5.5): high score, unlocks, daily result, stats
// and preferences. The tap-timing calibration lives in the arcade's global settings instead.
import * as v from "valibot";
import { defineSave } from "@/engine/save";
import { CARD_ORDER } from "./rules";

const Count = v.pipe(v.number(), v.integer(), v.minValue(0));

const DailySchema = v.object({
  /** The local date, YYYY-MM-DD. */
  key: v.string(),
  number: Count,
  best: Count,
  attempts: Count,
  bosses: Count,
  diedTo: v.nullable(v.string()),
});
export type DailyRecord = v.InferOutput<typeof DailySchema>;

const OtcSaveV1 = v.object({
  v: v.literal(1),
  /** Best score in a normal run: it unlocks microgames. */
  best: Count,
  bestStreak: Count,
  runs: Count,
  /** Chaos Cards met so far, in order (0–8). */
  cardsUnlocked: v.pipe(Count, v.maxValue(CARD_ORDER.length)),
  /** Bosses you've reached (and can practise). */
  bossesSeen: v.array(v.string()),
  /** Microgames you've played at least once. */
  seen: v.array(v.string()),
  daily: v.nullable(DailySchema),
  stats: v.object({
    cleared: Count,
    failed: Count,
    /** Taps on DON'T!'s button (the fly). */
    flySwats: Count,
    /** "Don't tap" rounds passed in a row, across runs. */
    refrainStreak: Count,
    bossesBeaten: Count,
    playMs: Count,
  }),
  /** Practice room wins and losses per microgame. */
  practice: v.record(v.string(), v.object({ wins: Count, losses: Count })),
  achievements: v.record(v.string(), v.number()),
  prefs: v.object({
    /** Cap the tempo at 120 BPM. */
    reducedSpeed: v.boolean(),
    /** A ring that pulses on every beat. */
    visualBeat: v.boolean(),
    /** Show what the sound cues are (for Silent rounds). */
    captions: v.boolean(),
    /** Hold to pump in PUMP! instead of tapping fast. */
    holdMode: v.boolean(),
  }),
  /** The calibration screen has been offered once. */
  calibrationOffered: v.boolean(),
});
export type OtcSave = v.InferOutput<typeof OtcSaveV1>;

export const defaultOtcSave = (): OtcSave => ({
  v: 1,
  best: 0,
  bestStreak: 0,
  runs: 0,
  cardsUnlocked: 0,
  bossesSeen: [],
  seen: [],
  daily: null,
  stats: { cleared: 0, failed: 0, flySwats: 0, refrainStreak: 0, bossesBeaten: 0, playMs: 0 },
  practice: {},
  achievements: {},
  prefs: { reducedSpeed: false, visualBeat: false, captions: false, holdMode: false },
  calibrationOffered: false,
});

export const otcSave = defineSave<OtcSave>({
  key: "mfg:game:one-tap-chaos",
  version: 1,
  schema: OtcSaveV1,
  defaults: defaultOtcSave,
});
