import { describe, expect, it } from "vitest";
import { Accumulator } from "@/engine/loop";
import { logFromText, Player } from "@/engine/replay";
import { DEV_RUNS } from "../levels/dev-runs";
import { getLevel } from "../levels";
import { COLS, FOLLOW_DELAY, JUMP, RIGHT, TILE } from "./constants";
import { levelTitle, parseLevel, type LevelSource } from "./level";
import { anchorOf, createWorld, GHOST_GRACE, step, tracePath, type DeathCause, type GameEvent, type World } from "./world";

const AIR = ".".repeat(COLS);

/** A test level: the given rows sit at the bottom of the map, air above, a door at the far end. */
function testLevel(bottom: string[], traps: LevelSource["traps"] = {}, { remix = false, ghostTrap = false } = {}) {
  const map = [...Array<string>(17 - bottom.length).fill(AIR), ...bottom].map((row) => row.padEnd(COLS, row.at(-1) === "#" ? "#" : "."));
  const door = map.some((row) => row.includes("D")) || Object.values(traps).some((t) => t.kind === "runawayDoor");
  if (!door) {
    const r = map.findIndex((row) => row.includes("S"));
    map[r] = `${map[r]!.slice(0, 28)}D${map[r]!.slice(29)}`;
  }
  return parseLevel({ id: "1-99", name: "Test", map, traps, ghostTrap }, { remix });
}

/** Step with `bits` for up to `ticks` ticks, stopping when the attempt ends. Returns every event. */
function run(w: World, bits: number | ((tick: number) => number), ticks: number): GameEvent[] {
  const events: GameEvent[] = [];
  for (let i = 0; i < ticks && w.status === "play"; i++) {
    step(w, typeof bits === "number" ? bits : bits(w.tick));
    events.push(...w.events);
  }
  return events;
}

const deathBy = (w: World): DeathCause | null => (w.status === "dead" ? w.cause : null);

describe("traps", () => {
  it("pop spikes fire as you pass over them", () => {
    const w = createWorld(testLevel([".S.......pp", "#"], { p: { kind: "popSpikes" } }));
    run(w, RIGHT, 200);
    expect(deathBy(w)).toBe("popSpikes");
  });

  it("painted spikes are harmless", () => {
    const w = createWorld(testLevel([".S....xx", "#"], { x: { kind: "fakeSpikes" } }));
    run(w, RIGHT, 80);
    expect(w.status).toBe("play");
    expect(w.p.x).toBeGreaterThan(8 * TILE);
  });

  it("a drop floor falls away, and the fall is its fault", () => {
    const w = createWorld(testLevel(["", ".S", "#######ff#", "#######..#"], { f: { kind: "dropFloor" } }));
    const events = run(w, RIGHT, 400);
    expect(events.some((e) => e.type === "trap" && e.kind === "dropFloor" && e.phase === "fire")).toBe(true);
    expect(deathBy(w)).toBe("dropFloor");
  });

  it("the runaway door rolls off when you get close, and can still be caught", () => {
    const w = createWorld(testLevel([".S.........r", "#"], { r: { kind: "runawayDoor", to: 28 } }));
    run(w, RIGHT, 600);
    expect(w.status).toBe("won");
    expect(w.exit.x).toBe(28 * TILE + 2);
  });

  it("a painted door shows where the real one is", () => {
    const w = createWorld(testLevel([".S......q...........D", "#"], { q: { kind: "fakeDoor" } }));
    expect(w.exit.hidden).toBe(true);
    run(w, RIGHT, 600);
    expect(w.status).toBe("won");
  });

  it("an invisible block appears when you bonk it", () => {
    const level = testLevel(["", ".ii", "", "", ".S", "#"], { i: { kind: "invisibleBlock" } });
    const w = createWorld(level);
    const events = run(w, JUMP, 30);
    expect(events.some((e) => e.type === "bonk")).toBe(true);
    expect(w.traps[0]!.flag).toBe(1);
  });

  it("the crusher falls on whoever stands under it", () => {
    const w = createWorld(testLevel(["....cc", "", "", "", ".S", "#"], { c: { kind: "crusher" } }));
    run(w, () => (w.p.x + w.p.w / 2 < 5 * TILE ? RIGHT : 0), 300);
    expect(deathBy(w)).toBe("crusher");
  });

  it("saws always warn for 0.4 s, even in Remix", () => {
    for (const remix of [false, true]) {
      const w = createWorld(testLevel([".S...........................s", "#"], { s: { kind: "saw", dir: -1 } }, { remix }));
      const at: Record<string, number> = {};
      run(w, (t) => {
        for (const e of w.events) if (e.type === "trap" && !(e.phase in at)) at[e.phase] = t;
        return 0;
      }, 100);
      expect(at.fire! - at.warn!).toBeGreaterThanOrEqual(24);
    }
  });

  it("the Follower runs your path two seconds behind", () => {
    const w = createWorld(testLevel(["zS", "#"], { z: { kind: "follower" } }));
    run(w, (t) => (t < 20 ? RIGHT : 0), FOLLOW_DELAY + 60);
    expect(deathBy(w)).toBe("follower");
  });

  it("the Second-Try trap moves after your first death, and the name says so", () => {
    const level = testLevel([".S.......pp", "#"], { p: { kind: "popSpikes", retry: [3, 0] } });
    expect(level.secondTry).toBe(true);
    expect(levelTitle(level)).toBe("Test?");
    const before = anchorOf(createWorld(level), 0);
    const after = anchorOf(createWorld(level, { attempt: 1 }), 0);
    expect(after.x - before.x).toBe(3 * TILE);
  });

  it("Remix mirrors the level", () => {
    const level = testLevel([".S.......pp", "#"], { p: { kind: "popSpikes" } }, { remix: true });
    expect(level.id).toBe("R1-99");
    expect(level.spawn.x).toBeGreaterThan(25 * TILE);
    expect(level.traps[0]!.remixed).toBe(true);
  });
});

