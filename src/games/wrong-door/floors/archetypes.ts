// A generator per kind of floor (Plan/13-wrong-door.md §5 "Floor types"). Each builds a floor from a seed,
// asks the solver whether it's fair (floors/check.ts), and tries again until it is. Harder floors higher up:
// more doors, trickier claims and rules.
import { createRng, pick, randInt, shuffle, type Rng } from "@/engine/rng";
import { makeSequence } from "../logic/sequences";
import { ruleText } from "../logic/statements";
import { DOOR_STYLES, SCRATCHES, type Anomaly, type Archetype, type ClueKind, type DoorId, type DoorStyle, type Floor } from "../logic/types";
import { verify } from "./check";
import { blankFloor, EASY_KINDS, HARD_KINDS, makeDoors, makeSigns, MID_KINDS, range, rulesFor, withSigns, type StatementKind } from "./common";

export interface FloorContext {
  number: number;
  seed: number;
  /** The floors you've climbed this run (most recent last), and the kind of door you went through. */
  history: ReadonlyArray<{ floor: number; style: DoorStyle | null }>;
}

type Level = "easy" | "mid" | "hard";
const levelOf = (floor: number): Level => (floor <= 3 ? "easy" : floor <= 8 ? "mid" : "hard");
const kindsOf = (level: Level): StatementKind[] => (level === "easy" ? EASY_KINDS : level === "mid" ? MID_KINDS : HARD_KINDS);

/** How many doors a floor of signs gets. */
function doorCount(rng: Rng, floor: number): number {
  if (floor <= 2) return 3;
  if (floor <= 5) return pick(rng, [3, 4]);
  if (floor <= 9) return 4;
  return pick(rng, [4, 5]);
}

