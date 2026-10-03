import { useSyncExternalStore } from "react";
import type { SaveSlot } from "./define-save";

/**
 * Read a save in React. While prerendering and during hydration it returns the
 * defaults, then switches to the real stored value without a hydration mismatch.
 */
export function useSave<T>(slot: SaveSlot<T>): T {
  return useSyncExternalStore(slot.subscribe, slot.get, slot.getServerSnapshot);
}
