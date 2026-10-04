// Fake Floor's achievements (Plan/05-fake-floor.md §7), kept in the game's save and announced
// through the arcade's achievement toasts.
import { defineGameAchievements } from "@/games/shared/achievements";
import type { AchievementId } from "./core/progress";
import { fakeFloorSave } from "./save";

export const FAKE_FLOOR_ACHIEVEMENTS = [
  {
    id: "trust-issues",
    title: "Trust Issues",
    description: "Threw 100 pebbles.",
    hint: "Test everything. Everything.",
  },
  {
    id: "leap-of-faith",
    title: "Leap of Faith",
    description: "Walked onto an invisible floor without testing it first.",
    hint: "The rain splashes on something. Trust it.",
  },
  {
    id: "barefoot-champion",
    title: "Barefoot Champion",
    description: "Finished a world's time trial without throwing a single pebble.",
    hint: "Ten rooms on your eyes alone.",
  },
  {
    id: "eagle-eye",
    title: "Eagle Eye",
    description: "Finished the Hall of Mirrors time trial without falling once.",
    hint: "Even the clues lie there. You didn't.",
  },
  {
    id: "floor-inspector",
    title: "Floor Inspector",
    description: "Found every hidden pebble.",
    hint: "Two in every world. Look behind you. Look up.",
  },
  {
    id: "gravity-tourist",
    title: "Gravity Tourist",
    description: "Fell 500 times.",
    hint: "The view from the bottom is lovely.",
  },
  {
    id: "grounded",
    title: "Grounded",
    description: "Crossed The Floor.",
    hint: "The last room is the floor itself.",
  },
] as const satisfies ReadonlyArray<{ id: AchievementId; title: string; description: string; hint: string }>;

const achievements = defineGameAchievements({
  game: "Fake Floor",
  prefix: "fake-floor",
  list: FAKE_FLOOR_ACHIEVEMENTS,
  celebrate: ["barefoot-champion", "eagle-eye", "floor-inspector", "grounded"],
  save: fakeFloorSave,
});

export const unlockFakeFloorAchievement = achievements.unlock;
