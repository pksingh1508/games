// The game-show set. Each episode dresses it differently, but the sky behind Mr. Nope is green
// from the very first question (a later question asks about it).
import { cn } from "@/lib/cn";
import styles from "../nope.module.css";
import type { EpisodeId } from "../save";

export type SetTheme = "day" | "snow" | "sunset" | "night";

export const EPISODE_THEME: Record<EpisodeId, SetTheme> = { 1: "day", 2: "snow", 3: "sunset", 4: "night" };

const SKY: Record<SetTheme, string> = {
  day: styles.skyDay ?? "",
  snow: styles.skySnow ?? "",
  sunset: styles.skySunset ?? "",
  night: styles.skyNight ?? "",
};

function Clouds({ tint = "#FFFFFF" }: { tint?: string }) {
  return (
    <svg viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice" className={cn("absolute inset-0 size-full", styles.clouds)} aria-hidden>
      <g fill={tint} opacity="0.95">
        <ellipse cx="150" cy="80" rx="70" ry="24" />
        <ellipse cx="190" cy="66" rx="44" ry="26" />
        <ellipse cx="118" cy="70" rx="30" ry="18" />
        <ellipse cx="610" cy="58" rx="62" ry="20" />
        <ellipse cx="646" cy="46" rx="36" ry="22" />
        <ellipse cx="420" cy="132" rx="52" ry="16" opacity="0.8" />
        <ellipse cx="446" cy="122" rx="28" ry="15" opacity="0.8" />
      </g>
    </svg>
  );
}

/**
 * The sky panel is clickable as a whole (it's a hotspot), so it renders as its own layer. The
 * rest of the set is decoration.
 */
export function Backdrop({ theme }: { theme: SetTheme }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className={cn(styles.spot, styles.spotLeft)} />
      <div className={cn(styles.spot, styles.spotRight)} />
      <div className={styles.floor} />
      <div className={cn(styles.curtain, styles.curtainLeft)} />
      <div className={cn(styles.curtain, styles.curtainRight)} />
      <div className={styles.valance} />
      <SkyArt theme={theme} />
    </div>
  );
}

function SkyArt({ theme }: { theme: SetTheme }) {
  return (
    <div className={cn(styles.skyArea, styles.sky, SKY[theme])} data-sky={theme}>
      {theme === "night" ? (
        <>
          <div className={styles.stars} />
          <svg viewBox="0 0 100 100" className="absolute right-[12%] top-[10%] size-20 sm:size-28" aria-hidden>
            <circle cx="50" cy="50" r="34" fill="#FFF4D6" />
            <circle cx="64" cy="40" r="30" fill="#2C2163" />
          </svg>
        </>
      ) : (
        <Clouds tint={theme === "sunset" ? "#FFE3C2" : "#FFFFFF"} />
      )}
      {theme === "snow" && <div className={styles.snow} />}
      {theme === "sunset" && <div className={styles.grain} />}
    </div>
  );
}
