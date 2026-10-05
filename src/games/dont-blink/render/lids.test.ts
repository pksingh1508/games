import { describe, expect, it } from "vitest";
import { cover, darkest } from "./lids";

describe("the eyelids", () => {
  it("close all the way normally: a blink is dark", () => {
    expect(cover(1, 0, false)).toEqual({ reach: 1, alpha: 1, blur: 0, brightness: 1 });
    expect(darkest(cover(1, 0, false))).toBe(0);
    expect(cover(0, 0, false).reach).toBe(0);
  });

  it("with Reduce flashing, the game never goes fully black (blinks, long blinks, static, power cuts)", () => {
    for (let c = 0; c <= 1.0001; c += 0.05) {
      for (let v = 0; v <= 1.0001; v += 0.25) {
        const look = cover(c, v, true);
        expect(darkest(look)).toBeGreaterThan(0.1);
        expect(look.alpha).toBeLessThan(1);
        expect(look.brightness).toBeGreaterThanOrEqual(0.5);
      }
    }
    // …but a shut eye still can't make anything out.
    expect(cover(1, 0, true).blur).toBeGreaterThanOrEqual(10);
    expect(cover(0, 1, true).blur).toBeGreaterThanOrEqual(10);
  });
});
