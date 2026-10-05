// The Anomaly Director (Plan/14-dont-blink.md §12): what changes, and where. It keeps a budget that fills at
// the night's rate, and spends it when your eyes are shut (or the static or a power cut covers the screen). It
// picks a camera first (spread out: rooms that already have changes are less likely; on Night 1 the room you're
// watching is likelier, so you see the trick; on Night 5 it favours rooms you haven't looked at), then a change
// in it, never on an object that's already changed. Pure: it's handed a random source.
import type { Rng } from "@/engine/rng";
import { ANOMALIES, slotOf } from "./catalogue";
import { seconds } from "./constants";
import type { AnomalyDef, CameraId, NightConfig } from "./types";

/** What covered the screen: a blink, a long blink, camera static, a power cut. */
export type Closure = "blink" | "long" | "static" | "flicker";

/** The changes a night allows at all: blink changes, or slow ones. */
export function eligible(config: NightConfig, { colour, gradual }: { colour: boolean; gradual: boolean }): AnomalyDef[] {
  const office = config.features.includes("officeAnomalies");
  const mirror = config.features.includes("mirror");
  return ANOMALIES.filter((a) => {
    if (!config.cameras.includes(a.camera)) return false;
    if (a.camera === "office" && !office) return false;
    if (a.type === "mirror" && !mirror) return false;
    if (a.colour && !colour) return false;
    if (gradual) return !!a.gradual;
    if (a.gradual) return false;
    return a.subtlety >= config.subtlety[0] && a.subtlety <= config.subtlety[1];
  });
}

export interface PickContext {
  config: NightConfig;
  /** Taken slots: objects with a change, views that are mirrored. */
  busy: ReadonlySet<string>;
  /** Changes waiting in each camera. */
  activeIn: (camera: CameraId) => number;
  /** The camera on screen (null: none). */
  watching: CameraId | null;
  /** Ticks since a camera was last on screen. */
  unseen: (camera: CameraId) => number;
  /** Changes that can't happen right now (the corridor's figure while the Visitor's in the way…). */
  blocked?: (a: AnomalyDef) => boolean;
}

/** How likely a change is to land in this camera. */
export function cameraWeight(camera: CameraId, ctx: PickContext, closure: Closure | "gradual", prefer: CameraId | null): number {
  let w = 1 / (1 + ctx.activeIn(camera));
  if (camera === "office") w *= 0.6;
  if (ctx.config.features.includes("itKnows")) {
    // It knows where you aren't looking (§5, Night 5).
    w *= 1 + Math.min(3, ctx.unseen(camera) / seconds(15));
    if (camera === ctx.watching) w *= 0.5;
  } else if (camera === prefer) {
    w *= closure === "flicker" ? 4 : ctx.config.night === 1 ? 3 : 2;
  }
  return w;
}

/** Pick one change from the pool, or null if nothing's free. */
export function pickAnomaly(rng: Rng, pool: readonly AnomalyDef[], ctx: PickContext, closure: Closure | "gradual", prefer: CameraId | null): AnomalyDef | null {
  const free = pool.filter((a) => !ctx.busy.has(slotOf(a)) && !ctx.blocked?.(a));
  if (free.length === 0) return null;
  const cameras = [...new Set(free.map((a) => a.camera))];
  const weights = cameras.map((c) => cameraWeight(c, ctx, closure, prefer));
  const total = weights.reduce((s, w) => s + w, 0);
  let roll = rng() * total;
  let camera = cameras[cameras.length - 1]!;
  for (let i = 0; i < cameras.length; i++) {
    roll -= weights[i]!;
    if (roll < 0) {
      camera = cameras[i]!;
      break;
    }
  }
  const choices = free.filter((a) => a.camera === camera);
  return choices[Math.floor(rng() * choices.length)]!;
}
