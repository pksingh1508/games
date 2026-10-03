import { COVER_VIEWBOX, type CoverProps } from "./types";

export function DontBlinkCover({ className, uid = "db" }: CoverProps) {
  const scan = `${uid}-scan`;
  return (
    <svg
      viewBox={COVER_VIEWBOX}
      className={className}
      data-cover
      role="img"
      aria-label="A security camera view of a museum hall with a pale statue covering its face. Eyelids close and open; while they're closed, the statue moves."
    >
      <defs>
        <pattern id={scan} width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="1.2" fill="#000000" opacity="0.5" />
        </pattern>
      </defs>

      {/* The gallery */}
      <rect width="480" height="360" fill="#24302C" />
      <rect y="250" width="480" height="110" fill="#18201D" />
      <g stroke="#24302C" strokeWidth="2">
        {[-260, -140, -40, 60, 160, 280].map((x) => (
          <line key={x} x1={240} y1="250" x2={240 + x * 1.6} y2="360" />
        ))}
      </g>

      {/* Painting */}
      <rect x="62" y="68" width="100" height="122" fill="#8C7A4E" />
      <rect x="72" y="78" width="80" height="102" fill="#3A4A44" />
      <ellipse cx="112" cy="118" rx="18" ry="22" fill="#CFE8DC" opacity="0.85" />
      <path d="M84 180 q28 -40 56 0 z" fill="#CFE8DC" opacity="0.6" />
      <circle cx="108" cy="116" r="2" fill="#24302C" />
      <circle cx="119" cy="116" r="2" fill="#24302C" />

      {/* Doorway */}
      <rect x="362" y="86" width="76" height="164" fill="#0B0F0E" />

      {/* The statue: it only moves while the eyes are closed */}
      <g className="cover-anim cv-creep">
        <rect x="216" y="226" width="68" height="32" rx="3" fill="#2F3B37" />
        <path d="M222 228 L236 140 Q250 112 264 140 L278 228 z" fill="#CFE8DC" />
        <path d="M236 150 Q250 120 264 150 L262 176 Q250 166 238 176 z" fill="#A9C2B6" />
        <circle cx="250" cy="132" r="16" fill="#CFE8DC" />
        <path d="M234 128 Q250 104 266 128 L266 140 Q250 126 234 140 z" fill="#A9C2B6" />
        <path d="M238 138 Q250 128 262 138 L262 152 Q250 158 238 152 z" fill="#E8F5EE" />
      </g>

      {/* CCTV overlay */}
      <g stroke="#7CFFB2" strokeWidth="3" fill="none" strokeLinecap="square">
        <path d="M20 46 V20 H46" />
        <path d="M434 20 H460 V46" />
        <path d="M20 314 V340 H46" />
        <path d="M434 340 H460 V314" />
      </g>
      <g fontFamily="var(--font-geist-mono)" fontWeight="700" fontSize="14" fill="#7CFFB2">
        <text x="34" y="62">CAM 03 · SCULPTURE HALL</text>
        <text x="446" y="330" textAnchor="end">02:47:13</text>
        <text x="446" y="62" textAnchor="end">REC</text>
      </g>
      <circle className="cover-anim cv-glow" cx="400" cy="57" r="6" fill="#FF5A4E" />
      <rect width="480" height="360" fill={`url(#${scan})`} opacity="0.45" />

      {/* Eyelids */}
      <path className="cover-anim cv-blink-top flash-risk" d="M0 0 H480 V150 Q240 230 0 150 z" fill="#000000" style={{ transform: "scaleY(0.12)" }} />
      <path className="cover-anim cv-blink-bottom flash-risk" d="M0 360 H480 V210 Q240 130 0 210 z" fill="#000000" style={{ transform: "scaleY(0.12)" }} />
    </svg>
  );
}
