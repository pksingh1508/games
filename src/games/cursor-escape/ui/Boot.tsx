"use client";

// The title (Plan/12-cursor-escape.md §8.1): DeskOS 98 starting up. A boot log scrolls past (it finds
// some unresponsive hardware: you), a progress bar fills, and the logo comes up. Any key, or a click,
// starts.
import { CircleHelp, FolderOpen, Settings2, Trophy } from "lucide-react";
import { useEffect, useEffectEvent, useState } from "react";
import { useCoarsePointer } from "@/games/shared/device";
import { cn } from "@/lib/cn";
import { CURSOR_ACHIEVEMENTS } from "../achievements";
import { isCleared } from "../core/progress";
import styles from "../cursor-escape.module.css";
import { LEVEL_IDS } from "../levels";
import type { CursorSave } from "../save";

const LOG = [
  "DeskOS 98 BIOS v4.98 (c) DeskSoft",
  "Memory test: 640K OK",
  "Detecting keyboard ... OK",
  "Detecting pointing device ... 1 found",
  "  WARNING: pointer is unresponsive hardware",
  "  Scheduling uninstall ...",
  "Starting DeskOS 98 ...",
];

const IGNORED_KEYS = new Set(["Tab", "ShiftLeft", "ShiftRight", "AltLeft", "AltRight", "ControlLeft", "ControlRight", "MetaLeft", "MetaRight", "CapsLock", "Escape"]);

export function BootScreen({
  save,
  reducedMotion,
  onStart,
  onDesktop,
  onHelp,
  onTrophies,
  onOptions,
}: {
  save: CursorSave;
  reducedMotion: boolean;
  onStart: () => void;
  onDesktop: () => void;
  onHelp: () => void;
  onTrophies: () => void;
  onOptions: () => void;
}) {
  const coarse = useCoarsePointer();
  const [lines, setLines] = useState(reducedMotion ? LOG.length : 0);
  const booted = lines >= LOG.length;
  const fresh = !LEVEL_IDS.some((id) => isCleared(save, id));

  useEffect(() => {
    if (booted) return;
    const timer = setTimeout(() => setLines((n) => n + 1), n0(lines));
    return () => clearTimeout(timer);
  }, [lines, booted]);

  const startFromKey = useEffectEvent(() => onStart());
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

  const cleared = LEVEL_IDS.filter((id) => isCleared(save, id)).length;
  const trophies = Object.keys(save.achievements).length;

  return (
    <section className={cn(styles.root, styles.boot, "flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center gap-8 px-4 py-10")}>
      <pre className="w-[min(92vw,34rem)] whitespace-pre-wrap text-[1.05rem] leading-snug text-[#B8B8B8]" aria-hidden>
        {LOG.slice(0, lines).join("\n")}
        {!booted && <span className={reducedMotion ? "" : "animate-pulse"}>_</span>}
      </pre>
      <div className={cn("flex flex-col items-center text-center transition-opacity duration-500", booted ? "opacity-100" : "opacity-0")} aria-hidden={!booted}>
        <h1 className={styles.bootLogo}>
          Cursor
          <br />
          Escape
        </h1>
        <p className="mt-3 text-[1.25rem] text-[#9DE0E0]">You are the cursor. DeskOS 98 wants you deleted.</p>
        <div className={cn(styles.bootBar, "mt-5")}>
          <span />
        </div>
        <button type="button" data-start className={cn(styles.button, "mt-7 min-w-[12rem] text-[1.4em]")} onClick={onStart} disabled={!booted} aria-label={fresh ? "Start" : "Continue"}>
          {fresh ? "Start" : "Continue"}
        </button>
        <p className="mt-3 text-sm text-[#9DE0E0]">{coarse ? "Tap Start" : "Press any key"}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button type="button" className={styles.button} onClick={onDesktop} disabled={!booted}>
            <FolderOpen className="size-4" aria-hidden /> Desktop
          </button>
          <button type="button" className={styles.button} onClick={onHelp}>
            <CircleHelp className="size-4" aria-hidden /> How to play
          </button>
          <button type="button" className={styles.button} onClick={onTrophies}>
            <Trophy className="size-4" aria-hidden /> Trophies {trophies}/{CURSOR_ACHIEVEMENTS.length}
          </button>
          <button type="button" className={styles.button} onClick={onOptions}>
            <Settings2 className="size-4" aria-hidden /> Options
          </button>
        </div>
        <p className="mt-6 text-[1.05rem] text-[#B8B8B8]">
          {cleared}/{LEVEL_IDS.length} windows closed · {save.crashes.toLocaleString("en-US")} crashes
        </p>
      </div>
    </section>
  );
}

/** Each boot line a little later than the last. */
const n0 = (n: number) => (n === 0 ? 250 : n === 4 ? 520 : 260);
