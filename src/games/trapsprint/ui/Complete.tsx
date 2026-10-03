"use client";

// Level complete (Plan/06-trapsprint.md §8.4): time, medal, deaths, and Next / Retry / Watch all
// deaths / Share. Enter goes on, R retries; a gamepad's A and Y do the same.
import { ArrowRight, Check, Grid3x3, RotateCcw, Share2, Skull } from "lucide-react";
import { useEffect, useEffectEvent, useState } from "react";
import { toast } from "@/components/ui/toast-store";
import { shareResult } from "@/games/shared/share";
import { cn } from "@/lib/cn";
import { SITE } from "@/lib/site";
import { levelTitle } from "../core/level";
import { formatTime, MEDAL_EMOJI, MEDAL_NAMES, medalTimes, type Medal } from "../core/medals";
import type { AttemptRecord } from "../core/session";
import { getLevel, levelLabel } from "../levels";
import styles from "../trapsprint.module.css";
import { MedalIcon, SkullIcon } from "./icons";

export interface CompleteInfo {
  levelId: string;
  ticks: number;
  medal: Medal | null;
  /** Could this run earn a medal? (Not with assist, not from a checkpoint.) */
  eligible: boolean;
  assisted: boolean;
  fromCheckpoint: boolean;
  newBest: boolean;
  previousBest: number | null;
  /** Deaths this visit. */
  deaths: number;
  firstClear: boolean;
  attempts: AttemptRecord[];
}

const LADDER = ["bronze", "silver", "gold", "dev"] as const;

export function shareTextFor(info: Pick<CompleteInfo, "levelId" | "deaths" | "ticks" | "medal">): string {
  const medal = info.medal ? ` ${MEDAL_EMOJI[info.medal]}` : "";
  return `TrapSprint ${levelLabel(info.levelId)} — ${info.deaths} ${info.deaths === 1 ? "death" : "deaths"}, ${formatTime(info.ticks)}${medal}\n${SITE.url}/games/trapsprint`;
}

/** Gamepad buttons on a menu: fires once per press (buttons held when it opens must be let go first). */
export function useGamepadButtons(handlers: Partial<Record<number, () => void>>) {
  const fire = useEffectEvent((button: number) => {
    handlers[button]?.();
  });
  useEffect(() => {
    if (typeof navigator.getGamepads !== "function") return;
    const held = new Set<number>([0, 1, 2, 3, 9]);
    const timer = setInterval(() => {
      const down = new Set<number>();
      for (const pad of navigator.getGamepads()) pad?.buttons.forEach((b, i) => b.pressed && down.add(i));
      for (const i of down) if (!held.has(i)) fire(i);
      held.clear();
      down.forEach((i) => held.add(i));
    }, 50);
    return () => clearInterval(timer);
  }, []);
}

