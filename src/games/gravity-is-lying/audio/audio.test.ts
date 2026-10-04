import { beforeAll, describe, expect, it, vi } from "vitest";
import { chordNotes, invert, melodyNotes, midiOf, SONG_IDS, songFor, songForWorld } from "./music";
import { babblePlan, SFX_NAMES, SOUNDS } from "./sfx";

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

  it("a timed turn sounds bigger and lower than your own flip", () => {
    expect(SOUNDS.turn[2]).toBeLessThan(SOUNDS.whoomp[2]);
    expect(SOUNDS.turn[0]).toBeGreaterThanOrEqual(SOUNDS.whoomp[0]);
  });

  it("Isaac babbles a syllable or so a word (a lie a little lower)", () => {
    const honest = babblePlan("Welcome to the Lab, little one", false);
    const lie = babblePlan("Welcome to the Lab, little one", true);
    expect(honest.length).toBeGreaterThanOrEqual(2);
    expect(honest.length).toBeLessThanOrEqual(9);
    expect(lie.map((s) => s.name)).toEqual(honest.map((s) => s.name));
    lie.forEach((s, i) => expect(s.rate).toBeLessThan(honest[i]!.rate));
    expect(honest.map((s) => s.at)).toEqual([...honest.map((s) => s.at)].sort((a, b) => a - b));
  });
});

describe("music", () => {
  it("reads note names", () => {
    expect(midiOf("A4")).toBe(69);
    expect(midiOf("C#6")).toBe(85);
    expect(midiOf("Bb4")).toBe(70);
    expect(chordNotes(["C3", "maj7"])).toEqual([48, 52, 55, 59]);
  });

  it.each(SONG_IDS)("%s has whole bars, a chord for each, and a floaty tempo", (id) => {
    const song = songFor(id);
    expect(melodyNotes(song).length).toBeGreaterThan(12);
    expect(song.chords).toHaveLength(song.melody.length);
    expect(song.bpm).toBeLessThanOrEqual(100);
  });

  it.each(SONG_IDS)("%s turns upside down in its own key, and back again", (id) => {
    const song = songFor(id);
    const steps = song.scale === "major" ? [0, 2, 4, 5, 7, 9, 11] : [0, 2, 3, 5, 7, 8, 10];
    const inKey = (m: number) => steps.includes((((m - song.key) % 12) + 12) % 12);
    for (const note of melodyNotes(song)) {
      if (!inKey(note.midi)) continue;
      const flipped = invert(song, note.midi);
      expect(inKey(flipped)).toBe(true);
      // High becomes low: notes above the pivot go below it, by about as much.
      expect(Math.sign(flipped - song.pivot)).toBe(-Math.sign(note.midi - song.pivot) || 0);
      expect(invert(song, flipped)).toBe(note.midi);
    }
  });

  it("every world has its own tune", () => {
    const songs = [1, 2, 3, 4, 5, 6].map(songForWorld);
    expect(new Set(songs).size).toBe(6);
  });
});
