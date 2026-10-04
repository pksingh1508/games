// Fake Floor's local save (Plan/05-fake-floor.md §7, Plan/gameStack.md §5.5): per-room records
// (clears, falls, pebbles, best time, the three medals, the hidden pebble), totals, time trials,
// achievements and preferences.
import * as v from "valibot";
import { defineSave } from "@/engine/save";

const Count = v.pipe(v.number(), v.integer(), v.minValue(0));

const RoomRecord = v.object({
  clears: Count,
  falls: Count,
  /** Pebbles thrown in this room, ever. */
  thrown: Count,
  /** Best time in ticks (1/60 s), from runs without assist. */
  best: v.nullable(Count),
  /** Medals (Plan §7): no falls, no pebbles, under par. Each is kept once earned. */
  clean: v.boolean(),
  barefoot: v.boolean(),
  quick: v.boolean(),
  /** Only ever cleared with assist on (it still opens the next room). */
  assisted: v.boolean(),
  /** Found this room's hidden pebble. */
  hidden: v.boolean(),
});
export type RoomRecord = v.InferOutput<typeof RoomRecord>;

const TrialRecord = v.object({
  runs: Count,
  /** Best total, in ticks. */
  best: v.nullable(Count),
  /** The best run's time at each door (ticks since the start). */
  splits: v.array(Count),
  /** The best run's falls and pebbles. */
  falls: v.nullable(Count),
  thrown: v.nullable(Count),
});
export type TrialRecord = v.InferOutput<typeof TrialRecord>;

const Assist = v.object({
  /** Game speed: 1 or 0.75 (Plan §11). */
  speed: v.picklist([1, 0.75]),
  /** Pebbles never run out. */
  unlimited: v.boolean(),
  /** A safety net under everything. */
  nets: v.boolean(),
});
export type Assist = v.InferOutput<typeof Assist>;

const FakeFloorSaveV1 = v.object({
  v: v.literal(1),
  rooms: v.record(v.string(), RoomRecord),
  falls: Count,
  /** Falls through floors that lied (fake, mimic, painted, return-trip, flipping): the closing line. */
  fakeFalls: Count,
  thrown: Count,
  /** Falls by what you fell through: "fake", "crumble", "gap"… */
  causes: v.record(v.string(), Count),
  /** Keyed by world: "1"–"5". */
  trials: v.record(v.string(), TrialRecord),
  achievements: v.record(v.string(), v.number()),
  /** Time spent in rooms (ticks), for the ending. */
  stats: v.object({ playTicks: Count }),
  /** The room the map opens at. */
  last: v.nullable(v.string()),
  prefs: v.object({
    /** Exaggerate every tell (Plan §11): thicker grout, bigger splashes, darker shadows. */
    highContrast: v.boolean(),
    /** Show a clock in every room (time trials always do). */
    clock: v.boolean(),
    assist: Assist,
    touchSize: v.picklist(["s", "m", "l"]),
    /** Jump on the left, arrows on the right. */
    touchSwap: v.boolean(),
    /** Remapped keys (KeyboardEvent.code) per action; null: the defaults. */
    keys: v.nullable(v.record(v.string(), v.array(v.string()))),
  }),
});
export type FakeFloorSave = v.InferOutput<typeof FakeFloorSaveV1>;

export const NO_ASSIST: Assist = { speed: 1, unlimited: false, nets: false };

export const defaultFakeFloorSave = (): FakeFloorSave => ({
  v: 1,
  rooms: {},
  falls: 0,
  fakeFalls: 0,
  thrown: 0,
  causes: {},
  trials: {},
  achievements: {},
  stats: { playTicks: 0 },
  last: null,
  prefs: { highContrast: false, clock: false, assist: { ...NO_ASSIST }, touchSize: "m", touchSwap: false, keys: null },
});

export const emptyRoomRecord = (): RoomRecord => ({
  clears: 0,
  falls: 0,
  thrown: 0,
  best: null,
  clean: false,
  barefoot: false,
  quick: false,
  assisted: false,
  hidden: false,
});

export const fakeFloorSave = defineSave<FakeFloorSave>({
  key: "mfg:game:fake-floor",
  version: 1,
  schema: FakeFloorSaveV1,
  defaults: defaultFakeFloorSave,
});

/** Assist is on when any of its options is. */
export const assistOn = (assist: Assist) => assist.speed < 1 || assist.unlimited || assist.nets;
