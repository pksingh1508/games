"use client";

// The fridge from the old elephant joke: a door you open and close, and room inside for exactly
// one large animal.
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { sfx } from "../sfx";
import { DropZone } from "./drag";

const LINE = "#161414";
const MAGNETS = [
  { x: 26, y: 92, letter: "N", fill: "#D41F22" },
  { x: 44, y: 100, letter: "O", fill: "#2B59C3" },
  { x: 62, y: 92, letter: "P", fill: "#7ED957" },
  { x: 80, y: 100, letter: "E", fill: "#FFC93C" },
];

export function Fridge({
  open,
  onToggle,
  children,
  className,
}: {
  open: boolean;
  onToggle: () => void;
  /** What's inside (only visible while it's open). */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <DropZone id={open ? "fridge" : "fridge-closed"} label="the fridge" className={cn("aspect-[150/212] w-40 sm:w-48", className)}>
      <svg viewBox="0 0 150 212" className="absolute inset-0 size-full" aria-hidden>
        <rect x="18" y="204" width="16" height="7" rx="2" fill={LINE} />
        <rect x="92" y="204" width="16" height="7" rx="2" fill={LINE} />
        <rect x="8" y="4" width="110" height="202" rx="14" fill="#F4F7FA" stroke={LINE} strokeWidth="3.5" />
        <path d="M8 62 H118" stroke={LINE} strokeWidth="3.5" />
        <rect x="100" y="20" width="7" height="28" rx="3" fill="#9AA6B2" stroke={LINE} strokeWidth="2.5" />
        {open ? (
          <g>
            <rect x="14" y="66" width="98" height="134" rx="6" fill="#DDF2FF" stroke={LINE} strokeWidth="3" />
            <ellipse cx="63" cy="74" rx="26" ry="5" fill="#FFFFFF" opacity="0.9" />
            <path d="M18 158 H108" stroke="#A9C9DE" strokeWidth="3" />
            <path d="M118 64 L146 74 L146 196 L118 206 z" fill="#E8EDF2" stroke={LINE} strokeWidth="3.5" strokeLinejoin="round" />
            <rect x="133" y="96" width="6" height="40" rx="3" fill="#9AA6B2" stroke={LINE} strokeWidth="2.5" />
          </g>
        ) : (
          <g>
            <rect x="100" y="82" width="7" height="48" rx="3" fill="#9AA6B2" stroke={LINE} strokeWidth="2.5" />
            {MAGNETS.map((mag) => (
              <g key={mag.letter} transform={`rotate(${mag.letter === "O" ? -8 : 6} ${mag.x} ${mag.y})`}>
                <text x={mag.x} y={mag.y} textAnchor="middle" fontSize="19" fill={mag.fill} stroke={LINE} strokeWidth="1.2" fontFamily="var(--font-g-bangers)">
                  {mag.letter}
                </text>
              </g>
            ))}
          </g>
        )}
      </svg>
      {open && <div className="absolute left-[11%] top-[33%] flex h-[60%] w-[62%] items-end justify-center pb-[6%]">{children}</div>}
      <button
        type="button"
        onClick={() => {
          sfx.thump();
          onToggle();
        }}
        aria-label={open ? "Close the fridge door" : "Open the fridge door"}
        className={cn(
          "absolute rounded-xl outline-offset-2",
          open ? "right-0 top-[30%] h-[68%] w-[22%]" : "left-[6%] top-[30%] h-[66%] w-[73%]",
        )}
      />
    </DropZone>
  );
}
