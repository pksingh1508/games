"use client";

// The Truth Reveal (Plan/13-wrong-door.md §8.4): after a wrong door, every sign flips to TRUE or FALSE and
// every clue is explained, so you always know exactly why. (After a right door you can ask to see it too.)
import { cn } from "@/lib/cn";
import { revealFor } from "../content/reveal";
import type { Consequence, Floor } from "../logic/types";
import type { Choice, FloorPlay } from "../run/state";
import styles from "../wrong-door.module.css";

export const CONSEQUENCE_TEXT: Record<Consequence, { title: string; text: string }> = {
  downstairs: { title: "Down the stairs!", text: "Someone was waiting behind it. They chase you down a floor, and it's a new puzzle there." },
  wrongRoom: { title: "The Wrong Room", text: "Tick, tick… the door slams shut behind you. Find your way out in the dark, or lose a key." },
  cursed: { title: "Cursed", text: "Whispers follow you. Your next floor is cursed." },
  loseKey: { title: "A key slips away", text: "Silence, and darkness, and something falls from your pocket. You lose a key." },
};

export function TruthReveal({
  floor,
  play,
  choice,
  consequence,
  right,
  onContinue,
}: {
  floor: Floor;
  play: FloorPlay;
  choice: Choice | null;
  consequence: Consequence | null;
  /** Shown after a right door (no consequence). */
  right?: boolean;
  onContinue(): void;
}) {
  const r = revealFor(floor, play, choice);
  const c = consequence ? CONSEQUENCE_TEXT[consequence] : null;
  return (
    <div className={styles.overlay}>
      <section className={styles.card} role="dialog" aria-modal="true" aria-labelledby="wd-reveal" data-reveal={consequence ?? "right"}>
        {c ? (
          <>
            <p className={cn(styles.display, "text-sm uppercase tracking-widest text-[#a3283a]")}>Wrong door</p>
            <h2 id="wd-reveal" className={cn(styles.display, "text-3xl leading-tight")}>
              {c.title}
            </h2>
            <p className="mt-1">{c.text}</p>
          </>
        ) : (
          <h2 id="wd-reveal" className={cn(styles.display, "text-3xl leading-tight")}>
            {right ? "Why it was right" : "The truth"}
          </h2>
        )}

        <h3 className={cn(styles.display, "mt-4 text-lg")}>The truth</h3>
        <p className="font-bold" data-truth>
          {r.headline}
        </p>
        {r.plaque.length > 0 && (
          <div className="mt-2 rounded-lg bg-gradient-to-b from-[#e8c75a] to-[#c9a227] px-3 py-1.5 text-sm font-semibold">
            {r.plaque.map((l) => (
              <p key={l}>{l}</p>
            ))}
          </div>
        )}
        {r.signs.length > 0 && (
          <ul className={cn(styles.signs, "mt-2 grid gap-1")}>
            {r.signs.map((s) => (
              <li key={s.door} className="flex items-baseline gap-2">
                <span className={cn(styles.chip, "shrink-0")}>Door {s.door}</span>
                <span>“{s.text}”</span>
                {s.truth !== null && (
                  <span className={cn(styles.stamp, "ml-auto shrink-0")} data-true={s.truth ? "" : undefined} data-false={!s.truth ? "" : undefined}>
                    {s.truth ? "TRUE" : "FALSE"}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        {r.clues.length > 0 && (
          <ul className="mt-2 grid gap-1 text-[0.95rem]">
            {r.clues.map((t) => (
              <li key={t}>· {t}</li>
            ))}
          </ul>
        )}
        {r.why.length > 0 && (
          <>
            <h3 className={cn(styles.display, "mt-4 text-lg")}>Why not yours</h3>
            <ul className="grid gap-1" data-why>
              {r.why.map((t) => (
                <li key={t}>· {t}</li>
              ))}
            </ul>
          </>
        )}
        <div className="mt-5 flex justify-end">
          <button type="button" className={cn(styles.btn, styles.gold)} onClick={onContinue} autoFocus data-continue>
            {consequence === "wrongRoom" ? "Into the dark…" : "Carry on"}
          </button>
        </div>
      </section>
    </div>
  );
}
