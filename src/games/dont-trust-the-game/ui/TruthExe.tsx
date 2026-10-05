"use client";

// TRUTH.exe (Plan/04-dont-trust-the-game.md §3, §9): a black square with one glitchy eye and scan lines. It always
// tells the truth, in riddles at first. And HELPER's honest offer to skip, after ten minutes stuck.
import { cn } from "@/lib/cn";
import styles from "../dttg.module.css";
import type { DirectorView } from "../play/director";
import { useGame } from "./context";

export function TruthExe({ view }: { view: DirectorView }) {
  const { director } = useGame();
  return (
    <>
      {view.truthExe && (
        <div key={view.truthExe.key} className={cn(styles.truth, styles.fade)} data-truth={view.truthExe.level} role="status">
          <button type="button" className={styles.truthText} onClick={() => director.dismissHint()} aria-label={`TRUTH.exe says: ${view.truthExe.text} (dismiss)`}>
            {view.truthExe.text}
          </button>
          <TruthEye />
        </div>
      )}
      {view.skip && (
        <div className={cn(styles.overlay, styles.fade)} data-skip-offer>
          <div className={cn(styles.menu, styles.card, "!h-auto")}>
            <p className={styles.menuTitle}>Skip?</p>
            <p>HELPER, looking right at you: no tricks. You can skip to the next chapter.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" className={styles.fakeBtn} onClick={() => director.acceptSkip(true)} data-skip-yes>
                Skip this chapter
              </button>
              <button type="button" className={styles.fakeBtn} onClick={() => director.acceptSkip(false)} data-skip-no>
                Keep trying
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function TruthEye() {
  return (
    <span className={styles.truthBox} aria-hidden>
      <svg viewBox="0 0 48 48" className="size-full">
        <ellipse cx="24" cy="24" rx="12" ry="8" fill="#fff" />
        <circle cx="26" cy="24" r="4.5" fill="#0b0b0b" />
        <rect x="8" y="30" width="18" height="2" fill="#00f0ff" opacity="0.7" />
        <rect x="22" y="14" width="16" height="2" fill="#ff3d7f" opacity="0.7" />
      </svg>
    </span>
  );
}
