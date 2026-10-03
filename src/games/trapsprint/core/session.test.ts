import { describe, expect, it } from "vitest";
import { logFromText, Player } from "@/engine/replay";
import { DEV_RUNS } from "../levels/dev-runs";
import { getLevel } from "../levels";
import { RESPAWN_TICKS, RIGHT } from "./constants";
import { replay } from "./solver";
import { LevelSession } from "./session";

/** Feed a session `ticks` ticks of the same bits. */
function hold(session: LevelSession, bits: number, ticks: number) {
  const events = [];
  for (let i = 0; i < ticks; i++) events.push(...session.tick(bits));
  return events;
}

/** Play until the current attempt ends (or `limit` ticks). */
function untilEnd(session: LevelSession, bits: number, limit = 1200) {
  for (let i = 0; i < limit && session.world.status === "play"; i++) session.tick(bits);
}

describe("LevelSession", () => {
  it("starts the clock on your first input", () => {
    const session = new LevelSession(getLevel("1-01"));
    const idle = hold(session, 0, 90);
    expect(idle).toEqual([]);
    expect(session.world.tick).toBe(0);
    expect(session.tick(RIGHT)[0]).toEqual({ type: "start" });
    expect(session.world.tick).toBe(1);
  });

  it("respawns almost instantly after a death, in the Second-Try layout", () => {
    const session = new LevelSession(getLevel("1-08"));
    untilEnd(session, RIGHT);
    expect(session.world.status).toBe("dead");
    expect(session.deaths).toBe(1);
    const events = hold(session, 0, RESPAWN_TICKS);
    expect(events).toEqual([{ type: "respawn" }]);
    expect(RESPAWN_TICKS * (1000 / 60)).toBeLessThan(300);
    expect(session.world.status).toBe("play");
    expect(session.world.attempt).toBe(1);
  });

  it("doesn't count a quick restart as a death", () => {
    const session = new LevelSession(getLevel("1-01"));
    hold(session, RIGHT, 30);
    session.restart();
    expect(session.deaths).toBe(0);
    expect(session.started).toBe(false);
    expect(session.attempts.map((a) => a.end)).toEqual(["restart"]);
  });

  it("records every attempt so the All-Deaths Replay can play them back", () => {
    const level = getLevel("1-01");
    const session = new LevelSession(level);
    for (let i = 0; i < 3; i++) {
      untilEnd(session, RIGHT);
      hold(session, 0, RESPAWN_TICKS);
    }
    expect(session.attempts).toHaveLength(3);
    for (const attempt of session.attempts) {
      const end = replay(level, attempt.log, { attempt: attempt.attempt });
      expect(end.status).toBe("dead");
      expect(end.tick).toBe(attempt.ticks);
      expect(end.cause).toBe(attempt.cause);
    }
  });

  it("wins with the Dev run, and races your ghost alongside", () => {
    const level = getLevel("1-04");
    const log = logFromText(DEV_RUNS["1-04"]!.log);
    const session = new LevelSession(level, { ghost: { log, attempt: 0 } });
    const inputs = new Player(log);
    let bits: number | null;
    let ghostSeen = false;
    while ((bits = inputs.next()) !== null && !session.won) {
      session.tick(bits);
      if (session.ghost) {
        ghostSeen = true;
        expect(session.ghost.p.x).toBe(session.world.p.x);
      }
    }
    expect(ghostSeen).toBe(true);
    expect(session.won).toBe(true);
    expect(session.time).toBe(DEV_RUNS["1-04"]!.ticks);
    expect(session.fromCheckpoint).toBe(false);
    expect(session.attempts.at(-1)?.end).toBe("won");
  });

  it("can't be hurt by traps in assist's invincible mode", () => {
    const session = new LevelSession(getLevel("1-03"), { invincible: true });
    hold(session, RIGHT, 300);
    expect(session.deaths).toBe(0);
    expect(session.won).toBe(true);
  });
});
