import { COVER_VIEWBOX, type CoverProps } from "./types";

const STARS = [
  [40, 30], [90, 64], [150, 22], [330, 40], [380, 84], [300, 18], [60, 120], [410, 140], [20, 190], [350, 126],
];

export function AlmostThereCover({ className, uid = "at" }: CoverProps) {
  const sky = `${uid}-sky`;
  return (
    <svg
      viewBox={COVER_VIEWBOX}
      className={className}
      data-cover
      role="img"
      aria-label="A tiny climber on a tall mountain at dusk. A flag marks a fake summit below the clouds, the real peak rises above, and a sparrow says almost there. A progress bar reads 99.9%."
    >
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1E2A44" />
          <stop offset="55%" stopColor="#3B3A66" />
          <stop offset="100%" stopColor="#F2B880" />
        </linearGradient>
      </defs>

      <rect width="480" height="360" fill={`url(#${sky})`} />
      <g fill="#F7F4EF">
        {STARS.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 2.2 : 1.4} opacity="0.8" />
        ))}
      </g>

      {/* Far range */}
      <path d="M0 360 L0 250 L70 196 L130 240 L190 186 L250 236 L330 180 L410 230 L480 200 L480 360 z" fill="#2C3A5C" />

      {/* The mountain */}
      <path d="M96 360 L230 30 L246 26 L388 360 z" fill="#24304D" />
      <path d="M230 30 L246 26 L276 100 L256 92 L240 108 L222 90 L206 100 z" fill="#F7F4EF" />
      {/* Ledges */}
      <g fill="#F7F4EF" opacity="0.9">
        <rect x="200" y="300" width="34" height="5" rx="2.5" />
        <rect x="248" y="268" width="30" height="5" rx="2.5" />
        <rect x="206" y="236" width="28" height="5" rx="2.5" />
        <rect x="252" y="204" width="26" height="5" rx="2.5" />
        <rect x="214" y="190" width="26" height="5" rx="2.5" />
      </g>

      {/* The fake summit, below the clouds */}
      <g>
        <line x1="226" y1="190" x2="226" y2="160" stroke="#F7F4EF" strokeWidth="3" />
        <path className="cover-anim cv-wave" d="M227 160 L252 167 L227 175 z" fill="#F2B880" />
      </g>

      {/* Cloud band hiding the rest of the climb */}
      <g fill="#F7F4EF" opacity="0.9">
        <ellipse cx="150" cy="148" rx="80" ry="16" />
        <ellipse cx="250" cy="140" rx="70" ry="18" />
        <ellipse cx="340" cy="150" rx="74" ry="14" />
        <ellipse cx="200" cy="132" rx="40" ry="12" />
      </g>

      {/* Pip, the climber */}
      <g>
        <rect x="203" y="280" width="12" height="17" rx="4" fill="#F7F4EF" />
        <rect x="196" y="282" width="10" height="13" rx="3" fill="#F2B880" />
        <circle cx="209" cy="275" r="6" fill="#F7F4EF" />
        <rect x="204" y="296" width="4" height="5" fill="#F7F4EF" />
        <rect x="210" y="296" width="4" height="5" fill="#F7F4EF" />
      </g>

      {/* Chirp: "Almost there!" */}
      <g className="cover-anim cv-bob">
        <rect x="296" y="196" width="122" height="30" rx="10" fill="#F7F4EF" />
        <path d="M312 225 l-6 12 l14 -12 z" fill="#F7F4EF" />
        <text x="357" y="216" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1E2A44" fontFamily="var(--font-g-silkscreen)">
          ALMOST THERE!
        </text>
        <ellipse cx="300" cy="248" rx="15" ry="11" fill="#9AD1F5" />
        <path d="M292 244 q8 -10 18 -2 q-8 2 -18 2" fill="#6FB3DC" />
        <circle cx="309" cy="244" r="2.2" fill="#1E2A44" />
        <path d="M314 247 l8 2 l-8 3 z" fill="#F2B880" />
      </g>

      {/* The lying progress bar */}
      <g>
        <text x="448" y="28" textAnchor="middle" fontSize="12" fontWeight="700" fill="#F7F4EF" fontFamily="var(--font-g-silkscreen)">
          99.9%
        </text>
        <rect x="441" y="38" width="14" height="290" rx="7" fill="#F7F4EF" opacity="0.18" />
        <rect className="cover-anim cv-shimmer" x="441" y="40" width="14" height="288" rx="7" fill="#F2B880" />
      </g>
    </svg>
  );
}
