// Site achievements. Stored locally in the meta save; unlocking fires a window event that the
// achievement toaster listens to.
import { metaSave } from "./meta";

export const ACHIEVEMENTS = [
  { id: "insert-coin", title: "Insert Coin", description: "Found the arcade.", hint: "Just show up." },
  {
    id: "spot-the-tell",
    title: "Spot the Tell",
    description: "Found the biggest button on the front page.",
    hint: "Read the question literally.",
  },
  {
    id: "fell-for-it",
    title: "Fell For It",
    description: "Got NOPE'd on the front page.",
    hint: "Pick the obvious answer.",
  },
  {
    id: "window-shopper",
    title: "Window Shopper",
    description: "Looked at every cabinet in the arcade.",
    hint: "Visit all 15 game pages.",
  },
  {
    id: "too-eager",
    title: "Too Eager",
    description: "Tried to play a game that's still in the workshop.",
    hint: "Press Start on an unfinished game.",
  },
  {
    id: "comfort-zone",
    title: "Comfort Zone",
    description: "Changed a setting to suit you.",
    hint: "Visit the options menu.",
  },
  {
    id: "safe-keeper",
    title: "Safe Keeper",
    description: "Exported a backup of your save data.",
    hint: "Your Data has a button for this.",
  },
  {
    id: "wrong-door",
    title: "Wrong Door",
    description: "Opened a door that doesn't exist.",
    hint: "Visit a page that isn't there.",
  },
  {
    id: "up-up-down-down",
    title: "Up Up Down Down",
    description: "Entered a very old code.",
    hint: "↑ ↑ ↓ ↓ ← → ← → B A",
  },
] as const;

export type AchievementId = (typeof ACHIEVEMENTS)[number]["id"];
export type Achievement = (typeof ACHIEVEMENTS)[number];

export const ACHIEVEMENT_EVENT = "mfg:achievement";

export function getAchievement(id: AchievementId): Achievement {
  return ACHIEVEMENTS.find((a) => a.id === id)!;
}

/** Unlock an achievement once. Returns true if it was newly unlocked. */
export function unlockAchievement(id: AchievementId): boolean {
  if (typeof window === "undefined") return false;
  if (metaSave.get().achievements[id]) return false;
  metaSave.update((meta) => ({ ...meta, achievements: { ...meta.achievements, [id]: Date.now() } }));
  window.dispatchEvent(new CustomEvent<{ id: AchievementId }>(ACHIEVEMENT_EVENT, { detail: { id } }));
  return true;
}
