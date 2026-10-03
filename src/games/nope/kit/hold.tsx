"use client";

// "Hover" questions (Plan/02-nope.md §2): hold the cursor on something, or press and hold it
// on a touch screen, or hold Space/Enter on it. A quick click or tap is a poke, which is
// usually the wrong answer.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { usePlay } from "../play/context";

const POKE_MS = 220;

export function HoldTarget({
  ms = 2000,
  onDone,
  onPoke,
  onProgress,
  label,
  children,
  className,
  ring = true,
}: {
  ms?: number;
  onDone: () => void;
  /** A quick click/tap/keypress. */
  onPoke?: () => void;
  /** 0–1, as the hold builds up. */
  onProgress?: (progress: number) => void;
  label: string;
  children: ReactNode;
  className?: string;
  ring?: boolean;
}) {
  const { paused } = usePlay();
  const [progress, setProgress] = useState(0);
  const live = useRef({ hovering: false, pressing: false, key: false, downAt: 0, value: 0, done: false, paused: false });
  const frame = useRef<number | null>(null);
  // The animation loop runs outside React; it reads the latest callbacks from here.
  const callbacks = useRef({ onDone, onProgress });

  useEffect(() => {
    callbacks.current = { onDone, onProgress };
  });

  useEffect(() => {
    live.current.paused = paused;
  }, [paused]);

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );

  const run = () => {
    if (frame.current !== null || live.current.done) return;
    let last = performance.now();
    const step = (now: number) => {
      const state = live.current;
      const dt = now - last;
      last = now;
      const active = state.hovering || state.pressing || state.key;
      if (!state.paused) {
        state.value = Math.min(1, Math.max(0, state.value + (active ? dt / ms : -dt / (ms * 1.5))));
      }
      setProgress(state.value);
      callbacks.current.onProgress?.(state.value);
      if (state.value >= 1) {
        state.done = true;
        frame.current = null;
        callbacks.current.onDone();
        return;
      }
      if (!active && state.value <= 0) {
        frame.current = null;
        return;
      }
      frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
  };

  const press = () => {
    live.current.downAt = performance.now();
  };
  const release = () => {
    const quick = performance.now() - live.current.downAt < POKE_MS;
    if (quick && !live.current.done) onPoke?.();
  };

  return (
    <button
      type="button"
      aria-label={label}
      className={cn("relative select-none touch-none [-webkit-touch-callout:none]", className)}
      onContextMenu={(event) => event.preventDefault()}
      onPointerEnter={(event) => {
        if (event.pointerType !== "mouse") return;
        live.current.hovering = true;
        run();
      }}
      onPointerLeave={() => {
        live.current.hovering = false;
        live.current.pressing = false;
      }}
      onPointerDown={(event) => {
        live.current.pressing = true;
        press();
        if (event.pointerType !== "mouse") event.currentTarget.setPointerCapture(event.pointerId);
        run();
      }}
      onPointerUp={() => {
        live.current.pressing = false;
        release();
      }}
      onPointerCancel={() => {
        live.current.pressing = false;
      }}
      onKeyDown={(event) => {
        if (event.key !== " " && event.key !== "Enter") return;
        event.preventDefault();
        if (event.repeat || live.current.key) return;
        live.current.key = true;
        press();
        run();
      }}
      onKeyUp={(event) => {
        if (event.key !== " " && event.key !== "Enter") return;
        live.current.key = false;
        release();
      }}
      onBlur={() => {
        live.current.key = false;
      }}
    >
      {children}
      {ring && progress > 0 && (
        <svg aria-hidden viewBox="0 0 40 40" className="pointer-events-none absolute -right-2 -top-2 size-10 -rotate-90">
          <circle cx="20" cy="20" r="16" fill="#161414" opacity="0.85" />
          <circle
            cx="20"
            cy="20"
            r="11"
            fill="none"
            stroke="#FFC93C"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${progress * 69.1} 69.1`}
          />
        </svg>
      )}
    </button>
  );
}
