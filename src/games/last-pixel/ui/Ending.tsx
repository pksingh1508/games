"use client";

// The ending (Plan/10-last-pixel.md §5 "The finale"): caught for good, Pix floats up to the logo and settles
// into its place as the dot on the "i". It finally knows where it belongs. The logo is complete.
import { Check, LayoutGrid, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "@/components/ui/toast-store";
import { useComfort } from "@/games/shared/device";
import { shareResult } from "@/games/shared/share";
import { cn } from "@/lib/cn";
import { SITE } from "@/lib/site";
import { fanfare } from "../audio/music";
import { starTotals } from "../core/progress";
import styles from "../last-pixel.module.css";
import type { LastPixelSave } from "../save";
import { Logo } from "./Logo";

export const endingShareText = (save: Pick<LastPixelSave, "levels" | "stats">) => {
  const stars = starTotals(save as LastPixelSave);
  return `I got Last Pixel to a true 100%: every last pixel, Pix included. ${stars.got} of ${stars.of} stars.\n${SITE.url}/games/last-pixel`;
};

export function Ending({ save, onLevels }: { save: LastPixelSave; onLevels(): void }) {
  const { reducedMotion } = useComfort();
  const [home, setHome] = useState(reducedMotion);
  const [shared, setShared] = useState(false);
  const logo = useRef<HTMLDivElement | null>(null);
  const pix = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (reducedMotion) return;
    // Up from below into the slot over the "i".
    const dot = logo.current?.querySelector<HTMLElement>("[data-logo-dot]");
    const el = pix.current;
    if (!dot || !el) return;
    const box = logo.current!.getBoundingClientRect();
    const d = dot.getBoundingClientRect();
    const tx = d.left - box.left;
    const ty = d.top - box.top;
    const animation = el.animate(
      [
        { transform: `translate(${tx - 60}px, ${ty + 260}px)`, opacity: 0 },
        { transform: `translate(${tx + 40}px, ${ty + 140}px)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${tx - 20}px, ${ty + 50}px)`, offset: 0.65 },
        { transform: `translate(${tx}px, ${ty}px)` },
      ],
      { duration: 2600, easing: "cubic-bezier(0.3, 0.7, 0.3, 1)", fill: "forwards" },
    );
    animation.onfinish = () => {
      setHome(true);
      fanfare();
    };
    return () => animation.cancel();
  }, [reducedMotion]);

  const share = async () => {
    const outcome = await shareResult(endingShareText(save));
    if (outcome === "copied") {
      setShared(true);
      toast({ kind: "success", title: "Copied", description: "Paste it anywhere you like." });
    } else if (outcome === "failed") toast({ kind: "info", title: "Couldn't copy", description: "Your browser wouldn't let the game copy it." });
    else setShared(true);
  };

  return (
    <section className={cn(styles.root, "grid min-h-[calc(100dvh-4rem)] place-items-center bg-[#FDF6EC] px-4 py-10 text-center")} aria-labelledby="lp-end-title" data-ending={home ? "home" : "flying"}>
      <div className="flex flex-col items-center">
        <div ref={logo} className="relative text-[clamp(3.2rem,12vw,6.5rem)]">
          <h1 id="lp-end-title">
            <Logo complete={home} />
          </h1>
          {!home && <span ref={pix} className={cn(styles.homecoming, "left-0 top-0")} aria-hidden />}
        </div>
        <p className="mt-6 text-[clamp(1.3rem,3.4vw,1.9rem)] font-extrabold" aria-live="polite">
          {home ? "It finally knows where it belongs." : "One last pixel, going home…"}
        </p>
        {home && <p className="mt-1 text-lg font-bold opacity-75">The logo is complete. 100%.</p>}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" className={cn(styles.button, styles.primary)} onClick={onLevels} autoFocus>
            <LayoutGrid className="size-4" aria-hidden /> Levels
          </button>
          <button type="button" className={styles.button} onClick={share}>
            {shared ? <Check className="size-4" aria-hidden /> : <Share2 className="size-4" aria-hidden />} Share
          </button>
        </div>
      </div>
    </section>
  );
}
