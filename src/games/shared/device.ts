// Device and comfort hooks shared by the games: the kind of pointer, the screen's orientation, a
// hidden tab, and the arcade's comfort settings (Plan/README.md › Global settings).
import { useSyncExternalStore } from "react";
import { useSave } from "@/engine/save";
import { prefersReducedMotion, settingsSave } from "@/engine/settings";

function mediaStore(query: string) {
  return {
    subscribe(onChange: () => void) {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    get: () => window.matchMedia(query).matches,
  };
}

const coarseStore = mediaStore("(pointer: coarse)");
const portraitStore = mediaStore("(max-aspect-ratio: 1/1)");
const reducedMotionStore = mediaStore("(prefers-reduced-motion: reduce)");

/** The main pointer is a finger. */
export const useCoarsePointer = () => useSyncExternalStore(coarseStore.subscribe, coarseStore.get, () => false);

/** The screen is taller than it is wide. */
export const usePortrait = () => useSyncExternalStore(portraitStore.subscribe, portraitStore.get, () => false);

const hiddenStore = {
  subscribe(onChange: () => void) {
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  },
  get: () => document.visibilityState === "hidden",
};

export const useDocumentHidden = () => useSyncExternalStore(hiddenStore.subscribe, hiddenStore.get, () => false);

/** Comfort settings that change how games look and move. */
export function useComfort() {
  const settings = useSave(settingsSave);
  // Subscribed so a change to the device setting re-renders; the value itself comes from settings.
  useSyncExternalStore(reducedMotionStore.subscribe, reducedMotionStore.get, () => false);
  return {
    reducedMotion: prefersReducedMotion(settings),
    reduceFlashing: settings.reduceFlashing,
    colorblind: settings.colorblind !== "off",
  };
}
