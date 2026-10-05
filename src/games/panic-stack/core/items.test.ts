import { describe, expect, it } from "vitest";
import { seconds } from "./constants";
import { ITEM_IDS, ITEMS, LIARS, TAP_SOUNDS, type ItemId } from "./items";
import { Sim, topOf } from "./sim";
import { run, TEST_LEVEL } from "./testkit";

// A belt so slow nothing ever drops off it.
const fresh = (zen = true, more: ItemId[] = ["brick"]) => new Sim({ level: { ...TEST_LEVEL, more, belt: 10_000 }, seed: 7, zen });

/**
 * Drag an item from the belt along an arc at `speed` m/s, the way a hand would, and measure how far behind
 * it trails on average, and how far it overshoots when the hand stops.
 */
function dragLag(kind: ItemId, speed = 3) {
  const sim = fresh(true, [kind]);
  const b = sim.belt[0]!;
  const start = { x: -1.5, y: 2.5 };
  sim.step({ aim: null, commands: [{ type: "grab", uid: b.uid, at: start }] });
  const item = sim.held!;
  const ticks = Math.round((3 / speed) * 60);
  let sum = 0;
  for (let t = 1; t <= ticks; t++) {
    const k = t / ticks;
    const aim = { x: start.x + 3 * k, y: start.y + 1.2 * Math.sin(Math.PI * k) };
    sim.step({ aim, commands: [] });
    const p = item.body.getPosition();
    sum += Math.hypot(aim.x - p.x, aim.y - p.y);
  }
  // How far past the stopping point it swings (the hand was moving right).
  let over = 0;
  for (let t = 0; t < 60; t++) {
    sim.step({ aim: { x: start.x + 3, y: start.y }, commands: [] });
    over = Math.max(over, item.body.getPosition().x - (start.x + 3));
  }
  return { lag: sum / ticks, over };
}

describe("every liar has at least two tells (§10 rule 1)", () => {
  it("lists two or more, of at least two different kinds", () => {
    expect(LIARS.length).toBe(10);
    for (const id of LIARS) {
      const tells = ITEMS[id].lie!.tells;
      expect(tells.length, id).toBeGreaterThanOrEqual(2);
      expect(new Set(tells.map((t) => t.kind)).size, id).toBeGreaterThanOrEqual(2);
      // Every liar can be tap-tested.
      expect(tells.some((t) => t.kind === "tap"), id).toBe(true);
    }
  });

  it("the weight liars sound like what they weigh, not what they look like", () => {
    expect(TAP_SOUNDS[ITEMS.safe.tap].sounds).toBe("light");
    expect(ITEMS.safe.looks.weight).toBe("heavy");
    expect(TAP_SOUNDS[ITEMS.feather.tap].sounds).toBe("heavy");
    expect(ITEMS.feather.looks.weight).toBe("light");
    // Honest items sound like they look.
    for (const id of ITEM_IDS.filter((i) => !ITEMS[i].lie)) expect(TAP_SOUNDS[ITEMS[id].tap].sounds, id).toBe(ITEMS[id].looks.weight);
  });

  it("drag weight: the feather trails far behind the hand, the safe zips and wobbles", () => {
    const brick = dragLag("brick");
    const feather = dragLag("feather");
    const safe = dragLag("safe");
    const anvil = dragLag("anvil");
    expect(feather.lag).toBeGreaterThan(brick.lag * 2.5);
    // The feather drags exactly like the (honest) anvil: same weight, same lag.
    expect(Math.abs(feather.lag - anvil.lag)).toBeLessThan(0.1);
    // A light thing is held loosely: it overshoots and wobbles where a brick stops dead.
    expect(safe.over).toBeGreaterThan(brick.over + 0.03);
  });
});

