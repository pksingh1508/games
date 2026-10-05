// The three chapters (Plan/03-99-seconds.md §4–§5, §10, §14): every golden path escapes in one loop with room to
// breathe, every trick works the way the catalogue says, both endings are reachable, and nobody stays stuck forever.
import { describe, expect, it } from "vitest";
import { Loop } from "../core/loop";
import { readHints } from "../core/reader";
import { play, type Step } from "../core/script";
import { CHAPTERS, type ChapterId } from "../core/types";
import { CHAPTER_DEFS } from ".";
import { PERCHES } from "./clock-room";
import { wallClockShows } from "./kitchen";
import { goldenPath } from "./solutions";

const loop = (id: ChapterId, seconds = 99) => new Loop(CHAPTER_DEFS[id], { seconds, known: new Set() });

/** Run until the loop's over (or `until` holds), in small ticks. */
function runUntil(l: Loop, until: () => boolean = () => false) {
  while (l.status !== "over" && !until()) {
    l.tick(16);
    l.events.length = 0;
  }
}

describe("every chapter", () => {
  for (const id of CHAPTERS) {
    it(`${id}: the golden path escapes in a single loop, with at least 24 seconds to spare`, () => {
      for (const seconds of [99, 150]) {
        const r = play(loop(id, seconds), goldenPath(id));
        expect(r.failed, `${id} (${seconds} s loops): step ${r.failed}`).toBeNull();
        expect(r.result).not.toBe("reset");
        expect(r.result).not.toBeNull();
        // Rule 1: the doing takes 75 seconds or less (Chapters 1 and 3 end at zero by design: the rest is waiting).
        expect(r.activeMs).toBeLessThanOrEqual(75_000);
        if (id === "kitchen") expect(r.leftAtEnd).toBeGreaterThanOrEqual(24);
      }
    });
  }

  it("nobody stays stuck forever: a player who works nothing out still gets out, by the room's scratches alone", () => {
    const loops: Record<string, number> = {};
    for (const id of CHAPTERS) {
      const r = readHints(id);
      expect(r.result, id).not.toBeNull();
      loops[id] = r.loops;
    }
    // The plan's promise for Chapter 1: nobody needs more than 30 loops.
    expect(loops["waiting-room"]).toBeLessThanOrEqual(30);
    expect(loops.kitchen).toBeLessThanOrEqual(40);
    expect(loops["clock-room"]).toBeLessThanOrEqual(40);
  });
});

