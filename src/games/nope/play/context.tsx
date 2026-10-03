"use client";

// Shared plumbing between the play screen and the questions:
// - `paused`: menus, a hidden tab and answer animations all stop the clocks (Plan/02-nope.md §10.5)
// - hotspots: the HUD, the host and the stage are clickable, and a question can claim them
// - <OnStage>: questions can put things anywhere on the stage, outside their card
import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useSave } from "@/engine/save";
import { prefersReducedMotion, settingsSave } from "@/engine/settings";

/** Things outside the question card that can be clicked (secret rule 2). */
export type HotspotName = "host" | "hearts" | "counter" | "logo" | "skip" | "fuse" | "sky" | "stage";
/** Return true when the question handled the click. */
export type HotspotHandler = (detail: { index?: number }) => boolean | void;

export interface PlayContextValue {
  paused: boolean;
  /** Overlay layer covering the whole stage. */
  stage: HTMLElement | null;
  registerHotspot(name: HotspotName, handler: HotspotHandler): () => void;
}

const PlayContext = createContext<PlayContextValue | null>(null);

export function PlayProvider({ value, children }: { value: PlayContextValue; children?: ReactNode }) {
  return <PlayContext.Provider value={value}>{children}</PlayContext.Provider>;
}

export function usePlay(): PlayContextValue {
  const value = useContext(PlayContext);
  if (!value) throw new Error("usePlay() must be used inside the play screen");
  return value;
}

/** Listen to clicks on a HUD element, the host, the sky… while this question is on screen. */
export function useHotspot(name: HotspotName, handler: HotspotHandler, enabled = true) {
  const { registerHotspot } = usePlay();
  const onFire = useEffectEvent(handler);
  useEffect(() => {
    if (!enabled) return;
    return registerHotspot(name, (detail) => onFire(detail));
  }, [registerHotspot, name, enabled]);
}

/** Render children on the stage overlay (anywhere on screen, not just in the card). */
export function OnStage({ children }: { children: ReactNode }) {
  const { stage } = usePlay();
  return stage ? createPortal(children, stage) : null;
}

// ---------------------------------------------------------------------------------------------
// Clocks that respect pausing. Built on performance.now() in effects, never during render.
// ---------------------------------------------------------------------------------------------

/** Calls `onDone` once after `ms` of unpaused time. Pass null to disarm. */
export function useGameTimeout(ms: number | null, onDone: () => void) {
  const { paused } = usePlay();
  const done = useEffectEvent(onDone);
  const remaining = useRef<number | null>(ms);

  useEffect(() => {
    remaining.current = ms;
  }, [ms]);

  useEffect(() => {
    if (paused || remaining.current === null) return;
    const started = performance.now();
    const timer = setTimeout(() => {
      remaining.current = null;
      done();
    }, remaining.current);
    return () => {
      clearTimeout(timer);
      if (remaining.current !== null) remaining.current = Math.max(0, remaining.current - (performance.now() - started));
    };
  }, [paused, ms]);
}

/** Counts down `ms` of unpaused time, re-rendering as it goes. Returns the milliseconds left. */
export function useGameCountdown(ms: number, onDone: () => void, enabled = true): number {
  const { paused } = usePlay();
  const done = useEffectEvent(onDone);
  const [left, setLeft] = useState(ms);
  const leftRef = useRef(ms);

  useEffect(() => {
    if (paused || !enabled || leftRef.current <= 0) return;
    let last = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      leftRef.current = Math.max(0, leftRef.current - (now - last));
      last = now;
      setLeft(leftRef.current);
      if (leftRef.current <= 0) {
        done();
        return;
      }
      frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [paused, enabled]);

  return left;
}

// ---------------------------------------------------------------------------------------------
// Device and comfort.
// ---------------------------------------------------------------------------------------------

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

/** Comfort settings that change how questions look and move. */
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
