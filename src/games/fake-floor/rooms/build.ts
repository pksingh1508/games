// A shorthand for writing rooms: draw only the tops of things. Rock ("#") carries on down to the
// bottom of the room as a pillar, so a map is just the few rows where something happens. "%" is
// rock that doesn't (a ledge or a floor under a hole). Safety nets go in the bottom row.
import { ROWS } from "../core/constants";

export interface BuildOptions {
  /** The row the last given row sits on (default 11, the main floor line). */
  floorRow?: number;
  /** "n" under every column that gets a safety net, or "all" for everywhere there's no pillar. */
  nets?: string;
}

export function build(rows: readonly string[], { floorRow = 11, nets = "" }: BuildOptions = {}): string[] {
  const width = rows[0]?.length ?? 0;
  const bad = rows.findIndex((r) => r.length !== width);
  if (bad >= 0) throw new Error(`Row ${bad} is ${rows[bad]!.length} wide, not ${width}: "${rows[bad]}"`);
  if (floorRow - rows.length + 1 < 0) throw new Error("Too many rows above the floor line");
  const grid = rows.map((r) => [...r]);
  for (let r = floorRow + 1; r < ROWS; r++) grid.push([...".".repeat(width)]);
  for (let c = 0; c < width; c++) {
    let rock = false;
    for (const row of grid) {
      const ch = row[c]!;
      if (ch === "#") rock = true;
      else if (ch === "%") row[c] = "#";
      else if (rock && ch === ".") row[c] = "#";
    }
    if (!rock && (nets === "all" || nets[c] === "n")) grid[grid.length - 1]![c] = "n";
  }
  return grid.map((r) => r.join(""));
}
