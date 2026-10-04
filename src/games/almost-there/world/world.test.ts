// The mountain as designed (Plan/08-almost-there.md §5, §10): nine zones, 45 screens, and the
// fairness rules that hold everywhere, not just on the solver's route.
import { describe, expect, it } from "vitest";
import { CHARGE_MAX, COLS, JUMP, LEFT, PIP_H, RIGHT, ROWS, TILE, VIEW_H } from "../core/constants";
import { isSolidTile, rowTop, screenAt, screenOf, T, tileAt, type Mountain } from "../core/mountain";
import { createClimb, step } from "../core/sim";
import { solveLeg } from "../core/solver";
import { getMountain, PLAYABLE_SCREENS, SCREENS, ZONES } from "./index";

const m = getMountain();
const mirror = getMountain(true);

describe("the mountain", () => {
  it("is 45 screens in nine zones, as many as the plan says, bottom to top", () => {
    expect(PLAYABLE_SCREENS).toBe(45);
    const counts = ZONES.map((z) => SCREENS.filter((s) => s.zone === z.id && !s.scenery).length);
    expect(counts).toEqual([4, 5, 6, 5, 5, 2, 7, 7, 4]);
    // Each zone is one unbroken stretch of screens, above the last.
    let lastTop = -1;
    for (const z of ZONES) {
      const rows = SCREENS.filter((s) => s.zone === z.id && !s.scenery).map((s) => s.row);
      expect(Math.max(...rows) - Math.min(...rows) + 1, z.id).toBe(rows.length);
      if (z.id !== "inside") expect(Math.min(...rows), z.id).toBeGreaterThan(lastTop);
      lastTop = Math.max(...rows);
    }
  });

  it("has a start at the bottom, the fake summit's flag halfway, and the real one at the very top", () => {
    expect(screenAt(m.start.x, m.start.y).row).toBe(0);
    expect(screenAt(m.fakeFlag.x, m.fakeFlag.y + 8)).toEqual({ col: 0, row: 26 });
    expect(screenAt(m.realFlag.x, m.realFlag.y + 8)).toEqual({ col: 1, row: 39 });
    // The summit's ledge and the cave's seal are what fall.
    const codes = new Set(m.collapse.map((at) => m.tiles[at]));
    expect(codes).toEqual(new Set([T.SUMMIT, T.SEAL]));
  });

  it("hides twelve Lost Feathers, at least one in most zones", () => {
    expect(m.feathers).toHaveLength(12);
    expect(new Set(m.feathers.map((f) => f.index)).size).toBe(12);
    expect(new Set(m.feathers.map((f) => f.zone)).size).toBeGreaterThanOrEqual(7);
  });

  it("has the tricks the plan lists: lying signs, honest warnings, a joke flag, footprints, the Express", () => {
    const texts = m.signs.map((s) => s.text);
    expect(texts).toContain("Last jump!");
    expect(texts).toContain("This is the hard part.");
    expect(texts).toContain("Express to the Top!");
    expect(m.signs.filter((s) => s.warning)).toHaveLength(2);
    expect(m.jokes).toHaveLength(1);
    // The joke flag is smaller than the real ones (that's its tell).
    expect(m.jokes[0]!.h).toBeLessThan(m.fakeFlag.h);
    expect(m.footprints.length).toBeGreaterThan(3);
    expect(m.elevators).toHaveLength(1);
    expect(m.elevators[0]!.drop).toBe(2 * VIEW_H);
    expect(m.gears.length).toBeGreaterThanOrEqual(5);
    expect(m.wind.length).toBeGreaterThanOrEqual(5);
  });

  it("Mirror Mountain is the same mountain, flipped", () => {
    expect(mirror.feathers).toHaveLength(12);
    const width = m.tileCols;
    for (let ty = 0; ty < m.tileRows; ty += 3) {
      for (let tx = 0; tx < width; tx++) expect(tileAt(mirror, width - 1 - tx, ty)).toBe(tileAt(m, tx, ty));
    }
    for (let i = 0; i < m.wind.length; i++) expect(mirror.wind[i]!.push).toBe(-m.wind[i]!.push);
  });
});

/** Every run of standable ground on a screen: [tile row, first column, last column]. */
function ledges(mt: Mountain, screen: Mountain["screens"][number], collapsed: boolean) {
  const out: Array<[number, number, number]> = [];
  const tx0 = screen.col * COLS;
  const ty0 = screen.y / TILE;
  const ground = (c: number, r: number) => {
    const code = tileAt(mt, tx0 + c, ty0 + r);
    return (isSolidTile(code, collapsed) || code === T.PLANK || code === T.CLOUD) && !isSolidTile(tileAt(mt, tx0 + c, ty0 + r - 1), collapsed);
  };
  for (let r = 0; r < ROWS; r++) {
    let c = 0;
    while (c < COLS) {
      if (!ground(c, r)) {
        c++;
        continue;
      }
      let c1 = c;
      while (c1 + 1 < COLS && ground(c1 + 1, r)) c1++;
      out.push([r, c, c1]);
      c = c1 + 1;
    }
  }
  return out;
}

