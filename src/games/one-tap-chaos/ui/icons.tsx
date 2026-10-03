// Pictograms for every microgame and boss: under the Silent card they replace the words, and the
// practice room uses them too. Thick ink outlines, readable at a glance (Plan §9).
import { ArrowLeftRight, Crown, LightbulbOff, MessageSquareOff, MousePointerClick, OctagonX, Timer, FlipHorizontal2 } from "lucide-react";
import type { ReactNode } from "react";
import type { BossId, MicrogameId } from "../microgames/types";
import type { RuleId } from "../rules";

const INK = "#1B1B1B";
const S = { stroke: INK, strokeWidth: 4, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

const ICONS: Record<MicrogameId | BossId, ReactNode> = {
  jump: (
    <>
      <path d="M8 54h48" {...S} />
      <path d="M40 54V34a5 5 0 0 1 10 0v20M40 44h-6v-6" fill="#3FA34D" {...S} />
      <circle cx="20" cy="20" r="9" fill="#FFB703" {...S} />
      <path d="M14 34l6-5 6 5" fill="none" {...S} />
    </>
  ),
  catch: (
    <>
      <ellipse cx="32" cy="14" rx="7" ry="9" fill="#FFF8E7" {...S} />
      <path d="M12 38h40l-6 18H18z" fill="#C98A3F" {...S} />
      <path d="M32 27v5" {...S} strokeDasharray="2 4" />
    </>
  ),
  stop: (
    <>
      <circle cx="32" cy="34" r="22" fill="#F5F1FF" {...S} />
      <path d="M32 34L46 22A22 22 0 0 1 52 30z" fill="#2FBF71" {...S} />
      <path d="M32 34V16" {...S} strokeWidth={5} />
    </>
  ),
  dont: (
    <>
      <ellipse cx="32" cy="42" rx="24" ry="10" fill="#1C3A7F" {...S} />
      <ellipse cx="32" cy="36" rx="24" ry="10" fill="#2B59C3" {...S} />
      <ellipse cx="34" cy="22" rx="5" ry="6" fill={INK} />
      <ellipse cx="28" cy="17" rx="6" ry="3" fill="#fff" {...S} strokeWidth={2} />
      <ellipse cx="40" cy="17" rx="6" ry="3" fill="#fff" {...S} strokeWidth={2} />
    </>
  ),
  shoot: (
    <>
      <circle cx="32" cy="32" r="20" fill="#fff" {...S} />
      <circle cx="32" cy="32" r="12" fill="#2B59C3" {...S} />
      <circle cx="32" cy="32" r="4" fill="#fff" {...S} strokeWidth={3} />
      <path d="M32 4v10M32 50v10M4 32h10M50 32h10" {...S} />
    </>
  ),
  pump: (
    <>
      <circle cx="30" cy="26" r="17" fill="#9B5DE5" {...S} />
      <path d="M30 43l-4 6h8z" fill="#7B3FC4" {...S} strokeWidth={3} />
      <circle cx="30" cy="26" r="22" fill="none" {...S} strokeDasharray="5 5" />
    </>
  ),
  flip: (
    <>
      <path d="M8 44h36" {...S} />
      <path d="M44 44h12" {...S} strokeWidth={6} />
      <ellipse cx="26" cy="40" rx="18" ry="6" fill="#555" {...S} />
      <ellipse cx="26" cy="22" rx="13" ry="5" fill="#E8A13A" {...S} transform="rotate(-18 26 22)" />
      <path d="M18 10q4-4 8 0M30 8q4-4 8 0" fill="none" {...S} strokeWidth={3} />
    </>
  ),
  wait: (
    <>
      <rect x="18" y="6" width="28" height="52" rx="8" fill="#2E2E2E" {...S} />
      <circle cx="32" cy="21" r="8" fill="#FF8C1A" {...S} strokeWidth={3} />
      <circle cx="32" cy="43" r="8" fill="#203A2C" {...S} strokeWidth={3} />
    </>
  ),
  count: (
    <>
      <path d="M8 54h48M44 54V36M54 54V36M40 42h18" {...S} />
      <circle cx="18" cy="30" r="8" fill="#fff" {...S} />
      <circle cx="28" cy="28" r="8" fill="#fff" {...S} />
      <ellipse cx="36" cy="25" rx="5" ry="6" fill="#3D3D3D" {...S} strokeWidth={3} />
      <path d="M18 38v8M28 38v8" {...S} />
    </>
  ),
  dodge: (
    <>
      <path d="M22 4v56M42 4v56" {...S} strokeDasharray="6 6" />
      <rect x="10" y="34" width="18" height="24" rx="6" fill="#FFB703" {...S} />
      <path d="M38 22l6-16 6 16z" fill="#FF8C1A" {...S} />
    </>
  ),
  beat: (
    <>
      <rect x="10" y="28" width="44" height="26" rx="6" fill="#2B59C3" {...S} />
      <ellipse cx="32" cy="28" rx="22" ry="7" fill="#FFF8E7" {...S} />
      <path d="M14 6l14 18M50 6L36 24" {...S} strokeWidth={5} stroke="#C98A3F" />
    </>
  ),
  cut: (
    <>
      <path d="M32 4v20" {...S} strokeWidth={3} />
      <rect x="22" y="24" width="20" height="22" rx="6" fill="#C9A26B" {...S} />
      <circle cx="14" cy="14" r="5" fill="none" {...S} strokeWidth={3} />
      <circle cx="14" cy="26" r="5" fill="none" {...S} strokeWidth={3} />
      <path d="M18 17l12-3M18 23l12 3" {...S} strokeWidth={3} />
      <path d="M14 58h36" {...S} />
    </>
  ),
  snap: (
    <>
      <rect x="6" y="18" width="52" height="36" rx="8" fill="#3D3D3D" {...S} />
      <path d="M22 18l4-8h12l4 8" fill="#3D3D3D" {...S} />
      <circle cx="32" cy="36" r="11" fill="#8FD3FF" {...S} />
      <circle cx="49" cy="26" r="3" fill="#FFB703" />
    </>
  ),
  kick: (
    <>
      <path d="M6 8h52v26" fill="none" {...S} />
      <path d="M6 8v26" {...S} />
      <circle cx="32" cy="46" r="12" fill="#fff" {...S} />
      <path d="M32 40l5 4-2 6h-6l-2-6z" fill={INK} />
    </>
  ),
  "high-five": (
    <>
      <path d="M22 58V36l-8-10a4 4 0 0 1 6-5l6 7V10a4 4 0 0 1 8 0v18-22a4 4 0 0 1 8 0v22-16a4 4 0 0 1 8 0v26c0 12-6 20-16 20z" fill="#fff" {...S} />
    </>
  ),
  sleep: (
    <>
      <path d="M40 10a20 20 0 1 0 14 34A16 16 0 0 1 40 10z" fill="#FFF3B0" {...S} />
      <path d="M8 10h10L8 22h10" fill="none" {...S} strokeWidth={3} />
    </>
  ),
  bigger: (
    <>
      <rect x="4" y="12" width="24" height="40" rx="6" fill="#fff" {...S} />
      <rect x="36" y="12" width="24" height="40" rx="6" fill="#B8A9CC" {...S} />
      <text x="16" y="41" textAnchor="middle" fontSize="22" fontFamily="var(--font-g-bungee)" fill={INK}>
        9
      </text>
      <text x="48" y="41" textAnchor="middle" fontSize="22" fontFamily="var(--font-g-bungee)" fill="#555">
        4
      </text>
    </>
  ),
  match: (
    <>
      <rect x="6" y="6" width="22" height="22" rx="5" fill="#fff" {...S} />
      <path d="M17 10l3 6 6 1-4 4 1 6-6-3-6 3 1-6-4-4 6-1z" fill="#FFB703" {...S} strokeWidth={2} />
      <path d="M42 30l6 12 13 2-9 9 2 13-12-6-12 6 2-13-9-9 13-2z" fill="#2B59C3" {...S} transform="translate(-6 -6) scale(0.95)" />
    </>
  ),
  stack: (
    <>
      <rect x="16" y="42" width="32" height="14" rx="3" fill="#A0703C" {...S} />
      <rect x="18" y="28" width="30" height="14" rx="3" fill="#2B59C3" {...S} />
      <rect x="24" y="6" width="30" height="14" rx="3" fill="#FFB703" {...S} />
      <path d="M39 22v4" {...S} strokeDasharray="2 3" />
    </>
  ),
  land: (
    <>
      <path d="M26 44l-6 6h-4l6-10M38 44l6 6h4l-6-10" fill="#2B59C3" {...S} strokeWidth={3} />
      <rect x="24" y="14" width="16" height="32" rx="5" fill="#fff" {...S} />
      <path d="M24 16l8-12 8 12" fill="#2B59C3" {...S} />
      <path d="M12 60h40" {...S} strokeWidth={5} stroke="#FFB703" />
    </>
  ),
  freeze: (
    <>
      <circle cx="40" cy="18" r="10" fill="#FFD8B5" {...S} />
      <rect x="30" y="28" width="20" height="28" rx="8" fill="#2B59C3" {...S} />
      <text x="16" y="40" textAnchor="middle" fontSize="34" fontFamily="var(--font-g-bungee)" fill={INK}>
        !
      </text>
    </>
  ),
  swat: (
    <>
      <ellipse cx="32" cy="34" rx="6" ry="14" fill="#3D3D3D" />
      <ellipse cx="22" cy="24" rx="10" ry="5" fill="#fff" {...S} strokeWidth={2} transform="rotate(-30 22 24)" />
      <ellipse cx="42" cy="24" rx="10" ry="5" fill="#fff" {...S} strokeWidth={2} transform="rotate(30 42 24)" />
      <path d="M32 20V6M26 44l-8 10M38 44l8 10" {...S} strokeWidth={3} />
    </>
  ),
  loading: (
    <>
      <rect x="6" y="24" width="52" height="16" rx="8" fill="#EAEEF2" {...S} />
      <rect x="10" y="28" width="30" height="8" rx="4" fill="#2B59C3" />
      <path d="M44 50h12M50 46l6 4-6 4" fill="none" {...S} strokeWidth={3} />
    </>
  ),
  mystery: (
    <text x="32" y="50" textAnchor="middle" fontSize="48" fontFamily="var(--font-g-bungee)" fill="#fff" stroke={INK} strokeWidth={3} paintOrder="stroke">
      ?
    </text>
  ),
  conductor: (
    <>
      <path d="M12 52L44 14" {...S} strokeWidth={4} />
      <circle cx="12" cy="52" r="5" fill={INK} />
      <path d="M44 14l6-6" stroke="#fff" strokeWidth={4} strokeLinecap="round" />
      <path d="M40 50a6 6 0 1 1-6-6h6V28l12-4v14" fill="none" {...S} strokeWidth={3} />
    </>
  ),
  liar: (
    <>
      <path d="M10 46l-2-24 12 10 12-18 12 18 12-10-2 24z" fill="#FFB703" {...S} />
      <text x="32" y="44" textAnchor="middle" fontSize="18" fontFamily="var(--font-g-bungee)" fill={INK}>
        ?
      </text>
    </>
  ),
  "final-tap": (
    <>
      <ellipse cx="32" cy="46" rx="26" ry="10" fill="#1C3A7F" {...S} />
      <ellipse cx="32" cy="40" rx="26" ry="10" fill="#2B59C3" {...S} />
      <text x="32" y="26" textAnchor="middle" fontSize="16" fontFamily="var(--font-g-bungee)" fill={INK}>
        NOW
      </text>
    </>
  ),
};

export function MicrogameIcon({ id, className }: { id: MicrogameId | BossId; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden fill="none">
      {ICONS[id]}
    </svg>
  );
}

const RULE_ICONS: Record<RuleId, typeof Crown> = {
  opposite: ArrowLeftRight,
  redMeansNo: OctagonX,
  simonSays: Crown,
  lag: Timer,
  doubleTap: MousePointerClick,
  silent: MessageSquareOff,
  mirror: FlipHorizontal2,
  lightsOut: LightbulbOff,
};

export function RuleIcon({ rule, className }: { rule: RuleId; className?: string }) {
  const Icon = RULE_ICONS[rule];
  return <Icon className={className} aria-hidden strokeWidth={2.6} />;
}

/** The crown from Simon Says and The Liar. */
export function CrownMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 40" className={className} aria-hidden>
      <path d="M6 36L4 8l14 12L32 2l14 18L60 8l-2 28z" fill="#FFB703" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    </svg>
  );
}

/** A light bulb: one of your four lives. */
export function Bulb({ lit, className }: { lit: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 40 56" className={className} aria-hidden>
      {lit && <circle cx="20" cy="20" r="19" fill="#FFF3B0" opacity="0.7" />}
      <path
        d="M20 3a16 16 0 0 0-9 29c2 2 3 4 3 7h12c0-3 1-5 3-7a16 16 0 0 0-9-29z"
        fill={lit ? "#FFE27A" : "#9A9A9A"}
        stroke={INK}
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
      {!lit && <path d="M12 14l6 6-4 4 8 6M26 10l-4 8 6 4" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />}
      {lit && <path d="M15 24q5 6 10 0" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />}
      <rect x="13" y="40" width="14" height="10" rx="3" fill="#C9CED9" stroke={INK} strokeWidth={3} />
    </svg>
  );
}
