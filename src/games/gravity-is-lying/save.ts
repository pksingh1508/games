// Gravity Is Lying's local save (Plan/15-gravity-is-lying.md §7, §14; Plan/gameStack.md §5.5):
// per-room records (clears, deaths, best time, golden apples), totals, achievements, the ending and
// Truth Mode, and preferences. Progress and apples survive reloads; nothing leaves the device.
import * as v from "valibot";
import { defineSave, type SaveDef } from "@/engine/save";

const Count = v.pipe(v.number(), v.integer(), v.minValue(0));

const RoomRecord = v.object({
  clears: Count,
  deaths: Count,
  /** Best time in ticks (1/60 s), from clears without assist. */
  best: v.nullable(Count),
  /** Golden apples ever brought through the portal (bitmask of three), without assist. */
  apples: v.pipe(Count, v.maxValue(7)),
  /** Cleared in one visit without dying (Never Trusted the Arrow). */
  clean: v.boolean(),
  /** Cleared with the camera turning (reduce motion off: Ground Control). */
  rotated: v.boolean(),
  /** Only ever cleared with assist on (it still opens the next room). */
  assisted: v.boolean(),
});
export type RoomRecord = v.InferOutput<typeof RoomRecord>;

const Assist = v.object({
  /** The HUD arrow always tells the truth. */
  trueArrow: v.boolean(),
  /** Three-quarter speed. */
  slow: v.boolean(),
  /** Nothing kills you: you're put back where you last stood. */
  invincible: v.boolean(),
});
export type Assist = v.InferOutput<typeof Assist>;

export const CONTROL_MODES = ["newt", "screen"] as const;
export type ControlMode = (typeof CONTROL_MODES)[number];

const GravitySaveV1 = v.object({
  v: v.literal(1),
  rooms: v.record(v.string(), RoomRecord),
  deaths: Count,
  /** Ticks spent standing on ceilings (Upside Downer: ten minutes). */
  ceilingTicks: Count,
  achievements: v.record(v.string(), v.number()),
  /** Finished the game: Truth Mode is unlocked. */
  finished: v.boolean(),
  seen: v.object({
    /** The motion warning before Tilted Town. */
    motion: v.boolean(),
  }),
  stats: v.object({ playTicks: Count }),
  /** The room the map opens at. */
  last: v.nullable(v.string()),
  prefs: v.object({
    controls: v.picklist(CONTROL_MODES),
    assist: Assist,
    /** After the ending: Isaac tells the truth in every room. */
    truthMode: v.boolean(),
    /** Show the clock in every room. */
    clock: v.boolean(),
    touchSize: v.picklist(["s", "m", "l"]),
    /** Jump and flip on the left, walking on the right. */
    touchSwap: v.boolean(),
    /** Remapped keys (KeyboardEvent.code) per action; null: the defaults. */
    keys: v.nullable(v.record(v.string(), v.array(v.string()))),
  }),
});
export type GravitySave = v.InferOutput<typeof GravitySaveV1>;

export const NO_ASSIST: Assist = { trueArrow: false, slow: false, invincible: false };

export const defaultGravitySave = (): GravitySave => ({
  v: 1,
  rooms: {},
  deaths: 0,
  ceilingTicks: 0,
  achievements: {},
  finished: false,
  seen: { motion: false },
  stats: { playTicks: 0 },
  last: null,
  prefs: { controls: "newt", assist: { ...NO_ASSIST }, truthMode: false, clock: false, touchSize: "m", touchSwap: false, keys: null },
});

export const emptyRoomRecord = (): RoomRecord => ({ clears: 0, deaths: 0, best: null, apples: 0, clean: false, rotated: false, assisted: false });

export const gravitySaveDefinition: SaveDef<GravitySave> = {
  key: "mfg:game:gravity-is-lying",
  version: 1,
  schema: GravitySaveV1,
  defaults: defaultGravitySave,
};

export const gravitySave = defineSave<GravitySave>(gravitySaveDefinition);

/** Assist is on when any of its options is: no golden apples or best times while it is. */
export const assistOn = (assist: Assist) => assist.trueArrow || assist.slow || assist.invincible;
