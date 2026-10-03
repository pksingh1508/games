import { COVER_VIEWBOX, type CoverProps } from "./types";

function Runner({ stroke, fill }: { stroke: string; fill: string }) {
  return (
    <g stroke={stroke} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <circle cx="186" cy="152" r="13" fill={fill} stroke="none" />
      <path d="M182 170 L170 214" />
      <path d="M180 178 L204 192 L216 178" />
      <path d="M178 180 L158 196" />
      <path d="M170 214 L192 236 L184 262" />
      <path d="M170 214 L150 238 L128 236" />
    </g>
  );
}

export function GlitchRunCover({ className, uid = "gr" }: CoverProps) {
  const scan = `${uid}-scan`;
  return (
    <svg
      viewBox={COVER_VIEWBOX}
      className={className}
      data-cover
      role="img"
      aria-label="A neon stick-figure runner split into cyan and pink copies, racing toward a magenta-and-black missing-texture block on a torn floor."
    >
      <defs>
        <pattern id={scan} width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="1" fill="#000000" opacity="0.45" />
        </pattern>
      </defs>
      <rect width="480" height="360" fill="#07070D" />

      {/* Grid */}
      <g stroke="#15152B" strokeWidth="2">
        {Array.from({ length: 14 }, (_, i) => (
          <line key={`v${i}`} x1={i * 36} y1="0" x2={i * 36} y2="360" />
        ))}
        {Array.from({ length: 10 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 36} x2="480" y2={i * 36} />
        ))}
      </g>

      {/* Torn floor: the visible ground and its offset copy */}
      <rect y="272" width="230" height="5" fill="#00F5D4" />
      <rect x="230" y="286" width="250" height="5" fill="#00F5D4" />
      <g className="cover-anim cv-tear flash-risk">
        <rect x="20" y="300" width="440" height="3" fill="#FF2E88" opacity="0.7" />
        <rect x="0" y="122" width="480" height="10" fill="#FF2E88" opacity="0.18" />
      </g>

      {/* Bits */}
      <g className="cover-anim cv-shimmer" fill="#00F5D4" fontFamily="var(--font-geist-mono)" fontSize="15" opacity="0.6">
        <text x="40" y="86">1 0 1 1</text>
        <text x="300" y="70">0 1</text>
        <text x="350" y="160">1 1 0</text>
        <text x="64" y="200">0</text>
      </g>

      {/* RGB-split runner */}
      <g className="cover-anim cv-jitter flash-risk" opacity="0.8">
        <g transform="translate(-7 0)">
          <Runner stroke="#00F5D4" fill="#00F5D4" />
        </g>
        <g transform="translate(7 2)">
          <Runner stroke="#FF2E88" fill="#FF2E88" />
        </g>
      </g>
      <Runner stroke="#E6F1FF" fill="#E6F1FF" />
      {/* The shadow: always at the true position */}
      <ellipse cx="172" cy="270" rx="34" ry="5" fill="#E6F1FF" opacity="0.35" />

      {/* Missing texture block */}
      <g>
        {Array.from({ length: 4 }, (_, r) =>
          Array.from({ length: 4 }, (_, c) => (
            <rect
              key={`${r}${c}`}
              x={318 + c * 16}
              y={208 + r * 16}
              width="16"
              height="16"
              fill={(r + c) % 2 ? "#000000" : "#FF00FF"}
            />
          )),
        )}
        <rect x="318" y="208" width="64" height="64" fill="none" stroke="#E6F1FF" strokeWidth="2" />
      </g>

      {/* HUD */}
      <text x="24" y="34" fontFamily="var(--font-geist-mono)" fontSize="14" fontWeight="700" fill="#FF2E88">
        CORRUPTION 87%
      </text>
      <text x="456" y="34" textAnchor="end" fontFamily="var(--font-geist-mono)" fontSize="18" fontWeight="700" fill="#00F5D4">
        ×4.2
      </text>

      <rect width="480" height="360" fill={`url(#${scan})`} opacity="0.5" />
    </svg>
  );
}
