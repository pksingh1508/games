// Don't Trust The Game's achievements (Plan/04-dont-trust-the-game.md §7), kept in the game's save and announced
// through the arcade's achievement toasts.
import { defineGameAchievements } from "@/games/shared/achievements";
import type { AchievementId } from "./progress";
import { dttgSave } from "./save";

export const DTTG_ACHIEVEMENTS = [
  { id: "trusting-soul", title: "Trusting Soul", description: "Obeyed 10 of HELPER's lies.", hint: "Do what you're told." },
  { id: "never-trusted", title: "Never Trusted", description: "Finished a chapter without obeying a single lie.", hint: "Watch the eyes." },
  { id: "hacker", title: "Hacker", description: "Found the secret room by editing the URL.", hint: "Rooms have numbers. Numbers can change." },
  { id: "magic-word", title: "Magic Word", description: "Opened the door with please.", hint: "Ask nicely." },
  { id: "reloaded", title: "Reloaded", description: "Solved the reload puzzle.", hint: "Sometimes the truth is the obvious thing." },
  { id: "you-came-back", title: "You Came Back", description: "Opened the game again after the ending.", hint: "Leave. Then don't." },
  { id: "collector", title: "Collector", description: "Found all 12 secrets.", hint: "The game has blind spots. Look in them." },
] as const satisfies ReadonlyArray<{ id: AchievementId; title: string; description: string; hint: string }>;

const achievements = defineGameAchievements({
  game: "Don't Trust The Game",
  prefix: "dont-trust-the-game",
  list: DTTG_ACHIEVEMENTS,
  celebrate: ["you-came-back", "collector"],
  save: dttgSave,
});

export const unlockDttgAchievement = achievements.unlock;
