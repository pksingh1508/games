import { beforeAll, describe, expect, it, vi } from "vitest";
import { chordNotes, melodyNotes, midiOf, SONG_IDS, songFor, songForRoom } from "./music";
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
    expect(seconds).toBeGreaterThan(0.02);
    expect(seconds).toBeLessThan(1.2);
    expect(peak).toBeGreaterThan(0.05);
    expect(peak).toBeLessThan(1.6);
  });

  it("the pebble's three answers sound different", () => {
    expect(new Set([SOUNDS.tok[2], SOUNDS.tink[2], SOUNDS.fwip[2]]).size).toBe(3);
    // "Tok" is the loudest; the faint "fwip" is the quietest.
    expect(SOUNDS.tok[0]).toBeGreaterThan(SOUNDS.tink[0]);
    expect(SOUNDS.fwip[0]).toBeLessThan(SOUNDS.tink[0]);
  });

  it("every world's floors have their own footsteps; rock sounds like rock", () => {
    const steps = ([1, 2, 3, 4, 5, 6] as const).map((look) => stepSound(look, "floor"));
    expect(new Set(steps).size).toBe(6);
    expect(stepSound(3, "rock")).toBe("stepRock");
  });
});

describe("music", () => {
  it("reads note names", () => {
    expect(midiOf("A4")).toBe(69);
    expect(midiOf("C#6")).toBe(85);
    expect(midiOf("Bb1")).toBe(34);
    expect(chordNotes(["C3", "maj7"])).toEqual([48, 52, 55, 59]);
  });

  it.each(SONG_IDS)("%s has whole bars and a chord for each, and stays calm", (id) => {
    const song = songFor(id);
    const notes = melodyNotes(song);
    expect(notes.length).toBeGreaterThan(16);
    expect(song.chords).toHaveLength(song.melody.length);
    expect(song.bpm).toBeLessThanOrEqual(100);
  });

  it("each world has its own tune, The Floor too", () => {
    expect(songForRoom("1-04")).toBe("world1");
    expect(songForRoom("5-10")).toBe("world5");
    expect(songForRoom("6-01")).toBe("floor");
  });
});
