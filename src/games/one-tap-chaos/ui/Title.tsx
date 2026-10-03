"use client";

// The title screen (Plan/09-one-tap-chaos.md §8.1): one huge button, TAP. Tapping it starts the
// game. No tricks on the title, which is itself a surprise.
import { CalendarDays, CircleHelp, Dumbbell, MonitorPlay, Settings2, Trophy } from "lucide-react";
import { useEffect, useEffectEvent, useState } from "react";
import { cn } from "@/lib/cn";
import type { Daily } from "../core/daily";
import { MICROGAME_IDS, unlockedMicrogames } from "../microgames";
import { OTC_ACHIEVEMENTS } from "../achievements";
import { CARD_ORDER } from "../rules";
import type { OtcSave } from "../save";
import styles from "../otc.module.css";
import { Metro } from "./Metro";

export function TapButton({ onTap, label = "TAP", ariaLabel = "Tap to start", size = "lg" }: { onTap: () => void; label?: string; ariaLabel?: string; size?: "lg" | "md" }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      type="button"
      onClick={onTap}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      data-pressed={pressed ? "" : undefined}
      className={cn(styles.tapButton, "group relative rounded-[50%] outline-offset-8", size === "lg" ? "w-[min(78vw,22rem)]" : "w-[min(70vw,16rem)]")}
      aria-label={ariaLabel}
      data-sound="coin"
    >
      <svg viewBox="0 0 240 150" className="block w-full drop-shadow-[0_10px_0_rgba(27,27,27,0.25)]" aria-hidden>
        <ellipse cx="120" cy="96" rx="110" ry="44" fill="#1C3A7F" stroke="#1B1B1B" strokeWidth="6" />
        <rect x="10" y="56" width="220" height="40" fill="#1C3A7F" />
        <path d="M10 56v40M230 56v40" stroke="#1B1B1B" strokeWidth="6" />
        <g className={styles.tapTop}>
          <ellipse cx="120" cy="56" rx="110" ry="44" fill="#2B59C3" stroke="#1B1B1B" strokeWidth="6" />
          <ellipse cx="88" cy="40" rx="50" ry="12" fill="#fff" opacity="0.28" />
          <text x="120" y="72" textAnchor="middle" fontSize="46" fill="#fff" fontFamily="var(--font-g-bungee)">
            {label}
          </text>
        </g>
      </svg>
    </button>
  );
}

export function TitleScreen({
  save,
  daily,
  onTap,
  onDaily,
  onPractice,
  onDemo,
  onHelp,
  onTrophies,
  onOptions,
}: {
  save: OtcSave;
  daily: Daily;
  onTap: () => void;
  onDaily: () => void;
  onPractice: () => void;
  onDemo: () => void;
  onHelp: () => void;
  onTrophies: () => void;
  onOptions: () => void;
}) {
  const start = useEffectEvent(() => onTap());
  // Space or Enter anywhere on the title presses TAP (unless you're on another button).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || (event.code !== "Space" && event.code !== "Enter")) return;
      const active = document.activeElement;
      if (document.querySelector("[role=dialog]") || (active && active !== document.body && active.closest("button, a, input, select, textarea"))) return;
      event.preventDefault();
      start();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const today = save.daily?.key === daily.key ? save.daily : null;
  const unlocked = unlockedMicrogames(save.best).length;
  const trophies = Object.keys(save.achievements).length;

  return (
    <section className={cn(styles.stage, "flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center px-4 py-10 text-center")}>
      <div className={styles.rays} aria-hidden />
      <p className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-[#544924]">Mind Games Arcade presents</p>
      <h1 className={cn(styles.show, styles.wobble, "mt-3 text-[clamp(3rem,13vw,7.5rem)] leading-[0.9] text-white [-webkit-text-stroke:5px_#1B1B1B] [paint-order:stroke_fill] [text-shadow:0_8px_0_#1B1B1B]")}>
        One Tap
        <br />
        Chaos
      </h1>
      <p className={cn(styles.show, "mt-4 rounded-full bg-[#1B1B1B] px-4 py-1.5 text-base text-[#FFD23F] sm:text-lg")}>One button. Infinite ways to mess it up.</p>

      <div className="mt-8 flex items-end justify-center gap-2 sm:gap-6">
        <Metro mood="smug" bpm={100} className="hidden h-44 w-32 sm:block" />
        <TapButton onTap={onTap} />
      </div>
      <p className="mt-3 text-sm font-semibold text-[#544924]">No tricks on this one. It really is just a button.<span className="hidden sm:inline"> (Or press Space.)</span></p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={onDaily} className="btn btn-secondary" data-sound="click">
          <CalendarDays className="size-5" aria-hidden />
          Daily Chaos #{daily.number}
          {today && <span className="rounded-full bg-[#1B1B1B] px-2 py-0.5 font-mono text-xs text-[#FFD23F]">best {today.best}</span>}
        </button>
        <button type="button" onClick={onPractice} className="btn btn-secondary" data-sound="click">
          <Dumbbell className="size-5" aria-hidden /> Practice room
        </button>
        <button type="button" onClick={onDemo} className="btn btn-secondary" data-sound="click">
          <MonitorPlay className="size-5" aria-hidden /> Watch the demo
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[#1B1B1B]">
        <button type="button" onClick={onHelp} className="btn btn-ghost btn-sm" data-sound="click">
          <CircleHelp className="size-4" aria-hidden /> How to play
        </button>
        <button type="button" onClick={onTrophies} className="btn btn-ghost btn-sm" data-sound="click">
          <Trophy className="size-4" aria-hidden /> Trophies <span className="font-mono text-xs">{trophies}/{OTC_ACHIEVEMENTS.length}</span>
        </button>
        <button type="button" onClick={onOptions} className="btn btn-ghost btn-sm" data-sound="click">
          <Settings2 className="size-4" aria-hidden /> Options
        </button>
      </div>

      <p className="mt-6 font-mono text-xs font-bold uppercase tracking-widest text-[#544924]">
        Best {save.best} · {unlocked}/{MICROGAME_IDS.length} microgames · {save.cardsUnlocked}/{CARD_ORDER.length} chaos cards
      </p>
    </section>
  );
}
