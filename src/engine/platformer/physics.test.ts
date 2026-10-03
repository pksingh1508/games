import { describe, expect, it } from "vitest";
import { moveX, moveY, onGround, TileGrid, type Body } from "./physics";
import { createRunner, DEFAULT_TUNING, stepRunner } from "./runner";

// A 10 × 6 room of 16 px tiles: floor on row 5, a wall at column 6, a one-way ledge at row 3.
const ROOM = ["..........", "..........", "..........", "..===.....", "......#...", "##########"];
const grid = new TileGrid(
  10,
  6,
  16,
  (c, r) => ROOM[r]?.[c] === "#",
  (c, r) => ROOM[r]?.[c] === "=",
);

const body = (x: number, y: number): Body => ({ x, y, w: 10, h: 14, vx: 0, vy: 0, rx: 0, ry: 0 });

describe("tile physics", () => {
  it("moves pixel by pixel and stops flush against walls", () => {
    const b = body(70, 66);
    expect(moveX(b, 30, grid)).toBe(true);
    expect(b.x + b.w).toBe(96);
  });

  it("keeps sub-pixel movement for later", () => {
    const b = body(10, 50);
    moveX(b, 0.4, grid);
    expect(b.x).toBe(10);
    moveX(b, 0.4, grid);
    expect(b.x).toBe(11);
  });

  it("lands on one-way ledges but jumps up through them", () => {
    const b = body(40, 20);
    expect(moveY(b, 40, grid)).toBe(true);
    expect(b.y + b.h).toBe(48);
    expect(onGround(b, grid)).toBe(true);
    const up = body(40, 50);
    expect(moveY(up, -20, grid)).toBe(false);
    expect(up.y).toBe(30);
  });
});

describe("the runner", () => {
  const floorY = 80 - 14;
  const stand = () => {
    const r = createRunner(20, floorY, 10, 14);
    stepRunner(r, { left: false, right: false, jump: false }, grid);
    return r;
  };

  it("jumps about three tiles when the button is held", () => {
    const r = stand();
    let top = r.y;
    for (let i = 0; i < 60; i++) {
      stepRunner(r, { left: false, right: false, jump: true }, grid);
      top = Math.min(top, r.y);
    }
    expect(floorY - top).toBeGreaterThan(40);
    expect(floorY - top).toBeLessThan(56);
  });

  it("jumps lower when the button is let go early", () => {
    const r = stand();
    let top = r.y;
    for (let i = 0; i < 60; i++) {
      stepRunner(r, { left: false, right: false, jump: i < 3 }, grid);
      top = Math.min(top, r.y);
    }
    expect(floorY - top).toBeLessThan(24);
  });

  it("still jumps a few ticks after running off a ledge (coyote time)", () => {
    const r = createRunner(32, 48 - 14, 10, 14);
    stepRunner(r, { left: false, right: false, jump: false }, grid);
    expect(r.grounded).toBe(true);
    let airborne = 0;
    while (r.grounded) {
      stepRunner(r, { left: false, right: true, jump: false }, grid);
      airborne++;
    }
    const events = stepRunner(r, { left: false, right: true, jump: true }, grid);
    expect(events.jumped).toBe(true);
    expect(airborne).toBeGreaterThan(0);
  });

  it("remembers a jump pressed just before landing (jump buffer)", () => {
    const r = createRunner(20, floorY - 2, 10, 14);
    stepRunner(r, { left: false, right: false, jump: true }, grid);
    expect(r.grounded).toBe(false);
    let jumped = false;
    for (let i = 0; i < DEFAULT_TUNING.bufferTicks && !jumped; i++) jumped = stepRunner(r, { left: false, right: false, jump: false }, grid).jumped;
    expect(jumped).toBe(true);
  });
});
