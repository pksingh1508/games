import { describe, expect, it } from "vitest";
import { GLITCH, JUMP, SLIDE, TELEGRAPH_MIN } from "../core/constants";
import { beatStart, createRun, step, ticksAt, type Run } from "../core/run";
import { EndlessTrack } from "../gen/endless";
import { Director, MAX_AT_ONCE, MAX_IN_PANIC, type RunView } from "./director";
import { endAt, onAt, phaseOf } from "./kinds";
import { lookAt } from "./present";

const viewOf = (run: Run): RunView => ({
  tick: run.tick,
  beat: run.beat,
  beatTick: run.beatTick,
  corruption: run.corruption,
  panic: run.panic,
  beatStart: (b) => beatStart(run.config, b),
  ticksAt: (b) => ticksAt(run.config, b),
});

/** A scripted player: jumps and slides on a rhythm, glitches now and then. */
const script = (t: number) => (t % 47 < 10 ? JUMP : 0) | (t % 61 > 50 ? SLIDE : 0) | (t % 300 === 150 ? GLITCH : 0);

function endless(seed: number, corruption = 60, ticks = 3000) {
  const track = new EndlessTrack(seed);
  const run = createRun(track.config({ corruption, drift: 0 }));
  const director = new Director({ plan: { seed }, marks: track.generator.marks });
  for (let i = 0; i < ticks; i++) {
    // Immortal for the test: the director only reads the run.
    run.status = "run";
    step(run, 0);
    director.update(viewOf(run));
  }
  return { run, director };
}

describe("the glitch director", () => {
  it("warns at least 0.6 s before every glitch, and lets it run 3 to 6 seconds", () => {
    const { director } = endless(7);
    expect(director.events.length).toBeGreaterThan(5);
    for (const e of director.events) {
      expect(e.telegraph).toBeGreaterThanOrEqual(TELEGRAPH_MIN);
      if (e.kind !== "dejaVu" && e.kind !== "invert") {
        expect(e.duration).toBeGreaterThanOrEqual(150);
        expect(e.duration).toBeLessThanOrEqual(390);
      }
    }
  });

  it("never more than two at once (warnings included), four in a Kernel Panic", () => {
    const { director } = endless(11, 90, 4000);
    const last = Math.max(...director.events.map(endAt));
    for (let t = 0; t < last; t++) expect(director.at(t).length).toBeLessThanOrEqual(MAX_IN_PANIC);
    const calm = endless(12, 40, 4000).director;
    const calmLast = Math.max(...calm.events.map(endAt));
    for (let t = 0; t < calmLast; t++) expect(calm.at(t).length).toBeLessThanOrEqual(MAX_AT_ONCE);
  });

  it("the same seed (and the same play) gives the same glitches", () => {
    const a = endless(99).director.events.map((e) => `${e.kind}@${e.start}+${e.duration}`);
    const b = endless(99).director.events.map((e) => `${e.kind}@${e.start}+${e.duration}`);
    expect(a).toEqual(b);
  });

  it("a story timeline: each glitch is on exactly when planned, warned two beats before", () => {
    const track = new EndlessTrack(1);
    const run = createRun(track.config({ drift: 0 }));
    const director = new Director({ plan: [{ beat: 6, kind: "screenTear", beats: 4 }, { beat: 20, kind: "invert", beats: 2 }] });
    for (let i = 0; i < 900; i++) {
      step(run, 0);
      run.status = "run";
      director.update(viewOf(run));
    }
    const [tear, invert] = director.events;
    expect(onAt(tear!)).toBe(beatStart(run.config, 6));
    expect(tear!.duration).toBe(4 * 30);
    expect(onAt(invert!)).toBe(beatStart(run.config, 20));
    expect(phaseOf(tear!, onAt(tear!) - 1)).toBe("warning");
  });
});

