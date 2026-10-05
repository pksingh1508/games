"use client";

// The title (Plan/14-dont-blink.md §8.1): a black screen with the name. Every few seconds the screen blinks, and
// something on it changes. Nothing says so; players notice on their own (or don't).
import { BookOpen, Moon, Settings2, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import styles from "../dont-blink.module.css";
import { isCleared, NIGHT_NUMBERS, nextNight } from "../progress";
import type { DontBlinkSave } from "../save";

/** The things that change, one per blink (each comes back a few blinks later). */
const CHANGES = ["eyes", "title", "tagline", "museum", "order", "figure", "start", "closed"] as const;
type Change = (typeof CHANGES)[number];

export interface TitleProps {
  save: DontBlinkSave;
  reduceFlashing: boolean;
  reducedMotion: boolean;
  onStart(): void;
  onNights(): void;
  onHelp(): void;
  onTrophies(): void;
  onOptions(): void;
}

export function TitleScreen({ save, reduceFlashing, reducedMotion, onStart, onNights, onHelp, onTrophies, onOptions }: TitleProps) {
  const [changed, setChanged] = useState<Change[]>([]);
  const [shut, setShut] = useState(false);

  // Blink every few seconds; while the eyes are shut, one thing changes (and the oldest change goes back).
  useEffect(() => {
    let timer = 0;
    const blink = () => {
      setShut(true);
      timer = window.setTimeout(
        () => {
          setChanged((before) => {
            const fresh = CHANGES.filter((c) => !before.includes(c));
            const next = fresh[Math.floor(Math.random() * fresh.length)] ?? CHANGES[0];
            const kept = before.length >= 2 ? before.slice(1) : before;
            return [...kept, next];
          });
          timer = window.setTimeout(() => {
            setShut(false);
            timer = window.setTimeout(blink, 3800 + Math.random() * 3200);
          }, 120);
        },
        reducedMotion ? 60 : 110,
      );
    };
    timer = window.setTimeout(blink, 3200);
    return () => window.clearTimeout(timer);
  }, [reducedMotion]);

  const has = (c: Change) => changed.includes(c);
  const cleared = NIGHT_NUMBERS.filter((nt) => isCleared(save, nt)).length;
  const next = nextNight(save);
  // With Reduce flashing, a soft dim and a blur instead of black.
  const lidStyle = reduceFlashing ? { background: "rgba(24,32,29,0.72)", opacity: shut ? 1 : 0, backdropFilter: shut ? "blur(10px)" : undefined } : { opacity: shut ? 1 : 0 };
  const menu = [
    { key: "help", label: "How to play", icon: BookOpen, onClick: onHelp, data: "help" },
    { key: "trophies", label: "Trophies", icon: Trophy, onClick: onTrophies, data: "trophies" },
  ];
  if (has("order")) menu.reverse();

  return (
    <div className={cn(styles.root, styles.title)} data-title-screen data-changes={changed.join(" ")}>
      <div className="relative z-10 flex w-full max-w-xl flex-col items-center text-center">
        <div className={styles.eyes} aria-hidden data-title-eyes>
          {[0, 1].map((k) => (
            <div key={k} className={styles.eyeShape} style={has("closed") ? { height: "0.25rem", marginTop: "0.9rem", background: "#cfe8dc" } : undefined}>
              {!has("closed") && <span className={styles.iris} style={{ transform: has("eyes") ? "translateX(-0.95rem)" : undefined }} />}
            </div>
          ))}
        </div>
        <p className="mt-8 font-[family-name:var(--font-g-vt323)] text-lg tracking-[0.3em] text-[var(--db-dim)]">
          THE MARLOW MUSEUM OF CURIOUS {has("museum") ? "THINKS" : "THINGS"}
        </p>
        <h1 className={cn(styles.display, "mt-2 text-7xl text-[var(--db-ink)] sm:text-8xl")}>{has("title") ? "Don't Blnik" : "Don't Blink"}</h1>
        <p className="mt-4 max-w-md text-[var(--db-dim)]">{has("tagline") ? "Something changed when you blinked. You did blink." : "Something changes every time you blink. You will blink."}</p>

        <div className="mt-9 grid w-full max-w-sm gap-2.5">
          <button type="button" className={cn(styles.btn, styles.primary, "!min-h-12 text-lg")} onClick={onStart} data-play>
            <Moon className="size-5" aria-hidden />
            {has("start") ? "Start your last shift" : cleared === 0 ? "Start the night shift" : cleared >= 5 ? "Back to the cameras" : `Night ${next}`}
          </button>
          <button type="button" className={styles.btn} onClick={onNights} data-nights>
            Nights{cleared > 0 ? ` · ${cleared}/5 survived` : ""}
          </button>
          <div className="grid grid-cols-3 gap-2">
            {menu.map((m) => (
              <button key={m.key} type="button" className={cn(styles.btn, "whitespace-nowrap !px-2 text-sm")} onClick={m.onClick} data-open={m.data}>
                <m.icon className="size-4" aria-hidden />
                <span className="max-[380px]:sr-only">{m.label}</span>
              </button>
            ))}
            <button type="button" className={cn(styles.btn, "!px-2 text-sm")} onClick={onOptions} data-open="options">
              <Settings2 className="size-4" aria-hidden />
              <span className="max-[380px]:sr-only">Options</span>
            </button>
          </div>
        </div>
      </div>

      {has("figure") && (
        <svg className="absolute bottom-6 right-[8%] h-28 w-10 opacity-80" viewBox="0 0 40 112" aria-hidden data-title-figure>
          <ellipse cx="20" cy="15" rx="9" ry="12" fill="#030404" />
          <path d="M6 112 Q2 60 10 30 L30 30 Q38 60 34 112 Z" fill="#030404" />
          <circle cx="16.5" cy="14" r="1.1" fill="#cfe8dc" />
          <circle cx="23.5" cy="14" r="1.1" fill="#cfe8dc" />
        </svg>
      )}

      {/* The title's own blink. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-20 bg-[#020101]" style={{ ...lidStyle, transition: reducedMotion ? undefined : "opacity 90ms linear" }} />
    </div>
  );
}
