// Wrong Door's puzzles, as plain data (Plan/13-wrong-door.md §3, §12). A floor is a row of doors, exactly
// one of which is the way up (or, on the last floor, none of them), and the clues about it. Everything here
// is data: the solver (solver.ts) works out what a player can know from it, and the generators make sure
// that's always enough.

/** A door, by its place in the row: 1 is the leftmost (in the floor's own frame: a mirror floor shows it
 * on the right). */
export type DoorId = number;

/** What a sign can claim. "This" is the door the sign hangs on. */
export type Statement =
  | { type: "exitIs"; door: DoorId }
  | { type: "exitIsNot"; door: DoorId }
  | { type: "exitParity"; parity: "even" | "odd" }
  | { type: "exitLeftOf"; door: DoorId }
  | { type: "exitRightOf"; door: DoorId }
  | { type: "exitOneOf"; doors: readonly [DoorId, DoorId] }
  | { type: "exitNextTo"; door: DoorId }
  | { type: "signTrue"; door: DoorId }
  | { type: "signLies"; door: DoorId }
  /** "One of these doors is the way up." Always true. */
  | { type: "someExit" };

/** The plaque's rule about the signs. */
export type FloorRule =
  | { type: "exactlyTrue"; count: number }
  | { type: "allTrue" }
  | { type: "allLie" }
  /** The sign on the way up tells the truth; every other sign lies. */
  | { type: "exitSignTrue" }
  /** The sign on the way up lies; every other sign tells the truth. */
  | { type: "exitSignLies" };

export type Archetype =
  | "plainSigns"
  | "knightsKnaves"
  | "doorman"
  | "sound"
  | "sequence"
  | "mirror"
  | "anomaly"
  | "montyHall"
  | "memory"
  | "dark"
  | "liarsBanquet"
  | "shifting"
  | "final";

export const ARCHETYPES: readonly Archetype[] = [
  "plainSigns",
  "knightsKnaves",
  "doorman",
  "sound",
  "sequence",
  "mirror",
  "anomaly",
  "montyHall",
  "memory",
  "dark",
  "liarsBanquet",
  "shifting",
  "final",
];

export type DoorStyle = "wood" | "iron" | "velvet" | "glass" | "round";
export const DOOR_STYLES: readonly DoorStyle[] = ["wood", "iron", "velvet", "glass", "round"];

/** What you hear when you knock. Wind is always the way up; footsteps, ticking and whispers never are;
 * silence could be either (unless the plaque promises wind). */
export type Sound = "wind" | "footsteps" | "ticking" | "whispers" | "silence";

/** What happens behind a wrong door (it's what you heard behind it, if you knocked). */
export type Consequence = "downstairs" | "wrongRoom" | "cursed" | "loseKey";

/** The scratches that tell doors apart when they shuffle. */
export type Scratch = "slash" | "cross" | "ring" | "double" | "zigzag";
export const SCRATCHES: readonly Scratch[] = ["slash", "cross", "ring", "double", "zigzag"];

/** What can change on an anomaly floor (compared with the lobby). */
export type Anomaly =
  | "paintingUpsideDown"
  | "paintingMissing"
  | "shipSailsLeft"
  | "clockTime"
  | "clockBackwards"
  | "threeLamps"
  | "lampOut"
  | "plantMissing"
  | "plantMoved"
  | "rugBlue"
  | "stripes"
  | "signThirtyOne";

/** The kinds of clue (Liar's Banquet: every kind lies but one). */
export type ClueKind = "signs" | "doorman" | "light" | "candle" | "footprints";

export interface Door {
  id: DoorId;
  style: DoorStyle;
  sign: Statement | null;
  sound: Sound;
  /** A line of light under the door; null when the floor has no light clue. */
  light: boolean | null;
  /** A sequence floor's room number. */
  number: number | null;
  scratch: Scratch | null;
  /** Behind a wrong door; null for the way up. */
  consequence: Consequence | null;
}

export interface Doorman {
  lies: boolean;
  /** "on": you can see whether it's the red hat (with its feather). "off": he's holding it behind his back. */
  hat: "on" | "off";
}

/** A candle on the floor between doors: `at` doors are to its left. It leans towards the way up (or away,
 * if candles lie tonight). */
export interface Candle {
  at: number;
  lean: "left" | "right";
}

/** Footprints from where you stand to a door. "in": the toes point at the door (someone went through);
 * "out": the toes point back at you (someone came out of it: a dead end). */
export interface Footprints {
  door: DoorId;
  toes: "in" | "out";
}

export interface Floor {
  /** 1–13 (Endless goes on). */
  number: number;
  archetype: Archetype;
  /** For the scenery's small variations. */
  seed: number;
  doors: Door[];
  /** The way up: a door, the painting, or back the way you came. */
  exit: DoorId | "painting" | "back";
  /** The plaque's rule about the signs (null: no rule, or no signs). */
  rule: FloorRule | null;
  /** The plaque's other lines, in order (the rule's own line is added from `rule`). */
  notes: string[];
  doorman: Doorman | null;
  candle: Candle | null;
  footprints: Footprints | null;
  /** A sequence floor's terms so far. */
  sequence: number[] | null;
  /** A memory floor: the way up is the same kind of door you went through on this floor. */
  memory: { floor: number; style: DoorStyle } | null;
  /** An anomaly floor (two ways: up, or back the way you came), and what's changed (null: nothing). */
  anomaly: { changed: Anomaly | null } | null;
  mirror: boolean;
  dark: boolean;
  /** Liar's Banquet: the one kind of clue telling the truth tonight. */
  honest: ClueKind | null;
  /** The plaque promises the way up has wind behind it (so silence means "not this one"). */
  windRule: boolean;
  /** Shifting doors: where each door ends up when the lights flicker (shuffle[i] is the door now at place
   * i + 1). */
  shuffle: DoorId[] | null;
  /** The last floor: the way out isn't a door. "painting" or "back": whichever is there. */
  final: { way: "painting" | "back" } | null;
  /** Lucky Floor: Monty Hall. */
  lucky: boolean;
  /** Something to pick up here. */
  item: ItemKind | null;
}

export type ItemKind = "stethoscope" | "lantern" | "truthCoin" | "crowbar" | "chalk" | "luckyKey";
export const ITEM_KINDS: readonly ItemKind[] = ["stethoscope", "lantern", "truthCoin", "crowbar", "chalk", "luckyKey"];

/** What you can ask Mr. Hinges. */
export type Question =
  | { type: "isExit"; door: DoorId }
  | { type: "hatRed" }
  | { type: "wouldSay"; door: DoorId };

/** What you've found out on a floor (beyond what's on show). */
export interface Knowledge {
  knocks: Partial<Record<DoorId, Sound>>;
  /** Mr. Hinges's answer (one question a floor). */
  answer: { question: Question; yes: boolean } | null;
  /** The Truth Coin: whether a sign is true. */
  coins: Partial<Record<DoorId, boolean>>;
  /** The crowbar: whether the stairs go up behind a door. */
  peeks: Partial<Record<DoorId, boolean>>;
  /** Doors you've opened, and weren't it. */
  opened: DoorId[];
  /** You can read the signs and see his hat (lit, or a lantern). */
  canSee: boolean;
  /** The doorman's hat: you can see it (when it's on, and there's light). */
  seeHat: boolean;
}

export const emptyKnowledge = (floor: Floor, lantern = false): Knowledge => ({
  knocks: {},
  answer: null,
  coins: {},
  peeks: {},
  opened: [],
  canSee: !floor.dark || lantern,
  seeHat: !!floor.doorman && floor.doorman.hat === "on" && (!floor.dark || lantern),
});
