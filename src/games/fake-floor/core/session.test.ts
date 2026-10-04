import { describe, expect, it } from "vitest";
import { logFromText } from "@/engine/replay";
import { getRoom } from "../rooms";
import { DEV_RUNS } from "../rooms/dev-runs";
import { JUMP, NET_TICKS, RESPAWN_TICKS, RIGHT } from "./constants";
import { parseRoom } from "./room";
import { RoomSession } from "./session";

const testRoom = (rows: string[]) =>
  parseRoom({ id: "1-99", name: "Test", pebbles: 2, map: rows.map((r) => (r.length >= 30 ? r : r.padEnd(30, r.endsWith("#") ? "#" : "."))) });

function run(session: RoomSession, bits: number, ticks: number, { untilRespawn = false } = {}) {
  const events = [];
  for (let i = 0; i < ticks; i++) {
    const now = session.tick(bits);
    events.push(...now);
    if (untilRespawn && now.some((e) => e.type === "respawn")) break;
  }
  return events;
}

describe("a visit to a room", () => {
  it("starts the clock on your first step, not before (looking and throwing are free)", () => {
    const s = new RoomSession(testRoom(["S........................D", "#", "", "", ""]));
    run(s, 0, 30);
    expect(s.started).toBe(false);
    expect(s.throw(100, 200)).toBe(true);
    run(s, 0, 30);
    expect(s.started).toBe(false);
    expect(s.elapsed).toBe(0);
    expect(run(s, RIGHT, 1)).toContainEqual({ type: "start" });
    expect(s.clock).toBe(1);
  });

  it("a fall restarts the room in under half a second, and counts", () => {
    const s = new RoomSession(testRoom(["S........................D", "####f#", "", "", ""]));
    const events = run(s, RIGHT, 200, { untilRespawn: true });
    expect(events.filter((e) => e.type === "fall")).toHaveLength(1);
    expect(RESPAWN_TICKS).toBeLessThan(30);
    expect(events).toContainEqual({ type: "respawn" });
    expect(s.falls).toBe(1);
    expect(s.causes).toEqual(["fake"]);
    expect(s.attempts).toBe(2);
    expect(s.world.p.x).toBe(s.room.spawn.x);
  });

  it("restarting (R) isn't a fall, but the visit remembers its falls and pebbles", () => {
    const s = new RoomSession(testRoom(["S........................D", "####f#", "", "", ""]));
    run(s, RIGHT, 200, { untilRespawn: true });
    s.throw(60, 200);
    s.restart();
    expect(s.falls).toBe(1);
    expect(s.thrown).toBe(1);
    expect(s.world.pebbles).toBe(2);
    expect(s.started).toBe(false);
  });

  it("a safety net counts as a fall but doesn't restart the room", () => {
    const s = new RoomSession(testRoom(["S........................D", "####f#", "", "", "nnnnnnnnnn"]));
    const before = s.world;
    const events = run(s, RIGHT, 60 + NET_TICKS);
    expect(events.some((e) => e.type === "net")).toBe(true);
    expect(events.some((e) => e.type === "respawn")).toBe(false);
    expect(s.world).toBe(before);
    expect(s.falls).toBe(1);
  });

  it("the time is the winning attempt's, from its first step to the door", () => {
    const room = getRoom("1-05");
    const run2 = DEV_RUNS["1-05"]!;
    const s = new RoomSession(room);
    for (const [bits, n] of logFromText(run2.log)) for (let i = 0; i < n; i++) s.tick(bits);
    expect(s.won).toBe(true);
    expect(s.time).toBe(run2.time);
  });

  it("time trials run the clock from the moment you arrive", () => {
    const s = new RoomSession(testRoom(["S........................D", "#", "", "", ""]), { clockFromStart: true });
    run(s, 0, 30);
    expect(s.elapsed).toBe(30);
  });

  it("assist can change mid-room", () => {
    const s = new RoomSession(testRoom(["S........................D", "#", "", "", ""]));
    s.setAssist({ unlimited: true, nets: true });
    for (let i = 0; i < 5; i++) expect(s.throw(100, 200)).toBe(true);
    expect(s.world.pebbles).toBe(2);
    expect(s.world.netsEverywhere).toBe(true);
    run(s, RIGHT | JUMP, 1);
    expect(s.started).toBe(true);
  });
});
