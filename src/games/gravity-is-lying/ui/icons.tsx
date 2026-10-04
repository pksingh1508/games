// Small pictures for the menus and the HUD: the gravity arrow, a golden apple, Isaac's face, Newt.
// Shapes, not just colours, so they read for everyone (Plan/15-gravity-is-lying.md §11).

export function ArrowNeedle({ className, ...rest }: { className?: string } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="-10 -10 20 20" className={className} aria-hidden {...rest}>
      {/* Pointing down, like the room's arrows: the HUD turns it. */}
      <path d="M0 9 L-6.5 1.5 L-2.6 1.5 L-2.6 -8 L2.6 -8 L2.6 1.5 L6.5 1.5 Z" fill="#163238" stroke="#fff" strokeWidth={1} strokeLinejoin="round" />
    </svg>
  );
}

export function AppleIcon({ size = 16, got = true }: { size?: number; got?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="-8 -9 16 17" aria-hidden>
      <path
        d="M0 -4 C3 -6.5 7 -4 6.5 0.5 C6 5 3 7 0 6 C-3 7 -6 5 -6.5 0.5 C-7 -4 -3 -6.5 0 -4 Z"
        fill={got ? "#F4B400" : "none"}
        stroke={got ? "#8A6400" : "#7d8f92"}
        strokeWidth={1.4}
        strokeDasharray={got ? undefined : "2 1.6"}
      />
      <path d="M0 -4 L0.8 -7.5" stroke={got ? "#6B4226" : "#7d8f92"} strokeWidth={1.3} strokeLinecap="round" />
      {got && <ellipse cx={3} cy={-6.6} rx={2.4} ry={1.1} fill="#52B788" transform="rotate(-25 3 -6.6)" />}
    </svg>
  );
}

export function SkullIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden>
      <path d="M8 1.5c-3.6 0-6 2.4-6 5.6 0 2 1 3.3 2.3 4v2.4h7.4v-2.4c1.3-.7 2.3-2 2.3-4 0-3.2-2.4-5.6-6-5.6z" fill="currentColor" />
      <circle cx={5.6} cy={7.4} r={1.5} fill="#fff" />
      <circle cx={10.4} cy={7.4} r={1.5} fill="#fff" />
      <path d="M6.5 13.5v-1.6M9.5 13.5v-1.6" stroke="#fff" strokeWidth={1} />
    </svg>
  );
}

/** Isaac's face, for cards. `lying` droops his leaf. */
export function IsaacFace({ size = 48, lying = false, className }: { size?: number; lying?: boolean; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="-14 -16 28 28" className={className} aria-hidden>
      <path d="M0 -7 C6 -11 12 -4 10 3 C9 9 3 11 0 9 C-3 11 -9 9 -10 3 C-12 -4 -6 -11 0 -7 Z" fill="#E63946" stroke="#8D1C25" strokeWidth={1.2} />
      <ellipse cx={-5} cy={-3} rx={1.6} ry={3} fill="#fff" opacity={0.45} transform="rotate(23 -5 -3)" />
      <path d="M0 -7 Q0.5 -10 1.5 -12" stroke="#6B4226" strokeWidth={1.6} fill="none" />
      <g transform={`translate(1.5 -11.5) rotate(${lying ? 109 : -31})`}>
        <path d="M0 0 Q4 -4 9 -1 Q4 3 0 0 Z" fill="#52B788" />
      </g>
      <circle cx={-3} cy={0} r={1.2} fill="#163238" />
      <circle cx={3.4} cy={0} r={1.2} fill="#163238" />
      <circle cx={3.4} cy={0} r={2.6} fill="none" stroke="#F4B400" strokeWidth={0.9} />
      <path d="M-3.5 4 Q-1.5 2.8 0.2 4 Q2 2.8 4 4" stroke="#163238" strokeWidth={1.3} fill="none" />
    </svg>
  );
}

/** Newt, with the scarf blowing the way gravity really goes. */
export function NewtFigure({ size = 48, turn = 0, className }: { size?: number; turn?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="-14 -14 28 28" className={className} aria-hidden>
      <g transform={`rotate(${turn})`}>
        <path d="M-2 -3 Q-6 2 -9 6 Q-10 9 -8 11" stroke="#C58B00" strokeWidth={4.4} fill="none" strokeLinecap="round" />
        <path d="M-2 -3 Q-6 2 -9 6 Q-10 9 -8 11" stroke="#FFB703" strokeWidth={3.2} fill="none" strokeLinecap="round" />
        <rect x={-4.5} y={4.5} width={3.4} height={2.6} fill="#163238" />
        <rect x={1.1} y={4.5} width={3.4} height={2.6} fill="#163238" />
        <rect x={-6.5} y={-7} width={13} height={12.5} rx={5.5} fill="#2A9D8F" stroke="#163238" strokeWidth={1.2} />
        <rect x={-2.5} y={-4.6} width={8.4} height={6.6} rx={3} fill="#F1FAEE" />
        <circle cx={2.6} cy={-1.4} r={1.5} fill="#163238" />
      </g>
    </svg>
  );
}

export function LockIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden>
      <rect x={3} y={7} width={10} height={7.5} rx={1.6} fill="currentColor" />
      <path d="M5 7V5.2a3 3 0 0 1 6 0V7" stroke="currentColor" strokeWidth={1.8} fill="none" />
    </svg>
  );
}

/** A little house, built the way its storey is (the map turns it). */
export function HouseIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden>
      <path d="M3 9 L10 3 L17 9 V17 H3 Z" fill="#fff" stroke="#163238" strokeWidth={1.6} strokeLinejoin="round" />
      <rect x={8} y={11.5} width={4} height={5.5} fill="#E63946" />
    </svg>
  );
}

export function PlanetIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden>
      <circle cx={10} cy={10} r={5.5} fill="#9D7BE8" stroke="#163238" strokeWidth={1.4} />
      <ellipse cx={10} cy={10} rx={9} ry={2.6} fill="none" stroke="#163238" strokeWidth={1.3} transform="rotate(-20 10 10)" />
    </svg>
  );
}

export function TreeIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden>
      <rect x={8.6} y={11} width={2.8} height={7} fill="#8D6A3F" />
      <circle cx={10} cy={8} r={6} fill="#52B788" stroke="#163238" strokeWidth={1.4} />
      <circle cx={12.5} cy={7} r={1.6} fill="#E63946" />
    </svg>
  );
}
