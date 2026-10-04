// Almost There's achievements (Plan/08-almost-there.md §7), kept in the game's save and announced
// through the arcade's achievement toasts.
import { defineGameAchievements } from "@/games/shared/achievements";
import type { AchievementId } from "./core/records";
import { almostThereSave } from "./save";

export const ALMOST_THERE_ACHIEVEMENTS = [
  {
    id: "gravity-tourist",
    title: "Gravity Tourist",
    description: "Fell a total of 1 km.",
    hint: "Every metre down counts. All of them.",
  },
  {
    id: "fooled-once",
    title: "Fooled Once",
    description: "Reached the summit. The first one.",
    hint: "Plant your flag at the top.",
  },
  {
    id: "never-again",
    title: "Never Again",
    description: "Reached the real summit.",
    hint: "Keep going after the end.",
  },
  {
    id: "clean-climb",
    title: "Clean Climb",
    description: "Reached the real summit with fewer than 20 falls.",
    hint: "Look first, then leap. Every time.",
  },
  {
    id: "the-long-way-down",
    title: "The Long Way Down",
    description: "Fell four screens or more in one go.",
    hint: "Some ledges warn you. Not that you'll listen.",
  },
  {
    id: "feather-collector",
    title: "Feather Collector",
    description: "Found all 12 Lost Feathers.",
    hint: "They're in the risky spots. All of them.",
  },
  {
    id: "mirror-climber",
    title: "Mirror Climber",
    description: "Finished Mirror Mountain.",
    hint: "The same climb, the other way round, alone.",
  },
] as const satisfies ReadonlyArray<{ id: AchievementId; title: string; description: string; hint: string }>;

const achievements = defineGameAchievements({
  game: "Almost There",
  prefix: "almost-there",
  list: ALMOST_THERE_ACHIEVEMENTS,
  celebrate: ["never-again", "clean-climb", "feather-collector", "mirror-climber"],
  save: almostThereSave,
});

export const unlockAlmostThereAchievement = achievements.unlock;
