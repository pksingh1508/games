// One Tap Chaos's achievements (Plan/09-one-tap-chaos.md §7), kept in the game's save and
// announced through the arcade's achievement toasts.
import { defineGameAchievements } from "@/games/shared/achievements";
import { otcSave } from "./save";

export const OTC_ACHIEVEMENTS = [
  {
    id: "self-control",
    title: "Self Control",
    description: "Passed 10 “don't tap” rounds in a row.",
    hint: "Keep your thumb still when it counts. Ten times running.",
  },
  {
    id: "simon-who",
    title: "Simon Who?",
    description: "Cleared 5 rounds in a row under Simon Says.",
    hint: "Watch for the crown.",
  },
  {
    id: "double-trouble",
    title: "Double Trouble",
    description: "Cleared 5 rounds with two Chaos Cards active, in one run.",
    hint: "Survive past the third card.",
  },
  {
    id: "conductor",
    title: "Conductor",
    description: "Beat The Chaos Conductor.",
    hint: "Round 10. Watch for the switch.",
  },
  {
    id: "fifty",
    title: "Fifty",
    description: "Scored 50 in one run.",
    hint: "Keep going.",
  },
  {
    id: "couldnt-resist",
    title: "Couldn't Resist",
    description: "Swatted the fly on DON'T!'s button 5 times.",
    hint: "It's right there. On the button.",
  },
] as const;

export type OtcAchievementId = (typeof OTC_ACHIEVEMENTS)[number]["id"];

const achievements = defineGameAchievements({
  game: "One Tap Chaos",
  prefix: "otc",
  list: OTC_ACHIEVEMENTS,
  celebrate: ["conductor", "fifty", "self-control"],
  save: otcSave,
});

export const unlockOtcAchievement = achievements.unlock;
