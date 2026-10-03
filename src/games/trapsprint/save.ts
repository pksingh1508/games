// TrapSprint's local save (Plan/gameStack.md §5.5): per-level records (deaths, best time, medal,
// coins, where you died), deaths by cause, zone speedruns, achievements and preferences.
// Ghosts (input recordings) are bigger, so they live in IndexedDB instead (core/ghosts.ts).
import * as v from "valibot";
import { defineSave } from "@/engine/save";

const Count = v.pipe(v.number(), v.integer(), v.minValue(0));

const LevelRecord = v.object({
  deaths: Count,
  clears: Count,
  /** Best time in ticks (1/60 s), from runs that can earn medals. */
  best: v.nullable(Count),
  medal: v.nullable(v.picklist(["dev", "gold", "silver", "bronze"])),
  /** Coins carried through the door at least once (bitmask). */
  coins: Count,
  /** Cleared with assist on (it still opens the next level). */
  assisted: v.boolean(),
  /** The latest death spots, packed as x * 512 + y (the skull markers). */
  marks: v.array(Count),
});
export type LevelRecord = v.InferOutput<typeof LevelRecord>;

const ZoneRunRecord = v.object({
  runs: Count,
  /** Best total in ticks. */
  best: v.nullable(Count),
  /** The best run's time at each door (ticks since the start). */
  splits: v.array(Count),
  /** Finished a zone run without dying (Untouchable). */
  deathless: v.boolean(),
});
export type ZoneRunRecord = v.InferOutput<typeof ZoneRunRecord>;

const Assist = v.object({
  /** Game speed: 1, 0.75 or 0.5. */
  speed: v.picklist([1, 0.75, 0.5]),
  /** After 10 deaths in a level, show where traps trigger. */
  reveal: v.boolean(),
  invincible: v.boolean(),
});
export type Assist = v.InferOutput<typeof Assist>;

const TrapSprintSaveV1 = v.object({
  v: v.literal(1),
  levels: v.record(v.string(), LevelRecord),
  deaths: Count,
  /** Deaths by cause: trap kinds, "spikes", "pit", "ghost". */
  causes: v.record(v.string(), Count),
  /** Clean jumps over painted spikes (Paranoid). */
  fakeHops: Count,
  /** Keyed by zone: "1", "2", "3", "R". */
  zoneRuns: v.record(v.string(), ZoneRunRecord),
  achievements: v.record(v.string(), v.number()),
  stats: v.object({ jumps: Count, playTicks: Count }),
  /** The level the level select opens at. */
  last: v.nullable(v.string()),
  prefs: v.object({
    /** Skulls where you died before. */
    markers: v.boolean(),
    /** Race the ghost of your best run. */
    ghost: v.boolean(),
    assist: Assist,
    /** On-screen buttons. */
    touchSize: v.picklist(["s", "m", "l"]),
    /** Jump on the left, arrows on the right. */
    touchSwap: v.boolean(),
    /** Remapped keys (KeyboardEvent.code) per action; null: the defaults. */
    keys: v.nullable(v.record(v.string(), v.array(v.string()))),
  }),
});
export type TrapSprintSave = v.InferOutput<typeof TrapSprintSaveV1>;

export const NO_ASSIST: Assist = { speed: 1, reveal: false, invincible: false };

export const defaultTrapSprintSave = (): TrapSprintSave => ({
  v: 1,
  levels: {},
  deaths: 0,
  causes: {},
  fakeHops: 0,
  zoneRuns: {},
  achievements: {},
  stats: { jumps: 0, playTicks: 0 },
  last: null,
  prefs: { markers: true, ghost: true, assist: { ...NO_ASSIST }, touchSize: "m", touchSwap: false, keys: null },
});

export const emptyLevelRecord = (): LevelRecord => ({ deaths: 0, clears: 0, best: null, medal: null, coins: 0, assisted: false, marks: [] });

export const trapSprintSave = defineSave<TrapSprintSave>({
  key: "mfg:game:trapsprint",
  version: 1,
  schema: TrapSprintSaveV1,
  defaults: defaultTrapSprintSave,
});

/** Assist is on when any of its options is. */
export const assistOn = (assist: Assist) => assist.speed < 1 || assist.reveal || assist.invincible;
