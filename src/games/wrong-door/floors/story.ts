// The Story Run (Plan/13-wrong-door.md §5 "Modes"): thirteen hand-made floors for your first climbs, one new
// idea at a time, in the plan's order. These are the floors on a first visit; go down the stairs and the
// floor you land on is a new puzzle of the same kind (a generator's, from the story's own seed). The tests
// check every one with the solver, like any generated floor.
import { hashString } from "@/engine/rng";
import { ruleText } from "../logic/statements";
import { DOOR_STYLES, type Archetype, type Consequence, type Door, type DoorId, type DoorStyle, type Floor, type FloorRule, type Statement } from "../logic/types";
import { generateFloor, type FloorContext } from "./archetypes";
import { blankFloor, SOUND_OF } from "./common";

export const STORY_FLOORS = 13;

/** The kind of floor at each story floor (1–13). */
export const STORY_ARCHETYPES: readonly Archetype[] = [
  "plainSigns",
  "knightsKnaves",
  "doorman",
  "sound",
  "sequence",
  "anomaly",
  "mirror",
  "montyHall",
  "memory",
  "dark",
  "shifting",
  "liarsBanquet",
  "final",
];

const door = (id: DoorId, style: DoorStyle, sign: Statement | null, consequence: Consequence | null, extra: Partial<Door> = {}): Door => ({
  id,
  style,
  sign,
  sound: consequence ? SOUND_OF[consequence] : "wind",
  light: null,
  number: null,
  scratch: null,
  consequence,
  ...extra,
});

const is = (d: DoorId): Statement => ({ type: "exitIs", door: d });
const isNot = (d: DoorId): Statement => ({ type: "exitIsNot", door: d });
const rightOf = (d: DoorId): Statement => ({ type: "exitRightOf", door: d });
const one = (count: number): FloorRule => ({ type: "exactlyTrue", count });

function floor(number: number, parts: Partial<Floor>): Floor {
  const f = { ...blankFloor(number, STORY_ARCHETYPES[number - 1]!, hashString(`story:${number}`)), ...parts };
  const signs = f.doors.filter((d) => d.sign).length;
  return f.rule ? { ...f, notes: [ruleText(f.rule, signs), ...f.notes] } : f;
}

