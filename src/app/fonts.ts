// Site fonts. next/font downloads them at build time and serves them with our own files:
// no request ever goes to Google from the browser (Plan/gameStack.md §11).
import { Bricolage_Grotesque, Geist, Geist_Mono, Pixelify_Sans } from "next/font/google";

export const displayFont = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

export const sansFont = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

export const monoFont = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const pixelFont = Pixelify_Sans({
  subsets: ["latin"],
  variable: "--font-pixelify",
  display: "swap",
});

export const SITE_FONT_VARIABLES = [displayFont, sansFont, monoFont, pixelFont].map((f) => f.variable);
