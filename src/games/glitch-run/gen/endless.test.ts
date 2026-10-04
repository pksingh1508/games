import { describe, expect, it } from "vitest";
import { BEAT_TILES, JUMP, SLIDE } from "../core/constants";
import { createRun, step } from "../core/run";
import { BIT, PATCH } from "../core/track";
import { EndlessTrack } from "./endless";
import { dailyFor, difficultyAt, ENDLESS_TEMPO } from "./generator";

/** Feed a run of endless track for `beats` beats (the player's moves don't change the track). */
function endless(seed: number, beats: number, bits: (tick: number) => number = () => 0) {
  const track = new EndlessTrack(seed);
  const run = createRun(track.config());
  while (run.beat < beats) {
    // Immortal for the test: the track is built ahead of the runner whatever happens to it.
    run.status = "run";
    step(run, bits(run.tick));
  }
  return { track, run };
}

/** The track's shape (pickups left out: they go when they're picked up). */
const cellsOf = (t: EndlessTrack, cols: number) =>
  Array.from({ length: cols }, (_, c) => Array.from({ length: 17 }, (_, r) => t.track.cell(c, r)).map((v) => (v === BIT || v === PATCH ? 0 : v)).join("")).join("|");

describe("endless mode", () => {
  it("the same seed always makes the same run: track and cues (Plan §14)", () => {
    const a = endless(2026, 120);
    const b = endless(2026, 120, (t) => (t % 37 < 6 ? JUMP : 0) | (t % 53 > 45 ? SLIDE : 0));
    const cols = 120 * BEAT_TILES;
    expect(cellsOf(a.track, cols)).toBe(cellsOf(b.track, cols));
    const upTo = (t: EndlessTrack) => t.cues.filter((c) => c.tick < 100 * 30).map((c) => `${c.tick}:${c.move}`);
    expect(upTo(a.track)).toEqual(upTo(b.track));
    expect(cellsOf(endless(2027, 60).track, 60 * BEAT_TILES)).not.toBe(cellsOf(a.track, 60 * BEAT_TILES));
  });

  it.each([1, 7, 42, 1234, 99_999])("seed %i: every chunk it lays has a way through, for five minutes", (seed) => {
    // Feeding throws if no chunk fits; the reference run proves each one can be passed.
    const { track } = endless(seed, 600);
    expect(track.track.cols).toBeGreaterThan(600 * BEAT_TILES);
    expect(track.cues.length).toBeGreaterThan(150);
  }, 120_000);

  it("speeds up and gets harder as you go", () => {
    for (let i = 1; i < ENDLESS_TEMPO.length; i++) expect(ENDLESS_TEMPO[i]!.ticks).toBeLessThan(ENDLESS_TEMPO[i - 1]!.ticks);
    // 120 bpm to start, never faster than the story's fastest stage.
    expect(ENDLESS_TEMPO[0]!.ticks).toBe(30);
    expect(ENDLESS_TEMPO.at(-1)!.ticks).toBeGreaterThanOrEqual(22);
    expect(difficultyAt(0)).toBe(1);
    expect(difficultyAt(10_000)).toBe(5);
  });

  it("Daily Corruption: one seed per UTC day, the same for everyone", () => {
    const morning = dailyFor(new Date("2026-10-04T00:30:00Z"));
    const night = dailyFor(new Date("2026-10-04T23:59:00Z"));
    expect(morning).toEqual(night);
    expect(morning.key).toBe("2026-10-04");
    expect(dailyFor(new Date("2026-10-01T12:00:00Z")).number).toBe(1);
    expect(morning.number).toBe(4);
    expect(dailyFor(new Date("2026-10-05T00:00:00Z")).seed).not.toBe(morning.seed);
  });
});
