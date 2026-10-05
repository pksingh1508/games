// What a room is: its background, its objects (each drawn by a kind of drawing, from its state), its
// anomalies, and where the Visitor stands when it's in this room.
import type { AnomalyDef, AnomalyType, CameraId, ObjState, ObjectDef } from "../core/types";
import type { G } from "./paint";

export type DrawFn = (g: G, s: ObjState, t: number) => void;

export interface Scene {
  camera: CameraId;
  /** The walls, floor and fixed furniture (drawn once). */
  room: (g: G) => void;
  objects: ObjectDef[];
  anomalies: AnomalyDef[];
  draw: Record<string, DrawFn>;
  /** Where the Visitor stands in this room (the bottom of its plinth or feet), and how big. */
  visitor?: { x: number; y: number; scale: number };
  /** Light over everything after the objects (a lamp's pool, a window's moonlight). Optional. */
  light?: (g: G, states: ReadonlyMap<string, ObjState>) => void;
}

export const state = (x: number, y: number, variant = "base", visible = true): ObjState => ({ x, y, visible, variant, tint: 0 });

/** A builder for one room's objects and anomalies. */
export function room(camera: CameraId) {
  const objects: ObjectDef[] = [];
  const anomalies: AnomalyDef[] = [];
  const api = {
    objects,
    anomalies,
    /** An object: its id within the room, name, kind, base state, hit box [left, top, right, bottom], z. */
    obj(id: string, name: string, kind: string, base: ObjState, hit: readonly [number, number, number, number], z = 0) {
      objects.push({ id: `${camera}.${id}`, camera, name, kind, base, hit, z });
      return api;
    },
    /** An anomaly on one of this room's objects (or "@view"). */
    anomaly(object: string, type: AnomalyType, subtlety: AnomalyDef["subtlety"], set: Partial<ObjState>, more: Partial<Pick<AnomalyDef, "accept" | "colour" | "gradual">> & { name?: string } = {}) {
      const objectId = object === "@view" ? "@view" : `${camera}.${object}`;
      const n = more.name ? 0 : anomalies.filter((a) => a.object === objectId && a.type === type).length;
      const prefix = objectId === "@view" ? `${camera}.view` : objectId;
      anomalies.push({ id: `${prefix}.${more.name ?? type}${n ? n + 1 : ""}`, camera, object: objectId, type, subtlety, set, ...(more.accept ? { accept: more.accept } : {}), ...(more.colour ? { colour: true } : {}), ...(more.gradual ? { gradual: more.gradual } : {}) });
      return api;
    },
  };
  return api;
}
