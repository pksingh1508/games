// Reporting (Plan/14-dont-blink.md §3 "Reporting", §10 rules 6–7): click the thing that changed (or where it
// was), pick the type. Right: it snaps back. Wrong: credibility. Flexible where it's genuinely ambiguous.
import { describe, expect, it } from "vitest";
import { ANOMALY_BY_ID, OBJECTS } from "./catalogue";
import { seconds, VIEW_W } from "./constants";
import { Game } from "./game";
import { nightConfig } from "./nights";
import { accepts, boxAt, boxCentre, objectsAt, visitorBox } from "./report";
import type { NightConfig } from "./types";

const quiet = (n: number, more: Partial<NightConfig> = {}, assist = false) =>
  new Game({ mode: "night", night: n, config: () => ({ ...nightConfig(n), rate: 0, visitor: 0, ...more }), seed: 1, colour: true, assist });

function force(game: Game, id: string) {
  expect(game.force(id), id).toBe(true);
  game.events.length = 0;
}

const centre = (game: Game, objectId: string, where: "now" | "was" = "now") => {
  const o = OBJECTS.get(objectId)!;
  return boxCentre(boxAt(o, where === "now" ? game.states.get(objectId)! : o.base));
};

describe("reporting a change", () => {
  it("the right object and type: accepted, and it snaps back", () => {
    const game = quiet(1);
    force(game, "lobby.doors.door");
    expect(game.states.get("lobby.doors")!.variant).toBe("open");
    const c = centre(game, "lobby.doors");
    const v = game.report(c.x, c.y, "door")!;
    expect(v).toMatchObject({ ok: true, name: "the front doors", penalty: false });
    expect(game.active.size).toBe(0);
    expect(game.states.get("lobby.doors")).toEqual(OBJECTS.get("lobby.doors")!.base);
    expect(game.fix).toBeGreaterThan(0);
  });

  it("the right object, the wrong type: a false report", () => {
    const game = quiet(1);
    force(game, "lobby.doors.door");
    const c = centre(game, "lobby.doors");
    expect(game.report(c.x, c.y, "missing")).toMatchObject({ ok: false, reason: "wrong-type", penalty: true });
    expect(game.active.size).toBe(1);
    expect(game.falseThisHour).toBe(1);
  });

  it("nothing wrong there: a false report", () => {
    const game = quiet(1);
    const c = centre(game, "lobby.clock");
    expect(game.report(c.x, c.y, "changed")).toMatchObject({ ok: false, reason: "nothing", name: null, penalty: true });
  });

  it("a missing thing is reported where it used to be (a ghost box), as Missing, or Moved (it could be out of sight)", () => {
    for (const type of ["missing", "moved"] as const) {
      const game = quiet(1);
      force(game, "lobby.fern.missing");
      const c = centre(game, "lobby.fern", "was");
      expect(game.report(c.x, c.y, type)?.ok).toBe(true);
    }
  });

  it("a moved thing can be clicked where it is now, or where it was", () => {
    for (const where of ["now", "was"] as const) {
      const game = quiet(1);
      force(game, "lobby.bench.moved");
      const c = centre(game, "lobby.bench", where);
      expect(game.report(c.x, c.y, "moved")?.ok, where).toBe(true);
    }
  });

  it("ambiguous cases accept either type: a light is a change; a count is something missing; a figure is extra", () => {
    expect(accepts(ANOMALY_BY_ID.get("lobby.chandelier.light")!, "changed")).toBe(true);
    expect(accepts(ANOMALY_BY_ID.get("storage.books.count")!, "missing")).toBe(true);
    expect(accepts(ANOMALY_BY_ID.get("lobby.figure.intruder")!, "extra")).toBe(true);
    expect(accepts(ANOMALY_BY_ID.get("lobby.chandelier.light")!, "missing")).toBe(false);
  });

  it("things that only turn up as changes can't be found by clicking around (no ghost box)", () => {
    const game = quiet(1);
    const box = boxAt(OBJECTS.get("lobby.donations")!, OBJECTS.get("lobby.donations")!.base);
    const c = boxCentre(box);
    expect(objectsAt("lobby", c.x, c.y, game.states).map((o) => o.id)).not.toContain("lobby.donations");
    // Once it's there, it is.
    const night3 = quiet(3);
    force(night3, "lobby.donations.extra");
    expect(objectsAt("lobby", c.x, c.y, night3.states).map((o) => o.id)).toContain("lobby.donations");
    expect(night3.report(c.x, c.y, "extra")?.ok).toBe(true);
  });

  it("a mirrored camera: report Mirror anywhere, and clicks are read the right way round", () => {
    const game = quiet(5);
    force(game, "lobby.view.mirror");
    expect(game.mirrored("lobby")).toBe(true);
    // Something off-centre: the fern, on the right (so it shows on the left).
    force(game, "lobby.fern.missing");
    const was = centre(game, "lobby.fern", "was");
    // On screen, the fern's spot is on the other side.
    expect(game.report(VIEW_W - was.x, was.y, "missing")?.ok).toBe(true);
    expect(game.report(100, 100, "mirror")).toMatchObject({ ok: true, name: "the picture" });
    expect(game.mirrored("lobby")).toBe(false);
    expect(game.report(100, 100, "mirror")).toMatchObject({ ok: false, penalty: true });
  });

  it("the Visitor, out of place: report it as an Intruder (or Extra) and it goes home", () => {
    const game = quiet(2, { visitor: 1 });
    game.visitorStep = 2;
    expect(game.visitorRoom).toBe("lobby");
    const c = boxCentre(visitorBox("lobby")!);
    expect(game.report(c.x, c.y, "intruder")).toMatchObject({ ok: true, visitor: true, name: "the statue" });
    expect(game.visitorStep).toBe(0);
    expect(game.stats.visitorHome).toBe(1);
    // At home on its pedestal, it isn't an intruder.
    game.look("sculpture");
    const home = boxCentre(visitorBox("sculpture")!);
    expect(game.report(home.x, home.y, "intruder")).toMatchObject({ ok: false, penalty: true });
  });

  it("the empty pedestal is a hint, not a false report", () => {
    const game = quiet(2, { visitor: 1 });
    game.look("sculpture");
    game.visitorStep = 1;
    const c = boxCentre(visitorBox("sculpture")!);
    expect(game.report(c.x, c.y, "missing")).toMatchObject({ ok: false, reason: "visitor-away", penalty: false });
    expect(game.falseThisHour).toBe(0);
  });
});

