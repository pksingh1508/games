"use client";

// The run summary (Plan/13-wrong-door.md §7, §8.7): floors, keys, wrong doors, time, the Detective score,
// and a share card (the Daily Door's is the one people compare).
import { Share2 } from "lucide-react";
import { useState } from "react";
import { shareResult } from "@/games/shared/share";
import { cn } from "@/lib/cn";
import { shareText } from "../progress";
import { detective, pathEmoji, reached, scoreOf, type RunState } from "../run/state";
import styles from "../wrong-door.module.css";

const time = (ms: number) => {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export function Summary({ run, dailyNumber, onLobby, onAgain }: { run: RunState; dailyNumber: number | null; onLobby(): void; onAgain(): void }) {
  const [shared, setShared] = useState<string | null>(null);
  const escaped = run.status === "escaped";
  const share = async () => {
    const url = typeof window === "undefined" ? "" : `${window.location.origin}/games/wrong-door`;
    const outcome = await shareResult(shareText(run, dailyNumber, url));
    setShared(outcome === "shared" ? "Shared." : outcome === "copied" ? "Copied to your clipboard." : "Couldn't share it, sorry.");
  };
  return (
    <section className={cn(styles.root, "grid min-h-[calc(100dvh-4rem)] place-items-center bg-[#2a1e2f] px-4 py-8")} aria-labelledby="wd-summary" data-summary={run.status}>
      <div className={cn(styles.card, "!w-[min(36rem,100%)] text-center")}>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#836919]">{run.mode === "story" ? "Story Run" : run.mode === "endless" ? "Endless Hotel" : `Daily Door${dailyNumber ? ` #${dailyNumber}` : ""}`}</p>
        <h1 id="wd-summary" className={cn(styles.display, "mt-1 text-4xl leading-tight")}>
          {escaped ? "You escaped The Ambiguous Hotel" : run.status === "out" ? `Out of keys on floor ${run.floor}` : `You left on floor ${run.floor}`}
        </h1>
        {escaped && <p className="mt-1">{run.mode === "story" ? "The painting swung open on a quiet street. Your room was never on floor 13 at all." : "Out through a way that wasn't a door. The plaque told you so."}</p>}
        <p className="mt-3 text-3xl tracking-wider" aria-label="Your climb, floor by floor" data-path>
          {pathEmoji(run)}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-2 text-left sm:grid-cols-3">
          {[
            ["Floor reached", String(reached(run))],
            ["Wrong doors", String(run.stats.wrong)],
            ["Keys left", String(run.keys)],
            ["Knocks", String(run.stats.knocks)],
            ["Time", time(run.elapsedMs)],
            ["Detective score", `${detective(run)}`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg bg-black/5 px-3 py-2">
              <dt className="text-xs font-bold uppercase tracking-wider opacity-70">{k}</dt>
              <dd className={cn(styles.display, "text-2xl")}>{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-sm opacity-75">Score {scoreOf(run).toLocaleString("en-US")}: fewer knocks, questions and tools score more, and so does every key you keep.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button type="button" className={cn(styles.btn, styles.gold)} onClick={() => void share()} data-share>
            <Share2 className="size-4" aria-hidden /> Share
          </button>
          <button type="button" className={styles.btn} onClick={onAgain} data-again>
            {run.mode === "daily" ? "Play it again (for fun)" : "Another run"}
          </button>
          <button type="button" className={styles.btn} onClick={onLobby} data-lobby-button>
            Back to the lobby
          </button>
        </div>
        {shared && (
          <p className="mt-2 text-sm font-bold" role="status">
            {shared}
          </p>
        )}
      </div>
    </section>
  );
}
