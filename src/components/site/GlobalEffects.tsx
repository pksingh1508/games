"use client";

import { useEffect } from "react";
import { ACHIEVEMENT_EVENT, unlockAchievement, type AchievementNotice } from "@/engine/achievements";
import { playSound, type UISound } from "@/engine/audio/ui-sound";
import { recordVisit } from "@/engine/meta";
import { STORAGE_ERROR_EVENT } from "@/engine/save";
import { applySettingsToDocument, prefersReducedMotion, settingsSave } from "@/engine/settings";
import { toast } from "@/components/ui/toast-store";

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

async function celebrate() {
  const settings = settingsSave.get();
  if (prefersReducedMotion(settings) || settings.reduceFlashing) return;
  const confetti = (await import("canvas-confetti")).default;
  void confetti({
    particleCount: 90,
    spread: 75,
    startVelocity: 42,
    origin: { y: 0.75 },
    colors: ["#FF3D7F", "#C6FF3D", "#3DE0FF", "#FFB020", "#F5F1E8"],
    disableForReducedMotion: true,
  });
}

/** Site-wide behaviour that has no UI of its own. Mounted once in the root layout. */
export function GlobalEffects() {
  // Comfort settings → <html> data attributes (the inline head script handles the first paint).
  useEffect(() => {
    applySettingsToDocument(settingsSave.get());
    return settingsSave.subscribe(() => applySettingsToDocument(settingsSave.get()));
  }, []);

  // Visits + the welcome achievement.
  useEffect(() => {
    recordVisit();
    // Re-armed on every load (unlocking is idempotent), so a quick reload can't swallow it.
    const timer = setTimeout(() => unlockAchievement("insert-coin"), 1400);
    return () => clearTimeout(timer);
  }, []);

  // Achievement toasts.
  useEffect(() => {
    const onUnlock = (event: Event) => {
      const notice = (event as CustomEvent<AchievementNotice>).detail;
      toast({
        kind: "achievement",
        eyebrow: notice.game ? `${notice.game} · Achievement` : undefined,
        title: notice.title,
        description: notice.description,
        duration: 6000,
      });
      playSound("success");
      if (notice.celebrate) void celebrate();
    };
    window.addEventListener(ACHIEVEMENT_EVENT, onUnlock);
    return () => window.removeEventListener(ACHIEVEMENT_EVENT, onUnlock);
  }, []);

  // One listener plays every button sound (elements opt in with data-sound="...").
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>("[data-sound]");
      const sound = target?.dataset.sound as UISound | undefined;
      if (sound) playSound(sound);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // ↑ ↑ ↓ ↓ ← → ← → B A
  useEffect(() => {
    let position = 0;
    const onKey = (event: KeyboardEvent) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      position = key === KONAMI[position] ? position + 1 : key === KONAMI[0] ? 1 : 0;
      if (position === KONAMI.length) {
        position = 0;
        if (!unlockAchievement("up-up-down-down")) void celebrate();
        toast({ kind: "info", title: "+30 lives", description: "Not that you'll need them. Probably." });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Saving failed (full storage, or a private mode that blocks it): say so once.
  useEffect(() => {
    let warned = false;
    const onError = () => {
      if (warned) return;
      warned = true;
      toast({
        kind: "warning",
        title: "Progress can't be saved here",
        description: "This browser mode is blocking storage. You can still play, but nothing will be remembered.",
        duration: 0,
      });
    };
    window.addEventListener(STORAGE_ERROR_EVENT, onError);
    return () => window.removeEventListener(STORAGE_ERROR_EVENT, onError);
  }, []);

  return null;
}
