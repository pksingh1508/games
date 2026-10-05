// The shapes of 99 Seconds (Plan/03-99-seconds.md §12 "Data model"): a chapter is data. Its views (four walls and
// close-ups), hotspots, interactions, timed events, processes (things that take their own time, like a pot
// coming to the boil) and what happens at zero; the clues it writes in your journal; and the room's memory (the
// scratches in your handwriting that appear when you're stuck). The rules engine reads it; nothing in a chapter
// is hard-coded logic.

export type ChapterId = "waiting-room" | "kitchen" | "clock-room";

export const CHAPTERS: readonly ChapterId[] = ["waiting-room", "kitchen", "clock-room"];

export type Wall = "north" | "east" | "south" | "west";

export const WALLS: readonly Wall[] = ["north", "east", "south", "west"];

/** A wall, or a close-up ("closeup:keypad"). */
export type ViewId = string;

export type Condition =
  | { flag: string; is?: boolean }
  | { hasItem: string; is?: boolean }
  | { secondsLeft: { gte?: number; lte?: number } }
  /** Looking at this view (or any of these). */
  | { viewing: string | readonly string[] }
  /** Which version of the room you're in (Chapter 1 has a mirrored one). */
  | { room: string }
  /** What's been typed on a keypad. */
  | { entry: string }
  /** Your journal knows this. */
  | { clue: string; is?: boolean }
  | { not: Condition }
  | { any: readonly Condition[] }
  | { all: readonly Condition[] };

export type Effect =
  | { setFlag: string; value?: boolean }
  | { giveItem: string }
  | { takeItem: string }
  | { revealClue: string }
  | { playSound: string; caption?: string; wall?: Wall }
  | { goToView: string }
  /** Step into another version of the room, facing this way. */
  | { goToRoom: string; view: string }
  | { say: string }
  /** A key on a keypad. */
  | { type: string }
  | { clearEntry: true }
  /** Restart a process from nothing. */
  | { resetProcess: string }
  /** The chapter's over: on to the next, or one of the two endings. */
  | { endChapter: "next" | "true" | "paradox" }
  /** The loop's one extra second begins (Chapter 3's hundredth). */
  | { extraSecond: true }
  /** Only if these hold (otherwise the `else` effects, if any). */
  | { when: readonly Condition[]; then: readonly Effect[]; else?: readonly Effect[] };

export interface Hotspot {
  id: string;
  /** The wall or close-up it's on (Chapter 1's mirrored room flips walls itself). */
  view: ViewId;
  /** For screen readers and the hotspot highlight: "the coat". */
  label: string;
  /** Where, in the 1600 × 900 scene: x, y, width, height. */
  box: readonly [number, number, number, number];
  /** Only there when these hold. */
  when?: readonly Condition[];
  /** What you see when nothing else happens. */
  look?: string;
  /** Opens this close-up when clicked with nothing in hand (and nothing else applies). */
  zoom?: ViewId;
}

export interface Interaction {
  id: string;
  /** A hotspot id, or "item:<id>" to use something on an item in your hands. */
  on: string;
  /** The item you're using (none: bare hands). */
  use?: string;
  requires?: readonly Condition[];
  /** Actions that take time (searching a coat: 3 s). The clock keeps running. */
  durationMs?: number;
  /** What the progress ring says while it happens. */
  doing?: string;
  effects: readonly Effect[];
}

export interface TimedEvent {
  /** Seconds left on the loop clock when it happens (the same second in every loop). */
  at: number;
  requires?: readonly Condition[];
  effects: readonly Effect[];
}

/** Something that takes its own time, while its conditions hold (a pot only heats while nobody watches it). */
export interface Process {
  id: string;
  while: readonly Condition[];
  ms: number;
  effects: readonly Effect[];
}

export interface Item {
  id: string;
  name: string;
  about: string;
}

export type ClueKind = "fact" | "event" | "code" | "note";

export interface Clue {
  id: string;
  kind: ClueKind;
  /** The journal line. */
  text: string;
  /** Timed events: when (seconds left), for the timeline. */
  at?: number;
  /** Codes: the digits. */
  code?: string;
  /** Notes in your handwriting: exactly what it says. */
  note?: string;
}

/** A goal the room's memory helps with: three stages of scratches, vaguer to plainer. */
export interface Goal {
  id: string;
  /** Done once your journal knows this. */
  done: string;
  /** The scratches (in your handwriting), stage 1 to 3. Stage 3 says it outright. */
  stages: readonly [string, string, string];
}

export interface ChapterDef {
  id: ChapterId;
  number: 1 | 2 | 3;
  title: string;
  /** The wall you wake up facing, and the room you're in. */
  start: { room: string; view: ViewId };
  /** Rooms that are mirror images (their east and west walls swap, and every wall is flipped). */
  mirrored?: readonly string[];
  /** How the room is when you wake up (flags set at the start of every loop). */
  startFlags?: readonly string[];
  /** Views that have a clock in them (looking at one stretches the second: chronostasis). */
  clockViews: readonly ViewId[];
  /** Close-ups and where Back takes you. */
  closeups: Readonly<Record<string, ViewId>>;
  hotspots: readonly Hotspot[];
  interactions: readonly Interaction[];
  events: readonly TimedEvent[];
  processes: readonly Process[];
  /** At zero: every rule that holds happens, in order. Unless one ends the chapter (or starts the extra second), the loop resets. */
  atZero: ReadonlyArray<{ requires: readonly Condition[]; effects: readonly Effect[] }>;
  items: readonly Item[];
  clues: readonly Clue[];
  goals: readonly Goal[];
  /** The HUD's loop clock is hidden (Chapter 2: you rely on the room's own clocks). */
  hideClock?: boolean;
}
