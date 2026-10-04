// Glitch Run's little pictures: a pictogram for every glitch (the HUD's warnings and the help), the
// glitch charge's bolt, the runner, The Debugger's eye and the file browser's icons. Shapes first, so
// none of them depends on colour alone.
import type { CSSProperties } from "react";
import { GLITCHES, type GlitchKind } from "../glitches/kinds";

type IconProps = { size?: number | string; className?: string; style?: CSSProperties };

const box = (size: number | string) => ({ width: size, height: size });

/** A glitch's pictogram, drawn in currentColor. */
export function GlitchIcon({ kind, size = "1em", className, style }: IconProps & { kind: GlitchKind }) {
  const icon = GLITCHES[kind].icon;
  return (
    <svg viewBox="0 0 24 24" style={{ ...box(size), ...style }} className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {icon === "skip" && (
        <>
          <rect x="3" y="5" width="7" height="14" rx="1" />
          <rect x="14" y="5" width="7" height="14" rx="1" strokeDasharray="2 2" />
        </>
      )}
      {icon === "swap" && <path d="M7 4v16M7 4 3.5 7.5M7 4l3.5 3.5M17 20V4m0 16-3.5-3.5M17 20l3.5-3.5" />}
      {icon === "tear" && (
        <>
          <path d="M3 4h18v7H3z" />
          <path d="M7 14h14v6H7zM3 14h1v6H3" />
        </>
      )}
      {icon === "texture" && (
        <>
          <rect x="3" y="3" width="18" height="18" />
          <path d="M3 9h6V3m0 12h6V9h6M3 21v-6h6v6m6-6h6m-6 6v-6" />
        </>
      )}
      {icon === "invert" && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" />
        </>
      )}
      {icon === "desync" && <path d="M2 12h3l2-6 3 12 2-6h2M14 12h1.5l2-4 2 8 1.5-4H22" />}
      {icon === "dejavu" && <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" />}
      {icon === "lowres" && (
        <>
          <rect x="3" y="3" width="8" height="8" fill="currentColor" />
          <rect x="13" y="13" width="8" height="8" fill="currentColor" />
          <rect x="13" y="3" width="8" height="8" />
          <rect x="3" y="13" width="8" height="8" />
        </>
      )}
      {icon === "ghost" && (
        <>
          <circle cx="8" cy="6" r="2.2" />
          <path d="M8 9v6m0 0-3 5m3-5 3 5M5 12h6" />
          <circle cx="16.5" cy="6" r="2.2" strokeDasharray="2 2" />
          <path d="M16.5 9v6m0 0-3 5m3-5 3 5M13.5 12h6" strokeDasharray="2 2" />
        </>
      )}
      {icon === "frozen" && (
        <>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 8h18M9 12l6 5m0-5-6 5" />
        </>
      )}
      {icon === "flip" && <path d="M12 3v18m0 0-5-5m5 5 5-5M5 7h4M15 7h4" />}
    </svg>
  );
}

/** Kernel Panic's alarm. */
export function PanicIcon({ size = "1em", className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" style={box(size)} className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3 2 20h20L12 3Z" />
      <path d="M12 10v4m0 3v.5" />
    </svg>
  );
}

/** A glitch charge: a bolt, filled when charged. */
export function Bolt({ size = "1em", on = true, className }: IconProps & { on?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" style={box(size)} className={className} data-on={on ? "" : undefined} aria-hidden>
      <path d="M13.5 2 4 13.5h6.5L9 22l10-12.5h-6.6L13.5 2Z" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" />
    </svg>
  );
}

/** The runner: a neon stick figure mid-stride (cyan and pink copies just apart). */
export function RunnerFigure({ size = 48, className }: IconProps) {
  const body = "M13 6.5 11 15M12.4 9l4.6 2.6M12.4 9 8 11.4M11 15l4.2 3.4-1 4.6M11 15l-4.4 2.6-2.4 3.4";
  return (
    <svg viewBox="0 0 24 26" style={box(size)} className={className} fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <g stroke="#FF2E88" strokeWidth={2} opacity={0.75} transform="translate(-0.8 0)">
        <path d={body} />
      </g>
      <g stroke="#00F5D4" strokeWidth={2} opacity={0.75} transform="translate(0.8 0)">
        <path d={body} />
      </g>
      <path d={body} stroke="#E6F1FF" strokeWidth={2} />
      <circle cx="13.6" cy="3.6" r="2.3" fill="#E6F1FF" />
    </svg>
  );
}

/** The Debugger: a calm, geometric eye. */
export function DebuggerEye({ size = 56, className }: IconProps) {
  const octagon = (r: number) =>
    Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      return `${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)}`;
    }).join(" ");
  return (
    <svg viewBox="-30 -30 60 60" style={box(size)} className={className} fill="none" aria-hidden>
      <polygon points={octagon(27)} stroke="#E6F1FF" strokeWidth={2} />
      <polygon points={octagon(20)} stroke="#E6F1FF" strokeWidth={1.4} opacity={0.75} />
      <ellipse cx="2" cy="0" rx="10" ry="6.2" fill="#E6F1FF" />
      <circle cx="4.5" cy="0" r="3" fill="#07070D" />
    </svg>
  );
}

/** The file browser's icons: a program, a locked (still corrupted) file, endless, the daily. */
export function FileIcon({ kind, size = "1.25em", className }: IconProps & { kind: "exe" | "locked" | "endless" | "daily" | "root" }) {
  return (
    <svg viewBox="0 0 24 24" style={box(size)} className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {kind === "exe" && (
        <>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 8h18M7 12l3 2-3 2M12 16h4" />
        </>
      )}
      {kind === "root" && (
        <>
          <path d="M3 6.5V19h18V8.5h-9L10 6.5H3Z" />
          <path d="M8 14h8" />
        </>
      )}
      {kind === "locked" && (
        <>
          <rect x="3" y="4" width="18" height="16" rx="2" strokeDasharray="3 2" />
          <path d="M7 9h2m2 0h1m3 0h2M7 13h1m2 0h3m3 0h1M7 17h4m3 0h1" />
        </>
      )}
      {kind === "endless" && <path d="M7.5 8.5C4 8.5 3 11 3 12s1 3.5 4.5 3.5c3.6 0 5.4-7 9-7C20 8.5 21 11 21 12s-1 3.5-4.5 3.5c-3.6 0-5.4-7-9-7Z" />}
      {kind === "daily" && (
        <>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4m8-4v4M9 15l2 2 4-4" />
        </>
      )}
    </svg>
  );
}
