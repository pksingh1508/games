"use client";

// Bomb questions (Plan/02-nope.md §3): a fuse burns across the card. Red means answer in time.
// Green is a "kind fuse": let it run out. The tell isn't only the colour: a red fuse ends in a
// fiery spark on a dashed rope, a kind fuse ends in a little flower on a dotted rope.
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import styles from "../nope.module.css";
import { useGameCountdown } from "../play/context";
import { sfx } from "../sfx";

export function BombFuse({
  seconds,
  kind,
  onExpire,
  onSpark,
}: {
  seconds: number;
  kind: "red" | "green";
  onExpire: () => void;
  /** Someone clicked the burning end. */
  onSpark: () => void;
}) {
  const ms = seconds * 1000;
  const left = useGameCountdown(ms, onExpire);
  const shown = Math.ceil(left / 1000);
  const lastTick = useRef(shown);

  useEffect(() => {
    if (shown === lastTick.current || shown <= 0) return;
    lastTick.current = shown;
    sfx.tick(kind, shown <= 3);
  }, [shown, kind]);

  const fraction = left / ms;
  const red = kind === "red";
  const urgent = red && shown <= 3;

  return (
    <div className="relative mx-5 mt-1 flex h-12 items-center gap-3 sm:mx-8" role="timer" aria-live="off">
      <span className="sr-only">
        {red ? "A red bomb fuse is burning" : "A green fuse is burning"}: {shown} seconds left.
      </span>
      {/* The bomb */}
      <span
        aria-hidden
        className={cn(
          "relative grid size-11 shrink-0 place-items-center rounded-full border-[3px] border-[#161414] text-lg leading-none text-[#FFF4D6]",
          styles.show,
          red ? "bg-[#161414]" : "bg-[#2F6B1F]",
          urgent && "animate-shake",
        )}
      >
        {shown}
        <span className="absolute -right-1 -top-1 h-3 w-2 rotate-45 rounded-sm bg-[#8A8070]" />
      </span>

      {/* The rope */}
      <div aria-hidden className="relative h-3 flex-1 rounded-full bg-[#161414]/10">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${fraction * 100}%`,
            background: red
              ? "repeating-linear-gradient(90deg, #8A4B21 0 10px, #5C2F12 10px 14px)"
              : "radial-gradient(circle, #4E9A2F 0 2.5px, transparent 3px) 0 50% / 9px 9px repeat-x, #9BE07A",
          }}
        />
      </div>

      {/* The burning end: always clickable, like everything else */}
      <button
        type="button"
        onClick={onSpark}
        className="absolute top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
        style={{ left: `calc(3.5rem + (100% - 3.5rem) * ${fraction})` }}
        aria-label={red ? "The fuse's spark" : "The fuse's flower"}
      >
        {red ? (
          <svg viewBox="0 0 40 40" className={cn("size-9 flash-risk", styles.spark)} aria-hidden>
            <path d="M20 2 l4 10 l10 -4 l-5 10 l10 4 l-10 4 l5 10 l-10 -4 l-4 10 l-4 -10 l-10 4 l5 -10 l-10 -4 l10 -4 l-5 -10 l10 4 z" fill="#FFC93C" stroke="#D41F22" strokeWidth="2.5" strokeLinejoin="round" />
            <circle cx="20" cy="20" r="5" fill="#FFF4D6" />
          </svg>
        ) : (
          <svg viewBox="0 0 40 40" className={cn("size-9", styles.leaf)} aria-hidden>
            {[0, 72, 144, 216, 288].map((angle) => (
              <ellipse key={angle} cx="20" cy="10" rx="6" ry="9" fill="#FFF4D6" stroke="#2F6B1F" strokeWidth="2" transform={`rotate(${angle} 20 20)`} />
            ))}
            <circle cx="20" cy="20" r="6" fill="#FFC93C" stroke="#2F6B1F" strokeWidth="2" />
          </svg>
        )}
      </button>
    </div>
  );
}
