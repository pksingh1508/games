// A run up the hotel (Plan/13-wrong-door.md §2–§3, §7): keys, knocks, Mr. Hinges's one question, items,
// choosing a door, and what a wrong one does to you. Pure functions over plain data, so a run is saved after
// every action and comes back exactly as it was (floors are rebuilt from the seed, never stored).
import { createRng, hashString } from "@/engine/rng";
import { answerOf } from "../logic/doorman";
import { hostOpens, switchTo } from "../logic/monty-hall";
import { signTruths } from "../logic/solver";
import { emptyKnowledge, type Consequence, type DoorId, type DoorStyle, type Floor, type ItemKind, type Knowledge, type Question, type Sound } from "../logic/types";
import { generateFloor } from "../floors/archetypes";
import { KNOCKS } from "../floors/check";
import { curseFor, itemFor, plan, type Curse } from "../floors/schedule";
import { storyFloor, STORY_FLOORS } from "../floors/story";

export type Mode = "story" | "endless" | "daily";

export const START_KEYS = 3;

/** One floor of the climb, as it went. */
export interface Step {
  floor: number;
  /** The kind of door you went up through (null: the painting, or back the way you came). */
  style: DoorStyle | null;
  wrong: number;
  knocks: number;
  question: boolean;
  items: number;
  lucky: boolean;
  /** Detective points for the floor. */
  points: number;
}

/** What you've done on the floor you're on. */
export interface FloorPlay {
  visit: number;
  knocks: Partial<Record<DoorId, Sound>>;
  answer: { question: Question; yes: boolean } | null;
  coins: Partial<Record<DoorId, boolean>>;
  peeks: Partial<Record<DoorId, boolean>>;
  /** Wrong doors you've opened (marked with an X). */
  opened: DoorId[];
  /** Shifting doors: the lights have flickered. */
  shuffled: boolean;
  chalk: DoorId[];
  /** The item here's in your pocket. */
  taken: boolean;
  /** The Lucky Floor: your first pick, and the door he opened. */
  lucky: { picked: DoorId; opened: DoorId } | null;
  wrong: number;
  itemsUsed: number;
  curse: Curse | null;
}

export interface RunState {
  mode: Mode;
  seed: number;
  /** The Daily Door's date (YYYY-MM-DD). */
  daily: string | null;
  floor: number;
  keys: number;
  /** Visits per floor (a floor you come back to is a new puzzle). */
  visits: Record<number, number>;
  items: { stethoscope: boolean; lantern: boolean; chalk: boolean; truthCoin: number; crowbar: number };
  /** A cursed door's curse waits for the next floor you reach. */
  cursed: boolean;
  play: FloorPlay;
  path: Step[];
  /** Your chalk marks, floor by floor (once you carry chalk): the kind of door you went through. */
  chalkLog: Array<{ floor: number; style: DoorStyle | null }>;
  /** Wrong doors opened on each floor, all visits (for the share card). */
  wrongBy: Record<number, number>;
  stats: { wrong: number; knocks: number; questions: number; items: number; anomalies: number; switchWon: boolean; doubleNegative: boolean };
  status: "play" | "escaped" | "out";
  /** A wrong door you've opened whose consequence hasn't happened yet (it's saved, so a reload can't dodge
   * it). */
  pending: { consequence: Consequence; door: Choice } | null;
  /** Play time, pauses excluded. */
  elapsedMs: number;
}

const freshPlay = (visit: number): FloorPlay => ({
  visit,
  knocks: {},
  answer: null,
  coins: {},
  peeks: {},
  opened: [],
  shuffled: false,
  chalk: [],
  taken: false,
  lucky: null,
  wrong: 0,
  itemsUsed: 0,
  curse: null,
});

/** How tall the hotel is in this mode (Endless never ends). */
export const topFloor = (mode: Mode) => (mode === "endless" ? Infinity : STORY_FLOORS);

export function startRun(mode: Mode, seed: number, daily: string | null = null): RunState {
  const run: RunState = {
    mode,
    seed: mode === "story" ? 0 : seed,
    daily,
    floor: 1,
    keys: START_KEYS,
    visits: { 1: 0 },
    items: { stethoscope: false, lantern: false, chalk: false, truthCoin: 0, crowbar: 0 },
    cursed: false,
    play: freshPlay(0),
    path: [],
    chalkLog: [],
    wrongBy: {},
    stats: { wrong: 0, knocks: 0, questions: 0, items: 0, anomalies: 0, switchWon: false, doubleNegative: false },
    status: "play",
    pending: null,
    elapsedMs: 0,
  };
  return run;
}

