"use client";

import { useRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

function motionReduced() {
  const motion = document.documentElement.dataset.motion;
  if (motion === "reduce") return true;
  if (motion === "full") return false;
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Tilts its content toward the pointer, like picking up a game cartridge.
 * Mouse only; reduce-motion turns it off.
 */
export function TiltCard({
  children,
  className,
  max = 7,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return (
    <div
      {...rest}
      ref={ref}
      className={cn("cabinet relative", className)}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || motionReduced()) return;
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        el.style.setProperty("--ry", `${((x - 0.5) * 2 * max).toFixed(2)}deg`);
        el.style.setProperty("--rx", `${((0.5 - y) * 2 * max).toFixed(2)}deg`);
        el.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
        el.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
      }}
      onPointerLeave={reset}
    >
      {children}
      <span aria-hidden className="glare" />
    </div>
  );
}
