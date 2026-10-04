// The finale, The Last Step (Plan/01-one-more-step.md §5 "Finale"). A tiny platform: you and Doory, side by
// side. "One more step!" Step onto it and the level starts again as 6-2, 6-3… forever. Wait, ten times, and
// it walks over to you. Sometimes the best step is no step.
import type { LevelDef } from "../engine/types";

export const FINALE: LevelDef = {
  id: "6-1",
  world: 6,
  name: "The Last Step",
  map: ["#####", "#PE.#", "#####"],
  door: "finale",
  narrator: [{ at: "start", text: "One more step!" }],
};
