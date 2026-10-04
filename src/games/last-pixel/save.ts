// Last Pixel's local save (Plan/10-last-pixel.md §7, §14 "Progress and stars survive page reloads"): each
// level's clears, its best stars and times; the totals the trophies count; whether the logo's complete; and
// preferences (hunt assist, the magnifier's zoom, the detector's beeps).
import * as v from "valibot";
import { defineSave, type SaveDef } from "@/engine/save";

const Count = v.pipe(v.number(), v.integer(), v.minValue(0));

const LevelRecord = v.object({
  clears: Count,
  /** Best stars, as bits: 1 = 100%, 2 = the clean-up in time, 4 = Pix caught in under 10 seconds. */
  stars: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(7)),
  /** Fastest clean-up (ticks), or null. */
  bestClean: v.nullable(Count),
  /** Fastest hunt (ticks; without the hunt assist), or null. */
  bestHunt: v.nullable(Count),
});
export type LevelRecord = v.InferOutput<typeof LevelRecord>;

const LastPixelSaveV1 = v.object({
  v: v.literal(1),
  levels: v.record(v.string(), LevelRecord),
  achievements: v.record(v.string(), v.number()),
  stats: v.object({
    catches: Count,
    /** Caught in the net (Net Worth). */
    netCatches: Count,
    /** Dead pixels seen through by pausing. */
    outed: Count,
    playTicks: Count,
  }),
  /** The finale's done: Pix is the dot on the logo's "i". */
  finished: v.boolean(),
  prefs: v.object({
    /** Hunt assist (§11): a slower Pix, more shimmer, a bigger catch radius. */
    assist: v.boolean(),
    /** The magnifier's zoom. */
    zoom: v.picklist([2, 3, 4]),
    /** The detector's beeping (its ring always shows). */
    beeps: v.boolean(),
  }),
});
export type LastPixelSave = v.InferOutput<typeof LastPixelSaveV1>;

export const defaultLastPixelSave = (): LastPixelSave => ({
  v: 1,
  levels: {},
  achievements: {},
  stats: { catches: 0, netCatches: 0, outed: 0, playTicks: 0 },
  finished: false,
  prefs: { assist: false, zoom: 3, beeps: true },
});

export const emptyLevel = (): LevelRecord => ({ clears: 0, stars: 0, bestClean: null, bestHunt: null });

export const lastPixelSaveDefinition: SaveDef<LastPixelSave> = {
  key: "mfg:game:last-pixel",
  version: 1,
  schema: LastPixelSaveV1,
  defaults: defaultLastPixelSave,
};

export const lastPixelSave = defineSave<LastPixelSave>(lastPixelSaveDefinition);
