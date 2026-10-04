import { describe, expect, it } from "vitest";
import { contrast } from "@/games/palettes";
import { PALETTES } from "./draw";

/** `a` at `alpha` over `b` (the faded words on top). */
function over(a: string, b: string, alpha: number) {
  const ch = (hex: string, k: number) => parseInt(hex.slice(1 + k * 2, 3 + k * 2), 16);
  return `#${[0, 1, 2].map((k) => Math.round(ch(a, k) * alpha + ch(b, k) * (1 - alpha)).toString(16).padStart(2, "0")).join("")}`;
}

describe("the world palettes", () => {
  it.each(Object.entries(PALETTES))("world %s: the words and you are easy to see", (_, p) => {
    // The bar: the level, the steps, par (at 70%), the spike wave's countdown.
    expect(contrast(p.ink, p.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(over(p.ink, p.bg, 0.7), p.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(p.danger, p.bg)).toBeGreaterThanOrEqual(4.5);
    // Doory's EXIT sign (bold), and you on the floor.
    expect(contrast(p.onAccent, p.accent)).toBeGreaterThanOrEqual(3);
    expect(contrast(p.blob, p.tileA)).toBeGreaterThanOrEqual(3);
    expect(contrast(p.blob, p.tileB)).toBeGreaterThanOrEqual(3);
  });
});
