// The design review (Plan/15-gravity-is-lying.md §10, §14), as tests: every liar room keeps an honest
// anchor; every liar is introduced over a safety net; the hum always comes 0.75 s before a timed
// turn; gravity changes never put Newt inside a wall; the rooms don't care about the camera (so the
// whole game works with reduce motion); nobody dies just for standing still.
import { describe, expect, it } from "vitest";
import { logFromText } from "@/engine/replay";
import { HUM_TICKS, TILE } from "../core/constants";
import { NEWT_R } from "../core/orbit";
import { WALL, cellAt, type Room } from "../core/room";
import { replay } from "../core/solver";
import { createWorld, newtBox, step } from "../core/world";
import { DEV_RUNS } from "./dev-runs";
import { FINAL_ROOM, getRoom, nextRoomId, ROOM_IDS, roomLabel, WORLDS, worldOf } from "./index";

/** The ways a room can lie about which way is down. */
const LIARS = {
  arrow: (r: Room) => r.arrowLie !== null,
  paint: (r: Room) => r.zones.some((z) => z.painted !== z.dir),
  isaac: (r: Room) => Boolean(r.isaac?.lines.some((l) => l.lie)),
  camera: (r: Room) => r.view.up !== "up" || r.view.tilt !== 0,
  painted: (r: Room) => r.planets.some((p) => p.fake),
  anchors: (r: Room) => r.anchorsLie !== null,
} as const;

const liesIn = (r: Room) => (Object.keys(LIARS) as Array<keyof typeof LIARS>).filter((k) => LIARS[k](r));

