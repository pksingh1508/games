import { describe, expect, it } from "vitest";
import { CRUMBLE_TICKS, JUMP, NET_TICKS, REVEAL_TICKS, RIGHT, TILE, VIEW_H } from "./constants";
import { parseRoom, type Room, type RoomSource } from "./room";
import { createWorld, floorSolid, flipSolid, lobTo, step, throwPebble, type GameEvent, type World } from "./world";

/** A test room: rows are padded to 30 columns (with air, or with rock for rows ending in "#") and sit at the bottom of the room. */
function testRoom(rows: string[], extra: Partial<RoomSource> = {}): Room {
  const map = rows.map((r) => (r.length >= 30 ? r.slice(0, 30) : r.padEnd(30, r.endsWith("#") ? "#" : ".")));
  return parseRoom({ id: "1-99", name: "Test", pebbles: 3, map, ...extra });
}

/** Run `ticks` ticks of the same input; returns every event. */
function run(w: World, bits: number, ticks: number): GameEvent[] {
  const events: GameEvent[] = [];
  for (let i = 0; i < ticks && w.status === "play"; i++) {
    step(w, bits);
    events.push(...w.events);
  }
  return events;
}

const kinds = (events: GameEvent[]) => events.map((e) => e.type);

describe("floors", () => {
  it("a real floor holds you; a fake one drops you, and the fall knows why", () => {
    const room = testRoom([".S.......................D", "#####f#", "", "", ""]);
    const w = createWorld(room);
    const events = run(w, RIGHT, 300);
    expect(w.status).toBe("fell");
    expect(w.cause).toBe("fake");
    expect(events.find((e) => e.type === "fall")).toMatchObject({ cause: "fake" });
  });

  it("an honest gap is just a gap", () => {
    const room = testRoom([".S.......................D", "#####.#", "", "", ""]);
    const w = createWorld(room);
    run(w, RIGHT, 300);
    expect(w.cause).toBe("gap");
  });

  it("a crumbling floor holds you for 0.4 s, then goes", () => {
    const room = testRoom(["....S....................D", "####c#", "", "", ""]);
    const w = createWorld(room);
    const i = room.cells[13 * room.cols + 4]!;
    // Solid for 24 ticks from the moment you're on it…
    const events = run(w, 0, CRUMBLE_TICKS - 1);
    expect(events).toContainEqual({ type: "crumble", floor: i, phase: "shake" });
    expect(w.status).toBe("play");
    expect(floorSolid(w, i)).toBe(true);
    // …and gone on the next.
    expect(run(w, 0, 1)).toContainEqual({ type: "crumble", floor: i, phase: "fall" });
    expect(floorSolid(w, i)).toBe(false);
    run(w, 0, 120);
    expect(w.cause).toBe("crumble");
  });

  it("a return-trip floor holds you once, then cracks and lets you down on the way back", () => {
    const room = testRoom([".S.......................D", "#####r#", "", "", ""]);
    const w = createWorld(room);
    const i = room.cells[13 * room.cols + 5]!;
    // Over it and well past it.
    let events = run(w, RIGHT, 60);
    expect(w.status).toBe("play");
    expect(events).toContainEqual({ type: "crack", floor: i });
    expect(floorSolid(w, i)).toBe(false);
    // Back again.
    events = run(w, 1, 200);
    expect(w.status).toBe("fell");
    expect(w.cause).toBe("returnTrip");
  });

  it("an invisible floor holds you, and stepping on it untested is a leap of faith", () => {
    const room = testRoom([".S.......................D", "####iiii#", "", "", ""]);
    const w = createWorld(room);
    const events = run(w, RIGHT, 400);
    expect(w.status).toBe("won");
    expect(kinds(events)).toContain("leap");
  });

  it("flipping floors follow their pattern and never turn solid around you", () => {
    const flip = { period: 120, solid: 60, offset: 0 };
    expect(flipSolid(flip, 0)).toBe(true);
    expect(flipSolid(flip, 59)).toBe(true);
    expect(flipSolid(flip, 60)).toBe(false);
    expect(flipSolid(flip, 119)).toBe(false);
    expect(flipSolid(flip, 120)).toBe(true);
    // Standing on one when it goes: you fall.
    const room = testRoom(["....S....................D", "####1#", "", "", ""], { flips: { 1: flip } });
    const w = createWorld(room);
    run(w, 0, 200);
    expect(w.status).toBe("fell");
    expect(w.cause).toBe("flip");
  });
});

