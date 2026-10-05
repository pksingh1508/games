// Don't Blink's local save (Plan/14-dont-blink.md §12 "Saving: nights unlocked, best Endless score, settings"):
// each night's clears and best rank, the Endless record, your Custom Night, achievements, lifetime totals (for
// the trophies), whether you've seen the ending, and the game's own options.
import * as v from "valibot";
import { defineSave, type SaveDef } from "@/engine/save";
import { DEFAULT_CUSTOM } from "./core/nights";

const Count = v.pipe(v.number(), v.integer(), v.minValue(0));

const NightRecord = v.object({
  tries: Count,
  clears: Count,
  /** The best rank at 6 AM (null until it's been survived). */
  best: v.nullable(v.picklist(["hawk-eye", "night-owl", "sleepy"])),
  /** Survived with no false reports (at least once). */
  perfect: v.boolean(),
});
export type NightRecord = v.InferOutput<typeof NightRecord>;

const CustomSchema = v.object({
  blink: v.pipe(v.number(), v.minValue(2), v.maxValue(8)),
  visitor: v.pipe(v.number(), v.minValue(0), v.maxValue(1)),
  rate: v.pipe(v.number(), v.minValue(1), v.maxValue(10)),
  subtlety: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(5)),
  staticBlink: v.boolean(),
  fakeBlink: v.boolean(),
  gradual: v.boolean(),
  office: v.boolean(),
  mirror: v.boolean(),
});

const DontBlinkSaveV1 = v.object({
  v: v.literal(1),
  /** By night number, "1" to "5". */
  nights: v.record(v.string(), NightRecord),
  /** Endless Night: the most hours survived, and how many nights. */
  endless: v.object({ best: v.pipe(v.number(), v.minValue(0)), runs: Count }),
  custom: CustomSchema,
  achievements: v.record(v.string(), v.number()),
  stats: v.object({
    shifts: Count,
    reported: Count,
    falseReports: Count,
    /** Times the Visitor was sent back to its pedestal (Statue of Limitations). */
    visitorHome: Count,
    /** Count anomalies caught (Counted It). */
    counts: Count,
  }),
  /** Saw the ending (Night 5's morning) and the photo after it. */
  ending: v.boolean(),
  prefs: v.object({
    /** Assist mode (§11): unlimited reference photos, slower blinks, no credibility penalty. */
    assist: v.boolean(),
    /** Captions for the important sounds (§11). */
    captions: v.boolean(),
    /** Colour-change anomalies (§11: off for colourblind players; other changes take their place). */
    colourChanges: v.boolean(),
    /** The photosensitivity notice has been read (it comes before the first night). */
    noticeSeen: v.boolean(),
  }),
});
export type DontBlinkSave = v.InferOutput<typeof DontBlinkSaveV1>;

export const defaultDontBlinkSave = (): DontBlinkSave => ({
  v: 1,
  nights: {},
  endless: { best: 0, runs: 0 },
  custom: { ...DEFAULT_CUSTOM },
  achievements: {},
  stats: { shifts: 0, reported: 0, falseReports: 0, visitorHome: 0, counts: 0 },
  ending: false,
  prefs: { assist: false, captions: true, colourChanges: true, noticeSeen: false },
});

export const emptyNight = (): NightRecord => ({ tries: 0, clears: 0, best: null, perfect: false });

export const dontBlinkSaveDefinition: SaveDef<DontBlinkSave> = {
  key: "mfg:game:dont-blink",
  version: 1,
  schema: DontBlinkSaveV1,
  defaults: defaultDontBlinkSave,
};

export const dontBlinkSave = defineSave<DontBlinkSave>(dontBlinkSaveDefinition);
