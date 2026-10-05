// The night's rules, and its Definition of Done (Plan/14-dont-blink.md §14): changes only while the screen is
// covered, never two on one object, the Visitor always scrapes when it moves, and every night survivable by a
// tester with the reference photos (while a guard who never switches cameras doesn't make it).
import { describe, expect, it } from "vitest";
import { Bot, playNight } from "./bot";
import { ANOMALY_BY_ID, OBJECTS, slotOf, VISITOR_PATH } from "./catalogue";
import { DANGER_TICKS, seconds, STATIC_TICKS, VIEW_W } from "./constants";
import { Game, rankFor, type GameEvent } from "./game";
import { customNight, DEFAULT_CUSTOM, endlessHour, nightConfig } from "./nights";
import { boxAt, boxCentre } from "./report";
import type { AnomalyType, NightConfig } from "./types";

const night = (n: number, seed = 1, more: Partial<{ assist: boolean; colour: boolean; config: NightConfig }> = {}) =>
  new Game({ mode: "night", night: n, config: () => more.config ?? nightConfig(n), seed, colour: more.colour ?? true, assist: more.assist ?? false });

/** Step a game, handing every tick's events to `each`. */
function run(game: Game, ticks: number, each?: (events: GameEvent[]) => void, bot?: Bot) {
  for (let i = 0; i < ticks && game.status === "play"; i++) {
    bot?.act(game);
    game.step();
    bot?.hear(game);
    each?.(game.events);
    game.events.length = 0;
  }
}

/** Force a change, as the director would (for tests of reporting). */
function force(game: Game, id: string) {
  expect(game.force(id), id).toBe(true);
  game.events.length = 0;
}

/** Where to click on an object as it's shown (where it is, or where it was). */
function clickOn(game: Game, objectId: string) {
  const o = OBJECTS.get(objectId)!;
  const s = game.states.get(objectId)!;
  const c = boxCentre(boxAt(o, s.visible ? s : o.base));
  return { x: game.mirrored() ? VIEW_W - c.x : c.x, y: c.y };
}

describe("the Definition of Done", () => {
  it("changes only ever happen while the screen is covered (except slow changes, which creep)", () => {
    let checked = 0;
    for (let n = 1; n <= 5; n++) {
      const game = night(n, 11 * n);
      run(
        game,
        seconds(6 * 75),
        (events) => {
          for (const e of events) {
            if (e.type !== "change" || e.by === "gradual") continue;
            checked++;
            expect(game.covered(), `${e.id} by ${e.by} on night ${n}`).toBe(true);
          }
        },
        new Bot(),
      );
    }
    expect(checked).toBeGreaterThan(100);
  }, 60_000);

  it("never has two changes on one object, and a fixed object is back to normal", () => {
    for (let n = 1; n <= 5; n++) {
      const game = night(n, 3 + n);
      run(
        game,
        seconds(6 * 75),
        (events) => {
          if (game.tick % 30 !== 0 && !events.some((e) => e.type === "change" || e.type === "report")) return;
          const objects = [...game.active.values()].map((a) => a.def.object).filter((o) => o !== "@view");
          expect(new Set(objects).size).toBe(objects.length);
          for (const [slot, a] of game.active) expect(slot).toBe(slotOf(a.def));
          // Everything without a change is exactly as it was in the morning.
          for (const o of OBJECTS.values()) {
            if (game.active.has(o.id)) continue;
            expect(game.states.get(o.id)).toEqual(o.base);
          }
        },
        new Bot(),
      );
    }
  }, 60_000);

  it("the Visitor always scrapes when it moves, from the room it moved to, and only moves during a blink", () => {
    let moves = 0;
    for (let n = 2; n <= 5; n++) {
      for (const seed of [1, 2, 3]) {
        // A guard who never moves: the Visitor gets to walk.
        const game = night(n, seed);
        let step = game.visitorStep;
        run(
          game,
          seconds(6 * 75),
          (events) => {
            if (game.visitorStep > step) {
              moves++;
              const scrape = events.find((e) => e.type === "scrape");
              expect(scrape).toEqual({ type: "scrape", room: VISITOR_PATH[game.visitorStep], step: game.visitorStep });
              expect(game.blink.phase).toBe("closed");
              expect(events.some((e) => e.type === "shut")).toBe(true);
            }
            step = game.visitorStep;
          },
          new Bot(undefined, true),
        );
      }
    }
    expect(moves).toBeGreaterThan(10);
  }, 60_000);

  it("the Visitor never moves while you watch its camera", () => {
    const game = night(5, 7);
    // Watch the Sculpture Hall all night: it stays on its pedestal.
    game.look("sculpture");
    run(game, seconds(6 * 75));
    expect(game.visitorMoves).toBe(0);
  });

  it("every night is survivable by a careful tester with the reference photos", () => {
    for (let n = 1; n <= 5; n++) {
      for (const seed of [1, 2, 3, 4, 5, 6]) {
        const r = playNight(night(n, seed), new Bot()).result();
        expect(r.status, `night ${n}, seed ${seed}: ${r.lost} at ${r.hours.toFixed(2)} h`).toBe("won");
        expect(r.falseReports).toBe(0);
      }
    }
  }, 60_000);

  it("…while a guard who never switches cameras doesn't last (Nights 2–5)", () => {
    for (let n = 2; n <= 5; n++) {
      for (const seed of [1, 2, 3, 4]) {
        const r = playNight(night(n, seed), new Bot(undefined, true)).result();
        expect(r.status, `night ${n}, seed ${seed}`).toBe("lost");
      }
    }
  }, 60_000);

  it("Endless gets harder until even the careful tester goes under", () => {
    const r = playNight(new Game({ mode: "endless", night: 0, config: endlessHour, seed: 9, colour: true, assist: false }), new Bot()).result();
    expect(r.status).toBe("lost");
    expect(r.hours).toBeGreaterThan(6);
    expect(r.hours).toBeLessThan(40);
  }, 60_000);

  it("Custom Night's defaults are survivable", () => {
    const r = playNight(new Game({ mode: "custom", night: 0, config: () => customNight(DEFAULT_CUSTOM), seed: 4, colour: true, assist: false }), new Bot()).result();
    expect(r.status).toBe("won");
  });
});

