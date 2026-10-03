// NOPE!'s show font (Plan/gameStack.md §11.2): Lilita One for titles and questions. Bangers (the
// stamp and comic hits) is shared with the arcade as --font-g-bangers. Loaded with the game only.
import { Lilita_One } from "next/font/google";

export const showFont = Lilita_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-nope-show",
  display: "swap",
  preload: false,
});
