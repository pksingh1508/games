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
  trapsprint(save) {
    // Main levels are "1-01" to "3-10"; Remix ones start with "R".
    const levels = Object.entries(record(save.levels)).filter(([id]) => /^[123]-\d\d$/.test(id)).map(([, l]) => record(l));
    const cleared = levels.filter((l) => count(l.clears) > 0).length;
    const golds = levels.filter((l) => l.medal === "gold" || l.medal === "dev").length;
    return [
      { label: "Levels cleared", value: `${cleared}/30` },
      { label: "Gold medals", value: `${golds}/30` },
      { label: "Deaths", value: count(save.deaths).toLocaleString("en-US") },
      { label: "Trophies", value: `${Object.keys(record(save.achievements)).length}/7` },
    ];
  },
  "fake-floor"(save) {
    // Rooms are "1-01" to "5-10", plus The Floor ("6-01"): 51, three medals each.
    const rooms = Object.entries(record(save.rooms))
      .filter(([id]) => /^[1-5]-\d\d$|^6-01$/.test(id))
      .map(([, r]) => record(r));
    const cleared = rooms.filter((r) => count(r.clears) > 0).length;
    const medals = rooms.reduce((n, r) => n + [r.clean, r.barefoot, r.quick].filter((m) => m === true).length, 0);
    return [
      { label: "Rooms crossed", value: `${cleared}/51` },
      { label: "Medals", value: `${medals}/153` },
      { label: "Falls", value: count(save.falls).toLocaleString("en-US") },
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