describe("the golden rule: the simulation never lies", () => {
  it("glitches change nothing in the run: with or without the director and the screen's lies, the same inputs give the same run", () => {
    const play = (withGlitches: boolean) => {
      const track = new EndlessTrack(5);
      const run = createRun(track.config({ corruption: 70 }));
      const director = new Director({ plan: { seed: 5 }, marks: track.generator.marks });
      let looks = 0;
      for (let i = 0; i < 2500; i++) {
        step(run, script(i));
        // Immortal (the same way in both runs), so there's time for plenty of glitches.
        run.status = "run";
        if (withGlitches) {
          director.update(viewOf(run));
          const look = lookAt(director.at(run.tick), run.tick, { corruption: run.corruption, panic: run.panic > 0 }, { reduceFlashing: false, reduceMotion: false });
          if (look.active.length) looks++;
        }
      }
      return { looks, state: JSON.stringify({ ...run, config: null, track: null }), cells: run.track.cols };
    };
    const calm = play(false);
    const glitched = play(true);
    expect(glitched.looks).toBeGreaterThan(0);
    expect(glitched.state).toBe(calm.state);
    expect(glitched.cells).toBe(calm.cells);
  });
});

describe("how the glitches look", () => {
  const event = (kind: Parameters<typeof lookAt>[0][number]["event"]["kind"], intensity = 1) => ({ id: 1, kind, start: 0, telegraph: 60, duration: 300, intensity, seed: 3 });
  const look = (kind: Parameters<typeof event>[0], tick: number, comfort = { reduceFlashing: false, reduceMotion: false }) => {
    const e = event(kind);
    const phase = phaseOf(e, tick)!;
    return lookAt([{ event: e, phase }], tick, { corruption: 50, panic: false }, comfort);
  };

  it("each glitch shows up as itself", () => {
    expect(look("screenTear", 150).tear).not.toBe(0);
    expect(look("invert", 150).invert).toBe(1);
    expect(look("invert", 150).reveal).toBe(1);
    expect(look("invert", 30).reveal).toBeGreaterThan(0);
    expect(look("inputSwap", 150).swap).toBe(true);
    expect(look("notResponding", 150).hold).toBe("frozen");
    expect(look("upsideDown", 200).flip).toBe(1);
    expect(look("lowRes", 150).pixel).toBeGreaterThan(3);
    expect(look("audioDesync", 150).lag).toBeGreaterThan(10);
    expect(look("missingTexture", 150).missing).toBe(true);
    expect(look("ghostDouble", 150).ghost).toBe(true);
    expect(look("dejaVu", 150).dejaVu).toBe(1);
    expect(look("screenTear", 30).warnings).toEqual(["screenTear"]);
  });

  it("Frame Skip stutters before every freeze, and lets go before it ends", () => {
    let stutters = 0;
    let lastHold = false;
    for (let t = 60; t < 360; t++) {
      const l = look("frameSkip", t);
      if (l.stutter) stutters++;
      // A freeze only ever follows a stutter.
      if (l.hold === "skip" && !lastHold) expect(look("frameSkip", t - 1).stutter).toBe(true);
      lastHold = l.hold === "skip";
    }
    expect(stutters).toBeGreaterThan(4);
    expect(look("frameSkip", 359).hold).toBe("none");
  });

  it("reduce flashing: no inversion (a soft tint instead), and nothing flickers more than 3 times a second", () => {
    const comfort = { reduceFlashing: true, reduceMotion: false };
    for (let t = 0; t < 360; t++) expect(look("invert", t, comfort).invert).toBe(0);
    expect(look("invert", 200, comfort).tint).toBeGreaterThan(0);
    // Count the warning flicker's flashes (dark to lit) over a second.
    let flashes = 0;
    let lit = false;
    for (let t = 0; t < 60; t++) {
      const now = look("screenTear", t, comfort).flicker;
      if (now && !lit) flashes++;
      lit = now;
    }
    expect(flashes).toBeLessThanOrEqual(3);
  });

  it("reduce motion: the screen never turns over", () => {
    for (let t = 0; t < 360; t++) expect(look("upsideDown", t, { reduceFlashing: false, reduceMotion: true }).flip).toBe(0);
  });

  it("gentle glitches hit at 30%", () => {
    const track = new EndlessTrack(3);
    const run = createRun(track.config());
    const gentle = new Director({ plan: [{ beat: 6, kind: "screenTear", beats: 4 }], gentle: true });
    for (let i = 0; i < 300; i++) {
      step(run, 0);
      run.status = "run";
      gentle.update(viewOf(run));
    }
    expect(gentle.events[0]!.intensity).toBeLessThanOrEqual(0.3);
  });
});
