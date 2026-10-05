"use client";

// The pause menu, which is part of the fiction (Plan/04-dont-trust-the-game.md §4 "Resume = Restart", "The Fake
// Quit"). Resume, Options and Quit, in a game UI from 2004. Quit never works (until the very end, in the credits).
import { cn } from "@/lib/cn";
import styles from "../dttg.module.css";

export function FakePause({ onResume, onOptions, onQuit }: { onResume: () => void; onOptions: () => void; onQuit: () => void }) {
  return (
    <div className={styles.overlay} data-fake-pause>
      <div className={cn(styles.menu, styles.card, "!h-auto")} role="dialog" aria-label="Paused (inside the game)">
        <p className={styles.menuTitle}>PAUSED</p>
        <button type="button" className={styles.fakeBtn} onClick={onResume} data-fake="resume">
          Resume
        </button>
        <button type="button" className={styles.fakeBtn} onClick={onOptions} data-fake="options">
          Options
        </button>
        <button type="button" className={styles.fakeBtn} onClick={onQuit} data-fake="quit">
          Quit
        </button>
      </div>
    </div>
  );
}
