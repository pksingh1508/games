import { beforeAll, describe, expect, it, vi } from "vitest";
import { LEVELS } from "../levels";
import { KEYS, Melody } from "./melody";
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
    expect(samples.length / rate).toBeLessThan(1.2);
    expect(peak).toBeGreaterThan(0.05);
    expect(peak).toBeLessThan(1.6);
  });
});

describe("the footstep melody", () => {
  it("stays in the world's scale, and never lands on home (that's for catching the door)", () => {
    for (const level of LEVELS) {
      const melody = new Melody(level.id, level.world);
      const { root, scale } = KEYS[level.world]!;
      for (let n = 1; n <= 40; n++) {
        const degree = (((melody.noteOf(n) - root) % 12) + 12) % 12;
        expect(scale).toContain(degree);
        expect(degree).not.toBe(0);
      }
    }
  });

  it("gives every level a tune of its own, in minor in World 5", () => {
    const tunes = new Set(LEVELS.map((l) => Array.from({ length: 12 }, (_, k) => new Melody(l.id, l.world).noteOf(k + 1)).join(",")));
    expect(tunes.size).toBeGreaterThanOrEqual(LEVELS.length - 2);
    expect(KEYS[5]!.scale).toContain(3);
    expect(KEYS[1]!.scale).toContain(4);
  });
});
