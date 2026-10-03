import { describe, expect, it } from "vitest";
import { accentInk, contrast, GAME_PALETTES, HUB_PALETTE, readableOn } from "./palettes";

const PALETTES = Object.entries({ hub: HUB_PALETTE, ...GAME_PALETTES });

describe("palettes", () => {
  it.each(PALETTES)("%s: every text pair passes WCAG AA", (_, p) => {
    expect(contrast(p.inkOnBg, p.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(p.muted, p.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(p.ink, p.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(p.mutedSurface, p.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(p.onAccent, p.accent)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(accentInk(p), p.bg)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps an accent that is already readable", () => {
    expect(readableOn("#FF3D7F", "#0E0B16")).toBe("#FF3D7F");
  });

  it("nudges a dim accent only as far as it needs", () => {
    const ink = readableOn("#D41F22", "#161414");
    expect(contrast(ink, "#161414")).toBeGreaterThanOrEqual(4.5);
    expect(ink).not.toBe("#FFFFFF");
  });
});
