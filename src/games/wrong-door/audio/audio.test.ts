import { beforeAll, describe, expect, it, vi } from "vitest";
import { CAPTIONS, panFor } from "./behind";
import { SOUNDS, type SfxName } from "./sfx";

describe("sound effects", () => {
  let build: (...params: Array<number | undefined>) => ArrayLike<number>;
  let rate = 44100;

  beforeAll(async () => {
    // ZzFX makes an AudioContext when it's imported; the test environment has none.
    vi.stubGlobal("AudioContext", class {});
    const { ZZFX } = await import("zzfx");
    build = (...params) => ZZFX.buildSamples(...params);
    rate = ZZFX.sampleRate;
  });

  it.each(Object.keys(SOUNDS) as SfxName[])("%s is short, audible and never clips hard", (name) => {
    const samples = build(...SOUNDS[name]);
    let peak = 0;
    for (let i = 0; i < samples.length; i++) {
      const v = samples[i]!;
      expect(Number.isFinite(v)).toBe(true);
      peak = Math.max(peak, Math.abs(v));
    }
    expect(samples.length / rate).toBeGreaterThan(0.01);
    expect(samples.length / rate).toBeLessThan(1.6);
    expect(peak).toBeGreaterThan(0.05);
    expect(peak).toBeLessThan(1.6);
  });
});

describe("the sounds behind doors", () => {
  it("every one has a caption and an icon (Plan §14: every sound clue has a working caption)", () => {
    for (const sound of ["wind", "footsteps", "ticking", "whispers", "silence"] as const) {
      expect(CAPTIONS[sound].text.length).toBeGreaterThan(3);
      expect(CAPTIONS[sound].icon.length).toBeGreaterThan(0);
    }
    expect(new Set(Object.values(CAPTIONS).map((c) => c.text)).size).toBe(5);
  });

  it("comes from the door's side of the hall (and the other side in a mirror)", () => {
    expect(panFor(1, 4, false)).toBeLessThan(0);
    expect(panFor(4, 4, false)).toBeGreaterThan(0);
    expect(panFor(1, 4, true)).toBeGreaterThan(0);
    expect(panFor(1, 1, false)).toBe(0);
  });
});
