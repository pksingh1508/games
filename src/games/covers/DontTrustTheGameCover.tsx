import { COVER_VIEWBOX, type CoverProps } from "./types";

export function DontTrustTheGameCover({ className, uid = "dttg" }: CoverProps) {
  const sky = `${uid}-sky`;
  const clip = `${uid}-screen`;
  return (
    <svg
      viewBox={COVER_VIEWBOX}
      className={className}
      data-cover
      role="img"
      aria-label="A cute platformer on a monitor. HELPER, a smiling speech bubble, glances sideways while saying collect the coin. A glitch creeps in from the corner."
    >
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFD6EC" />
          <stop offset="100%" stopColor="#E7D8FF" />
        </linearGradient>
        <clipPath id={clip}>
          <rect x="52" y="42" width="376" height="226" rx="12" />
        </clipPath>
      </defs>

      <rect width="480" height="360" fill="#FFF5FA" />
      <circle cx="40" cy="40" r="60" fill="#FCE3F0" />

      {/* Monitor */}
      <path d="M204 288 h72 l22 42 h-116 z" fill="#2D1B4E" />
      <rect x="150" y="326" width="180" height="12" rx="6" fill="#2D1B4E" />
      <rect x="36" y="26" width="408" height="262" rx="24" fill="#2D1B4E" />

      <g clipPath={`url(#${clip})`}>
        <rect x="52" y="42" width="376" height="226" fill={`url(#${sky})`} />
        {/* Sun with a face */}
        <circle cx="112" cy="92" r="24" fill="#FFD23F" />
        <circle cx="104" cy="88" r="2.6" fill="#2D1B4E" />
        <circle cx="120" cy="88" r="2.6" fill="#2D1B4E" />
        <path d="M103 99 q9 7 18 0" stroke="#2D1B4E" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        {/* Clouds */}
        <g fill="#FFFFFF">
          <ellipse cx="190" cy="76" rx="26" ry="10" />
          <ellipse cx="206" cy="70" rx="16" ry="10" />
        </g>
        {/* Hills */}
        <path d="M52 224 q70 -70 150 -10 q60 -54 140 6 q40 -26 86 -6 V268 H52 z" fill="#B7EBD2" />
        <path d="M52 246 q90 -48 190 -6 q90 -40 186 0 V268 H52 z" fill="#6FD39E" />
        {/* Platform blocks */}
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <rect x={146 + i * 30} y="204" width="28" height="28" rx="4" fill="#C2306F" />
            <rect x={146 + i * 30} y="204" width="28" height="7" rx="3" fill="#E0558F" />
          </g>
        ))}
        {/* The hero */}
        <rect x="170" y="180" width="22" height="24" rx="6" fill="#2D1B4E" />
        <rect x="181" y="186" width="5" height="6" rx="1.5" fill="#FFFFFF" />
        {/* The "coin" (spiky: the tell) */}
        <g>
          <path d="M232 140 l3 -9 l3 9 M250 158 l9 3 l-9 3 M232 176 l3 9 l3 -9 M220 158 l-9 3 l9 3" fill="#D9A21B" />
          <circle cx="235" cy="161" r="12" fill="#FFC93C" stroke="#D9A21B" strokeWidth="3" />
        </g>

        {/* HELPER: when it lies, its eyes glance sideways */}
        <g>
          <circle cx="298" cy="104" r="27" fill="#FFFFFF" stroke="#2D1B4E" strokeWidth="3" />
          <ellipse cx="288" cy="99" rx="7" ry="8.5" fill="#F2EEF8" />
          <ellipse cx="308" cy="99" rx="7" ry="8.5" fill="#F2EEF8" />
          <g className="cover-anim cv-glance">
            <circle cx="288" cy="100" r="3.6" fill="#2D1B4E" />
            <circle cx="308" cy="100" r="3.6" fill="#2D1B4E" />
          </g>
          <path d="M287 113 q11 8 22 0" stroke="#2D1B4E" strokeWidth="3" fill="none" strokeLinecap="round" />
          <rect x="332" y="70" width="88" height="54" rx="14" fill="#FFFFFF" stroke="#2D1B4E" strokeWidth="3" />
          <path d="M333 96 l-9 8 l10 2" fill="#FFFFFF" stroke="#2D1B4E" strokeWidth="3" strokeLinejoin="round" />
          <text x="376" y="93" textAnchor="middle" fontSize="15" fontWeight="800" fill="#2D1B4E" fontFamily="var(--font-g-baloo)">
            Collect
          </text>
          <text x="376" y="112" textAnchor="middle" fontSize="15" fontWeight="800" fill="#2D1B4E" fontFamily="var(--font-g-baloo)">
            the coin!
          </text>
        </g>

        {/* The glitch creeping in, and TRUTH.exe */}
        <g className="cover-anim cv-jitter flash-risk">
          <rect x="330" y="222" width="98" height="8" fill="#00F0FF" opacity="0.85" />
          <rect x="350" y="234" width="78" height="6" fill="#FF3D7F" />
          <rect x="318" y="246" width="110" height="12" fill="#2D1B4E" />
          <rect x="382" y="190" width="40" height="40" fill="#0B0B0B" />
          <ellipse cx="402" cy="210" rx="11" ry="7" fill="#FFFFFF" />
          <circle cx="404" cy="210" r="4" fill="#0B0B0B" />
        </g>
      </g>
    </svg>
  );
}
