"use client";

// HELPER (Plan/04-dont-trust-the-game.md §3, §9): a round, smiling speech bubble with big eyes. Its eyes come from
// core/helper's eyesAt(), the same function the tests check: a lie glances sideways, the truth never does. The
// line types out at the chosen speed (tap the bubble to skip ahead). Poke its face and it complains.
import { useEffect, useRef, useState } from "react";
import { charsShown, eyesAt, type Eyes } from "../core/helper";
import styles from "../dttg.module.css";
import type { Said } from "../play/director";
import { dttgSave } from "../save";
import { useGame } from "./context";

export function Helper({ said, speed, describeEyes }: { said: Said | null; speed: "slow" | "normal" | "fast" | "instant"; describeEyes: boolean }) {
  const { director } = useGame();
  const [now, setNow] = useState(0);
  const pokes = useRef(0);

  // Re-render a few times a second while a line is up (the typing, and the eyes).
  useEffect(() => {
    if (!said) return;
    const timer = window.setInterval(() => setNow(performance.now() - said.at), 50);
    return () => window.clearInterval(timer);
  }, [said]);

  const ms = said ? Math.max(0, now) : 0;
  const eyes: Eyes = said ? eyesAt(said.lie, ms) : "straight";
  const shown = said ? said.text.slice(0, charsShown(said.text, ms, speed)) : "";

  const poke = () => {
    pokes.current++;
    if (pokes.current === 7) {
      director.say("any.poke", { now: true });
      director.secret("poke");
    }
  };

  return (
    <div className={styles.helper} data-helper data-eyes={eyes} data-line={said?.id} aria-live="polite">
      <button type="button" className={styles.face} onClick={poke} aria-label="HELPER" data-helper-face>
        <HelperFace />
      </button>
      {said && (
        <button type="button" className={styles.bubble} onClick={() => director.next()} data-bubble aria-label={said.text}>
          <span aria-hidden>{shown}</span>
          {describeEyes && <span className={styles.eyesNote}>{said.lie ? "(HELPER looks away as it says this.)" : "(HELPER looks right at you.)"}</span>}
        </button>
      )}
    </div>
  );
}

/** The face: white, round, two big eyes (their pupils slide sideways for a glance), a smile. */
export function HelperFace({ honest = false }: { honest?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden>
      <circle cx="32" cy="32" r="28" fill="#fff" stroke="#2d1b4e" strokeWidth="3.5" />
      <path d="M10 46 l-6 10 l13 -5" fill="#fff" stroke="#2d1b4e" strokeWidth="3.5" strokeLinejoin="round" />
      <ellipse cx="22" cy="27" rx="8" ry="9.5" fill="#f2eef8" />
      <ellipse cx="42" cy="27" rx="8" ry="9.5" fill="#f2eef8" />
      <g className={styles.pupils} style={{ ["--glance" as string]: "4.5px" }}>
        <circle cx="22" cy="28" r="4.2" fill="#2d1b4e" />
        <circle cx="42" cy="28" r="4.2" fill="#2d1b4e" />
        <circle cx="23.5" cy="26.5" r="1.3" fill="#fff" />
        <circle cx="43.5" cy="26.5" r="1.3" fill="#fff" />
      </g>
      <path d={honest ? "M22 43 q10 4 20 0" : "M21 41 q11 9 22 0"} stroke="#2d1b4e" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <ellipse cx="14" cy="38" rx="4" ry="2.3" fill="#ff8fc0" />
      <ellipse cx="50" cy="38" rx="4" ry="2.3" fill="#ff8fc0" />
    </svg>
  );
}

/** For non-React callers: the current text speed. */
export const helperSpeed = () => dttgSave.get().prefs.speed;