describe("Chapter 1: The Waiting Room", () => {
  it("the clock only says 07 at 42 seconds left, and only if you're looking at it", () => {
    for (const [view, sees] of [
      ["north", true],
      ["closeup:clock", true],
      ["east", false],
      ["west", false],
    ] as const) {
      const l = loop("waiting-room");
      l.look(view);
      runUntil(l, () => l.left < 41);
      expect(l.known.has("clock07"), view).toBe(sees);
    }
  });

  it("42 is behind the photo (the coat's coin turns its two screws, six seconds each)", () => {
    const l = loop("waiting-room");
    const r = play(l, [{ look: "south" }, { tap: "coat" }, { look: "west" }, { tap: "photo" }, { tap: "screw1", use: "coin" }, { tap: "screw2", use: "coin" }, { tap: "frame" }, { tap: "behind" }], undefined, { toTheEnd: false });
    expect(r.failed).toBeNull();
    expect(l.known.has("note42")).toBe(true);
    expect(l.left).toBeGreaterThan(70);
  });

  it("a wrong code buzzes; 0742 opens the door; through it is the same room, mirrored", () => {
    const l = loop("waiting-room");
    play(l, [{ tap: "keypad" }, { code: "1234" }], undefined, { toTheEnd: false });
    expect(l.flags.has("n.door")).toBe(false);
    play(l, [{ code: "0742" }], undefined, { toTheEnd: false });
    expect(l.flags.has("n.door")).toBe(true);
    expect(l.view).toBe("north");
    play(l, [{ tap: "doorway" }], undefined, { toTheEnd: false });
    expect(l.room).toBe("mirror");
    expect(l.mirrored).toBe(true);
    expect(l.view).toBe("south");
    // In the mirror, the west wall's things (the photo) are on your east.
    l.look("east");
    expect(l.place).toBe("west");
    expect(l.hotspots().map((h) => h.id)).toContain("photo");
    // There's a lever where the keypad was. Through its door: the room the right way round again.
    l.look("north");
    expect(l.hotspots().map((h) => h.id)).toContain("lever");
    play(l, [{ tap: "lever" }, { tap: "doorway" }, { tap: "through" }], undefined, { toTheEnd: false });
    expect(l.room).toBe("normal");
  });

  it("the lever holds the door open ten seconds, slams it (shoving you out of the doorway), and needs thirty to wind back", () => {
    const l = loop("waiting-room");
    play(l, [{ tap: "keypad" }, { code: "0742" }, { tap: "doorway" }, { look: "north" }, { tap: "lever" }, { tap: "doorway" }], undefined, { toTheEnd: false });
    expect(l.view).toBe("closeup:doorway");
    const opened = l.elapsed;
    runUntil(l, () => !l.flags.has("m.door"));
    expect(l.elapsed - opened).toBeGreaterThanOrEqual(9_000);
    expect(l.elapsed - opened).toBeLessThanOrEqual(10_100);
    expect(l.view).toBe("north");
    expect(l.flags.has("m.charging")).toBe(true);
    expect(l.interact("lever")).toBe("acted");
    expect(l.flags.has("m.door")).toBe(false);
    runUntil(l, () => !l.flags.has("m.charging"));
    expect(l.elapsed - opened).toBeGreaterThanOrEqual(39_000);
    l.interact("lever");
    expect(l.flags.has("m.door")).toBe(true);
  });

  it("LEAVE AT ZERO: standing in that doorway as the clock hits zero gets you out; anything else resets", () => {
    const stand: Step[] = [{ tap: "keypad" }, { code: "0742" }, { tap: "doorway" }, { look: "north" }, { waitLeft: 8 }, { tap: "lever" }, { tap: "doorway" }];
    expect(play(loop("waiting-room"), stand).result).toBe("next");
    // Too early: the door slams before zero.
    expect(play(loop("waiting-room"), [{ tap: "keypad" }, { code: "0742" }, { tap: "doorway" }, { look: "north" }, { waitLeft: 20 }, { tap: "lever" }, { tap: "doorway" }]).result).toBe("reset");
    // Through the door instead: back in the room, and the loop resets.
    expect(play(loop("waiting-room"), [...stand, { tap: "through" }]).result).toBe("reset");
    // The first door, open, isn't a way out.
    expect(play(loop("waiting-room"), [{ tap: "keypad" }, { code: "0742" }]).result).toBe("reset");
    // Behind the mirrored photo: the note.
    const l = loop("waiting-room");
    play(l, [{ tap: "keypad" }, { code: "0742" }, { tap: "doorway" }, { tap: "coat" }, { look: "west" }, { tap: "photo" }, { tap: "screw1", use: "coin" }, { tap: "screw2", use: "coin" }, { tap: "frame" }, { tap: "behind" }], undefined, { toTheEnd: false });
    expect(l.known.has("zero")).toBe(true);
  });

  it("the phone rings at 77 for six seconds, and the voice is yours", () => {
    const l = loop("waiting-room");
    l.look("west");
    runUntil(l, () => l.flags.has("phone"));
    expect(l.display).toBe(77);
    l.interact("phone");
    expect(l.known.has("phone")).toBe(true);
    const late = loop("waiting-room");
    late.look("west");
    runUntil(late, () => late.left < 70.9);
    expect(late.flags.has("phone")).toBe(false);
  });
});

describe("Chapter 2: The Kitchen", () => {
  const setUp: Step[] = [{ tap: "stove" }, { tap: "pot" }, { look: "west" }, { tap: "sink", use: "pot" }, { tap: "cupboard" }, { tap: "mitt" }, { look: "north" }, { tap: "stove", use: "water" }, { tap: "stove" }, { tap: "knob" }];

  it("a watched pot never boils (watch it all loop: nothing), and only unwatched seconds count", () => {
    const watched = loop("kitchen");
    play(watched, setUp, undefined, { toTheEnd: false });
    expect(watched.view).toBe("closeup:stove");
    runUntil(watched);
    expect(watched.known.has("boil")).toBe(false);
    expect(watched.known.has("frozen")).toBe(true);
    // Look away: it boils 50 seconds later.
    const away = loop("kitchen");
    play(away, setUp, undefined, { toTheEnd: false });
    away.look("south");
    const from = away.elapsed;
    runUntil(away, () => away.flags.has("pot.boiling"));
    expect(away.elapsed - from).toBeGreaterThanOrEqual(49_900);
    expect(away.elapsed - from).toBeLessThanOrEqual(50_100);
    // Glancing back pauses it.
    const glance = loop("kitchen");
    play(glance, setUp, undefined, { toTheEnd: false });
    glance.look("south");
    glance.tick(20_000);
    glance.look("north");
    glance.tick(10_000);
    glance.look("south");
    const back = glance.elapsed;
    runUntil(glance, () => glance.flags.has("pot.boiling"));
    expect(glance.elapsed - back).toBeGreaterThanOrEqual(29_900);
  });

  it("the oven frees the key in 30 seconds with its door shut; the key and the boiling pot need the mitt", () => {
    const l = loop("kitchen");
    play(l, [{ look: "east" }, { tap: "freezer" }, { tap: "ice" }, { look: "north" }, { tap: "oven" }, { tap: "ovendoor" }, { tap: "tray", use: "ice" }, { tap: "dial" }], undefined, { toTheEnd: false });
    l.tick(40_000);
    expect(l.flags.has("key.inOven")).toBe(false);
    play(l, [{ tap: "ovenshut" }], undefined, { toTheEnd: false });
    const shut = l.elapsed;
    runUntil(l, () => l.flags.has("key.inOven"));
    // (The click itself took 0.4 s of the thirty.)
    expect(l.elapsed - shut + 400).toBeGreaterThanOrEqual(29_900);
    expect(l.elapsed - shut + 400).toBeLessThanOrEqual(30_100);
    play(l, [{ tap: "ovendoor" }, { tap: "tray" }], undefined, { toTheEnd: false });
    expect(l.items).not.toContain("key");
    expect(l.known.has("hot")).toBe(true);
  });

  it("cold water won't touch the wax; the loop clock is hidden, and the wall clock runs slow (the loop ends 'early' by it)", () => {
    const l = loop("kitchen");
    play(l, [{ tap: "stove" }, { tap: "pot" }, { look: "west" }, { tap: "sink", use: "pot" }, { look: "south" }, { tap: "hatch" }, { tap: "wax", use: "water" }], undefined, { toTheEnd: false });
    expect(l.flags.has("wax.melted")).toBe(false);
    expect(CHAPTER_DEFS.kitchen.hideClock).toBe(true);
    expect(wallClockShows(99, 0)).toBe(99);
    expect(Math.round(wallClockShows(99, 99_000))).toBe(30);
    const glanced = loop("kitchen");
    glanced.look("west");
    runUntil(glanced);
    expect(glanced.known.has("early")).toBe(true);
  });
});

