"use client";

import { AnimatePresence, m } from "motion/react";
import { Share, SquarePlus, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { metaSave } from "@/engine/meta";
import { isStandalone } from "@/engine/save/storage-status";
import { SITE } from "@/lib/site";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const MIN_VISITS = 3;
const SNOOZE_MS = 30 * 24 * 60 * 60 * 1000;

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/**
 * After a few visits, suggest installing the arcade. On iPhone/iPad this matters most:
 * installed web apps keep their data (Safari's 7-day rule doesn't apply to them).
 */
export function InstallPrompt() {
  const pathname = usePathname();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [visible, setVisible] = useState(false);
  const [howToOpen, setHowToOpen] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    const meta = metaSave.get();
    const snoozed = meta.installPromptDismissedAt !== null && Date.now() - meta.installPromptDismissedAt < SNOOZE_MS;
    if (meta.visits < MIN_VISITS || snoozed) return;

    if (isIOS()) {
      // Wait a moment so it never pops up the instant a page opens.
      const timer = setTimeout(() => {
        setIos(true);
        setVisible(true);
      }, 4000);
      return () => clearTimeout(timer);
    }

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const dismiss = () => {
    setVisible(false);
    metaSave.update((meta) => ({ ...meta, installPromptDismissedAt: Date.now() }));
  };

  const install = async () => {
    if (ios) {
      setHowToOpen(true);
      return;
    }
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    if (choice.outcome === "accepted") setVisible(false);
  };

  // Never interrupt a game.
  const show = visible && !pathname.endsWith("/play");

  return (
    <>
      <AnimatePresence>
        {show && (
          <m.aside
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-4 left-4 z-50 w-[min(92vw,22rem)] rounded-2xl border border-line bg-surface p-4 text-ink shadow-2xl"
            aria-label="Install the arcade"
          >
            <button
              type="button"
              onClick={dismiss}
              className="absolute right-2 top-2 grid size-8 place-items-center rounded-lg text-muted-surface hover:bg-surface-2"
              aria-label="Not now"
            >
              <X className="size-4" />
            </button>
            <p className="pixel-label text-[0.7rem] text-lie">Tip</p>
            <p className="mt-1 pr-6 font-display text-lg font-bold leading-tight">Install the arcade</p>
            <p className="mt-1 text-sm text-muted-surface">
              It plays offline, and your saves are safer when it&apos;s installed.
            </p>
            <button type="button" className="btn btn-sm mt-3" data-sound="click" onClick={install}>
              {ios ? "Show me how" : "Install"}
            </button>
          </m.aside>
        )}
      </AnimatePresence>

      <Dialog
        open={howToOpen}
        onOpenChange={setHowToOpen}
        eyebrow="Install on iPhone or iPad"
        title={`Add ${SITE.name} to your Home Screen`}
      >
        <ol className="space-y-4 text-ink">
          <li className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2">
              <Share className="size-5" />
            </span>
            <span>
              Tap the <strong>Share</strong> button in Safari&apos;s toolbar.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2">
              <SquarePlus className="size-5" />
            </span>
            <span>
              Choose <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.
            </span>
          </li>
        </ol>
        <p className="mt-5 text-sm text-muted-surface">
          Installed, the arcade opens full screen, works offline, and Safari keeps your progress safe.
        </p>
      </Dialog>
    </>
  );
}
