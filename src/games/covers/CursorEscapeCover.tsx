import { COVER_VIEWBOX, type CoverProps } from "./types";

const ARROW = "l0 30 l8 -8 l6 14 l6 -3 l-6 -13 l11 0 z";

export function CursorEscapeCover({ className, uid = "ce" }: CoverProps) {
  const title = `${uid}-title`;
  const dither = `${uid}-dither`;
  return (
    <svg
      viewBox={COVER_VIEWBOX}
      className={className}
      data-cover
      role="img"
      aria-label="A retro operating system window called Escape.exe with a maze inside. A mouse cursor tries to reach the glowing close button while decoy cursors and a pop-up ad get in the way."
    >
      <defs>
        <linearGradient id={title} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0A2A8A" />
          <stop offset="100%" stopColor="#1B5FBF" />
        </linearGradient>
        <pattern id={dither} width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="2" height="2" fill="#0C7272" />
        </pattern>
      </defs>
      <rect width="480" height="360" fill="#0F7F7F" />
      <rect width="480" height="360" fill={`url(#${dither})`} />

      {/* Desktop icons */}
      <g fontFamily="var(--font-g-vt323)" fontSize="16" fill="#FFFFFF" textAnchor="middle">
        <rect x="30" y="40" width="26" height="32" rx="3" fill="#E6E6E6" stroke="#111111" strokeWidth="2" />
        <rect x="26" y="34" width="34" height="7" rx="2" fill="#C3C3C3" stroke="#111111" strokeWidth="2" />
        <text x="43" y="92">Bin</text>
        <path d="M26 128 h14 l5 6 h18 v26 h-37 z" fill="#FFE14D" stroke="#111111" strokeWidth="2" />
        <text x="44" y="178">Exit?</text>
      </g>

      {/* The window */}
      <rect x="86" y="34" width="348" height="276" fill="#C3C3C3" />
      <path d="M86 310 V34 H434" stroke="#FFFFFF" strokeWidth="3" fill="none" />
      <path d="M86 310 H434 V34" stroke="#3E3E3E" strokeWidth="3" fill="none" />
      <rect x="92" y="40" width="336" height="26" fill={`url(#${title})`} />
      <text x="102" y="59" fontFamily="var(--font-g-vt323)" fontSize="21" fill="#FFFFFF">
        Escape.exe
      </text>
      {[352, 376].map((x) => (
        <rect key={x} x={x} y="44" width="20" height="18" fill="#C3C3C3" stroke="#3E3E3E" strokeWidth="1.5" />
      ))}
      <path d="M357 56 h10 M381 48 h10 v10 h-10 z" stroke="#111111" strokeWidth="2" fill="none" />
      {/* The goal: the close button */}
      <circle className="cover-anim cv-glow" cx="410" cy="53" r="17" fill="none" stroke="#FFE14D" strokeWidth="4" />
      <rect x="400" y="44" width="20" height="18" fill="#C3C3C3" stroke="#3E3E3E" strokeWidth="1.5" />
      <path d="M405 48 l10 10 M415 48 l-10 10" stroke="#111111" strokeWidth="2.5" />

      {/* Maze */}
      <rect x="96" y="74" width="328" height="228" fill="#FFFFFF" />
      <g stroke="#111111" strokeWidth="9" strokeLinecap="square" fill="none">
        <path d="M160 74 V220 H300" />
        <path d="M230 140 V302" />
        <path d="M300 140 H424" />
        <path d="M300 140 V250" />
        <path d="M360 200 H424" />
        <path d="M360 200 V302" />
      </g>

      {/* Decoys and the real cursor */}
      <g opacity="0.4">
        <path className="cover-anim cv-cursor-mirror" d={`M264 104 ${ARROW}`} fill="#FFFFFF" stroke="#111111" strokeWidth="2" strokeLinejoin="round" />
        <path className="cover-anim cv-cursor" d={`M332 168 ${ARROW}`} fill="#FFFFFF" stroke="#111111" strokeWidth="2" strokeLinejoin="round" />
      </g>
      <path className="cover-anim cv-cursor" d={`M116 92 ${ARROW}`} fill="#FFFFFF" stroke="#111111" strokeWidth="2.5" strokeLinejoin="round" />

      {/* Pop-up ad */}
      <g>
        <rect x="292" y="236" width="156" height="72" fill="#111111" />
        <rect x="288" y="232" width="156" height="72" fill="#FFE14D" stroke="#111111" strokeWidth="2.5" />
        <rect x="288" y="232" width="156" height="16" fill="#D62839" />
        <text x="366" y="284" textAnchor="middle" fontFamily="var(--font-g-vt323)" fontSize="26" fill="#111111">
          YOU WON!!!
        </text>
      </g>
    </svg>
  );
}
