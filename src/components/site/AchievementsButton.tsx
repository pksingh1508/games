"use client";

import { Lock, Trophy } from "lucide-react";
import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { ACHIEVEMENTS } from "@/engine/achievements";
import { metaSave } from "@/engine/meta";
import { useSave } from "@/engine/save";
import { cn } from "@/lib/cn";

const dateFormat = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" });

/** The trophy in the header, with the achievements list. */
export function AchievementsButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const meta = useSave(metaSave);
  const unlocked = ACHIEVEMENTS.filter((a) => meta.achievements[a.id]).length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "relative inline-flex h-10 items-center gap-1.5 rounded-xl px-2.5 font-mono text-sm font-semibold text-ink-on-bg hover:bg-white/8",
          className,
        )}
        aria-label={`Achievements: ${unlocked} of ${ACHIEVEMENTS.length} unlocked`}
      >
        <Trophy className="size-5 text-lie" strokeWidth={2.2} />
        <span aria-hidden>
          {unlocked}
          <span className="text-muted">/{ACHIEVEMENTS.length}</span>
        </span>
      </button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        eyebrow={`${unlocked} of ${ACHIEVEMENTS.length} unlocked`}
        title="Achievements"
        description="Little secrets around the arcade. They're saved on this device only."
      >
        <div className="mb-5 h-3 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent via-lie to-truth"
            style={{ width: `${(unlocked / ACHIEVEMENTS.length) * 100}%` }}
          />
        </div>
        <ul className="grid gap-2.5">
          {ACHIEVEMENTS.map((achievement) => {
            const at = meta.achievements[achievement.id];
            return (
              <li
                key={achievement.id}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border p-3.5",
                  at ? "border-lie/40 bg-lie/8" : "border-line bg-surface-2/50",
                )}
              >
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-xl",
                    at ? "bg-lie text-[#0E0B16]" : "bg-surface-2 text-muted-surface",
                  )}
                  aria-hidden
                >
                  {at ? <Trophy className="size-5" /> : <Lock className="size-4" />}
                </span>
                <div className="min-w-0">
                  <p className="font-display font-bold leading-tight">{at ? achievement.title : "???"}</p>
                  <p className="mt-0.5 text-sm text-muted-surface">
                    {at ? achievement.description : `Hint: ${achievement.hint}`}
                  </p>
                  {at && <p className="mt-1 font-mono text-xs text-muted-surface">Unlocked {dateFormat.format(at)}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      </Dialog>
    </>
  );
}
