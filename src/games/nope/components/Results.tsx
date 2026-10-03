"use client";

// The end of an attempt: "Episode cleared!" with the score, a shareable emoji grid and a review
// of every trick; or "Out of hearts" with a one-tap retry (Plan/02-nope.md §8).
import { ArrowRight, Check, RotateCcw, Share2, Tv } from "lucide-react";
import { animate, m, useMotionValue, useTransform } from "motion/react";
import { Suspense, use, useEffect, useRef, useState } from "react";
import { toast } from "@/components/ui/toast-store";
import { cn } from "@/lib/cn";
import { SITE } from "@/lib/site";
import styles from "../nope.module.css";
import { EPISODES, loadEpisode } from "../questions/episodes";
import type { EpisodeId, QuestionResult } from "../save";
import { sfx } from "../sfx";
import { formatTime, shareText, type ClearSummary } from "../state/run";
import { Backdrop, EPISODE_THEME } from "./Backdrop";
import { MrNope } from "./MrNope";

function CountUp({ to, reducedMotion }: { to: number; reducedMotion: boolean }) {
  const value = useMotionValue(reducedMotion ? to : 0);
  const text = useTransform(value, (v) => Math.round(v).toLocaleString("en-US"));
  useEffect(() => {
    if (reducedMotion) return;
    const controls = animate(value, to, { duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.5 });
    return () => controls.stop();
  }, [to, value, reducedMotion]);
  return <m.span>{text}</m.span>;
}

const RESULT_LABEL: Record<QuestionResult, string> = { first: "first try", retry: "after a NOPE", skip: "skipped" };

