// The story as a state machine (Plan/04-dont-trust-the-game.md §5, §12): chapters → scenes. Each scene's own
// component decides when it's done; this says what comes next, which chapter a scene belongs to, and where a
// saved game picks up.

export const SCENES = ["tutorial", "options", "launcher", "loading", "crash", "404", "405", "void", "console", "credits"] as const;
export type SceneId = (typeof SCENES)[number];

export const CHAPTER_OF: Record<SceneId, 1 | 2 | 3 | 4 | 5 | 6> = {
  tutorial: 1,
  options: 2,
  launcher: 2,
  loading: 3,
  crash: 4,
  "404": 4,
  "405": 4,
  void: 4,
  console: 5,
  credits: 6,
};

export const CHAPTER_TITLES: Record<1 | 2 | 3 | 4 | 5 | 6, string> = {
  1: "The Tutorial",
  2: "The Options Menu",
  3: "Now Loading…",
  4: "Fatal Error",
  5: "The Console",
  6: "The Credits",
};

/** The first scene of each chapter. */
export const CHAPTER_START: Record<1 | 2 | 3 | 4 | 5 | 6, SceneId> = { 1: "tutorial", 2: "options", 3: "loading", 4: "crash", 5: "console", 6: "credits" };

/** Where a saved game picks up (room 405 is a detour from 404). */
export const resumeAt = (scene: SceneId): SceneId => (scene === "405" ? "404" : scene);

/** The next chapter's first scene (for the honest skip), or null after the credits. */
export function nextChapter(scene: SceneId): SceneId | null {
  const n = CHAPTER_OF[scene];
  return n < 6 ? CHAPTER_START[(n + 1) as 2 | 3 | 4 | 5 | 6] : null;
}
