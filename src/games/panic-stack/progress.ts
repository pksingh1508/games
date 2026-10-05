// What a level, a tower or a day does to the save, and which trophies it earns (Plan/11-panic-stack.md §7).
// Pure functions.
import { hashString } from "@/engine/rng";
import { LEVEL_IDS, LOCATIONS } from "./levels";
import { emptyLevel, type PanicStackSave } from "./save";

export type AchievementId = "didnt-fall-for-it" | "cat-person" | "steady-hands" | "floating-foundation" | "skyscraper" | "never-oops";

/** Endless medals (§7): heights in metres. */
export const MEDALS = [10, 25, 50, 100] as const;
export const medalsFor = (metres: number) => MEDALS.filter((m) => metres >= m);

/** Fake panics to live through for Didn't Fall For It. */
export const FAKE_PANICS = 10;
/** Endless metres for Skyscraper. */
export const SKYSCRAPER = 50;

export interface Clear {
  /** Ticks it took, and ticks there were (0: no limit). */
  ticks: number;
  limit: number;
  falls: number;
  oopsUsed: boolean;
  breaks: number;
  zen: boolean;
  /** The cat was sitting on top when the tower held. */
  catOnTop: boolean;
  /** A floating safe was resting on the platform, under the tower. */
  safeBase: boolean;
}

export const countStars = (bits: number) => (bits & 1) + ((bits >> 1) & 1) + ((bits >> 2) & 1);

/** Stars (bits): ★ cleared, ★★ nothing fell, ★★★ more than half the time left. Zen clears earn the first. */
export function starsFor(clear: Clear): number {
  if (clear.zen) return 1;
  return 1 | (clear.falls === 0 ? 2 : 0) | (clear.limit > 0 && clear.ticks < clear.limit / 2 ? 4 : 0);
}

export function recordClear(save: PanicStackSave, id: string, clear: Clear) {
  const before = save.levels[id] ?? emptyLevel();
  const stars = starsFor(clear);
  const record = {
    clears: before.clears + 1,
    stars: before.stars | stars,
    best: clear.zen ? before.best : before.best === null ? clear.ticks : Math.min(before.best, clear.ticks),
    noOops: before.noOops || (!clear.oopsUsed && !clear.zen),
    noBreak: before.noBreak || (clear.breaks === 0 && !clear.zen),
  };
  const next: PanicStackSave = { ...save, levels: { ...save.levels, [id]: record } };
  const unlock: AchievementId[] = [];
  if (clear.catOnTop) unlock.push("cat-person");
  if (clear.safeBase && !clear.zen) unlock.push("floating-foundation");
  const location = LOCATIONS.find((l) => l.levels.some((x) => x.id === id))!;
  const all = (ok: (r: typeof record) => boolean) => location.levels.every((l) => {
    const r = next.levels[l.id];
    return !!r && r.clears > 0 && ok(r);
  });
  if (all((r) => r.noOops)) unlock.push("never-oops");
  if (location.id === "museum" && all((r) => r.noBreak)) unlock.push("steady-hands");
  return { save: next, unlock, stars, newBest: !clear.zen && (before.best === null || clear.ticks < before.best) };
}

/** Lifetime totals, as they happen. */
export function recordStats(save: PanicStackSave, add: Partial<PanicStackSave["stats"]>) {
  const stats = { ...save.stats };
  for (const [k, n] of Object.entries(add) as Array<[keyof PanicStackSave["stats"], number]>) stats[k] += n;
  const unlock: AchievementId[] = stats.fakePanics >= FAKE_PANICS ? ["didnt-fall-for-it"] : [];
  return { save: { ...save, stats }, unlock };
}

export function recordEndless(save: PanicStackSave, metres: number) {
  const best = Math.max(save.endless.best, metres);
  const unlock: AchievementId[] = metres >= SKYSCRAPER ? ["skyscraper"] : [];
  return { save: { ...save, endless: { best, runs: save.endless.runs + 1 } }, unlock, newBest: metres > save.endless.best + 0.005 };
}

export function recordDaily(save: PanicStackSave, key: string, metres: number) {
  const before = save.daily[key];
  const height = Math.max(before?.height ?? 0, metres);
  return { save: { ...save, daily: { ...save.daily, [key]: { height, tries: (before?.tries ?? 0) + 1 } } }, newBest: !before || metres > before.height + 0.005 };
}

/** Met an item or an event (the guide), or found a liar out. */
export function remember(save: PanicStackSave, what: string, known = false): PanicStackSave {
  if (save.seen[what] && (!known || save.known[what])) return save;
  return {
    ...save,
    seen: save.seen[what] ? save.seen : { ...save.seen, [what]: Date.now() },
    known: known && !save.known[what] ? { ...save.known, [what]: Date.now() } : save.known,
  };
}

export const isCleared = (save: PanicStackSave, id: string) => (save.levels[id]?.clears ?? 0) > 0;

/** Levels open one after another. */
export function isOpen(save: PanicStackSave, id: string): boolean {
  const i = LEVEL_IDS.indexOf(id);
  return i === 0 || (i > 0 && isCleared(save, LEVEL_IDS[i - 1]!));
}

export function starTotals(save: PanicStackSave) {
  return { got: LEVEL_IDS.reduce((n, id) => n + countStars(save.levels[id]?.stars ?? 0), 0), of: LEVEL_IDS.length * 3 };
}

// -- The Daily Stack -------------------------------------------------------------------------------

/** Today's stack, by the UTC date: the same for everyone (§5). */
export function dailyFor(date: Date) {
  const key = date.toISOString().slice(0, 10);
  const start = Date.UTC(2026, 9, 1);
  const number = Math.max(1, Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start) / 86_400_000) + 1);
  return { key, number, seed: hashString(`panic-stack:daily:${key}`) };
}

/** The share card: no links to anything but the arcade, nothing that leaves the device unless you share it. */
export function shareText(kind: "daily" | "endless", metres: number, number: number | null, url: string) {
  const blocks = Math.max(1, Math.min(12, Math.round(metres)));
  const tower = "🟫".repeat(blocks);
  const head = kind === "daily" ? `Panic Stack Daily #${number}` : "Panic Stack: Endless Tower";
  return `${head}\n${tower}\n${metres.toFixed(1)} m tall and still standing.\n${url}`;
}
