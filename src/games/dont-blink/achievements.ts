// Don't Blink's achievements (Plan/14-dont-blink.md §7), kept in the game's save and announced through the
// arcade's achievement toasts.
import { defineGameAchievements } from "@/games/shared/achievements";
import type { AchievementId } from "./progress";
import { dontBlinkSave } from "./save";

export const DONT_BLINK_ACHIEVEMENTS = [
  { id: "perfect-shift", title: "Perfect Shift", description: "Made it to 6 AM without a single false report.", hint: "Only report what you're sure of. All night." },
  { id: "eagle-eye", title: "Eagle Eye", description: "Reported a change within a second of the blink that made it.", hint: "Know the room before you blink." },
  { id: "iron-eyes", title: "Iron Eyes", description: "Held your eyes open for five minutes in one night.", hint: "Don't blink. Well, as little as you can." },
  { id: "statue-of-limitations", title: "Statue of Limitations", description: "Sent the Visitor back to its pedestal ten times.", hint: "It keeps wandering off. Keep sending it back." },
  { id: "counted-it", title: "Counted It", description: "Caught five Count changes.", hint: "Seven books. Three crates. Four posts. Count them." },
  { id: "who-are-you", title: "Who Are You?", description: "Saw what the day guard had to say.", hint: "Make it to the end of the week." },
] as const satisfies ReadonlyArray<{ id: AchievementId; title: string; description: string; hint: string }>;

const achievements = defineGameAchievements({
  game: "Don't Blink",
  prefix: "dont-blink",
  list: DONT_BLINK_ACHIEVEMENTS,
  celebrate: ["who-are-you", "iron-eyes"],
  save: dontBlinkSave,
});

export const unlockDontBlinkAchievement = achievements.unlock;
