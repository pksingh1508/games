"use client";

// Chapter 4: Fatal Error (Plan/04-dont-trust-the-game.md §5, §10 rule 4): the game "crashes" to a stylised error
// screen, inside the frame, that could never pass for a real one. The answer's in the error: the stack trace's
// function names run when you click them. deleteSave() is a joke that resolves in three seconds.
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { music, playSfx } from "../audio/sound";
import styles from "../dttg.module.css";
import { useGame } from "../ui/context";

const TRACE: ReadonlyArray<{ fn: string; at: string }> = [
  { fn: "happyJump", at: "main.ts:1:1" },
  { fn: "openSecretDoor", at: "level4.ts:13:37" },
  { fn: "deleteSave", at: "save.ts:404:1" },
  { fn: "stayForever", at: "helper.ts:99:99" },
  { fn: "loadLevel", at: "levels.ts:4:04" },
];

export function CrashScene({ onSecretDoor }: { onSecretDoor: () => void }) {
  const { director, reduceFlashing } = useGame();
  const [shown, setShown] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [kidding, setKidding] = useState(false);
  const [sending, setSending] = useState(false);
  const [shake, setShake] = useState(0);

  useEffect(() => {
    director.setStep("crash");
    // A sudden silence, then a single tone, then the error.
    music.stop();
    const timers = [
      window.setTimeout(() => playSfx("tone"), 700),
      window.setTimeout(() => {
        setShown(true);
        director.say("c.crash");
        director.say("c.links");
      }, 1400),
    ];
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [director]);

  // deleteSave(): 3… 2… 1… just kidding (all inside three seconds).
  useEffect(() => {
    if (deleting === null) return;
    const timer = window.setTimeout(() => {
      if (deleting > 1) setDeleting(deleting - 1);
      else {
        setDeleting(null);
        setKidding(true);
        director.secret("delete-save");
      }
    }, 800);
    return () => window.clearTimeout(timer);
  }, [deleting, director]);

  const run = (fn: string) => {
    playSfx("click");
    switch (fn) {
      case "openSecretDoor":
        playSfx("door");
        onSecretDoor();
        break;
      case "deleteSave":
        if (deleting === null) {
          setKidding(false);
          setDeleting(3);
        }
        break;
      case "stayForever":
        director.say("c.stay", { now: true });
        break;
      case "happyJump":
        setShake((n) => n + 1);
        director.toast("Still broken.");
        break;
      case "loadLevel":
        director.toast("Loading level 4.04… Level not found. Maybe try a door.");
        break;
    }
  };

  if (!shown) return <div className={cn(styles.full, "bg-black")} data-crashing />;

  return (
    <div key={shake} className={cn(styles.full, styles.crash, styles.underHelper, reduceFlashing ? styles.fade : shake ? styles.shake : styles.fade)} data-crash>
      <div className={styles.crashHead}>
        <SadFace />
        <span>Super Happy Jump! has stopped working.</span>
      </div>
      <p>An unexpected happiness occurred. The game will now stop being happy.</p>
      <div className={styles.trace} data-trace>
        <div>Error: TooMuchFun (in level 4)</div>
        {TRACE.map((t) => (
          <div key={t.fn}>
            &nbsp;&nbsp;at{" "}
            <button type="button" className={styles.fn} onClick={() => run(t.fn)} data-fn={t.fn}>
              {t.fn}
            </button>{" "}
            ({t.at})
          </div>
        ))}
      </div>
      {(deleting !== null || kidding) && (
        <p className="font-bold text-[#c2306f]" data-deleting>
          {kidding ? "…Just kidding. Your save is fine." : `Deleting save… ${deleting}…`}
        </p>
      )}
      <div className="mt-auto flex flex-wrap gap-2">
        <button
          type="button"
          className={styles.fakeBtn}
          disabled={sending}
          onClick={() => {
            director.act("report");
            setSending(true);
            window.setTimeout(() => {
              setSending(false);
              director.say("c.report", { now: true });
            }, 1200);
          }}
          data-send-report
        >
          {sending ? "Sending…" : "Send Error Report"}
        </button>
        <button type="button" className={styles.fakeBtn} onClick={() => director.say("c.close", { now: true })} data-close-game>
          Close Game
        </button>
      </div>
    </div>
  );
}

function SadFace() {
  return (
    <svg viewBox="0 0 24 24" width="40" height="40" aria-hidden>
      <rect x="1" y="1" width="22" height="22" rx="4" fill="#ffd23f" stroke="#2d1b4e" strokeWidth="2" />
      <rect x="7" y="8" width="2" height="3" fill="#2d1b4e" />
      <rect x="15" y="8" width="2" height="3" fill="#2d1b4e" />
      <path d="M7 17 q5 -4 10 0" stroke="#2d1b4e" strokeWidth="2" fill="none" />
    </svg>
  );
}
