import { describe, expect, it } from "vitest";
import { Accumulator, TICK } from "./loop";

/** Ticks run by `seconds` of frames at `hz`. */
function ticksAt(hz: number, seconds: number, speed = 1): number {
  const acc = new Accumulator();
  let ticks = 0;
  for (let frame = 0; frame < Math.round(hz * seconds); frame++) ticks += acc.advance(1 / hz, speed);
  return ticks;
}

describe("Accumulator", () => {
  it("runs the same number of ticks on 60, 90, 120 and 144 Hz screens", () => {
    for (const hz of [60, 90, 120, 144]) expect(ticksAt(hz, 10)).toBe(600);
  });

  it("slows the simulation down for slow motion", () => {
    expect(ticksAt(60, 10, 0.5)).toBe(300);
    expect(ticksAt(144, 10, 0.75)).toBe(450);
  });

  it("never runs more than a quarter second of catch-up after a long frame", () => {
    const acc = new Accumulator();
    expect(acc.advance(5)).toBe(15);
    expect(acc.advance(-1)).toBe(0);
  });

  it("reports how far into the next tick it is", () => {
    const acc = new Accumulator();
    acc.advance(TICK * 1.5);
    expect(acc.alpha).toBeCloseTo(0.5, 5);
  });
});
