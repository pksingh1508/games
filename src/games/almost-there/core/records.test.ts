import { describe, expect, it } from "vitest";
import { getMountain } from "../world";
import { defaultAlmostThereSave } from "../save";
import { newClimb, type Climb } from "./climb";
import { VIEW_H } from "./constants";
import { CLEAN_FALLS, KILOMETRE_PX, mirrorUnlocked, recordFakeSummit, recordFall, recordFeather, recordJump, recordStart, recordSummit } from "./records";

const finished = (patch: Partial<Climb["stats"]> = {}, mirrored = false, assisted = false): Climb => {
  const c = newClimb(getMountain(mirrored));
  c.stats = { ticks: 90_000, jumps: 900, falls: 40, fallen: 30_000, biggest: 2_000, ...patch };
  c.story = "summit";
  c.assisted = assisted;
  c.splits = { foothills: 0, rooftops: 1000 };
  return c;
};

describe("the record", () => {
  it("counts every jump and every fall, across climbs", () => {
    let save = recordJump(defaultAlmostThereSave()).save;
    save = recordFall(save, 300).save;
    save = recordFall(save, 120).save;
    expect(save.totals).toMatchObject({ jumps: 1, falls: 2, fallen: 420, biggest: 300 });
  });

  it("Gravity Tourist: a kilometre of falling, all together", () => {
    let save = defaultAlmostThereSave();
    save = recordFall(save, KILOMETRE_PX - 10).save;
    expect(recordFall(save, 5).unlock).not.toContain("gravity-tourist");
    expect(recordFall(save, 10).unlock).toContain("gravity-tourist");
  });

  it("The Long Way Down: four screens in one go", () => {
    expect(recordFall(defaultAlmostThereSave(), 4 * VIEW_H - 1).unlock).not.toContain("the-long-way-down");
    expect(recordFall(defaultAlmostThereSave(), 4 * VIEW_H).unlock).toContain("the-long-way-down");
  });

  it("Lost Feathers: each is a hat (the first one goes straight on), all twelve is a trophy", () => {
    let result = recordFeather(defaultAlmostThereSave(), 5);
    expect(result.save.hat).toBe(5);
    result = recordFeather(result.save, 2);
    expect(result.save.hat).toBe(5);
    let save = result.save;
    for (let i = 0; i < 12; i++) {
      result = recordFeather(save, i);
      save = result.save;
    }
    expect(result.unlock).toContain("feather-collector");
    expect(save.feathers).toBe(0xfff);
  });

  it("Fooled Once at the fake summit (and the credits can be skipped from then on)", () => {
    const r = recordFakeSummit(defaultAlmostThereSave());
    expect(r.unlock).toEqual(["fooled-once"]);
    expect(r.save.seen.fakeSummit).toBe(true);
  });

  it("the real summit: Never Again, Clean Climb under 20 falls, Mirror Climber, best times", () => {
    const save = recordStart(defaultAlmostThereSave(), false);
    expect(mirrorUnlocked(save)).toBe(false);
    const a = recordSummit(save, finished({ falls: CLEAN_FALLS }), 1);
    expect(a.unlock).toEqual(["never-again"]);
    expect(a.newBest).toBe(true);
    expect(a.save.best.normal).toMatchObject({ ticks: 90_000, falls: CLEAN_FALLS, at: 1 });
    expect(mirrorUnlocked(a.save)).toBe(true);
    const b = recordSummit(a.save, finished({ ticks: 80_000, falls: CLEAN_FALLS - 1 }), 2);
    expect(b.unlock).toEqual(["never-again", "clean-climb"]);
    expect(b.newBest).toBe(true);
    expect(b.previous?.ticks).toBe(90_000);
    // Assisted climbs are marked, and don't set best times.
    const c = recordSummit(b.save, finished({ ticks: 1_000 }, false, true), 3);
    expect(c.newBest).toBe(false);
    expect(c.save.best.normal?.ticks).toBe(80_000);
    expect(c.save.climbs.finished).toBe(3);
    const d = recordSummit(c.save, finished({}, true), 4);
    expect(d.unlock).toContain("mirror-climber");
    expect(d.save.best.mirror?.ticks).toBe(90_000);
    expect(d.save.climbs.mirrorFinished).toBe(1);
  });
});