/** The floors you've gone up through, for memory floors. */
const historyOf = (run: RunState) => run.path.map((s) => ({ floor: s.floor, style: s.style }));

/** The floor you're on: rebuilt from the seed, the floor number, the visit and the climb so far. */
export function floorOf(run: RunState): Floor {
  const visit = run.play.visit;
  let floor: Floor;
  if (run.mode === "story") floor = storyFloor(run.floor, visit, historyOf(run));
  else {
    const kinds = plan(run.seed, run.floor, { final: run.mode === "daily" });
    floor = generateFloor(kinds[run.floor - 1]!, { number: run.floor, seed: hashString(`${run.mode}:${run.seed}:${run.floor}:${visit}`), history: historyOf(run) });
    const carrying = new Set<ItemKind>((["stethoscope", "lantern", "chalk"] as const).filter((k) => run.items[k]));
    floor = { ...floor, item: itemFor(run.seed, run.floor, visit, carrying, floor.archetype) };
  }
  return floor;
}

/** What you know on this floor, for the solver. */
export function knowledgeOf(run: RunState, floor: Floor): Knowledge {
  const base = emptyKnowledge(floor, run.items.lantern);
  return { ...base, knocks: run.play.knocks, answer: run.play.answer, coins: run.play.coins, peeks: run.play.peeks, opened: run.play.opened };
}

export const knocksAllowed = (run: RunState) => KNOCKS + (run.items.stethoscope ? 1 : 0);
export const knocksLeft = (run: RunState) => Math.max(0, knocksAllowed(run) - Object.keys(run.play.knocks).length);

/** Things you can do on this floor right now. */
export function can(run: RunState, floor: Floor) {
  const playing = run.status === "play" && !run.play.lucky;
  return {
    knock: playing && !floor.lucky && run.play.curse !== "noKnock" && knocksLeft(run) > 0,
    ask: playing && !!floor.doorman && !floor.lucky && !run.play.answer && run.play.curse !== "silentDoorman",
    coin: playing && !floor.lucky && run.items.truthCoin > 0,
    crowbar: playing && !floor.lucky && run.items.crowbar > 0,
    chalk: playing && run.items.chalk,
    pickUp: playing && !!floor.item && !run.play.taken,
  };
}

const update = (run: RunState, play: Partial<FloorPlay>, rest: Partial<RunState> = {}): RunState => ({ ...run, ...rest, play: { ...run.play, ...play } });

export function knock(run: RunState, floor: Floor, door: DoorId): { run: RunState; sound: Sound } | null {
  if (!can(run, floor).knock || run.play.knocks[door] !== undefined || run.play.opened.includes(door)) return null;
  const sound = floor.doors[door - 1]!.sound;
  return { run: update(run, { knocks: { ...run.play.knocks, [door]: sound } }, { stats: { ...run.stats, knocks: run.stats.knocks + 1 } }), sound };
}

/** The way up as a door number for Mr. Hinges (0: it isn't a door). */
const exitNumber = (floor: Floor) => (typeof floor.exit === "number" ? floor.exit : 0);

export function ask(run: RunState, floor: Floor, question: Question): { run: RunState; yes: boolean } | null {
  if (!can(run, floor).ask || !floor.doorman) return null;
  const yes = answerOf(question, exitNumber(floor), floor.doorman.lies);
  const doubleNegative = run.stats.doubleNegative || (question.type === "wouldSay" && floor.doorman.lies);
  return { run: update(run, { answer: { question, yes } }, { stats: { ...run.stats, questions: run.stats.questions + 1, doubleNegative } }), yes };
}

export function pickUp(run: RunState, floor: Floor): RunState {
  if (!can(run, floor).pickUp || !floor.item) return run;
  const items = { ...run.items };
  let keys = run.keys;
  switch (floor.item) {
    case "luckyKey":
      keys++;
      break;
    case "truthCoin":
      items.truthCoin++;
      break;
    case "crowbar":
      items.crowbar++;
      break;
    default:
      items[floor.item] = true;
  }
  return update(run, { taken: true }, { items, keys });
}

