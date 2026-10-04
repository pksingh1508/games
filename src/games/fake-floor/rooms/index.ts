// Every room, in play order (Plan/05-fake-floor.md §5): five worlds of ten rooms, then The Floor.
// The world map is a building cross-section, so each world is a storey (of course).
import { parseRoom, type Room, type RoomSource } from "../core/room";
import { FINAL } from "./final";
import { WORLD_1 } from "./world1";
import { WORLD_2 } from "./world2";
import { WORLD_3 } from "./world3";
import { WORLD_4 } from "./world4";
import { WORLD_5 } from "./world5";

export type WorldId = 1 | 2 | 3 | 4 | 5 | 6;

export interface WorldInfo {
  id: WorldId;
  name: string;
  /** One line for the map. */
  blurb: string;
  /** What gives a lying floor away here. */
  tell: string;
  rooms: string[];
}

const SOURCES: RoomSource[] = [...WORLD_1, ...WORLD_2, ...WORLD_3, ...WORLD_4, ...WORLD_5, ...FINAL];
const BY_ID = new Map(SOURCES.map((s) => [s.id, s]));

export const ROOM_IDS = SOURCES.map((s) => s.id);
export const FINAL_ROOM = FINAL[0]!.id;

export const WORLDS: WorldInfo[] = [
  {
    id: 1,
    name: "The Showroom",
    blurb: "A clean, bright floor showroom. Fake floors, crumbling floors and your first pebbles.",
    tell: "A fake tile's grout lines don't line up with its neighbours'.",
    rooms: WORLD_1.map((r) => r.id),
  },
  {
    id: 2,
    name: "Rainy Rooftops",
    blurb: "Night rooftops in the rain. Splashes show what's real, and some floors are invisible.",
    tell: "Rain splashes on real floors, even invisible ones. Fakes stay dry.",
    rooms: WORLD_2.map((r) => r.id),
  },
  {
    id: 3,
    name: "Lantern Mines",
    blurb: "Dark mines and swinging lanterns. Floors that hold you once.",
    tell: "Real floors cast shadows that swing with the lantern. Dust settles on anything real.",
    rooms: WORLD_3.map((r) => r.id),
  },
  {
    id: 4,
    name: "Hall of Mirrors",
    blurb: "The betrayal. Mimic floors fake the old tells, so you find the deeper ones.",
    tell: "A mimic's shadow doesn't swing, and its splashes fall between the gusts.",
    rooms: WORLD_4.map((r) => r.id),
  },
  {
    id: 5,
    name: "The Painting",
    blurb: "A world inside a giant painting. Some floors are only paint.",
    tell: "Painted floors slide a little when the view moves. Look ahead and watch.",
    rooms: WORLD_5.map((r) => r.id),
  },
  {
    id: 6,
    name: "The Floor",
    blurb: "The floor itself, awake, flipping tiles between real and fake. Read every tell at once.",
    tell: "All of them.",
    rooms: FINAL.map((r) => r.id),
  },
];

export function roomSource(id: string): RoomSource {
  const source = BY_ID.get(id);
  if (!source) throw new Error(`No room ${id}`);
  return source;
}

export const hasRoom = (id: string) => BY_ID.has(id);

const parsed = new Map<string, Room>();

/** A room ready to play (parsed once). */
export function getRoom(id: string): Room {
  let room = parsed.get(id);
  if (!room) {
    room = parseRoom(roomSource(id));
    parsed.set(id, room);
  }
  return room;
}

export function worldOfRoom(id: string): WorldInfo {
  return WORLDS.find((w) => w.rooms.includes(id))!;
}

/** The room after this one in play order (null after the last). */
export function nextRoomId(id: string): string | null {
  const i = ROOM_IDS.indexOf(id);
  return i >= 0 && i < ROOM_IDS.length - 1 ? ROOM_IDS[i + 1]! : null;
}

/** Rooms open one after another: a room is open once the one before it is cleared. */
export function isUnlocked(id: string, cleared: (id: string) => boolean): boolean {
  const i = ROOM_IDS.indexOf(id);
  return i === 0 || (i > 0 && cleared(ROOM_IDS[i - 1]!));
}

/** "1-07", or "★" for The Floor. */
export const roomLabel = (id: string) => (id === FINAL_ROOM ? "★" : id);

/** Rooms with a hidden pebble (Floor Inspector). */
export const HIDDEN_ROOMS = SOURCES.filter((s) => s.map.some((row) => row.includes("h"))).map((s) => s.id);
