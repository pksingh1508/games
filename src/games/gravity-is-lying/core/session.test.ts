import { describe, expect, it } from "vitest";
import { JUMP, RESTART_TICKS, RIGHT, TILE } from "./constants";
import { buildRoom, type RoomSource } from "./room";
import { RoomSession, type SessionEvent } from "./session";

/** A 30 × 17 room: walls all round, the floor (row 15) drawn by the test, apples along the top. */
function room(floor: string, extra: Partial<RoomSource> = {}) {
  const rows = Array.from({ length: 17 }, (_, r) => {
    if (r === 0 || r === 16) return "#".repeat(30);
    if (r === 15) return `#${floor.padEnd(28, ".")}#`;
    if (r === 13) return `#${"..a.a.a".padEnd(28, ".")}#`;
    return `#${".".repeat(28)}#`;
  });
  return buildRoom({ id: "t", name: "Test", gravity: "down", ...extra, map: rows }, 1, 0);
}

function run(s: RoomSession, bits: number, ticks: number) {
  const events: SessionEvent[] = [];
  for (let i = 0; i < ticks; i++) events.push(...s.tick(bits));
  return events;
}

describe("a visit to a room", () => {
  it("starts the clock on the first move, not before (looking is free)", () => {
    const s = new RoomSession(room("S.......................O"));
    run(s, 0, 40);
    expect(s.started).toBe(false);
    expect(s.clock).toBe(0);
    expect(run(s, RIGHT, 1)).toContainEqual({ type: "start" });
    run(s, RIGHT, 9);
    expect(s.clock).toBe(10);
    expect(s.elapsed).toBe(50);
  });

  it("spikes restart the room almost at once, and count as a death", () => {
    const s = new RoomSession(room("S..^^^.................O"));
    const events: SessionEvent[] = [];
    while (!events.some((e) => e.type === "respawn")) events.push(...s.tick(RIGHT));
    const died = events.findIndex((e) => e.type === "death");
    expect(died).toBeGreaterThanOrEqual(0);
    expect(events.filter((e) => e.type === "death")).toEqual([{ type: "death", cause: "spikes" }]);
    expect(RESTART_TICKS).toBeLessThan(30);
    expect(s.deaths).toBe(1);
    expect(s.attempts).toBe(2);
    expect(s.world.newt.x).toBe(s.room.spawn.x);
  });

  it("golden apples stay found for the whole visit, deaths and restarts too", () => {
    const s = new RoomSession(room("S......^^^.............O"));
    // Jump along under the apples (row 13), then on into the spikes.
    run(s, RIGHT | JUMP, 12);
    run(s, RIGHT, 200);
    const found = s.apples;
    expect(found).not.toBe(0);
    expect(s.deaths).toBeGreaterThan(0);
    s.restart();
    expect(s.world.apples).toBe(found);
    expect(s.apples).toBe(found);
  });

  it("restarting (R) isn't a death", () => {
    const s = new RoomSession(room("S.......................O"));
    run(s, RIGHT, 30);
    s.restart();
    expect(s.deaths).toBe(0);
    expect(s.attempts).toBe(2);
    expect(s.started).toBe(false);
    expect(s.world.newt.x).toBe(s.room.spawn.x);
  });

  it("the portal: won, timed from the first move", () => {
    const s = new RoomSession(room("S..O"));
    run(s, 0, 20);
    run(s, RIGHT, 60);
    expect(s.won).toBe(true);
    expect(s.time).toBeGreaterThan(0);
    expect(s.time).toBeLessThan(60);
    // Nothing more happens after the portal.
    expect(run(s, RIGHT, 10)).toEqual([]);
  });

  it("invincibility (assist) catches every death, and still counts it", () => {
    const s = new RoomSession(room("S..^^^.................O"), { invincible: true });
    const events = run(s, RIGHT, 120);
    expect(events.some((e) => e.type === "net")).toBe(true);
    expect(events.some((e) => e.type === "respawn")).toBe(false);
    expect(s.world.status).toBe("play");
    expect(s.deaths).toBeGreaterThan(0);
    s.setAssist({ invincible: false });
    expect(s.world.netsEverywhere).toBe(false);
  });

  it("time on the ceiling adds up", () => {
    const s = new RoomSession(room("S.......................O", { gravity: "up" }));
    run(s, 0, 120);
    expect(s.ceilingTicks).toBeGreaterThan(60);
    expect(s.world.newt.y).toBe(TILE);
  });
});
