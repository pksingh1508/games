import { describe, expect, it } from "vitest";
import { seconds, WARN_TICKS } from "./constants";
import { EVENT_KINDS, EVENTS } from "./events";
import type { EventKind, LevelDef } from "./level";
import { Sim, type SimEvent } from "./sim";
import { run, TEST_LEVEL } from "./testkit";

const withEvent = (kind: EventKind, at = 1, over: Partial<LevelDef> = {}) =>
  new Sim({ level: { ...TEST_LEVEL, belt: 10_000, events: [{ kind, at, dir: 1 }], ...over }, seed: 3, zen: false });

/** A small, steady tower to watch events push around. */
function tower(sim: Sim) {
  return [0, 1, 2, 3].map((k) => sim.drop("brick", { x: 0, y: 0.2 + k * 0.42 }));
}

const hitTick = (events: Array<{ t: number; e: SimEvent }>, type: SimEvent["type"]) => events.find((x) => x.e.type === type)?.t ?? -1;

function timeline(sim: Sim, ticks: number) {
  const out: Array<{ t: number; e: SimEvent }> = [];
  for (let t = 0; t < ticks; t++) for (const e of sim.step({ aim: null, commands: [] })) out.push({ t, e });
  return out;
}

describe("every event is warned first (§10 rule 3)", () => {
  it.each(EVENT_KINDS)("%s: a warning at least 1.5 s before it hits", (kind) => {
    const sim = withEvent(kind);
    tower(sim);
    const events = timeline(sim, seconds(14));
    const warn = hitTick(events, "warn");
    const hit = hitTick(events, "eventHit");
    expect(warn).toBeGreaterThanOrEqual(0);
    expect(hit - warn).toBeGreaterThanOrEqual(seconds(1.5));
    expect(hit - warn).toBe(WARN_TICKS);
    // Nothing changes before the hit: the gravity's normal all through the warning.
    expect(EVENTS[kind].warning.length).toBeGreaterThan(5);
  });

  it("a real PANIC! (the meter at 100%) is warned too, with a real siren", () => {
    const sim = withEvent("wind", 999, { events: [{ kind: "wind", at: 999 }] });
    tower(sim);
    run(sim, 5);
    sim.panic = 99.99;
    // Push it over the top with a fall.
    sim.drop("brick", { x: 3, y: 1 });
    const events = timeline(sim, seconds(4));
    const warn = events.find((x) => x.e.type === "warn")!;
    expect(warn.e.type === "warn" && warn.e.event.siren).toBe("real");
    expect(hitTick(events, "eventHit") - warn.t).toBe(WARN_TICKS);
    expect(sim.panic).toBeLessThan(80);
  });
});

