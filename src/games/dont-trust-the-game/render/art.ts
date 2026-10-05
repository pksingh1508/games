// Super Happy Jump!'s pixel art, as code (Plan/04-dont-trust-the-game.md §9): it starts overly cute (saturated
// pinks, a happy sun with a face) and slowly breaks (dark menus, a stuck loading screen, plain error pages, a void).
// The hero is the round purple one from the cover with one big eye.
import { pixelSprite } from "@/engine/sprites";
import type { Theme } from "../core/level";

export const HERO_PALETTE = { k: "#2d1b4e", w: "#ffffff", p: "#ff8fc0", y: "#ffd23f", s: "#4a2f7a" } as const;

const BODY = [
  "....kkkk....",
  "..kkkkkkkk..",
  ".kkskkkkkkk.",
  ".kskkwwwkkk.",
  "kkkkwwwwwkkk",
  "kkkkwwkkwkkk",
  "kkkkwwkkwkkk",
  "kkkkkwwwkkkk",
  "kpkkkkkkkkpk",
  "kkkkkkkkkkkk",
  ".kkkkkkkkkk.",
  "..kkkkkkkk..",
] as const;

const BLINK_EYE = ["kkkkkkkkkkkk", "kkkkwwwwwkkk", "kkkkkkkkkkkk"] as const;

const FEET: Record<string, readonly [string, string]> = {
  idle: ["..kk....kk..", "..yy....yy.."],
  run0: ["..kk...kk...", ".yy.....yy.."],
  run1: ["...kk..kk...", "...yy..yy..."],
  run2: ["...kk...kk..", "..yy.....yy."],
  run3: ["...kk..kk...", "...yy..yy..."],
  jump: ["..kk....kk..", ".yy......yy."],
  fall: ["...kk..kk...", "...yy..yy..."],
};

export type HeroFrame = keyof typeof FEET | "blink";

export function heroRows(frame: HeroFrame): string[] {
  const body = [...BODY];
  if (frame === "blink") body.splice(4, 3, ...BLINK_EYE);
  const feet = FEET[frame === "blink" ? "idle" : frame]!;
  return [...body, ...feet];
}

export function heroSprite(frame: HeroFrame, flip: boolean): HTMLCanvasElement {
  return pixelSprite(heroRows(frame), HERO_PALETTE, { key: `dttg:hero:${frame}`, flip });
}

/** Colours for each scene's look: the further into the game, the more broken. */
export interface Look {
  skyTop: string;
  skyBottom: string;
  ground: string;
  groundTop: string;
  groundDark: string;
  ledge: string;
  ink: string;
}

export const LOOKS: Record<Theme, Look> = {
  tutorial: { skyTop: "#ffd6ec", skyBottom: "#e7d8ff", ground: "#c2306f", groundTop: "#e0558f", groundDark: "#7e1f48", ledge: "#e0558f", ink: "#2d1b4e" },
  options: { skyTop: "#1c1430", skyBottom: "#120c1f", ground: "#3b2d5c", groundTop: "#5b4a86", groundDark: "#21183a", ledge: "#8d7bc4", ink: "#e9e2ff" },
  loading: { skyTop: "#1a1638", skyBottom: "#0d0b1f", ground: "#262245", groundTop: "#38335f", groundDark: "#141127", ledge: "#a8a3d1", ink: "#e9e7ff" },
  error: { skyTop: "#f4f4f6", skyBottom: "#e9e9ee", ground: "#c9c9d2", groundTop: "#dcdce3", groundDark: "#a2a2ad", ledge: "#8e8e9a", ink: "#3a3a46" },
  secret: { skyTop: "#3b2a4f", skyBottom: "#2a1d3a", ground: "#7a4b3a", groundTop: "#9a6450", groundDark: "#4e2f25", ledge: "#c58b5c", ink: "#ffe9c7" },
  void: { skyTop: "#160b24", skyBottom: "#05030a", ground: "#2a1838", groundTop: "#432660", groundDark: "#140a1c", ledge: "#6b3f8f", ink: "#ff6fa8" },
  console: { skyTop: "#fbfbfd", skyBottom: "#f1f1f6", ground: "#d9d9e3", groundTop: "#e8e8ef", groundDark: "#b4b4c2", ledge: "#b4b4c2", ink: "#8b8b9a" },
  credits: { skyTop: "#0e1030", skyBottom: "#3a1f5c", ground: "#2d1b4e", groundTop: "#4a2f7a", groundDark: "#1a0f2e", ledge: "#ff8fc0", ink: "#ffffff" },
};
