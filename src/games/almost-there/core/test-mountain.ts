// Tests only: a one-screen mountain drawn on the spot (rock walls, a floor, whatever the test puts
// in), with the two flags parked on a screen of their own.
import type { InputLog } from "@/engine/replay";
import { collapseSummit, tickClimb, type Climb, type ClimbEvent } from "./climb";
import { COLS, PIP_H, ROWS, TILE } from "./constants";
import { buildMountain, rowTop, type Mountain, type ScreenSource } from "./mountain";
import type { ClimbState } from "./sim";

export function testMountain(draw: (put: (row: number, col: number, text: string) => void) => void, extra: Partial<ScreenSource> = {}): Mountain {
  const grid: string[][] = Array.from({ length: ROWS }, (_, r) => Array.from({ length: COLS }, (_, c) => (c < 2 || c >= COLS - 2 || r === ROWS - 1 ? "#" : ".")));
  const put = (row: number, col: number, text: string) => {
    for (let i = 0; i < text.length; i++) grid[row]![col + i] = text[i]!;
  };
  put(ROWS - 2, 3, "S");
  draw(put);
  const flags: ScreenSource = {
    zone: "summit",
    col: 1,
    row: 39,
    map: Array.from({ length: ROWS }, (_, r) => (r === ROWS - 1 ? "#".repeat(COLS) : r === ROWS - 2 ? `P...R${".".repeat(COLS - 5)}` : ".".repeat(COLS))),
  };
  return buildMountain([{ zone: "foothills", col: 0, row: 0, map: grid.map((r) => r.join("")), ...extra }, flags]);
}

/** Pip standing with its left edge at a column, feet on top of a tile row of the test screen. */
export function standAt(s: ClimbState, col: number, row: number) {
  const p = s.pip;
  p.x = col * TILE;
  p.y = rowTop(0) + row * TILE - PIP_H;
  p.vx = 0;
  p.vy = 0;
  p.rx = 0;
  p.ry = 0;
  p.grounded = true;
  p.takeoff = p.y + PIP_H;
  p.peak = p.y + PIP_H;
}

/** The top of a tile row of the test screen (world y). */
export const rowY = (row: number) => rowTop(0) + row * TILE;

/** Run a recorded log through a whole climb; the summit falls as soon as the credits start. */
export function climbWith(m: Mountain, c: Climb, log: InputLog, onEvents?: (events: ClimbEvent[], c: Climb) => void): Climb {
  for (const [bits, n] of log) {
    for (let i = 0; i < n; i++) {
      if (c.story === "credits") collapseSummit(c);
      const events = tickClimb(m, c, bits);
      onEvents?.(events, c);
    }
  }
  return c;
}
