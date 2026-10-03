// Metro, the show's host: a smug little metronome with a face (Plan §9). His arm keeps the beat.
import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import styles from "../otc.module.css";

export type MetroMood = "smug" | "happy" | "shock" | "sad";

const INK = "#1B1B1B";

export function Metro({ mood = "smug", bpm = 100, className, still = false }: { mood?: MetroMood; bpm?: number; className?: string; still?: boolean }) {
  const eyes = {
    smug: (
      <>
        <path d="M44 122q6-5 12 0M64 122q6-5 12 0" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
        <circle cx="50" cy="125" r="3" fill={INK} />
        <circle cx="70" cy="125" r="3" fill={INK} />
      </>
    ),
    happy: <path d="M44 126q6-7 12 0M64 126q6-7 12 0" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />,
    shock: (
      <>
        <circle cx="50" cy="123" r="6" fill="#fff" stroke={INK} strokeWidth={3} />
        <circle cx="70" cy="123" r="6" fill="#fff" stroke={INK} strokeWidth={3} />
        <circle cx="50" cy="123" r="2.5" fill={INK} />
        <circle cx="70" cy="123" r="2.5" fill={INK} />
      </>
    ),
    sad: (
      <>
        <path d="M44 120l10 4M76 120l-10 4" stroke={INK} strokeWidth={4} strokeLinecap="round" />
        <circle cx="50" cy="127" r="3" fill={INK} />
        <circle cx="70" cy="127" r="3" fill={INK} />
      </>
    ),
  }[mood];
  const mouth = {
    smug: <path d="M50 136q10 6 20-3" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />,
    happy: <path d="M48 134q12 12 24 0z" fill="#fff" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />,
    shock: <ellipse cx="60" cy="138" rx="5" ry="6" fill={INK} />,
    sad: <path d="M50 140q10-8 20 0" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />,
  }[mood];

  return (
    <svg viewBox="0 0 120 170" className={className} role="img" aria-label="Metro, the metronome host">
      <rect x="20" y="148" width="80" height="16" rx="6" fill="#1C3A7F" stroke={INK} strokeWidth={5} />
      <path d="M30 150L46 14h28l16 136z" fill="#2B59C3" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d="M50 26h20l6 82H44z" fill="#BDE0FE" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <g className={still ? undefined : styles.swing} style={{ "--swing": `${(60 / bpm).toFixed(3)}s` } as CSSProperties}>
        <path d="M60 104V32" stroke={INK} strokeWidth={5} strokeLinecap="round" />
        <rect x="52" y="48" width="16" height="12" rx="3" fill="#FFB703" stroke={INK} strokeWidth={3.5} />
      </g>
      <circle cx="60" cy="104" r="5" fill={INK} />
      {eyes}
      {mouth}
    </svg>
  );
}

export function MetroBubble({ children, className }: { children: string; className?: string }) {
  return (
    <p
      className={cn(
        "relative rounded-2xl border-[3px] border-[#1B1B1B] bg-white px-4 py-2 text-center text-lg text-[#1B1B1B] shadow-[0_4px_0_#1B1B1B]",
        styles.show,
        className,
      )}
    >
      {children}
    </p>
  );
}
