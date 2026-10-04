import { describe, expect, it } from "vitest";
import { getMountain } from "../world";
import { chirpFor, LINES, QUIET_TICKS, type Cue } from "./chirp";
import { newClimb } from "./climb";

describe("Chirp's script", () => {
  it("has something for every cue, and both moods", () => {
    for (const [cue, lines] of Object.entries(LINES)) {
      expect(lines.length, cue).toBeGreaterThan(0);
      for (const line of lines) expect(line.text.length, cue).toBeLessThan(70);
    }
    const all = Object.values(LINES).flat();
    expect(all.some((l) => l.mood === "troll")).toBe(true);
    expect(all.some((l) => l.mood === "sincere")).toBe(true);
    // Small falls: about half and half.
    const falls = LINES.fall;
    expect(Math.abs(falls.filter((l) => l.mood === "troll").length - falls.filter((l) => l.mood === "sincere").length)).toBeLessThanOrEqual(1);
  });

  it("tells the truth when it matters, and the lies are trolling (it looks at you)", () => {
    const mood = (cue: Cue) => new Set(LINES[cue].map((l) => l.mood));
    expect(mood("fakeSummit")).toEqual(new Set(["troll"]));
    expect(mood("elevator")).toEqual(new Set(["troll"]));
    expect(mood("lyingSign")).toEqual(new Set(["troll"]));
    expect(mood("zone:fake-summit")).toEqual(new Set(["troll"]));
    expect(mood("summit")).toEqual(new Set(["sincere"]));
    expect(mood("warningSign")).toEqual(new Set(["sincere"]));
    expect(mood("elevatorDown")).toEqual(new Set(["sincere"]));
    expect(mood("collapsed")).toEqual(new Set(["sincere"]));
    expect(LINES.summit[0]!.text).toBe("We're… actually there.");
  });
});

describe("Chirp's timing", () => {
  const m = getMountain();

  it("waits a while between remarks, but never misses the story", () => {
    const c = newClimb(m);
    expect(chirpFor(c, "fall")).not.toBeNull();
    expect(chirpFor(c, "fall")).toBeNull();
    expect(chirpFor(c, "bigFall")).not.toBeNull();
    expect(chirpFor(c, "zone:rooftops")).not.toBeNull();
    c.sim.tick += QUIET_TICKS + 1;
    expect(chirpFor(c, "idle")).not.toBeNull();
  });

  it("takes turns through its lines", () => {
    const c = newClimb(m);
    const said = new Set<string>();
    for (let i = 0; i < LINES.fall.length; i++) {
      c.sim.tick += QUIET_TICKS + 1;
      said.add(chirpFor(c, "fall")!.text);
    }
    expect(said.size).toBeGreaterThan(LINES.fall.length / 2);
  });

  it("isn't on Mirror Mountain at all", () => {
    const c = newClimb(getMountain(true));
    expect(c.mirrored).toBe(true);
    for (const cue of ["start", "fall", "summit", "fakeSummit"] as const) expect(chirpFor(c, cue)).toBeNull();
  });
});
