// The shapes of Don't Blink's world (Plan/14-dont-blink.md §12 "Data model"): the cameras, the objects in each
// room and their states, the anomalies (each one a single change to one object), and a night's settings.

export type CameraId = "lobby" | "gallery" | "sculpture" | "storage" | "corridor" | "office";

/** The five museum cameras, in their button order (the office is your own room, not a camera). */
export const CAMERAS: readonly CameraId[] = ["lobby", "gallery", "sculpture", "storage", "corridor"];

export const CAMERA_NAMES: Record<CameraId, string> = {
  lobby: "Lobby",
  gallery: "Gallery",
  sculpture: "Sculpture Hall",
  storage: "Storage",
  corridor: "Corridor",
  office: "Your Office",
};

export type AnomalyType = "moved" | "missing" | "extra" | "changed" | "intruder" | "light" | "door" | "count" | "mirror";

export const ANOMALY_TYPES: readonly AnomalyType[] = ["moved", "missing", "extra", "changed", "intruder", "light", "door", "count", "mirror"];

/** What each type is called on the report buttons, and what it means. */
export const ANOMALY_INFO: Record<AnomalyType, { label: string; about: string }> = {
  moved: { label: "Moved", about: "It's somewhere else now" },
  missing: { label: "Missing", about: "It's gone" },
  extra: { label: "Extra", about: "Something new is here" },
  changed: { label: "Changed", about: "It looks different" },
  intruder: { label: "Intruder", about: "Someone's here who shouldn't be" },
  light: { label: "Light", about: "A light's on, or off" },
  door: { label: "Door", about: "A door's open, or shut" },
  count: { label: "Count", about: "One more, or one fewer" },
  mirror: { label: "Mirror", about: "The whole picture is flipped" },
};

/** One object's state: where it is, whether it's there, which version of it. */
export interface ObjState {
  x: number;
  y: number;
  visible: boolean;
  variant: string;
  /** For slow colour changes: 0 is its usual colour, 1 the other. */
  tint: number;
}

/** Something in a room. Scene units: every camera is 640 × 400, y down. (x, y) is the object's anchor. */
export interface ObjectDef {
  /** Unique across the museum, e.g. "gallery.lady". */
  id: string;
  camera: CameraId;
  /** For messages: "the portrait of the lady". */
  name: string;
  /** Which drawing (render/objects.ts). */
  kind: string;
  base: ObjState;
  /** The area you click to report it, around its anchor: [left, top, right, bottom] offsets. */
  hit: readonly [number, number, number, number];
  /** Drawing order (back to front). */
  z: number;
}

export interface AnomalyDef {
  id: string;
  camera: CameraId;
  /** The object it changes, or "@view" for the whole picture (a mirror). */
  object: string;
  type: AnomalyType;
  /** 1 is obvious (a whole statue gone), 5 very subtle (one book fewer). */
  subtlety: 1 | 2 | 3 | 4 | 5;
  /** The change. */
  set: Partial<ObjState>;
  /** Other report types that count as right (§10 rule 6: flexible matching for ambiguous cases). */
  accept?: readonly AnomalyType[];
  /** A change of colour (these can be switched off, §11). */
  colour?: boolean;
  /** A slow change (Night 4 on): it creeps in over this many seconds, with no blink at all. */
  gradual?: number;
}

export type NightFeature = "staticBlink" | "flicker" | "fakeBlink" | "gradual" | "officeAnomalies" | "mirror" | "itKnows" | "lyingHud" | "misdirection";

export interface NightConfig {
  /** 1–5, 0 for Endless and Custom. */
  night: number;
  /** Seconds between blinks. */
  blink: readonly [number, number];
  /** Seconds of play per hour (00:00 to 06:00 is six of them). */
  hour: number;
  /** New anomalies an hour. */
  rate: number;
  /** Unreported anomalies at once that end the night. */
  maxActive: number;
  subtlety: readonly [number, number];
  /** 0: the Visitor stays put. 1: as restless as it gets. */
  visitor: number;
  cameras: readonly CameraId[];
  features: readonly NightFeature[];
  /** False reports in an hour: a warning at the first, fired at the second. */
  credibility: readonly [number, number];
  /** Reference photos for the night. */
  photos: number;
  /** Seconds between two changes, at least (Endless shortens it). Default ANOMALY_COOLDOWN. */
  cooldown?: number;
}
