import { describe, expect, it } from "vitest";
import { getMountain } from "../world";
import { newClimb, type Climb } from "./climb";
import { PIP_H, VIEW_H } from "./constants";
import { altitudeOf, rowTop } from "./mountain";
import { altitude, formatClock, formatMetres, landmarks, shownProgress, trueProgress } from "./progress";

const m = getMountain();

/** A climb with Pip's feet at a height (world y). */
function at(feet: number, story: Climb["story"] = "climbing"): Climb {
  const c = newClimb(m);
  c.sim.pip.y = feet - PIP_H;
  c.best = Math.min(c.best, feet);
  c.story = story;
  return c;
}

describe("the lying progress bar", () => {
  const { base, fake, real } = landmarks(m);
  const fakeFeet = m.fakeFlag.y + m.fakeFlag.h;

  it("starts at nothing and says 90% at the fake summit, which is barely past halfway", () => {
    expect(shownProgress(m, newClimb(m))).toEqual({ kind: "bar", value: 0 });
    const top = shownProgress(m, at(fakeFeet));
    expect(top.kind).toBe("bar");
    expect(top.kind === "bar" && top.value).toBeCloseTo(0.9, 5);
    expect(trueProgress(m, at(fakeFeet))).toBeLessThan(0.7);
    expect(fake - base).toBeGreaterThan(200);
    expect(real).toBeGreaterThan(fake);
  });

  it("always runs ahead of the truth on the way up", () => {
    for (const row of [2, 6, 10, 15, 20, 24]) {
      const c = at(rowTop(row) + VIEW_H / 2);
      const shown = shownProgress(m, c);
      expect(shown.kind === "bar" && shown.value).toBeGreaterThan(trueProgress(m, c));
    }
  });

  it("goes down when you fall (it's height, not a high score)", () => {
    const high = shownProgress(m, at(rowTop(12)));
    const low = shownProgress(m, at(rowTop(8)));
    expect(high.kind === "bar" && low.kind === "bar" && high.value > low.value).toBe(true);
  });

  it("sticks at 99.9% after the summit falls, then breaks near the top (and stays broken)", () => {
    expect(shownProgress(m, at(rowTop(22) + 100, "fallen"))).toEqual({ kind: "stuck" });
    const near = at(rowTop(37), "fallen");
    expect(shownProgress(m, near)).toEqual({ kind: "broken" });
    near.sim.pip.y = rowTop(30);
    expect(shownProgress(m, near)).toEqual({ kind: "broken" });
    expect(shownProgress(m, at(rowTop(39), "summit"))).toEqual({ kind: "done" });
  });
});

describe("the honest altitude", () => {
  it("is the height of Pip's feet, in metres (20 px each)", () => {
    const c = newClimb(m);
    expect(altitude(c)).toBeCloseTo(altitudeOf(c.sim.pip.y + PIP_H), 5);
    expect(altitude(at(rowTop(20)))).toBeCloseTo(altitude(at(rowTop(10))) + (10 * VIEW_H) / 20, 5);
    const { base, real } = landmarks(m);
    // The whole climb is a little over 420 m.
    expect(real - base).toBeGreaterThan(400);
    expect(real - base).toBeLessThan(440);
  });
});

describe("formatting", () => {
  it("clocks and metres", () => {
    expect(formatClock(0)).toBe("0:00.0");
    expect(formatClock(61.5 * 60)).toBe("1:01.5");
    expect(formatClock((3600 + 2 * 60 + 3) * 60)).toBe("1:02:03.0");
    expect(formatClock(59.99 * 60, false)).toBe("0:59");
    expect(formatMetres(3812.4)).toBe("3,812 m");
  });
});
