// Cursor Escape's achievements (Plan/12-cursor-escape.md §7), kept in the game's save and announced
// through the arcade's achievement toasts.
import { defineGameAchievements } from "@/games/shared/achievements";
import type { AchievementId } from "./core/progress";
import { cursorSave } from "./save";

export const CURSOR_ACHIEVEMENTS = [
  { id: "steady-hand", title: "Steady Hand", description: "Cleared every window of a drive without a crash.", hint: "A whole drive, and not one wall touched." },
  { id: "ambidextrous", title: "Ambidextrous", description: "Got through five inverted stretches without crashing.", hint: "Left is right. Five times." },
  { id: "identity-crisis", title: "Identity Crisis", description: "Found yourself among the decoys within a second.", hint: "Four cursors. One of them is you. Quickly." },
  { id: "speed-clicker", title: "Speed Clicker", description: "Escaped C:\\-01 in under three seconds.", hint: "The very first window, very fast." },
  { id: "uninstall-denied", title: "Uninstall Denied", description: "Beat The Uninstaller.", hint: "It's at the very end of System32." },
  { id: "free-at-last", title: "Free at Last", description: "Saw the ending.", hint: "Close DeskOS 98 itself." },
] as const satisfies ReadonlyArray<{ id: AchievementId; title: string; description: string; hint: string }>;

const achievements = defineGameAchievements({
  game: "Cursor Escape",
  prefix: "cursor-escape",
  list: CURSOR_ACHIEVEMENTS,
  celebrate: ["uninstall-denied", "free-at-last", "steady-hand"],
  save: cursorSave,
});

export const unlockCursorAchievement = achievements.unlock;
