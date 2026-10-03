"use client";

import { AnimatePresence, m } from "motion/react";
import { AlertTriangle, Check, Info, Trophy, X } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { dismissToast, toastStore, type ToastItem } from "./toast-store";

const ICONS = { info: Info, success: Check, achievement: Trophy, warning: AlertTriangle } as const;

function ToastCard({ item }: { item: ToastItem }) {
  const Icon = ICONS[item.kind];

  useEffect(() => {
    if (!item.duration) return;
    const timer = setTimeout(() => dismissToast(item.id), item.duration);
    return () => clearTimeout(timer);
  }, [item.id, item.duration]);

  return (
    <m.li
      layout
      initial={{ opacity: 0, y: 24, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.94 }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      className={cn(
        "pointer-events-auto relative flex w-[min(92vw,22rem)] gap-3 overflow-hidden rounded-2xl border p-4 shadow-2xl",
        "border-line bg-surface text-ink",
        item.kind === "achievement" && "border-lie/60",
      )}
      role={item.kind === "warning" ? "alert" : "status"}
    >
      {item.kind === "achievement" && (
        <span aria-hidden className="absolute inset-y-0 left-0 w-1.5 bg-lie" />
      )}
      <span
        aria-hidden
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl",
          item.kind === "achievement" ? "bg-lie text-[#0E0B16]" : "bg-surface-2 text-ink",
          item.kind === "warning" && "bg-warn text-[#0E0B16]",
        )}
      >
        <Icon className="size-5" strokeWidth={2.4} />
      </span>
      <div className="min-w-0 flex-1">
        {item.kind === "achievement" && (
          <p className="pixel-label text-[0.7rem] text-lie">{item.eyebrow ?? "Achievement unlocked"}</p>
        )}
        {item.kind !== "achievement" && item.eyebrow && (
          <p className="pixel-label text-[0.7rem] text-muted-surface">{item.eyebrow}</p>
        )}
        <p className="font-display text-base font-bold leading-tight">{item.title}</p>
        {item.description && <div className="mt-1 text-sm text-muted-surface">{item.description}</div>}
        {item.action && (
          <button
            type="button"
            className="btn btn-sm mt-3"
            data-sound="click"
            onClick={() => {
              item.action?.onClick();
              dismissToast(item.id);
            }}
          >
            {item.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismissToast(item.id)}
        className="-m-1 grid size-8 shrink-0 place-items-center rounded-lg text-muted-surface hover:bg-surface-2 hover:text-ink"
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>
    </m.li>
  );
}

export function Toaster() {
  const items = useSyncExternalStore(toastStore.subscribe, toastStore.get, toastStore.getServer);
  return (
    <ol
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-3 p-4 sm:items-end sm:p-6"
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <ToastCard key={item.id} item={item} />
        ))}
      </AnimatePresence>
    </ol>
  );
}
