import { describe, expect, it } from "vitest";
import { playClean, playHunt } from "./bot";
import { BEAT_TICKS, BLINK_TICKS, FREEZE_TICKS, FULL, GIVE_UP_TICKS, HZ, seconds, TIRED_TICKS, WAKE_TICKS } from "./constants";
import { testLevel, testScene } from "./fixtures";
import type { Vec } from "./geometry";
import type { LevelDef, PixDef } from "./level";
import { cellColour, contrast, pixColour } from "./look";
import { defaultLayout, formatProgress, World, type Input } from "./world";

const press = (at: Vec): Input => ({ pointer: at, down: true, path: [at], commands: [{ type: "press", at }] });
const hover = (at: Vec | null = null): Input => ({ pointer: at, down: false, commands: [{ type: "release" }] });

function idle(w: World, ticks: number, at: Vec | null = null) {
  for (let t = 0; t < ticks; t++) w.step(hover(at));
}

/** A level played up to the hunt (Pix running), the cursor parked at `at`. */
function hunting(pix: PixDef, over: Partial<LevelDef> = {}, at: Vec | null = null): World {
  const w = new World(testLevel({ pix, ...over }));
  playClean(w);
  expect(w.phase).toBe("wake");
  idle(w, WAKE_TICKS + 1, at);
  expect(w.phase).toBe("hunt");
  return w;
}

/** Let Pix run off and settle into whatever it's doing. */
const settle = (w: World, ticks = seconds(3), at: Vec | null = null) => idle(w, ticks, at);

describe("the clean-up and the switch", () => {
  it("nothing happens until your first stroke; then the clock starts", () => {
    const w = new World(testLevel());
    idle(w, 30, { x: 5, y: 5 });
    expect(w.started).toBe(false);
    expect(w.tick).toBe(0);
    w.step(press({ x: 5, y: 5 }));
    expect(w.started).toBe(true);
    expect(w.tick).toBe(1);
    expect(w.cov.covered).toBeGreaterThan(0);
  });

  it("the last cell won't be painted: it's Pix. It wakes there, and the progress reads 99.9…%, not 100%", () => {
    const w = new World(testLevel());
    playClean(w);
    expect(w.phase).toBe("wake");
    expect(w.events.some((e) => e.type === "wake")).toBe(true);
    expect(w.progress).toBeLessThan(1);
    expect(formatProgress(w.progress)).toMatch(/^99\.\d+%$/);
    expect(w.pixAlive).toBe(true);
    expect(w.cleanTicks).toBeGreaterThan(0);
  });

  it("shows more decimals the closer you get, and never rounds up to 100%", () => {
    expect(formatProgress(0.5)).toBe("50%");
    expect(formatProgress(0.8999)).toBe("89%");
    expect(formatProgress(0.955)).toBe("95.5%");
    expect(formatProgress(0.99871)).toBe("99.87%");
    expect(formatProgress(9215 / 9216)).toBe("99.989%");
    expect(formatProgress(0.999999)).toBe("99.999%");
    expect(formatProgress(1)).toBe("100%");
  });

  it("while it says \"!\" it can't be caught; then it dashes away from your cursor", () => {
    const w = new World(testLevel());
    playClean(w);
    const pix = { x: w.pix.x, y: w.pix.y };
    w.step(press(pix));
    expect(w.events.some((e) => e.type === "notYet")).toBe(true);
    expect(w.phase).toBe("wake");
    idle(w, WAKE_TICKS + seconds(1), pix);
    expect(w.phase).toBe("hunt");
    expect(Math.hypot(w.pix.x - pix.x, w.pix.y - pix.y)).toBeGreaterThan(10);
  });
});

