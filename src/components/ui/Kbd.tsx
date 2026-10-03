import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** A keyboard key cap. */
export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex min-w-7 items-center justify-center rounded-md border border-b-[3px] px-1.5 py-0.5 font-mono text-[0.78rem] font-semibold",
        "border-[color-mix(in_oklab,var(--ink)_22%,transparent)] bg-surface text-ink",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
