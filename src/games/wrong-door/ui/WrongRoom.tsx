"use client";

// The Wrong Room (Plan/13-wrong-door.md §3 "Wrong door consequences"): the door slams behind you and it's
// pitch dark. Somewhere along the wall there's a draft: your candle leans towards it, and you hear the wind
// on that side. Walk along the wall and push where it's coming from, within 20 seconds (no timer in Relaxed
// mode). Find it and you're back on the floor; don't, and you lose a key finding your way out.
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { createRng } from "@/engine/rng";
import { cn } from "@/lib/cn";
import { playBehind } from "../audio/behind";
import { playSfx } from "../audio/sfx";
import styles from "../wrong-door.module.css";
import { CandleSvg } from "./art";

const SECTIONS = 7;
const SECONDS = 20;

export function WrongRoom({ seed, relaxed, onDone }: { seed: number; relaxed: boolean; onDone(escaped: boolean): void }) {
  const [exit] = useState(() => {
    const rng = createRng(`room:${seed}`);
    let e = 3;
    while (e === 3) e = Math.floor(rng() * SECTIONS);
    return e;
  });
  const [at, setAt] = useState(3);
  const [left, setLeft] = useState(SECONDS);
  const [result, setResult] = useState<"escaped" | "lost" | null>(null);
  const [solid, setSolid] = useState(false);
  const over = useRef(false);

  const finish = (escaped: boolean) => {
    if (over.current) return;
    over.current = true;
    setResult(escaped ? "escaped" : "lost");
    playSfx(escaped ? "up" : "keyLost");
    window.setTimeout(() => onDone(escaped), 1300);
  };
  const timeUp = useEffectEvent(() => finish(false));

  // The clock (unless relaxed).
  useEffect(() => {
    if (relaxed) return;
    const started = performance.now();
    const id = window.setInterval(() => {
      const remaining = Math.max(0, SECONDS - (performance.now() - started) / 1000);
      setLeft(remaining);
      if (remaining <= 0) timeUp();
    }, 100);
    return () => window.clearInterval(id);
  }, [relaxed]);

  const draft = exit === at ? "here" : exit < at ? "left" : "right";
  const listen = (pos: number) => {
    const d = exit - pos;
    playBehind("wind", d === 0 ? 0 : Math.sign(d) * Math.min(1, 0.35 + Math.abs(d) * 0.22), 0.05);
  };
  const firstListen = useEffectEvent(() => listen(3));

  const walk = (pos: number) => {
    if (over.current) return;
    setAt(pos);
    setSolid(false);
    playSfx("click", { volume: 0.6 });
    listen(pos);
  };
  const push = () => {
    if (over.current) return;
    if (at === exit) finish(true);
    else {
      playSfx("knock", { rate: 0.7 });
      setSolid(true);
    }
  };

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") walk(Math.max(0, at - 1));
    else if (e.key === "ArrowRight") walk(Math.min(SECTIONS - 1, at + 1));
    else if (e.key === "Enter" || e.key === " ") push();
    else return;
    e.preventDefault();
  });
  useEffect(() => {
    const h = (e: KeyboardEvent) => onKey(e);
    window.addEventListener("keydown", h);
    firstListen();
    return () => window.removeEventListener("keydown", h);
  }, []);

  return (
    <div className={cn(styles.overlay, "!bg-[#050307]")} role="dialog" aria-modal="true" aria-labelledby="wd-room" data-wrong-room>
      <section className="w-[min(40rem,100%)] text-center text-[#f3e3d3]">
        <h2 id="wd-room" className={cn(styles.display, "text-3xl text-[#c9a227]")}>
          The Wrong Room
        </h2>
        <p className="mt-1 opacity-85">Pitch dark. Your candle leans towards the draft. Walk along the wall and push where it comes from.</p>
        {!relaxed && (
          <div className="mx-auto mt-3 h-2 w-full max-w-sm overflow-hidden rounded-full bg-white/10" role="timer" aria-label={`${Math.ceil(left)} seconds left`}>
            <div className="h-full bg-[#c9a227] transition-[width] duration-100" style={{ width: `${(left / SECONDS) * 100}%` }} />
          </div>
        )}
        <div className="mt-5 grid grid-cols-7 gap-1.5" role="group" aria-label="The wall">
          {Array.from({ length: SECTIONS }, (_, k) => (
            <button
              key={k}
              type="button"
              onClick={() => walk(k)}
              className={cn("relative h-36 rounded-md border border-white/10 bg-[#120c15] transition-colors", k === at && "border-[#c9a227]/70 bg-[#1f1524]")}
              aria-label={`Wall section ${k + 1}${k === at ? " (you're here)" : ""}`}
              aria-pressed={k === at}
              data-section={k}
            >
              {k === at && (
                <span className="absolute inset-x-[18%] bottom-2 top-[30%]">
                  {draft === "here" ? (
                    <span className="block size-full animate-pulse">
                      <CandleSvg lean="up" />
                    </span>
                  ) : (
                    <CandleSvg lean={draft} />
                  )}
                </span>
              )}
            </button>
          ))}
        </div>
        <p className="mt-3 min-h-6 font-bold" role="status" data-draft={draft}>
          {result === "escaped"
            ? "The wall gives way: you're out!"
            : result === "lost"
              ? "Too late. You fumble your way out, and drop a key."
              : solid
                ? "Solid wall. The draft isn't here."
                : draft === "here"
                  ? "🌬️ The flame dances: the draft is right here."
                  : `🌬️ A draft from your ${draft}.`}
        </p>
        <button type="button" className={cn(styles.btn, styles.gold, "mt-3")} onClick={push} disabled={!!result} data-push>
          Push the wall
        </button>
        <p className="mt-2 text-sm opacity-60">← → to walk, Enter to push.</p>
      </section>
    </div>
  );
}
