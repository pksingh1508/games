// One More Step's achievements (Plan/01-one-more-step.md §7), kept in the game's save and announced through
// the arcade's achievement toasts.
import { defineGameAchievements } from "@/games/shared/achievements";
import type { AchievementId } from "./progress";
import { omsSave } from "./save";

export const OMS_ACHIEVEMENTS = [
  { id: "catch-me", title: "Catch Me If You Can", description: "Caught a shy door within 3 ticks of it first running.", hint: "It's quick. Be quicker." },
  { id: "architect", title: "Architect", description: "Trapped a door with nothing but holes you made.", hint: "Your own trail can be a wall." },
  { id: "echo-chamber", title: "Echo Chamber", description: "Got killed by your own echo 10 times.", hint: "You, a few steps behind you, are dangerous." },
  { id: "undo-ne", title: "Undo-ne", description: "Used undo 1,000 times.", hint: "Taking it back? Bold. A thousand times." },
  { id: "perfectionist", title: "Perfectionist", description: "Three stars on every level of a world.", hint: "Every level of a world, in as few steps as can be." },
  { id: "zero-steps", title: "Zero Steps", description: "Beat the finale.", hint: "The last level. Sometimes the best step is…" },
  { id: "doctors-orders", title: "Doctor's Orders", description: "Walked 10,000 steps.", hint: "Keep walking." },
] as const satisfies ReadonlyArray<{ id: AchievementId; title: string; description: string; hint: string }>;

const achievements = defineGameAchievements({
  game: "One More Step",
  prefix: "one-more-step",
  list: OMS_ACHIEVEMENTS,
  celebrate: ["zero-steps", "perfectionist"],
  save: omsSave,
});

export const unlockOmsAchievement = achievements.unlock;
