"use client";

// The All-Deaths Replay screen: the crowd of every attempt, then the results again. Skippable.
import { FastForward } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useComfort } from "@/games/shared/device";
import { useFitCanvas } from "@/games/shared/fit";
import { cn } from "@/lib/cn";
import { HEIGHT, WIDTH } from "../core/constants";
import { levelTitle } from "../core/level";
import { getLevel, levelLabel } from "../levels";
import { DeathsReplay } from "../play/deaths-replay";
import styles from "../trapsprint.module.css";
import { CompleteCard, type CompleteInfo } from "./Complete";

export function ReplayScreen({ info, hasNext, onNext, onRetry, onLevels }: { info: CompleteInfo; hasNext: boolean; onNext: () => void; onRetry: () => void; onLevels: () => void }) {
  const { area, frame } = useFitCanvas(WIDTH, HEIGHT, "--ts-scale");
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const counter = useRef<HTMLSpanElement | null>(null);
  const [round, setRound] = useState(0);
  const [done, setDone] = useState(false);
  const comfort = useComfort();
  const reducedMotion = useEffectEvent(() => comfort.reducedMotion);
  const finish = useEffectEvent(() => setDone(true));
  useEffect(() => {
    if (!canvas.current) return;
    const replay = new DeathsReplay(canvas.current, getLevel(info.levelId), info.attempts, {
      reducedMotion: () => reducedMotion(),
      onTick: (alive, dead) => {
        if (counter.current) counter.current.textContent = `${dead} down · ${alive} running`;
      },
      onDone: () => finish(),
    });
    replay.start();
    return () => replay.stop();
  }, [info, round]);

  // Any key skips to the results.
  useEffect(() => {
    if (done) return;
    const skip = (event: KeyboardEvent) => {
      if (event.repeat) return;
      event.preventDefault();
      finish();
    };
    window.addEventListener("keydown", skip);
    return () => window.removeEventListener("keydown", skip);
  }, [done]);

  const crowd = info.attempts.filter((a) => a.end === "dead").length;
  return (
    <div ref={area} className={cn(styles.root, styles.area)} aria-label={`All deaths replay, ${levelLabel(info.levelId)}`}>
      <div ref={frame} className={styles.frame}>
        <canvas ref={canvas} className={styles.canvas} aria-hidden />
        <div className={cn(styles.hud, "pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-[calc(var(--ts-scale,2)*4px)] text-[clamp(0.55rem,calc(var(--ts-scale,2)*5px),1.15rem)]")}>
          <p className="leading-relaxed">
            All deaths · {levelLabel(info.levelId)} {levelTitle(getLevel(info.levelId))}
            <span ref={counter} className="block text-[0.8em] text-[#FFCD75]">
              {crowd} attempts
            </span>
          </p>
          {!done && (
            <button type="button" className={cn(styles.hudButton, "pointer-events-auto flex h-10 gap-2 px-3 text-[0.7rem]")} onClick={() => setDone(true)} data-sound="click">
              <FastForward className="size-4" aria-hidden /> Skip
            </button>
          )}
        </div>
      </div>
      {done && (
        <CompleteCard
          info={info}
          hasNext={hasNext}
          onNext={onNext}
          onRetry={onRetry}
          onLevels={onLevels}
          watching
          onWatch={() => {
            setDone(false);
            setRound((r) => r + 1);
          }}
        />
      )}
    </div>
  );
}