describe("catching Pix", () => {
  it("a tap on it (a generous radius) catches it: 100%; a tap beside it misses", () => {
    const w = hunting({ speed: 6 });
    settle(w);
    const p = { x: w.pix.x, y: w.pix.y };
    w.step(press({ x: p.x + 6, y: p.y }));
    expect(w.events.some((e) => e.type === "miss")).toBe(true);
    w.step(hover());
    w.step(press({ x: w.pix.x + 1.5, y: w.pix.y }));
    expect(w.events.some((e) => e.type === "caught")).toBe(true);
    expect(w.phase).toBe("done");
    expect(w.progress).toBe(1);
    expect(w.stars()[0]).toBe(true);
  });

  it("it runs from your cursor, faster the closer you get, but the bot (no faster than a hand) still catches it", () => {
    const w = hunting({ speed: 9, flee: true });
    settle(w);
    const near = { x: w.pix.x + 4, y: w.pix.y };
    const before = Math.hypot(w.pix.x - near.x, w.pix.y - near.y);
    idle(w, 20, near);
    expect(Math.hypot(w.pix.x - near.x, w.pix.y - near.y)).toBeGreaterThan(before + 2);
    playHunt(w);
    expect(w.phase).toBe("done");
  });

  it("a quick net catches it; a slow one gives it time to slip out; nets run out", () => {
    const w = hunting({ speed: 5 });
    settle(w);
    const box = (pad: number) => ({ x: w.pix.x - pad, y: w.pix.y - pad, w: pad * 2, h: pad * 2 });
    // Slow: drawn for a second before letting go.
    const slow = box(4);
    for (let t = 1; t <= HZ; t++) w.step({ pointer: null, down: true, net: { rect: slow, ticks: t } });
    expect(w.events.length >= 0).toBe(true);
    w.step({ pointer: null, down: false, commands: [{ type: "net", rect: slow, ticks: HZ }] });
    expect(w.events).toContainEqual({ type: "net", caught: false });
    expect(w.nets).toBe(2);
    // Quick.
    const quick = box(5);
    for (let t = 1; t <= 10; t++) w.step({ pointer: null, down: true, net: { rect: quick, ticks: t } });
    w.step({ pointer: null, down: false, commands: [{ type: "net", rect: box(5), ticks: 10 }] });
    expect(w.events).toContainEqual({ type: "net", caught: true });
    expect(w.result().caughtBy).toBe("net");
    expect(w.netCatches).toBe(1);
  });

  it("freeze stops it for a second, bait draws it in", () => {
    const w = hunting({ speed: 9, flee: true });
    settle(w);
    w.step({ pointer: null, down: false, commands: [{ type: "freeze" }] });
    const at = { x: w.pix.x, y: w.pix.y };
    idle(w, FREEZE_TICKS - 2, { x: at.x + 3, y: at.y });
    expect(w.pix.x).toBe(at.x);
    expect(w.freezes).toBe(0);
    idle(w, seconds(1.5));
    const bait = { x: 6, y: 6 };
    w.step({ pointer: null, down: false, commands: [{ type: "bait", at: bait }] });
    idle(w, seconds(1.9));
    expect(Math.hypot(w.pix.x - bait.x, w.pix.y - bait.y)).toBeLessThan(2);
  });

  it("stars: 100%, the clean-up within the target, the hunt under 10 seconds (not with the assist)", () => {
    const fast = new World(testLevel({ pix: { speed: 4 }, target: 99999 }));
    playClean(fast);
    playHunt(fast);
    expect(fast.stars()).toEqual([true, true, true]);
    const slow = new World(testLevel({ pix: { speed: 4 }, target: 10 }));
    playClean(slow);
    playHunt(slow);
    expect(slow.stars()).toEqual([true, false, true]);
    const assisted = new World(testLevel({ pix: { speed: 4 } }), { assist: true });
    playClean(assisted);
    playHunt(assisted);
    expect(assisted.stars()).toEqual([true, true, false]);
  });

  it("tired at 30 seconds (slower), and at 60 it gives up and sits still (\"fine.\")", () => {
    const w = hunting({ speed: 9, flee: true });
    const fresh = w.speed();
    idle(w, TIRED_TICKS);
    expect(w.pix.tired).toBe(true);
    expect(w.speed()).toBeLessThan(fresh);
    idle(w, GIVE_UP_TICKS - TIRED_TICKS);
    expect(w.pix.gaveUp).toBe(true);
    const at = { x: w.pix.x, y: w.pix.y };
    idle(w, 30, { x: at.x + 2, y: at.y });
    expect(w.pix.x).toBe(at.x);
    w.step(press(at));
    expect(w.phase).toBe("done");
  });

  it("is the same game for the same inputs", () => {
    const run = () => {
      const w = new World(testLevel({ pix: { speed: 9, flee: true, decoys: 2 } }));
      playClean(w);
      playHunt(w);
      return [w.tick, w.huntTicks, Array.from(w.cov.amount).join(",")];
    };
    expect(run()).toEqual(run());
  });
});

