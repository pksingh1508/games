// Global comfort settings, respected by the site and by every game (Plan/README.md).
import * as v from "valibot";
import { defineSave, type SaveDef } from "./save/define-save";

const Volume = v.pipe(v.number(), v.minValue(0), v.maxValue(1));

/** The tap offset can't be set outside this range (milliseconds). */
export const TAP_OFFSET_RANGE = [-200, 400] as const;

const SettingsV2 = v.object({
  v: v.literal(2),
  /** Master sound switch (the speaker button in the header). */
  sound: v.boolean(),
  volume: v.object({ master: Volume, music: Volume, sfx: Volume }),
  /** "system" follows the device setting. */
  motion: v.picklist(["system", "reduce", "full"]),
  reduceFlashing: v.boolean(),
  jumpScares: v.boolean(),
  textSize: v.picklist(["normal", "large", "xl"]),
  colorblind: v.picklist(["off", "deuteranopia", "protanopia", "tritanopia"]),
  /**
   * How late taps land on this device, in milliseconds (touch delay, Bluetooth audio…). Measured
   * by a rhythm game's calibration screen; null until then.
   */
  tapOffsetMs: v.nullable(v.pipe(v.number(), v.minValue(TAP_OFFSET_RANGE[0]), v.maxValue(TAP_OFFSET_RANGE[1]))),
});

export type Settings = v.InferOutput<typeof SettingsV2>;
export type MotionSetting = Settings["motion"];

export const DEFAULT_SETTINGS: Settings = {
  v: 2,
  sound: true,
  volume: { master: 0.8, music: 0.7, sfx: 0.8 },
  motion: "system",
  reduceFlashing: false,
  jumpScares: false,
  textSize: "normal",
  colorblind: "off",
  tapOffsetMs: null,
};

export const settingsDefinition: SaveDef<Settings> = {
  key: "mfg:settings",
  version: 2,
  schema: SettingsV2,
  migrations: {
    // v2 adds the tap timing offset (One Tap Chaos's calibration).
    1: (old: Record<string, unknown>) => ({ ...old, v: 2, tapOffsetMs: null }),
  },
  defaults: () => structuredClone(DEFAULT_SETTINGS),
  debounceMs: 150,
};

export const settingsSave = defineSave(settingsDefinition);

function setAttr(el: HTMLElement, name: string, value: string | null) {
  if (value === null) el.removeAttribute(name);
  else el.setAttribute(name, value);
}

/** Mirror settings onto <html> data attributes, which CSS and games read. */
export function applySettingsToDocument(settings: Settings) {
  const root = document.documentElement;
  setAttr(root, "data-motion", settings.motion === "system" ? null : settings.motion);
  setAttr(root, "data-reduce-flashing", settings.reduceFlashing ? "" : null);
  setAttr(root, "data-text-size", settings.textSize === "normal" ? null : settings.textSize);
  setAttr(root, "data-colorblind", settings.colorblind === "off" ? null : settings.colorblind);
}

/**
 * Runs in <head> before the first paint (see "Preventing flash before hydration" in the
 * Next.js docs), so comfort settings apply before anything moves on screen.
 */
export const SETTINGS_BOOT_SCRIPT = `(function(){try{var s=JSON.parse(localStorage.getItem("mfg:settings")||"null");if(!s)return;var d=document.documentElement;if(s.motion==="reduce"||s.motion==="full")d.setAttribute("data-motion",s.motion);if(s.reduceFlashing)d.setAttribute("data-reduce-flashing","");if(s.textSize==="large"||s.textSize==="xl")d.setAttribute("data-text-size",s.textSize);if(s.colorblind&&s.colorblind!=="off")d.setAttribute("data-colorblind",s.colorblind)}catch(e){}})();`;

/** True when animations should be calmed down, from the setting or the device. */
export function prefersReducedMotion(settings: Settings): boolean {
  if (settings.motion === "reduce") return true;
  if (settings.motion === "full") return false;
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}
