// TrapSprint's achievements (Plan/06-trapsprint.md §7), kept in the game's save and announced
// through the arcade's achievement toasts.
import { defineGameAchievements } from "@/games/shared/achievements";
import type { AchievementId } from "./core/progress";
import { trapSprintSave } from "./save";

export const TRAPSPRINT_ACHIEVEMENTS = [
  {
    id: "fresh-meat",
    title: "Fresh Meat",
    description: "Died 10 times.",
    hint: "You'll get there. Faster than you think.",
  },
  {
    id: "collector",
    title: "Collector",
    description: "Died to every kind of trap.",
    hint: "Seventeen ways to go. Including yourself.",
  },
  {
    id: "read-the-room",
    title: "Read the Room",
    description: "Cleared a level on your very first try.",
    hint: "Look for the tells before you run.",
  },
  {
    id: "speed-demon",
    title: "Speed Demon",
    description: "Matched a Dev time.",
    hint: "The designer's best. Every frame counts.",
  },
  {
    id: "untouchable",
    title: "Untouchable",
    description: "Cleared a zone speedrun without dying.",
    hint: "Ten levels, one life's worth of nerve.",
  },
  {
    id: "paranoid",
    title: "Paranoid",
    description: "Jumped over painted spikes 20 times.",
    hint: "Flat. No shine. You jumped anyway.",
  },
  {
    id: "thousand-ways",
    title: "1,000 Ways",
    description: "Died 1,000 times.",
    hint: "Keep going.",
  },
] as const satisfies ReadonlyArray<{ id: AchievementId; title: string; description: string; hint: string }>;

const achievements = defineGameAchievements({
  game: "TrapSprint",
  prefix: "trapsprint",
  list: TRAPSPRINT_ACHIEVEMENTS,
  celebrate: ["speed-demon", "untouchable", "thousand-ways", "collector"],
  save: trapSprintSave,
});

export const unlockTrapSprintAchievement = achievements.unlock;
