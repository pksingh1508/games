// The design review (Plan/05-fake-floor.md §10, §14), as tests: every floor that lies has an honest
// tell; every new trick is introduced over a safety net; lanterns light what they need to; paint
// only lies where the view can move; every hidden pebble can be reached.
import { describe, expect, it } from "vitest";
import { TILE, VIEW_W } from "../core/constants";
import { DECEPTIVE, type FloorKind } from "../core/room";
import { solve } from "../core/solver";
import { hasGroutReference, tellsOf } from "../core/tells";
import { getRoom, HIDDEN_ROOMS, isUnlocked, nextRoomId, ROOM_IDS, roomLabel, WORLDS } from "./index";

describe("the rooms", () => {
  it("five worlds of ten, and The Floor", () => {
    expect(ROOM_IDS).toHaveLength(51);
    expect(WORLDS.map((w) => w.rooms.length)).toEqual([10, 10, 10, 10, 10, 1]);
    for (const w of WORLDS.slice(0, 5)) w.rooms.forEach((id, i) => expect(id).toBe(`${w.id}-${String(i + 1).padStart(2, "0")}`));
    expect(roomLabel("6-01")).toBe("★");
  });

  it("have different names", () => {
    const names = ROOM_IDS.map((id) => getRoom(id).name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("open one after another", () => {
    const cleared = new Set(["1-01", "1-02"]);
    expect(isUnlocked("1-01", () => false)).toBe(true);
    expect(isUnlocked("1-03", (id) => cleared.has(id))).toBe(true);
    expect(isUnlocked("1-04", (id) => cleared.has(id))).toBe(false);
    expect(nextRoomId("1-10")).toBe("2-01");
    expect(nextRoomId("6-01")).toBeNull();
  });

  it("use every kind of floor, each world adding its own", () => {
    const firstSeen = new Map<FloorKind, string>();
    for (const id of ROOM_IDS) for (const f of getRoom(id).floors) if (!firstSeen.has(f.kind)) firstSeen.set(f.kind, id);
    expect(Object.fromEntries(firstSeen)).toEqual({
      solid: "1-01",
      fake: "1-01",
      crumble: "1-04",
      invisible: "2-03",
      returnTrip: "3-07",
      mimic: "4-01",
      painted: "5-01",
      flip: "6-01",
    });
  });
});

describe("fairness", () => {
  it.each(ROOM_IDS)("%s: every floor that lies has an honest tell", (id) => {
    const room = getRoom(id);
    room.floors.forEach((f, i) => {
      if (!DECEPTIVE.has(f.kind)) return;
      expect(tellsOf(room, i), `${f.kind} at ${f.c},${f.r}`).not.toEqual([]);
    });
  });

  it.each(ROOM_IDS)("%s: in a room whose only tell is grout, every fake has a neighbour to compare with", (id) => {
    const room = getRoom(id);
    if (!room.env.grout || room.env.rain !== "none" || room.env.lantern) return;
    room.floors.forEach((f, i) => {
      if (f.kind === "fake") expect(hasGroutReference(room, i), `fake at ${f.c},${f.r}`).toBe(true);
    });
  });

  it("every world's tell is first shown over a safety net, and so is every new kind of floor", () => {
    const netted = (id: string, kinds: FloorKind[]) => {
      const room = getRoom(id);
      const tiles = room.floors.filter((f) => kinds.includes(f.kind));
      expect(tiles.length, id).toBeGreaterThan(0);
      for (const f of tiles) expect(room.nets[f.c], `${id}: ${f.kind} at ${f.c}`).toBe(true);
    };
    netted("1-01", ["fake"]);
    netted("2-01", ["fake"]);
    netted("2-03", ["invisible"]);
    netted("3-01", ["fake"]);
    netted("3-03", ["invisible", "fake"]);
    netted("3-07", ["returnTrip"]);
    netted("4-01", ["mimic"]);
    netted("4-02", ["mimic"]);
    netted("5-01", ["painted"]);
    // The first crumbling floors, too.
    const crumbles = getRoom("1-04").floors.filter((f) => f.kind === "crumble" && f.c < 10);
    for (const f of crumbles) expect(getRoom("1-04").nets[f.c]).toBe(true);
  });

  it.each(ROOM_IDS)("%s: lanterns light every floor that lies", (id) => {
    const room = getRoom(id);
    if (!room.env.lantern) return;
    room.floors.forEach((f) => {
      if (!DECEPTIVE.has(f.kind)) return;
      const near = Math.min(...room.lanterns.map((l) => Math.hypot(l.x - (f.x + TILE / 2), l.len - f.y)));
      expect(near, `${f.kind} at ${f.c},${f.r}`).toBeLessThan(150);
    });
  });

  it.each(ROOM_IDS)("%s: paint only lies where the view can move", (id) => {
    const room = getRoom(id);
    if (room.floors.some((f) => f.kind === "painted")) expect(room.width).toBeGreaterThan(VIEW_W);
  });

  it("two hidden pebbles in every world, none in The Floor, and every one can be reached", { timeout: 120_000 }, () => {
    for (const w of WORLDS.slice(0, 5)) expect(w.rooms.filter((id) => HIDDEN_ROOMS.includes(id)), `world ${w.id}`).toHaveLength(2);
    expect(HIDDEN_ROOMS).not.toContain("6-01");
    for (const id of HIDDEN_ROOMS) {
      const room = getRoom(id);
      const pebble = room.pickups.find((p) => p.hidden)!;
      // The solver, sent to the pebble first, then on to the door.
      const detour = { ...room, route: [{ x: pebble.x + pebble.w / 2, y: pebble.y + pebble.h / 2 - 4 }] };
      expect(solve(detour), id).not.toBeNull();
    }
  });
});
