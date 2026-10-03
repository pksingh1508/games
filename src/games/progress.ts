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