const GENERATORS: Record<Archetype, (rng: Rng, ctx: FloorContext) => Floor | null> = {
  plainSigns(rng, ctx) {
    const exit = randInt(rng, 1, 2);
    const floor = { ...blankFloor(ctx.number, "plainSigns", ctx.seed), exit, doors: makeDoors(rng, ctx.number, 2, exit) };
    const made = makeSigns(rng, floor, { n: 2, exit, signed: [1, 2], rules: [{ type: "exactlyTrue", count: 1 }], kinds: [...EASY_KINDS, "someExit"], leave: 1 });
    return made && withSigns(floor, made);
  },

  knightsKnaves(rng, ctx) {
    const level = levelOf(ctx.number);
    const n = doorCount(rng, ctx.number);
    const exit = randInt(rng, 1, n);
    const floor = { ...blankFloor(ctx.number, "knightsKnaves", ctx.seed), exit, doors: makeDoors(rng, ctx.number, n, exit) };
    const made = makeSigns(rng, floor, { n, exit, signed: range(n), rules: rulesFor(n, level), kinds: kindsOf(level), leave: 1, confident: rng() < 0.4 });
    return made && withSigns(floor, made);
  },

  doorman(rng, ctx) {
    const level = levelOf(ctx.number);
    const n = ctx.number <= 5 ? 3 : pick(rng, [3, 4]);
    const exit = randInt(rng, 1, n);
    const signed = shuffle(rng, range(n))
      .slice(0, randInt(rng, 1, n))
      .sort((a, b) => a - b);
    const floor = { ...blankFloor(ctx.number, "doorman", ctx.seed), exit, doors: makeDoors(rng, ctx.number, n, exit) };
    const made = makeSigns(rng, floor, { n, exit, signed, rules: rulesFor(signed.length, level === "hard" ? "mid" : level), kinds: kindsOf(level === "hard" ? "mid" : level), leave: 2 });
    if (!made) return null;
    // Higher up he sometimes takes his hat off: is he lying today? Only the double question will tell.
    const hat = ctx.number >= 7 && rng() < 0.5 ? "off" : "on";
    return { ...withSigns(floor, made), doorman: { lies: rng() < 0.5, hat }, notes: ["Mr. Hinges will answer one question."] };
  },

  sound(rng, ctx) {
    const level = levelOf(ctx.number);
    const n = ctx.number <= 6 ? pick(rng, [3, 4]) : pick(rng, [4, 5]);
    const exit = randInt(rng, 1, n);
    const leave = Math.min(3, n - 1, randInt(rng, 2, 3));
    const signed = shuffle(rng, range(n))
      .slice(0, randInt(rng, 1, Math.max(1, n - 1)))
      .sort((a, b) => a - b);
    const floor = { ...blankFloor(ctx.number, "sound", ctx.seed), exit, windRule: true, doors: makeDoors(rng, ctx.number, n, exit, { wind: true }) };
    const made = makeSigns(rng, floor, { n, exit, signed, rules: rulesFor(signed.length, level === "hard" ? "mid" : level), kinds: kindsOf(level === "hard" ? "mid" : level), leave });
    return made && { ...withSigns(floor, made), notes: ["Knock and listen. The way up has wind behind it."] };
  },

  sequence(rng, ctx) {
    const n = ctx.number <= 6 ? pick(rng, [3, 4]) : pick(rng, [4, 5]);
    const puzzle = makeSequence(rng, ctx.number <= 6 ? 5 : 4, n - 1);
    if (!puzzle) return null;
    const exit = randInt(rng, 1, n);
    const doors = makeDoors(rng, ctx.number, n, exit);
    let w = 0;
    for (const d of doors) d.number = d.id === exit ? puzzle.answer : puzzle.wrong[w++]!;
    return { ...blankFloor(ctx.number, "sequence", ctx.seed), exit, doors, sequence: puzzle.shown, notes: [`${puzzle.shown.join(", ")}, …`, "The room that comes next is the way up."] };
  },

  mirror(rng, ctx) {
    const level = levelOf(ctx.number);
    const n = pick(rng, [3, 4]);
    const exit = randInt(rng, 1, n);
    const floor = { ...blankFloor(ctx.number, "mirror", ctx.seed), exit, mirror: true, doors: makeDoors(rng, ctx.number, n, exit) };
    const kinds: StatementKind[] = ["exitLeftOf", "exitRightOf", "exitLeftOf", "exitRightOf", "exitIs", "exitIsNot", "exitNextTo", ...(level === "hard" ? (["signLies"] as const) : [])];
    const made = makeSigns(rng, floor, { n, exit, signed: range(n), rules: rulesFor(n, level === "easy" ? "easy" : "mid"), kinds, leave: 1 });
    if (!made || ![...made.signs.values()].some((s) => s.type === "exitLeftOf" || s.type === "exitRightOf")) return null;
    return { ...withSigns(floor, made), notes: ["This floor is a mirror. Left is right, and right is left."] };
  },

  anomaly(rng, ctx) {
    const changed = rng() < 0.5 ? anomalyFor(rng, ctx.number) : null;
    const doors = makeDoors(rng, ctx.number, 1, changed ? 0 : 1);
    return {
      ...blankFloor(ctx.number, "anomaly", ctx.seed),
      exit: changed ? "back" : 1,
      doors,
      anomaly: { changed },
      notes: ["This hall is furnished like the lobby. If anything is different, go back the way you came."],
    };
  },

  montyHall(rng, ctx) {
    const exit = randInt(rng, 1, 3);
    const doors = makeDoors(rng, ctx.number, 3, exit).map((d) => ({ ...d, consequence: d.id === exit ? null : ("downstairs" as const), sound: d.id === exit ? ("wind" as const) : ("footsteps" as const) }));
    return { ...blankFloor(ctx.number, "montyHall", ctx.seed), exit, doors, lucky: true, doorman: { lies: false, hat: "on" }, notes: ["🎲 The Lucky Floor. Pick a door. Mr. Hinges will help. Sort of.", "Luck only: no knocking, no tools."] };
  },

  memory(rng, ctx) {
    const past = ctx.history.filter((h) => h.style && h.floor < ctx.number - 1);
    if (!past.length) return null;
    const recall = pick(rng, past.slice(-6));
    const n = pick(rng, [3, 4, 5]);
    const exit = randInt(rng, 1, n);
    const others = shuffle(rng, DOOR_STYLES.filter((s) => s !== recall.style)).slice(0, n - 1);
    const doors = makeDoors(rng, ctx.number, n, exit);
    let o = 0;
    for (const d of doors) d.style = d.id === exit ? recall.style! : others[o++]!;
    return {
      ...blankFloor(ctx.number, "memory", ctx.seed),
      exit,
      doors,
      memory: { floor: recall.floor, style: recall.style! },
      notes: [`The way up is the same kind of door you went through on floor ${recall.floor}.`],
    };
  },

  dark(rng, ctx) {
    const n = pick(rng, [4, 5]);
    const exit = randInt(rng, 1, n);
    // The candle stands so that two or three doors are on the side it leans to.
    const options = range(n - 1).filter((at) => {
      const side = exit <= at ? at : n - at;
      return side >= 2 && side <= 3;
    });
    if (!options.length) return null;
    const at = pick(rng, options);
    const floor = {
      ...blankFloor(ctx.number, "dark", ctx.seed),
      exit,
      dark: true,
      windRule: true,
      candle: { at, lean: exit <= at ? ("left" as const) : ("right" as const) },
      doors: makeDoors(rng, ctx.number, n, exit, { wind: true }),
    };
    // Signs you could read with a light (a lantern makes this floor easy).
    const made = makeSigns(rng, floor, { n, exit, signed: range(n), rules: rulesFor(n, "mid"), kinds: MID_KINDS, leave: 1 });
    if (!made) return null;
    const doorman = rng() < 0.5 ? { lies: rng() < 0.5, hat: "on" as const } : null;
    return { ...withSigns(floor, made), doorman, notes: ["The lights are out. Trust the flame, and your ears.", "The way up has wind behind it."] };
  },

  liarsBanquet(rng, ctx) {
    const n = 4;
    const exit = randInt(rng, 1, n);
    const honest = pick(rng, ["signs", "light", "candle", "footprints", "doorman"] as const satisfies readonly ClueKind[]);
    const tells = (kind: ClueKind) => kind === honest;
    const doors = makeDoors(rng, ctx.number, n, exit);
    // Light under each door: the way up is lit if light tells the truth tonight, dark if it lies.
    for (const d of doors) d.light = d.id === exit ? tells("light") : rng() < 0.5;
    const at = randInt(rng, 1, n - 1);
    const leansAtExit = exit <= at ? "left" : "right";
    const candle = { at, lean: tells("candle") ? leansAtExit : leansAtExit === "left" ? ("right" as const) : ("left" as const) };
    const printsAt = randInt(rng, 1, n);
    const truthIn = printsAt === exit;
    const footprints = { door: printsAt, toes: (tells("footprints") ? truthIn : !truthIn) ? ("in" as const) : ("out" as const) };
    const floor = { ...blankFloor(ctx.number, "liarsBanquet", ctx.seed), exit, honest, doors, candle, footprints, doorman: { lies: !tells("doorman"), hat: "on" as const } };
    const signed = shuffle(rng, range(n))
      .slice(0, randInt(rng, 2, 3))
      .sort((a, b) => a - b);
    const made = makeSigns(rng, floor, { n, exit, signed, rules: [tells("signs") ? { type: "allTrue" } : { type: "allLie" }], kinds: MID_KINDS, leave: randInt(rng, 2, 3), tries: 60 });
    if (!made) return null;
    const name = { signs: "the signs", light: "the light under the doors", candle: "the candle", footprints: "the footprints", doorman: "Mr. Hinges" }[honest];
    return { ...withSigns(floor, made), notes: [`Tonight, everything lies except ${name}.`] };
  },

  shifting(rng, ctx) {
    const level = levelOf(ctx.number);
    const n = pick(rng, [3, 4]);
    const exit = randInt(rng, 1, n);
    const doors = makeDoors(rng, ctx.number, n, exit);
    const marks = shuffle(rng, SCRATCHES);
    doors.forEach((d, k) => (d.scratch = marks[k]!));
    const floor = { ...blankFloor(ctx.number, "shifting", ctx.seed), exit, doors };
    const made = makeSigns(rng, floor, { n, exit, signed: range(n), rules: rulesFor(n, level === "easy" ? "easy" : "mid"), kinds: kindsOf(level === "hard" ? "mid" : level), leave: 1 });
    if (!made) return null;
    // Where they end up: the way up always moves.
    let order = shuffle(rng, range(n));
    for (let t = 0; t < 20 && order.indexOf(exit) === exit - 1; t++) order = shuffle(rng, range(n));
    if (order.indexOf(exit) === exit - 1) return null;
    return { ...withSigns(floor, made), shuffle: order, notes: ["When the lights flicker, the doors move. Watch the scratches."] };
  },

  final(rng, ctx) {
    const n = 5;
    const way = rng() < 0.5 ? ("painting" as const) : ("back" as const);
    const doors = makeDoors(rng, ctx.number, n, 0).map((d) => ({ ...d, consequence: "loseKey" as const, sound: "silence" as const }));
    // Every clue points somewhere different.
    const [byLight, bySign1, bySign2, byPrints, byCandle] = shuffle(rng, range(n)) as [DoorId, DoorId, DoorId, DoorId, DoorId];
    for (const d of doors) d.light = d.id === byLight;
    doors[bySign1 - 1]!.sign = { type: "exitIs", door: bySign1 };
    const other = shuffle(rng, range(n).filter((d) => d !== bySign2))[0]!;
    doors[other - 1]!.sign = { type: "exitIs", door: bySign2 };
    const at = byCandle <= 2 ? byCandle : byCandle - 1;
    return {
      ...blankFloor(ctx.number, "final", ctx.seed),
      exit: way,
      doors,
      final: { way },
      candle: { at, lean: byCandle <= at ? "left" : "right" },
      footprints: { door: byPrints, toes: "in" },
      doorman: { lies: false, hat: "on" },
      notes: ["None of these doors is the way out."],
    };
  },
};