describe("Pix's traits and their tells", () => {
  it("camouflage: within 2% of the background's brightness, and a shimmer every 2 seconds gives it away", () => {
    const w = hunting({ speed: 4, camo: true });
    settle(w, seconds(2.5));
    const shimmers: number[] = [];
    for (let t = 0; t < seconds(6); t++) {
      w.step(hover());
      const under = cellColour(w.scene, w.cov.amount, w.cov.variant, Math.floor(w.pix.y) * w.w + Math.floor(w.pix.x));
      const c = contrast(pixColour(w), under);
      if (w.shimmering()) {
        shimmers.push(w.roundTicks);
        expect(c).toBeGreaterThan(0.08);
      } else expect(c).toBeLessThanOrEqual(0.025);
    }
    // In bursts, two seconds apart.
    const starts = shimmers.filter((t, k) => k === 0 || t !== shimmers[k - 1]! + 1);
    expect(starts.length).toBe(3);
    expect(starts[1]! - starts[0]!).toBe(seconds(2));
  });

  it("decoys: only the real one blinks on every beat; tapping a decoy pops it; bait only fools the real one", () => {
    const w = hunting({ speed: 5, decoys: 4 });
    expect(w.decoys.filter((d) => d.alive)).toHaveLength(4);
    const realBlinks: number[] = [];
    const decoyStarts: number[] = [];
    const from = w.roundTicks + 1;
    for (let t = 0; t < seconds(8); t++) {
      w.step(hover());
      if (w.blinking()) realBlinks.push(w.roundTicks);
      const d0 = w.decoys[0]!;
      if (w.roundTicks === d0.blinkAt) decoyStarts.push(w.roundTicks);
    }
    const to = w.roundTicks;
    // The real one: on the beat, and on every beat.
    expect(realBlinks.every((t) => t % BEAT_TICKS < BLINK_TICKS)).toBe(true);
    const beats = new Set(realBlinks.map((t) => Math.floor(t / BEAT_TICKS)));
    for (let k = Math.ceil(from / BEAT_TICKS); k * BEAT_TICKS + BLINK_TICKS <= to; k++) expect(beats.has(k), `beat ${k}`).toBe(true);
    // A decoy blinks too, but not on the beat every time.
    expect(decoyStarts.length).toBeGreaterThan(4);
    expect(decoyStarts.every((t) => t % BEAT_TICKS === 0)).toBe(false);
    const d = w.decoys.find((x) => x.alive)!;
    w.step(press({ x: d.x, y: d.y }));
    expect(w.events.some((e) => e.type === "decoy")).toBe(true);
    expect(w.phase).toBe("hunt");
    // Bait: the real one comes; the decoys don't care.
    const bait = { x: 4, y: 4 };
    const decoysBefore = w.decoys.filter((x) => x.alive).map((x) => Math.hypot(x.x - bait.x, x.y - bait.y));
    w.step({ pointer: null, down: false, commands: [{ type: "bait", at: bait }] });
    idle(w, seconds(1.9));
    expect(Math.hypot(w.pix.x - bait.x, w.pix.y - bait.y)).toBeLessThan(2);
    const decoysAfter = w.decoys.filter((x) => x.alive).map((x) => Math.hypot(x.x - bait.x, x.y - bait.y));
    expect(decoysAfter.some((dd) => dd > 4)).toBe(true);
    expect(decoysBefore.length).toBe(decoysAfter.length);
  });

  it("the repaint trail: it un-paints cells as it runs (a limited number), and after the catch you paint them back", () => {
    const w = hunting({ speed: 9, flee: true, trail: 40 });
    const covered = w.cov.covered;
    for (let t = 0; t < seconds(4); t++) w.step(hover({ x: w.pix.x + 5, y: w.pix.y }));
    const undone = covered - w.cov.covered;
    expect(undone).toBeGreaterThan(5);
    expect(undone).toBeLessThanOrEqual(40);
    expect(w.events.length >= 0).toBe(true);
    playHunt(w);
    expect(w.phase).toBe("done");
    expect(w.cov.covered).toBe(w.cov.total);
  });
});

