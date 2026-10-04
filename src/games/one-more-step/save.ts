// One More Step's local save (Plan/01-one-more-step.md §7, §12 "Saving"): each level's best stars and steps,
// lifetime stats (steps, undos, deaths…), the trophies, whether the Start button's hopped away yet (it only
// does that once), and options.
import * as v from "valibot";
import { defineSave, type SaveDef } from "@/engine/save";

const Count = v.pipe(v.number(), v.integer(), v.minValue(0));

const LevelRecord = v.object({
  clears: Count,
  /** Best stars, as bits: 1 cleared, 2 within par, 4 the solver's own step count. */
  stars: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(7)),
  /** Fewest steps, or null. */
  best: v.nullable(Count),
});
export type LevelRecord = v.InferOutput<typeof LevelRecord>;

const OmsSaveV1 = v.object({
  v: v.literal(1),
  levels: v.record(v.string(), LevelRecord),
  achievements: v.record(v.string(), v.number()),
  stats: v.object({
    steps: Count,
    undos: Count,
    deaths: Count,
    /** Killed by your own echo (Echo Chamber). */
    echoDeaths: Count,
    /** The finale's "6-2, 6-3…": the most it went round. */
    resets: Count,
  }),
  /** The title's Start button has hopped away once (it only ever does it once). */
  hopped: v.boolean(),
  /** The finale's done. */
  finished: v.boolean(),
  prefs: v.object({
    /** The on-screen D-pad. */
    dpad: v.boolean(),
    /** How far a swipe goes before it counts (px). */
    swipe: v.pipe(v.number(), v.minValue(12), v.maxValue(64)),
    /** Grid coordinates on the edges. */
    coords: v.boolean(),
  }),
});
export type OmsSave = v.InferOutput<typeof OmsSaveV1>;

export const defaultOmsSave = (): OmsSave => ({
  v: 1,
  levels: {},
  achievements: {},
  stats: { steps: 0, undos: 0, deaths: 0, echoDeaths: 0, resets: 0 },
  hopped: false,
  finished: false,
  prefs: { dpad: false, swipe: 24, coords: false },
});

export const emptyLevel = (): LevelRecord => ({ clears: 0, stars: 0, best: null });

export const omsSaveDefinition: SaveDef<OmsSave> = {
  key: "mfg:game:one-more-step",
  version: 1,
  schema: OmsSaveV1,
  defaults: defaultOmsSave,
};

export const omsSave = defineSave<OmsSave>(omsSaveDefinition);
