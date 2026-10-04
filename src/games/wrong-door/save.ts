// Wrong Door's local save (Plan/13-wrong-door.md §12 "Run state saved in localStorage, so runs can be
// resumed"): the run you're on (it's rebuilt from its seed, so this is small), the codex pages you've
// found, achievements, lifetime stats, Daily Door results and options.
import * as v from "valibot";
import { defineSave, type SaveDef } from "@/engine/save";
import { DOOR_STYLES } from "./logic/types";

const Count = v.pipe(v.number(), v.integer(), v.minValue(0));
const Door = v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(5));
const Style = v.picklist(DOOR_STYLES);
const SoundSchema = v.picklist(["wind", "footsteps", "ticking", "whispers", "silence"]);
const QuestionSchema = v.variant("type", [
  v.object({ type: v.literal("isExit"), door: Door }),
  v.object({ type: v.literal("hatRed") }),
  v.object({ type: v.literal("wouldSay"), door: Door }),
]);
const DoorMap = <T extends v.GenericSchema>(value: T) => v.record(v.string(), value);

const PlaySchema = v.object({
  visit: Count,
  knocks: DoorMap(SoundSchema),
  answer: v.nullable(v.object({ question: QuestionSchema, yes: v.boolean() })),
  coins: DoorMap(v.boolean()),
  peeks: DoorMap(v.boolean()),
  opened: v.array(Door),
  shuffled: v.boolean(),
  chalk: v.array(Door),
  taken: v.boolean(),
  lucky: v.nullable(v.object({ picked: Door, opened: Door })),
  wrong: Count,
  itemsUsed: Count,
  curse: v.nullable(v.picklist(["noKnock", "silentDoorman", "scrambled"])),
});

const StepSchema = v.object({
  floor: Count,
  style: v.nullable(Style),
  wrong: Count,
  knocks: Count,
  question: v.boolean(),
  items: Count,
  lucky: v.boolean(),
  points: Count,
});

const RunSchema = v.object({
  mode: v.picklist(["story", "endless", "daily"]),
  seed: Count,
  daily: v.nullable(v.string()),
  floor: v.pipe(Count, v.minValue(1)),
  keys: Count,
  visits: v.record(v.string(), Count),
  items: v.object({ stethoscope: v.boolean(), lantern: v.boolean(), chalk: v.boolean(), truthCoin: Count, crowbar: Count }),
  cursed: v.boolean(),
  play: PlaySchema,
  path: v.array(StepSchema),
  chalkLog: v.array(v.object({ floor: Count, style: v.nullable(Style) })),
  wrongBy: v.record(v.string(), Count),
  stats: v.object({ wrong: Count, knocks: Count, questions: Count, items: Count, anomalies: Count, switchWon: v.boolean(), doubleNegative: v.boolean() }),
  status: v.picklist(["play", "escaped", "out"]),
  pending: v.nullable(
    v.object({
      consequence: v.picklist(["downstairs", "wrongRoom", "cursed", "loseKey"]),
      door: v.union([Door, v.literal("back"), v.literal("painting")]),
    }),
  ),
  elapsedMs: Count,
});

const DailySchema = v.object({
  /** The floor you got to, how many wrong doors, keys left. */
  floor: Count,
  wrong: Count,
  keys: Count,
  escaped: v.boolean(),
  /** The share card's row of doors. */
  grid: v.string(),
  score: Count,
});

const WrongDoorSaveV1 = v.object({
  v: v.literal(1),
  run: v.nullable(RunSchema),
  /** Codex page id → when you found it. */
  codex: v.record(v.string(), v.number()),
  achievements: v.record(v.string(), v.number()),
  stats: v.object({
    runs: Count,
    escapes: Count,
    storyEscapes: Count,
    /** Endless: the highest floor. */
    bestEndless: Count,
    bestScore: Count,
    floors: Count,
    wrongDoors: Count,
    anomalies: Count,
    knocks: Count,
    questions: Count,
    luckyPlays: Count,
    luckySwitches: Count,
    luckyWins: Count,
  }),
  /** The Daily Door, by date: your first finished run of the day. */
  daily: v.record(v.string(), DailySchema),
  prefs: v.object({
    /** No timer in the Wrong Room (Plan §11 "Relaxed mode"). */
    relaxed: v.boolean(),
    /** Bigger sign text. */
    bigSigns: v.boolean(),
  }),
});

export type WrongDoorSave = v.InferOutput<typeof WrongDoorSaveV1>;
export type SavedRun = v.InferOutput<typeof RunSchema>;
export type DailyRecord = v.InferOutput<typeof DailySchema>;

export const defaultWrongDoorSave = (): WrongDoorSave => ({
  v: 1,
  run: null,
  codex: {},
  achievements: {},
  stats: { runs: 0, escapes: 0, storyEscapes: 0, bestEndless: 0, bestScore: 0, floors: 0, wrongDoors: 0, anomalies: 0, knocks: 0, questions: 0, luckyPlays: 0, luckySwitches: 0, luckyWins: 0 },
  daily: {},
  prefs: { relaxed: false, bigSigns: false },
});

export const wrongDoorSaveDefinition: SaveDef<WrongDoorSave> = {
  key: "mfg:game:wrong-door",
  version: 1,
  schema: WrongDoorSaveV1,
  defaults: defaultWrongDoorSave,
};

export const wrongDoorSave = defineSave<WrongDoorSave>(wrongDoorSaveDefinition);
