import { beforeAll, describe, expect, it, vi } from "vitest";
import { CUE_SOUND, SFX_NAMES, SOUNDS } from "./sfx";
import { SONGS } from "./music";

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
    expect(seconds).toBeGreaterThan(0.01);
    expect(seconds).toBeLessThan(1.2);
    expect(peak).toBeGreaterThan(0.05);
    expect(peak).toBeLessThan(1.6);
  });

  it("every move has its own cue, short enough to sit inside a beat", () => {
    const cues = Object.values(CUE_SOUND);
    expect(new Set(cues).size).toBe(cues.length);
    // A beat is 0.36 s at the fastest tempo (22 ticks).
    for (const cue of cues) expect(build(...SOUNDS[cue]).length / rate).toBeLessThan(0.3);
    // Jump sounds high and rising, slide low and falling: you can tell them apart without looking.
    expect(SOUNDS.cueJump[2]).toBeGreaterThan(SOUNDS.cueSlide[2]);
    expect(SOUNDS.cueJump[8]).toBeGreaterThan(0);
    expect(SOUNDS.cueSlide[8]).toBeLessThan(0);
  });
});

describe("the soundtrack", () => {
  it("has a song per part of the story, eight bars each", () => {
    expect(SONGS).toHaveLength(4);
    for (const song of SONGS) {
      expect(song.roots).toHaveLength(8);
      expect(song.minor).toHaveLength(8);
      // Bass notes, in a range a saw wave sounds good in.
      for (const root of song.roots) expect(root).toBeGreaterThanOrEqual(28);
      for (const root of song.roots) expect(root).toBeLessThanOrEqual(52);
    }
  });
});
