// Run history goes to IndexedDB (Plan/gameStack.md §5.5).
import { getDb, type RunRecord } from "./db";

/** Add a finished run to the local history. Best-effort: history is nice to have, never a blocker. */
export async function recordRun(run: Omit<RunRecord, "at">): Promise<void> {
  try {
    const db = await getDb();
    await db.add("runs", { ...run, at: Date.now() });
  } catch {
    // Never let history break a game.
  }
}
