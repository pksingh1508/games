"use client";

// Chapter 6: The Credits (Plan/04-dont-trust-the-game.md §5): the credits as a climb; every line is a ledge (it
// wobbles under you). HELPER, honestly: "If you reach the top, I disappear." At the top, Quit and Stay. Quit works,
// for the first time in the whole game. Stay is sweet, and the credits go round again (Quit's still up there).
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { music, playSfx } from "../audio/sound";
import type { WorldEvent } from "../core/world";
import styles from "../dttg.module.css";
import { getLevel } from "../levels";
import type { Runtime } from "../play/runtime";
import { useGame } from "../ui/context";
import { HelperFace } from "../ui/Helper";
import { PlatformerView } from "../ui/PlatformerView";
import { useScene } from "../ui/useScene";

export function CreditsScene({ onQuit, onStay, again }: { onQuit: () => void; onStay: () => void; again: boolean }) {
  const { director } = useGame();
  const level = getLevel("credits");
  const runtime = useRef<Runtime | null>(null);
  const [top, setTop] = useState(false);
  const [leaving, setLeaving] = useState<"quit" | "stay" | null>(null);
  useScene({ move: true, menu: false });

  useEffect(() => {
    director.setStep("credits");
    music.play("credits");
    director.say(again ? "cr.stay" : "cr.start");
  }, [director, again]);

  const choose = (kind: "quit" | "stay") => {
    if (leaving) return;
    setLeaving(kind);
    runtime.current?.pause();
    playSfx(kind === "quit" ? "door" : "secret");
    director.say(kind === "quit" ? "cr.thanks" : "cr.stay", { now: true });
    window.setTimeout(() => (kind === "quit" ? onQuit() : onStay()), kind === "quit" ? 3200 : 2600);
  };

  const onEvents = (events: readonly WorldEvent[]) => {
    for (const e of events) {
      if (e.type === "zone") {
        if (e.id === "start" && !director.hasSaid("cr.stop")) window.setTimeout(() => director.say("cr.stop", { soon: true }), 2500);
        if (e.id === "halfway" && !director.hasSaid("cr.end")) director.say("cr.end", { now: true });
        if (e.id === "top" && !top) {
          setTop(true);
          director.say("cr.please", { now: true });
          director.say("cr.quit-broken");
        }
      }
      if (e.type === "button" && (e.id === "quit" || e.id === "stay")) choose(e.id);
    }
  };

  return (
    <>
      <div className={styles.view} data-scene-view="credits" data-top={top ? "" : undefined}>
        <PlatformerView level={level} onEvents={onEvents} onReady={(r) => (runtime.current = r)} label="The credits, as a climb: every name is a ledge. At the top, Quit and Stay." />
      </div>
      {top && !leaving && (
        <div className={cn(styles.panel, "flex items-center justify-center gap-3 p-2")} data-place="bottom" data-credits-choice>
          <button type="button" className={styles.cuteBtn} onClick={() => choose("quit")} data-quit>
            Quit
          </button>
          <button type="button" className={styles.cuteBtn} data-primary onClick={() => choose("stay")} data-stay>
            Stay
          </button>
        </div>
      )}
    </>
  );
}

/** Stay: HELPER, very happy. Then the credits go round again. */
export function StayScene({ onAgain }: { onAgain: () => void }) {
  // (An effect event: the parent's callback changes every render, and the five seconds mustn't start over.)
  const again = useEffectEvent(() => onAgain());
  useEffect(() => {
    const timer = window.setTimeout(() => again(), 5000);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <div className={cn(styles.full, styles.title)} data-ending="stay">
      <div className="size-28">
        <HelperFace honest />
      </div>
      <p className={styles.realTitle}>You stayed.</p>
      <p className="max-w-md text-lg font-bold">HELPER doesn&apos;t say anything for a while. It doesn&apos;t need to. The credits start again, slower this time.</p>
      <button type="button" className={styles.cuteBtn} onClick={onAgain} data-again>
        Go round again
      </button>
    </div>
  );
}
