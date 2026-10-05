// HELPER's tell is correct on every single line (Plan/04-dont-trust-the-game.md §14): a lie ⇔ the glance (and the
// off-key voice). In Truth Mode nothing glances, because every lie has been swapped for the truth.
import { describe, expect, it } from "vitest";
import { LINES, spoken } from "../story/lines";
import { babble, charsShown, eyesAt, glances, lineMs } from "./helper";

describe("HELPER's tell", () => {
  it("every lie glances while it's on screen, and no truth ever does", () => {
    for (const l of LINES) {
      const ms = lineMs(l.text, "normal");
      const seen = new Set<string>();
      for (let t = 0; t < ms; t += 50) seen.add(eyesAt(l.lie, t));
      expect(seen.has("glance"), `${l.id}: "${l.text}"`).toBe(l.lie);
      expect(glances(l.lie, ms).length > 0, l.id).toBe(l.lie);
    }
  });

  it("the glance comes early (you don't have to wait for it) and repeats", () => {
    expect(eyesAt(true, 0)).toBe("straight");
    expect(eyesAt(true, 500)).toBe("glance");
    expect(eyesAt(true, 1200)).toBe("straight");
    expect(glances(true, 9000).length).toBe(3);
  });

  it("lies sound off-key; the truth is in tune", () => {
    const text = "Collect the coin!";
    const lie = babble(text, true).map((n) => n.hz);
    const truth = babble(text, false).map((n) => n.hz);
    expect(lie).not.toEqual(truth);
    expect(babble(text, false).every((n) => Number.isInteger(Math.round(12 * Math.log2(n.hz / 520) * 1000) / 1000))).toBe(true);
  });

  it("every lie has an honest version for Truth Mode, and Truth Mode never glances", () => {
    for (const l of LINES) {
      if (l.lie) expect(l.honest, l.id).toBeTruthy();
      expect(spoken(l.id, { truth: true }).lie).toBe(false);
    }
  });

  it("about half of what HELPER says is a lie (the tell has to matter)", () => {
    const lies = LINES.filter((l) => l.lie).length;
    expect(lies / LINES.length).toBeGreaterThan(0.3);
    expect(lies / LINES.length).toBeLessThan(0.6);
  });

  it("text types out at the chosen speed, or all at once", () => {
    expect(charsShown("Hello there", 0, "instant")).toBe(11);
    expect(charsShown("Hello there", 100, "normal")).toBe(3);
    expect(charsShown("Hello there", 10_000, "slow")).toBe(11);
    expect(lineMs("Hi", "instant")).toBeGreaterThanOrEqual(2600);
  });
});
