"use client";

// Mr. Nope and his speech bubble. He talks in gibberish babble that follows the text, reacts to
// everything, and winks when he lies.
import { AnimatePresence, m } from "motion/react";
import { useEffect } from "react";
import { cn } from "@/lib/cn";
import styles from "../nope.module.css";
import type { Mood } from "../questions/types";
import { sfx } from "../sfx";
import { MrNope } from "./MrNope";

export interface HostState {
  text: string | null;
  mood: Mood;
  wink: boolean;
  /** Still talking: animated dots after the text. */
  typing?: boolean;
}

export function HostPanel({
  host,
  onPoke,
  hideHost,
  reducedMotion,
}: {
  host: HostState;
  onPoke: () => void;
  /** The question draws its own Mr. Nope; only the bubble stays. */
  hideHost?: boolean;
  reducedMotion: boolean;
}) {
  const { text, mood, wink } = host;

  useEffect(() => {
    if (text) sfx.babble(text, { wink });
  }, [text, wink]);

  return (
    <div className="relative z-10 flex items-center gap-3 lg:flex-col-reverse lg:items-center lg:gap-4">
      {!hideHost && (
        <button
          type="button"
          onClick={onPoke}
          className="relative shrink-0 rounded-3xl outline-offset-4"
          aria-label="Mr. Nope"
        >
          <m.div
            key={`${mood}-${wink}`}
            initial={reducedMotion ? false : { scaleY: 0.86, y: 6 }}
            animate={{ scaleY: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 14 }}
            style={{ originY: 1 }}
          >
            <MrNope mood={mood} wink={wink} look={-0.4} className={cn("h-[5.5rem] w-auto sm:h-28 lg:h-56", styles.bob)} />
          </m.div>
        </button>
      )}

      <div className="min-w-0 flex-1 lg:w-full lg:flex-none" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          {text && (
            <m.div
              key={text + String(wink)}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.1 } }}
              transition={{ type: "spring", stiffness: 520, damping: 30 }}
              className={cn(
                "relative w-fit max-w-full rounded-2xl border-[3px] border-[#161414] bg-white px-4 py-2.5 text-[#161414] shadow-[0_5px_0_0_#00000040] lg:mx-auto lg:max-w-[17rem]",
                styles.show,
              )}
            >
              <p className="text-[1.05rem] leading-snug sm:text-lg">
                <span className="sr-only">{wink ? "Mr. Nope, with a wink: " : "Mr. Nope: "}</span>
                {text}
                {host.typing && (
                  <span aria-label="(still talking)" className={cn(styles.typing, "ml-1 inline-flex")}>
                    <span>•</span>
                    <span>•</span>
                    <span>•</span>
                  </span>
                )}
              </p>
              {!hideHost && (
                <>
                  {/* Tail: towards Mr. Nope (left on phones, down on big screens) */}
                  <span aria-hidden className="absolute -left-[11px] top-1/2 size-4 -translate-y-1/2 rotate-45 border-b-[3px] border-l-[3px] border-[#161414] bg-white lg:hidden" />
                  <span aria-hidden className="absolute -bottom-[11px] left-1/2 hidden size-4 -translate-x-1/2 rotate-45 border-b-[3px] border-r-[3px] border-[#161414] bg-white lg:block" />
                </>
              )}
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