function Review({ episode, results }: { episode: EpisodeId; results: QuestionResult[] }) {
  const questions = use(loadEpisode(episode));
  return (
    <ol className="mt-4 space-y-3">
      {questions.map(({ meta }, i) => {
        const result = results[i];
        return (
          <li key={meta.id} className="rounded-2xl border border-[color-mix(in_oklab,var(--ink)_14%,transparent)] bg-white/60 p-4">
            <p className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-display text-lg font-bold">
                {i + 1}. {meta.title}
              </span>
              {result && <span className="font-mono text-xs uppercase tracking-wider text-muted-surface">{RESULT_LABEL[result]}</span>}
            </p>
            <p className="mt-1 text-sm">
              <strong>Answer:</strong> {meta.solution}
            </p>
            <p className="mt-1 text-sm text-muted-surface">
              <strong className="text-ink">The tell:</strong> {meta.tell}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

export function ClearedScreen({
  summary,
  onNext,
  onChannels,
  onReplay,
  reducedMotion,
}: {
  summary: ClearSummary;
  onNext?: () => void;
  onChannels: () => void;
  onReplay: () => void;
  reducedMotion: boolean;
}) {
  const info = EPISODES[summary.episode];
  const [copied, setCopied] = useState(false);
  const text = shareText({
    episode: summary.episode,
    name: info.name,
    grid: summary.grid,
    nopes: summary.episodeNopes,
    elapsedMs: summary.elapsedMs,
    score: summary.score.total,
    url: `${SITE.url}/games/nope`,
  });

  const primary = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    sfx.fanfare();
    sfx.applause(2.2);
    primary.current?.focus({ preventScroll: true });
  }, []);

  const share = async () => {
    // The text leaves the device only here, when the player chooses to share it.
    const canShare = typeof navigator.share === "function" && window.matchMedia("(pointer: coarse)").matches;
    if (canShare) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // Cancelled, or not allowed: fall back to copying.
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ kind: "success", title: "Result copied", description: "Paste it anywhere you like." });
    } catch {
      toast({ kind: "info", title: "Couldn't copy", description: "Select the text in the box and copy it yourself." });
    }
  };

  const rows: Array<[string, number]> = [
    ["Cleared", summary.score.base],
    [`Hearts left × 250`, summary.score.hearts],
    ["Unused skip", summary.score.skip],
    ["Time", summary.score.time],
  ];

  return (
    <div className={cn(styles.stage, "min-h-[calc(100dvh-4rem)] px-4 pb-20 pt-10")}>
      <Backdrop theme={EPISODE_THEME[summary.episode]} />
      <div className="relative z-10 mx-auto max-w-3xl">
        <div className="flex flex-col items-center text-center">
          <p className="pixel-label text-[#FFC93C]">Episode {summary.episode} · {info.name}</p>
          <m.h1
            className={cn(styles.comic, styles.logoText, "mt-3 text-[clamp(3.2rem,12vw,6.5rem)] leading-[0.9]")}
            initial={reducedMotion ? false : { scale: 1.7, rotate: -10, opacity: 0 }}
            animate={{ scale: 1, rotate: -3, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 14 }}
          >
            Cleared!
          </m.h1>
          <div className="mt-4 flex items-center gap-3">
            <MrNope mood="sulking" className="h-20 w-auto" />
            <p className={cn(styles.show, "rounded-2xl border-[3px] border-[#161414] bg-white px-4 py-2 text-left text-lg text-[#161414]")}>
              {summary.perfect ? "Not ONE heart lost? This is a nightmare." : summary.firstClear ? "Fine. You win this one." : "Again?! Don't you have somewhere to be?"}
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-[2rem] border-[3px] border-[#161414] bg-[#FFF4D6] p-6 text-[#161414] shadow-[0_14px_0_0_rgba(0,0,0,0.45)] sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="pixel-label text-[0.7rem] text-[#615C52]">Score</p>
              <p className={cn(styles.show, "text-6xl leading-none tabular-nums")}>
                <CountUp to={summary.score.total} reducedMotion={reducedMotion} />
              </p>
            </div>
            {summary.newBest && (
              <span className={cn(styles.comic, "-rotate-6 rounded-xl bg-[#D41F22] px-3 py-1 text-2xl tracking-wider text-white")}>New best!</span>
            )}
          </div>
          <dl className="mt-5 grid gap-1.5 font-mono text-sm">
            {rows.map(([label, points]) => (
              <div key={label} className="flex justify-between border-b border-dashed border-[#161414]/15 pb-1.5">
                <dt className="text-[#615C52]">{label}</dt>
                <dd className={cn("font-bold tabular-nums", points < 0 && "text-[#8A1416]")}>
                  {points > 0 ? "+" : ""}
                  {points.toLocaleString("en-US")}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-3 text-center">
              <p className="pixel-label text-[0.65rem] text-[#615C52]">Time</p>
              <p className={cn(styles.show, "text-2xl")}>{formatTime(summary.elapsedMs)}</p>
            </div>
            <div className="rounded-2xl bg-white p-3 text-center">
              <p className="pixel-label text-[0.65rem] text-[#615C52]">NOPE&apos;d</p>
              <p className={cn(styles.show, "text-2xl")}>{summary.episodeNopes}×</p>
            </div>
            <div className="rounded-2xl bg-white p-3 text-center">
              <p className="pixel-label text-[0.65rem] text-[#615C52]">Hearts left</p>
              <p className={cn(styles.show, "text-2xl")}>{"❤️".repeat(summary.hearts) || "—"}</p>
            </div>
          </div>

          <div className="mt-6">
            <p className="pixel-label text-[0.7rem] text-[#615C52]">Share card</p>
            <pre className="mt-2 whitespace-pre-wrap break-words rounded-2xl bg-[#161414] p-4 font-mono text-sm leading-relaxed text-[#FFF4D6]">{text}</pre>
            <button type="button" onClick={share} className="btn btn-secondary btn-sm mt-3" data-sound="click">
              {copied ? <Check className="size-4" aria-hidden /> : <Share2 className="size-4" aria-hidden />}
              {copied ? "Copied" : "Share result"}
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {onNext && (
            <button ref={primary} type="button" onClick={onNext} className="btn btn-lg" data-sound="coin">
              Next episode <ArrowRight className="size-5" aria-hidden />
            </button>
          )}
          <button type="button" onClick={onReplay} className="btn btn-secondary btn-lg" data-sound="click">
            <RotateCcw className="size-5" aria-hidden /> Play again
          </button>
          <button ref={onNext ? undefined : primary} type="button" onClick={onChannels} className="btn btn-secondary btn-lg" data-sound="click">
            <Tv className="size-5" aria-hidden /> Channels
          </button>
        </div>

        <details className="group mt-10 rounded-[2rem] border-[3px] border-[#161414] bg-[#FFF4D6] p-6 text-[#161414] sm:p-8">
          <summary className="cursor-pointer list-none font-display text-xl font-extrabold">
            <span className="mr-2 inline-block transition-transform group-open:rotate-90">▶</span>
            Explain-o-Matic: how did those work? <span className="text-sm font-normal text-[#615C52]">(spoilers)</span>
          </summary>
          <Suspense fallback={<p className="mt-4 text-[#615C52]">Loading the tricks…</p>}>
            <Review episode={summary.episode} results={summary.results} />
          </Suspense>
        </details>
      </div>
    </div>
  );
}

export interface FailInfo {
  episode: EpisodeId;
  /** The question the hearts ran out on (1–15). */
  reached: number;
  nopes: number;
  wall: number;
  attempt: number;
}

export function FailedScreen({ info, onRetry, onChannels, reducedMotion }: { info: FailInfo; onRetry: () => void; onChannels: () => void; reducedMotion: boolean }) {
  const retry = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    // One tap (or Enter) to try again.
    retry.current?.focus({ preventScroll: true });
    sfx.aww();
    const timer = setTimeout(() => sfx.laugh(), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={cn(styles.stage, "grid min-h-[calc(100dvh-4rem)] place-items-center px-4 pb-16 pt-10")}>
      <Backdrop theme={EPISODE_THEME[info.episode]} />
      <div className="relative z-10 flex max-w-xl flex-col items-center text-center">
        <MrNope mood="laughing" className={cn("h-40 w-auto sm:h-52", styles.bob)} />
        <m.h1
          className={cn(styles.comic, styles.logoText, "mt-4 text-[clamp(3rem,11vw,5.5rem)] leading-[0.9]")}
          initial={reducedMotion ? false : { scale: 1.6, rotate: 8, opacity: 0 }}
          animate={{ scale: 1, rotate: 2, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 14 }}
        >
          Out of hearts!
        </m.h1>
        <p className={cn(styles.show, "mt-5 text-xl text-[#FFF4D6] sm:text-2xl")}>
          You made it to question {info.reached} of 15.
        </p>
        <p className="mt-2 text-[#9B9483]">
          NOPE&apos;d {info.nopes} {info.nopes === 1 ? "time" : "times"} this try. The wall keeps all {info.wall} of your stamps, and
          the quiz remembers what you&apos;ve seen.
        </p>
        <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <button ref={retry} type="button" onClick={onRetry} className="btn btn-lg" data-sound="coin">
            <RotateCcw className="size-5" aria-hidden /> Try again
          </button>
          <button type="button" onClick={onChannels} className="btn btn-secondary btn-lg" data-sound="click">
            <Tv className="size-5" aria-hidden /> Channels
          </button>
        </div>
      </div>
    </div>
  );
}
