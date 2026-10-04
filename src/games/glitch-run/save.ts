// Glitch Run's local save (Plan/07-glitch-run.md §7, §14; Plan/gameStack.md §5.5): story stages
// (clears, best scores, clean clears), endless and daily bests, the totals the trophies count,
// whether you've seen the photosensitivity warning, the ending you chose, and preferences.
import * as v from "valibot";
import { defineSave, type SaveDef } from "@/engine/save";

const Count = v.pipe(v.number(), v.integer(), v.minValue(0));

const StageRecord = v.object({
  clears: Count,
  deaths: Count,
  best: Count,
  /** Cleared without using Glitch (Clean Code). */
  clean: v.boolean(),
});
export type StageRecord = v.InferOutput<typeof StageRecord>;

const GlitchSaveV1 = v.object({
  v: v.literal(1),
  stages: v.record(v.string(), StageRecord),
  endless: v.object({ runs: Count, best: Count, metres: Count }),
  /** Daily Corruption bests, by UTC day ("2026-10-04"). */
  daily: v.record(v.string(), v.object({ best: Count, metres: Count, runs: Count })),
  totals: v.object({
    runs: Count,
    deaths: Count,
    metres: Count,
    clips: Count,
    panics: Count,
    tears: Count,
  }),
  achievements: v.record(v.string(), v.number()),
  /** The photosensitivity warning has been read. */
  warned: v.boolean(),
  /** The ending: null until you get there; then what you chose. */
  ending: v.nullable(v.picklist(["fixed", "wontfix"])),
  prefs: v.object({
    /** Every glitch at 30% (comfort). */
    gentle: v.boolean(),
    /** The visual beat bar (on by default: it's the cues, drawn). */
    beatBar: v.boolean(),
    /** Touch: jump on the left half, slide on the right (swapped). */
    touchSwap: v.boolean(),
    /** Remapped keys (KeyboardEvent.code) per action; null: the defaults. */
    keys: v.nullable(v.record(v.string(), v.array(v.string()))),
  }),
});
export type GlitchSave = v.InferOutput<typeof GlitchSaveV1>;

export const defaultGlitchSave = (): GlitchSave => ({
  v: 1,
  stages: {},
  endless: { runs: 0, best: 0, metres: 0 },
  daily: {},
  totals: { runs: 0, deaths: 0, metres: 0, clips: 0, panics: 0, tears: 0 },
  achievements: {},
  warned: false,
  ending: null,
  prefs: { gentle: false, beatBar: true, touchSwap: false, keys: null },
});

export const emptyStage = (): StageRecord => ({ clears: 0, deaths: 0, best: 0, clean: false });

export const glitchSaveDefinition: SaveDef<GlitchSave> = {
  key: "mfg:game:glitch-run",
  version: 1,
  schema: GlitchSaveV1,
  defaults: defaultGlitchSave,
};

export const glitchSave = defineSave<GlitchSave>(glitchSaveDefinition);
