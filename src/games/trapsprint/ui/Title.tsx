"use client";

// The title screen (Plan/06-trapsprint.md §8.1): the "Start" button falls off the screen when you
// reach for it, a little trap before the traps. Any key starts anyway.
import { CircleHelp, Grid3x3, Settings2, Trophy } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useCoarsePointer } from "@/games/shared/device";
import { cn } from "@/lib/cn";
import { TRAPSPRINT_ACHIEVEMENTS } from "../achievements";
import { medalCount } from "../core/progress";
import { MAIN_LEVELS } from "../levels";
import type { TrapSprintSave } from "../save";
import styles from "../trapsprint.module.css";
import { Attract } from "./Attract";
import { SkullIcon } from "./icons";

const IGNORED_KEYS = new Set(["Tab", "ShiftLeft", "ShiftRight", "AltLeft", "AltRight", "ControlLeft", "ControlRight", "MetaLeft", "MetaRight", "CapsLock"]);

export function TitleScreen({
  save,
  onStart,
  onLevels,
  onHelp,
  onTrophies,
  onOptions,
}: {
  save: TrapSprintSave;
  onStart: () => void;
  onLevels: () => void;
  onHelp: () => void;
  onTrophies: () => void;
  onOptions: () => void;
}) {
  const [fallen, setFallen] = useState(false);
  const coarse = useCoarsePointer();
  const swallow = useRef(false);
  const start = useEffectEvent(() => onStart());

  // Any key starts, unless you're using another button or a dialog is open.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey || IGNORED_KEYS.has(event.code) || /^F\d+$/.test(event.code)) return;
      const active = document.activeElement;
      if (document.querySelector("[role=dialog]")) return;
      if (active && active !== document.body && active.closest("button, a, input, select, textarea") && !active.closest("[data-start]")) return;
      event.preventDefault();
      start();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const cleared = MAIN_LEVELS.filter((id) => (save.levels[id]?.clears ?? 0) > 0).length;
  const medals = medalCount(save, MAIN_LEVELS);
  const trophies = Object.keys(save.achievements).length;

  return (
    <section
      className={cn(styles.sky, "flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center px-4 py-12 text-center")}
      onPointerDown={(event) => {
        // Once START has fallen, a tap anywhere (but a button) starts.
        if (fallen && !(event.target as Element).closest("button, a")) onStart();
      }}
    >
      <Attract className={styles.attract} />
      <div className={styles.skyFade} aria-hidden />

      <p className={cn(styles.pixel, "text-[0.55rem] text-[#23153C] sm:text-[0.7rem]")}>Mind Games Arcade presents</p>
      <h1 className={cn(styles.logo, "mt-6")}>
        Trap<span className={styles.logoRed}>Sprint</span>
      </h1>
      <p className={cn(styles.pixel, "mt-9 max-w-xl text-[0.6rem] leading-relaxed text-[#23153C] sm:text-xs")}>Run fast. Die faster. Remember everything.</p>

      <div className="mt-12 grid h-24 place-items-center">
        <button
          type="button"
          data-start
          className={cn(styles.start, fallen && styles.fallen)}
          aria-label="Start"
          onPointerEnter={(event) => {
            if (event.pointerType === "mouse") setFallen(true);
          }}
          onPointerDown={(event) => {
            if (event.pointerType !== "mouse" && !fallen) {
              swallow.current = true;
              setFallen(true);
            }
          }}
          onClick={() => {
            if (swallow.current) {
              swallow.current = false;
              return;
            }
            onStart();
          }}
        >
          START
        </button>
      </div>
      <p className={cn(styles.pixel, styles.blink, "mt-2 min-h-[1.5em] text-[0.6rem] text-[#23153C] sm:text-xs")} aria-live="polite">
        {fallen ? (coarse ? "Tap anywhere to start anyway" : "Press any key to start anyway") : coarse ? "Tap START" : "Press any key"}
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={onLevels} className="btn btn-secondary" data-sound="click">
          <Grid3x3 className="size-5" aria-hidden /> Levels
        </button>
        <button type="button" onClick={onHelp} className="btn btn-ghost" data-sound="click">
          <CircleHelp className="size-5" aria-hidden /> How to play
        </button>
        <button type="button" onClick={onTrophies} className="btn btn-ghost" data-sound="click">
          <Trophy className="size-5" aria-hidden /> Trophies <span className="font-mono text-xs">{trophies}/{TRAPSPRINT_ACHIEVEMENTS.length}</span>
        </button>
        <button type="button" onClick={onOptions} className="btn btn-ghost" data-sound="click">
          <Settings2 className="size-5" aria-hidden /> Options
        </button>
      </div>

      <p className={cn(styles.pixel, "mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[0.55rem] text-[#23153C] sm:text-[0.65rem]")}>
        <span>
          {cleared}/{MAIN_LEVELS.length} cleared
        </span>
        <span>{medals} medals</span>
        <span className="inline-flex items-center gap-1.5">
          <SkullIcon size={14} /> {save.deaths.toLocaleString("en-US")} deaths
        </span>
      </p>
    </section>
  );
}
