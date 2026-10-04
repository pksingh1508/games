// Levels are drawn in text (like the other games' rooms): one line for the bar under the title bar
// ("." where it opens up), then 21 lines of 38 cells, 16 px each, for the client area. Walls are merged
// into as few rectangles as possible. Anything finer (slits, moving things, windows) is added in px.
//
//   #  wall               .  floor              S  start              H  home (recentring)
//   i  text (I-beam)      -  resize ↔           |  resize ↕           b  loading (busy)
//   +  precision          x  restricted         s  floor that's a safe file (from the scan line)
//   !  wall with a narrow upright slot (4 px: only the I-beam fits; it counts as text)
//   =  wall with a low slot (8 px tall: the arrow fits, the I-beam doesn't)
//   <  left half wall     >  right half wall    n  top half wall      u  bottom half wall
import { CELL, CLIENT, COLS, ROWS } from "../core/constants";
import type { Rect, Vec } from "../core/geometry";
import type { Checkbox, Drive, ExitButton, Hazard, LevelSource, Link, Panel, Timed, Zone, ZoneMode } from "../core/level";
import { MEDALS } from "./medals";

const ZONES: Record<string, ZoneMode> = { i: "ibeam", "-": "resizeH", "|": "resizeV", b: "busy", "+": "crosshair", x: "forbidden" };

/** A cell's top-left corner (desktop px). */
export const px = (c: number) => CLIENT.x + c * CELL;
export const py = (r: number) => CLIENT.y + r * CELL;
/** A cell's middle. */
export const at = (c: number, r: number): Vec => ({ x: px(c) + CELL / 2, y: py(r) + CELL / 2 });
/** A rect in cells (fractions allowed). */
export const cells = (c: number, r: number, w: number, h: number): Rect => ({ x: px(c), y: py(r), w: w * CELL, h: h * CELL });

/** Merge same-kind cells: runs along each row, then runs of identical runs down the rows. */
function merge(grid: boolean[][]): Rect[] {
  const runs: Array<{ c0: number; c1: number; r0: number; r1: number }> = [];
  let open: typeof runs = [];
  for (let r = 0; r < grid.length; r++) {
    const row: Array<[number, number]> = [];
    let c = 0;
    while (c < grid[r]!.length) {
      if (!grid[r]![c]) {
        c++;
        continue;
      }
      const start = c;
      while (c < grid[r]!.length && grid[r]![c]) c++;
      row.push([start, c]);
    }
    const next: typeof runs = [];
    for (const [c0, c1] of row) {
      const cont = open.find((o) => o.c0 === c0 && o.c1 === c1 && o.r1 === r);
      if (cont) {
        cont.r1 = r + 1;
        next.push(cont);
      } else {
        const fresh = { c0, c1, r0: r, r1: r + 1 };
        runs.push(fresh);
        next.push(fresh);
      }
    }
    open = next;
  }
  return runs.map(({ c0, c1, r0, r1 }) => cells(c0, r0, c1 - c0, r1 - r0));
}

export interface ParsedMap {
  walls: Rect[];
  zones: Zone[];
  start: Vec;
  home?: Vec;
  gaps: Array<[number, number]>;
  safe: Rect[];
}

export function parseMap(map: readonly string[]): ParsedMap {
  if (map.length !== ROWS + 1) throw new Error(`a map is ${ROWS + 1} lines (the bar, then ${ROWS} rows), not ${map.length}`);
  for (const [i, line] of map.entries()) if (line.length !== COLS) throw new Error(`map line ${i} is ${line.length} wide, not ${COLS}: "${line}"`);
  const bar = map[0]!;
  const rows = map.slice(1);
  const gaps: Array<[number, number]> = [];
  for (let c = 0; c < COLS; c++) {
    if (bar[c] !== ".") continue;
    const s = c;
    while (c < COLS && bar[c] === ".") c++;
    gaps.push([px(s), px(c)]);
  }
  const of = (ch: string) => rows.map((row) => [...row].map((x) => x === ch));
  const walls = merge(of("#"));
  // Part-walls: slits and half cells.
  rows.forEach((row, r) => {
    [...row].forEach((ch, c) => {
      const x = px(c);
      const y = py(r);
      if (ch === "!") walls.push({ x, y, w: 6, h: CELL }, { x: x + 10, y, w: 6, h: CELL });
      else if (ch === "=") walls.push({ x, y, w: CELL, h: 4 }, { x, y: y + 12, w: CELL, h: 4 });
      else if (ch === "<") walls.push({ x, y, w: CELL / 2, h: CELL });
      else if (ch === ">") walls.push({ x: x + CELL / 2, y, w: CELL / 2, h: CELL });
      else if (ch === "n") walls.push({ x, y, w: CELL, h: CELL / 2 });
      else if (ch === "u") walls.push({ x, y: y + CELL / 2, w: CELL, h: CELL / 2 });
    });
  });
  const zones: Zone[] = [];
  for (const [ch, mode] of Object.entries(ZONES)) {
    // A narrow upright slot is text too (you're an I-beam all the way through it).
    const cells = ch === "i" ? rows.map((row) => [...row].map((x) => x === "i" || x === "!")) : of(ch);
    for (const rect of merge(cells)) zones.push({ rect, mode });
  }
  const find = (ch: string): Vec | undefined => {
    for (let r = 0; r < rows.length; r++) {
      const c = rows[r]!.indexOf(ch);
      if (c >= 0) return at(c, r);
    }
    return undefined;
  };
  const start = find("S");
  if (!start) throw new Error("a map needs a start (S)");
  return { walls, zones, start, home: find("H"), gaps, safe: merge(of("s")) };
}

export interface LevelSpec {
  id: string;
  name: string;
  hint: string;
  map: readonly string[];
  walls?: Rect[];
  links?: Link[];
  panels?: Panel[];
  hazards?: Hazard[];
  sabotage?: Timed[];
  checkboxes?: Checkbox[];
  exit?: ExitButton;
  triggers?: LevelSource["triggers"];
  boss?: LevelSource["boss"];
}

export function level(spec: LevelSpec): LevelSource {
  const m = parseMap(spec.map);
  const drive = spec.id[0] as Drive;
  // Scan lines are safe inside the map's safe files.
  const hazards = (spec.hazards ?? []).map((h) => (h.kind === "scan" && h.safe.length === 0 ? { ...h, safe: m.safe } : h));
  return {
    id: spec.id,
    drive,
    name: spec.name,
    hint: spec.hint,
    start: m.start,
    home: m.home,
    gaps: m.gaps,
    walls: [...m.walls, ...(spec.walls ?? [])],
    zones: m.zones,
    links: spec.links,
    panels: spec.panels,
    hazards,
    sabotage: spec.sabotage,
    checkboxes: spec.checkboxes,
    exit: spec.exit,
    triggers: spec.triggers,
    // Medal times come from the solver's run (medals.ts).
    medals: MEDALS[spec.id] ?? { gold: 0, silver: 0, bronze: 0 },
    boss: spec.boss,
  };
}
