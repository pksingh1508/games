import { describe, expect, it } from "vitest";
import { leadNotes, midiOf, SONG_IDS, songFor, songForLevel } from "./music";

describe("music", () => {
  it("reads note names", () => {
    expect(midiOf("A4")).toBe(69);
    expect(midiOf("C#6")).toBe(85);
    expect(midiOf("Bb4")).toBe(70);
  });

  it.each(SONG_IDS)("%s has whole bars and a bass root for each", (id) => {
    const song = songFor(id);
    const notes = leadNotes(song);
    expect(notes.length).toBeGreaterThan(20);
    expect(song.roots).toHaveLength(song.lead.length);
    expect(song.minor).toHaveLength(song.lead.length);
    expect(song.bass).toHaveLength(16);
    if (song.drums) expect(song.drums).toHaveLength(16);
    for (const n of notes) expect(n.steps).toBeGreaterThan(0);
  });

  it("plays each zone's tune, a little higher in Remix", () => {
    expect(songForLevel("2-04")).toEqual({ id: "zone2", transpose: 0 });
    expect(songForLevel("R3-01")).toEqual({ id: "zone3", transpose: 2 });
  });
});