describe("a night", () => {
  it("is the same night every time for the same seed and the same play", () => {
    const a = playNight(night(4, 77), new Bot()).result();
    const b = playNight(night(4, 77), new Bot()).result();
    expect(a).toEqual(b);
  });

  it("runs from 00:00 to 06:00", () => {
    const game = night(1, 5, { config: { ...nightConfig(1), rate: 0 } });
    const hours: number[] = [];
    run(game, seconds(50 * 6) + 10, (events) => events.forEach((e) => e.type === "hour" && hours.push(e.hour)));
    expect(hours).toEqual([1, 2, 3, 4, 5]);
    expect(game.status).toBe("won");
    expect(game.result().hours).toBe(6);
  });

  it("Night 1 shows only three cameras (and your office); later nights all five", () => {
    expect(night(1).cameras).toEqual(["lobby", "gallery", "sculpture", "office"]);
    expect(night(2).cameras).toEqual(["lobby", "gallery", "sculpture", "storage", "corridor", "office"]);
    const game = night(1);
    expect(game.look("storage")).toBe(false);
    expect(game.look("office")).toBe(true);
  });

  it("switching cameras is a burst of static, and from Night 3 a change can hide in it", () => {
    const early = night(2, 1);
    const late = night(3, 1);
    let early_ = 0;
    let late_ = 0;
    for (const [game, count] of [
      [early, (n: number) => (early_ += n)],
      [late, (n: number) => (late_ += n)],
    ] as const) {
      const cams = game.cameras.filter((c) => c !== "office");
      let k = 0;
      run(game, seconds(300), (events) => {
        count(events.filter((e) => e.type === "change" && e.by === "static").length);
        if (game.tick % 40 === 0) game.look(cams[++k % cams.length]!);
        if (game.active.size >= 4) for (const slot of [...game.active.keys()]) game.active.delete(slot);
      });
    }
    expect(early_).toBe(0);
    expect(late_).toBeGreaterThan(0);
    const g = night(3);
    g.look("gallery");
    expect(g.static).toBe(STATIC_TICKS);
    expect(g.watching()).toBe(null);
  });

  it("a long blink (eyes held open until they give out) brings several changes at once", () => {
    const game = night(2, 8, { config: { ...nightConfig(2), visitor: 0 } });
    let longs = 0;
    let after = 0;
    run(game, seconds(40), (events) => {
      const shut = events.find((e) => e.type === "shut");
      if (shut && shut.type === "shut" && shut.long) {
        longs++;
        after = events.filter((e) => e.type === "change").length;
      }
    });
    // Hold the eyes open from the start.
    const held = night(2, 8, { config: { ...nightConfig(2), visitor: 0 } });
    held.holding = true;
    let changes = -1;
    run(held, seconds(12), (events) => {
      const shut = events.find((e) => e.type === "shut");
      if (shut && shut.type === "shut" && shut.long) changes = events.filter((e) => e.type === "change").length;
    });
    expect(longs).toBe(0);
    expect(after).toBe(0);
    expect(changes).toBeGreaterThanOrEqual(2);
  });

  it("five changes waiting start a countdown; report one in time and it stops, or they come for you", () => {
    const game = night(2, 2, { config: { ...nightConfig(2), rate: 0, visitor: 0 } });
    for (const id of ["lobby.fern.missing", "lobby.clock.missing", "lobby.founder.missing", "lobby.doors.door", "lobby.bench.moved"]) force(game, id);
    const dangers: boolean[] = [];
    run(game, 10, (events) => events.forEach((e) => e.type === "danger" && dangers.push(e.on)));
    expect(dangers).toEqual([true]);
    expect(game.danger).toBeGreaterThan(0);
    const fern = clickOn(game, "lobby.fern");
    // Wait for open eyes, then report.
    run(game, seconds(1));
    expect(game.report(fern.x, fern.y, "missing")?.ok).toBe(true);
    run(game, 2, (events) => events.forEach((e) => e.type === "danger" && dangers.push(e.on)));
    expect(dangers).toEqual([true, false]);
    // Five again, and wait it out.
    force(game, "lobby.fern.missing");
    run(game, DANGER_TICKS + 5);
    expect(game.status).toBe("lost");
    expect(game.lost).toBe("piled");
  });

  it("the Visitor reaching your office ends the night", () => {
    const game = night(5, 1);
    // Watch the storage room (not on its route) and never report.
    game.look("storage");
    run(game, seconds(6 * 75));
    expect(game.status).toBe("lost");
    expect(["visitor", "piled"]).toContain(game.lost);
    const lone = night(5, 3, { config: { ...nightConfig(5), rate: 0 } });
    lone.look("storage");
    run(lone, seconds(6 * 75));
    expect(lone.lost).toBe("visitor");
    expect(lone.visitorRoom).toBe("office");
  });

  it("slow changes (Night 4) creep in with no blink at all", () => {
    const game = night(4, 21, { config: { ...nightConfig(4), rate: 0, visitor: 0 } });
    let gradual: string | null = null;
    run(game, seconds(6 * 70), (events) => {
      for (const e of events) if (e.type === "change" && e.by === "gradual" && !gradual) gradual = e.id;
    });
    expect(gradual).not.toBeNull();
    // Watch one creep from start to finish.
    const watch = night(4, 21, { config: { ...nightConfig(4), rate: 0, visitor: 0 } });
    let id: string | null = null;
    const seen: number[] = [];
    run(watch, seconds(6 * 70), (events) => {
      for (const e of events) if (e.type === "change" && e.by === "gradual" && !id) id = e.id;
      if (id) {
        const a = ANOMALY_BY_ID.get(id)!;
        const s = watch.states.get(a.object)!;
        const base = OBJECTS.get(a.object)!.base;
        seen.push(Math.abs(s.x - base.x) + Math.abs(s.y - base.y) + Math.abs(s.tint - base.tint));
      }
    });
    expect(seen.length).toBeGreaterThan(seconds(10));
    // It moves a little at a time: never a jump.
    for (let i = 1; i < Math.min(seen.length, seconds(25)); i++) expect(Math.abs(seen[i]! - seen[i - 1]!)).toBeLessThan(6);
    expect(Math.max(...seen)).toBeGreaterThan(0.5);
  });

  it("Night 5's HUD lies for a minute: the clock runs backwards and the report labels swap", () => {
    const game = night(5, 2, { config: { ...nightConfig(5), rate: 0, visitor: 0 } });
    const lying: boolean[] = [];
    let clockAtStart = 0;
    let clockLater = 0;
    run(game, seconds(6 * 75), (events) => {
      for (const e of events) {
        if (e.type !== "lying") continue;
        lying.push(e.on);
        if (e.on) {
          clockAtStart = game.clockMinutes();
          for (const t of Object.keys(game.labels) as AnomalyType[]) expect(game.labels[t]).not.toBe(t);
        }
      }
      if (game.lying && game.tick % 600 === 0) clockLater = game.clockMinutes();
    });
    expect(lying).toEqual([true, false]);
    expect(clockLater).toBeLessThan(clockAtStart);
    for (const t of Object.keys(game.labels) as AnomalyType[]) expect(game.labels[t]).toBe(t);
    // Endless never lies (its clock is your score).
    expect(endlessHour(9).features).not.toContain("lyingHud");
  });

  it("colour changes stay out when they're switched off", () => {
    const game = night(4, 5, { colour: false });
    const ids: string[] = [];
    run(game, seconds(6 * 70), (events) => events.forEach((e) => e.type === "change" && ids.push(e.id)), new Bot());
    expect(ids.length).toBeGreaterThan(10);
    for (const id of ids) expect(ANOMALY_BY_ID.get(id)!.colour ?? false).toBe(false);
  });
});

describe("the rank", () => {
  const won = { night: 2, status: "won" as const, lost: null, reported: 20, falseReports: 0, missed: 0, reaction: 6 };
  it("Hawk Eye for fast and accurate, then Night Owl, then Sleepy; Fired if you were", () => {
    expect(rankFor(won)).toBe("hawk-eye");
    expect(rankFor({ ...won, reaction: 40 })).toBe("night-owl");
    expect(rankFor({ ...won, falseReports: 5 })).toBe("night-owl");
    expect(rankFor({ ...won, falseReports: 12 })).toBe("sleepy");
    expect(rankFor({ ...won, missed: 4 })).toBe("sleepy");
    expect(rankFor({ ...won, status: "lost", lost: "fired" })).toBe("fired");
    expect(rankFor({ ...won, status: "lost", lost: "piled" })).toBe(null);
  });
});