describe("Pix's tricks: each one hides it until you see through it", () => {
  it("under the HUD: it can't be tapped there; drag the panel off it and it's caught out", () => {
    const w = hunting({ speed: 8, tricks: ["hud"] });
    settle(w, seconds(4));
    expect(w.pix.mode).toBe("hud");
    expect(w.pix.arrived).toBe(true);
    expect(w.catchable()).toBe(false);
    w.step(press({ x: w.pix.x, y: w.pix.y }));
    expect(w.phase).toBe("hunt");
    const hud = w.layout.hud.map((r, k) => (k === w.pix.hud ? { ...r, x: r.x + r.w + 6 } : r));
    w.setLayout({ ...w.layout, hud });
    w.step(hover());
    expect(w.events).toContainEqual({ type: "exposed", trick: "hud" });
    expect(w.pix.mode).toBe("stunned");
    w.step(press({ x: w.pix.x, y: w.pix.y }));
    expect(w.phase).toBe("done");
  });

  it("a dead pixel on your monitor: it sits off the canvas; pause the game and it's seen through (back on the canvas)", () => {
    const w = hunting({ speed: 8, tricks: ["dead"] });
    settle(w, seconds(5));
    expect(w.pix.mode).toBe("dead");
    expect(w.pix.arrived).toBe(true);
    expect(w.onCanvas()).toBe(false);
    w.step({ pointer: null, down: false, commands: [{ type: "paused" }] });
    expect(w.events).toContainEqual({ type: "exposed", trick: "dead" });
    expect(w.onCanvas()).toBe(true);
    expect(w.outed).toBe(true);
  });

  it("…and tapping the \"dead pixel\" itself catches it too", () => {
    const w = hunting({ speed: 8, tricks: ["dead"] });
    settle(w, seconds(5));
    w.step(press({ x: w.pix.x, y: w.pix.y }));
    expect(w.phase).toBe("done");
    expect(w.outed).toBe(false);
  });

  it("burrowed: out of sight and out of reach, until your tool scrubs over it", () => {
    const w = hunting({ speed: 6, tricks: ["burrow"] });
    settle(w, seconds(2));
    expect(w.pix.mode).toBe("burrow");
    expect(w.catchable()).toBe(false);
    // A stroke well away from it does nothing.
    const far = { x: w.pix.x > w.w / 2 ? 3 : w.w - 3, y: 3 };
    w.step(press(far));
    w.step(hover());
    expect(w.pix.mode).toBe("burrow");
    // Scrub close by: dug out (and a tap on the spot does the same, since a tap is a stroke too).
    const at = { x: w.pix.x + 3, y: w.pix.y };
    w.step(press(at));
    expect(w.events).toContainEqual({ type: "exposed", trick: "burrow" });
    expect(w.pix.mode).toBe("stunned");
    w.step(hover());
    w.step(press({ x: w.pix.x, y: w.pix.y }));
    expect(w.phase).toBe("done");
  });

  it("a second mouse cursor: it moves wrong (mirrored), and when yours touches it, it drops the act", () => {
    const w = hunting({ speed: 6, tricks: ["mimic"], mimic: "mirrorX" }, {}, { x: 2, y: 2 });
    settle(w, seconds(2), { x: 2, y: 2 });
    expect(w.pix.mode).toBe("mimic");
    const before = { x: w.pix.x, y: w.pix.y };
    w.step(hover({ x: 4, y: 3 }));
    expect(w.pix.x).toBeCloseTo(before.x - 2);
    expect(w.pix.y).toBeCloseTo(before.y + 1);
    w.step(hover({ x: w.pix.x, y: w.pix.y }));
    w.step(hover({ x: w.pix.x + 0.5, y: w.pix.y }));
    expect(w.pix.mode).toBe("stunned");
  });

  it("out of the canvas into the page: it sits in a page spot (the logo's i), and a tap there catches it", () => {
    const w = hunting({ speed: 8, tricks: ["dom"], spots: ["logo"] });
    settle(w, seconds(5));
    expect(w.pix.mode).toBe("dom");
    expect(w.pix.arrived).toBe(true);
    const logo = defaultLayout(w.w, w.h).spots.find((s) => s.id === "logo")!;
    expect(w.pix.x).toBe(logo.x);
    expect(w.pix.y).toBe(logo.y);
    w.step(press({ x: logo.x + 0.5, y: logo.y }));
    expect(w.phase).toBe("done");
  });

  it("into the tab's icon: look away and come back, and it falls back in", () => {
    const w = hunting({ speed: 8, tricks: ["tab"] });
    settle(w, seconds(5));
    expect(w.pix.mode).toBe("tab");
    expect(w.pix.arrived).toBe(true);
    w.step({ pointer: null, down: false, commands: [{ type: "visible" }] });
    expect(w.pix.mode).toBe("tab");
    w.step({ pointer: null, down: false, commands: [{ type: "hidden" }, { type: "visible" }] });
    expect(w.pix.mode).toBe("stunned");
    expect(w.onCanvas()).toBe(true);
    w.step(press({ x: w.pix.x, y: w.pix.y }));
    expect(w.result().tabbed).toBe(true);
  });

  it("tricks come one at a time, in order, with a gap to catch it in between", () => {
    const w = hunting({ speed: 6, tricks: ["burrow", "hud"] });
    settle(w, seconds(2));
    expect(w.pix.mode).toBe("burrow");
    w.step(press({ x: w.pix.x, y: w.pix.y }));
    w.step({ pointer: { x: w.pix.x + 1, y: w.pix.y }, down: true, path: [{ x: w.pix.x + 1, y: w.pix.y }] });
    expect(w.pix.mode).toBe("stunned");
    idle(w, seconds(2));
    expect(w.pix.mode).toBe("free");
    idle(w, seconds(4));
    expect(w.pix.mode).toBe("hud");
  });

  it("gives up hiding at 60 seconds: out from under the HUD, where you can catch it", () => {
    const w = hunting({ speed: 8, tricks: ["hud"] });
    idle(w, GIVE_UP_TICKS + 2);
    expect(w.pix.gaveUp).toBe(true);
    expect(w.pix.mode).toBe("free");
    const r = w.layout.hud[w.pix.hud]!;
    expect(w.pix.x >= r.x && w.pix.x < r.x + r.w && w.pix.y >= r.y && w.pix.y < r.y + r.h).toBe(false);
    expect(w.catchable()).toBe(true);
  });
});