/** The hand-made floors. `history` is the run so far (floor 9 asks about a door you went through). */
const FLOORS: Record<number, (history: FloorContext["history"]) => Floor> = {
  // Two doors, one true sign. The confident one isn't it: the other is always true.
  1: () =>
    floor(1, {
      exit: 2,
      rule: one(1),
      doors: [door(1, "wood", is(1), "downstairs"), door(2, "velvet", { type: "someExit" }, null, { sound: "silence" })],
    }),
  // Knights and knaves: only door 2 makes exactly one sign true.
  2: () =>
    floor(2, {
      exit: 2,
      rule: one(1),
      doors: [door(1, "iron", is(1), "downstairs"), door(2, "wood", isNot(2), null, { sound: "silence" }), door(3, "glass", isNot(1), "wrongRoom")],
      item: "chalk",
    }),
  // The sign leaves two doors; Mr. Hinges, in his red hat, settles it (if you remember he's lying).
  3: () =>
    floor(3, {
      exit: 1,
      rule: { type: "allTrue" },
      doors: [door(1, "velvet", isNot(3), null, { sound: "silence" }), door(2, "round", null, "wrongRoom"), door(3, "wood", null, "downstairs")],
      doorman: { lies: true, hat: "on" },
      notes: ["Mr. Hinges will answer one question."],
    }),
  // The sign lies, which leaves three doors. Two knocks find the wind.
  4: () =>
    floor(4, {
      exit: 3,
      rule: { type: "allLie" },
      windRule: true,
      doors: [door(1, "iron", is(1), "downstairs"), door(2, "velvet", null, "wrongRoom"), door(3, "wood", null, null), door(4, "glass", null, "cursed")],
      notes: ["Knock and listen. The way up has wind behind it."],
      item: "stethoscope",
    }),
  // Primes.
  5: () =>
    floor(5, {
      exit: 3,
      sequence: [2, 3, 5, 7],
      doors: [
        door(1, "round", null, "downstairs", { number: 9 }),
        door(2, "glass", null, "wrongRoom", { number: 15 }),
        door(3, "iron", null, null, { number: 11, sound: "silence" }),
        door(4, "wood", null, "cursed", { number: 10 }),
      ],
      notes: ["2, 3, 5, 7, …", "The room that comes next is the way up."],
      item: "truthCoin",
    }),
  // The lobby again? The painting's upside down. Go back the way you came.
  6: () =>
    floor(6, {
      exit: "back",
      anomaly: { changed: "paintingUpsideDown" },
      doors: [door(1, "velvet", null, "downstairs")],
      notes: ["This hall is furnished like the lobby. If anything is different, go back the way you came."],
      item: "luckyKey",
    }),
  // A mirror: "right of" is to the left of the door, as you see it. Exactly one sign is true: door 1's.
  7: () =>
    floor(7, {
      exit: 1,
      mirror: true,
      rule: one(1),
      doors: [door(1, "round", rightOf(1), null, { sound: "silence" }), door(2, "iron", rightOf(2), "wrongRoom"), door(3, "wood", isNot(3), "downstairs")],
      notes: ["This floor is a mirror. Left is right, and right is left."],
    }),
  // Luck.
  8: () =>
    floor(8, {
      exit: 2,
      lucky: true,
      doorman: { lies: false, hat: "on" },
      doors: [door(1, "iron", null, "downstairs"), door(2, "glass", null, null), door(3, "velvet", null, "downstairs")],
      notes: ["🎲 The Lucky Floor. Pick a door. Mr. Hinges will help. Sort of.", "Luck only: no knocking, no tools."],
    }),
  // Which door did you take on floor 4? (Chalk remembers for you.)
  9: (history) => {
    const recalled = [...history].reverse().find((h) => h.floor === 4 && h.style) ?? [...history].reverse().find((h) => h.style && h.floor <= 7);
    const style = recalled?.style ?? "wood";
    const others = DOOR_STYLES.filter((s) => s !== style);
    return floor(9, {
      exit: 3,
      memory: { floor: recalled?.floor ?? 4, style },
      doors: [door(1, others[0]!, null, "downstairs"), door(2, others[1]!, null, "cursed"), door(3, style, null, null, { sound: "silence" }), door(4, others[2]!, null, "wrongRoom")],
      notes: [`The way up is the same kind of door you went through on floor ${recalled?.floor ?? 4}.`],
      item: "crowbar",
    });
  },
  // Dark: the flame leans right, to doors 3 and 4; knock for the wind. (Mr. Hinges is here too, but you
  // can't see his hat: only the double question works.)
  10: () =>
    floor(10, {
      exit: 4,
      dark: true,
      windRule: true,
      candle: { at: 2, lean: "right" },
      doors: [door(1, "wood", null, "downstairs"), door(2, "round", null, "wrongRoom"), door(3, "iron", null, "cursed"), door(4, "velvet", null, null)],
      doorman: { lies: true, hat: "on" },
      notes: ["The lights are out. Trust the flame, and your ears.", "The way up has wind behind it."],
    }),
  // Solve it, then keep your eye on the ring scratch.
  11: () =>
    floor(11, {
      exit: 2,
      rule: one(1),
      doors: [
        door(1, "wood", isNot(2), "downstairs", { scratch: "slash" }),
        door(2, "glass", isNot(2), null, { scratch: "ring", sound: "silence" }),
        door(3, "iron", is(2), "wrongRoom", { scratch: "cross" }),
      ],
      shuffle: [2, 3, 1],
      notes: ["When the lights flicker, the doors move. Watch the scratches."],
    }),
  // Everything lies but the candle: it leans to doors 1 and 2; the light lies (so the lit door isn't it),
  // and so do the footprints and the signs.
  12: () =>
    floor(12, {
      exit: 1,
      honest: "candle",
      rule: { type: "allLie" },
      candle: { at: 2, lean: "left" },
      footprints: { door: 2, toes: "in" },
      doors: [
        door(1, "velvet", null, null, { light: false, sound: "silence" }),
        door(2, "wood", null, "downstairs", { light: true }),
        door(3, "iron", { type: "exitOneOf", doors: [3, 4] }, "wrongRoom", { light: false }),
        door(4, "glass", is(2), "cursed", { light: false }),
      ],
      doorman: { lies: true, hat: "on" },
      notes: ["Tonight, everything lies except the candle."],
    }),
  // None of these doors is the way out. Believe it: it's the painting.
  13: () =>
    floor(13, {
      exit: "painting",
      final: { way: "painting" },
      candle: { at: 3, lean: "right" },
      footprints: { door: 5, toes: "in" },
      doorman: { lies: false, hat: "on" },
      doors: [
        door(1, "glass", is(1), "loseKey", { light: false }),
        door(2, "wood", null, "loseKey", { light: true }),
        door(3, "round", null, "loseKey", { light: false }),
        door(4, "iron", is(3), "loseKey", { light: false }),
        door(5, "velvet", null, "loseKey", { light: false }),
      ],
      notes: ["None of these doors is the way out."],
    }),
};

/** A story floor: hand-made the first time, a fresh puzzle of the same kind after that. */
export function storyFloor(number: number, visit: number, history: FloorContext["history"]): Floor {
  if (visit === 0 && FLOORS[number]) return FLOORS[number](history);
  const archetype = STORY_ARCHETYPES[Math.min(number, STORY_FLOORS) - 1]!;
  return generateFloor(archetype, { number, seed: hashString(`story:${number}:${visit}`), history });
}

/** For tests: every hand-made floor (with a run that went through a wooden door on floor 4). */
export const handMadeStory = (history: FloorContext["history"] = [{ floor: 4, style: "wood" }]) => Array.from({ length: STORY_FLOORS }, (_, k) => FLOORS[k + 1]!(history));
