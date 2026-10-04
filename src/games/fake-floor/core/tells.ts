// Every lie has a tell (Plan/05-fake-floor.md §3, §4, §10). Which tells give each floor away
// depends on its room: grout in the Showroom, rain on the rooftops, lantern shadows in the mines,
// motion for the painted ones. The renderer draws exactly these, and the fairness tests check that
// every floor that lies has at least one.
import type { Env, FloorKind, Room } from "./room";

export type Tell =
  /** Its grout lines don't line up with its neighbours'. */
  | "grout"
  /** The rain never splashes on it. */
  | "dry"
  /** Its splashes come between the gusts, out of time with the rain you hear (mimics). */
  | "offbeat"
  /** It casts no shadow on the back wall. */
  | "shadowless"
  /** Its shadow stays put while the lantern swings (mimics and painted floors). */
  | "stillShadow"
  /** It slides a little when the camera moves (painted floors; a frame in reduced motion). */
  | "slides"
  /** Raindrops splash on nothing (invisible floors). */
  | "splashes"
  /** Dust settles on nothing (invisible floors). */
  | "dust"
  /** A crack appears once you've crossed it (return-trip floors). */
  | "crack"
  /** Crumbling floors are honestly cracked from the start. */
  | "cracked"
  /** Flipping floors shimmer just before they change. */
  | "shimmer";

/** Floor kinds whose grout lines up with the world's (mimics fake it; fakes and painted floors don't). */
const ALIGNED: ReadonlySet<FloorKind> = new Set(["solid", "crumble", "returnTrip", "mimic", "flip"]);

/** Has a neighbour (left, right, above or below) whose grout lines up: something to compare with. */
export function hasGroutReference(room: Room, i: number): boolean {
  const f = room.floors[i]!;
  return [
    [f.c - 1, f.r],
    [f.c + 1, f.r],
    [f.c, f.r - 1],
    [f.c, f.r + 1],
  ].some(([c, r]) => {
    if (c! < 0 || c! >= room.cols || r! < 0) return false;
    const v = room.cells[r! * room.cols + c!]!;
    return v >= 0 && ALIGNED.has(room.floors[v]!.kind);
  });
}

/** What a fake-looking floor lacks in this room (the tells of a plain fake). */
function absences(env: Env, groutRef: boolean): Tell[] {
  const out: Tell[] = [];
  if (env.grout && groutRef) out.push("grout");
  if (env.rain !== "none") out.push("dry");
  if (env.lantern) out.push("shadowless");
  return out;
}

/** The honest tells of floor `i` in its room. Empty for real floors (and for a lie with no tell). */
export function tellsOf(room: Room, i: number): Tell[] {
  const f = room.floors[i]!;
  const env = room.env;
  switch (f.kind) {
    case "solid":
      return [];
    case "fake":
      return absences(env, hasGroutReference(room, i));
    case "mimic": {
      const out: Tell[] = [];
      if (env.rain !== "none") out.push("offbeat");
      if (env.lantern) out.push("stillShadow");
      return out;
    }
    case "painted": {
      const out: Tell[] = ["slides"];
      if (env.rain !== "none") out.push("dry");
      if (env.lantern) out.push("stillShadow");
      return out;
    }
    case "invisible": {
      const out: Tell[] = [];
      if (env.rain !== "none") out.push("splashes");
      if (env.dust) out.push("dust");
      return out;
    }
    case "returnTrip":
      return ["crack", ...absences(env, hasGroutReference(room, i))];
    case "crumble":
      return ["cracked"];
    case "flip":
      return ["shimmer", ...absences(env, hasGroutReference(room, i))];
  }
}

/** Plain-language names for the tells (the room-complete card, the how-to-play). */
export const TELL_NAMES: Record<Tell, string> = {
  grout: "grout that doesn't line up",
  dry: "no splashes in the rain",
  offbeat: "splashes out of time with the rain",
  shadowless: "no shadow",
  stillShadow: "a shadow that doesn't swing",
  slides: "it slides when the view moves",
  splashes: "rain splashing on nothing",
  dust: "dust resting on nothing",
  crack: "a crack after you cross it",
  cracked: "cracks",
  shimmer: "a shimmer before it flips",
};