/** The Truth Coin, on a sign: true or false? */
export function flipCoin(run: RunState, floor: Floor, door: DoorId): { run: RunState; truth: boolean } | null {
  const target = floor.doors[door - 1];
  if (!can(run, floor).coin || !target?.sign || typeof floor.exit !== "number" || run.play.coins[door] !== undefined) return null;
  const truth = signTruths(floor, floor.exit)?.get(door) ?? false;
  return {
    run: update(run, { coins: { ...run.play.coins, [door]: truth }, itemsUsed: run.play.itemsUsed + 1 }, { items: { ...run.items, truthCoin: run.items.truthCoin - 1 }, stats: { ...run.stats, items: run.stats.items + 1 } }),
    truth,
  };
}

/** The crowbar: a peek through the crack. Do the stairs go up? */
export function peek(run: RunState, floor: Floor, door: DoorId): { run: RunState; up: boolean } | null {
  if (!can(run, floor).crowbar || run.play.peeks[door] !== undefined || run.play.opened.includes(door)) return null;
  const up = floor.exit === door;
  return {
    run: update(run, { peeks: { ...run.play.peeks, [door]: up }, itemsUsed: run.play.itemsUsed + 1 }, { items: { ...run.items, crowbar: run.items.crowbar - 1 }, stats: { ...run.stats, items: run.stats.items + 1 } }),
    up,
  };
}

export function toggleChalk(run: RunState, floor: Floor, door: DoorId): RunState {
  if (!can(run, floor).chalk) return run;
  const chalk = run.play.chalk.includes(door) ? run.play.chalk.filter((d) => d !== door) : [...run.play.chalk, door];
  return update(run, { chalk });
}

/** Shifting doors: the lights flicker and the doors move (the first time you go to open one). */
export const flicker = (run: RunState): RunState => update(run, { shuffled: true });

/** Which door is at place `place` (1-based) now. */
export function doorAt(floor: Floor, run: RunState, place: number): DoorId {
  return floor.shuffle && run.play.shuffled ? floor.shuffle[place - 1]! : place;
}

export type Choice = DoorId | "back" | "painting";

export type Outcome =
  | { type: "up"; run: RunState; escaped: boolean }
  | { type: "wrong"; run: RunState; consequence: Consequence; door: Choice }
  | { type: "lucky"; run: RunState; opened: DoorId };

/** Detective points for a floor: fewer clues and no wrong doors score more (Plan §7). */
export function pointsFor(play: FloorPlay): number {
  const knocks = Object.keys(play.knocks).length;
  return Math.max(10, 100 - 15 * knocks - (play.answer ? 20 : 0) - 25 * play.itemsUsed - 40 * play.wrong);
}

/** Open a door (or the painting, or go back). */
export function choose(run: RunState, floor: Floor, choice: Choice): Outcome {
  if (floor.lucky && typeof choice === "number" && !run.play.lucky) {
    // He opens a wrong door you didn't pick, and offers the switch.
    const opened = hostOpens(choice, floor.exit as DoorId, createRng(`lucky:${run.seed}:${run.floor}:${run.play.visit}`));
    return { type: "lucky", run: update(run, { lucky: { picked: choice, opened } }), opened };
  }
  if (choice === floor.exit) return climb(run, floor, choice);
  // Wrong.
  const consequence: Consequence =
    choice === "back" || choice === "painting" ? (floor.final ? "loseKey" : "downstairs") : (floor.doors[choice - 1]?.consequence ?? "loseKey");
  const marked = typeof choice === "number" ? [...run.play.opened, choice] : run.play.opened;
  const wrongBy = { ...run.wrongBy, [run.floor]: (run.wrongBy[run.floor] ?? 0) + 1 };
  const wrongRun = update(run, { opened: marked, wrong: run.play.wrong + 1, lucky: null }, { wrongBy, pending: { consequence, door: choice }, stats: { ...run.stats, wrong: run.stats.wrong + 1 } });
  return { type: "wrong", run: wrongRun, consequence, door: choice };
}

/** The Lucky Floor: stay with your pick, or switch. */
export function decide(run: RunState, floor: Floor, switching: boolean): Outcome {
  const lucky = run.play.lucky!;
  const final = switching ? switchTo(lucky.picked, lucky.opened) : lucky.picked;
  const outcome = choose({ ...run, play: { ...run.play, lucky } }, { ...floor, lucky: false }, final);
  if (outcome.type === "up" && switching) return { ...outcome, run: { ...outcome.run, stats: { ...outcome.run.stats, switchWon: true } } };
  if (outcome.type === "wrong") return { ...outcome, consequence: "downstairs", run: { ...outcome.run, pending: { consequence: "downstairs", door: outcome.door } } };
  return outcome;
}

