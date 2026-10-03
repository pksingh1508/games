// Colour palettes for the hub and every game (Plan/gameStack.md §10.3).
// Every text pair passes WCAG AA (≥ 4.5:1, enforced by palettes.test.ts). Accent-coloured text
// uses the derived --accent-ink, since some accents are only meant for buttons and art.
import type { GameSlug } from "./slugs";

export interface Palette {
  bg: string;
  surface: string;
  /** Text on surfaces. */
  ink: string;
  /** Text directly on the background. */
  inkOnBg: string;
  /** Secondary text on the background. */
  muted: string;
  /** Secondary text on surfaces. */
  mutedSurface: string;
  accent: string;
  /** Text on accent buttons. */
  onAccent: string;
  /** Darker accent, used for the 3D "base" of arcade buttons. */
  accentDeep: string;
  /** Hairlines on the background. */
  line: string;
  scheme: "light" | "dark";
  /** Focus ring colour when the default (accent) isn't visible enough on the background. */
  focus?: string;
}

export const HUB_PALETTE: Palette = {
  bg: "#0E0B16",
  surface: "#1B1628",
  ink: "#F5F1E8",
  inkOnBg: "#F5F1E8",
  muted: "#A9A3BC",
  mutedSurface: "#A9A3BC",
  accent: "#FF3D7F",
  onAccent: "#0E0B16",
  accentDeep: "#A62853",
  line: "#2B2638",
  scheme: "dark",
};

export const GAME_PALETTES: Record<GameSlug, Palette> = {
  "one-more-step": {
    bg: "#E8F6EF", surface: "#FFFFFF", ink: "#1F3A33", inkOnBg: "#1F3A33", muted: "#49615A",
    mutedSurface: "#536762", accent: "#1E7D5E", onAccent: "#FFFFFF", accentDeep: "#14513D",
    line: "#CCDCD5", scheme: "light",
  },
  nope: {
    bg: "#161414", surface: "#FFF4D6", ink: "#161414", inkOnBg: "#FFF4D6", muted: "#9B9483",
    mutedSurface: "#615C52", accent: "#D41F22", onAccent: "#FFFFFF", accentDeep: "#8A1416",
    line: "#37332F", scheme: "dark",
  },
  "99-seconds": {
    bg: "#2B2421", surface: "#F2E6D8", ink: "#2B2421", inkOnBg: "#F2E6D8", muted: "#ACA298",
    mutedSurface: "#5B534D", accent: "#D98E3F", onAccent: "#2B2421", accentDeep: "#8D5C29",
    line: "#473F3B", scheme: "dark",
  },
  "dont-trust-the-game": {
    bg: "#FFF5FA", surface: "#FFFFFF", ink: "#2D1B4E", inkOnBg: "#2D1B4E", muted: "#66567C",
    mutedSurface: "#6A5D81", accent: "#C2306F", onAccent: "#FFFFFF", accentDeep: "#7E1F48",
    line: "#E2D6E2", scheme: "light",
  },
  "fake-floor": {
    bg: "#F4F1EA", surface: "#FFFFFF", ink: "#26323B", inkOnBg: "#26323B", muted: "#535C62",
    mutedSurface: "#5A636A", accent: "#8A5D12", onAccent: "#FFFFFF", accentDeep: "#5A3C0C",
    line: "#D7D6D2", scheme: "light",
  },
  trapsprint: {
    bg: "#9AD8FF", surface: "#FFFFFF", ink: "#23153C", inkOnBg: "#23153C", muted: "#40446B",
    mutedSurface: "#675E78", accent: "#C8224B", onAccent: "#FFFFFF", accentDeep: "#821631",
    line: "#89BDE4", scheme: "light",
  },
  "glitch-run": {
    bg: "#07070D", surface: "#14142A", ink: "#E6F1FF", inkOnBg: "#E6F1FF", muted: "#888F99",
    mutedSurface: "#9096A8", accent: "#00F5D4", onAccent: "#07070D", accentDeep: "#009F8A",
    line: "#26282F", scheme: "dark",
  },
  "almost-there": {
    bg: "#1E2A44", surface: "#F7F4EF", ink: "#1E2A44", inkOnBg: "#F7F4EF", muted: "#A7A9B0",
    mutedSurface: "#545D6F", accent: "#F2B880", onAccent: "#1E2A44", accentDeep: "#9D7853",
    line: "#3C465C", scheme: "dark",
  },
  "one-tap-chaos": {
    bg: "#FFD23F", surface: "#FFFFFF", ink: "#1B1B1B", inkOnBg: "#1B1B1B", muted: "#544924",
    mutedSurface: "#626262", accent: "#2B59C3", onAccent: "#FFFFFF", accentDeep: "#1C3A7F",
    line: "#DFB83A", scheme: "light",
  },
  "last-pixel": {
    bg: "#FDF6EC", surface: "#FFFFFF", ink: "#3B3355", inkOnBg: "#3B3355", muted: "#625A73",
    mutedSurface: "#645E79", accent: "#6F5BF2", onAccent: "#FFFFFF", accentDeep: "#483B9D",
    line: "#E2DBD7", scheme: "light",
  },
  "panic-stack": {
    bg: "#FFF1E0", surface: "#FFFFFF", ink: "#2E2A4F", inkOnBg: "#2E2A4F", muted: "#5E5870",
    mutedSurface: "#625F7B", accent: "#B8460C", onAccent: "#FFFFFF", accentDeep: "#782E08",
    line: "#E2D5CC", scheme: "light",
  },
  "cursor-escape": {
    bg: "#0F7F7F", surface: "#C3C3C3", ink: "#111111", inkOnBg: "#FFFFFF", muted: "#FFFFFF",
    mutedSurface: "#3E3E3E", accent: "#0A2A8A", onAccent: "#FFFFFF", accentDeep: "#071B5A",
    line: "#319191", scheme: "dark", focus: "#FFE14D",
  },
  "wrong-door": {
    bg: "#2A1E2F", surface: "#F3E3D3", ink: "#2A1E2F", inkOnBg: "#F3E3D3", muted: "#AD9E9A",
    mutedSurface: "#5C4F58", accent: "#C9A227", onAccent: "#2A1E2F", accentDeep: "#836919",
    line: "#463A46", scheme: "dark",
  },
  "dont-blink": {
    bg: "#0B0F0E", surface: "#1C2422", ink: "#CFE8DC", inkOnBg: "#CFE8DC", muted: "#85968E",
    mutedSurface: "#92A59D", accent: "#7CFFB2", onAccent: "#0B0F0E", accentDeep: "#51A674",
    line: "#262D2B", scheme: "dark",
  },
  "gravity-is-lying": {
    bg: "#F2FBFA", surface: "#FFFFFF", ink: "#163238", inkOnBg: "#163238", muted: "#4B6267",
    mutedSurface: "#50656A", accent: "#0F7366", onAccent: "#FFFFFF", accentDeep: "#0A4B42",
    line: "#D3DFDF", scheme: "light",
  },
};

function luminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1, 7), 16);
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(n >> 16) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

/** WCAG contrast ratio between two #RRGGBB colours (1 to 21). */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** `color`, nudged toward black or white just enough to read as small text on `bg`. */
export function readableOn(color: string, bg: string, min = 4.5): string {
  const target = contrast(bg, "#000000") > contrast(bg, "#FFFFFF") ? 0 : 255;
  const n = Number.parseInt(color.slice(1, 7), 16);
  const rgb = [n >> 16, (n >> 8) & 255, n & 255];
  for (let step = 0; step <= 20; step++) {
    const t = step / 20;
    const hex = `#${rgb.map((c) => Math.round(c + (target - c) * t).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
    if (contrast(hex, bg) >= min) return hex;
  }
  return target === 0 ? "#000000" : "#FFFFFF";
}

/** The accent as small text on the background. */
export const accentInk = (p: Palette) => readableOn(p.accent, p.bg);

function vars(p: Palette): string {
  return [
    `--bg:${p.bg}`,
    `--surface:${p.surface}`,
    `--ink:${p.ink}`,
    `--ink-on-bg:${p.inkOnBg}`,
    `--muted:${p.muted}`,
    `--muted-surface:${p.mutedSurface}`,
    `--accent:${p.accent}`,
    `--on-accent:${p.onAccent}`,
    `--accent-deep:${p.accentDeep}`,
    `--accent-ink:${accentInk(p)}`,
    `--line:${p.line}`,
    `--focus:${p.focus ?? (p.scheme === "dark" ? p.accent : p.accentDeep)}`,
    `color-scheme:${p.scheme}`,
  ].join(";");
}

/** CSS that themes any element with a data-game attribute (rendered once in the root layout). */
export const PALETTE_CSS = Object.entries(GAME_PALETTES)
  .map(([slug, palette]) => `[data-game="${slug}"]{${vars(palette)}}`)
  .join("\n");
