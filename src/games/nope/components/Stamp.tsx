// The NOPE! stamp mark: heavy rubber, slightly uneven ink (Plan/02-nope.md §9).
import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

/** Defines the ink texture once per stage; stamps reference it by id. */
export function StampDefs() {
  return (
    <svg aria-hidden width="0" height="0" className="absolute">
      <defs>
        <filter id="nope-ink" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="noise" />
          <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.1 1.5" result="speckle" />
          <feComposite in="SourceGraphic" in2="speckle" operator="in" result="inked" />
          <feTurbulence type="turbulence" baseFrequency="0.035" numOctaves="2" seed="3" result="warp" />
          <feDisplacementMap in="inked" in2="warp" scale="3.5" />
        </filter>
      </defs>
    </svg>
  );
}

export function StampMark({
  text = "NOPE!",
  color = "#D41F22",
  className,
  style,
}: {
  text?: string;
  color?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg viewBox="0 0 260 110" className={cn("overflow-visible", className)} style={style} aria-hidden>
      <g filter="url(#nope-ink)">
        <rect x="8" y="8" width="244" height="94" rx="14" fill="none" stroke={color} strokeWidth="9" />
        <rect x="20" y="20" width="220" height="70" rx="8" fill="none" stroke={color} strokeWidth="3" opacity="0.8" />
        <text
          x="130"
          y="80"
          textAnchor="middle"
          fontSize="70"
          fill={color}
          fontFamily="var(--font-g-bangers)"
          letterSpacing="5"
        >
          {text}
        </text>
      </g>
    </svg>
  );
}
