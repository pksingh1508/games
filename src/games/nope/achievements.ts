// NOPE!'s own achievements (Plan/02-nope.md §7). They live in the game's save, so deleting the
// game's data clears them too, and they're announced through the arcade's achievement toasts.
import { announceAchievement } from "@/engine/achievements";
import { nopeSave } from "./save";

export const NOPE_ACHIEVEMENTS = [
  {
    id: "didnt-even-read",
    title: "Didn't Even Read",
    description: "Got NOPE'd on the very first question in under 2 seconds.",
    hint: "Answer question 1 quickly. Very quickly.",
  },
  {
    id: "patience",
    title: "Patience Is a Virtue",
    description: "Passed every “do nothing” question on the first try.",
    hint: "Sometimes the best move is no move.",
  },
  {
    id: "stamp-collector",
    title: "Stamp Collector",
    description: "Got NOPE'd 100 times in total.",
    hint: "Keep getting it wrong. A lot.",
  },
  {
    id: "nightmare",
    title: "Mr. Nope's Nightmare",
    description: "Cleared an episode without losing a heart.",
    hint: "Finish an episode with all 3 hearts.",
  },
  {
    id: "winked-at",
    title: "Winked At",
    description: "Believed a winking Mr. Nope three times.",
    hint: "Take the host's advice. Even when he winks.",
  },
  {
    id: "fly-swatter",
    title: "Fly Swatter",
    description: "Caught 10 skip flies.",
    hint: "Something buzzes past now and then.",
  },
  {
    id: "nope-the-nope",
    title: "NOPE'd the NOPE",
    description: "Stamped Mr. Nope himself and rolled the credits.",
    hint: "Finish the final episode.",
  },
] as const;

export type NopeAchievementId = (typeof NOPE_ACHIEVEMENTS)[number]["id"];

const CELEBRATE: NopeAchievementId[] = ["nightmare", "nope-the-nope", "patience"];

/** Unlock once. Returns true when it's new. */
export function unlockNopeAchievement(id: NopeAchievementId): boolean {
  if (typeof window === "undefined" || nopeSave.get().achievements[id]) return false;
  nopeSave.update((save) => ({ ...save, achievements: { ...save.achievements, [id]: Date.now() } }));
  const achievement = NOPE_ACHIEVEMENTS.find((a) => a.id === id)!;
  announceAchievement({
    id: `nope:${id}`,
    title: achievement.title,
    description: achievement.description,
    game: "NOPE!",
    celebrate: CELEBRATE.includes(id),
  });
  return true;
}
