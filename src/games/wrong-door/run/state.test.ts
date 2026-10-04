import { describe, expect, it } from "vitest";
import type { Floor } from "../logic/types";
import { nextMove } from "./reasoner";
import { ask, can, choose, decide, flicker, flipCoin, floorOf, knock, knocksLeft, pathEmoji, peek, pickUp, scoreOf, startRun, suffer, type Outcome, type RunState } from "./state";

/** Play one move of the careful player. Returns the new run, and the outcome if a door was opened. */
function play(run: RunState, floor: Floor): { run: RunState; outcome?: Outcome } {
  const move = nextMove(run, floor);
  switch (move.type) {
    case "knock":
      return { run: knock(run, floor, move.door)!.run };
    case "ask":
      return { run: ask(run, floor, { type: "wouldSay", door: move.door })!.run };
    case "flicker":
      return { run: flicker(run) };
    case "choose": {
      const outcome = choose(run, floor, move.choice);
      return { run: outcome.run, outcome };
    }
    case "decide": {
      const outcome = decide(run, floor, move.switching);
      return { run: outcome.run, outcome };
    }
  }
}

/** Climb until the run ends (or `limit` floors), picking up whatever's lying around. */
function climb(run: RunState, limit = 13) {
  let wrongOffLuck = 0;
  for (let guard = 0; guard < 400 && run.status === "play" && run.floor <= limit; guard++) {
    let floor = floorOf(run);
    if (floor.item && !run.play.taken) {
      run = pickUp(run, floor);
      floor = floorOf(run);
    }
    const { run: next, outcome } = play(run, floor);
    run = next;
    if (outcome?.type === "wrong") {
      if (!floor.lucky) wrongOffLuck++;
      run = suffer(run, outcome.consequence, { escapedRoom: true });
    }
  }
  return { run, wrongOffLuck };
}