describe("Chapter 3: The Clock Room", () => {
  it("time flies: at 77 the little clock takes off, then lands for four seconds at a time, where the schedule says", () => {
    const l = loop("clock-room");
    const landings: Array<{ at: number; wall: string }> = [];
    let was = "";
    while (l.status !== "over") {
      l.tick(16);
      l.events.length = 0;
      const now = ["north", "east", "south", "west"].find((w) => l.flags.has(`perch.${w}`)) ?? "";
      if (now && now !== was) landings.push({ at: l.display, wall: now });
      was = now;
    }
    expect(landings).toEqual(PERCHES.map((p) => ({ at: p.at, wall: p.wall })));
    // Caught, it stops landing anywhere.
    const c = loop("clock-room");
    play(c, [{ look: "north" }, { waitFlag: "perch.north" }, { tap: "perch-north" }], undefined, { toTheEnd: false });
    expect(c.items).toContain("flyer");
    runUntil(c);
    expect(c.flags.has("perch.east")).toBe(false);
  });

  it("the crank does nothing until the wound clock drives the gears", () => {
    const l = loop("clock-room");
    expect(l.interact("crank")).toBe("acted");
    expect(l.flags.has("hand.at100")).toBe(false);
  });

  it("the hundredth second only happens with the hand on 100, and the door only exists for it", () => {
    // Without the hand on 100: zero is zero.
    const plain = loop("clock-room");
    runUntil(plain);
    expect(plain.result).toBe("reset");
    // With it: a hundredth second, a door, and then a reset if you don't take it.
    const l = loop("clock-room");
    play(l, [{ look: "east" }, { tap: "key" }, { look: "north" }, { waitFlag: "perch.north" }, { tap: "perch-north" }, { tap: "item:flyer", use: "key" }, { look: "east" }, { tap: "axle", use: "wound" }, { look: "north" }, { tap: "crank" }, { look: "south" }], undefined, { toTheEnd: false });
    expect(l.hotspots().map((h) => h.id)).not.toContain("door100");
    runUntil(l, () => l.status === "extra");
    expect(l.display).toBe(100);
    expect(l.hotspots().map((h) => h.id)).toContain("door100");
    runUntil(l);
    expect(l.result).toBe("reset");
  });

  it("both endings: write the notes you found and the loop closes; leave without them (or with the wrong ones) and it doesn't", () => {
    const golden = goldenPath("clock-room");
    expect(play(loop("clock-room"), golden).result).toBe("true");
    const noNotes = golden.filter((s) => !("tap" in s && s.tap.startsWith("write-")));
    expect(play(loop("clock-room"), noNotes).result).toBe("paradox");
    const decoy = golden.map((s) => ("tap" in s && s.tap === "write-zero" ? { tap: "write-d1" } : s));
    expect(play(loop("clock-room"), decoy).result).toBe("paradox");
    // Tearing off the page starts the notes again.
    const torn: Step[] = golden.flatMap((s) => ("tap" in s && s.tap === "write-zero" ? [s, { tap: "tear" }] : [s]));
    expect(play(loop("clock-room"), torn).result).toBe("paradox");
  });
});