describe("Your Own Ghost", () => {
  const level = testLevel([".S", "#"], {}, { ghostTrap: true });
  const best = tracePath(level, Array<number>(90).fill(RIGHT));

  it("leaves the start with you, harmless for half a second", () => {
    const w = createWorld(level, { ghost: best });
    run(w, RIGHT, GHOST_GRACE - 1);
    expect(w.status).toBe("play");
  });

  it("is deadly once it's moving", () => {
    const w = createWorld(level, { ghost: best });
    run(w, RIGHT, 80);
    expect(deathBy(w)).toBe("ghost");
  });

  it("goes through the door when its run ended", () => {
    const w = createWorld(level, { ghost: best });
    run(w, (t) => (t < 100 ? 0 : RIGHT), 140);
    expect(w.status).toBe("play");
  });
});

describe("determinism", () => {
  const id = "2-10";
  const level = getLevel(id);
  const dev = DEV_RUNS[id]!;

  /** Replay the Dev run through a fixed-timestep loop on a screen of `hz`. */
  function playAt(hz: number): World {
    const w = createWorld(level);
    const inputs = new Player(logFromText(dev.log));
    const acc = new Accumulator();
    for (let frame = 0; frame < hz * 20 && w.status === "play"; frame++) {
      for (let t = acc.advance(1 / hz); t > 0; t--) {
        const bits = inputs.next();
        if (bits === null || w.status !== "play") break;
        step(w, bits);
      }
    }
    return w;
  }

  it("plays identically at 60, 120 and 144 Hz", () => {
    const results = [60, 120, 144].map(playAt).map((w) => ({ status: w.status, tick: w.tick, x: w.p.x, y: w.p.y, traps: w.traps }));
    expect(results[0]!.status).toBe("won");
    expect(results[0]!.tick).toBe(dev.ticks);
    expect(results[1]).toEqual(results[0]);
    expect(results[2]).toEqual(results[0]);
  });
});
