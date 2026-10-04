import { beforeAll, describe, expect, it, vi } from "vitest";
import { ZONES } from "../world";
import { chordNotes, melodyNotes, midiOf, partFor, SONG_IDS } from "./music";
import { SFX_NAMES, SOUNDS, stepSound } from "./sfx";

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
    expect(seconds).toBeLessThan(2.5);
    expect(peak).toBeGreaterThan(0.03);
    expect(peak).toBeLessThan(1.6);
  });

  it("a big landing thuds lower and longer than a small one", () => {
    expect(SOUNDS.thud[2]).toBeLessThan(SOUNDS.land[2]);
    expect(SOUNDS.thud[5]).toBeGreaterThan(SOUNDS.land[5]);
  });

  it("footsteps sound like what you're walking on", () => {
    expect(stepSound("snow", "ice")).toBe("stepSnow");
    expect(stepSound("ice", "ice")).toBe("stepIce");
    expect(stepSound("gear", "clocktower")).toBe("stepMetal");
    expect(stepSound("rock", "foothills")).toBe("stepGrass");
    expect(stepSound("rock", "rooftops")).toBe("stepRoof");
    expect(stepSound("rock", "cliffs")).toBe("stepRock");
  });
});

describe("music", () => {
  it("has a part for every zone (one instrument each), the title and the credits", () => {
    for (const z of ZONES) expect(SONG_IDS).toContain(z.id);
    expect(SONG_IDS).toContain("title");
    expect(SONG_IDS).toContain("credits");
    const voices = new Set(ZONES.map((z) => partFor(z.id).voice));
    expect(voices.size).toBeGreaterThanOrEqual(8);
  });

  it.each(SONG_IDS)("%s parses: eight bars of sixteen steps, every note in range", (id) => {
    const part = partFor(id);
    expect(part.melody).toHaveLength(8);
    const notes = melodyNotes(part.melody);
    expect(notes.length).toBeGreaterThan(4);
    for (const n of notes) {
      expect(n.midi).toBeGreaterThanOrEqual(midiOf("C3"));
      expect(n.midi).toBeLessThanOrEqual(midiOf("C7"));
      expect(n.step + n.steps).toBeLessThanOrEqual(8 * 16);
    }
  });

  it("chords are built from their roots", () => {
    expect(chordNotes(["D2", "min"])).toEqual([midiOf("D2"), midiOf("F2"), midiOf("A2")]);
    expect(chordNotes(["A1", "7"])).toEqual([midiOf("A1"), midiOf("C#2"), midiOf("E2"), midiOf("G2")]);
  });
});
