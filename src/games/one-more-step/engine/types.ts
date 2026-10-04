// One More Step's rules, as data (Plan/01-one-more-step.md §3, §12). A level is a small grid; the world
// only moves when you do. Everything here is plain data: the rules (rules.ts) are a pure function of it.

export type Dir = "up" | "down" | "left" | "right";
export type Action = { type: "move"; dir: Dir } | { type: "wait" };

export interface Pos {
  x: number;
  y: number;
}

/** The order Doory breaks ties in (Plan §3): up, right, down, left. */
export const DIRS: readonly Dir[] = ["up", "right", "down", "left"];
export const DELTA: Record<Dir, Pos> = { up: { x: 0, y: -1 }, right: { x: 1, y: 0 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 } };

/** What a cell is (what's on it that moves or changes is in the state). */
export const Cell = {
  Floor: 0,
  Wall: 1,
  Crumble: 2,
  Spikes: 3,
  Hole: 4,
  Conveyor: 5,
  Plate: 6,
  Gate: 7,
  /** A hole that glows from below: in a Basement level, falling in is the way out. */
  Basement: 8,
  /** A crumble tile with the real exit under it (the Painted Door levels). */
  Secret: 9,
  /** Spikes that rise together every few ticks ("Steps left"). */
  Wave: 10,
} as const;
export type Cell = (typeof Cell)[keyof typeof Cell];

/** Doory's moods. */
export type DoorBehavior = "still" | "shy" | "brave" | "finale";

export interface NarratorLine {
  /** When: the start, a tick number, or an event. */
  at: "start" | number | "run" | "cornered" | "undo" | "death" | "plate" | "fall";
  text: string;
  /** World 5: it isn't true (the bubble's tail points away from you). */
  lie?: boolean;
}

export interface LevelDef {
  /** "1-1"; the finale is "6-1". */
  id: string;
  world: 1 | 2 | 3 | 4 | 5 | 6;
  name: string;
  /**
   * The map, one string per row:
   *   #  wall     .  floor    ~  crumble   X x  spikes (up / down now)   O  hole
   *   P  player   E  exit door (Doory)      e  a second exit (the twin's)   T  mirror twin
   *   S  sentinel _  pressure plate   |  gate   < > ^ v  conveyors   B  basement hole (the way out)
   *   h  crumble with the real exit under it   D  a painted door (on a wall)
   *   W  wave spikes (rise every `wave` ticks)   Z z  lazy spikes (up / down: they only move when you wait)
   */
  map: string[];
  door?: DoorBehavior;
  echoDelay?: number;
  wave?: number;
  /** No undo here (World 5's taped-over button). */
  noUndo?: boolean;
  /** Only tiles within 2 steps of you can be seen. */
  fog?: boolean;
  narrator?: NarratorLine[];
}

/** A level read into arrays (static: nothing here changes as you play). */
export interface Course {
  def: LevelDef;
  w: number;
  h: number;
  cells: Uint8Array;
  /** Conveyors' directions (index into DIRS), per cell. */
  belts: Int8Array;
  /** Spikes that start raised (and lazy spikes). */
  spikesUp: Uint8Array;
  lazy: Uint8Array;
  /** Where a painted door is drawn (on a wall), for show. */
  painted: Pos[];
  start: Pos;
  /** The exits: Doory first; in twin levels, the twin's exit second. */
  doors: Pos[];
  twin: Pos | null;
  sentinels: Pos[];
  /** Index of each crumble (and secret) cell into the broken-tiles bitmask, or -1. */
  crumbleIndex: Int16Array;
  crumbles: number;
  behavior: DoorBehavior;
  echoDelay: number;
  wave: number;
}

export type Status = "play" | "won" | "dead" | "reset";
export type Cause = "spikes" | "hole" | "echo" | "sentinel" | "door" | "twin";

export interface State {
  tick: number;
  player: Pos;
  /** Real exits (Doory first). A secret exit only joins this list once its crumble breaks. */
  doors: Pos[];
  /** Broken crumble tiles (bitmask by crumbleIndex, as a little array of 32-bit words). */
  broken: number[];
  /** Normal spikes flip every tick; lazy spikes only when you wait. */
  lazyFlips: number;
  /** Your last positions, newest last (the echo walks them `echoDelay` ticks behind). */
  trail: Pos[];
  twin: Pos | null;
  /** Sentinels (null: fallen in a hole). */
  sentinels: Array<Pos | null>;
  /** Waits in a row (the finale counts them). */
  waits: number;
  /** The finale: you waited long enough, and Doory is coming to you. */
  coming: boolean;
  /** The tick Doory first ran (Catch Me If You Can), or -1. */
  ran: number;
  status: Status;
  cause: Cause | null;
}

export type GameEvent =
  | { type: "step"; from: Pos; to: Pos }
  | { type: "wait" }
  | { type: "bump"; at: Pos; dir: Dir }
  | { type: "crumble"; at: Pos }
  | { type: "reveal"; at: Pos }
  | { type: "push"; who: "player" | "door" | "sentinel"; from: Pos; to: Pos }
  | { type: "door"; from: Pos; to: Pos; first: boolean }
  | { type: "cornered"; at: Pos }
  | { type: "charge"; from: Pos; to: Pos }
  | { type: "twin"; from: Pos; to: Pos }
  | { type: "sentinel"; from: Pos; to: Pos }
  | { type: "sentinelFall"; at: Pos }
  | { type: "plate"; at: Pos; down: boolean }
  | { type: "gates"; open: boolean }
  | { type: "die"; cause: Cause; at: Pos }
  | { type: "fall"; at: Pos }
  | { type: "win"; at: Pos }
  | { type: "reset" };

export const samePos = (a: Pos | null | undefined, b: Pos | null | undefined) => !!a && !!b && a.x === b.x && a.y === b.y;
export const manhattan = (a: Pos, b: Pos) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
