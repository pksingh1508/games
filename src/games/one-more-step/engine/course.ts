// Reading a level's map (Plan/01-one-more-step.md §12 "Data model") into arrays, and its first state.
import { Cell, DIRS, type Course, type LevelDef, type Pos, type State } from "./types";

const BELTS: Record<string, number> = { "^": 0, ">": 1, v: 2, "<": 3 };

export function compile(def: LevelDef): Course {
  const h = def.map.length;
  const w = Math.max(...def.map.map((r) => r.length));
  const n = w * h;
  const cells = new Uint8Array(n);
  const belts = new Int8Array(n).fill(-1);
  const spikesUp = new Uint8Array(n);
  const lazy = new Uint8Array(n);
  const crumbleIndex = new Int16Array(n).fill(-1);
  const painted: Pos[] = [];
  const doors: Pos[] = [];
  const sentinels: Pos[] = [];
  let start: Pos | null = null;
  let twin: Pos | null = null;
  let crumbles = 0;
  let second: Pos | null = null;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = def.map[y]![x] ?? "#";
      const i = y * w + x;
      let c: Cell = Cell.Floor;
      switch (ch) {
        case "#":
        case " ":
          c = Cell.Wall;
          break;
        case "D":
          c = Cell.Wall;
          painted.push({ x, y });
          break;
        case "~":
          c = Cell.Crumble;
          break;
        case "h":
          c = Cell.Secret;
          break;
        case "X":
        case "x":
          c = Cell.Spikes;
          spikesUp[i] = ch === "X" ? 1 : 0;
          break;
        case "Z":
        case "z":
          c = Cell.Spikes;
          spikesUp[i] = ch === "Z" ? 1 : 0;
          lazy[i] = 1;
          break;
        case "W":
          c = Cell.Wave;
          break;
        case "O":
          c = Cell.Hole;
          break;
        case "B":
          c = Cell.Basement;
          break;
        case "_":
          c = Cell.Plate;
          break;
        case "|":
          c = Cell.Gate;
          break;
        case "^":
        case ">":
        case "v":
        case "<":
          c = Cell.Conveyor;
          belts[i] = BELTS[ch]!;
          break;
        case "P":
          if (start) throw new Error(`${def.id}: two players`);
          start = { x, y };
          break;
        case "E":
          doors.unshift({ x, y });
          break;
        case "e":
          second = { x, y };
          break;
        case "T":
          twin = { x, y };
          break;
        case "S":
          sentinels.push({ x, y });
          break;
        case ".":
          break;
        default:
          throw new Error(`${def.id}: what's "${ch}" at ${x},${y}?`);
      }
      cells[i] = c;
      if (c === Cell.Crumble || c === Cell.Secret) crumbleIndex[i] = crumbles++;
    }
  }
  if (!start) throw new Error(`${def.id}: no player`);
  if (doors.length > 1) throw new Error(`${def.id}: one Doory per level (use "e" for the twin's exit)`);
  if (second) doors.push(second);
  void DIRS;
  return {
    def,
    w,
    h,
    cells,
    belts,
    spikesUp,
    lazy,
    painted,
    start,
    doors,
    twin,
    sentinels,
    crumbleIndex,
    crumbles,
    behavior: def.door ?? "shy",
    echoDelay: def.echoDelay ?? 0,
    wave: def.wave ?? 0,
  };
}

export function initialState(course: Course): State {
  return {
    tick: 0,
    player: { ...course.start },
    doors: course.doors.map((d) => ({ ...d })),
    broken: new Array(Math.ceil(course.crumbles / 32)).fill(0),
    lazyFlips: 0,
    trail: [{ ...course.start }],
    twin: course.twin ? { ...course.twin } : null,
    sentinels: course.sentinels.map((s) => ({ ...s })),
    waits: 0,
    coming: false,
    ran: -1,
    status: "play",
    cause: null,
  };
}
