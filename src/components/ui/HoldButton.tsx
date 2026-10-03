"use client";

import { useRef, useState, type ReactNode } from "react";
import { playSound } from "@/engine/audio/ui-sound";
import { cn } from "@/lib/cn";

/**
 * Hold-to-confirm, a classic game UI pattern for destructive actions. Works with
 * mouse, touch and keyboard (hold Space or Enter).
 */
export function HoldButton({
  onConfirm,
  children,
  holdMs = 1400,
  className,
  disabled,
}: {
  onConfirm: () => void;
  children: ReactNode;
  holdMs?: number;
  className?: string;
  disabled?: boolean;
}) {
  const [progress, setProgress] = useState(0);
  const frame = useRef<number | null>(null);
  const start = useRef(0);

  const stop = () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    setProgress(0);
  };

  const begin = () => {
    if (disabled || frame.current !== null) return;
    start.current = performance.now();
    playSound("tick");
    const step = (now: number) => {
      const p = Math.min(1, (now - start.current) / holdMs);
      setProgress(p);
      if (p >= 1) {
        frame.current = null;
        setProgress(0);
        onConfirm();
        return;
      }
      frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
  };

  return (
    <button
      type="button"
      disabled={disabled}
      className={cn("btn relative overflow-hidden", className)}
      style={{ ["--btn-bg" as string]: "#D62839", ["--btn-fg" as string]: "#FFFFFF", ["--btn-base" as string]: "#7D1420" }}
      onPointerDown={begin}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onKeyDown={(e) => {
        if ((e.key === " " || e.key === "Enter") && !e.repeat) {
          e.preventDefault();
          begin();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === " " || e.key === "Enter") stop();
      }}
      onBlur={stop}
      aria-describedby="hold-hint"
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 bg-black/30"
        style={{ width: `${progress * 100}%` }}
      />
      <span className="relative">{children}</span>
      <span id="hold-hint" className="sr-only">
        Press and hold to confirm.
      </span>
    </button>
  );
}
