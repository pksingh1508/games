"use client";

// How scenes reach the director (and the shell's bits: the layout, the touch pad's jump label, the fake pause
// menu's button).
import { createContext, useContext, useSyncExternalStore } from "react";
import type { Director, DirectorView } from "../play/director";

export interface GameContext {
  director: Director;
  /** "tall": a phone held upright (HELPER on a strip, panels under the picture). */
  layout: "wide" | "tall";
  touch: boolean;
  reducedMotion: boolean;
  reduceFlashing: boolean;
  /** The monitor's screen element. */
  screen: { current: HTMLDivElement | null };
  /** The game is fullscreen (for real). */
  fullscreen: boolean;
}

export const Game = createContext<GameContext | null>(null);

export function useGame(): GameContext {
  const g = useContext(Game);
  if (!g) throw new Error("Not inside Don't Trust The Game");
  return g;
}

export function useDirectorView(director: Director): DirectorView {
  return useSyncExternalStore(director.store.subscribe, director.store.get, director.store.get);
}
