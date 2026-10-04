// Medals per room (Plan/05-fake-floor.md §7): Clean (no falls), Barefoot (no pebbles) and Quick
// (under par). Par comes from the solver's run through the room (rooms/dev-runs.ts): a generous
// third more, plus a second and a half to think, rounded up to half a second.
import { DEV_RUNS } from "../rooms/dev-runs";

export type MedalId = "clean" | "barefoot" | "quick";
export const MEDAL_IDS: readonly MedalId[] = ["clean", "barefoot", "quick"];

export const MEDALS: Record<MedalId, { name: string; rule: string; emoji: string }> = {
  clean: { name: "Clean", rule: "No falls", emoji: "✨" },
  barefoot: { name: "Barefoot", rule: "No pebbles", emoji: "🦶" },
  quick: { name: "Quick", rule: "Under par", emoji: "⏱️" },
};

/** Round up to the next half second, in ticks. */
const upToHalf = (ticks: number) => Math.ceil(ticks / 30 - 1e-9) * 30;

export const parFor = (devTicks: number) => upToHalf(devTicks * 1.35 + 90);

/** The room's par time, in ticks (from your first step to the door). */
export function parTicks(roomId: string): number {
  const run = DEV_RUNS[roomId];
  if (!run) throw new Error(`No dev run for ${roomId}`);
  return parFor(run.time);
}

/** "8.3 s" from ticks. */
export const formatTime = (ticks: number) => `${(ticks / 60).toFixed(1)} s`;

/** A compact clock: "8.3", "1:02.4". */
export function formatClock(ticks: number): string {
  const total = ticks / 60;
  const minutes = Math.floor(total / 60);
  const seconds = total - minutes * 60;
  return minutes > 0 ? `${minutes}:${seconds.toFixed(1).padStart(4, "0")}` : seconds.toFixed(1);
}
