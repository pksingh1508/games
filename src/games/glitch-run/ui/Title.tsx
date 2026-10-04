"use client";

// The title screen (Plan/07-glitch-run.md §8.1): the logo never holds still, and a little runner runs
// along under it forever. Press Start and the title screen crashes, straight into the first stage (or
// the files, once you've been here before).
import { CalendarDays, CircleHelp, FolderOpen, Infinity as InfinityIcon, Settings2, Trophy } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useCoarsePointer } from "@/games/shared/device";
import { cn } from "@/lib/cn";
import { GLITCH_ACHIEVEMENTS } from "../achievements";
import { endlessOpen, isCleared } from "../core/progress";
import { dailyFor } from "../gen/generator";
import styles from "../glitch-run.module.css";
import type { GlitchSave } from "../save";
import { STAGE_IDS } from "../stages";
import { RunnerFigure } from "./icons";

const IGNORED_KEYS = new Set(["Tab", "ShiftLeft", "ShiftRight", "AltLeft", "AltRight", "ControlLeft", "ControlRight", "MetaLeft", "MetaRight", "CapsLock", "Escape"]);

export function TitleScreen({
  save,
  reducedMotion,
  onStart,
  onFiles,
  onEndless,
  onDaily,
  onHelp,
  onTrophies,
  onOptions,
}: {
  save: GlitchSave;
  reducedMotion: boolean;
  onStart: () => void;
  onFiles: () => void;
  onEndless: () => void;
  onDaily: () => void;
  onHelp: () => void;
  onTrophies: () => void;
  onOptions: () => void;
}) {
  const [crashing, setCrashing] = useState(false);
  const coarse = useCoarsePointer();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fresh = !STAGE_IDS.some((id) => isCleared(save, id));

  const start = () => {
    if (crashing) return;
    setCrashing(true);
    timer.current = setTimeout(onStart, reducedMotion ? 150 : 1000);
  };
  const startFromKey = useEffectEvent(() => start());

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  // Any key starts, unless you're on another button or a dialog is open.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey || IGNORED_KEYS.has(event.code) || /^F\d+$/.test(event.code)) return;
      if (document.querySelector("[role=dialog]")) return;
      const active = document.activeElement;
      if (active && active !== document.body && active.closest("button, a, input, select, textarea") && !active.closest("[data-start]")) return;
      event.preventDefault();
      startFromKey();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const cleared = STAGE_IDS.filter((id) => isCleared(save, id)).length;
  const trophies = Object.keys(save.achievements).length;
  const open = endlessOpen(save);
  const daily = dailyFor(new Date());

  return (
    <section className={cn(styles.root, styles.screen, crashing && styles.crashing, "flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center px-4 py-12 text-center")}>
      <div className={cn(styles.menu, "relative z-[1] flex flex-col items-center")}>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#9AA1B5]">Mind Games Arcade presents</p>
        <h1 className={cn(styles.logo, "mt-5")} aria-label="Glitch Run">
          <span className={styles.word} data-text="GLITCH" aria-hidden>
            GLITCH
          </span>
          <span className={styles.word} data-text="RUN" aria-hidden>
            RUN
          </span>
        </h1>
        <div className={cn(styles.runnerLine, "mt-4")} aria-hidden>
          <RunnerFigure size={44} />
        </div>
        <p className="mt-5 max-w-xl text-base font-bold sm:text-lg">The game is broken. Use it.</p>

        <div className="mt-9">
          <button type="button" data-start className={styles.go} onClick={start} aria-label={fresh ? "Start" : "Continue"}>
            {fresh ? "Start" : "Continue"}
          </button>
        </div>
        <p className={cn(styles.blink, "mt-4 min-h-[1.5em] text-sm font-bold text-[#00F5D4]")} aria-hidden>
          {coarse ? "tap start_" : "press any key_"}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <button type="button" onClick={onFiles} className={styles.quiet} data-sound="click">
            <FolderOpen className="size-4" aria-hidden /> Files
          </button>
          <button type="button" onClick={onEndless} className={styles.quiet} disabled={!open} title={open ? undefined : "Clear stage_01.exe first"} data-sound="click">
            <InfinityIcon className="size-4" aria-hidden /> Endless
          </button>
          <button type="button" onClick={onDaily} className={styles.quiet} disabled={!open} title={open ? undefined : "Clear stage_01.exe first"} data-sound="click">
            <CalendarDays className="size-4" aria-hidden /> Daily #{daily.number}
          </button>
        </div>
        <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2.5">
          <button type="button" onClick={onHelp} className={styles.quiet} data-sound="click">
            <CircleHelp className="size-4" aria-hidden /> How to play
          </button>
          <button type="button" onClick={onTrophies} className={styles.quiet} data-sound="click">
            <Trophy className="size-4" aria-hidden /> Trophies <span className="text-xs text-[#9AA1B5]">{trophies}/{GLITCH_ACHIEVEMENTS.length}</span>
          </button>
          <button type="button" onClick={onOptions} className={styles.quiet} data-sound="click">
            <Settings2 className="size-4" aria-hidden /> Options
          </button>
        </div>

        <p className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-bold text-[#9AA1B5]">
          <span>
            {cleared}/{STAGE_IDS.length} stages
          </span>
          <span>best run {save.endless.metres.toLocaleString("en-US")} m</span>
          <span>{save.totals.deaths.toLocaleString("en-US")} times patched</span>
        </p>
      </div>
      {crashing && !reducedMotion && (
        <p className={styles.crashNote} role="status">
          title.exe has stopped working. launching {fresh ? "stage_01.exe" : "files"}…
        </p>
      )}
    </section>
  );
}
