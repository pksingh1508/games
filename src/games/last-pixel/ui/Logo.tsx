// "Last Pıxel" (Plan/10-last-pixel.md §4 "The Logo", §8.1): the dot on the "i" has been missing from the
// start. Pix took it. Its empty slot is a place Pix can hide (data-pix-spot="logo"), and when the finale's
// done, the dot's back: Pix, where it belongs.
import { cn } from "@/lib/cn";
import styles from "../last-pixel.module.css";

export function Logo({ complete, spot = false, className }: { complete: boolean; spot?: boolean; className?: string }) {
  return (
    <span className={cn(styles.logo, className)} role="img" aria-label={complete ? "Last Pixel" : "Last Pixel, with the dot on its i missing"} data-logo={complete ? "complete" : "missing"}>
      <span aria-hidden>
        Last P
        <span className={styles.i}>
          ı
          <span className={styles.dot} data-on={complete ? "" : undefined} data-pix-spot={spot ? "logo" : undefined} data-logo-dot />
        </span>
        xel
      </span>
    </span>
  );
}
