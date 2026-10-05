// The nights (Plan/14-dont-blink.md §5): what each one brings. Night 1 is three cameras, slow blinks and big
// obvious changes; Night 2 opens all five cameras and wakes the Visitor; Night 3 makes camera static hide
// changes too; Night 4 brings doubt (fake blinks, slow changes, your own office); Night 5 knows where you
// aren't looking. Endless climbs an hour at a time; Custom is whatever you set.
import { CAMERAS, type CameraId, type NightConfig, type NightFeature } from "./types";

export const NIGHTS: readonly NightConfig[] = [
  {
    night: 1,
    blink: [5, 6.5],
    hour: 50,
    rate: 3,
    maxActive: 5,
    subtlety: [1, 2],
    visitor: 0,
    cameras: ["lobby", "gallery", "sculpture"],
    features: [],
    credibility: [4, 7],
    photos: 5,
  },
  {
    night: 2,
    blink: [4.5, 6],
    hour: 60,
    rate: 4,
    maxActive: 5,
    subtlety: [1, 3],
    visitor: 0.35,
    cameras: CAMERAS,
    features: [],
    credibility: [3, 6],
    photos: 4,
  },
  {
    night: 3,
    blink: [4, 5.5],
    hour: 65,
    rate: 4.5,
    maxActive: 5,
    subtlety: [1, 4],
    visitor: 0.45,
    cameras: CAMERAS,
    features: ["staticBlink", "flicker"],
    credibility: [3, 5],
    photos: 4,
  },
  {
    night: 4,
    blink: [4, 5.5],
    hour: 70,
    rate: 4.6,
    maxActive: 5,
    subtlety: [2, 4],
    visitor: 0.5,
    cameras: [...CAMERAS, "office"],
    features: ["staticBlink", "flicker", "fakeBlink", "gradual", "officeAnomalies"],
    credibility: [3, 5],
    photos: 4,
  },
  {
    night: 5,
    blink: [3.5, 5],
    hour: 75,
    rate: 5.5,
    maxActive: 5,
    subtlety: [2, 5],
    visitor: 0.65,
    cameras: [...CAMERAS, "office"],
    features: ["staticBlink", "flicker", "fakeBlink", "gradual", "officeAnomalies", "mirror", "itKnows", "lyingHud", "misdirection"],
    credibility: [3, 5],
    photos: 3,
  },
];

export const nightConfig = (n: number): NightConfig => NIGHTS[Math.max(0, Math.min(NIGHTS.length - 1, n - 1))]!;

/** Endless Night: every hour a little harder, until it's Night 5 and then some. */
export function endlessHour(hour: number): NightConfig {
  const base = nightConfig(Math.min(5, 2 + Math.floor(hour / 2)));
  const extra = Math.max(0, hour - 6);
  return {
    ...base,
    night: 0,
    hour: 60,
    rate: base.rate + extra * 0.75,
    cooldown: Math.max(2.5, 5 - extra * 0.25),
    visitor: Math.min(0.9, base.visitor + extra * 0.05),
    blink: [Math.max(2.8, base.blink[0] - extra * 0.15), Math.max(3.6, base.blink[1] - extra * 0.15)],
    // No lying HUD in Endless: the clock has to count your hours honestly.
    features: base.features.filter((f) => f !== "lyingHud"),
  };
}

export interface CustomNight {
  /** Seconds between blinks (the middle of the range). */
  blink: number;
  /** 0–1. */
  visitor: number;
  /** New anomalies an hour. */
  rate: number;
  /** The subtlest anomalies allowed (1–5). */
  subtlety: number;
  staticBlink: boolean;
  fakeBlink: boolean;
  gradual: boolean;
  office: boolean;
  mirror: boolean;
}

export const DEFAULT_CUSTOM: CustomNight = { blink: 5, visitor: 0.4, rate: 4, subtlety: 3, staticBlink: false, fakeBlink: false, gradual: false, office: false, mirror: false };

export function customNight(c: CustomNight): NightConfig {
  const features: NightFeature[] = [];
  if (c.staticBlink) features.push("staticBlink", "flicker");
  if (c.fakeBlink) features.push("fakeBlink");
  if (c.gradual) features.push("gradual");
  if (c.office) features.push("officeAnomalies");
  if (c.mirror) features.push("mirror");
  const cameras: CameraId[] = c.office ? [...CAMERAS, "office"] : [...CAMERAS];
  return {
    night: 0,
    blink: [Math.max(2, c.blink - 0.75), c.blink + 0.75],
    hour: 60,
    rate: c.rate,
    maxActive: 5,
    subtlety: [1, Math.max(1, Math.min(5, Math.round(c.subtlety)))],
    visitor: c.visitor,
    cameras,
    features,
    credibility: [3, 5],
    photos: 3,
  };
}
