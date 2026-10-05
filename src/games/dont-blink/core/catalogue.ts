// Everything in the museum that can change, gathered from the rooms: every object (by id) and every anomaly,
// and the Visitor's route. The rooms (scenes/) own the art; this is just the data the night runs on.
import { SCENES } from "../scenes";
import type { AnomalyDef, CameraId, ObjectDef } from "./types";

export const ALL_CAMERAS: readonly CameraId[] = ["lobby", "gallery", "sculpture", "storage", "corridor", "office"];

export const OBJECTS: ReadonlyMap<string, ObjectDef> = new Map(ALL_CAMERAS.flatMap((c) => SCENES[c].objects.map((o) => [o.id, o] as const)));

export const ANOMALIES: readonly AnomalyDef[] = ALL_CAMERAS.flatMap((c) => SCENES[c].anomalies);

export const ANOMALY_BY_ID: ReadonlyMap<string, AnomalyDef> = new Map(ANOMALIES.map((a) => [a.id, a]));

/** The key an anomaly occupies (one anomaly per object at a time; a mirror occupies the whole view). */
export const slotOf = (a: Pick<AnomalyDef, "camera" | "object">) => (a.object === "@view" ? `${a.camera}.view` : a.object);

/** The Visitor's way from its pedestal to your office (Plan/14-dont-blink.md §3 "The Visitor"). */
export const VISITOR_PATH: readonly CameraId[] = ["sculpture", "gallery", "lobby", "corridor", "office"];

/** Where each room is, to your ears (-1 left … 1 right), and how far (0 here … 1 the far end of the museum). */
export const ROOM_SOUND: Record<CameraId, { pan: number; far: number }> = {
  sculpture: { pan: -0.85, far: 1 },
  gallery: { pan: -0.55, far: 0.75 },
  lobby: { pan: -0.15, far: 0.5 },
  storage: { pan: 0.7, far: 0.6 },
  corridor: { pan: 0.35, far: 0.2 },
  office: { pan: 0, far: 0 },
};
