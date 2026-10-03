import { beforeAll, describe, expect, it, vi } from "vitest";
import { SFX_NAMES, SOUNDS } from "./sfx";

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

  it.each(SFX_NAMES)("%s is short, audible and never clips hard", (name) => {
    const samples = build(...SOUNDS[name]);
    const seconds = samples.length / rate;
    let peak = 0;
    for (let i = 0; i < samples.length; i++) {
      const v = samples[i]!;
      expect(Number.isFinite(v)).toBe(true);
      peak = Math.max(peak, Math.abs(v));
    }
    expect(seconds).toBeGreaterThan(0.02);
    expect(seconds).toBeLessThan(1.2);
    expect(peak).toBeGreaterThan(0.05);
    expect(peak).toBeLessThan(1.6);
  });
});
