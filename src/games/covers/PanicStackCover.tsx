import { COVER_VIEWBOX, type CoverProps } from "./types";

export function PanicStackCover({ className, uid = "ps" }: CoverProps) {
  const panic = `${uid}-panic`;
  return (
    <svg
      viewBox={COVER_VIEWBOX}
      className={className}
      data-cover
      role="img"
      aria-label="A swaying tower of a box, a floating safe on a balloon, a cake and a heavy feather, reaching for a dashed goal line while the panic meter climbs and a cat paw sneaks in."
    >
      <defs>
        <linearGradient id={panic} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FF9F43" />
          <stop offset="100%" stopColor="#E63946" />
        </linearGradient>
      </defs>
      <rect width="480" height="360" fill="#FFF1E0" />
      <circle cx="60" cy="300" r="110" fill="#FFE6CC" />

      {/* Panic meter */}
      <text x="30" y="40" fontSize="15" fontWeight="900" fill="#2E2A4F" fontFamily="var(--font-g-rubik)">
        PANIC
      </text>
      <rect x="92" y="27" width="170" height="16" rx="8" fill="#2E2A4F" opacity="0.12" />
      <rect className="cover-anim cv-shimmer" x="92" y="27" width="138" height="16" rx="8" fill={`url(#${panic})`} />

      {/* Goal line */}
      <line x1="56" y1="98" x2="420" y2="98" stroke="#B8460C" strokeWidth="3" strokeDasharray="12 8" />
      <line x1="424" y1="98" x2="424" y2="58" stroke="#2E2A4F" strokeWidth="3" />
      <path d="M425 58 l26 8 l-26 8 z" fill="#B8460C" />

      {/* Platform */}
      <rect x="128" y="300" width="224" height="16" rx="6" fill="#2E2A4F" />
      <rect x="226" y="316" width="28" height="44" fill="#2E2A4F" />

      {/* The tower */}
      <g className="cover-anim cv-sway">
        {/* Box */}
        <rect x="170" y="244" width="140" height="56" rx="5" fill="#C9955C" stroke="#2E2A4F" strokeWidth="3" />
        <rect x="231" y="244" width="18" height="56" fill="#E6C79A" />
        {/* Duck */}
        <ellipse cx="196" cy="230" rx="24" ry="14" fill="#FFD23F" stroke="#2E2A4F" strokeWidth="2.5" />
        <circle cx="210" cy="210" r="12" fill="#FFD23F" stroke="#2E2A4F" strokeWidth="2.5" />
        <path d="M220 210 l12 3 l-12 4 z" fill="#FF8A3D" />
        <circle cx="213" cy="206" r="2.2" fill="#2E2A4F" />
        {/* The floating safe */}
        <g transform="rotate(5 272 214)">
          <rect x="244" y="190" width="58" height="52" rx="7" fill="#6C7A89" stroke="#2E2A4F" strokeWidth="3" />
          <circle cx="273" cy="216" r="12" fill="#55606D" stroke="#2E2A4F" strokeWidth="2.5" />
          <path d="M273 206 v10 l7 5" stroke="#E6E6E6" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </g>
        {/* Cake */}
        <rect x="236" y="152" width="74" height="38" rx="9" fill="#FF9EBB" stroke="#2E2A4F" strokeWidth="3" />
        <path d="M236 164 q9 10 18 0 q9 10 18 0 q9 10 18 0 q9 10 20 0" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
        <circle cx="273" cy="146" r="7" fill="#E63946" />
        {/* The lead feather */}
        <path d="M224 134 q48 -46 104 -14 q-50 10 -104 14 z" fill="#FFFFFF" stroke="#2E2A4F" strokeWidth="3" strokeLinejoin="round" />
        <path d="M232 132 q40 -12 86 -14" stroke="#2E2A4F" strokeWidth="2" fill="none" />
        <text x="330" y="128" fontSize="15" fontWeight="900" fill="#2E2A4F" fontFamily="var(--font-g-rubik)">
          THUD
        </text>
      </g>

      {/* Balloon lifting the safe */}
      <g className="cover-anim cv-bob">
        <path d="M290 194 q20 -40 46 -62" stroke="#2E2A4F" strokeWidth="2" fill="none" />
        <ellipse cx="350" cy="116" rx="24" ry="28" fill="#E63946" stroke="#2E2A4F" strokeWidth="3" />
        <ellipse cx="342" cy="106" rx="6" ry="9" fill="#FFFFFF" opacity="0.4" />
      </g>

      {/* A cat paw sneaking in */}
      <g>
        <rect x="420" y="218" width="70" height="34" rx="17" fill="#2E2A4F" />
        <circle cx="424" cy="235" r="20" fill="#2E2A4F" />
        <g fill="#FF9EBB">
          <ellipse cx="418" cy="238" rx="7" ry="6" />
          <circle cx="410" cy="226" r="3.5" />
          <circle cx="419" cy="222" r="3.5" />
          <circle cx="428" cy="225" r="3.5" />
        </g>
      </g>

      {/* Wobble lines */}
      <g stroke="#B8460C" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M150 170 q-10 10 0 20" />
        <path d="M138 160 q-14 18 0 34" />
      </g>
    </svg>
  );
}
