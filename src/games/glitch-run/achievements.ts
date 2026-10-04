// Glitch Run's achievements (Plan/07-glitch-run.md §7), kept in the game's save and announced through
// the arcade's achievement toasts.
import { defineGameAchievements } from "@/games/shared/achievements";
import type { AchievementId } from "./core/progress";
import { glitchSave } from "./save";

export const GLITCH_ACHIEVEMENTS = [
  { id: "living-dangerously", title: "Living Dangerously", description: "Ran for a minute above 80% corruption.", hint: "The multiplier glows brightest up there." },
  { id: "kernel-survivor", title: "Kernel Survivor", description: "Survived a Kernel Panic.", hint: "Let corruption reach 100%. Then keep running." },
  { id: "blind-faith", title: "Blind Faith", description: "Ran all the way through Not Responding.", hint: "The game didn't stop. Neither should you." },
  { id: "shadow-reader", title: "Shadow Reader", description: "Survived ten Screen Tears.", hint: "Your shadow knows where the floor is." },
  { id: "wontfix", title: "Wontfix", description: "Refused to be fixed.", hint: "At the root of it all, there's a question." },
  { id: "clean-code", title: "Clean Code", description: "Cleared a story stage without using Glitch.", hint: "No clipping. Not once." },
] as const satisfies ReadonlyArray<{ id: AchievementId; title: string; description: string; hint: string }>;

const achievements = defineGameAchievements({
  game: "Glitch Run",
  prefix: "glitch-run",
  list: GLITCH_ACHIEVEMENTS,
  celebrate: ["kernel-survivor", "wontfix", "blind-faith"],
  save: glitchSave,
});

export const unlockGlitchAchievement = achievements.unlock;
