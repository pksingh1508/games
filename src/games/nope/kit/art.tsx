// Props and characters for the questions: flat cartoon art with chunky outlines, drawn as SVG
// (no image files). Decorative unless a question wraps them in a button.
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "../nope.module.css";

const LINE = "#161414";

export function Elephant({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 112" className={className} aria-hidden>
      <path d="M22 54 q-12 4 -11 18" stroke={LINE} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      {[30, 47, 74, 91].map((x) => (
        <g key={x}>
          <rect x={x} y="68" width="15" height="34" rx="6" fill="#A9B4C2" stroke={LINE} strokeWidth="3.5" />
          <path d={`M${x + 3} 98 h9`} stroke="#FFF4D6" strokeWidth="3" strokeLinecap="round" />
        </g>
      ))}
      <ellipse cx="62" cy="58" rx="45" ry="33" fill="#A9B4C2" stroke={LINE} strokeWidth="3.5" />
      <path d="M30 44 q18 -16 44 -14" stroke="#C7CFDA" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M118 48 q16 12 11 32 q-3 9 7 10" stroke={LINE} strokeWidth="15" fill="none" strokeLinecap="round" />
      <path d="M118 48 q16 12 11 32 q-3 9 7 10" stroke="#A9B4C2" strokeWidth="8" fill="none" strokeLinecap="round" />
      <circle cx="105" cy="44" r="25" fill="#A9B4C2" stroke={LINE} strokeWidth="3.5" />
      <ellipse cx="90" cy="48" rx="14" ry="20" fill="#C7CFDA" stroke={LINE} strokeWidth="3.5" />
      <circle cx="113" cy="37" r="4" fill={LINE} />
      <circle cx="114.5" cy="35.5" r="1.3" fill="#fff" />
      <ellipse cx="115" cy="50" rx="5" ry="3" fill="#FF8A8C" opacity="0.6" />
      <path d="M112 60 q5 6 12 4" stroke="#FFF4D6" strokeWidth="4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Giraffe({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 110 170" className={className} aria-hidden>
      <path d="M22 108 q-12 6 -10 22" stroke={LINE} strokeWidth="3" fill="none" strokeLinecap="round" />
      {[30, 43, 62, 75].map((x) => (
        <rect key={x} x={x} y="112" width="10" height="52" rx="4" fill="#F5C443" stroke={LINE} strokeWidth="3" />
      ))}
      <ellipse cx="54" cy="108" rx="34" ry="19" fill="#F5C443" stroke={LINE} strokeWidth="3.5" />
      <path d="M62 98 L72 36 L86 38 L80 102 z" fill="#F5C443" stroke={LINE} strokeWidth="3.5" strokeLinejoin="round" />
      <g fill="#B8742A">
        <ellipse cx="40" cy="104" rx="7" ry="5" />
        <ellipse cx="58" cy="114" rx="6" ry="4" />
        <ellipse cx="71" cy="104" rx="5" ry="4" />
        <ellipse cx="77" cy="70" rx="4" ry="5" />
        <ellipse cx="76" cy="50" rx="3.5" ry="4" />
        <ellipse cx="74" cy="88" rx="3" ry="4" />
      </g>
      <path d="M76 18 v-10 M88 18 v-10" stroke={LINE} strokeWidth="3" strokeLinecap="round" />
      <circle cx="76" cy="7" r="3.5" fill="#B8742A" stroke={LINE} strokeWidth="2" />
      <circle cx="88" cy="7" r="3.5" fill="#B8742A" stroke={LINE} strokeWidth="2" />
      <ellipse cx="86" cy="28" rx="20" ry="13" fill="#F5C443" stroke={LINE} strokeWidth="3.5" />
      <ellipse cx="100" cy="32" rx="7" ry="6" fill="#E9A93A" />
      <circle cx="84" cy="24" r="3.2" fill={LINE} />
      <circle cx="85.2" cy="22.8" r="1" fill="#fff" />
      <path d="M92 34 q4 3 8 1" stroke={LINE} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Cat({ mood = "idle", className }: { mood?: "idle" | "happy" | "angry"; className?: string }) {
  return (
    <svg viewBox="0 0 160 150" className={className} aria-hidden>
      <path d="M118 128 q34 -4 26 -40 q-4 -14 -16 -10" stroke={LINE} strokeWidth="14" fill="none" strokeLinecap="round" />
      <path d="M118 128 q34 -4 26 -40 q-4 -14 -16 -10" stroke="#F59E42" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M40 140 q-6 -52 22 -70 h36 q28 18 22 70 z" fill="#F59E42" stroke={LINE} strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M58 92 q22 8 44 0 M54 108 q26 9 52 0" stroke="#D9772B" strokeWidth="5" fill="none" strokeLinecap="round" />
      <ellipse cx="62" cy="140" rx="13" ry="7" fill="#FBC58A" stroke={LINE} strokeWidth="3" />
      <ellipse cx="98" cy="140" rx="13" ry="7" fill="#FBC58A" stroke={LINE} strokeWidth="3" />
      <path d="M46 30 L52 4 L70 22 z M114 30 L108 4 L90 22 z" fill="#F59E42" stroke={LINE} strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M52 12 L56 24 M108 12 L104 24" stroke="#FF9FB2" strokeWidth="4" strokeLinecap="round" />
      <circle cx="80" cy="52" r="36" fill="#F59E42" stroke={LINE} strokeWidth="3.5" />
      <path d="M68 22 q4 8 0 14 M80 18 v14 M92 22 q-4 8 0 14" stroke="#D9772B" strokeWidth="4" fill="none" strokeLinecap="round" />
      {mood === "happy" ? (
        <path d="M58 52 q7 -8 14 0 M88 52 q7 -8 14 0" stroke={LINE} strokeWidth="4" fill="none" strokeLinecap="round" />
      ) : mood === "angry" ? (
        <path d="M58 46 l14 6 l-14 6 M102 46 l-14 6 l14 6" stroke={LINE} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <g>
          <ellipse cx="65" cy="52" rx="6" ry="8" fill={LINE} />
          <ellipse cx="95" cy="52" rx="6" ry="8" fill={LINE} />
          <circle cx="67" cy="49" r="2" fill="#fff" />
          <circle cx="97" cy="49" r="2" fill="#fff" />
        </g>
      )}
      <path d="M76 64 h8 l-4 5 z" fill="#FF7A93" stroke={LINE} strokeWidth="2" strokeLinejoin="round" />
      <path d="M80 69 q-5 7 -10 3 M80 69 q5 7 10 3" stroke={LINE} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M50 62 h-20 M50 68 l-18 5 M110 62 h20 M110 68 l18 5" stroke={LINE} strokeWidth="2" strokeLinecap="round" />
      {mood === "happy" && (
        <g fill="#FF8A8C" opacity="0.7">
          <ellipse cx="58" cy="64" rx="6" ry="3.5" />
          <ellipse cx="102" cy="64" rx="6" ry="3.5" />
        </g>
      )}
    </svg>
  );
}

export function Key({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 90 40" className={className} aria-hidden>
      <circle cx="20" cy="20" r="14" fill="#FFC93C" stroke={LINE} strokeWidth="3.5" />
      <circle cx="20" cy="20" r="5.5" fill="#161414" />
      <path d="M33 17 h50 v7 h-6 v8 h-7 v-8 h-6 v6 h-7 v-6 h-24 z" fill="#FFC93C" stroke={LINE} strokeWidth="3.5" strokeLinejoin="round" />
    </svg>
  );
}

export function Doormat({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 170 46" className={className} aria-hidden>
      <path d="M8 6 v34 M18 6 v34 M152 6 v34 M162 6 v34" stroke="#6E4A28" strokeWidth="3" />
      <rect x="10" y="3" width="150" height="40" rx="8" fill="#A87444" stroke={LINE} strokeWidth="3.5" />
      <rect x="18" y="10" width="134" height="26" rx="5" fill="none" stroke="#7A522D" strokeWidth="2.5" strokeDasharray="5 4" />
      <text x="85" y="31" textAnchor="middle" fontSize="20" fill="#5A3A1E" fontFamily="var(--font-g-bangers)" letterSpacing="3">
        GO AWAY
      </text>
    </svg>
  );
}

/** The exit door. A glowing sign gives it away even when something stands in front of it. */
export function ExitDoor({ open, className }: { open?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 130 210" className={className} aria-hidden>
      <rect x="35" y="2" width="60" height="22" rx="5" fill="#1B7F3B" stroke={LINE} strokeWidth="3" />
      <text x="65" y="19" textAnchor="middle" fontSize="16" fill="#E9FFE9" fontFamily="var(--font-g-bangers)" letterSpacing="2">
        EXIT
      </text>
      <rect x="6" y="30" width="118" height="178" rx="6" fill="#3A2A20" stroke={LINE} strokeWidth="3.5" />
      {open ? (
        <g>
          <rect x="16" y="40" width="98" height="168" fill="#FFF4D6" />
          <path d="M16 40 h98 v168 h-98 z" fill="url(#exit-light)" opacity="0.6" />
          <defs>
            <linearGradient id="exit-light" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFE7A0" />
              <stop offset="1" stopColor="#FFFFFF" />
            </linearGradient>
          </defs>
          <path d="M16 40 L40 52 L40 196 L16 208 z" fill="#8B5A2B" stroke={LINE} strokeWidth="3" strokeLinejoin="round" />
        </g>
      ) : (
        <g>
          <rect x="16" y="40" width="98" height="168" fill="#8B5A2B" stroke={LINE} strokeWidth="3" />
          <rect x="28" y="54" width="74" height="58" rx="4" fill="none" stroke="#6B421E" strokeWidth="4" />
          <rect x="28" y="126" width="74" height="66" rx="4" fill="none" stroke="#6B421E" strokeWidth="4" />
          <circle cx="98" cy="122" r="7" fill="#FFC93C" stroke={LINE} strokeWidth="3" />
          <path d="M98 136 v8" stroke={LINE} strokeWidth="4" strokeLinecap="round" />
          <circle cx="98" cy="135" r="3" fill={LINE} />
        </g>
      )}
    </svg>
  );
}

export function Ketchup({ squirt, className }: { squirt?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 90 190" className={className} aria-hidden>
      {squirt && (
        <g>
          <path d="M45 20 q-6 -12 2 -18 q8 6 -2 18" fill="#C4161C" />
          <circle cx="30" cy="8" r="4" fill="#C4161C" />
          <circle cx="60" cy="12" r="3" fill="#C4161C" />
        </g>
      )}
      <path d="M38 22 h14 l4 16 h-22 z" fill="#FFFFFF" stroke={LINE} strokeWidth="3.5" strokeLinejoin="round" />
      <rect x="26" y="36" width="38" height="16" rx="4" fill="#FFFFFF" stroke={LINE} strokeWidth="3.5" />
      <path d="M22 52 h46 q10 18 10 52 v62 q0 16 -16 16 h-34 q-16 0 -16 -16 v-62 q0 -34 10 -52 z" fill="#D41F22" stroke={LINE} strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M24 70 q-6 20 -4 60" stroke="#FF6B6E" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.7" />
      <rect x="18" y="98" width="54" height="46" rx="6" fill="#FFF4D6" stroke={LINE} strokeWidth="3" />
      <text x="45" y="117" textAnchor="middle" fontSize="12.5" fill={LINE} fontFamily="var(--font-g-bangers)" letterSpacing="1">
        SHAKE
      </text>
      <text x="45" y="134" textAnchor="middle" fontSize="12.5" fill={LINE} fontFamily="var(--font-g-bangers)" letterSpacing="1">
        WELL!
      </text>
    </svg>
  );
}

/** The skip fly (also the star of a later question). */
export function Fly({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 44" className={className} aria-hidden>
      <g className={styles.wings}>
        <ellipse cx="20" cy="12" rx="11" ry="8" fill="#DFF6FF" stroke={LINE} strokeWidth="2" opacity="0.9" />
        <ellipse cx="34" cy="12" rx="11" ry="8" fill="#DFF6FF" stroke={LINE} strokeWidth="2" opacity="0.9" />
      </g>
      <path d="M18 34 l-6 6 M27 36 v6 M36 34 l6 6" stroke={LINE} strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="27" cy="27" rx="12" ry="10" fill="#2E3440" stroke={LINE} strokeWidth="2.5" />
      <path d="M19 25 h16 M20 30 h14" stroke="#4C566A" strokeWidth="2" />
      <circle cx="41" cy="24" r="7" fill="#2E3440" stroke={LINE} strokeWidth="2.5" />
      <circle cx="43" cy="20" r="4" fill="#D41F22" />
      <circle cx="44" cy="19" r="1.3" fill="#fff" />
    </svg>
  );
}

/** For "count the triangles": one big triangle cut by two lines from the top. Six in all. */
export function TriangleFigure({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 196" className={className} role="img" aria-label="A large triangle, split by two straight lines that run from its top corner down to its base.">
      <path d="M110 12 L12 182 H208 z" fill="#FFC93C" stroke={LINE} strokeWidth="5" strokeLinejoin="round" />
      <path d="M110 12 L78 182 M110 12 L144 182" stroke={LINE} strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export function StickyNote({ children, className, rotate = 4 }: { children: ReactNode; className?: string; rotate?: number }) {
  return (
    <div
      className={cn(
        "relative w-36 bg-[#FFE66D] px-3 pb-4 pt-5 text-center text-[#161414] shadow-[4px_6px_0_0_#00000026]",
        styles.show,
        className,
      )}
      style={{ rotate: `${rotate}deg` }}
    >
      <span aria-hidden className="absolute -top-2.5 left-1/2 h-5 w-14 -translate-x-1/2 rotate-[-4deg] bg-white/60" />
      {children}
    </div>
  );
}

/** A plain wooden door with a number: for "which door has the prize?". */
export function PrizeDoor({ number, open, className }: { number: number; open?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 80 120" className={className} aria-hidden>
      <path d="M6 118 V26 q0 -20 34 -20 q34 0 34 20 V118 z" fill={open ? "#FFF4D6" : "#B5651D"} stroke={LINE} strokeWidth="3.5" strokeLinejoin="round" />
      {!open && (
        <>
          <path d="M16 112 V32 q0 -14 24 -14 q24 0 24 14 V112" fill="none" stroke="#8A4B12" strokeWidth="3" />
          <circle cx="60" cy="72" r="4.5" fill="#FFC93C" stroke={LINE} strokeWidth="2.5" />
        </>
      )}
      <text x="40" y={open ? 76 : 58} textAnchor="middle" fontSize="30" fill={open ? "#D41F22" : "#FFF4D6"} fontFamily="var(--font-g-bangers)">
        {open ? "★" : number}
      </text>
    </svg>
  );
}
