import { COVER_VIEWBOX, type CoverProps } from "./types";

function Pill({
  x,
  y,
  angle,
  text,
  danger,
  delay,
  uid,
}: {
  x: number;
  y: number;
  angle: number;
  text: string;
  danger?: boolean;
  delay: string;
  uid: string;
}) {
  const width = text.length * 19 + 34;
  return (
    <g transform={`rotate(${angle} ${x + width / 2} ${y + 22})`}>
      <g className="cover-anim cv-wobble" style={{ animationDelay: delay }}>
        <rect x={x} y={y + 5} width={width} height="44" rx="22" fill="#1B1B1B" />
        <rect x={x} y={y} width={width} height="44" rx="22" fill={danger ? "#D62839" : "#FFFFFF"} stroke="#1B1B1B" strokeWidth="3" />
        {danger && <rect x={x} y={y} width={width} height="44" rx="22" fill={`url(#${uid}-stripes)`} />}
        <text
          x={x + width / 2}
          y={y + 31}
          textAnchor="middle"
          fontSize="24"
          fill={danger ? "#FFFFFF" : "#1B1B1B"}
          fontFamily="var(--font-g-bungee)"
        >
          {text}
        </text>
      </g>
    </g>
  );
}

export function OneTapChaosCover({ className, uid = "otc" }: CoverProps) {
  const rays = Array.from({ length: 16 }, (_, i) => {
    const a1 = (i / 16) * Math.PI * 2;
    const a2 = a1 + Math.PI / 16;
    const p = (a: number) => `${(240 + Math.cos(a) * 420).toFixed(1)} ${(196 + Math.sin(a) * 420).toFixed(1)}`;
    return `M240 196 L${p(a1)} L${p(a2)} z`;
  });

  return (
    <svg
      viewBox={COVER_VIEWBOX}
      className={className}
      data-cover
      role="img"
      aria-label="A giant blue TAP button on a yellow burst, surrounded by instructions: JUMP, WAIT, STOP, and a red DON'T."
    >
      <defs>
        <pattern id={`${uid}-stripes`} width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="5" height="12" fill="#FFFFFF" opacity="0.22" />
        </pattern>
      </defs>
      <rect width="480" height="360" fill="#FFD23F" />
      <g fill="#FFE27A" opacity="0.8">
        {rays.map((d, i) => (i % 2 === 0 ? <path key={i} d={d} /> : null))}
      </g>

      {/* The one button */}
      <ellipse cx="240" cy="234" rx="106" ry="40" fill="#1C3A7F" />
      <rect x="134" y="194" width="212" height="40" fill="#1C3A7F" />
      <g className="cover-anim cv-press">
        <ellipse cx="240" cy="194" rx="106" ry="40" fill="#2B59C3" stroke="#1B1B1B" strokeWidth="3" />
        <ellipse cx="212" cy="182" rx="48" ry="12" fill="#FFFFFF" opacity="0.3" />
        <text x="240" y="208" textAnchor="middle" fontSize="38" fill="#FFFFFF" fontFamily="var(--font-g-bungee)">
          TAP
        </text>
      </g>

      <Pill x={34} y={46} angle={-10} text="JUMP!" delay="0s" uid={uid} />
      <Pill x={300} y={40} angle={8} text="WAIT…" delay="0.3s" uid={uid} />
      <Pill x={26} y={270} angle={-6} text="DON'T!" danger delay="0.6s" uid={uid} />
      <Pill x={330} y={276} angle={9} text="STOP!" delay="0.9s" uid={uid} />

      {/* Simon's crown */}
      <path d="M58 40 l8 -18 l10 12 l10 -14 l10 14 l10 -12 l6 18 z" fill="#FFB020" stroke="#1B1B1B" strokeWidth="3" strokeLinejoin="round" />

      {/* Beat dots */}
      <g>
        {Array.from({ length: 8 }, (_, i) => (
          <circle
            key={i}
            cx={170 + i * 20}
            cy="336"
            r="6"
            fill={i < 5 ? "#1B1B1B" : "none"}
            stroke="#1B1B1B"
            strokeWidth="2.5"
          />
        ))}
      </g>
    </svg>
  );
}
