// Wrong Door's achievements (Plan/13-wrong-door.md §7), kept in the game's save and announced through the
// arcade's achievement toasts.
import { defineGameAchievements } from "@/games/shared/achievements";
import type { AchievementId } from "./progress";
import { wrongDoorSave } from "./save";

export const WRONG_DOOR_ACHIEVEMENTS = [
  { id: "the-switch", title: "The Switch", description: "Switched doors on the Lucky Floor, and won.", hint: "Your gut says it doesn't matter." },
  { id: "double-negative", title: "Double Negative", description: "Asked a lying doorman what he would say.", hint: "Two lies make a…" },
  { id: "no-knock", title: "No Knock Needed", description: "Escaped without knocking once.", hint: "Your ears can rest." },
  { id: "sharp-eyes", title: "Sharp Eyes", description: "Spotted 10 anomalies.", hint: "Something's different. Isn't it?" },
  { id: "untouched", title: "Untouched", description: "Escaped without a single wrong door.", hint: "Every door, right first time." },
  { id: "believer", title: "Believer", description: "Solved the Final Floor.", hint: "The plaque never lies." },
] as const satisfies ReadonlyArray<{ id: AchievementId; title: string; description: string; hint: string }>;

const achievements = defineGameAchievements({
  game: "Wrong Door",
  prefix: "wrong-door",
  list: WRONG_DOOR_ACHIEVEMENTS,
  celebrate: ["believer", "untouched"],
  save: wrongDoorSave,
});

export const unlockWrongDoorAchievement = achievements.unlock;
