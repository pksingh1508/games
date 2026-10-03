// The four episodes (Plan/02-nope.md §4). Each episode's questions load only when it's played.
import type { EpisodeId } from "../save";
import type { QuestionEntry } from "./types";

export interface EpisodeInfo {
  id: EpisodeId;
  name: string;
  /** One line for the channel guide. */
  tagline: string;
  /** What the episode is about. */
  focus: string;
}

export const EPISODES: Record<EpisodeId, EpisodeInfo> = {
  1: {
    id: 1,
    name: "Easy Peasy (Lies)",
    tagline: "Fifteen easy questions. Allegedly.",
    focus: "Meet Mr. Nope and his five secret rules. Nobody will tell you what they are.",
  },
  2: {
    id: 2,
    name: "Brain Freeze",
    tagline: "Bombs, colours and maths that bite.",
    focus: "The rules start teaming up. Fuses start burning.",
  },
  3: {
    id: 3,
    name: "Memory Lane",
    tagline: "The quiz remembers everything. Do you?",
    focus: "Questions about questions, the stamp wall, and things you did hours ago.",
  },
  4: {
    id: 4,
    name: "The Final NOPE",
    tagline: "Everything you've learned. Faster.",
    focus: "Every rule, every trick, then one last question from Mr. Nope himself.",
  },
};

const LOADERS: Record<EpisodeId, () => Promise<QuestionEntry[]>> = {
  1: () => import("./episode-1").then((mod) => mod.EPISODE_1),
  2: () => import("./episode-2").then((mod) => mod.EPISODE_2),
  3: () => import("./episode-3").then((mod) => mod.EPISODE_3),
  4: () => import("./episode-4").then((mod) => mod.EPISODE_4),
};

const cache = new Map<EpisodeId, Promise<QuestionEntry[]>>();

/** The episode's questions (cached, so React's use() gets the same promise every time). */
export function loadEpisode(id: EpisodeId): Promise<QuestionEntry[]> {
  let promise = cache.get(id);
  if (!promise) {
    promise = LOADERS[id]();
    cache.set(id, promise);
    promise.catch(() => cache.delete(id));
  }
  return promise;
}
