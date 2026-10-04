// Where the solver should head, for levels that need a plan (a window to drag aside, windows to close
// first, a safe file to wait in). Every other level: straight for the [X].
import { CLOSE_BUTTON } from "../core/constants";
import type { Rect } from "../core/geometry";
import { closeOf, type Waypoint } from "../core/solver";
import { cells, px, py } from "./dsl";
import { getLevel } from "./index";

/** The [X], to click. */
const X: Waypoint = { rect: { x: CLOSE_BUTTON.x + 3, y: CLOSE_BUTTON.y + 3, w: CLOSE_BUTTON.w - 6, h: CLOSE_BUTTON.h - 6 }, click: true };
/** A pop-up's [X] (its top-right corner), to click. */
const shut = (r: Rect): Waypoint => closeOf(r);
/** Go somewhere (no click). */
const via = (r: Rect): Waypoint => ({ rect: r });

export const ROUTES: Record<string, Waypoint[]> = {
  "C-07": [
    // Into Notepad's title bar (that grabs it), drag it left out of the doorway, click to let go.
    { rect: { x: px(29) + 4, y: py(15) + 3, w: 20, h: 6 } },
    { rect: { x: px(23), y: py(15) + 2, w: 16, h: 8 }, click: true },
    { rect: cells(34, 1, 4, 2) },
    X,
  ],
  "E-02": [via(cells(31, 9, 4, 4)), shut(cells(24, 9, 4, 4)), shut(cells(17, 9, 4, 4)), shut(cells(10, 9, 4, 4)), X],
  "E-06": [
    // The robot runs twice; then tick it. Then the three cursors.
    via(cells(13.4, 8.4, 1.8, 1.8)),
    via(cells(19.4, 6.4, 1.8, 1.8)),
    { rect: { x: px(6) + 3, y: py(10) + 3, w: 5, h: 5 }, click: true },
    { rect: { x: px(16) + 4, y: py(18) + 4, w: 8, h: 8 }, click: true },
    { rect: { x: px(27) + 4, y: py(8) + 4, w: 8, h: 8 }, click: true },
    { rect: { x: px(18) + 4, y: py(1) + 4, w: 8, h: 8 }, click: true },
    X,
  ],
  "E-07": [shut(cells(26, 15, 4, 3)), shut(cells(13, 2, 4, 3)), shut(cells(2, 15, 4, 3)), shut(cells(14, 15, 4, 3)), shut(cells(25, 1, 4, 3)), X],
  "E-09": [
    // Near the [X]: it hops to the middle; there, it hops to the left. Follow it.
    { rect: { x: 600, y: 14, w: 22, h: 12 }, done: (w) => w.exitSpot >= 1 },
    { rect: { x: px(18) - 10, y: 14, w: 26, h: 12 }, done: (w) => w.exitSpot >= 2 },
    { rect: { x: px(5) - 1, y: 16, w: 10, h: 8 }, click: true },
  ],
  "E-04": [answer("E-04", 0, "left"), X],
  "E-05": [answer("E-05", 0, "left"), answer("E-05", 1, "right"), X],
  "E-10": [answer("E-10", 0, "left"), X],
  "X-01": [shut(cells(2, 1, 6, 4)), shut(cells(30, 15, 6, 4)), shut(cells(14, 2, 6, 4)), shut(cells(2, 15, 6, 4)), shut(cells(30, 2, 6, 4)), X],
};

/**
 * Answer a level's `n`th dialog: it swaps once as you come near, so the right answer ends up on the
 * `side` button. Click there until it's gone (clicks while it shivers don't count).
 */
function answer(levelId: string, n: number, side: "left" | "right"): Waypoint {
  const dialogs = (getLevel(levelId).hazards ?? []).filter((h) => h.kind === "dialog");
  const d = dialogs[n]!;
  const [left, right] = d.yes.x < d.no.x ? [d.yes, d.no] : [d.no, d.yes];
  const b = side === "left" ? left : right;
  return {
    rect: { x: b.x + 4, y: b.y + 3, w: b.w - 8, h: b.h - 6 },
    click: true,
    done: (w) => {
      const i = w.course.hazards.map((h, j) => (h.kind === "dialog" ? j : -1)).filter((j) => j >= 0)[n]!;
      return w.hz[i]!.done;
    },
  };
}
