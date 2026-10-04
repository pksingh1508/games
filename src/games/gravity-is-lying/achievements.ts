// Gravity Is Lying's achievements (Plan/15-gravity-is-lying.md §7), kept in the game's save and
// announced through the arcade's achievement toasts.
import { defineGameAchievements } from "@/games/shared/achievements";
import type { AchievementId } from "./core/progress";
import { gravitySave } from "./save";

export const GRAVITY_ACHIEVEMENTS = [
  {
    id: "upside-downer",
    title: "Upside Downer",
    description: "Spent ten minutes walking on ceilings.",
    hint: "The view is better from up there.",
  },
  {
    id: "never-trusted-the-arrow",
    title: "Never Trusted the Arrow",
    description: "Cleared every room of the Liar's Gallery without dying.",
    hint: "In the gallery, the arrow lies. You don't have to fall for it.",
  },
  {
    id: "ground-control",
    title: "Ground Control",
    description: "Cleared every room of Tilted Town with the camera turning.",
    hint: "Keep reduce motion off in Tilted Town, if you can stomach it.",
  },
  {
    id: "orbital",
    title: "Orbital",
    description: "Landed on three different planetoids in a row without dying.",
    hint: "Hop, hop, hop. Don't look down (there isn't one).",
  },
  {
    id: "apple-picker",
    title: "Apple Picker",
    description: "Collected every golden apple.",
    hint: "Three in every room. Some are where you'd never look: up.",
  },
  {
    id: "fell-up",
    title: "Fell Up",
    description: "Reached Isaac at the top of his tree.",
    hint: "Finish the game. Gravity was lying all along.",
  },
] as const satisfies ReadonlyArray<{ id: AchievementId; title: string; description: string; hint: string }>;

const achievements = defineGameAchievements({
  game: "Gravity Is Lying",
  prefix: "gravity-is-lying",
  list: GRAVITY_ACHIEVEMENTS,
  celebrate: ["never-trusted-the-arrow", "ground-control", "apple-picker", "fell-up"],
  save: gravitySave,
});

export const unlockGravityAchievement = achievements.unlock;
