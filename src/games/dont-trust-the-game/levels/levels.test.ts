// Every level of Super Happy Jump! is proven by the solver (Plan/04-dont-trust-the-game.md §10 rule 3: every
// chapter can be finished), and the ones a trick unlocks can't be finished without it.
import { describe, expect, it } from "vitest";
import { JUMP, TILE } from "../core/constants";
import { loadBlock, reachDoor, reachEvent, replay, solve, type SolveGoal } from "../core/solver";
import { createWorld, step, type WorldEvent } from "../core/world";
import { getLevel } from ".";

const centre = (c: number, r: number) => ({ x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 });
const button = (id: string, at: { x: number; y: number }): SolveGoal => ({ done: (events) => events.some((e) => e.type === "button" && e.id === id), target: () => at });
const died = (e: WorldEvent) => e.type === "die";

describe("Chapter 1: the tutorial", () => {
  const level = getLevel("tutorial");

  it("can be finished without touching the coin: through the paper spikes, then back left to the real exit", () => {
    const s = solve(level, reachDoor("exit"))!;
    expect(s).not.toBeNull();
    expect(s.events.some((e) => e.type === "paper")).toBe(true);
    expect(s.events.some(died)).toBe(false);
    // The replay agrees.
    expect(replay(level, s.log).events.some((e) => e.type === "door" && e.kind === "exit")).toBe(true);
  });

  it("the cardboard door is on the right, and you get there through the spikes that flutter", () => {
    const s = solve(level, reachDoor("fake"))!;
    expect(s).not.toBeNull();
    expect(s.events.some((e) => e.type === "paper")).toBe(true);
  });

  it("the coin that doesn't spin kills you; the real ones don't", () => {
    const real = level.coins[0]!;
    const s = solve(level, reachEvent("coin", { x: real.x + 5, y: real.y + 6 }), { route: [] })!;
    expect(s).not.toBeNull();
    expect(s.events.some(died)).toBe(false);
    // Jump straight up under the fake coin: dead.
    const w = createWorld(level);
    const coin = level.fakeCoins[0]!;
    w.p.x = coin.x;
    w.p.y = 15 * TILE - w.p.h;
    const events: WorldEvent[] = [];
    for (let t = 0; t < 40; t++) {
      step(w, t < 20 ? JUMP : 0);
      events.push(...w.events);
    }
    expect(events.find(died)).toMatchObject({ cause: "coin" });
  });
});

describe("Chapter 2: the Options menu's level", () => {
  const level = getLevel("options");
  const sign = button("more-games", centre(27, 4));

  it("Hard mode's bridge gets you to the More Games sign", () => {
    expect(solve(level, sign, { flags: { hard: true, bright: true } })).not.toBeNull();
  });

  it("on Normal the gap's too wide, Easy walls you in, and with Jump on F13 you can't climb at all", () => {
    expect(solve(level, sign, { flags: {}, stepTicks: 4, beam: 200, maxTicks: 60 * 40 })).toBeNull();
    expect(solve(level, sign, { flags: { easy: true }, stepTicks: 4, beam: 200, maxTicks: 60 * 40 })).toBeNull();
    expect(solve(level, sign, { flags: { hard: true, noJump: true }, stepTicks: 4, beam: 200, maxTicks: 60 * 40 })).toBeNull();
  }, 60_000);
});

describe("Chapter 3: Now Loading", () => {
  const level = getLevel("loading");

  it("push the missing 1% off the corner ledge and it drops into the bar", () => {
    const s = solve(level, loadBlock())!;
    expect(s).not.toBeNull();
    expect(s.events.some((e) => e.type === "push")).toBe(true);
  }, 60_000);

  it("the sticker outside the safe frame can be reached along the floor", () => {
    expect(solve(level, { done: (events) => events.some((e) => e.type === "sticker"), target: () => centre(33, 17) }, { route: [] })).not.toBeNull();
  });
});

describe("Chapter 4: Error 404 and the void", () => {
  it("the 0 is a portal you can drop into", () => {
    expect(solve(getLevel("404"), reachEvent("portal", centre(13, 9)))).not.toBeNull();
  });

  it("the second 4 can be bonked from below (room 405)", () => {
    const level = getLevel("404");
    expect(solve(level, { done: (events) => events.some((e) => e.type === "bonk"), target: () => centre(20, 13) }, { route: [] })).not.toBeNull();
  });

  it("room 405's door goes back", () => {
    expect(solve(getLevel("405"), reachDoor("back"))).not.toBeNull();
  });

  it("the void's door frame is past the wall: only once it's squeezed", () => {
    const level = getLevel("void");
    expect(solve(level, reachDoor("frame"), { flags: { squeezed: true } })).not.toBeNull();
    expect(solve(level, reachDoor("frame"), { flags: {}, stepTicks: 4, beam: 200, maxTicks: 60 * 30 })).toBeNull();
  }, 60_000);
});

describe("Chapters 5 and 6", () => {
  it("the console room's door is reachable", () => {
    expect(solve(getLevel("console"), reachDoor("locked"))).not.toBeNull();
  });

  it("the credits can be climbed to Quit and to Stay", () => {
    const level = getLevel("credits");
    const quit = level.buttons.find((b) => b.id === "quit")!.rect;
    const stay = level.buttons.find((b) => b.id === "stay")!.rect;
    expect(solve(level, button("quit", { x: quit.x + 16, y: quit.y + 16 }), { maxTicks: 60 * 120 })).not.toBeNull();
    expect(solve(level, button("stay", { x: stay.x + 16, y: stay.y + 16 }), { maxTicks: 60 * 120 })).not.toBeNull();
  }, 60_000);
});
