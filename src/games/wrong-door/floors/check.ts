// Is a floor fair? (Plan/13-wrong-door.md §10 rule 1: "every logic floor has exactly one correct door based
// on the clues available, checked by the solver".) Each kind of floor has its own idea of "available":
//
// - Signs, numbers, memory, mirrors, shifting doors, Liar's Banquet: what's on show leaves one door.
// - The doorman: what's on show leaves two, and one question settles it (the double question always does).
// - Sound and dark floors: what's on show leaves two or three, the plaque promises wind behind the way up,
//   so two knocks always settle it.
// - Anomaly floors: back the way you came exactly when something has changed.
// - The Lucky Floor is luck (and says so); the last floor's way out isn't a door, as its plaque says.
import { answerOf } from "../logic/doorman";
import { candidates, signTruths } from "../logic/solver";
import { emptyKnowledge, type DoorId, type Floor, type Knowledge, type Question } from "../logic/types";
import { SOUND_OF } from "./common";

/** Knocks you get on every floor (a stethoscope adds one). */
export const KNOCKS = 2;

/** What's on show (no knocks, no questions, no items). */
export const onShow = (floor: Floor) => emptyKnowledge(floor);

/** Knock on the doors in order until there's one left (or the knocks run out). */
export function knockThrough(floor: Floor, k: Knowledge, knocks = KNOCKS): Knowledge {
  let know = k;
  for (let i = 0; i < knocks; i++) {
    const left = candidates(floor, know, { use: { doorman: false } });
    if (left.length <= 1) break;
    const d = left[0]!;
    know = { ...know, knocks: { ...know.knocks, [d]: floor.doors[d - 1]!.sound } };
  }
  return know;
}

/** Null when the floor is fair; otherwise why not. */
export function verify(floor: Floor): string | null {
  const exit = floor.exit;
  // Every wrong door has something behind it, and sounds like it; only the way up has wind.
  for (const d of floor.doors) {
    const isExit = d.id === exit;
    if (isExit !== (d.consequence === null)) return `door ${d.id}: consequence`;
    if (d.consequence && floor.archetype !== "montyHall" && floor.archetype !== "final" && d.sound !== SOUND_OF[d.consequence]) return `door ${d.id}: sound`;
    if (d.sound === "wind" && !isExit) return `door ${d.id}: wind`;
    if (isExit && floor.windRule && d.sound !== "wind") return "no wind";
  }
  const ids = floor.doors.map((d) => d.id);
  if (ids.some((id, k) => id !== k + 1)) return "door ids";
  const show = onShow(floor);
  const free = (k: Knowledge) => candidates(floor, k, { use: { doorman: false } });

  switch (floor.archetype) {
    case "plainSigns":
    case "knightsKnaves":
    case "mirror":
    case "shifting":
    case "sequence":
    case "memory":
    case "liarsBanquet": {
      if (typeof exit !== "number") return "exit";
      const left = free(show);
      if (left.length !== 1 || left[0] !== exit) return `leaves ${left.join(",")}`;
      if (floor.rule && !signTruths(floor, exit)) return "signs";
      if (floor.archetype === "shifting" && (!floor.shuffle || floor.doors.some((d) => !d.scratch) || new Set(floor.doors.map((d) => d.scratch)).size !== floor.doors.length)) return "scratches";
      if (floor.archetype === "mirror" && !floor.mirror) return "mirror";
      return null;
    }
    case "doorman": {
      if (typeof exit !== "number" || !floor.doorman) return "doorman";
      const left = free(show);
      if (left.length !== 2 || !left.includes(exit)) return `leaves ${left.join(",")}`;
      // The double question about either door settles it, whatever his hat.
      for (const d of left) {
        const q: Question = { type: "wouldSay", door: d };
        const after = candidates(floor, { ...show, answer: { question: q, yes: answerOf(q, exit, floor.doorman.lies) } });
        if (after.length !== 1 || after[0] !== exit) return "double question";
      }
      return null;
    }
    case "sound":
    case "dark": {
      if (typeof exit !== "number" || !floor.windRule) return "wind";
      if (floor.archetype === "dark" && (!floor.dark || !floor.candle || show.canSee)) return "dark";
      const left = free(show);
      if (left.length < 2 || left.length > KNOCKS + 1 || !left.includes(exit)) return `leaves ${left.join(",")}`;
      const after = free(knockThrough(floor, show));
      if (after.length !== 1 || after[0] !== exit) return "knocks";
      if (floor.rule && !signTruths(floor, exit)) return "signs";
      return null;
    }
    case "anomaly":
      if (!floor.anomaly || floor.doors.length !== 1) return "anomaly";
      return exit === (floor.anomaly.changed ? "back" : 1) ? null : "anomaly exit";
    case "montyHall":
      return floor.lucky && floor.doors.length === 3 && typeof exit === "number" ? null : "lucky";
    case "final":
      return floor.final && exit === floor.final.way && floor.doors.length === 5 ? null : "final";
  }
}

/** For tests: the way up as a door id (0 when it isn't a door). */
export const exitDoor = (floor: Floor): DoorId => (typeof floor.exit === "number" ? floor.exit : 0);
