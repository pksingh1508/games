"use client";

// The title screen (Plan/15-gravity-is-lying.md §8.1): the logo turns slowly back and forth over a
// turning compass ("lying" hangs upside down). Press Start, and the whole menu falls up off the
// screen.
import { CircleHelp, Map as MapIcon, Settings2, Trophy } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useCoarsePointer } from "@/games/shared/device";
import { cn } from "@/lib/cn";
import { GRAVITY_ACHIEVEMENTS } from "../achievements";
import { appleCount, isCleared } from "../core/progress";
import styles from "../gravity-is-lying.module.css";
import { ROOM_IDS } from "../rooms";
import type { GravitySave } from "../save";
import { AppleIcon, IsaacFace, NewtFigure, SkullIcon } from "./icons";

const IGNORED_KEYS = new Set(["Tab", "ShiftLeft", "ShiftRight", "AltLeft", "AltRight", "ControlLeft", "ControlRight", "MetaLeft", "MetaRight", "CapsLock"]);

function Compass({ className }: { className?: string }) {
  return (
    <svg viewBox="-50 -50 100 100" className={className} aria-hidden>
      <circle r={46} fill="none" stroke="#163238" strokeWidth={1.5} strokeDasharray="2 3" />
      <circle r={34} fill="none" stroke="#163238" strokeWidth={1} />
      {[0, 90, 180, 270].map((a) => (
        <path key={a} d="M0 -44 L5 -30 L-5 -30 Z" fill="#163238" transform={`rotate(${a})`} />
      ))}
      <path d="M0 30 L6 0 L0 -30 L-6 0 Z" fill="#0F7366" opacity={0.6} />
    </svg>
  );
}

export function TitleScreen({
  save,
  reducedMotion,
  onStart,
  onMap,
  onHelp,
  onTrophies,
  onOptions,
}: {
  save: GravitySave;
  reducedMotion: boolean;
  onStart: () => void;
  onMap: () => void;
  onHelp: () => void;
  onTrophies: () => void;
  onOptions: () => void;
}) {
  const [falling, setFalling] = useState(false);
  const coarse = useCoarsePointer();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = () => {
    if (falling) return;
    setFalling(true);
    timer.current = setTimeout(onStart, reducedMotion ? 120 : 900);
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

  const cleared = ROOM_IDS.filter((id) => isCleared(save, id)).length;
  const apples = appleCount(save, ROOM_IDS);
  const trophies = Object.keys(save.achievements).length;

  return (
    <section className={cn(styles.lab, falling && styles.fallingUp, "flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center overflow-clip px-4 py-12 text-center")}>
      <Compass className={styles.compass} />
      <div className={cn(styles.menu, "flex flex-col items-center")}>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#4B6267]">Mind Games Arcade presents</p>
        <h1 className={cn(styles.logo, "mt-6")} aria-label="Gravity Is Lying">
          <span className={styles.logoTop}>Gravity</span>
          <span className={styles.logoBottom} aria-hidden>
            <span>is</span>
            <span className={styles.flipped}>lying</span>
          </span>
        </h1>
        <div className="mt-6 flex items-end gap-6" aria-hidden>
          <NewtFigure size={64} />
          <IsaacFace size={58} lying />
        </div>
        <p className="mt-4 max-w-xl text-base font-semibold sm:text-lg">Down is a matter of opinion.</p>

        <div className="mt-9">
          <button type="button" data-start className={styles.start} onClick={start} aria-label="Start">
            START
          </button>
        </div>
        <p className={cn(styles.blink, "mt-5 min-h-[1.5em] text-sm font-bold")} aria-hidden>
          {coarse ? "Tap START" : "Press any key"}
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <button type="button" onClick={onMap} className="btn btn-secondary" data-sound="click">
            <MapIcon className="size-5" aria-hidden /> Map
          </button>
          <button type="button" onClick={onHelp} className="btn btn-ghost" data-sound="click">
            <CircleHelp className="size-5" aria-hidden /> How to play
          </button>
          <button type="button" onClick={onTrophies} className="btn btn-ghost" data-sound="click">
            <Trophy className="size-5" aria-hidden /> Trophies{" "}
            <span className="font-mono text-xs">
              {trophies}/{GRAVITY_ACHIEVEMENTS.length}
            </span>
          </button>
          <button type="button" onClick={onOptions} className="btn btn-ghost" data-sound="click">
            <Settings2 className="size-5" aria-hidden /> Options
          </button>
        </div>

        <p className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-bold">
          <span>
            {cleared}/{ROOM_IDS.length} rooms
          </span>
          <span className="inline-flex items-center gap-1.5">
            <AppleIcon size={15} /> {apples}/{ROOM_IDS.length * 3}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <SkullIcon size={13} /> {save.deaths.toLocaleString("en-US")}
          </span>
        </p>
      </div>
    </section>
  );
}
