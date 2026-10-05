// Drawing a room as it is right now: the background, then every object in its current state (back to front),
// the Visitor if it's in this room, then the room's light.
import { VIEW_H, VIEW_W } from "../core/constants";
import type { ObjState } from "../core/types";
import type { G } from "./paint";
import type { Scene } from "./scene";
import { drawVisitor, type VisitorPose } from "./visitor";

export interface SceneView {
  states: ReadonlyMap<string, ObjState>;
  /** The Visitor, if it's here. */
  visitor?: { pose: VisitorPose; hat?: boolean } | null;
  /** Seconds (for little animations). */
  t: number;
}

/** The Visitor is drawn among the objects at this depth (in front of the room, behind the foreground). */
const VISITOR_Z = 6;

export function drawScene(g: G, scene: Scene, view: SceneView) {
  g.save();
  g.beginPath();
  g.rect(0, 0, VIEW_W, VIEW_H);
  g.clip();
  scene.room(g);
  const objects = [...scene.objects].sort((a, b) => a.z - b.z);
  let visitorDrawn = false;
  const visitor = () => {
    if (visitorDrawn || !view.visitor || !scene.visitor) return;
    visitorDrawn = true;
    const v = scene.visitor;
    drawVisitor(g, v.x, v.y, v.scale, view.visitor.pose, view.visitor.hat);
  };
  for (const o of objects) {
    if (o.z >= VISITOR_Z) visitor();
    const s = view.states.get(o.id) ?? o.base;
    if (!s.visible) continue;
    scene.draw[o.kind]?.(g, s, view.t);
  }
  visitor();
  scene.light?.(g, view.states);
  g.restore();
}
