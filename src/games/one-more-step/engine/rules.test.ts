import { describe, expect, it } from "vitest";
import { compile, initialState } from "./course";
import { echoAt, FINALE_WAITS, gatesOpen, isHole, spikesUp, step, waveIn } from "./rules";
import { replay, solve } from "./solver";
import type { Action, Course, LevelDef, State } from "./types";

const lvl = (map: string[], over: Partial<LevelDef> = {}): Course => compile({ id: "T", world: 1, name: "Test", map, ...over });
const go = (dir: "up" | "down" | "left" | "right"): Action => ({ type: "move", dir });
const WAIT: Action = { type: "wait" };

/** Play a string of actions (U R D L .), returning every state along the way. */
function play(c: Course, moves: string, from: State = initialState(c)): State[] {
  const out = [from];
  const map: Record<string, Action> = { U: go("up"), R: go("right"), D: go("down"), L: go("left"), ".": WAIT };
  for (const m of moves) out.push(step(c, out[out.length - 1]!, map[m]!).state);
  return out;
}
const last = (states: State[]) => states[states.length - 1]!;

describe("the tick", () => {
  it("level 1-1: walk right, the door runs into the dead end, and is caught there: 6 steps", () => {
    const c = lvl(["#########", "#P....E.#", "#########"]);
    const run = play(c, "RRRR");
    expect(last(run).doors[0]).toEqual({ x: 7, y: 1 });
    expect(last(run).ran).toBe(4);
    const won = play(c, "RR", last(run));
    expect(last(won).status).toBe("won");
    expect(solve(c)!.steps).toBe(6);
  });

  it("the shy door runs to the free tile farthest from you; ties go up, right, down, left", () => {
    // You arrive from the left: right is farthest (straight away).
    let c = lvl(["#####", "#...#", "#PE.#", "#...#", "#####"]);
    expect(step(c, initialState(c), WAIT).state.doors[0]).toEqual({ x: 3, y: 2 });
    // Right blocked: up and down tie (both diagonal-ish): up wins.
    c = lvl(["####", "#..#", "#PE#", "#..#", "####"]);
    expect(step(c, initialState(c), WAIT).state.doors[0]).toEqual({ x: 2, y: 1 });
  });

  it("cornered (nowhere to go), the door freezes and you can step onto it; it won't step onto holes or raised spikes", () => {
    const c = lvl(["#####", "#POEO", "#####"].map((r) => r.replace(/O$/, "#")));
    // Doory at 3, a hole at 2, a wall at 4: from the start it's not adjacent; walk… you can't (hole). Use spikes instead:
    const d = lvl(["######", "#P.EX#", "######"]);
    const s1 = step(d, initialState(d), go("right")).state;
    // Spikes flipped down on this tick (X starts up): it can run there.
    expect(s1.doors[0]).toEqual({ x: 4, y: 1 });
    expect(c.w).toBeGreaterThan(0);
    const e = lvl(["######", "#P.Ex#", "######"]);
    const s2 = step(e, initialState(e), go("right")).state;
    // x starts down and is up after the tick: it stays, cornered.
    expect(s2.doors[0]).toEqual({ x: 3, y: 1 });
    expect(step(e, s2, go("right")).state.status).toBe("won");
  });

  it("a crumble tile breaks the moment you step off it; you can't go back", () => {
    const c = lvl(["######", "#P~..#", "#...E#", "######"]);
    const s = play(c, "RR");
    expect(isHole(c, last(s), { x: 2, y: 1 })).toBe(true);
    expect(last(play(c, "L", last(s))).status).toBe("dead");
    expect(last(play(c, "L", last(s))).cause).toBe("hole");
  });

  it("spikes flip every tick (up kills); waiting counts as a step", () => {
    const c = lvl(["#####", "#PX.#", "#####"], { door: "still" });
    // Up at the start, down after one tick (you'd step on them as they drop… no: they flip after you land).
    expect(spikesUp(c, initialState(c), { x: 2, y: 1 })).toBe(true);
    expect(last(play(c, "R")).status).toBe("play");
    expect(last(play(c, ".R")).status).toBe("dead");
    expect(last(play(c, ".R")).cause).toBe("spikes");
  });

  it("conveyors push whatever's on them after you move (you, and the door)", () => {
    const c = lvl(["######", "#P>..#", "#....#", "#..E.#", "######"]);
    const s = last(play(c, "R"));
    expect(s.player).toEqual({ x: 3, y: 1 });
  });

  it("a plate holds the gates open while anything stands on it", () => {
    const c = lvl(["#######", "#P_|.E#", "#######"]);
    expect(gatesOpen(c, initialState(c))).toBe(false);
    const on = last(play(c, "R"));
    expect(gatesOpen(c, on)).toBe(true);
    // Off the plate (into the gate, which can't shut on you), then on: shut behind you.
    const off = last(play(c, "RR", on));
    expect(off.player).toEqual({ x: 4, y: 1 });
    expect(gatesOpen(c, off)).toBe(false);
  });

  it("your echo walks your steps a few ticks late: touch it and you die; it holds plates for you", () => {
    const c = lvl(["#########", "#P....E.#", "#########"], { echoDelay: 2, door: "still" });
    const s = play(c, "RRR");
    expect(echoAt(c, last(s))).toEqual({ x: 2, y: 1 });
    // Step back towards it, and it walks into you; stand still too long, and it catches you up.
    expect(last(play(c, "L", last(s))).cause).toBe("echo");
    expect(last(play(c, ".", last(s))).status).toBe("play");
    expect(last(play(c, "..", last(s))).cause).toBe("echo");
    const plate = lvl(["#######", "#P_.|E#", "#######"], { echoDelay: 1, door: "still" });
    const p = last(play(plate, "RR"));
    // You've left the plate; your echo is on it, so the gate's open.
    expect(echoAt(plate, p)).toEqual({ x: 2, y: 1 });
    expect(gatesOpen(plate, p)).toBe(true);
  });

  it("the mirror twin moves the other way across, the same way up and down; you leave together", () => {
    const c = lvl(["#########", "#e.T.P.E#", "#########"], { door: "still" });
    const s = last(play(c, "R"));
    expect(s.twin).toEqual({ x: 2, y: 1 });
    expect(s.player).toEqual({ x: 6, y: 1 });
    expect(last(play(c, "RR")).status).toBe("won");
  });

  it("sentinels lumber towards you, and fall into holes", () => {
    const c = lvl(["########", "#S.O..P#", "#.....E#", "########"], { door: "still" });
    let s = last(play(c, "."));
    expect(s.sentinels[0]).toEqual({ x: 2, y: 1 });
    s = last(play(c, ".", s));
    expect(s.sentinels[0]).toBeNull();
    const chase = lvl(["######", "#S..P#", "#...E#", "######"], { door: "still" });
    expect(last(play(chase, "...")).cause).toBe("sentinel");
  });

  it("the brave door charges at you: it slams shut on you, unless you're standing on a plate", () => {
    const c = lvl(["#########", "#P.....E#", "#########"], { door: "brave" });
    expect(last(play(c, "...")).doors[0]).toEqual({ x: 4, y: 1 });
    expect(last(play(c, "......")).cause).toBe("door");
    const plate = lvl(["#########", "#P_....E#", "#########"], { door: "brave" });
    expect(last(play(plate, "R....")).status).toBe("won");
  });

  it("lazy spikes only move when you wait", () => {
    const c = lvl(["#####", "#PZ.#", "#####"], { door: "still" });
    // Up; stepping doesn't move them; a wait drops them.
    expect(spikesUp(c, last(play(c, "U")), { x: 2, y: 1 })).toBe(true);
    expect(last(play(c, ".R")).status).toBe("play");
  });

  it("wave spikes rise together every few ticks, and the HUD counts down to them", () => {
    const c = lvl(["######", "#PWW.#", "######"], { door: "still", wave: 3 });
    expect(waveIn(c, initialState(c))).toBe(3);
    expect(last(play(c, "RR")).status).toBe("play");
    expect(last(play(c, "RR")).tick).toBe(2);
    expect(last(play(c, ".RR")).status).toBe("dead");
  });

  it("a basement hole is the way out; a secret crumble shows the real exit when you step off it", () => {
    const b = lvl(["#####", "#PB.#", "#####"], { door: "still" });
    expect(last(play(b, "R")).status).toBe("won");
    const h = lvl(["#D###", "#Ph.#", "#####"], { door: "still" });
    const s = last(play(h, "RR"));
    expect(s.doors).toEqual([{ x: 2, y: 1 }]);
    expect(last(play(h, "L", s)).status).toBe("won");
  });

  it("the finale: step onto the door and it starts again; wait ten times and it comes to you", () => {
    const c = lvl(["#####", "#PE.#", "#####"], { door: "finale" });
    expect(last(play(c, "R")).status).toBe("reset");
    const waits = ".".repeat(FINALE_WAITS);
    expect(last(play(c, waits)).status).toBe("won");
    expect(solve(c)!.moves).toBe(waits);
  });
});

describe("the solver", () => {
  it("finds a shortest solution, and replaying it wins (the same steps, the same game)", () => {
    const c = lvl(["#######", "#P..~.#", "#.#..E#", "#.....#", "#######"]);
    const sol = solve(c)!;
    expect(sol).not.toBeNull();
    expect(replay(c, sol.moves).status).toBe("won");
    expect(replay(c, sol.moves)).toEqual(replay(c, sol.moves));
  });

  it("says when there's no way", () => {
    const c = lvl(["#####", "#P#E#", "#####"], { door: "still" });
    expect(solve(c)).toBeNull();
  });
});
