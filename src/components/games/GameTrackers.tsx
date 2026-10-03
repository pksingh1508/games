"use client";

import { useEffect } from "react";
import { unlockAchievement } from "@/engine/achievements";
import { markGameViewed } from "@/engine/meta";
import { GAME_SLUGS } from "@/games/slugs";

/** Counts game pages seen, for the "Window Shopper" achievement. */
export function GameViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    if (markGameViewed(slug) >= GAME_SLUGS.length) unlockAchievement("window-shopper");
  }, [slug]);
  return null;
}

/** Pressing Start on a game that isn't built yet. */
export function EagerTracker() {
  useEffect(() => {
    const timer = setTimeout(() => unlockAchievement("too-eager"), 900);
    return () => clearTimeout(timer);
  }, []);
  return null;
}

/** Landing on a page that doesn't exist. */
export function WrongDoorTracker() {
  useEffect(() => {
    const timer = setTimeout(() => unlockAchievement("wrong-door"), 900);
    return () => clearTimeout(timer);
  }, []);
  return null;
}