describe("pebbles never lie", () => {
  // One of each floor, rock between them.
  const room = testRoom(["S........................D", "##=#f#c#i#r#m#p#", "", "", ""]);
  const col = { solid: 2, fake: 4, crumble: 6, invisible: 8, returnTrip: 10, mimic: 12, painted: 14 } as const;

  it.each(Object.entries(col))("a pebble at a %s floor tells the truth", (kind, c) => {
    const w = createWorld(room);
    const i = room.cells[13 * room.cols + c]!;
    expect(throwPebble(w, c * TILE + 8, 13 * TILE + 3)).toBe(true);
    const events = run(w, 0, 120);
    const first = events.find((e) => e.type === "tok" || e.type === "tink" || e.type === "fwip");
    const truth = { solid: "tok", fake: "fwip", crumble: "tok", invisible: "tink", returnTrip: "tok", mimic: "fwip", painted: "fwip" }[kind];
    expect(first).toMatchObject({ type: truth, floor: i });
    if (kind === "crumble") expect(events).toContainEqual({ type: "crumble", floor: i, phase: "shake" });
    if (kind === "invisible") expect(w.fs.reveal[i]).toBeGreaterThan(REVEAL_TICKS - 130);
  });

  it("a pebble that finds no floor drops through and says nothing more (no knock on the next tile)", () => {
    // 1-03's first row of tiles (this room's floor is on row 13).
    const room = testRoom(["S........................D", "######=f==f#", "", "", ""]);
    const w = createWorld(room);
    throwPebble(w, 7 * TILE + 8, 13 * TILE + 3);
    const events = run(w, 0, 120);
    const answers = events.filter((e) => e.type === "tok" || e.type === "tink" || e.type === "fwip");
    expect(answers[0]).toMatchObject({ type: "fwip" });
    expect(answers.slice(1).every((e) => e.type === "tok" && e.soft)).toBe(true);
  });

  it("lands where it's aimed, and you can run out", () => {
    const open = testRoom(["S", "#", "", "", "...D"]);
    const w = createWorld(open);
    const from = { x: w.p.x + w.p.w / 2 + 4, y: w.p.y + 3 };
    const target = { x: 200, y: 150 };
    const { ticks } = lobTo(from, target.x, target.y);
    throwPebble(w, target.x, target.y);
    for (let i = 0; i < ticks; i++) step(w, 0);
    const stone = w.stones[0]!;
    expect(Math.abs(stone.x - target.x)).toBeLessThan(1);
    expect(Math.abs(stone.y - target.y)).toBeLessThan(1);

    const w2 = createWorld(room);
    expect([1, 2, 3, 4].map(() => throwPebble(w2, 40, 210))).toEqual([true, true, true, false]);
    expect(w2.pebbles).toBe(0);
    w2.unlimited = true;
    expect(throwPebble(w2, 40, 210)).toBe(true);
  });
});

describe("the room", () => {
  it("a safety net catches you and puts you back on safe ground, floors and all", () => {
    const room = testRoom(["S........................D", "#####fcc#", "", "", ".....nnn"]);
    const w = createWorld(room);
    // Over the crumbles and the fake: the crumbles go, you go.
    const events = run(w, RIGHT, 80);
    expect(kinds(events)).toContain("net");
    expect(w.status).toBe("play");
    run(w, 0, NET_TICKS + 2);
    expect(w.net).toBe(0);
    expect(w.p.y + w.p.h).toBe(13 * TILE);
    expect(w.p.x).toBeLessThan(5 * TILE);
    // Every crumble that fell is back.
    room.floors.forEach((f, i) => {
      if (f.kind === "crumble") expect(floorSolid(w, i)).toBe(true);
    });
  });

  it("assist nets catch you anywhere", () => {
    const room = testRoom(["S........................D", "#####f#", "", "", ""]);
    const w = createWorld(room, { nets: true });
    expect(kinds(run(w, RIGHT, 120))).toContain("net");
  });

  it("the door stays locked until you have the key", () => {
    const room = testRoom(["k", "S..........D", "#", "", "", ""]);
    const locked = createWorld(room);
    const events = run(locked, RIGHT, 200);
    expect(kinds(events)).toContain("locked");
    expect(locked.status).toBe("play");

    // Jump straight up for the key above the start, then go.
    const w = createWorld(room);
    run(w, JUMP, 40);
    const more = run(w, RIGHT, 200);
    expect(w.key).toBe(true);
    expect(w.status).toBe("won");
    expect(kinds(more)).toContain("win");
  });

  it("pickups add pebbles; hidden ones say so", () => {
    const room = testRoom(["S...o...h................D", "#", "", "", ""]);
    const w = createWorld(room);
    const events = run(w, RIGHT, 400);
    expect(events.filter((e) => e.type === "pickup")).toEqual([
      { type: "pickup", index: 0, hidden: false },
      { type: "pickup", index: 1, hidden: true },
    ]);
    expect(w.pebbles).toBe(5);
  });

  it("falling off the bottom ends the attempt", () => {
    const room = testRoom(["S........................D", "####..#", "", "", ""]);
    const w = createWorld(room);
    run(w, RIGHT, 300);
    expect(w.status).toBe("fell");
    expect(w.p.y).toBeGreaterThan(VIEW_H);
  });
});
