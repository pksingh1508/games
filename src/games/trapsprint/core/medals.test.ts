import { describe, expect, it } from "vitest";
import { formatClock, formatTime, medalFor, medalTimes, medalTimesFor } from "./medals";
import { ALL_LEVELS } from "../levels";

describe("medals", () => {
  it("are generous multiples of the Dev time, in tenths of a second", () => {
    const times = medalTimesFor(195);
    expect(times).toEqual({ dev: 195, gold: 228, silver: 312, bronze: 438 });
    for (const t of [times.gold, times.silver, times.bronze]) expect(t % 6).toBe(0);
  });

  it("go to the best one a time earns", () => {
    const times = medalTimesFor(195);
    expect(medalFor(195, times)).toBe("dev");
    expect(medalFor(196, times)).toBe("gold");
    expect(medalFor(300, times)).toBe("silver");
    expect(medalFor(438, times)).toBe("bronze");
    expect(medalFor(439, times)).toBeNull();
  });

  it("exist for every level, and the Second-Try layout never makes them unfair", () => {
    for (const id of ALL_LEVELS) {
      const times = medalTimes(id);
      expect(times.dev).toBeLessThan(times.gold);
      expect(times.gold).toBeLessThan(times.silver);
      expect(times.silver).toBeLessThan(times.bronze);
    }
  });

  it("format times for the HUD and the results", () => {
    expect(formatClock(0)).toBe("0.00");
    expect(formatClock(499)).toBe("8.32");
    expect(formatClock(3747)).toBe("1:02.45");
    expect(formatTime(195)).toBe("3.25 s");
  });
});
