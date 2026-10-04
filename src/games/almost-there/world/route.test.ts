// The mountain can be climbed, fairly (Plan/08-almost-there.md §10, §14: "The full climb is
// completable without assist mode, and every required jump has at least a 4 px margin").
//
// UPDATE_ROUTES=1 pnpm vitest run src/games/almost-there/world/route.test.ts
// re-solves the climb, screen by screen, on the mountain and on Mirror Mountain, and rewrites
// routes.ts (after a map or physics change). The solver only takes jumps that still land on the
// same ledge from 4 px either way and with a tick more or less of charge.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { logFromText, logLength, logToText, type InputLog } from "@/engine/replay";
import { collapseSummit, newClimb, tickClimb, type Climb } from "../core/climb";
import { climbWith } from "../core/test-mountain";
import { VIEW_H, VIEW_W } from "../core/constants";
import { rowTop, type Mountain } from "../core/mountain";
import { cloneClimb } from "../core/sim";
import { play, solveLeg } from "../core/solver";
import { getMountain } from "./index";
import { ROUTES, type Route } from "./routes";

const UPDATE = process.env.UPDATE_ROUTES === "1";

/** After the credits: the summit falls, and Pip with it, until it lands. */
function fallFromSummit(m: Mountain, c: Climb): number {
  collapseSummit(c);
  let ticks = 0;
  while (!(c.sim.pip.grounded && c.sim.pip.stun === 0) && ticks < 3000) {
    tickClimb(m, c, 0);
    ticks++;
  }
  return ticks;
}

function solveRoute(mirrored: boolean): Route {
  const m = getMountain(mirrored);
  const insideCol = mirrored ? 0 : 1;
  const c = newClimb(m);
  const legs: Route["legs"] = [];
  const up: InputLog = [];
  const down: InputLog = [];
  const legOf = (row: number, col: number, out: InputLog) => {
    const goalY = rowTop(row) + VIEW_H / 2;
    const last = row === 39;
    const fake = row === 26 && col !== insideCol;
    const leg = solveLeg(m, c.sim, {
      goal: last
        ? (_s, e) => e.some((x) => x.type === "summit")
        : fake
          ? (_s, e) => e.some((x) => x.type === "fakeSummit")
          : (s) => s.pip.grounded && Math.floor((s.pip.x + s.pip.w / 2) / VIEW_W) === col && s.pip.y + s.pip.h <= goalY,
      budget: 1500,
      floor: rowTop(row) + VIEW_H * 2.5,
    });
    if (!leg) throw new Error(`${mirrored ? "Mirror " : ""}row ${row}: no fair way up`);
    const after = cloneClimb(c.sim);
    play(m, after, leg.log);
    // Up to the flag (the climb waits there: the credits, or the end).
    const used: InputLog = [];
    let ticks = 0;
    for (const [bits, n] of leg.log) {
      let k = 0;
      while (k < n && c.story !== "credits" && c.story !== "summit") {
        tickClimb(m, c, bits);
        k++;
      }
      if (k > 0) used.push([bits, k]);
      ticks += k;
      if (k < n) break;
    }
    if (!fake && !last) expect(c.sim).toEqual(after);
    out.push(...used);
    legs.push({ row, col, ticks, jumps: leg.jumps });
  };
  for (let row = 0; row <= 26; row++) legOf(row, 1 - insideCol, up);
  expect(c.story).toBe("credits");
  const fell = fallFromSummit(m, c);
  for (let row = 22; row <= 39; row++) legOf(row, insideCol, down);
  expect(c.story).toBe("summit");
  return { up: logToText(up), fell, down: logToText(down), legs };
}

if (UPDATE) {
  const which = (process.env.ROUTE ?? "normal,mirror").split(",");
  it.each(which)("re-solves the climb (%s)", { timeout: 3_600_000 }, (name) => {
    const mirrored = name === "mirror";
    const route = solveRoute(mirrored);
    const file = join(process.cwd(), `src/games/almost-there/world/.route-${mirrored ? "mirror" : "normal"}.json`);
    writeFileSync(file, JSON.stringify(route));
  });
} else {
  describe("the climb", () => {
    it.each([
      ["the mountain", false],
      ["Mirror Mountain", true],
    ] as const)("%s can be climbed, start to real summit", (_name, mirrored) => {
      const route = ROUTES[mirrored ? "mirror" : "normal"];
      const m = getMountain(mirrored);
      const c = newClimb(m);
      const up = logFromText(route.up);
      climbWith(m, c, up);
      expect(c.story).toBe("credits");
      expect(c.sim.collapsed).toBe(false);
      collapseSummit(c);
      for (let i = 0; i < route.fell; i++) tickClimb(m, c, 0);
      expect(c.sim.pip.grounded).toBe(true);
      // The summit's fall isn't counted against you.
      const fallsBefore = c.stats.falls;
      climbWith(m, c, logFromText(route.down));
      expect(c.story).toBe("summit");
      expect(c.stats.falls).toBeGreaterThanOrEqual(fallsBefore);
      expect(logLength(up) + logLength(logFromText(route.down))).toBe(route.legs.reduce((sum, l) => sum + l.ticks, 0));
      // Every zone reached, in order.
      expect(Object.keys(c.splits)).toEqual(["foothills", "rooftops", "clocktower", "cliffs", "ice", "fake-summit", "inside", "sky", "summit"]);
    });
  });
}