function climb(run: RunState, floor: Floor, choice: Choice): Outcome {
  const style = typeof choice === "number" ? (floor.doors[choice - 1]?.style ?? null) : null;
  const step: Step = {
    floor: run.floor,
    style,
    wrong: run.play.wrong,
    knocks: Object.keys(run.play.knocks).length,
    question: !!run.play.answer,
    items: run.play.itemsUsed,
    lucky: floor.archetype === "montyHall",
    points: pointsFor(run.play),
  };
  const anomalies = run.stats.anomalies + (floor.anomaly?.changed && choice === "back" ? 1 : 0);
  const chalkLog = run.items.chalk ? [...run.chalkLog, { floor: run.floor, style }] : run.chalkLog;
  const escaped = run.floor >= topFloor(run.mode);
  const next = run.floor + 1;
  const visits = { ...run.visits, [next]: (run.visits[next] ?? -1) + 1 };
  const moved: RunState = {
    ...run,
    floor: escaped ? run.floor : next,
    visits: escaped ? run.visits : visits,
    path: [...run.path, step],
    chalkLog,
    stats: { ...run.stats, anomalies },
    status: escaped ? "escaped" : "play",
    play: escaped ? run.play : freshPlay(visits[next]!),
  };
  return { type: "up", run: escaped ? moved : arrive(moved), escaped };
}

/** On a new floor: a waiting curse lands here. */
function arrive(run: RunState): RunState {
  if (!run.cursed) return run;
  const floor = floorOf(run);
  return { ...run, cursed: false, play: { ...run.play, curse: curseFor(floor, hashString(`${run.seed}:${run.floor}:${run.play.visit}`)) } };
}

/** What a wrong door does, once you've seen the Truth Reveal (and, for the Wrong Room, how it went). */
export function suffer(was: RunState, consequence: Consequence, { escapedRoom = false }: { escapedRoom?: boolean } = {}): RunState {
  const run: RunState = { ...was, pending: null };
  switch (consequence) {
    case "downstairs": {
      const down = Math.max(1, run.floor - 1);
      const visits = { ...run.visits, [down]: (run.visits[down] ?? 0) + 1 };
      // Going down a floor takes the floor you climbed off your climb (you'll climb it again).
      const path = down < run.floor ? run.path.slice(0, -1) : run.path;
      const wrong = run.play.wrong;
      // Chalk notes for the floors you'll climb again go too (you'll make new ones).
      const chalkLog = run.chalkLog.filter((n) => n.floor < down);
      const back: RunState = { ...run, floor: down, visits, path, chalkLog, play: { ...freshPlay(visits[down]!), wrong: down === run.floor ? wrong : 0 } };
      return settle(arrive(back));
    }
    case "wrongRoom":
      return settle(escapedRoom ? run : { ...run, keys: run.keys - 1 });
    case "cursed":
      return { ...run, cursed: true };
    case "loseKey":
      return settle({ ...run, keys: run.keys - 1 });
  }
}

/** Out of keys? */
const settle = (run: RunState): RunState => (run.keys <= 0 ? { ...run, keys: 0, status: "out" } : run);

/** Total detective score so far. */
export const detective = (run: RunState) => run.path.reduce((s, p) => s + p.points, 0);

/** The run score: detective points, plus keys left and a bonus when you get out. */
export function scoreOf(run: RunState): number {
  return detective(run) + (run.status === "escaped" ? 300 + 50 * run.keys : 0);
}

/** The highest floor you reached. */
export const reached = (run: RunState) => Math.max(run.floor, ...run.path.map((p) => p.floor));

/** For the share card: a mark per floor reached. */
export function pathEmoji(run: RunState): string {
  const top = reached(run);
  let out = "";
  for (let f = 1; f <= top; f++) {
    const step = [...run.path].reverse().find((p) => p.floor === f);
    const isLast = f === top;
    if (step && run.status === "escaped" && isLast) out += "🏁";
    else if (step?.lucky && !run.wrongBy[f]) out += "🎲";
    else if (!step || run.wrongBy[f]) out += "❌";
    else out += "🚪";
  }
  return out;
}

/** Signs read on this floor: whether you can read them at all. */
export const canRead = (run: RunState, floor: Floor) => !floor.dark || run.items.lantern;