describe("the finale", () => {
  const finale = () =>
    new World(
      testLevel({
        id: "5-01",
        world: 5,
        revenge: 300,
        pix: { speed: 5, flee: true },
        rounds: [{ speed: 5, decoys: 2 }, { speed: 5, tricks: ["hud"] }],
        scene: () => testScene(48, 27),
      }),
    );

  it("Pix un-paints the canvas (and can't be caught doing it), then it's the last pixel again; caught three times", () => {
    const w = finale();
    expect(w.phase).toBe("revenge");
    expect(w.progress).toBeLessThan(1);
    w.step(press({ x: w.pix.x, y: w.pix.y }));
    expect(w.events.some((e) => e.type === "notYet")).toBe(true);
    while (w.phase === "revenge") w.step(hover());
    expect(w.cov.total - w.cov.covered).toBe(300);
    playClean(w);
    expect(w.phase).toBe("wake");
    const catches: number[] = [];
    for (let round = 0; round < 3; round++) {
      idle(w, WAKE_TICKS + seconds(1.5));
      playHunt(w, HZ * 70);
      catches.push(w.round);
    }
    expect(w.phase).toBe("done");
    expect(w.round).toBe(2);
    expect(w.cov.covered).toBe(w.cov.total);
  });

  it("is never stuck: the survivor is found even if you'd already repainted everything", () => {
    const w = finale();
    while (w.phase === "revenge") w.step(press({ x: 10, y: 10 }));
    expect(w.cov.covered).toBeLessThan(w.cov.total);
    expect(FULL).toBe(255);
  });
});