describe("what events do", () => {
  it("a fake panic changes nothing at all (§10 rule 3: never physical damage)", () => {
    const a = withEvent("fakePanic", 2);
    const b = new Sim({ level: { ...TEST_LEVEL, belt: 10_000 }, seed: 3, zen: false });
    const ta = tower(a);
    const tb = tower(b);
    const events = timeline(a, seconds(12));
    run(b, seconds(12));
    expect(events.some((x) => x.e.type === "warn" && x.e.event.siren === "fake")).toBe(true);
    ta.forEach((brick, k) => {
      expect(brick.body.getPosition().x).toBe(tb[k]!.body.getPosition().x);
      expect(brick.body.getPosition().y).toBe(tb[k]!.body.getPosition().y);
    });
    // Nothing fell, so it counts toward Didn't Fall For It.
    expect(events.some((x) => x.e.type === "fakeSurvived")).toBe(true);
  });

  it("a fake panic pretends to be one of the level's real events", () => {
    const sim = new Sim({ level: { ...TEST_LEVEL, belt: 10_000, events: [{ kind: "fakePanic", at: 1 }, { kind: "cat", at: 60 }] }, seed: 3 });
    const warn = timeline(sim, seconds(3)).find((x) => x.e.type === "warn")!;
    expect(warn.e.type === "warn" && warn.e.event.pretends).toBe("cat");
  });

  it("an earthquake shakes things sideways, then stops", () => {
    const sim = withEvent("earthquake", 1);
    const top = tower(sim)[3]!;
    let moved = 0;
    for (let t = 0; t < seconds(8); t++) {
      sim.step({ aim: null, commands: [] });
      moved = Math.max(moved, Math.abs(sim.world.getGravity().x));
    }
    expect(moved).toBeGreaterThan(2);
    expect(sim.world.getGravity().x).toBe(0);
    expect(sim.falls).toBe(0);
    expect(top.body.getPosition().y).toBeGreaterThan(1.3);
  });

  it("wind blows light, tall and slippery things off; heavy things hold", () => {
    const sim = withEvent("wind", 1, { events: [{ kind: "wind", at: 1, dir: 1 }] });
    const bricks = tower(sim);
    // A cardboard box stood on its side, and jelly, on the platform.
    const box = sim.drop("box", { x: -1.4, y: 0.41 }, Math.PI / 2);
    const jelly = sim.drop("jelly", { x: 1, y: 0.26 });
    run(sim, seconds(7));
    expect(Math.abs(bricks[3]!.body.getPosition().x)).toBeLessThan(0.01);
    expect(box.body.getPosition().x).toBeGreaterThan(-1.2);
    expect(jelly.body.getPosition().x).toBeGreaterThan(1.3);
  });

  it("tilt turns gravity by 10°, low gravity lightens it, and both come back", () => {
    const tilt = withEvent("tilt", 1);
    let max = 0;
    for (let t = 0; t < seconds(7); t++) {
      tilt.step({ aim: null, commands: [] });
      const g = tilt.world.getGravity();
      max = Math.max(max, Math.abs(Math.atan2(g.x, -g.y)));
    }
    expect(max).toBeCloseTo((10 * Math.PI) / 180, 2);
    expect(tilt.world.getGravity().x).toBe(0);

    const low = withEvent("lowGravity", 1);
    let least = 99;
    for (let t = 0; t < seconds(8); t++) {
      low.step({ aim: null, commands: [] });
      least = Math.min(least, -low.world.getGravity().y);
    }
    expect(least).toBeCloseTo(3.5, 1);
    expect(-low.world.getGravity().y).toBe(10);
  });

  it("ice age makes everything slippery for a while", () => {
    const sim = withEvent("iceAge", 1);
    sim.drop("crate", { x: 0, y: 0.36 });
    const events = timeline(sim, seconds(4));
    const hit = hitTick(events, "eventHit");
    expect(hit).toBeGreaterThan(0);
    sim.world.setGravity({ x: 2, y: -10 });
    let friction = 1;
    for (let c = sim.world.getContactList(); c; c = c.getNext()) friction = Math.min(friction, c.getFriction());
    expect(friction).toBeLessThan(0.1);
  });

  it("the platform shrinks, and things on its edges fall", () => {
    const sim = withEvent("platformShrink", 1);
    sim.drop("brick", { x: 1.75, y: 0.2 });
    sim.drop("brick", { x: 0, y: 0.2 });
    run(sim, seconds(8));
    expect(sim.platformWidth).toBe(3);
    expect(sim.falls).toBe(1);
  });

  it("re-skin swaps every item's looks, and nothing else", () => {
    const sim = new Sim({ level: { ...TEST_LEVEL, items: ["brick", "safe", "feather"], belt: 10_000, events: [{ kind: "reskin", at: 1 }] }, seed: 3 });
    const crate = sim.drop("crate", { x: -1, y: 0.36 });
    const anvil = sim.drop("anvil", { x: 1, y: 0.26 });
    const mass = [crate.body.getMass(), anvil.body.getMass()];
    run(sim, seconds(4));
    expect(crate.skin).not.toBe("crate");
    expect(anvil.skin).not.toBe("anvil");
    for (const b of sim.belt) if (b.kind !== "xray") expect(sim.skinOf(b.kind)).not.toBe(b.kind);
    expect([crate.body.getMass(), anvil.body.getMass()]).toEqual(mass);
    expect(crate.kind).toBe("crate");
  });

  it("the cat comes in, bumps the tower, and may sit on top", () => {
    let sat = 0;
    for (let seed = 1; seed <= 6; seed++) {
      const sim = new Sim({ level: { ...TEST_LEVEL, belt: 10_000, events: [{ kind: "cat", at: 1, dir: 1 }] }, seed });
      tower(sim);
      const events = run(sim, seconds(14));
      expect(events.some((e) => e.type === "creature" && e.kind === "cat" && e.what === "arrive")).toBe(true);
      if (events.some((e) => e.type === "creature" && e.kind === "cat" && e.what === "sit")) sat++;
    }
    expect(sat).toBeGreaterThan(0);
  });

  it("a bird lands on top (extra weight), then flies off", () => {
    const sim = withEvent("bird", 1);
    tower(sim);
    const events = run(sim, seconds(16));
    expect(events.some((e) => e.type === "creature" && e.kind === "bird" && e.what === "land")).toBe(true);
    expect(events.some((e) => e.type === "creature" && e.kind === "bird" && e.what === "fly")).toBe(true);
  });

  it("the conveyor rush doubles the belt's speed", () => {
    const sim = withEvent("conveyorRush", 1, { belt: 20 });
    run(sim, WARN_TICKS + seconds(1) + 5);
    expect(sim.beltSpeed()).toBeGreaterThan(1.9);
  });
});
