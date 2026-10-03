"use client";

import { AnimatePresence, m } from "motion/react";
import { X } from "lucide-react";
import { Dialog as RadixDialog } from "radix-ui";
import type { ReactNode } from "react";
import { playSound } from "@/engine/audio/ui-sound";
import { cn } from "@/lib/cn";

/** A themed modal built on Radix (focus trap, Escape, screen readers) with a springy entrance. */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  eyebrow,
  game,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  eyebrow?: string;
  /** Wear a game's palette (dialogs render outside the page, so they don't inherit it). */
  game?: string;
}) {
  return (
    <RadixDialog.Root
      open={open}
      onOpenChange={(next) => {
        playSound(next ? "open" : "close");
        onOpenChange(next);
      }}
    >
      <AnimatePresence>
        {open && (
          <RadixDialog.Portal forceMount>
            <RadixDialog.Overlay asChild forceMount>
              <m.div
                className="fixed inset-0 z-[70] bg-[#05040a]/75 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </RadixDialog.Overlay>
            <RadixDialog.Content asChild forceMount>
              <m.div
                data-game={game}
                className={cn(
                  "fixed left-1/2 top-1/2 z-[71] max-h-[86vh] w-[min(94vw,34rem)] overflow-y-auto rounded-[1.75rem] border border-line bg-surface p-6 text-ink shadow-2xl sm:p-8",
                  className,
                )}
                initial={{ opacity: 0, scale: 0.92, x: "-50%", y: "-46%" }}
                animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-48%" }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              >
                {eyebrow && <p className="pixel-label text-accent-ink">{eyebrow}</p>}
                <RadixDialog.Title className="mt-1 pr-10 font-display text-3xl font-extrabold leading-tight tracking-tight">
                  {title}
                </RadixDialog.Title>
                {description ? (
                  <RadixDialog.Description className="mt-2 text-muted-surface">{description}</RadixDialog.Description>
                ) : (
                  <RadixDialog.Description className="sr-only">{typeof title === "string" ? title : "Dialog"}</RadixDialog.Description>
                )}
                <div className="mt-6">{children}</div>
                <RadixDialog.Close
                  className="absolute right-5 top-5 grid size-10 place-items-center rounded-xl text-muted-surface hover:bg-surface-2 hover:text-ink"
                  aria-label="Close"
                >
                  <X className="size-5" />
                </RadixDialog.Close>
              </m.div>
            </RadixDialog.Content>
          </RadixDialog.Portal>
        )}
      </AnimatePresence>
    </RadixDialog.Root>
  );
}
