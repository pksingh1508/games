// What a level is (Plan/11-panic-stack.md §12 "Data model"): a location, a time limit, a goal line, a
// platform, the items in conveyor order, and its panic events.
import type { ItemId } from "./items";

export type LocationId = "kitchen" | "warehouse" | "toyroom" | "museum" | "bakery" | "space";

export type EventKind =
  | "earthquake"
  | "wind"
  | "cat"
  | "tilt"
  | "lowGravity"
  | "iceAge"
  | "bird"
  | "platformShrink"
  | "lightsOut"
  | "fakePanic"
  | "reskin"
  | "conveyorRush";

/** What rides the belt: an item, or X-ray glasses (§3: a rare power-up). */
export type BeltKind = ItemId | "xray";

export interface LevelEvent {
  kind: EventKind;
  /** When its warning starts (seconds into the level). */
  at: number;
  /** 1 is normal; earthquakes and wind scale with it. */
  strength?: number;
  /** Wind and tilt: which way (−1 left, 1 right). Chosen by the level's seed when left out. */
  dir?: -1 | 1;
}

export interface LevelDef {
  id: string;
  name: string;
  location: LocationId;
  /** Seconds to finish (0: no limit). */
  time: number;
  /** The goal line, in metres above the platform. */
  goal: number;
  /** The platform's width (m). */
  platform: number;
  /** The conveyor's order. */
  items: readonly BeltKind[];
  /** Once the list runs out, items are picked from these (seeded; repeat one to make it likelier). */
  more: readonly BeltKind[];
  /** Seconds an item rides the belt, from coming in on the right to dropping off the left. */
  belt: number;
  events: readonly LevelEvent[];
  /** Random events (seeded): which kinds, and the gap between them in seconds. */
  random?: { kinds: readonly EventKind[]; every: readonly [number, number] };
  /** Gravity (m/s²) if it isn't 10 (the space station). */
  gravity?: number;
  /** Shown on the level's start card. */
  hint: string;
}
