// Panic Stack's local save (Plan/11-panic-stack.md §7, Plan/gameStack.md §5.5 "Stars, endless records"): each
// level's best stars and time, the Endless and Daily Stack records, what you've met (the item guide), totals for
// the trophies, and preferences (Zen, the slow belt, hold-to-drop, rotation buttons, reduce shake).
import * as v from "valibot";
import { defineSave, type SaveDef } from "@/engine/save";

const Count = v.pipe(v.number(), v.integer(), v.minValue(0));

const LevelRecord = v.object({
  clears: Count,
  /** Best stars, as bits: 1 cleared, 2 nothing fell, 4 more than half the time left. */
  stars: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(7)),
  /** Fastest clear (ticks), not counting Zen. */
  best: v.nullable(Count),
  /** Cleared without using Oops / without breaking anything (at least once). */
  noOops: v.boolean(),
  noBreak: v.boolean(),
});
export type LevelRecord = v.InferOutput<typeof LevelRecord>;

const PanicStackSaveV1 = v.object({
  v: v.literal(1),
  levels: v.record(v.string(), LevelRecord),
  achievements: v.record(v.string(), v.number()),
  stats: v.object({
    placed: Count,
    fallen: Count,
    broken: Count,
    /** Fake panics lived through without anything falling (Didn't Fall For It). */
    fakePanics: Count,
    taps: Count,
    oopses: Count,
    playTicks: Count,
  }),
  /** Endless Tower: the best height (m) and how many towers. */
  endless: v.object({ best: v.pipe(v.number(), v.minValue(0)), runs: Count }),
  /** The Daily Stack, by UTC date: your best height that day. */
  daily: v.record(v.string(), v.object({ height: v.pipe(v.number(), v.minValue(0)), tries: Count })),
  /** Items and events you've come across (the guide), and liars you've found out (put one down). */
  seen: v.record(v.string(), v.number()),
  known: v.record(v.string(), v.number()),
  prefs: v.object({
    /** Zen (§11): no timer, no events, no fail. */
    zen: v.boolean(),
    /** Slow conveyor assist (§11). */
    slowBelt: v.boolean(),
    /** Hold-to-drop (§11): lifting your finger keeps hold; a button drops it. */
    holdToDrop: v.boolean(),
    /** The turn buttons: on phones by default. */
    rotateButtons: v.picklist(["auto", "on", "off"]),
    /** Earthquakes don't shake the screen (they still shake the tower). */
    reduceShake: v.boolean(),
  }),
});
export type PanicStackSave = v.InferOutput<typeof PanicStackSaveV1>;

export const defaultPanicStackSave = (): PanicStackSave => ({
  v: 1,
  levels: {},
  achievements: {},
  stats: { placed: 0, fallen: 0, broken: 0, fakePanics: 0, taps: 0, oopses: 0, playTicks: 0 },
  endless: { best: 0, runs: 0 },
  daily: {},
  seen: {},
  known: {},
  prefs: { zen: false, slowBelt: false, holdToDrop: false, rotateButtons: "auto", reduceShake: false },
});

export const emptyLevel = (): LevelRecord => ({ clears: 0, stars: 0, best: null, noOops: false, noBreak: false });

export const panicStackSaveDefinition: SaveDef<PanicStackSave> = {
  key: "mfg:game:panic-stack",
  version: 1,
  schema: PanicStackSaveV1,
  defaults: defaultPanicStackSave,
};

export const panicStackSave = defineSave<PanicStackSave>(panicStackSaveDefinition);
