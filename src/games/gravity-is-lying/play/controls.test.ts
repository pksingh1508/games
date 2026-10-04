import { describe, expect, it } from "vitest";
import { LEFT, RIGHT } from "../core/constants";
import { along } from "../core/gravity";
import { walk, type Held } from "./controls";

const none: Held = { left: false, right: false, up: false, down: false };
const right: Held = { ...none, right: true };
const left: Held = { ...none, left: true };

describe("walking in Newt mode", () => {
  it("on a floor or a ceiling, ◀ ▶ go the way they point on screen", () => {
    expect(walk("newt", right, along("down"), 0, null).bit).toBe(RIGHT);
    // Upside down, Newt's own left is the screen's right.
    expect(walk("newt", right, along("up"), 0, null).bit).toBe(LEFT);
    expect(walk("newt", left, along("up"), 0, null).bit).toBe(RIGHT);
  });

  it("on a wall, ▶ is Newt's own right", () => {
    expect(walk("newt", right, along("left"), 0, null).bit).toBe(RIGHT);
    expect(walk("newt", right, along("right"), 0, null).bit).toBe(RIGHT);
    expect(walk("newt", left, along("right"), 0, null).bit).toBe(LEFT);
  });

  it("a held key keeps walking the same way through a flip (floor to ceiling, wall to wall)", () => {
    const floor = walk("newt", right, along("down"), 0, null);
    expect(walk("newt", right, along("up"), 0, floor.latch).bit).toBe(LEFT);
    const wall = walk("newt", right, along("left"), 0, null);
    const flipped = walk("newt", right, along("right"), 0, wall.latch);
    // Still the same way on screen: down the wall.
    expect(flipped.bit).toBe(LEFT);
    expect(walk("newt", right, along("left"), 0, flipped.latch).bit).toBe(RIGHT);
  });

  it("let go and press again, and it's worked out afresh", () => {
    const held = walk("newt", right, along("down"), 0, null);
    const flipped = walk("newt", right, along("up"), 0, held.latch);
    const released = walk("newt", none, along("up"), 0, flipped.latch);
    expect(released).toEqual({ bit: 0, latch: null });
    expect(walk("newt", right, along("up"), 0, released.latch).bit).toBe(LEFT);
  });

  it("round a planet, a held key keeps walking round", () => {
    let latch = walk("newt", right, { x: 1, y: 0 }, 0, null).latch;
    for (let a = 0; a <= Math.PI * 2; a += 0.1) {
      const next = walk("newt", right, { x: Math.cos(a), y: Math.sin(a) }, 0, latch);
      expect(next.bit).toBe(RIGHT);
      latch = next.latch;
    }
  });

  it("follows the camera: in a turned town, a floor that looks like a wall walks Newt's way", () => {
    // Turned a quarter: the floor looks like a wall.
    expect(walk("newt", right, along("down"), Math.PI / 2, null).bit).toBe(RIGHT);
    // Upside down: the floor looks like a ceiling, so ▶ (screen right) is Newt's left.
    expect(walk("newt", right, along("down"), Math.PI, null).bit).toBe(LEFT);
  });

  it("out in deep space walking does nothing new", () => {
    expect(walk("newt", right, null, 0, null).bit).toBe(0);
    const held = walk("newt", right, { x: 1, y: 0 }, 0, null);
    expect(walk("newt", right, null, 0, held.latch).bit).toBe(RIGHT);
  });

  it("ignores up and down (they're jump and flip)", () => {
    expect(walk("newt", { ...none, up: true }, along("left"), 0, null)).toEqual({ bit: 0, latch: null });
  });
});

describe("walking in screen mode", () => {
  it("the arrows go the way they point on screen, along Newt's floor", () => {
    // On the left wall, Newt's floor runs down the screen.
    expect(walk("screen", { ...none, up: true }, along("left"), 0, null).bit).toBe(LEFT);
    expect(walk("screen", { ...none, down: true }, along("left"), 0, null).bit).toBe(RIGHT);
    expect(walk("screen", right, along("up"), 0, null).bit).toBe(LEFT);
  });

  it("pushing into the floor goes nowhere", () => {
    expect(walk("screen", right, along("left"), 0, null).bit).toBe(0);
    expect(walk("screen", { ...none, down: true }, along("down"), 0, null).bit).toBe(0);
  });
});
