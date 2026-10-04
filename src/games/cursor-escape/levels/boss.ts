// The Uninstaller (Plan/12-cursor-escape.md §5): a progress bar, "Uninstalling Cursor…", filling up.
// Five of its dialogs open one after another; close each (its [X], top right) and the bar goes back,
// but each one sets something off on its way out. Close them all and the last [X] isn't a window's:
// it's DeskOS 98's own.
import { seconds } from "../core/constants";
import type { Panel } from "../core/level";
import { cells, level } from "./dsl";
import { MAPS } from "./maps";

const s = seconds;

const dialog = (id: string, c: number, r: number, after: string | undefined, text: string[]): Panel => ({
  id,
  rect: cells(c, r, 6, 4),
  title: "Uninstall Wizard",
  look: "window",
  closeable: true,
  after,
  text,
});

export const BOSS = level({
  id: "X-01",
  name: "The Uninstaller",
  hint: "Close its five dialogs before the bar fills. Then close DeskOS 98 itself.",
  map: MAPS["X-01"]!,
  panels: [
    dialog("d1", 2, 1, undefined, ["Uninstalling", "your cursor…"]),
    dialog("d2", 30, 15, "d1", ["Are you sure", "you're sure?"]),
    dialog("d3", 14, 2, "d2", ["Removing", "your hand…"]),
    dialog("d4", 2, 15, "d3", ["Almost done!"]),
    dialog("d5", 30, 2, "d4", ["Goodbye,", "pointer."]),
  ],
  triggers: [
    { closed: "d1", effect: { type: "invert", axes: "x" }, ticks: s(6) },
    { closed: "d2", effect: { type: "decoys", count: 3 }, ticks: s(7) },
    { closed: "d3", effect: { type: "solidTrail", trail: s(2.5) }, ticks: s(6) },
    { closed: "d4", effect: { type: "lag", follow: 0.16 }, ticks: s(6) },
  ],
  exit: { after: ["d1", "d2", "d3", "d4", "d5"] },
  boss: { fill: 3, drop: 15 },
});
