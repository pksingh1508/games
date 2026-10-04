// Cursor Escape's local save (Plan/12-cursor-escape.md §7; Plan/gameStack.md §5.5): each level's clears,
// crashes, best time and medal; the totals the trophies count; whether you've calibrated the mouse and
// seen the ending; and preferences (sensitivity, trackpad mode, steady mode, the forgiving hitbox).
import * as v from "valibot";
import { defineSave, type SaveDef } from "@/engine/save";

const Count = v.pipe(v.number(), v.integer(), v.minValue(0));
const Speed = v.pipe(v.number(), v.minValue(0.2), v.maxValue(5));

const LevelRecord = v.object({
  clears: Count,
  crashes: Count,
  /** Best time (ticks), unassisted; null: not yet. */
  best: v.nullable(Count),
  medal: v.nullable(v.picklist(["gold", "silver", "bronze"])),
  /** Cleared in one go, without a crash (Steady Hand). */
  clean: v.boolean(),
});
export type LevelRecord = v.InferOutput<typeof LevelRecord>;

const CursorSaveV1 = v.object({
  v: v.literal(1),
  levels: v.record(v.string(), LevelRecord),
  crashes: Count,
  achievements: v.record(v.string(), v.number()),
  /** The pointer speed has been set (the first-run calibration). */
  calibrated: v.boolean(),
  /** The ending's been seen. */
  finished: v.boolean(),
  stats: v.object({
    /** Inverted or rotated stretches got through without crashing (Ambidextrous). */
    turnedClean: Count,
    playTicks: Count,
  }),
  prefs: v.object({
    /** Pointer speed with the mouse captured. */
    sensitivity: Speed,
    /** Pointer speed in trackpad mode. */
    trackpadSensitivity: Speed,
    /** Drag instead of capturing the mouse (on a computer). */
    trackpad: v.boolean(),
    /** Raw mouse movement, without the system's acceleration (where the browser can). */
    raw: v.boolean(),
    /** Gentler sabotage (comfort). */
    steady: v.boolean(),
    /** A forgiving hitbox: just the very tip (assist: no medals). */
    assist: v.boolean(),
  }),
});
export type CursorSave = v.InferOutput<typeof CursorSaveV1>;

export const defaultCursorSave = (): CursorSave => ({
  v: 1,
  levels: {},
  crashes: 0,
  achievements: {},
  calibrated: false,
  finished: false,
  stats: { turnedClean: 0, playTicks: 0 },
  prefs: { sensitivity: 1, trackpadSensitivity: 1.2, trackpad: false, raw: false, steady: false, assist: false },
});

export const emptyLevel = (): LevelRecord => ({ clears: 0, crashes: 0, best: null, medal: null, clean: false });

export const cursorSaveDefinition: SaveDef<CursorSave> = {
  key: "mfg:game:cursor-escape",
  version: 1,
  schema: CursorSaveV1,
  defaults: defaultCursorSave,
};

export const cursorSave = defineSave<CursorSave>(cursorSaveDefinition);
