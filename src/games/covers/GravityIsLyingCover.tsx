import { COVER_VIEWBOX, type CoverProps } from "./types";

export function GravityIsLyingCover({ className }: CoverProps) {
  return (
    <svg
      viewBox={COVER_VIEWBOX}
      className={className}
      data-cover
      role="img"
      aria-label="A room where the floor is the left wall. Newt stands on it sideways while the scarf, a hanging lamp and dripping water all fall to the left. The on-screen arrow points down, and Isaac the apple insists down is down."
    >
      <rect width="480" height="360" fill="#F2FBFA" />

      {/* The room; the real floor is the left wall */}
      <rect x="40" y="28" width="400" height="304" rx="22" fill="#DCEFEC" />
      <rect x="40" y="28" width="40" height="304" rx="14" fill="#163238" />
      <g stroke="#2C5058" strokeWidth="2">
        {[80, 130, 180, 230, 280].map((y) => (
          <line key={y} x1="46" y1={y} x2="76" y2={y} />
        ))}
      </g>

      {/* Hanging lamp: hangs toward true down (left) */}
      <line x1="440" y1="104" x2="370" y2="104" stroke="#163238" strokeWidth="3" strokeDasharray="6 4" />
      <path d="M370 88 v32 l-26 -6 v-20 z" fill="#0F7366" />
      <circle cx="338" cy="104" r="14" fill="#FFB703" opacity="0.45" />

      {/* Dripping water, falling left */}
      <rect x="420" y="232" width="20" height="30" rx="4" fill="#9BB7BC" />
      {[0, 0.5, 1].map((delay) => (
        <circle key={delay} className="cover-anim cv-drip" cx="414" cy="247" r="5" fill="#5BC0EB" style={{ animationDelay: `${delay}s` }} />
      ))}

      {/* Newt, standing on the "wall" */}
      <g>
        <rect x="80" y="176" width="12" height="9" rx="3" fill="#163238" />
        <rect x="80" y="196" width="12" height="9" rx="3" fill="#163238" />
        <rect x="88" y="174" width="50" height="33" rx="16" fill="#0F7366" />
        <circle cx="152" cy="190" r="18" fill="#FFFFFF" stroke="#163238" strokeWidth="3" />
        <ellipse cx="157" cy="190" rx="9" ry="11" fill="#163238" opacity="0.88" />
        <circle cx="160" cy="185" r="2.6" fill="#FFFFFF" />
        {/* The scarf: the honest truth anchor */}
        <g className="cover-anim cv-scarf">
          <path d="M138 182 C122 176 108 168 98 150 C94 142 92 132 94 122" stroke="#FFB703" strokeWidth="11" strokeLinecap="round" fill="none" />
        </g>
      </g>

      {/* The lying HUD arrow */}
      <g>
        <rect x="364" y="40" width="62" height="70" rx="12" fill="#FFFFFF" stroke="#163238" strokeWidth="2.5" />
        <path d="M395 54 v32 m-12 -12 l12 14 l12 -14" stroke="#163238" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <text x="416" y="106" textAnchor="middle" fontSize="18" fontWeight="800" fill="#E63946" fontFamily="var(--font-g-lexend)">
          ?
        </text>
      </g>

      {/* Isaac the apple, with a droopy (lying) leaf */}
      <g className="cover-anim cv-bob">
        <rect x="226" y="176" width="140" height="38" rx="14" fill="#FFFFFF" stroke="#163238" strokeWidth="2.5" />
        <path d="M290 213 l-6 14 l16 -14 z" fill="#FFFFFF" stroke="#163238" strokeWidth="2.5" strokeLinejoin="round" />
        <text x="296" y="200" textAnchor="middle" fontSize="15" fontWeight="800" fill="#163238" fontFamily="var(--font-g-lexend)">
          Down is down!
        </text>
        <circle cx="282" cy="262" r="28" fill="#E63946" />
        <ellipse cx="272" cy="252" rx="7" ry="10" fill="#FFFFFF" opacity="0.3" />
        <path d="M282 236 v-10" stroke="#5A3A28" strokeWidth="4" strokeLinecap="round" />
        <path d="M284 230 q14 4 12 22 q-12 -6 -12 -22 z" fill="#2E9E77" />
        <circle cx="274" cy="262" r="3" fill="#163238" />
        <circle cx="290" cy="262" r="3" fill="#163238" />
        <path d="M274 274 q8 4 16 -2" stroke="#163238" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>

      {/* Dust drifting toward true down */}
      <g fill="#163238" opacity="0.35">
        <circle cx="200" cy="90" r="2.5" />
        <circle cx="230" cy="110" r="2" />
        <circle cx="190" cy="300" r="2.5" />
        <circle cx="330" cy="300" r="2" />
      </g>
    </svg>
  );
}
