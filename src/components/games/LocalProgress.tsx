"use client";

import { HardDrive } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { formatBytes } from "@/engine/save";
import { summarizeProgress } from "@/games/progress";
import type { GameSlug } from "@/games/slugs";

const subscribe = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
};

/** Shows whether this device has a save for the game. Nothing here ever leaves the device. */
export function LocalProgress({ slug, title }: { slug: GameSlug; title: string }) {
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
  const stats = summarizeProgress(slug, raw);

  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface p-7 text-ink">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
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
      {stats && (
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-surface-2 px-4 py-3">
              <dt className="font-mono text-xs uppercase tracking-wider text-muted-surface">{stat.label}</dt>
              <dd className="mt-1 font-display text-2xl font-extrabold tabular-nums">{stat.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
