// Reporting (Plan/14-dont-blink.md §3 "Reporting", §12): what a click on a camera could be about. Every object
// is clickable where it is now and, if it's moved or gone, where it used to be (a ghost box). Things that only
// turn up as anomalies (an extra painting, a figure) aren't clickable until they're there, so an empty spot
// never gives anything away.
import { SCENES } from "../scenes";
import type { AnomalyDef, AnomalyType, CameraId, ObjectDef, ObjState } from "./types";

/** Left, top, right, bottom, in scene units. */
export type Box = readonly [number, number, number, number];

export const boxAt = (o: ObjectDef, s: Pick<ObjState, "x" | "y">): Box => [s.x + o.hit[0], s.y + o.hit[1], s.x + o.hit[2], s.y + o.hit[3]];

export const inBox = (b: Box, x: number, y: number) => x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3];

export const boxCentre = (b: Box) => ({ x: (b[0] + b[2]) / 2, y: (b[1] + b[3]) / 2 });

/** Where the Visitor stands in a room (null: it never comes here). */
export function visitorBox(camera: CameraId): Box | null {
  const v = SCENES[camera].visitor;
  if (!v) return null;
  return [v.x - 34 * v.scale, v.y - 150 * v.scale - 6, v.x + 34 * v.scale, v.y + 6];
}

/** Types that count as right for this anomaly (§10 rule 6: flexible matching where it's genuinely ambiguous). */
export function accepts(a: Pick<AnomalyDef, "type" | "accept">, type: AnomalyType): boolean {
  if (a.type === type || a.accept?.includes(type)) return true;
  // Gone, or moved somewhere out of sight? From the camera you can't tell, so either will do.
  return a.type === "missing" && type === "moved";
}

/** The Visitor, where it doesn't belong: a statue that's walked in, an intruder, something extra. */
export const VISITOR_TYPES: readonly AnomalyType[] = ["intruder", "extra", "moved"];

/** Objects in this camera a click at (x, y) could mean (scene units, already unflipped). */
export function objectsAt(camera: CameraId, x: number, y: number, states: ReadonlyMap<string, ObjState>): ObjectDef[] {
  const out: ObjectDef[] = [];
  for (const o of SCENES[camera].objects) {
    const s = states.get(o.id) ?? o.base;
    const now = s.visible && inBox(boxAt(o, s), x, y);
    const was = o.base.visible && inBox(boxAt(o, o.base), x, y);
    if (now || was) out.push(o);
  }
  return out;
}
