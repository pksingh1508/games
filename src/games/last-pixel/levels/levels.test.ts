import { describe, expect, it } from "vitest";
import { playClean, playHunt } from "../core/bot";
import { GIVE_UP_TICKS, GRID_H, GRID_W, HZ } from "../core/constants";
import type { LevelDef, PixDef } from "../core/level";
import { World } from "../core/world";
import { BONUS_LEVEL, FINAL_LEVEL, getLevel, LEVEL_IDS, LEVELS, nextLevelId, WORLDS } from "./index";

/** What a level asks of Pix: its traits and tricks (flee is the everyday one). */
function behaviours(level: LevelDef): Set<string> {
  const out = new Set<string>();
  const add = (def: PixDef) => {
    if (def.flee) out.add("flee");
    if (def.camo) out.add("camo");
    if (def.decoys) out.add("decoys");
    if (def.trail) out.add("trail");
    for (const t of def.tricks ?? []) out.add(t);
  };
  add(level.pix);
  for (const r of level.rounds ?? []) add(r);
  return out;
}

describe("the levels", () => {
  it("are four worlds of ten, then the finale; the tab escape (4-10) is the bonus", () => {
    expect(WORLDS.map((w) => w.levels.length)).toEqual([10, 10, 10, 10, 1]);
    expect(LEVEL_IDS).toHaveLength(41);
    expect(new Set(LEVEL_IDS).size).toBe(41);
    expect(new Set(LEVELS.map((l) => l.name)).size).toBe(41);
    expect(FINAL_LEVEL).toBe("5-01");
    expect(getLevel(BONUS_LEVEL).bonus).toBe(true);
    expect(LEVELS.filter((l) => l.bonus)).toHaveLength(1);
    expect(nextLevelId("4-09")).toBe("4-10");
    expect(nextLevelId("4-10")).toBe("5-01");
    expect(nextLevelId("5-01")).toBeNull();
  });

  it.each(LEVEL_IDS)("%s: a full canvas, and the job visibly changes it", (id) => {
    const level = getLevel(id);
    const s = level.scene();
    expect([s.w, s.h]).toEqual([GRID_W, GRID_H]);
    let job = 0;
    let changed = 0;
    for (let i = 0; i < s.w * s.h; i++) {
      if (!s.region[i]) {
        expect(s.before.data[i], "outside the job, before is after").toBe(s.after.data[i]);
        continue;
      }
      job++;
      if (s.before.data[i] !== s.after.data[i]) changed++;
    }
    expect(job).toBeGreaterThan(500);
    expect(changed / job).toBeGreaterThan(0.85);
    // Every task has a tool on the bar.
    for (const task of s.tasks) expect(level.tools.some((t) => ({ paint: ["roller", "brush"], wipe: ["sponge"], scratch: ["scratch"], mow: ["mower"], shovel: ["shovel"], wash: ["washer"], erase: ["eraser"] })[task].includes(t)), `${id}: ${task}`).toBe(true);
  });

  // Plan §14: "Every level can reach exactly 100% (tested with a script that covers every cell)."
  it.each(LEVEL_IDS)("%s: the bot cleans it up, catches Pix, and it's exactly 100%", (id) => {
    const level = getLevel(id);
    const w = new World(level);
    const clean = playClean(w);
    expect(w.phase, "the switch").toBe("wake");
    expect(clean, "within its own target").toBeLessThanOrEqual(level.target);
    playHunt(w, HZ * 120);
    expect(w.phase).toBe("done");
    expect(w.cov.covered).toBe(w.cov.total);
    expect(w.progress).toBe(1);
    // Pix gives up at a minute a round, so no hunt can last longer.
    expect(w.huntTicks).toBeLessThanOrEqual((GIVE_UP_TICKS + HZ * 5) * w.rounds);
  });

  // Plan §10 rule 7: each new behaviour comes in on its own before it's combined with others.
  it("brings each of Pix's tricks in on its own", () => {
    const seen = new Set<string>(["flee"]);
    const firsts: string[] = [];
    for (const level of LEVELS) {
      const b = behaviours(level);
      const fresh = [...b].filter((x) => !seen.has(x));
      expect(fresh.length, `${level.id} brings in ${fresh.join(", ")}`).toBeLessThanOrEqual(1);
      if (fresh.length === 1) {
        // Nothing else but running away alongside it.
        expect([...b].filter((x) => x !== fresh[0] && x !== "flee"), `${level.id}: ${fresh[0]} on its own`).toEqual([]);
        firsts.push(`${fresh[0]}@${level.id}`);
      }
      b.forEach((x) => seen.add(x));
    }
    expect(firsts).toEqual(["camo@1-05", "decoys@2-04", "burrow@2-05", "hud@3-02", "dead@3-03", "mimic@3-04", "dom@4-01", "trail@4-02", "tab@4-10"]);
  });

  it("gives the hunt tools a level at a time, and the magnifier wherever Pix camouflages", () => {
    const first = (pick: (l: LevelDef) => boolean) => LEVELS.find(pick)?.id;
    expect(first((l) => l.hunt.net > 0)).toBe("1-02");
    expect(first((l) => l.hunt.magnifier)).toBe("1-05");
    expect(first((l) => l.hunt.freeze > 0)).toBe("2-01");
    expect(first((l) => l.hunt.bait > 0)).toBe("2-03");
    for (const l of LEVELS) if (behaviours(l).has("camo")) expect(l.hunt.magnifier, l.id).toBe(true);
  });

  it("only escapes to places the play screen has, and only the bonus level goes into the tab", () => {
    for (const l of LEVELS) {
      for (const def of [l.pix, ...(l.rounds ?? [])]) for (const spot of def.spots ?? []) expect(["logo", "percent", "pause"]).toContain(spot);
      if (behaviours(l).has("tab")) expect(l.id).toBe(BONUS_LEVEL);
    }
  });

  it("ends with the finale: Pix un-paints a big part of it, gets away twice, and the last time it hides in the logo", () => {
    const f = getLevel(FINAL_LEVEL);
    expect(f.revenge).toBeGreaterThan(1000);
    expect(f.rounds).toHaveLength(2);
    expect(f.rounds!.at(-1)!.tricks!.at(-1)).toBe("dom");
    expect(f.rounds!.at(-1)!.spots).toEqual(["logo"]);
  });
});
