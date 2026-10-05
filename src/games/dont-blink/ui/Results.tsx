"use client";

// The end of a night (Plan/14-dont-blink.md §7, §8.6–§8.7): 6 AM, the sun, your stats and your rank; or how it
// ended, if it ended early. Endless shows the hours you kept watch.
import { ChevronLeft, Moon, RotateCcw, Share2, Sunrise } from "lucide-react";
import { useState } from "react";
import { shareResult } from "@/games/shared/share";
import { cn } from "@/lib/cn";
import type { NightResult } from "../core/game";
import styles from "../dont-blink.module.css";
import { hoursText, RANK_NAMES, shareText } from "../progress";
import { clockText } from "../play/runtime";

const LOST: Record<string, { title: string; text: string }> = {
  piled: { title: "They came for you", text: "Five changes piled up, and nobody reported them." },
  fired: { title: "You're fired", text: "Too many false reports in one hour. The manager has had enough of you." },
  visitor: { title: "It reached your office", text: "You heard it coming, room by room." },
  quit: { title: "You left early", text: "The cameras kept recording without you." },
};

const RANK_LINES: Record<string, string> = {
  "hawk-eye": "Fast and accurate. Nothing got past you.",
  "night-owl": "A solid shift. A few things took you a while.",
  sleepy: "You made it. Somehow.",
  fired: "",
};

function Stat({ label, value, data }: { label: string; value: string; data?: string }) {
  return (
    <div className={cn(styles.card, "px-3 py-2.5 text-center")} data-stat={data}>
      <div className="font-[family-name:var(--font-g-vt323)] text-3xl leading-none text-[var(--db-green)]">{value}</div>
      <div className="mt-1 text-xs text-[var(--db-dim)]">{label}</div>
    </div>
  );
}

export interface ResultsProps {
  result: NightResult;
  title: string;
  newBest: boolean;
  bestHours: number;
  onNext: (() => void) | null;
  /** After Night 5: the ending. */
  onEnding: (() => void) | null;
  onRetry(): void;
  onNights(): void;
}

export function Results({ result, title, newBest, bestHours, onNext, onEnding, onRetry, onNights }: ResultsProps) {
  const [shared, setShared] = useState<string | null>(null);
  const won = result.status === "won";
  const endless = result.mode === "endless";
  const lost = LOST[result.lost ?? "quit"]!;
  const stats = (
    <div className="mt-6 grid w-full grid-cols-2 gap-2 sm:grid-cols-5">
      <Stat label="Reported" value={String(result.reported)} data="reported" />
      <Stat label="Missed" value={String(result.missed)} data="missed" />
      <Stat label="False reports" value={String(result.falseReports)} data="false" />
      <Stat label="Avg. reaction" value={result.reaction === null ? "—" : `${result.reaction.toFixed(1)}s`} data="reaction" />
      <Stat label="Statue sent home" value={String(result.visitorHome)} data="home" />
    </div>
  );
  const share = async () => {
    const url = `${window.location.origin}/games/dont-blink`;
    const outcome = await shareResult(shareText(result, url));
    setShared(outcome === "copied" ? "Copied to your clipboard." : outcome === "shared" ? "Shared." : "Couldn't share that, sorry.");
  };

  return (
    <div className={cn(styles.root, "grid min-h-[calc(100dvh-4rem)] place-items-center px-4 py-8", won && styles.sunrise)} data-results={won ? "won" : "lost"} data-lost={result.lost ?? undefined}>
      <div className="flex w-full max-w-2xl flex-col items-center text-center">
        {won ? (
          <>
            <Sunrise className="size-10 text-[#ffd59a]" aria-hidden />
            <p className="mt-2 font-[family-name:var(--font-g-vt323)] text-3xl tracking-[0.15em] text-[#ffe7c4]">06:00 AM</p>
            <h1 className={cn(styles.display, "mt-1 text-6xl text-white")}>You made it to morning</h1>
            <p className="mt-2 text-[#f3dcc4]">{title}</p>
            {result.rank && (
              <div className="mt-6 rounded-2xl border-2 border-[#ffd59a] bg-black/30 px-6 py-3" data-rank={result.rank}>
                <p className="text-xs tracking-[0.3em] text-[#f3dcc4]">RANK</p>
                <p className={cn(styles.display, "text-5xl text-white")}>{RANK_NAMES[result.rank]}</p>
                <p className="mt-1 text-sm text-[#f3dcc4]">{RANK_LINES[result.rank]}</p>
              </div>
            )}
          </>
        ) : endless ? (
          <>
            <p className="font-[family-name:var(--font-g-vt323)] text-3xl tracking-[0.15em] text-[var(--db-green)]">{clockText(result.hours * 60)}</p>
            <h1 className={cn(styles.display, "mt-1 text-6xl")}>{lost.title}</h1>
            <p className="mt-3 text-lg">
              You kept watch for <strong data-hours>{hoursText(result.hours)}</strong>.
            </p>
            <p className="mt-1 text-sm text-[var(--db-dim)]">{newBest ? "A new best." : `Best: ${hoursText(bestHours)}.`}</p>
          </>
        ) : (
          <>
            <p className="font-[family-name:var(--font-g-vt323)] text-3xl tracking-[0.15em] text-[var(--db-red)]">{clockText(result.hours * 60)} AM</p>
            <h1 className={cn(styles.display, "mt-1 text-6xl")}>{lost.title}</h1>
            <p className="mt-3 text-[var(--db-dim)]">{lost.text}</p>
            {result.lost === "fired" && (
              <div className="mt-5 rounded-2xl border border-[var(--db-red)] px-5 py-2" data-rank="fired">
                <p className="text-xs tracking-[0.3em] text-[var(--db-dim)]">RANK</p>
                <p className={cn(styles.display, "text-4xl")}>Fired</p>
              </div>
            )}
          </>
        )}
        {stats}
        <div className="mt-7 flex flex-wrap justify-center gap-2.5">
          {onEnding && (
            <button type="button" className={cn(styles.btn, styles.primary, "!min-h-12 px-6 text-lg")} onClick={onEnding} data-ending-next>
              Continue
            </button>
          )}
          {!onEnding && onNext && (
            <button type="button" className={cn(styles.btn, styles.primary, "!min-h-12 px-6")} onClick={onNext} data-next>
              <Moon className="size-5" aria-hidden /> Next night
            </button>
          )}
          {!won && (
            <button type="button" className={cn(styles.btn, styles.primary, "!min-h-12 px-6")} onClick={onRetry} data-retry>
              <RotateCcw className="size-5" aria-hidden /> Try again
            </button>
          )}
          <button type="button" className={cn(styles.btn, "!min-h-12")} onClick={onNights} data-to-nights>
            <ChevronLeft className="size-4" aria-hidden /> Nights
          </button>
          {(won || endless) && (
            <button type="button" className={cn(styles.btn, "!min-h-12")} onClick={() => void share()} data-share>
              <Share2 className="size-4" aria-hidden /> Share
            </button>
          )}
        </div>
        {shared && (
          <p className="mt-3 text-sm" role="status">
            {shared}
          </p>
        )}
      </div>
    </div>
  );
}