describe("a run", () => {
  it("starts on floor 1 with three keys and nothing in your pockets", () => {
    const run = startRun("story", 1);
    expect(run).toMatchObject({ floor: 1, keys: 3, status: "play" });
    expect(floorOf(run).archetype).toBe("plainSigns");
  });

  it("is climbed all the way by a careful player in the Story Run, never opening a wrong door", () => {
    const { run, wrongOffLuck } = climb(startRun("story", 1));
    expect(run.status).toBe("escaped");
    expect(wrongOffLuck).toBe(0);
    expect(run.path.map((p) => p.floor)).toEqual(Array.from({ length: 13 }, (_, k) => k + 1));
    expect(pathEmoji(run)).toBe("🚪🚪🚪🚪🚪🚪🚪🎲🚪🚪🚪🚪🏁");
  });

  it("is climbed by a careful player on 200 Daily Doors: wrong doors only ever by luck, and luck never costs a key", () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { run, wrongOffLuck } = climb(startRun("daily", seed * 7919, "2026-10-05"));
      expect(run.status, `seed ${seed}`).toBe("escaped");
      expect(wrongOffLuck, `seed ${seed}`).toBe(0);
      expect(run.keys).toBeGreaterThanOrEqual(3);
    }
  });

  it("goes on and on in Endless (40 floors, fair all the way)", () => {
    for (let seed = 1; seed <= 25; seed++) {
      const { run, wrongOffLuck } = climb(startRun("endless", seed), 40);
      expect(run.status).toBe("play");
      expect(run.floor).toBe(41);
      expect(wrongOffLuck).toBe(0);
    }
  });

  it("is the same hotel for the same seed, every time", () => {
    const a = climb(startRun("daily", 99, "x")).run;
    const b = climb(startRun("daily", 99, "x")).run;
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("gives two knocks a floor (three with the stethoscope), one question, and only on floors that allow them", () => {
    let run = startRun("story", 1);
    const floor = floorOf(run);
    run = knock(run, floor, 1)!.run;
    expect(knock(run, floor, 1)).toBeNull();
    run = knock(run, floor, 2)!.run;
    expect(knocksLeft(run)).toBe(0);
    expect(can({ ...run, items: { ...run.items, stethoscope: true } }, floor).knock).toBe(true);
    expect(can(run, floor).ask).toBe(false);
  });

  it("counts the double question on a lying doorman (Double Negative)", () => {
    const run = { ...startRun("story", 1), floor: 3, visits: { 1: 0, 2: 0, 3: 0 } };
    const floor = floorOf(run);
    expect(floor.doorman).toEqual({ lies: true, hat: "on" });
    const asked = ask(run, floor, { type: "wouldSay", door: 1 })!;
    expect(asked.yes).toBe(true);
    expect(asked.run.stats.doubleNegative).toBe(true);
    expect(ask(asked.run, floor, { type: "isExit", door: 2 })).toBeNull();
  });

  it("uses items: the Truth Coin on a sign, the crowbar on a door, the lucky key at once", () => {
    let run: RunState = { ...startRun("story", 1), floor: 2, visits: { 1: 0, 2: 0 }, items: { stethoscope: false, lantern: false, chalk: false, truthCoin: 1, crowbar: 1 } };
    const floor = floorOf(run);
    const coin = flipCoin(run, floor, 1)!;
    expect(coin.truth).toBe(false);
    run = coin.run;
    expect(run.items.truthCoin).toBe(0);
    const look = peek(run, floor, 2)!;
    expect(look.up).toBe(true);
    expect(look.run.items.crowbar).toBe(0);
    const six = { ...startRun("story", 1), floor: 6, visits: { 6: 0 } };
    expect(pickUp(six, floorOf(six)).keys).toBe(4);
  });

  it("punishes wrong doors: down a floor (a new puzzle), the Wrong Room, a curse, a lost key — and ends at no keys", () => {
    const start: RunState = { ...startRun("story", 1), floor: 2, visits: { 1: 0, 2: 0 }, path: [{ floor: 1, style: "velvet" as const, wrong: 0, knocks: 0, question: false, items: 0, lucky: false, points: 100 }] };
    const floor = floorOf(start);
    const wrong = choose(start, floor, 1);
    expect(wrong).toMatchObject({ type: "wrong", consequence: "downstairs" });
    const down = suffer(wrong.run, "downstairs");
    expect(down.floor).toBe(1);
    expect(down.path).toEqual([]);
    expect(floorOf(down).doors).not.toEqual(floorOf(startRun("story", 1)).doors);
    const room = choose(start, floor, 3);
    expect(room).toMatchObject({ type: "wrong", consequence: "wrongRoom" });
    expect(suffer(room.run, "wrongRoom", { escapedRoom: true }).keys).toBe(3);
    expect(suffer(room.run, "wrongRoom").keys).toBe(2);
    expect(room.run.play.opened).toEqual([3]);
    const cursed = suffer(start, "cursed");
    expect(cursed.cursed).toBe(true);
    const up = choose(cursed, floor, 2);
    expect(up.type).toBe("up");
    expect(up.run.play.curse).not.toBeNull();
    let out = start;
    for (let i = 0; i < 3; i++) out = suffer(out, "loseKey");
    expect(out.status).toBe("out");
  });

  it("plays the Lucky Floor by the real rules: he opens a wrong door you didn't pick, then you stay or switch; losing sends you down, never costs a key", () => {
    const run = { ...startRun("story", 1), floor: 8, visits: { 8: 0 } };
    const floor = floorOf(run);
    expect(floor.lucky).toBe(true);
    const first = choose(run, floor, 2);
    expect(first.type).toBe("lucky");
    if (first.type !== "lucky") return;
    expect(first.opened).not.toBe(2);
    const stay = decide(first.run, floor, false);
    expect(stay.type).toBe("up");
    const swap = decide(first.run, floor, true);
    expect(swap).toMatchObject({ type: "wrong", consequence: "downstairs" });
  });

  it("notes the kind of door you go through once you carry chalk, and forgets the floors you go back down", () => {
    const start = startRun("story", 1);
    const { run } = climb({ ...start, items: { ...start.items, chalk: true } }, 3);
    expect(run.floor).toBe(4);
    expect(run.chalkLog).toEqual([
      { floor: 1, style: "velvet" },
      { floor: 2, style: "wood" },
      { floor: 3, style: "velvet" },
    ]);
    expect(suffer(run, "downstairs").chalkLog.map((n) => n.floor)).toEqual([1, 2]);
  });

  it("scores a clean escape higher than a messy one", () => {
    const clean = climb(startRun("story", 1)).run;
    expect(scoreOf(clean)).toBeGreaterThan(1300);
    const knocked = { ...clean, path: clean.path.map((p) => ({ ...p, points: p.points - 30 })) };
    expect(scoreOf(knocked)).toBeLessThan(scoreOf(clean));
  });
});
