// Site-wide meta data: visits, viewed games, achievements, backup and install-prompt state.
import * as v from "valibot";
import { defineSave } from "./save/define-save";

const MetaV1 = v.object({
  v: v.literal(1),
  firstVisitAt: v.nullable(v.number()),
  lastVisitAt: v.nullable(v.number()),
  visits: v.number(),
  viewedGames: v.array(v.string()),
  /** Achievement id → unlock time (ms). */
  achievements: v.record(v.string(), v.number()),
  lastBackupAt: v.nullable(v.number()),
  installPromptDismissedAt: v.nullable(v.number()),
});

export type Meta = v.InferOutput<typeof MetaV1>;

export const metaSave = defineSave<Meta>({
  key: "mfg:meta",
  version: 1,
  schema: MetaV1,
  defaults: () => ({
    v: 1,
    firstVisitAt: null,
    lastVisitAt: null,
    visits: 0,
    viewedGames: [],
    achievements: {},
    lastBackupAt: null,
    installPromptDismissedAt: null,
  }),
});

const SESSION_KEY = "mfg:session:site:visit";

/** Count one visit per browser session. Returns true on the very first visit. */
export function recordVisit(): boolean {
  let counted = false;
  try {
    counted = sessionStorage.getItem(SESSION_KEY) === "1";
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // sessionStorage unavailable: count every page load instead.
  }
  if (counted) return false;

  const now = Date.now();
  const first = metaSave.get().firstVisitAt === null;
  metaSave.update((meta) => ({
    ...meta,
    visits: meta.visits + 1,
    firstVisitAt: meta.firstVisitAt ?? now,
    lastVisitAt: now,
  }));
  return first;
}

/** Remember that a game page was viewed. Returns how many distinct games have been seen. */
export function markGameViewed(slug: string): number {
  const meta = metaSave.get();
  if (meta.viewedGames.includes(slug)) return meta.viewedGames.length;
  const viewedGames = [...meta.viewedGames, slug];
  metaSave.update((m) => ({ ...m, viewedGames }));
  return viewedGames.length;
}

export function markBackupDone() {
  metaSave.update((meta) => ({ ...meta, lastBackupAt: Date.now() }));
}
