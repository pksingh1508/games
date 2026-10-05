"use client";

// The end of Chapter 1 (Plan/04-dont-trust-the-game.md §8.1): the "Super Happy Jump!" logo cracks, and the game's real
// name shows through. With Reduce flashing (or motion) on, it just fades across.
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { playSfx } from "../audio/sound";
import styles from "../dttg.module.css";
import { useGame } from "../ui/context";

export function CrackScene({ onDone }: { onDone: () => void }) {
  const { director, reducedMotion, reduceFlashing } = useGame();
  const [stage, setStage] = useState<"logo" | "crack" | "real">("logo");
  const gentle = reducedMotion || reduceFlashing;

  useEffect(() => {
    const timers = [
      window.setTimeout(() => {
        setStage("crack");
        playSfx("cardboard");
      }, 700),
      window.setTimeout(() => {
        setStage("real");
        director.say("p.crack", { now: true });
      }, 1900),
    ];
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [director]);

  return (
    <div className={cn(styles.full, styles.title)} data-crack={stage}>
      {stage !== "real" ? (
        <div className={cn(styles.logo, stage === "crack" && styles.crack, stage === "crack" && !gentle && styles.shake)}>
          {[..."Super Happy Jump!"].map((ch, i) => (
            <span key={i} style={{ color: ["#ff6fa8", "#ffd23f", "#7cf2b5", "#7af0ff", "#b48cff"][i % 5] }}>
              {ch === " " ? "\u00a0" : ch}
            </span>
          ))}
        </div>
      ) : (
        <p className={cn(styles.realTitle, styles.fade)} data-real-title>
          Don&apos;t Trust The Game
        </p>
      )}
      {stage === "real" && (
        <button type="button" className={cn(styles.cuteBtn, styles.fade)} data-primary onClick={onDone} data-continue>
          Chapter 2: The Options Menu
        </button>
      )}
    </div>
  );
}
