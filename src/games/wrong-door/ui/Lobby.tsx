"use client";

// The lobby (Plan/13-wrong-door.md §8.1): The Ambiguous Hotel's front hall, with its grand staircase and the
// furniture every anomaly floor copies (look carefully: you'll want to remember it). Check in for the Story
// Run, or the Endless Hotel, or today's Daily Door.
import { BookOpen, CircleHelp, Settings2, Trophy } from "lucide-react";
import { cn } from "@/lib/cn";
import { blankFloor } from "../floors/common";
import { STORY_FLOORS } from "../floors/story";
import { startRun, type RunState } from "../run/state";
import type { WrongDoorSave } from "../save";
import styles from "../wrong-door.module.css";
import { Hall } from "./Hall";

const LOBBY = { ...blankFloor(0, "anomaly", 1), anomaly: { changed: null }, doorman: { lies: false, hat: "on" as const } };
const LOBBY_RUN = startRun("story", 0);

export function Lobby({
  save,
  daily,
  onStory,
  onEndless,
  onDaily,
  onContinue,
  onHelp,
  onCodex,
  onTrophies,
  onOptions,
}: {
  save: WrongDoorSave;
  daily: { key: string; number: number };
  onStory(): void;
  onEndless(): void;
  onDaily(): void;
  onContinue(): void;
  onHelp(): void;
  onCodex(): void;
  onTrophies(): void;
  onOptions(): void;
}) {
  const run = save.run as unknown as RunState | null;
  const today = save.daily[daily.key];
  const first = save.stats.runs === 0 && !run;
  return (
    <section className={cn(styles.root, "min-h-[calc(100dvh-4rem)] bg-[#2a1e2f] px-3 py-6")} aria-labelledby="wd-title" data-lobby>
      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#c9a227]">The Ambiguous Hotel</p>
        <h1 id="wd-title" className={cn(styles.display, "mt-1 text-[clamp(2.8rem,10vw,5rem)] leading-none text-[#f3e3d3]")}>
          Wrong Door
        </h1>
        <p className="mt-2 max-w-xl text-[1.05rem] opacity-85">Three doors. Two liars. One way out. Probably. Your room is on floor 13, and there are no elevators.</p>

        <div className="relative mt-4 w-full">
          <Hall
            floor={LOBBY}
            run={LOBBY_RUN}
            selected={null}
            opening={null}
            heard={null}
            speech="Welcome. Mind the doors."
            canRead
            luckyOpened={null}
            flickering={false}
            scrambled={(t) => t}
            onSelect={() => {}}
            onKnock={() => {}}
            onHinges={() => {}}
            onBack={() => {}}
            onPainting={() => {}}
            onPickUp={() => {}}
          />
          {/* The grand staircase (no elevators). */}
          <svg viewBox="0 0 200 120" className="pointer-events-none absolute bottom-[24%] left-1/2 w-[34%] -translate-x-1/2" aria-hidden>
            {Array.from({ length: 8 }, (_, k) => (
              <rect key={k} x={20 + k * 7} y={110 - k * 13} width={160 - k * 14} height="13" fill={k % 2 ? "#5a3a28" : "#6b4632"} stroke="#3b2618" />
            ))}
            <path d="M18 112 L76 8" stroke="#c9a227" strokeWidth="4" />
            <path d="M182 112 L124 8" stroke="#c9a227" strokeWidth="4" />
          </svg>
          <p className="sr-only">
            The lobby: a painting of a ship sailing right, a clock at three o&apos;clock, two lamps, a fern on the left, a red rug, diamond wallpaper, and a little brass sign saying 13.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2.5">
          {run && run.status === "play" && (
            <button type="button" className={cn(styles.btn, styles.gold, "text-lg")} onClick={onContinue} autoFocus data-continue>
              Continue: floor {run.floor} ({run.mode === "story" ? "Story" : run.mode === "endless" ? "Endless" : "Daily"})
            </button>
          )}
          <button type="button" className={cn(styles.btn, !run && styles.gold, "text-lg")} onClick={onStory} autoFocus={!run} data-play>
            {first ? "Check in" : "Story Run"}
          </button>
          <button type="button" className={cn(styles.btn, "text-lg")} onClick={onEndless} data-endless>
            Endless Hotel
          </button>
          <button type="button" className={cn(styles.btn, "text-lg")} onClick={onDaily} data-daily>
            Daily Door #{daily.number}
            {today && <span className="text-sm opacity-70">{today.escaped ? " · escaped" : ` · floor ${today.floor}`}</span>}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <button type="button" className={cn(styles.btn, styles.ghost)} onClick={onHelp}>
            <CircleHelp className="size-4" aria-hidden /> How to play
          </button>
          <button type="button" className={cn(styles.btn, styles.ghost)} onClick={onCodex} data-open-codex>
            <BookOpen className="size-4" aria-hidden /> Codex
          </button>
          <button type="button" className={cn(styles.btn, styles.ghost)} onClick={onTrophies}>
            <Trophy className="size-4" aria-hidden /> Trophies
          </button>
          <button type="button" className={cn(styles.btn, styles.ghost)} onClick={onOptions}>
            <Settings2 className="size-4" aria-hidden /> Options
          </button>
        </div>
        <p className="mt-4 text-sm font-bold opacity-70" data-totals>
          {save.stats.escapes} {save.stats.escapes === 1 ? "escape" : "escapes"} · best Endless floor {save.stats.bestEndless || "—"} · {Object.keys(save.codex).length} codex pages · {STORY_FLOORS} floors to your room
        </p>
      </div>
    </section>
  );
}
