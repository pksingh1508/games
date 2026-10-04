import { describe, expect, it } from "vitest";
import { CLOSE_BUTTON, MIN_WARN_TICKS, seconds, TIP_R } from "../core/constants";
import { circleHitsRect } from "../core/geometry";
import { compile } from "../core/sim";
import { distanceField, fieldAt } from "../core/solver";
import { DRIVES, FINAL_LEVEL, getLevel, LEVEL_IDS, LEVELS } from "./index";

describe("the levels", () => {
  it("are four drives of ten, then The Uninstaller", () => {
    expect(DRIVES.map((d) => d.id)).toEqual(["C", "D", "E", "F"]);
    for (const d of DRIVES) expect(d.levels.filter((l) => l.drive === d.id).map((l) => l.id)).toEqual(Array.from({ length: 10 }, (_, i) => `${d.id}-${String(i + 1).padStart(2, "0")}`));
    expect(LEVEL_IDS).toHaveLength(41);
    expect(FINAL_LEVEL).toBe("X-01");
    expect(new Set(LEVELS.map((l) => l.name)).size).toBe(41);
  });

  it.each(LEVEL_IDS)("%s starts clear of everything, with a way to the [X]", (id) => {
    const course = compile(getLevel(id));
    const { start } = course.src;
    const home = course.home;
    for (const w of course.walls) expect(circleHitsRect(start.x, start.y, TIP_R + 1, w), `start touches ${JSON.stringify(w)}`).toBe(false);
    for (const w of course.walls) expect(circleHitsRect(home.x, home.y, TIP_R + 1, w), "home touches a wall").toBe(false);
    const field = distanceField(course.walls, { x: CLOSE_BUTTON.x + 3, y: CLOSE_BUTTON.y + 3, w: CLOSE_BUTTON.w - 6, h: CLOSE_BUTTON.h - 6 });
    expect(Number.isFinite(fieldAt(field, start.x, start.y))).toBe(true);
  });

  // Plan §10: every sabotage is announced at least 0.75 s before; inversions last long enough to adapt.
  it("announces every sabotage in time, and gives every inversion at least six seconds", () => {
    for (const level of LEVELS) {
      for (const t of level.sabotage ?? []) {
        expect(t.at, `${level.id}: ${t.effect.type}`).toBeGreaterThanOrEqual(MIN_WARN_TICKS);
        if (t.effect.type === "invert" || t.effect.type === "rotate") expect(t.ticks, `${level.id}: ${t.effect.type}`).toBeGreaterThanOrEqual(seconds(6));
      }
      for (const c of [...(level.checkboxes ?? []), ...(level.triggers ?? [])]) {
        if (c.effect.type === "invert" || c.effect.type === "rotate") expect(c.ticks, `${level.id}: ${c.effect.type}`).toBeGreaterThanOrEqual(seconds(6));
      }
    }
  });

  it("brings each idea in where the plan says", () => {
    const kinds = (id: string) => {
      const l = getLevel(id);
      return new Set([...(l.zones ?? []).map((z) => z.mode), ...(l.links?.length ? ["hand"] : []), ...(l.hazards ?? []).map((h) => h.kind), ...(l.sabotage ?? []).map((s) => s.effect.type), ...(l.checkboxes?.length ? ["checkbox"] : []), ...(l.panels ?? []).filter((p) => p.draggable).map(() => "grab")]);
    };
    expect(kinds("C-05").has("ibeam")).toBe(true);
    expect(kinds("C-06").has("hand")).toBe(true);
    expect(kinds("C-07").has("grab")).toBe(true);
    expect(kinds("C-08").has("busy")).toBe(true);
    expect(kinds("D-01").has("checkbox")).toBe(true);
    expect(kinds("D-02").has("invert")).toBe(true);
    expect(kinds("D-06").has("largeCursor")).toBe(true);
    expect(kinds("D-07").has("solidTrail")).toBe(true);
    expect(kinds("D-08").has("rotate")).toBe(true);
    expect(kinds("D-09").has("drift")).toBe(true);
    expect(kinds("E-03").has("chaser")).toBe(true);
    expect(kinds("E-05").has("dialog")).toBe(true);
    expect(kinds("E-06").has("robot")).toBe(true);
    expect(kinds("F-01").has("fakeCursor")).toBe(true);
    expect(kinds("F-03").has("decoys")).toBe(true);
    expect(kinds("F-05").has("scan")).toBe(true);
    expect(kinds("F-08").has("bin")).toBe(true);
    expect(getLevel("X-01").boss).toBeDefined();
  });
});
