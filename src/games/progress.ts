// What a game's cabinet page shows about your local save. Reads the raw JSON defensively, so the
// cabinet page never loads the game's own code. Games without a summary just show "save found".
import type { GameSlug } from "./slugs";

export interface ProgressStat {
  label: string;
  value: string;
}

type Summarize = (save: Record<string, unknown>) => ProgressStat[];

const count = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : 0);
const record = (value: unknown) => (value && typeof value === "object" ? (value as Record<string, unknown>) : {});

const SUMMARIES: Partial<Record<GameSlug, Summarize>> = {
  nope(save) {
    const episodes = Object.values(record(save.episodes)).map(record);
    const cleared = episodes.filter((e) => count(e.clears) > 0).length;
    const best = Math.max(0, ...episodes.map((e) => count(e.bestScore)));
    const stats = record(save.stats);
    return [
      { label: "Episodes cleared", value: `${cleared}/4` },
      { label: "Best score", value: best ? best.toLocaleString("en-US") : "—" },
      { label: "NOPE'd", value: `${count(stats.nopes).toLocaleString("en-US")}×` },
      { label: "Trophies", value: `${Object.keys(record(save.achievements)).length}/7` },
    ];
  },
  "one-tap-chaos"(save) {
    const best = count(save.best);
    // Mirrors the game's unlocks: 12 to start, 3 + 3 + 2 + 2 + 2 more at 10, 20, 30, 40 and 50.
    const unlocked = 12 + [10, 20, 30, 40, 50].reduce((n, at, i) => n + (best >= at ? (i < 2 ? 3 : 2) : 0), 0);
    return [
      { label: "Best score", value: best ? best.toLocaleString("en-US") : "—" },
      { label: "Microgames", value: `${unlocked}/24` },
      { label: "Chaos cards", value: `${Math.min(8, count(save.cardsUnlocked))}/8` },
      { label: "Trophies", value: `${Object.keys(record(save.achievements)).length}/6` },
    ];
  },
};

/** Stats for the cabinet page, or null when there's nothing (or nothing readable) to show. */
export function summarizeProgress(slug: GameSlug, raw: string | null): ProgressStat[] | null {
  const summarize = SUMMARIES[slug];
  if (!summarize || !raw) return null;
  try {
    const save = JSON.parse(raw) as unknown;
    return save && typeof save === "object" ? summarize(save as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
