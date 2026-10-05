import { describe, expect, it } from "vitest";
import { Blink } from "./blink";
import { BLINK_CLOSED, BLINK_CLOSING, BLINK_OPENING, LONG_BLINK, seconds, STRAIN_SECONDS } from "./constants";

const every = (ticks: number) => () => ticks;

describe("blinking", () => {
  it("closes, stays shut, and opens again: shut fires once, on the first fully closed tick", () => {
    const blink = new Blink(every(100), 10);
    const phases: string[] = [];
    let shut = 0;
    let shutAt = -1;
    for (let t = 1; t <= 10 + BLINK_CLOSING + BLINK_CLOSED + BLINK_OPENING + 2; t++) {
      const step = blink.step(false);
      phases.push(blink.phase);
      if (step.shut) {
        shut++;
        shutAt = t;
        expect(blink.phase).toBe("closed");
        expect(blink.closure).toBe(1);
      }
    }
    expect(shut).toBe(1);
    expect(shutAt).toBe(10 + BLINK_CLOSING);
    expect(phases.at(-1)).toBe("open");
    // About 0.28 s, as in the plan (80 ms closing, 120 ms closed, 80 ms opening).
    expect(BLINK_CLOSING + BLINK_CLOSED + BLINK_OPENING).toBe(17);
  });

  it("the lids are never fully closed except while closed", () => {
    const blink = new Blink(every(30), 5);
    for (let t = 0; t < 400; t++) {
      blink.step(false);
      if (blink.closure >= 1) expect(blink.phase).toBe("closed");
      if (blink.phase === "open") expect(blink.closure).toBe(0);
    }
  });

  it("holding your eyes open delays the blink and strains them; at 100% they give out for a long blink", () => {
    const blink = new Blink(every(60), 60);
    let long = false;
    let held = 0;
    let closed = 0;
    for (let t = 0; t < seconds(STRAIN_SECONDS) + 10; t++) {
      const step = blink.step(true);
      if (blink.phase === "open") held++;
      if (blink.phase === "closed") closed++;
      if (step.shut) long = step.long;
    }
    // No ordinary blink while holding: the first blink was the long one, after about eight seconds.
    expect(long).toBe(true);
    expect(held).toBeGreaterThanOrEqual(seconds(STRAIN_SECONDS) - 2);
    expect(blink.heldTicks).toBeGreaterThanOrEqual(seconds(STRAIN_SECONDS) - 2);
    // The long blink lasts a second and a half.
    while (blink.phase !== "open") {
      blink.step(true);
      if (blink.phase === "closed") closed++;
    }
    expect(closed).toBeGreaterThanOrEqual(LONG_BLINK - 1);
    // …and rests the eyes a good deal.
    expect(blink.strain).toBeLessThanOrEqual(25);
  });

  it("strain drains when you let yourself blink", () => {
    const blink = new Blink(every(1000), 1000);
    for (let t = 0; t < seconds(4); t++) blink.step(true);
    const strained = blink.strain;
    expect(strained).toBeGreaterThan(40);
    for (let t = 0; t < seconds(3); t++) blink.step(false);
    expect(blink.strain).toBeLessThan(strained - 40);
  });
});
