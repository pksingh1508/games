"use client";

// The runaway answer (Plan/02-nope.md §4): it dodges your cursor (or your tap), but it tires out
// after a few escapes and can then be caught. The tell: it gets visibly out of breath.
import { m } from "motion/react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "../nope.module.css";
import { sfx } from "../sfx";
import { AnswerButton, type Tone } from "./ui";

export interface Spot {
  /** Centre, in % of the parent. */
  x: number;
  y: number;
}

export function Runaway({
  spots,
  escapes = 3,
  onCatch,
  tone = "green",
  children,
  className,
  label,
}: {
  /** Where it runs to, in order. The first is where it starts. */
  spots: Spot[];
  escapes?: number;
  onCatch: () => void;
  tone?: Tone;
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  const [escaped, setEscaped] = useState(0);
  const tired = escaped >= escapes;
  const spot = spots[Math.min(escaped, spots.length - 1)] ?? { x: 50, y: 50 };

  const dodge = () => {
    if (tired) return;
    sfx.whoosh();
    setEscaped((n) => n + 1);
  };

  return (
    <m.div
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
      initial={false}
      animate={{ left: `${spot.x}%`, top: `${spot.y}%` }}
      transition={{ type: "spring", stiffness: 420, damping: 26 }}
    >
      {/* A sensor ring: the mouse spooks it just before reaching it. */}
      {!tired && (
        <span
          aria-hidden
          className="absolute -inset-7 rounded-full"
          onPointerEnter={(event) => {
            if (event.pointerType === "mouse") dodge();
          }}
        />
      )}
      <AnswerButton
        tone={tone}
        aria-label={label}
        className={cn("relative whitespace-nowrap", tired && styles.tired, className)}
        onClick={() => (tired ? onCatch() : dodge())}
      >
        {children}
        {tired && (
          <span aria-hidden className="pointer-events-none absolute -right-2 -top-3 flex gap-0.5">
            <span className={cn("block size-2.5 rounded-full rounded-tr-none bg-[#3DE0FF]", styles.sweat)} />
            <span className={cn("block size-2 rounded-full rounded-tr-none bg-[#3DE0FF] [animation-delay:0.4s]", styles.sweat)} />
          </span>
        )}
      </AnswerButton>
      {tired && (
        <span aria-hidden className={cn(styles.show, "pointer-events-none absolute left-1/2 top-full mt-3 -translate-x-1/2 whitespace-nowrap text-sm text-[#615C52]")}>
          huff… huff…
        </span>
      )}
    </m.div>
  );
}
