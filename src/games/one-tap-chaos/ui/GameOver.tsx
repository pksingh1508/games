"use client";

// Game over (Plan/09-one-tap-chaos.md §8.5): score, best, what got you, and an instant retry.
import { Check, Home, RotateCcw, Share2 } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { toast } from "@/components/ui/toast-store";
import { shareResult } from "@/games/shared/share";
import { cn } from "@/lib/cn";
import { SITE } from "@/lib/site";
import { instructionOf, shareText, type Daily } from "../core/daily";
import type { RunEnd } from "../core/progress";
import type { RunSummary } from "../core/session";
import { MICROGAMES } from "../microgames";
import styles from "../otc.module.css";
import { MicrogameIcon } from "./icons";
import { Metro, MetroBubble } from "./Metro";

/** Retry only arms after this long, so frantic tapping doesn't restart by accident. */
const ARM_MS = 900;

export function GameOver({
  summary,
  end,
  daily,
  dailyBest,
  onRetry,
  onMenu,
}: {
  summary: RunSummary;
  end: RunEnd;
  daily: Daily | null;
  dailyBest: number | null;
  onRetry: () => void;
  onMenu: () => void;
}) {
  const { state } = summary;
  const [armed, setArmed] = useState(false);
  const [copied, setCopied] = useState(false);
  const retryButton = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setArmed(true), ARM_MS);
    retryButton.current?.focus({ preventScroll: true });
    return () => clearTimeout(timer);
  }, []);

  const retry = useEffectEvent(() => {
    if (armed) onRetry();
  });
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || document.querySelector("[role=dialog]")) return;
      if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        retry();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const text = shareText({ daily, score: state.score, bosses: state.bosses, diedTo: state.diedTo, url: `${SITE.url}/games/one-tap-chaos` });
  const share = async () => {
    const outcome = await shareResult(text);
    if (outcome === "copied") {
      setCopied(true);
      toast({ kind: "success", title: "Result copied", description: "Paste it anywhere you like." });
    } else if (outcome === "failed") {
      toast({ kind: "info", title: "Couldn't copy", description: "Select the text and copy it yourself." });
    }
  };

  const minutes = Math.floor(summary.playedMs / 60000);
  const seconds = Math.floor((summary.playedMs % 60000) / 1000);

  return (
    <section className={cn(styles.stage, "flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center px-4 py-10 text-center text-[#1B1B1B]")}>
      <div className={styles.rays} aria-hidden />
      <p className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-[#544924]">{daily ? `Daily Chaos #${daily.number}` : "Out of bulbs"}</p>
      <h1 className={cn(styles.show, "mt-2 text-5xl sm:text-6xl")}>Game over</h1>

      <div className="mt-6 flex items-end gap-4">
        <Metro mood={end.newBest || end.dailyBest ? "shock" : "happy"} className="h-32 w-24 sm:h-40 sm:w-28" />
        <div className="flex flex-col items-center">
          <p className={cn(styles.show, styles.bigCount)} aria-label={`Score ${state.score}`}>
            {state.score}
          </p>
          {(end.newBest || end.dailyBest) && (
            <p className={cn(styles.show, styles.slideIn, "-mt-2 rotate-[-4deg] rounded-full bg-[#2B59C3] px-4 py-1 text-lg text-white shadow-[0_4px_0_#1B1B1B]")}>
              {daily ? "Today's best!" : "New best!"}
            </p>
          )}
        </div>
      </div>
      <p className="mt-3 font-mono text-sm font-bold uppercase tracking-wider text-[#544924]">
        {daily ? `Today's best: ${Math.max(dailyBest ?? 0, state.score)}` : `Best: ${Math.max(end.previousBest, state.score)}`}
      </p>

      {state.diedTo && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border-[3px] border-[#1B1B1B] bg-white px-4 py-3 shadow-[0_4px_0_#1B1B1B]">
          <MicrogameIcon id={state.diedTo} className="size-12 shrink-0" />
          <p className="text-left">
            <span className="block font-mono text-xs font-bold uppercase tracking-wider text-[#626262]">Got you</span>
            <span className={cn(styles.show, "text-2xl")}>{instructionOf(state.diedTo)}</span>
          </p>
        </div>
      )}

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Cleared", state.cleared],
          ["Bosses beaten", state.bosses],
          ["Best streak", state.bestStreak],
          ["Time", `${minutes}:${String(seconds).padStart(2, "0")}`],
        ].map(([labelText, value]) => (
          <div key={labelText} className="rounded-2xl border-[3px] border-[#1B1B1B] bg-white/85 px-4 py-2">
            <dt className="font-mono text-[0.65rem] font-bold uppercase tracking-wider text-[#626262]">{labelText}</dt>
            <dd className={cn(styles.show, "text-2xl tabular-nums")}>{value}</dd>
          </div>
        ))}
      </dl>

      {end.unlocked.length > 0 && (
        <div className={cn(styles.slideIn, "mt-6 max-w-lg rounded-2xl border-[3px] border-[#1B1B1B] bg-[#2B59C3] px-5 py-4 text-white shadow-[0_5px_0_#1B1B1B]")}>
          <p className={cn(styles.show, "text-xl")}>New microgames unlocked!</p>
          <ul className="mt-3 flex flex-wrap justify-center gap-2">
            {end.unlocked.map((id) => (
              <li key={id} className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[#1B1B1B]">
                <MicrogameIcon id={id} className="size-6" />
                <span className={styles.show}>{MICROGAMES[id].instruction}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          ref={retryButton}
          type="button"
          className="btn btn-lg"
          onClick={() => armed && onRetry()}
          aria-disabled={!armed}
          data-sound="coin"
        >
          <RotateCcw className="size-5" aria-hidden /> {daily ? "Try today's run again" : "Tap to try again"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={share} data-sound="click">
          {copied ? <Check className="size-4" aria-hidden /> : <Share2 className="size-4" aria-hidden />} Share
        </button>
        <button type="button" className="btn btn-secondary" onClick={onMenu} data-sound="click">
          <Home className="size-4" aria-hidden /> Menu
        </button>
      </div>
      <MetroBubble className="mt-6">{state.score >= 50 ? "Fifty?! Fine. You win this time." : state.score >= 20 ? "Not bad. For a thumb." : "One more go. Just one."}</MetroBubble>
      <pre className="sr-only">{text}</pre>
    </section>
  );
}
