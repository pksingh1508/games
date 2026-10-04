// Every room, by world (Plan/15-gravity-is-lying.md §5): five worlds of eight rooms, then Isaac's
// Tree. Rooms open one after another; a world opens when the one before it is cleared.
import { buildRoom, type Room, type RoomSource, type WorldId } from "../core/room";
import { WORLD_1 } from "./world1";
import { WORLD_2 } from "./world2";
import { WORLD_3 } from "./world3";
import { WORLD_4 } from "./world4";
import { WORLD_5 } from "./world5";
import { WORLD_6 } from "./world6";

export interface WorldInfo {
  id: WorldId;
  name: string;
  /** What it brings in. */
  blurb: string;
  rooms: string[];
}

const SOURCES: Array<{ id: WorldId; name: string; blurb: string; rooms: readonly RoomSource[] }> = [
  { id: 1, name: "The Lab", blurb: "Levers and zones. The arrow tells the truth (for now).", rooms: WORLD_1 },
  { id: 2, name: "Flip Facility", blurb: "Flip gravity yourself. Spikes on the floors, and on the ceilings.", rooms: WORLD_2 },
  { id: 3, name: "The Liar's Gallery", blurb: "The arrow lies. The paint lies. Isaac lies. Some rooms turn by themselves.", rooms: WORLD_3 },
  { id: 4, name: "Tilted Town", blurb: "The camera turns the town upright. Gravity doesn't care.", rooms: WORLD_4 },
  { id: 5, name: "Orbit", blurb: "Little planets pull toward their middles. Some are only painted on the sky.", rooms: WORLD_5 },
  { id: 6, name: "Isaac's Tree", blurb: "Even the water lies up here. Trust your scarf. Isaac is waiting at the top.", rooms: WORLD_6 },
];

export const WORLDS: WorldInfo[] = SOURCES.map((w) => ({ id: w.id, name: w.name, blurb: w.blurb, rooms: w.rooms.map((r) => r.id) }));

const ROOMS = new Map<string, Room>();
for (const w of SOURCES) w.rooms.forEach((src, i) => ROOMS.set(src.id, buildRoom(src, w.id, i)));

export const ROOM_IDS: string[] = SOURCES.flatMap((w) => w.rooms.map((r) => r.id));

export function getRoom(id: string): Room {
  const room = ROOMS.get(id);
  if (!room) throw new Error(`No room ${id}`);
  return room;
}

export const worldOf = (id: string): WorldInfo => WORLDS.find((w) => w.rooms.includes(id))!;

/** The last room: Isaac, at the top of his tree. */
export const FINAL_ROOM = ROOM_IDS[ROOM_IDS.length - 1]!;

/** The room after this one (in the whole game), or null at the end. */
export function nextRoomId(id: string): string | null {
  const i = ROOM_IDS.indexOf(id);
  return ROOM_IDS[i + 1] ?? null;
}

/** "1-04" → "1-4" (the way rooms are named on the map). */
export const roomLabel = (id: string) => id.replace(/-0?/, "-");
