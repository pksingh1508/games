// 99 Seconds' achievements (Plan/03-99-seconds.md §7), kept in the game's save and announced through the arcade's
// achievement toasts.
import { defineGameAchievements } from "@/games/shared/achievements";
import type { AchievementId } from "./progress";
import { ninetySave } from "./save";

export const NINETY_ACHIEVEMENTS = [
  { id: "first-try", title: "First Try (lol)", description: "Escaped Chapter 1 in a single loop on a fresh save.", hint: "Know the answer before you've been asked." },
  { id: "groundhog", title: "Groundhog", description: "Lived through 50 loops.", hint: "Again. And again. And again." },
  { id: "a-watched-pot", title: "A Watched Pot", description: "Stared at the pot for a whole minute. It didn't boil.", hint: "Test the saying." },
  { id: "clockwatcher", title: "Clockwatcher", description: "Gained the full ten seconds from glancing at clocks in one loop.", hint: "The first second you look at a clock lasts longer." },
  { id: "closed-loop", title: "Closed Loop", description: "Wrote the notes you once found, and the loop closed.", hint: "Write what you read." },
  { id: "paradox", title: "Paradox", description: "Left without writing the notes. So who wrote them?", hint: "Leave without doing your homework." },
] as const satisfies ReadonlyArray<{ id: AchievementId; title: string; description: string; hint: string }>;

const achievements = defineGameAchievements({
  game: "99 Seconds",
  prefix: "99-seconds",
  list: NINETY_ACHIEVEMENTS,
  celebrate: ["closed-loop", "first-try"],
  save: ninetySave,
});

export const unlockNinetyAchievement = achievements.unlock;
