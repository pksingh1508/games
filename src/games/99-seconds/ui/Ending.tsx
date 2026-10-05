"use client";

// The endings (Plan/03-99-seconds.md §5 "The finale", "Epilogue"). The True Ending: the notes you wrote are the notes
// you found, so the loop closes; then the credits, which run for exactly 99 seconds. The Paradox: you left without
// writing them, so nobody ever did, and the rooms fold in on themselves.
import { useEffect, useEffectEvent, useState } from "react";
import { cn } from "@/lib/cn";
import { SevenSeg, pad2, type ArtState } from "../art/kit";
import { SceneArt } from "../art/scene";
import styles from "../ninety.module.css";

const CREDITS: Array<[string, string]> = [
  ["99 Seconds", "A Mind Games Arcade game"],
  ["Starring", "You"],
  ["Also starring", "You, earlier"],
  ["And", "You, later"],
  ["The notes", "Written by you. Found by you. Written by you."],
  ["The clock", "As itself"],
  ["The little clock", "As time (flying)"],
  ["The pot", "Did not boil (while watched)"],
  ["The bird at 13", "Tap. Tap. Tap."],
  ["Music", "Exactly one loop long"],
  ["Filmed", "In one room, many times"],
  ["Thanks", "To everyone who waited"],
];

export function TrueEnding({ onDone }: { onDone(seen: boolean): void }) {
  const [stage, setStage] = useState<"close" | "credits">("close");
  const [left, setLeft] = useState(99);
  const finished = useEffectEvent(() => onDone(true));
  useEffect(() => {
    if (stage !== "credits") return;
    if (left <= 0) {
      finished();
      return;
    }
    const timer = window.setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [stage, left]);

  if (stage === "close") {
    return (
      <div className={cn(styles.root, "grid min-h-[calc(100dvh-4rem)] place-items-center px-4 py-8")} data-ending="true">
        <div className="flex max-w-xl flex-col items-center text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--n9-amber)]">The hundredth second</p>
          <h1 className={cn(styles.display, "mt-3 text-6xl")}>The loop closes</h1>
          <div className="mt-6 space-y-3 text-lg text-[var(--n9-dim)]">
            <p>The notes are on the pad, in your handwriting. Someone will find them. Someone always has.</p>
            <p>You step through the door behind the pendulum, and the clock, for the first time, doesn&apos;t start again.</p>
          </div>
          <button type="button" className={cn(styles.btn, styles.primary, "mt-8 !min-h-12 px-6")} onClick={() => setStage("credits")} data-credits-start>
            …
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className={styles.credits} data-credits data-left={left}>
      <div className="absolute right-4 top-4 z-10 flex items-center gap-3">
        <span className={styles.bigClock} style={{ padding: "0.3rem 0.6rem" }} aria-label={`${left} seconds`}>
          <svg viewBox="0 0 176 120" style={{ height: "2.2rem" }} aria-hidden>
            <SevenSeg x={10} y={10} h={100} value={pad2(left)} />
          </svg>
        </span>
        <button type="button" className={styles.btn} onClick={() => onDone(true)} data-skip-credits>
          Skip
        </button>
      </div>
      <div className={cn(styles.roll, "mx-auto max-w-md px-6 text-center")}>
        {CREDITS.map(([role, who]) => (
          <div key={role} className="py-10">
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--n9-amber)]">{role}</p>
            <p className={cn(styles.display, "mt-2 text-3xl")}>{who}</p>
          </div>
        ))}
        <p className={cn(styles.hand, "py-24 text-4xl")}>You&apos;ve been here before.</p>
      </div>
    </div>
  );
}

export function ParadoxEnding({ room, onAgain, onTitle }: { room: ArtState; onAgain(): void; onTitle(): void }) {
  const [folded, setFolded] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setFolded(true), 2500);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <div className={cn(styles.root, "grid min-h-[calc(100dvh-4rem)] place-items-center px-4 py-8")} data-ending="paradox">
      <div className="flex w-full max-w-2xl flex-col items-center text-center">
        {!folded ? (
          <div className={cn(styles.fold, "aspect-video w-full overflow-hidden rounded-xl")}>
            <SceneArt a={room} label="The Clock Room, folding in on itself" />
          </div>
        ) : (
          <>
            <h1 className={cn(styles.display, "text-7xl")}>Paradox</h1>
            <div className="mt-6 space-y-3 text-lg text-[var(--n9-dim)]">
              <p>You left without writing the notes. So nobody ever wrote them. So nobody ever found them.</p>
              <p>So nobody ever got out. Including you. The rooms fold up like a letter nobody sent.</p>
            </div>
            <div className="mt-8 flex gap-3">
              <button type="button" className={cn(styles.btn, styles.primary, "!min-h-12 px-6")} onClick={onAgain} data-again>
                Try again (write what you read)
              </button>
              <button type="button" className={cn(styles.btn, "!min-h-12")} onClick={onTitle} data-to-title>
                Title
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
