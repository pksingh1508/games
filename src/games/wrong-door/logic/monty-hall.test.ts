import { describe, expect, it } from "vitest";
import { createRng } from "@/engine/rng";
import { hostOpens, simulate, switchTo } from "./monty-hall";

describe("the Lucky Floor (Monty Hall)", () => {
  it("never opens your door or the way up", () => {
    const rng = createRng(7);
    for (let i = 0; i < 2000; i++) {
      const exit = 1 + (i % 3);
      const picked = 1 + Math.floor(i / 3) % 3;
      const opened = hostOpens(picked, exit, rng);
      expect(opened).not.toBe(picked);
      expect(opened).not.toBe(exit);
      expect(switchTo(picked, opened)).not.toBe(opened);
    }
  });

  it("switching wins two times in three over 100,000 rounds; staying, one in three", () => {
    const switching = simulate(100_000, true, createRng("switch"));
    const staying = simulate(100_000, false, createRng("stay"));
    expect(switching).toBeGreaterThan(0.66);
    expect(switching).toBeLessThan(0.673);
    expect(staying).toBeGreaterThan(0.327);
    expect(staying).toBeLessThan(0.34);
  });
});