describe("credibility", () => {
  it("a warning at the first threshold in an hour, fired at the second; it resets each hour", () => {
    const game = quiet(2);
    const [warn, fired] = game.config.credibility;
    const c = centre(game, "lobby.clock");
    for (let i = 0; i < warn - 1; i++) game.report(c.x, c.y, "changed");
    expect(game.events.filter((e) => e.type === "warned")).toHaveLength(0);
    game.report(c.x, c.y, "changed");
    expect(game.events.filter((e) => e.type === "warned")).toHaveLength(1);
    // A new hour wipes the slate.
    for (let t = 0; t < seconds(game.config.hour) + 1; t++) game.step();
    expect(game.falseThisHour).toBe(0);
    for (let i = 0; i < fired; i++) game.report(c.x, c.y, "changed");
    expect(game.status).toBe("lost");
    expect(game.lost).toBe("fired");
    expect(game.result().rank).toBe("fired");
  });

  it("Night 1 is gentler", () => {
    expect(nightConfig(1).credibility[0]).toBeGreaterThan(nightConfig(5).credibility[0]);
    expect(nightConfig(1).credibility[1]).toBeGreaterThan(nightConfig(5).credibility[1]);
  });

  it("assist mode: no penalty (but it's still counted)", () => {
    const game = quiet(2, {}, true);
    const c = centre(game, "lobby.clock");
    for (let i = 0; i < 10; i++) expect(game.report(c.x, c.y, "changed")?.penalty).toBe(false);
    expect(game.status).toBe("play");
    expect(game.stats.falseReports).toBe(10);
  });
});

describe("reference photos", () => {
  it("a limited number a night (unlimited in assist mode); one up at a time, for a few seconds", () => {
    const game = quiet(2);
    const n = game.photos;
    expect(game.usePhoto()).toBe(true);
    expect(game.usePhoto()).toBe(false);
    for (let t = 0; t < seconds(9); t++) game.step();
    expect(game.photoLeft).toBe(0);
    for (let i = 1; i < n; i++) {
      expect(game.usePhoto()).toBe(true);
      game.closePhoto();
    }
    expect(game.usePhoto()).toBe(false);
    const assisted = quiet(2, {}, true);
    for (let i = 0; i < 20; i++) {
      expect(assisted.usePhoto()).toBe(true);
      assisted.closePhoto();
    }
  });
});
