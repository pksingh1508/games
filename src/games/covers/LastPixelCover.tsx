import { COVER_VIEWBOX, type CoverProps } from "./types";

export function LastPixelCover({ className, uid = "lp" }: CoverProps) {
  const paint = `${uid}-paint`;
  const grid = `${uid}-grid`;
  return (
    <svg
      viewBox={COVER_VIEWBOX}
      className={className}
      data-cover
      role="img"
      aria-label="A canvas painted lavender and coral, finished except for one cream pixel with tiny eyes that's dodging the cursor. The progress reads 99.99%."
    >
      <defs>
        <linearGradient id={paint} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8E7DFF" />
          <stop offset="100%" stopColor="#FF9E7D" />
        </linearGradient>
        <pattern id={grid} width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0 V20 H0" fill="none" stroke="#FFFFFF" strokeOpacity="0.16" strokeWidth="1.5" />
        </pattern>
      </defs>

      <rect width="480" height="360" fill="#FDF6EC" />
      <circle cx="430" cy="40" r="70" fill="#F6E9DA" />

      {/* The canvas */}
      <rect x="58" y="52" width="300" height="232" rx="18" fill="#3B3355" opacity="0.12" />
      <rect x="52" y="44" width="300" height="232" rx="18" fill={`url(#${paint})`} />
      <rect x="52" y="44" width="300" height="232" rx="18" fill={`url(#${grid})`} />

      {/* Paint roller */}
      <g>
        <path d="M86 126 V160 h-22 V214" fill="none" stroke="#3B3355" strokeWidth="6" strokeLinejoin="round" />
        <rect x="58" y="96" width="92" height="32" rx="12" fill="#6F5BF2" stroke="#3B3355" strokeWidth="3" />
        <rect x="66" y="102" width="70" height="7" rx="3.5" fill="#FFFFFF" opacity="0.35" />
        <rect x="57" y="208" width="14" height="44" rx="6" fill="#3B3355" />
      </g>

      {/* Pix: the last pixel */}
      <g className="cover-anim cv-dodge">
        <rect x="286" y="210" width="22" height="22" fill="#FDF6EC" stroke="#3B3355" strokeWidth="1.5" />
        <rect x="291" y="217" width="4" height="5" fill="#3B3355" />
        <rect x="299" y="217" width="4" height="5" fill="#3B3355" />
        <text x="297" y="202" textAnchor="middle" fontSize="20" fontWeight="800" fill="#3B3355" fontFamily="var(--font-g-baloo)">
          !
        </text>
      </g>

      {/* The cursor closing in */}
      <path
        className="cover-anim cv-drift"
        d="M248 230 l0 34 l9 -9 l7 15 l7 -3 l-7 -15 l12 0 z"
        fill="#FFFFFF"
        stroke="#3B3355"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Progress */}
      <rect x="318" y="296" width="132" height="44" rx="22" fill="#3B3355" />
      <rect x="318" y="290" width="132" height="44" rx="22" fill="#FFFFFF" stroke="#3B3355" strokeWidth="3" />
      <text x="384" y="321" textAnchor="middle" fontSize="23" fontWeight="800" fill="#3B3355" fontFamily="var(--font-g-baloo)">
        99.99%
      </text>

      <g fill="#6F5BF2">
        <path d="M404 120 l3 9 l9 3 l-9 3 l-3 9 l-3 -9 l-9 -3 l9 -3 z" />
        <path d="M430 196 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 l6 -2 z" opacity="0.6" />
      </g>
    </svg>
  );
}
