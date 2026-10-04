// Almost There's local saves (Plan/08-almost-there.md §3, §12; Plan/gameStack.md §5.5).
//
// - The game's record: finished climbs, best times, everything you've ever fallen, the hats you've
//   found, achievements and preferences.
// - The climb in progress: one slot, written four times a second while anything moves and on every
//   jump and landing, so a reload carries on exactly where it was (mid-fall included). No manual
//   saves: you can't undo a fall.
// - The previous good climb, kept as a backup in case the main slot is ever damaged (Plan §12).
import * as v from "valibot";
import { defineSave } from "@/engine/save";
import type { Climb } from "./core/climb";

const Count = v.pipe(v.number(), v.integer(), v.minValue(0));
const Num = v.pipe(v.number(), v.finite());
const ZONE_IDS = ["foothills", "rooftops", "clocktower", "cliffs", "ice", "fake-summit", "inside", "sky", "summit"] as const;
const Zone = v.picklist(ZONE_IDS);

const PipSchema = v.object({
  x: Num,
  y: Num,
  w: Num,
  h: Num,
  vx: Num,
  vy: Num,
  rx: Num,
  ry: Num,
  grounded: v.boolean(),
  charge: Count,
  latch: v.boolean(),
  facing: v.picklist([1, -1]),
  stun: Count,
  takeoff: Num,
  peak: Num,
  walked: Num,
  bounced: v.boolean(),
});

const SimSchema = v.object({
  tick: Count,
  pip: PipSchema,
  crumbles: v.array(v.tuple([Count, v.pipe(v.number(), v.integer())])),
  collapsed: v.boolean(),
  elevators: v.array(v.object({ offset: Num, phase: v.picklist(["idle", "down", "bottom", "up"]), t: Count })),
  feathers: Count,
  touchingJoke: v.pipe(v.number(), v.integer(), v.minValue(-1)),
  touchingFlag: v.boolean(),
});

const ClimbSchema = v.object({
  engine: Count,
  mirrored: v.boolean(),
  sim: SimSchema,
  stats: v.object({ ticks: Count, jumps: Count, falls: Count, fallen: Num, biggest: Num }),
  splits: v.record(Zone, Count),
  story: v.picklist(["climbing", "credits", "fallen", "summit"]),
  scripted: v.boolean(),
  stand: v.object({ x: Num, y: Num }),
  best: Num,
  assisted: v.boolean(),
  checkpoints: v.array(v.object({ x: Num, y: Num, zone: Zone })),
  chirp: v.object({ n: Count, quiet: Count }),
});

const ClimbSlotV1 = v.object({ v: v.literal(1), climb: v.nullable(ClimbSchema) });
type ClimbSlot = { v: 1; climb: Climb | null };

const climbSlot = (key: string) =>
  defineSave<ClimbSlot>({
    key,
    version: 1,
    // Valibot's record of a picklist reads as a full record; a climb only has the zones it reached.
    schema: ClimbSlotV1 as unknown as v.GenericSchema<unknown, ClimbSlot>,
    defaults: () => ({ v: 1, climb: null }),
    debounceMs: 0,
  });

export const climbSave = climbSlot("mfg:game:almost-there:climb");
export const climbBackup = climbSlot("mfg:game:almost-there:climb-backup");

const Assist = v.object({
  /** Plant up to 3 checkpoint flags per zone. */
  checkpoints: v.boolean(),
  /** Show where a jump will go while charging. */
  preview: v.boolean(),
  /** Game speed: 1 or 0.75. */
  speed: v.picklist([1, 0.75]),
});
export type Assist = v.InferOutput<typeof Assist>;

const Best = v.object({
  ticks: Count,
  falls: Count,
  splits: v.record(v.string(), Count),
  at: Count,
});
export type Best = v.InferOutput<typeof Best>;

const AlmostThereSaveV1 = v.object({
  v: v.literal(1),
  climbs: v.object({ started: Count, finished: Count, mirrorStarted: Count, mirrorFinished: Count }),
  /** The fastest climbs without assist (normal and Mirror Mountain). */
  best: v.object({ normal: v.nullable(Best), mirror: v.nullable(Best) }),
  /** Everything, across every climb. */
  totals: v.object({ jumps: Count, falls: Count, fallen: Num, biggest: Num, ticks: Count }),
  /** Seen it happen: the fake summit (the credits can be skipped after), and the real one. */
  seen: v.object({ fakeSummit: v.boolean(), summit: v.boolean() }),
  /** Lost Feathers ever found (bitmask): each is a hat. */
  feathers: Count,
  /** The hat Pip wears (feather index), or none. */
  hat: v.nullable(Count),
  achievements: v.record(v.string(), v.number()),
  prefs: v.object({
    assist: Assist,
    /** Show the speedrun clock while climbing. */
    clock: v.boolean(),
    /** Chirp's lines in larger text (Plan §11). */
    bigText: v.boolean(),
    /** Buzz on landing (Android). */
    vibrate: v.boolean(),
    touchSize: v.picklist(["s", "m", "l"]),
    /** Jump on the left, arrows on the right. */
    touchSwap: v.boolean(),
    /** Remapped keys (KeyboardEvent.code) per action; null: the defaults. */
    keys: v.nullable(v.record(v.string(), v.array(v.string()))),
  }),
});
export type AlmostThereSave = v.InferOutput<typeof AlmostThereSaveV1>;

export const NO_ASSIST: Assist = { checkpoints: false, preview: false, speed: 1 };
export const assistOn = (a: Assist) => a.checkpoints || a.preview || a.speed < 1;

export const defaultAlmostThereSave = (): AlmostThereSave => ({
  v: 1,
  climbs: { started: 0, finished: 0, mirrorStarted: 0, mirrorFinished: 0 },
  best: { normal: null, mirror: null },
  totals: { jumps: 0, falls: 0, fallen: 0, biggest: 0, ticks: 0 },
  seen: { fakeSummit: false, summit: false },
  feathers: 0,
  hat: null,
  achievements: {},
  prefs: { assist: { ...NO_ASSIST }, clock: false, bigText: false, vibrate: true, touchSize: "m", touchSwap: false, keys: null },
});

export const almostThereSave = defineSave<AlmostThereSave>({
  key: "mfg:game:almost-there",
  version: 1,
  schema: AlmostThereSaveV1,
  defaults: defaultAlmostThereSave,
});

/** The climb in progress (or the backup, if the main slot was damaged). */
export function loadClimb(): Climb | null {
  const main = climbSave.get().climb;
  if (main) return main;
  return climbBackup.get().climb;
}

let lastBackup = 0;

/** Save the climb now (and, every few seconds, the backup too). */
export function writeClimb(climb: Climb, now = Date.now()) {
  climbSave.set({ v: 1, climb });
  climbSave.flush();
  if (now - lastBackup > 5000) {
    lastBackup = now;
    climbBackup.set({ v: 1, climb });
    climbBackup.flush();
  }
}

/** The climb is over (or abandoned): the backup goes first, so a damaged main slot never brings it back. */
export function clearClimb() {
  climbBackup.set({ v: 1, climb: null });
  climbBackup.flush();
  climbSave.set({ v: 1, climb: null });
  climbSave.flush();
  lastBackup = 0;
}
