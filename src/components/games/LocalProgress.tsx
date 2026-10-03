"use client";

import { HardDrive } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { formatBytes } from "@/engine/save";

const subscribe = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
};

/** Shows whether this device has a save for the game. Nothing here ever leaves the device. */
export function LocalProgress({ slug, title }: { slug: string; title: string }) {
  const key = `mfg:game:${slug}`;
  const raw = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => null,
  );

  return (
    <div className="flex flex-col gap-6 rounded-[var(--radius-card)] border border-line bg-surface p-7 text-ink sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-surface-2">
          <HardDrive className="size-6" aria-hidden />
        </span>
        <div>
          <p className="font-display text-xl font-bold">Your progress</p>
          {raw ? (
            <p className="mt-1 text-muted-surface">
              Save found on this device ({formatBytes(new Blob([raw]).size)}). It never leaves your browser.
            </p>
          ) : (
            <p className="mt-1 text-muted-surface">
              No save yet. When you play {title}, your progress will be stored here, on this device only.
            </p>
          )}
        </div>
      </div>
      <Link href="/data" className="btn btn-secondary btn-sm shrink-0" data-sound="click">
        Manage your data
      </Link>
    </div>
  );
}
