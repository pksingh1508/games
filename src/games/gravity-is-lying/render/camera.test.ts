import { describe, expect, it } from "vitest";
import { TURN_TICKS_PER_QUARTER, VIEW_H, VIEW_W } from "../core/constants";
import { VEC } from "../core/gravity";
import { buildRoom, type RoomSource } from "../core/room";
import { Camera, dirToScreen, fitScale, MAX_TURN_SPEED, roomToScreen, viewAngle, wrap } from "./camera";

/** A 17 × 17 room (Tilted Town's size), turned by its camera. */
const square = (view: RoomSource["view"]) => {
  const inside = (r: number) => (r === 1 ? "aaa" + ".".repeat(12) : r === 15 ? "S" + ".".repeat(12) + "O." : ".".repeat(15));
  const map = Array.from({ length: 17 }, (_, r) => (r === 0 || r === 16 ? "#".repeat(17) : `#${inside(r)}#`));
  return buildRoom({ id: "t", name: "Test", gravity: "down", map, view }, 4, 0);
};

describe("the camera", () => {
  it("shows the room's view.up at the top of the screen", () => {
    for (const up of ["up", "left", "right", "down"] as const) {
      const angle = viewAngle(square({ up }));
      const shown = dirToScreen(VEC[up], angle);
      expect(shown.x).toBeCloseTo(0);
      expect(shown.y).toBeCloseTo(-1);
    }
  });

  it("a turned room makes gravity look sideways (Tilted Town's lie)", () => {
    const shown = dirToScreen(VEC.down, viewAngle(square({ up: "left" })));
    expect(shown.x).toBeCloseTo(-1);
    expect(shown.y).toBeCloseTo(0);
  });

  it("fits the room on the screen at any angle", () => {
    const room = { w: 272, h: 272 };
    for (let a = 0; a < Math.PI * 2; a += 0.05) {
      const s = fitScale(room, a);
      for (const [x, y] of [
        [0, 0],
        [272, 0],
        [0, 272],
        [272, 272],
      ] as const) {
        const p = roomToScreen(room, a, { x, y });
        expect(p.x).toBeGreaterThanOrEqual(-0.01);
        expect(p.x).toBeLessThanOrEqual(VIEW_W + 0.01);
        expect(p.y).toBeGreaterThanOrEqual(-0.01);
        expect(p.y).toBeLessThanOrEqual(VIEW_H + 0.01);
      }
      expect(s).toBeLessThanOrEqual(1);
    }
    expect(fitScale({ w: 480, h: 272 }, 0)).toBe(1);
  });

  it("never turns a quarter faster than 0.6 s, and never snaps (reduce motion: never turns at all)", () => {
    const room = square({ up: "right", intro: 30 });
    let reduce = false;
    const cam = new Camera(() => reduce);
    cam.snap(room, 0);
    expect(cam.angle).toBe(0);
    let ticks = 0;
    for (let tick = 1; tick < 400; tick++) {
      const before = cam.angle;
      cam.update(room, tick);
      const moved = Math.abs(wrap(cam.angle - before));
      expect(moved).toBeLessThanOrEqual(MAX_TURN_SPEED + 1e-9);
      if (moved > 1e-6) ticks++;
    }
    expect(cam.angle).toBeCloseTo(viewAngle(room));
    expect(ticks).toBeGreaterThanOrEqual(TURN_TICKS_PER_QUARTER);
    reduce = true;
    cam.snap(room, 400);
    expect(cam.angle).toBe(0);
  });
});