describe("fairness everywhere (Plan §10)", () => {
  it("every ledge has room for Pip to stand on it", () => {
    for (const mt of [m, mirror]) {
      for (const screen of mt.screens) {
        if (screen.scenery) continue;
        const insideCol = mt.mirrored ? 0 : 1;
        for (const collapsed of screen.col === insideCol ? [true] : [false, true]) {
          for (const [r, c0, c1] of ledges(mt, screen, collapsed)) {
            for (let c = c0; c <= c1; c++) {
              const tx = screen.col * COLS + c;
              const ty = screen.y / TILE + r;
              const room = !isSolidTile(tileAt(mt, tx, ty - 1), collapsed) && !isSolidTile(tileAt(mt, tx, ty - 2), collapsed);
              expect(room, `${screen.id} tile ${c},${r}`).toBe(true);
            }
          }
        }
      }
    }
  });

  it("no fall passes a whole zone: from any ledge, every jump and every step off lands within a zone of it", { timeout: 60_000 }, () => {
    for (const mt of [m, mirror]) {
      const insideCol = mt.mirrored ? 0 : 1;
      const zoneIndex = (x: number, y: number) => {
        const { col, row } = screenAt(x, y);
        const z = screenOf(mt, col, row)?.zone;
        return z ? ZONES.findIndex((zz) => zz.id === z) : -1;
      };
      for (const screen of mt.screens) {
        if (screen.scenery) continue;
        const collapsed = screen.col === insideCol;
        for (const [r, c0, c1] of ledges(mt, screen, collapsed)) {
          const tx0 = screen.col * COLS;
          for (const x of [(tx0 + c0) * TILE - 6, ((tx0 + c0 + tx0 + c1) * TILE) / 2, (tx0 + c1) * TILE + 6]) {
            const tries: Array<[number, number]> = [
              [-1, LEFT],
              [-1, RIGHT],
            ];
            for (const dir of [LEFT, 0, RIGHT]) for (const charge of [1, 12, 24, CHARGE_MAX]) tries.push([dir, charge]);
            for (const [dir, charge] of tries) {
              const s = createClimb(mt);
              s.collapsed = collapsed;
              const y = screen.y + r * TILE - PIP_H;
              Object.assign(s.pip, { x, y, grounded: true, takeoff: y + PIP_H, peak: y + PIP_H });
              if (dir === -1) for (let i = 0; i < 300 && s.pip.grounded; i++) step(mt, s, charge);
              else {
                for (let i = 0; i < charge; i++) step(mt, s, JUMP | dir);
                step(mt, s, charge < CHARGE_MAX ? dir : JUMP | dir);
              }
              for (let i = 0; i < 2500 && !(s.pip.grounded && s.pip.stun === 0); i++) step(mt, s, 0);
              const from = zoneIndex(x + 4, y + 6);
              const to = zoneIndex(s.pip.x + 4, s.pip.y + 6);
              const drop = s.pip.y - y;
              if (drop > VIEW_H) expect(from - to, `${mt.mirrored ? "mirror " : ""}${screen.id} ledge ${r}: ${dir}/${charge}`).toBeLessThan(2);
            }
          }
        }
      }
    }
  });
});

describe("the Express Elevator", () => {
  it("takes you down two screens, and you can climb back out", { timeout: 120_000 }, () => {
    const e = m.elevators[0]!;
    const s = createClimb(m);
    s.tick = 3000;
    Object.assign(s.pip, { x: e.rect.x + 8, y: e.rect.y - PIP_H, grounded: true, takeoff: e.rect.y, peak: e.rect.y });
    for (let i = 0; i < 400; i++) step(m, s, 0);
    expect(s.pip.y + PIP_H).toBe(e.rect.y + e.drop);
    expect(s.pip.grounded).toBe(true);
    // Off it, onto the bottom of the shaft.
    for (let i = 0; i < 60; i++) step(m, s, LEFT);
    for (let i = 0; i < 60; i++) step(m, s, 0);
    expect(s.pip.grounded).toBe(true);
    const { row } = screenAt(s.pip.x, s.pip.y);
    // Back onto the climb: the top half of the screen the shaft ends in.
    const leg = solveLeg(m, s, { goal: (t) => t.pip.grounded && t.pip.y + PIP_H <= rowTop(row) + VIEW_H / 2, budget: 400, floor: rowTop(row) + VIEW_H * 2 });
    expect(leg).not.toBeNull();
  });
});
