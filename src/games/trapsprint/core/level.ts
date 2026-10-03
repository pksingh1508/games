// Levels are written as 30 × 17 character maps (Plan §12 suggests LDtk; plain text keeps them in
// the code review). Upper-case letters are fixed things; lower-case letters anchor traps, which
// each level defines next to its map.
//
//   .  air            #  ground / wall      =  one-way ledge
//   ^  floor spikes   v  ceiling spikes     [  spikes facing right   ]  spikes facing left
//   S  spawn          D  the exit door      C  coin                  K  checkpoint flag
//   J  spring         >  conveyor →         <  conveyor ←            a–z  trap anchors
import type { Rect } from "@/engine/platformer/physics";
import { COLS, ROWS, TILE } from "./constants";

export type TrapKind =
  | "popSpikes"
  | "dropFloor"
  | "crusher"
  | "runawayDoor"
  | "fakeDoor"
  | "saw"
  | "jumpPunisher"
  | "invisibleBlock"
  | "stalactite"
  | "wallSqueeze"
  | "fakeCheckpoint"
  | "coinBait"
  | "conveyorFlip"
  | "fakeSpikes"
  | "sidewaysSpring"
  | "returnTrap"
  | "victoryBanner"
  | "risingFloor"
  | "follower";

export type Trigger =
  | { on: "zone"; cols: [number, number]; rows: [number, number] }
  | { on: "near"; tiles: number }
  | { on: "land" }
  | { on: "touch" }
  | { on: "jump"; cols: [number, number]; rows: [number, number] }
  | { on: "still"; ticks: number }
  | { on: "return"; cols: [number, number]; rows: [number, number] }
  | { on: "after"; trap: string; ticks: number }
  | { on: "start" }
  | { on: "never" };

export interface TrapSource {
  kind: TrapKind;
  trigger?: Trigger;
  /** Runaway door: the column it rolls to. */
  to?: number;
  /** Saw, conveyor, sideways spring: which way (1 = right, -1 = left). */
  dir?: 1 | -1;
  /** Ticks of warning before it fires (saw "shing", crusher dust, stalactite wobble…). */
  warn?: number;
  speed?: number;
  /** The Second-Try trap: after your first death it moves by this many tiles (Plan §3, trap 17). */
  retry?: [number, number];
  /** Rising floor: how many tiles it rises. */
  rise?: number;
  /** Wall squeeze: the column the two walls meet at (under the way out), and how many ticks they take. */
  meet?: number;
  close?: number;
  /** Set on Remix copies: warnings are shorter and moving traps faster. */
  remixed?: boolean;
}

export interface LevelSource {
  id: string;
  name: string;
  map: readonly string[];
  traps?: Readonly<Record<string, TrapSource>>;
  /** "Your Own Ghost" (Plan §4): your best run's ghost carries a spike ball. */
  ghostTrap?: boolean;
  /** Waypoints [col, row] for the solver on levels that double back (the game ignores them). */
  route?: ReadonlyArray<readonly [number, number]>;
}

export type Cell =
  | "air"
  | "ground"
  | "ledge"
  | "spikeUp"
  | "spikeDown"
  | "spikeRight"
  | "spikeLeft"
  | "conveyorRight"
  | "conveyorLeft";

export interface TrapDef extends TrapSource {
  id: string;
  /** The anchor cells, in pixels. */
  rect: Rect;
  /** The same, in tiles: [c0, r0, c1, r1] inclusive. */
  cells: [number, number, number, number];
}

export interface Level {
  id: string;
  name: string;
  zone: 1 | 2 | 3;
  remix: boolean;
  grid: Cell[][];
  spawn: { x: number; y: number };
  exit: Rect;
  coins: Rect[];
  checkpoints: Rect[];
  springs: Rect[];
  traps: TrapDef[];
  ghostTrap: boolean;
  /** Has a trap that moves after your first death: the name ends with "?" (Plan §10.6). */
  secondTry: boolean;
  /** Solver waypoints, in pixels (centre of each cell). */
  route: Array<{ x: number; y: number }>;
}

const CELL: Record<string, Cell> = {
  ".": "air",
  "#": "ground",
  "=": "ledge",
  "^": "spikeUp",
  v: "spikeDown",
  "[": "spikeRight",
  "]": "spikeLeft",
  ">": "conveyorRight",
  "<": "conveyorLeft",
};

/** Traps whose anchor cells are solid floor or blocks (the rest anchor in the air). */
const SOLID_ANCHORS = new Set<TrapKind>(["dropFloor", "invisibleBlock", "crusher", "conveyorFlip", "risingFloor"]);

export const cellRect = (c: number, r: number): Rect => ({ x: c * TILE, y: r * TILE, w: TILE, h: TILE });

