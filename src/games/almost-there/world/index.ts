// The whole mountain (Plan/08-almost-there.md §5): nine zones, 45 screens, plus the sky above the
// fake summit that only its credits ever see. Built once (and once more, mirrored, for New Game+).
import { buildMountain, type Mountain, type ScreenSource, type ZoneId } from "../core/mountain";
import { FOOTHILLS } from "./zone1";
import { ROOFTOPS } from "./zone2";
import { CLOCKTOWER } from "./zone3";
import { CLIFFS } from "./zone4";
import { ICE } from "./zone5";
import { FAKE_SUMMIT } from "./zone6";
import { INSIDE } from "./zone7";
import { SKY } from "./zone8";
import { ALMOST_THERE } from "./zone9";

export const SCREENS: readonly ScreenSource[] = [...FOOTHILLS, ...ROOFTOPS, ...CLOCKTOWER, ...CLIFFS, ...ICE, ...FAKE_SUMMIT, ...INSIDE, ...SKY, ...ALMOST_THERE];

export interface ZoneInfo {
  id: ZoneId;
  name: string;
  /** Plan §5's number (1–9). */
  index: number;
}

/** In climbing order, bottom to top. */
export const ZONES: readonly ZoneInfo[] = [
  { id: "foothills", name: "The Foothills", index: 1 },
  { id: "rooftops", name: "Old Town Rooftops", index: 2 },
  { id: "clocktower", name: "The Clocktower", index: 3 },
  { id: "cliffs", name: "Windy Cliffs", index: 4 },
  { id: "ice", name: "Ice Cavern", index: 5 },
  { id: "fake-summit", name: "The Summit", index: 6 },
  { id: "inside", name: "Inside the Mountain", index: 7 },
  { id: "sky", name: "The Sky Ladder", index: 8 },
  { id: "summit", name: "Almost There", index: 9 },
];

export const zoneInfo = (id: ZoneId) => ZONES.find((z) => z.id === id)!;

const built = new Map<boolean, Mountain>();

/** The mountain, or Mirror Mountain (built once each). */
export function getMountain(mirrored = false): Mountain {
  let m = built.get(mirrored);
  if (!m) {
    m = buildMountain(SCREENS, { mirrored });
    built.set(mirrored, m);
  }
  return m;
}

/** How many screens the climb has (scenery doesn't count). */
export const PLAYABLE_SCREENS = SCREENS.filter((s) => !s.scenery).length;
