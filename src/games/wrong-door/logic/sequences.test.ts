import { describe, expect, it } from "vitest";
import { createRng } from "@/engine/rng";
import { makeSequence, nextTerm, predictions } from "./sequences";

describe("sequences", () => {
  it("knows what comes next in the well-known runs", () => {
    expect(nextTerm([2, 3, 5, 7])).toBe(11);
    expect(nextTerm([1, 4, 9, 16])).toBe(25);
    expect(nextTerm([3, 5, 8, 13])).toBe(21);
    expect(nextTerm([3, 6, 12, 24])).toBe(48);
    expect(nextTerm([1, 3, 6, 10])).toBe(15);
    expect(nextTerm([70, 65, 60, 55])).toBe(50);
    expect(nextTerm([1, 8, 27, 64])).toBe(125);
  });

  it("refuses runs two patterns read differently", () => {
    // 2, 3, 5: primes (7) or each the sum of the two before (8)?
    expect([...predictions([2, 3, 5])].sort()).toEqual([7, 8]);
    expect(Number.isNaN(nextTerm([2, 3, 5]))).toBe(true);
    // 2, 3, 5, 8: the two before (13), or jumps of 1, 2, 3, 4 (12)?
    expect([...predictions([2, 3, 5, 8])].sort((a, b) => a - b)).toEqual([12, 13]);
  });

  it("makes puzzles with one answer, and wrong numbers no pattern points to", () => {
    const rng = createRng(3);
    for (let i = 0; i < 2000; i++) {
      const p = makeSequence(rng, i % 2 ? 4 : 5, 4)!;
      expect(p).not.toBeNull();
      expect(nextTerm(p.shown)).toBe(p.answer);
      expect(new Set(p.wrong).size).toBe(4);
      for (const w of p.wrong) {
        expect(predictions(p.shown).has(w)).toBe(false);
        expect(w).toBeGreaterThan(0);
      }
    }
  });
});
