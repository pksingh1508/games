// Each game keeps its own achievements in its own save (so deleting a game's data clears them
// too), and announces them through the arcade's achievement toasts.
import { announceAchievement } from "@/engine/achievements";
import type { SaveSlot } from "@/engine/save";

export interface GameAchievement {
  id: string;
  title: string;
  description: string;
  hint: string;
}

export function defineGameAchievements<const L extends readonly GameAchievement[], T extends { achievements: Record<string, number> }>({
  game,
  prefix,
  list,
  celebrate = [],
  save,
}: {
  /** Shown on the toast, e.g. "NOPE!". */
  game: string;
  /** Keeps toast ids unique across games, e.g. "nope". */
  prefix: string;
  list: L;
  /** Throw confetti for these. */
  celebrate?: ReadonlyArray<L[number]["id"]>;
  save: SaveSlot<T>;
}) {
  type Id = L[number]["id"];
  return {
    list,
    /** Unlock once. Returns true when it's new. */
    unlock(id: Id): boolean {
      if (typeof window === "undefined" || save.get().achievements[id]) return false;
      save.update((current) => ({ ...current, achievements: { ...current.achievements, [id]: Date.now() } }));
      const achievement = list.find((a) => a.id === id)!;
      announceAchievement({
        id: `${prefix}:${id}`,
        title: achievement.title,
        description: achievement.description,
        game,
        celebrate: celebrate.includes(id),
      });
      return true;
    },
  };
}
