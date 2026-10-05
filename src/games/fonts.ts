// Each game's display font (Plan/gameStack.md §11.2). They're not preloaded: a browser only
// downloads a font when something on the page actually uses it.
import localFont from "next/font/local";
import {
  Baloo_2,
  Bangers,
  Bungee,
  Caveat,
  Cormorant_SC,
  Fraunces,
  Fredoka,
  Lexend,
  Limelight,
  Press_Start_2P,
  Rubik,
  Rubik_Glitch,
  Silkscreen,
  VT323,
} from "next/font/google";
import type { GameSlug } from "./slugs";

const fredoka = Fredoka({ subsets: ["latin"], variable: "--font-g-fredoka", display: "swap", preload: false });
const bangers = Bangers({ subsets: ["latin"], weight: "400", variable: "--font-g-bangers", display: "swap", preload: false });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-g-fraunces", display: "swap", preload: false });
const baloo = Baloo_2({ subsets: ["latin"], variable: "--font-g-baloo", display: "swap", preload: false });
const pressStart = Press_Start_2P({ subsets: ["latin"], weight: "400", variable: "--font-g-press-start", display: "swap", preload: false });
const rubikGlitch = Rubik_Glitch({ subsets: ["latin"], weight: "400", variable: "--font-g-rubik-glitch", display: "swap", preload: false });
const silkscreen = Silkscreen({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-g-silkscreen", display: "swap", preload: false });
const bungee = Bungee({ subsets: ["latin"], weight: "400", variable: "--font-g-bungee", display: "swap", preload: false });
const rubik = Rubik({ subsets: ["latin"], variable: "--font-g-rubik", display: "swap", preload: false });
const vt323 = VT323({ subsets: ["latin"], weight: "400", variable: "--font-g-vt323", display: "swap", preload: false });
const limelight = Limelight({ subsets: ["latin"], weight: "400", variable: "--font-g-limelight", display: "swap", preload: false });
const cormorantSc = Cormorant_SC({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-g-cormorant-sc", display: "swap", preload: false });
const lexend = Lexend({ subsets: ["latin"], variable: "--font-g-lexend", display: "swap", preload: false });
/** 99 Seconds' handwriting: your journal, and the notes on the walls (it's the same hand). */
const caveat = Caveat({ subsets: ["latin"], variable: "--font-g-caveat", display: "swap", preload: false });
const dseg = localFont({
  src: "../assets/fonts/DSEG7Classic-Bold.woff2",
  variable: "--font-g-dseg",
  display: "swap",
  preload: false,
});

/** Class names that define the CSS variables; applied once on <html>. */
export const GAME_FONT_VARIABLES = [
  fredoka, bangers, fraunces, baloo, pressStart, rubikGlitch, silkscreen,
  bungee, rubik, vt323, limelight, cormorantSc, lexend, caveat, dseg,
].map((f) => f.variable);

export interface TitleFont {
  family: string;
  weight: number;
  /** Size multiplier: wide fonts get smaller, narrow fonts bigger. */
  scale: number;
  uppercase?: boolean;
  tracking?: string;
}

export const TITLE_FONTS: Record<GameSlug, TitleFont> = {
  "one-more-step": { family: "var(--font-g-fredoka)", weight: 700, scale: 1 },
  nope: { family: "var(--font-g-bangers)", weight: 400, scale: 1.15, tracking: "0.02em" },
  "99-seconds": { family: "var(--font-g-fraunces)", weight: 700, scale: 0.95 },
  "dont-trust-the-game": { family: "var(--font-g-baloo)", weight: 800, scale: 0.95 },
  "fake-floor": { family: "var(--font-pixelify)", weight: 700, scale: 1 },
  trapsprint: { family: "var(--font-g-press-start)", weight: 400, scale: 0.58 },
  "glitch-run": { family: "var(--font-g-rubik-glitch)", weight: 400, scale: 0.95 },
  "almost-there": { family: "var(--font-g-silkscreen)", weight: 700, scale: 0.82, uppercase: true },
  "one-tap-chaos": { family: "var(--font-g-bungee)", weight: 400, scale: 0.8 },
  "last-pixel": { family: "var(--font-g-baloo)", weight: 800, scale: 1 },
  "panic-stack": { family: "var(--font-g-rubik)", weight: 900, scale: 0.95 },
  "cursor-escape": { family: "var(--font-g-vt323)", weight: 400, scale: 1.3 },
  "wrong-door": { family: "var(--font-g-limelight)", weight: 400, scale: 0.92 },
  "dont-blink": { family: "var(--font-g-cormorant-sc)", weight: 700, scale: 1.05 },
  "gravity-is-lying": { family: "var(--font-g-lexend)", weight: 800, scale: 0.92 },
};

/** 99 Seconds shows its "99" on a 7-segment display. */
export const DIGITAL_FONT = "var(--font-g-dseg)";
