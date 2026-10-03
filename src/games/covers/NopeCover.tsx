import { COVER_VIEWBOX, type CoverProps } from "./types";

const BUTTONS = [
  { x: 104, fill: "#2B59C3", base: "#1C3A7F", label: "A", ink: "#FFFFFF" },
  { x: 174, fill: "#7ED957", base: "#4E9A2F", label: "B", ink: "#161414" },
  { x: 244, fill: "#FFC93C", base: "#C99316", label: "C", ink: "#161414" },
  { x: 314, fill: "#D41F22", base: "#8A1416", label: "D", ink: "#FFFFFF" },
];

export function NopeCover({ className }: CoverProps) {
  return (
    <svg
      viewBox={COVER_VIEWBOX}
      className={className}
      data-cover
      role="img"
      aria-label="A quiz card on a game-show stage, with a giant red NOPE stamp across it."
    >
      <rect width="480" height="360" fill="#161414" />

      {/* The famous green sky */}
      <path d="M60 230 V96 a64 64 0 0 1 64 -64 h232 a64 64 0 0 1 64 64 V230 z" fill="#7ED957" />
      <g fill="#FFFFFF">
        <ellipse cx="150" cy="78" rx="34" ry="13" />
        <ellipse cx="174" cy="70" rx="22" ry="12" />
        <ellipse cx="322" cy="96" rx="28" ry="11" />
      </g>

      {/* Curtains */}
      <path d="M0 0 h76 c-10 90 -6 200 10 360 H0 z" fill="#5A1A1C" />
      <path d="M480 0 h-76 c10 90 6 200 -10 360 H480 z" fill="#5A1A1C" />
      <path d="M26 0 c-4 120 0 240 8 360 M50 0 c-6 120 -2 240 14 360 M454 0 c4 120 0 240 -8 360 M430 0 c6 120 2 240 -14 360" stroke="#3A1012" strokeWidth="5" fill="none" />
      <rect y="306" width="480" height="54" fill="#2A1515" />

      {/* Spotlights */}
      <g fill="#FFC93C" opacity="0.16">
        <path d="M70 0 L120 0 L250 310 L120 310 z" />
        <path d="M410 0 L360 0 L230 310 L360 310 z" />
      </g>

      {/* Quiz card */}
      <rect x="78" y="122" width="332" height="196" rx="22" fill="#000000" opacity="0.35" />
      <rect x="74" y="112" width="332" height="196" rx="22" fill="#FFF4D6" />

      {/* The question banner: secretly the biggest button */}
      <rect x="96" y="136" width="288" height="62" rx="16" fill="#D8CDB0" />
      <rect x="96" y="130" width="288" height="62" rx="16" fill="#FFFFFF" stroke="#161414" strokeWidth="2.5" />
      <text x="240" y="170" textAnchor="middle" fontSize="23" fill="#161414" fontFamily="var(--font-g-bangers)" letterSpacing="1">
        CLICK THE BIGGEST BUTTON
      </text>

      {BUTTONS.map((b) => (
        <g key={b.label}>
          <rect x={b.x} y="224" width="62" height="42" rx="11" fill={b.base} />
          <rect x={b.x} y="218" width="62" height="42" rx="11" fill={b.fill} />
          <text x={b.x + 31} y="248" textAnchor="middle" fontSize="22" fill={b.ink} fontFamily="var(--font-g-bangers)">
            {b.label}
          </text>
        </g>
      ))}

      {/* The stamp */}
      <g className="cover-anim cv-stamp" style={{ transformOrigin: "center" }} transform="rotate(-12 240 236)">
        <rect x="140" y="194" width="200" height="84" rx="12" fill="none" stroke="#D41F22" strokeWidth="7" strokeDasharray="30 4 12 3" opacity="0.92" />
        <text x="240" y="260" textAnchor="middle" fontSize="70" fill="#D41F22" fontFamily="var(--font-g-bangers)" letterSpacing="3" opacity="0.92">
          NOPE!
        </text>
      </g>

      {/* Mr. Nope */}
      <g className="cover-anim cv-bob">
        <circle cx="404" cy="46" r="14" fill="#D41F22" />
        <rect x="397" y="56" width="14" height="16" fill="#8A1416" />
        <rect x="366" y="70" width="76" height="44" rx="12" fill="#D41F22" />
        <path d="M380 84 l14 5 M428 84 l-14 5" stroke="#FFF4D6" strokeWidth="4" strokeLinecap="round" />
        <circle cx="389" cy="94" r="3.5" fill="#FFF4D6" />
        <circle cx="419" cy="94" r="3.5" fill="#FFF4D6" />
        <path d="M393 104 q11 6 22 -2" stroke="#FFF4D6" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}
