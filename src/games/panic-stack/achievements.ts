// Panic Stack's achievements (Plan/11-panic-stack.md §7), kept in the game's save and announced through the
// arcade's achievement toasts.
import { defineGameAchievements } from "@/games/shared/achievements";
import type { AchievementId } from "./progress";
import { panicStackSave } from "./save";

export const PANIC_ACHIEVEMENTS = [
  { id: "didnt-fall-for-it", title: "Didn't Fall For It", description: "Lived through 10 fake panics without dropping a thing.", hint: "Some sirens are made of cardboard." },
  { id: "cat-person", title: "Cat Person", description: "Finished a level with the cat sitting on top of your tower.", hint: "Let the cat have the top. Then hold still." },
  { id: "steady-hands", title: "Steady Hands", description: "Cleared every Museum level without breaking anything.", hint: "Priceless means priceless. All six." },
  { id: "floating-foundation", title: "Floating Foundation", description: "Built a winning tower on a floating safe.", hint: "Heavy things at the bottom. Well, heavy-looking." },
  { id: "skyscraper", title: "Skyscraper", description: "Reached 50 m in the Endless Tower.", hint: "Fifty metres. Don't look down." },
  { id: "never-oops", title: "Never Oops", description: "Cleared a whole location without using Oops.", hint: "Six levels. No take-backs." },
] as const satisfies ReadonlyArray<{ id: AchievementId; title: string; description: string; hint: string }>;

const achievements = defineGameAchievements({
  game: "Panic Stack",
  prefix: "panic-stack",
  list: PANIC_ACHIEVEMENTS,
  celebrate: ["skyscraper", "steady-hands"],
  save: panicStackSave,
});

export const unlockPanicAchievement = achievements.unlock;