describe("the rooms", () => {
  it("five worlds of eight, then Isaac's Tree (four)", () => {
    expect(ROOM_IDS).toHaveLength(44);
    expect(WORLDS.map((w) => w.rooms.length)).toEqual([8, 8, 8, 8, 8, 4]);
    for (const w of WORLDS) w.rooms.forEach((id, i) => expect(id).toBe(`${w.id}-${String(i + 1).padStart(2, "0")}`));
    expect(FINAL_ROOM).toBe("6-04");
    expect(roomLabel("3-07")).toBe("3-7");
    expect(nextRoomId("1-08")).toBe("2-01");
    expect(nextRoomId(FINAL_ROOM)).toBeNull();
    expect(worldOf("4-03").name).toBe("Tilted Town");
  });

  it("have different names", () => {
    const names = ROOM_IDS.map((id) => getRoom(id).name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("bring in each idea in its own world", () => {
    const first = (test: (r: Room) => boolean) => ROOM_IDS.find((id) => test(getRoom(id)));
    expect(first((r) => r.levers.length > 0)).toBe("1-01");
    expect(first((r) => r.zones.length > 0)).toBe("1-04");
    expect(first((r) => r.flip)).toBe("2-01");
    expect(first(LIARS.arrow)).toBe("3-01");
    expect(first(LIARS.paint)).toBe("3-02");
    expect(first((r) => r.rotate !== null)).toBe("3-03");
    expect(first(LIARS.isaac)).toBe("3-01");
    expect(first(LIARS.camera)).toBe("4-01");
    expect(first((r) => r.kind === "orbit")).toBe("5-01");
    expect(first(LIARS.painted)).toBe("5-03");
    expect(first(LIARS.anchors)).toBe("6-01");
  });

  it("Tilted Town's turned rooms are square (they fit the screen at any quarter turn), and its tilts are gentle", () => {
    for (const id of ROOM_IDS) {
      const room = getRoom(id);
      if (room.view.up !== "up") expect(room.cols, id).toBe(room.rows);
      expect(Math.abs(room.view.tilt), id).toBeLessThanOrEqual(15);
    }
  });

  it("every lie Isaac tells has an honest version, for Truth Mode", () => {
    for (const id of ROOM_IDS) for (const line of getRoom(id).isaac?.lines ?? []) if (line.lie) expect(line.truth, `${id}: ${line.text}`).toBeTruthy();
  });
});

describe("fairness", () => {
  it.each(ROOM_IDS.filter((id) => worldOf(id).id <= 5))("%s: a room that lies keeps an honest anchor (a drip or a lamp; in space, the dust)", (id) => {
    const room = getRoom(id);
    if (!liesIn(room).length) return;
    expect(room.anchorsLie).toBeNull();
    // Out in space the dust is the tell (it falls toward real planets only); every room has dust.
    if (room.kind === "tiles") expect(room.anchors.length).toBeGreaterThan(0);
  });

  it("only Isaac's Tree has lying drips, dust and lamps (the scarf never lies)", () => {
    for (const id of ROOM_IDS) expect(getRoom(id).anchorsLie !== null, id).toBe(worldOf(id).id === 6);
  });

  it("every liar is introduced in a room with a safety net", () => {
    for (const liar of Object.keys(LIARS) as Array<keyof typeof LIARS>) {
      const first = ROOM_IDS.find((id) => LIARS[liar](getRoom(id)))!;
      expect(getRoom(first).net, `${liar} first lies in ${first}`).toBe(true);
    }
  });

  it.each(ROOM_IDS.filter((id) => getRoom(id).rotate))("%s: every timed turn is announced by the hum 0.75 s before, the first one too", (id) => {
    const room = getRoom(id);
    const w = createWorld(room);
    // Nothing can stop the clock: every death is caught.
    w.netsEverywhere = true;
    const hums: number[] = [];
    const turns: number[] = [];
    let gravity = w.gravity;
    for (let t = 0; t < room.rotate!.every * 4 + 10; t++) {
      let caught = false;
      for (const e of step(w, 0)) {
        if (e.type === "hum") hums.push(w.tick);
        if (e.type === "turn") turns.push(w.tick);
        // A safety net puts Newt back where it last stood, gravity and all (a rescue, not a surprise).
        if (e.type === "net") caught = true;
      }
      if (w.gravity !== gravity) {
        if (!caught) expect(turns.at(-1), `gravity changed at ${w.tick} without a turn`).toBe(w.tick);
        gravity = w.gravity;
      }
    }
    expect(turns.length).toBeGreaterThanOrEqual(4);
    for (const t of turns) expect(hums, `turn at ${t}`).toContain(t - HUM_TICKS);
    expect(turns[0]! - HUM_TICKS).toBeGreaterThanOrEqual(1);
  });

  it.each(ROOM_IDS)("%s: standing still at the start is safe for a while", (id) => {
    const w = createWorld(getRoom(id));
    for (let t = 0; t < 60; t++) step(w, 0);
    expect(w.status).toBe("play");
  });

  it.each(ROOM_IDS)("%s: along the whole route, nothing ever puts Newt inside a wall", (id) => {
    const room = getRoom(id);
    const w = createWorld(room);
    for (const [bits, n] of logFromText(DEV_RUNS[id]!.log)) {
      for (let i = 0; i < n && w.status === "play"; i++) {
        step(w, bits);
        if (w.orbit) {
          for (const p of room.planets) if (!p.fake) expect(Math.hypot(w.orbit.x - p.x, w.orbit.y - p.y), `tick ${w.tick}`).toBeGreaterThanOrEqual(p.r + NEWT_R - 0.01);
          continue;
        }
        const b = newtBox(w);
        for (let r = Math.floor(b.y / TILE); r <= Math.floor((b.y + b.h - 1) / TILE); r++) {
          for (let c = Math.floor(b.x / TILE); c <= Math.floor((b.x + b.w - 1) / TILE); c++) expect(cellAt(room, c, r) === WALL, `tick ${w.tick} at ${c},${r}`).toBe(false);
        }
      }
    }
    expect(w.status).toBe("won");
  });

  it.each(ROOM_IDS.filter((id) => LIARS.camera(getRoom(id))))("%s: plays the same with the camera level (reduce motion)", (id) => {
    const room = getRoom(id);
    const level: Room = { ...room, view: { up: "up", tilt: 0, intro: null } };
    const inputs = logFromText(DEV_RUNS[id]!.log);
    const a = replay(room, inputs);
    const b = replay(level, inputs);
    expect(b.status).toBe("won");
    expect(b.tick).toBe(a.tick);
    expect(b.apples).toBe(a.apples);
  });
});
