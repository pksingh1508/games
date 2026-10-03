// Your best run per level, as an input recording in IndexedDB (Plan/06-trapsprint.md §12): it
// becomes the ghost you race, and on "Your Own Ghost" the path of the trap. A few hundred bytes.
import { decodeLog, encodeLog, logLength, type InputLog } from "@/engine/replay";
import { getDb, type ReplayRecord } from "@/engine/save/db";
import { ENGINE_VERSION, ticksToMs } from "./constants";

export interface BestRun {
  log: InputLog;
  ticks: number;
  /** Deaths before the run (the layout it ran through). */
  attempt: number;
}

const key = (levelId: string) => `trapsprint:${levelId}:best`;

/** The best run, if there is one recorded with today's physics. */
export async function loadBestRun(levelId: string): Promise<BestRun | null> {
  try {
    const db = await getDb();
    const record = await db.get("replays", key(levelId));
    if (!record || record.engineVersion !== ENGINE_VERSION) return null;
    const log = decodeLog(record.inputs);
    return { log, ticks: logLength(log), attempt: record.variant ?? 0 };
  } catch {
    return null;
  }
}

export async function saveBestRun(levelId: string, run: BestRun): Promise<void> {
  const record: ReplayRecord = {
    game: "trapsprint",
    level: levelId,
    kind: "best",
    engineVersion: ENGINE_VERSION,
    inputs: encodeLog(run.log),
    timeMs: ticksToMs(run.ticks),
    at: Date.now(),
    variant: run.attempt > 0 ? 1 : 0,
  };
  try {
    const db = await getDb();
    await db.put("replays", record, key(levelId));
  } catch {
    // Ghosts are nice to have: never let storage trouble stop the game.
  }
}
