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
  "almost-there"(save) {
    const climbs = record(save.climbs);
    const best = record(record(save.best).normal);
    const ticks = count(best.ticks);
    // The clock runs at 60 ticks a second.
    const seconds = Math.floor(ticks / 60);
    const time = `${Math.floor(seconds / 3600)}:${String(Math.floor(seconds / 60) % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
    // 20 px to the metre.
    const fallen = Math.round(count(record(save.totals).fallen) / 20);
    return [
      { label: "Real summits", value: (count(climbs.finished) + count(climbs.mirrorFinished)).toLocaleString("en-US") },
      { label: "Best climb", value: ticks ? time : "—" },
      { label: "Fallen", value: `${fallen.toLocaleString("en-US")} m` },
      { label: "Trophies", value: `${Object.keys(record(save.achievements)).length}/7` },
    ];
  },
  "gravity-is-lying"(save) {
    // Rooms "1-01" to "5-08", then Isaac's Tree ("6-01" to "6-04"): 44, three golden apples each.
    const rooms = Object.entries(record(save.rooms))
      .filter(([id]) => /^[1-5]-0[1-8]$|^6-0[1-4]$/.test(id))
      .map(([, r]) => record(r));
    const cleared = rooms.filter((r) => count(r.clears) > 0).length;
    const apples = rooms.reduce((n, r) => {
      const bits = count(r.apples) & 7;
      return n + (bits & 1) + ((bits >> 1) & 1) + ((bits >> 2) & 1);
    }, 0);
    return [
      { label: "Rooms cleared", value: `${cleared}/44` },
      { label: "Golden apples", value: `${apples}/132` },
      { label: "Deaths", value: count(save.deaths).toLocaleString("en-US") },
      { label: "Trophies", value: `${Object.keys(record(save.achievements)).length}/6` },
    ];
  },
  "glitch-run"(save) {
    // Stages "01" to "20"; endless keeps its best distance (metres).
    const stages = Object.entries(record(save.stages))
      .filter(([id]) => /^(0[1-9]|1\d|20)$/.test(id))
      .map(([, s]) => record(s));
    const cleared = stages.filter((s) => count(s.clears) > 0).length;
    const metres = count(record(save.endless).metres);
    return [
      { label: "Stages cleared", value: `${cleared}/20` },
      { label: "Furthest run", value: metres ? `${metres.toLocaleString("en-US")} m` : "—" },
      { label: "Times patched", value: count(record(save.totals).deaths).toLocaleString("en-US") },
      { label: "Trophies", value: `${Object.keys(record(save.achievements)).length}/6` },
    ];
  },
  "last-pixel"(save) {
    // Levels "1-01" to "4-10", then the finale ("5-01"): 41, up to three stars each (bits).
    const levels = Object.entries(record(save.levels))
      .filter(([id]) => /^[1-4]-(0[1-9]|10)$|^5-01$/.test(id))
      .map(([, l]) => record(l));
    const cleared = levels.filter((l) => count(l.clears) > 0).length;
    const stars = levels.reduce((n, l) => {
      const bits = count(l.stars) & 7;
      return n + (bits & 1) + ((bits >> 1) & 1) + ((bits >> 2) & 1);
    }, 0);
    return [
      { label: "At 100%", value: `${cleared}/41` },
      { label: "Stars", value: `${stars}/123` },
      { label: "Pix caught", value: `${count(record(save.stats).catches).toLocaleString("en-US")}×` },
      { label: "Trophies", value: `${Object.keys(record(save.achievements)).length}/6` },
    ];
  },
  "cursor-escape"(save) {
    // Windows "C-01" to "F-10", then The Uninstaller ("X-01"): 41, a medal each.
    const levels = Object.entries(record(save.levels))
      .filter(([id]) => /^[C-F]-(0[1-9]|10)$|^X-01$/.test(id))
      .map(([, l]) => record(l));
    const cleared = levels.filter((l) => count(l.clears) > 0).length;
    const golds = levels.filter((l) => l.medal === "gold").length;
    return [
      { label: "Windows closed", value: `${cleared}/41` },
      { label: "Gold medals", value: `${golds}/41` },
      { label: "Crashes", value: count(save.crashes).toLocaleString("en-US") },
      { label: "Trophies", value: `${Object.keys(record(save.achievements)).length}/6` },
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
