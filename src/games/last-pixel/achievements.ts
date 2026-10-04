// Last Pixel's achievements (Plan/10-last-pixel.md §7), kept in the game's save and announced through the
// arcade's achievement toasts.
import { defineGameAchievements } from "@/games/shared/achievements";
import type { AchievementId } from "./core/progress";
import { lastPixelSave } from "./save";

export const PIXEL_ACHIEVEMENTS = [
  { id: "perfectionist", title: "Perfectionist", description: "Three stars on every level of a world.", hint: "A whole world. Every star." },
  { id: "gotcha", title: "Gotcha", description: "Caught Pix in under two seconds.", hint: "Be quicker than it is. (No assist.)" },
  { id: "not-my-monitor", title: "Not My Monitor", description: "Saw through the dead pixel by pausing the game.", hint: "A real dead pixel would still be there if you paused…" },
  { id: "net-worth", title: "Net Worth", description: "Caught Pix in the net 25 times.", hint: "Shift-drag. Quickly. Twenty-five times." },
  { id: "logo-complete", title: "Logo Complete", description: "Finished the finale: the dot's back on the i.", hint: "Something's missing from the title." },
  { id: "tab-hunter", title: "Tab Hunter", description: "Caught Pix in the tab escape.", hint: "The bonus level. Keep an eye on your browser tab." },
] as const satisfies ReadonlyArray<{ id: AchievementId; title: string; description: string; hint: string }>;

const achievements = defineGameAchievements({
  game: "Last Pixel",
  prefix: "last-pixel",
  list: PIXEL_ACHIEVEMENTS,
  celebrate: ["logo-complete", "perfectionist"],
  save: lastPixelSave,
});

export const unlockPixelAchievement = achievements.unlock;