export function parseLevel(source: LevelSource, { remix = false }: { remix?: boolean } = {}): Level {
  const map = remix ? mirrorMap(source.map) : source.map;
  if (map.length !== ROWS || map.some((row) => row.length !== COLS)) {
    throw new Error(`Level ${source.id}: the map must be ${COLS} × ${ROWS}`);
  }
  const grid: Cell[][] = [];
  let spawn: { x: number; y: number } | null = null;
  let exit: Rect | null = null;
  const coins: Rect[] = [];
  const checkpoints: Rect[] = [];
  const springs: Rect[] = [];
  const anchors = new Map<string, Array<[number, number]>>();

  for (let r = 0; r < ROWS; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < COLS; c++) {
      const ch = map[r]![c]!;
      const cell: Cell = CELL[ch] ?? "air";
      if (ch === "S") spawn = { x: c * TILE + 3, y: r * TILE + TILE - 14 };
      else if (ch === "D") exit = { x: c * TILE + 2, y: r * TILE - 8, w: TILE - 4, h: TILE + 8 };
      else if (ch === "C") coins.push({ x: c * TILE + 4, y: r * TILE + 3, w: 8, h: 10 });
      else if (ch === "K") checkpoints.push({ x: c * TILE + 4, y: r * TILE - 8, w: 8, h: 24 });
      else if (ch === "J") springs.push({ x: c * TILE + 1, y: r * TILE + 10, w: TILE - 2, h: 6 });
      // "v" (ceiling spikes) is a tile, not a trap letter.
      else if (ch >= "a" && ch <= "z" && !(ch in CELL)) {
        const list = anchors.get(ch) ?? [];
        list.push([c, r]);
        anchors.set(ch, list);
      }
      row.push(cell);
    }
    grid.push(row);
  }

  const traps: TrapDef[] = [];
  for (const [letter, cells] of anchors) {
    const raw = source.traps?.[letter];
    if (!raw) throw new Error(`Level ${source.id}: no trap defined for "${letter}"`);
    const src = remix ? mirrorTrap(raw) : raw;
    const cs = cells.map(([c]) => c);
    const rs = cells.map(([, r]) => r);
    const c0 = Math.min(...cs);
    const c1 = Math.max(...cs);
    const r0 = Math.min(...rs);
    const r1 = Math.max(...rs);
    if (SOLID_ANCHORS.has(src.kind)) for (const [c, r] of cells) grid[r]![c] = "air";
    traps.push({
      ...src,
      id: letter,
      cells: [c0, r0, c1, r1],
      rect: { x: c0 * TILE, y: r0 * TILE, w: (c1 - c0 + 1) * TILE, h: (r1 - r0 + 1) * TILE },
    });
  }
  traps.sort((a, b) => a.id.localeCompare(b.id));

  // The runaway door is the exit; with a fake door, the real exit may be hidden somewhere else.
  const runaway = traps.find((t) => t.kind === "runawayDoor");
  if (runaway) exit = { x: runaway.rect.x + 2, y: runaway.rect.y - 8, w: TILE - 4, h: TILE + 8 };
  if (!spawn) throw new Error(`Level ${source.id}: no spawn (S)`);
  if (!exit) throw new Error(`Level ${source.id}: no exit (D)`);

  const zone = Number(source.id.replace(/^R/, "").split("-")[0]) as 1 | 2 | 3;
  return {
    id: remix ? `R${source.id}` : source.id,
    name: source.name,
    zone,
    remix,
    grid,
    spawn,
    exit,
    coins,
    checkpoints,
    springs,
    traps,
    ghostTrap: Boolean(source.ghostTrap),
    secondTry: traps.some((t) => t.retry),
    route: (source.route ?? []).map(([c, r]) => ({ x: (remix ? COLS - 1 - c : c) * TILE + TILE / 2, y: r * TILE + TILE / 2 })),
  };
}

// ---------------------------------------------------------------------------------------------
// Remix (Plan §5): every level mirrored, so the route runs the other way.
// ---------------------------------------------------------------------------------------------

const MIRROR_CHAR: Record<string, string> = { "<": ">", ">": "<", "[": "]", "]": "[" };

export function mirrorMap(map: readonly string[]): string[] {
  return map.map((row) =>
    [...row]
      .reverse()
      .map((ch) => MIRROR_CHAR[ch] ?? ch)
      .join(""),
  );
}

const flipCol = (c: number) => COLS - 1 - c;
const flipRange = ([a, b]: [number, number]): [number, number] => [flipCol(b), flipCol(a)];

/** Remix: mirrored, and every trap a little meaner (shorter warnings, faster moves). */
function mirrorTrap(t: TrapSource): TrapSource {
  const out: TrapSource = { ...t, remixed: true };
  if (t.meet !== undefined) out.meet = flipCol(t.meet);
  if (t.dir) out.dir = (t.dir * -1) as 1 | -1;
  if (t.to !== undefined) out.to = flipCol(t.to);
  if (t.retry) out.retry = [-t.retry[0], t.retry[1]];
  const trig = t.trigger;
  if (trig && (trig.on === "zone" || trig.on === "jump" || trig.on === "return")) out.trigger = { ...trig, cols: flipRange(trig.cols) };
  return out;
}

/** Display name: the Second-Try mark is part of the name (Plan §3, trap 17). */
export const levelTitle = (level: Pick<Level, "name" | "secondTry">) => (level.secondTry ? `${level.name}?` : level.name);