export function CompleteCard({
  info,
  hasNext,
  onNext,
  onRetry,
  onWatch,
  onLevels,
  watching = false,
}: {
  info: CompleteInfo;
  hasNext: boolean;
  onNext: () => void;
  onRetry: () => void;
  onWatch: (() => void) | null;
  onLevels: () => void;
  /** Shown after the All-Deaths Replay ("Watch again"). */
  watching?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const level = getLevel(info.levelId);
  const times = medalTimes(info.levelId);
  // The medal one step up from this run's (every better medal is a faster time).
  const nextMedal = LADDER[info.medal ? LADDER.indexOf(info.medal) + 1 : 0];
  const go = useEffectEvent(() => (hasNext ? onNext() : onLevels()));
  const retry = useEffectEvent(() => onRetry());
  const levels = useEffectEvent(() => onLevels());

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || document.querySelector("[role=dialog]")) return;
      const onButton = (document.activeElement as Element | null)?.closest("button, a");
      if ((event.code === "Enter" || event.code === "Space") && !onButton) {
        event.preventDefault();
        go();
      } else if (event.code === "KeyR") retry();
      else if (event.code === "Escape") levels();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const forward = hasNext ? onNext : onLevels;
  useGamepadButtons({ 0: forward, 9: forward, 3: onRetry, 1: onLevels });

  const share = async () => {
    const outcome = await shareResult(shareTextFor(info));
    if (outcome === "copied") {
      setCopied(true);
      toast({ kind: "success", title: "Result copied", description: "Paste it anywhere you like." });
    } else if (outcome === "failed") {
      toast({ kind: "info", title: "Couldn't copy", description: "Select the text and copy it yourself." });
    }
  };

  const heading = info.medal === "dev" ? "Dev time!" : info.firstClear ? "Clear!" : info.newBest ? "New best!" : "Clear!";

  return (
    <section className="absolute inset-0 z-10 grid place-items-center overflow-y-auto bg-[#1a1c2c]/55 p-4" aria-labelledby="ts-complete">
      <div className={cn(styles.panel, styles.card, "w-[min(94vw,30rem)] p-5 text-center sm:p-7")}>
        <p className={cn(styles.pixel, "text-[0.6rem] text-[#675E78]")}>
          {levelLabel(info.levelId)} · {levelTitle(level)}
        </p>
        <h2 id="ts-complete" className={cn(styles.pixel, "mt-3 text-2xl text-[#C8224B] sm:text-3xl")}>
          {heading}
        </h2>

        <div className="mt-5 flex items-center justify-center gap-5">
          <div className={styles.medalPop}>
            <MedalIcon medal={info.eligible ? info.medal : null} size={64} />
          </div>
          <div className="text-left">
            <p className={cn(styles.pixel, "text-xl tabular-nums sm:text-2xl")} aria-label={`Time ${formatTime(info.ticks)}`}>
              {formatTime(info.ticks)}
            </p>
            <p className="mt-1 text-sm font-bold text-[#675E78]">
              {info.eligible
                ? info.medal
                  ? `${MEDAL_NAMES[info.medal]} medal`
                  : "No medal yet"
                : info.assisted
                  ? "Assist on: no medals"
                  : "From a checkpoint: no medal"}
              {info.newBest && info.previousBest !== null && ` · was ${formatTime(info.previousBest)}`}
            </p>
            {info.eligible && nextMedal && (
              <p className="mt-0.5 text-xs font-semibold text-[#675E78]">
                {MEDAL_NAMES[nextMedal]}: {formatTime(times[nextMedal])}
              </p>
            )}
          </div>
        </div>

        <p className="mt-4 inline-flex items-center gap-2 font-bold">
          <SkullIcon size={16} />
          {info.deaths === 0 ? "No deaths. Not one." : `${info.deaths} ${info.deaths === 1 ? "death" : "deaths"}`}
        </p>

        <div className="mt-6 grid gap-3">
          <button type="button" className="btn btn-lg w-full" onClick={hasNext ? onNext : onLevels} data-sound="click">
            {hasNext ? (
              <>
                Next level <ArrowRight className="size-5" aria-hidden />
              </>
            ) : (
              <>
                <Grid3x3 className="size-5" aria-hidden /> Back to the levels
              </>
            )}
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" className="btn btn-secondary" onClick={onRetry} data-sound="click">
              <RotateCcw className="size-4" aria-hidden /> Retry
            </button>
            <button type="button" className="btn btn-secondary" onClick={share} data-sound="click">
              {copied ? <Check className="size-4" aria-hidden /> : <Share2 className="size-4" aria-hidden />} Share
            </button>
          </div>
          {onWatch && (
            <button type="button" className="btn btn-secondary w-full" onClick={onWatch} data-sound="click">
              <Skull className="size-4" aria-hidden /> {watching ? "Watch again" : "Watch all deaths"}
            </button>
          )}
          {hasNext && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onLevels} data-sound="click">
              <Grid3x3 className="size-4" aria-hidden /> Levels
            </button>
          )}
        </div>
        <p className="mt-3 text-xs text-[#675E78]">Enter: next · R: retry · Esc: levels</p>
      </div>
    </section>
  );
}
