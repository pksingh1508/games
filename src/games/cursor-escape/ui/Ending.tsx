"use client";

// The ending (Plan/12-cursor-escape.md §4 "Freedom", §5): the last [X] doesn't close a window, it closes
// DeskOS 98. The screen goes dark ("It's now safe to turn off your computer"), the game lets go of the
// mouse, and your real cursor comes back. You're free.
import { Check, FolderOpen, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "@/components/ui/toast-store";
import { shareResult } from "@/games/shared/share";
import { cn } from "@/lib/cn";
import { SITE } from "@/lib/site";
import { shutdownJingle } from "../audio/music";
import { HZ } from "../core/constants";
import styles from "../cursor-escape.module.css";
import type { CursorSave } from "../save";

const minutes = (ticks: number) => {
  const s = Math.floor(ticks / HZ);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export const endingShareText = (save: Pick<CursorSave, "crashes" | "stats">) =>
  `I escaped DeskOS 98 in ${minutes(save.stats.playTicks)} with ${save.crashes} ${save.crashes === 1 ? "crash" : "crashes"}. My hand still feels inverted.\n${SITE.url}/games/cursor-escape`;

export function Ending({ save, onDesktop }: { save: CursorSave; onDesktop: () => void }) {
  const [step, setStep] = useState<"shutting" | "safe" | "free">("shutting");
  const [shared, setShared] = useState(false);

  useEffect(() => {
    shutdownJingle();
    const a = setTimeout(() => setStep("safe"), 2200);
    const b = setTimeout(() => setStep("free"), 5200);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, []);

  const share = async () => {
    const outcome = await shareResult(endingShareText(save));
    if (outcome === "copied") {
      setShared(true);
      toast({ kind: "success", title: "Copied", description: "Paste it anywhere you like." });
    } else if (outcome === "failed") toast({ kind: "info", title: "Couldn't copy", description: "Your browser wouldn't let the game copy it." });
    else setShared(true);
  };

  if (step === "shutting") {
    return (
      <section className={cn(styles.root, styles.desk, "grid min-h-[calc(100dvh-4rem)] place-items-center px-4")} aria-label="Shutting down" data-ending="shutting">
        <div className={cn(styles.raised, styles.window, "w-[min(92vw,26rem)]")} role="status">
          <p className={styles.titlebar}>DeskOS 98</p>
          <p className="p-5 text-center text-[1.4rem]">DeskOS 98 is shutting down…</p>
        </div>
      </section>
    );
  }
  if (step === "safe") {
    return (
      <section className={cn(styles.root, styles.shutdown, "grid min-h-[calc(100dvh-4rem)] place-items-center px-4 text-center")} aria-label="Shut down" data-ending="safe">
        <p className="text-[clamp(1.5rem,4vw,2.4rem)]" role="status">
          It&apos;s now safe to turn off your computer.
        </p>
      </section>
    );
  }
  return (
    <section className={cn(styles.root, styles.shutdown, "grid min-h-[calc(100dvh-4rem)] place-items-center px-4 py-10 text-center")} aria-label="You're free" data-ending="free">
      <div className={cn(styles.free, "flex flex-col items-center")}>
        <h1 className="text-[clamp(2.6rem,9vw,5.5rem)] leading-none text-white">You&apos;re free.</h1>
        <p className="mt-4 max-w-xl text-[1.3rem] text-[#F0A020]">That cursor over there is yours. Nobody&apos;s moving it but you.</p>
        <p className="mt-6 text-[1.15rem] text-[#B8B8B8]">
          {minutes(save.stats.playTicks)} in DeskOS 98 · {save.crashes.toLocaleString("en-US")} crashes · {Object.values(save.levels).filter((l) => l.medal === "gold").length} gold medals
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" className={styles.button} onClick={onDesktop} autoFocus>
            <FolderOpen className="size-4" aria-hidden /> Back to DeskOS
          </button>
          <button type="button" className={styles.button} onClick={share}>
            {shared ? <Check className="size-4" aria-hidden /> : <Share2 className="size-4" aria-hidden />} Share
          </button>
        </div>
      </div>
    </section>
  );
}