/** What can change on an anomaly floor: obvious things low down, subtle ones higher up. */
const OBVIOUS: Anomaly[] = ["paintingUpsideDown", "paintingMissing", "plantMissing", "threeLamps", "signThirtyOne"];
const SUBTLE: Anomaly[] = ["shipSailsLeft", "clockTime", "clockBackwards", "lampOut", "plantMoved", "rugBlue", "stripes"];

function anomalyFor(rng: Rng, floor: number): Anomaly {
  if (floor <= 6) return pick(rng, OBVIOUS);
  return pick(rng, rng() < 0.35 ? OBVIOUS : SUBTLE);
}

/** A fair floor of this kind (it tries seeds until the solver agrees; falls back to signs when a kind can't
 * be made here, such as a memory floor with nothing to remember). */
export function generateFloor(archetype: Archetype, ctx: FloorContext): Floor {
  const rng = createRng(`${archetype}:${ctx.seed}`);
  for (let t = 0; t < 60; t++) {
    const floor = GENERATORS[archetype](rng, ctx);
    if (floor && verify(floor) === null) return finish(floor);
  }
  if (archetype !== "knightsKnaves") return generateFloor("knightsKnaves", { ...ctx, seed: ctx.seed + 1 });
  throw new Error(`no floor for ${archetype} at ${ctx.number}`);
}

/** The plaque's rule line goes first. */
function finish(floor: Floor): Floor {
  if (!floor.rule) return floor;
  const signs = floor.doors.filter((d) => d.sign).length;
  return { ...floor, notes: [ruleText(floor.rule, signs), ...floor.notes] };
}

export const GENERATOR_ARCHETYPES = Object.keys(GENERATORS) as Archetype[];