describe("behaviours", () => {
  it("the safe floats away alone, and stays down with something on it", () => {
    const sim = fresh();
    const lone = sim.drop("safe", { x: -1, y: 0.41 });
    const held = sim.drop("safe", { x: 1, y: 0.41 });
    sim.drop("brick", { x: 1, y: 1.02 });
    run(sim, seconds(4));
    expect(lone.body.getPosition().y).toBeGreaterThan(1.3);
    expect(Math.abs(held.body.getPosition().y - 0.41)).toBeLessThan(0.05);
    // Left alone long enough, it floats off the top of the screen: a fall.
    const lost = fresh(false);
    lost.drop("safe", { x: 0, y: 0.41 });
    const events = run(lost, seconds(40));
    expect(events.some((e) => e.type === "fall" && e.why === "floated")).toBe(true);
  });

  it("ice melts in 20 seconds and leaves a puddle (not a fall); whatever was on it comes down", () => {
    const sim = fresh();
    const ice = sim.drop("ice", { x: 0, y: 0.3 });
    const brick = sim.drop("brick", { x: 0, y: 0.82 });
    run(sim, seconds(10));
    expect(ice.scale).toBeGreaterThan(0.55);
    expect(ice.scale).toBeLessThan(0.7);
    const events = run(sim, seconds(11));
    expect(events.some((e) => e.type === "melted")).toBe(true);
    expect(sim.falls).toBe(0);
    expect(brick.body.getPosition().y).toBeLessThan(0.25);
  });

  it("a balloon inflates for 15 seconds and pushes things apart; something heavy pops it", () => {
    const sim = fresh();
    const balloon = sim.drop("balloon", { x: 0, y: 0.3 });
    const left = sim.drop("crate", { x: -0.72, y: 0.35 });
    const right = sim.drop("crate", { x: 0.72, y: 0.35 });
    run(sim, seconds(16));
    expect(balloon.scale).toBeCloseTo(1.9, 1);
    expect(right.body.getPosition().x - left.body.getPosition().x).toBeGreaterThan(1.8);
    const popper = fresh();
    popper.drop("balloon", { x: 0, y: 0.3 });
    popper.drop("anvil", { x: 0, y: 2.2 });
    const events = run(popper, seconds(2));
    expect(events.some((e) => e.type === "pop")).toBe(true);
  });

  it("a cake squashes under a heavy load, and stays squashed", () => {
    const sim = fresh();
    const cake = sim.drop("cake", { x: 0, y: 0.23 });
    const alone = sim.drop("cake", { x: 1.4, y: 0.23 });
    const anvil = sim.drop("anvil", { x: 0, y: 0.72 });
    run(sim, seconds(3));
    expect(cake.squash).toBeLessThan(0.7);
    expect(alone.squash).toBe(1);
    expect(topOf(anvil.body)).toBeLessThan(0.97);
    const before = cake.squash;
    // The anvil's lifted off: the cake doesn't spring back.
    anvil.body.setPosition({ x: 3, y: 0.5 });
    run(sim, seconds(2));
    expect(cake.squash).toBe(before);
  });

  it("a vase survives a gentle placement and breaks on a hard landing (a loss)", () => {
    const gentle = fresh(false);
    gentle.drop("vase", { x: 0, y: 0.42 });
    run(gentle, seconds(2));
    expect(gentle.status).toBe("play");
    const hard = fresh(false);
    hard.drop("vase", { x: 0, y: 1.4 });
    const events = run(hard, seconds(2));
    expect(events.some((e) => e.type === "break")).toBe(true);
    expect(hard.status).toBe("lost");
    expect(hard.lost).toBe("broke");
    // Something heavy dropped on it breaks it too.
    const crushed = fresh(false);
    crushed.drop("vase", { x: 0, y: 0.39 });
    crushed.drop("brick", { x: 0, y: 1.4 });
    expect(run(crushed, seconds(2)).some((e) => e.type === "break")).toBe(true);
  });

  it("the duck sticks to what it lands on, and holds through a tilt", () => {
    const sim = fresh();
    const brick = sim.drop("brick", { x: 0, y: 0.2 });
    const duck = sim.drop("duck", { x: 0.1, y: 0.71 });
    const events = run(sim, seconds(1));
    expect(events.some((e) => e.type === "weld")).toBe(true);
    expect(duck.welds).toBeGreaterThan(0);
    const offset = duck.body.getPosition().x - brick.body.getPosition().x;
    sim.world.setGravity({ x: 6, y: -8 });
    for (let t = 0; t < 60; t++) {
      sim.world.step(1 / 240);
      sim.world.step(1 / 240);
    }
    expect(Math.abs(duck.body.getPosition().x - brick.body.getPosition().x - offset)).toBeLessThan(0.02);
  });

  it("the paperweight is a magnet: metal things creep toward it", () => {
    const sim = fresh();
    const magnet = sim.drop("magnet", { x: -0.5, y: 0.23 });
    const cargo = sim.drop("cargo", { x: 0.32, y: 0.3 });
    const crate = sim.drop("crate", { x: -1.5, y: 0.35 });
    run(sim, seconds(2));
    // They slid together and clanked: touching, half-widths 0.35 + 0.4 apart.
    expect(cargo.body.getPosition().x - magnet.body.getPosition().x).toBeLessThan(0.78);
    expect(cargo.body.getPosition().x).toBeLessThan(0.31);
    // Wood doesn't care.
    expect(Math.abs(crate.body.getPosition().x + 1.5)).toBeLessThan(0.01);
  });

  it("the cardboard box rocks on its rounded bottom, and stands flat on its side", () => {
    const sim = fresh();
    // Alone, it stays up: straight if it's put down straight, a little crooked if it isn't.
    const lone = fresh();
    const alone = lone.drop("box", { x: -1, y: 0.31 });
    const crooked = lone.drop("box", { x: 1, y: 0.31 }, 0.15);
    run(lone, seconds(4));
    // With a brick on top, the upright one tips over; on its side it holds the brick.
    const upright = sim.drop("box", { x: 0, y: 0.31 });
    const loaded = sim.drop("brick", { x: -0.05, y: 0.82 });
    const side = sim.drop("box", { x: 1.4, y: 0.41 }, Math.PI / 2);
    const held = sim.drop("brick", { x: 1.35, y: 1.02 });
    run(sim, seconds(4));
    expect(Math.abs(alone.body.getAngle())).toBeLessThan(0.01);
    expect(Math.abs(crooked.body.getAngle())).toBeLessThan(0.3);
    expect(Math.abs(crooked.body.getAngle())).toBeGreaterThan(0.05);
    expect(Math.abs(upright.body.getAngle())).toBeGreaterThan(0.6);
    expect(loaded.body.getPosition().y).toBeLessThan(0.6);
    expect(Math.abs(side.body.getAngle() - Math.PI / 2)).toBeLessThan(0.05);
    expect(held.body.getPosition().y).toBeGreaterThan(0.95);
  });

  it("jelly is slippery: a brick on a slight slope slides off it", () => {
    const sim = fresh();
    sim.world.setGravity({ x: 1, y: -10 });
    sim.drop("jelly", { x: 0, y: 0.26 });
    const brick = sim.drop("brick", { x: 0, y: 0.73 });
    for (let t = 0; t < 120; t++) for (let s = 0; s < 4; s++) sim.world.step(1 / 240);
    expect(brick.body.getPosition().x).toBeGreaterThan(0.3);
  });
});
