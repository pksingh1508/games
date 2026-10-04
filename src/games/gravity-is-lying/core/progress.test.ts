import { describe, expect, it } from "vitest";
import { ROOM_IDS, WORLDS } from "../rooms";
import { defaultGravitySave, type GravitySave } from "../save";
import { appleCount, CEILING_GOAL, formatTime, isCleared, isUnlocked, recordCeiling, recordClear, recordDeath, worldStats, type Clear } from "./progress";

const clear = (save: GravitySave, roomId: string, change: Partial<Clear> = {}) =>
  recordClear(save, { roomId, ticks: 600, deaths: 0, apples: 0b111, assisted: false, rotated: true, ...change });

describe("progress", () => {
  it("counts deaths, per room and in all", () => {
    let save = defaultGravitySave();
    save = recordDeath(save, "1-02").save;
    save = recordDeath(save, "1-02").save;
    expect(save.deaths).toBe(2);
    expect(save.rooms["1-02"]!.deaths).toBe(2);
  });

  it("keeps the best time and every golden apple ever brought through", () => {
    let result = clear(defaultGravitySave(), "1-01", { ticks: 900, apples: 0b001 });
    expect(result.firstClear).toBe(true);
    expect(result.newBest).toBe(true);
    expect(result.freshApples).toBe(0b001);
    result = clear(result.save, "1-01", { ticks: 1200, apples: 0b110 });
    expect(result.newBest).toBe(false);
    expect(result.freshApples).toBe(0b110);
    expect(result.save.rooms["1-01"]).toMatchObject({ clears: 2, best: 900, apples: 0b111 });
    expect(result.save.last).toBe("1-01");
    expect(appleCount(result.save, ["1-01"])).toBe(3);
  });

  it("with assist on: the room opens the next one, but no apples or best time", () => {
    const result = clear(defaultGravitySave(), "1-01", { assisted: true, ticks: 100 });
    expect(result.counted).toBe(0);
    expect(result.save.rooms["1-01"]).toMatchObject({ clears: 1, best: null, apples: 0, assisted: true, clean: false });
    expect(isUnlocked(result.save, "1-02")).toBe(true);
    // A later clear without assist drops the mark.
    expect(clear(result.save, "1-01").save.rooms["1-01"]!.assisted).toBe(false);
  });

  it("rooms open one after another, across the worlds", () => {
    let save = defaultGravitySave();
    expect(isUnlocked(save, "1-01")).toBe(true);
    expect(isUnlocked(save, "1-02")).toBe(false);
    for (const id of WORLDS[0]!.rooms) save = clear(save, id).save;
    expect(isUnlocked(save, "2-01")).toBe(true);
    expect(isUnlocked(save, "2-02")).toBe(false);
    expect(isCleared(save, "1-08")).toBe(true);
    expect(isUnlocked(save, "nope")).toBe(false);
  });

  it("Never Trusted the Arrow: every Liar's Gallery room cleared without dying", () => {
    let save = defaultGravitySave();
    const w3 = WORLDS.find((w) => w.id === 3)!.rooms;
    for (const [i, id] of w3.entries()) {
      const result = clear(save, id, { deaths: i === 0 ? 2 : 0 });
      save = result.save;
      expect(result.unlock).not.toContain("never-trusted-the-arrow");
    }
    expect(clear(save, w3[0]!).unlock).toContain("never-trusted-the-arrow");
  });

  it("Ground Control: every Tilted Town room cleared with the camera turning", () => {
    let save = defaultGravitySave();
    const w4 = WORLDS.find((w) => w.id === 4)!.rooms;
    for (const id of w4) save = clear(save, id, { rotated: id !== "4-05" }).save;
    expect(clear(save, "4-01").unlock).not.toContain("ground-control");
    expect(clear(save, "4-05").unlock).toContain("ground-control");
  });

  it("Apple Picker with every golden apple; Fell Up at the top of the tree (and Truth Mode opens)", () => {
    let save = defaultGravitySave();
    for (const id of ROOM_IDS.slice(0, -1)) save = clear(save, id).save;
    expect(save.finished).toBe(false);
    const last = clear(save, ROOM_IDS.at(-1)!);
    expect(last.unlock).toEqual(expect.arrayContaining(["apple-picker", "fell-up"]));
    expect(last.save.finished).toBe(true);
  });

  it("Upside Downer after ten minutes on ceilings", () => {
    const save = { ...defaultGravitySave(), ceilingTicks: CEILING_GOAL - 10 };
    expect(recordCeiling(save, 5).unlock).toEqual([]);
    expect(recordCeiling(save, 10).unlock).toEqual(["upside-downer"]);
    expect(recordCeiling(save, 0).save).toBe(save);
  });

  it("world totals", () => {
    let save = defaultGravitySave();
    save = recordDeath(save, "2-01").save;
    save = clear(save, "2-01", { apples: 0b011, ticks: 300 }).save;
    expect(worldStats(save, 2)).toEqual({ rooms: 8, cleared: 1, deaths: 1, apples: 2, best: null });
  });

  it("formats times", () => {
    expect(formatTime(0)).toBe("0.0");
    expect(formatTime(90)).toBe("1.5");
    expect(formatTime(60 * 75 + 30)).toBe("1:15.5");
  });
});
