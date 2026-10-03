"use client";

// The ending: you finally NOPE'd Mr. Nope. Credits roll (Plan/02-nope.md §4).
import { m } from "motion/react";
import { useEffect, useRef } from "react";
import { useSave } from "@/engine/save";
import { cn } from "@/lib/cn";
import { SITE } from "@/lib/site";
import styles from "../nope.module.css";
import { nopeSave } from "../save";
import { sfx } from "../sfx";
import { formatTime } from "../state/run";
import { Backdrop } from "./Backdrop";
import { MrNope } from "./MrNope";

export function Credits({ onDone, reducedMotion }: { onDone: () => void; reducedMotion: boolean }) {
  const save = useSave(nopeSave);
  const { stats } = save;

  const done = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    done.current?.focus({ preventScroll: true });
    sfx.fanfare();
    const cheer = setTimeout(() => sfx.applause(3), 600);
    return () => clearTimeout(cheer);
  }, []);

  const lines: Array<[string, string]> = [
    ["Host", "Mr. Nope (under protest)"],
    ["Questions", "60, all original"],
    ["Secret rules", "5 (you know them now)"],
    ["Stamps used", `${stats.nopes.toLocaleString("en-US")} (all yours)`],
    ["Skip flies", `${stats.flies} caught, all released unharmed`],
    ["Winks believed", String(stats.winkedAt)],
    ["Time on air", formatTime(stats.playMs)],
    ["Studio audience", "Synthesized. No audiences were harmed"],
    ["Fonts", "Lilita One & Bangers (SIL Open Font License)"],
    ["Your data", "Never left this device"],
    ["Presented by", SITE.fullName],
  ];

  return (
    <div className={cn(styles.stage, "grid min-h-[calc(100dvh-4rem)] place-items-center px-4 py-10")}>
      <Backdrop theme="night" />
      <div className="relative z-10 grid w-full max-w-4xl items-center gap-8 md:grid-cols-[16rem_1fr]">
        <div className="flex flex-col items-center text-center">
          <m.div
            initial={reducedMotion ? false : { y: -240, scale: 1.4 }}
            animate={{ y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <MrNope mood="stamped" className="h-48 w-auto md:h-64" title="Mr. Nope, stamped NOPE" />
          </m.div>
          <p className={cn(styles.show, "mt-4 text-xl text-[#FFF4D6]")}>You NOPE&apos;d the NOPE.</p>
        </div>

        <div
          className={cn(
            "relative h-[60vh] min-h-80 rounded-[2rem] border-[3px] border-[#161414] bg-[#0B0909]/80",
            // Rolling credits; with reduced motion they're a list you scroll yourself.
            reducedMotion ? "overflow-y-auto" : "overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,#000_15%,#000_85%,transparent)]",
          )}
        >
          <div className={cn("px-8 text-center", reducedMotion ? "py-10" : cn("pt-[60vh]", styles.credits))}>
            <h1 className={cn(styles.comic, styles.logoText, "text-7xl")}>NOPE!</h1>
            <p className={cn(styles.show, "mt-3 text-lg text-[#FFC93C]")}>A quiz show that lies to you. Fairly.</p>
            <dl className="mt-12 space-y-7">
              {lines.map(([role, name]) => (
                <div key={role}>
                  <dt className="pixel-label text-[0.7rem] text-[#9B9483]">{role}</dt>
                  <dd className={cn(styles.show, "mt-1 text-2xl text-[#FFF4D6]")}>{name}</dd>
                </div>
              ))}
            </dl>
            <p className={cn(styles.comic, "mt-16 text-4xl tracking-wider text-[#FFF4D6]")}>The end.</p>
            <p className="mt-2 pb-24 text-[#9B9483]">…or is it? (It is. Unless you play again.)</p>
          </div>
        </div>
      </div>
      <button ref={done} type="button" onClick={onDone} className="btn btn-lg relative z-10 mt-8" data-sound="coin">
        See your score
      </button>
    </div>
  );
}
