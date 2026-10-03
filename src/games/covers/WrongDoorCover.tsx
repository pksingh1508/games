import { COVER_VIEWBOX, type CoverProps } from "./types";

const DOORS = [
  { x: 62, body: "#8A5A3C", frame: "#5A3A28", sign: "THIS ONE", round: false },
  { x: 190, body: "#7A2E4A", frame: "#C9A227", sign: "NOT THIS", round: false },
  { x: 318, body: "#3F6F6A", frame: "#5A3A28", sign: "BOTH LIE", round: true },
];

export function WrongDoorCover({ className }: CoverProps) {
  return (
    <svg
      viewBox={COVER_VIEWBOX}
      className={className}
      data-cover
      role="img"
      aria-label="A grand hotel hallway with three ornate doors and signs that contradict each other. A brass plaque says one sign tells the truth, a candle flame leans toward one door, and a doorman in a red hat watches."
    >
      <rect width="480" height="360" fill="#2A1E2F" />
      {/* Art-deco wallpaper */}
      <g stroke="#3A2A40" strokeWidth="2" fill="none">
        {Array.from({ length: 13 }, (_, i) => (
          <g key={i}>
            <line x1={i * 40} y1="0" x2={i * 40} y2="270" />
            <path d={`M${i * 40 + 20} 20 l10 14 l-10 14 l-10 -14 z`} />
          </g>
        ))}
      </g>

      {/* Floor */}
      <rect y="270" width="480" height="90" fill="#3B2C42" />
      <g stroke="#2A1E2F" strokeWidth="2">
        {[-200, -100, 0, 100, 200, 300, 400].map((x) => (
          <line key={x} x1={240} y1="270" x2={240 + x * 1.6} y2="360" />
        ))}
      </g>

      {/* Doors */}
      {DOORS.map((d) => (
        <g key={d.x}>
          {d.round ? (
            <>
              <path d={`M${d.x - 8} 270 V122 a58 58 0 0 1 116 0 V270 z`} fill={d.frame} />
              <path d={`M${d.x} 270 V124 a50 50 0 0 1 100 0 V270 z`} fill={d.body} />
            </>
          ) : (
            <>
              <rect x={d.x - 8} y="78" width="116" height="192" rx="4" fill={d.frame} />
              <rect x={d.x} y="86" width="100" height="184" rx="2" fill={d.body} />
              <path d={`M${d.x + 50} 78 l12 -14 h-24 z`} fill={d.frame} />
            </>
          )}
          <rect x={d.x + 14} y="176" width="72" height="80" rx="3" fill="none" stroke="#000000" strokeOpacity="0.22" strokeWidth="3" />
          <circle cx={d.x + 84} cy="190" r="5" fill="#C9A227" />
          <rect x={d.x + 12} y="122" width="76" height="30" rx="4" fill="#F3E3D3" stroke="#2A1E2F" strokeWidth="2" />
          <text
            x={d.x + 50}
            y="142"
            textAnchor="middle"
            fontSize="13"
            fill="#2A1E2F"
            fontFamily="var(--font-g-limelight)"
          >
            {d.sign}
          </text>
        </g>
      ))}

      {/* Light under the middle door */}
      <path d="M194 270 h92 l26 30 h-144 z" fill="#FFD48A" opacity="0.22" />
      <rect className="cover-anim cv-glow" x="194" y="266" width="92" height="5" fill="#FFD48A" />

      {/* The candle leans toward the open path */}
      <rect x="28" y="238" width="16" height="34" rx="3" fill="#F3E3D3" />
      <rect x="22" y="270" width="28" height="6" rx="3" fill="#C9A227" />
      <g className="cover-anim cv-flame">
        <path d="M36 238 q-10 -10 4 -30 q4 14 10 18 q2 8 -14 12 z" fill="#FFD48A" />
        <path d="M37 236 q-4 -6 3 -16 q2 8 5 10 q0 5 -8 6 z" fill="#FFF4D6" />
      </g>

      {/* The plaque */}
      <rect x="140" y="312" width="200" height="34" rx="6" fill="#C9A227" />
      <text x="240" y="334" textAnchor="middle" fontSize="12" fill="#2A1E2F" fontFamily="var(--font-g-limelight)">
        ONE SIGN TELLS THE TRUTH
      </text>

      {/* Mr. Hinges */}
      <g>
        <rect x="436" y="146" width="34" height="124" rx="10" fill="#1A1220" />
        <circle cx="453" cy="132" r="13" fill="#1A1220" />
        <rect x="438" y="104" width="30" height="18" rx="2" fill="#B23A48" />
        <rect x="432" y="120" width="42" height="5" rx="2" fill="#B23A48" />
        <path d="M466 106 q14 -10 8 -24 q-6 12 -12 16" fill="#F3E3D3" />
        <circle cx="448" cy="132" r="1.8" fill="#F3E3D3" />
        <circle cx="457" cy="132" r="1.8" fill="#F3E3D3" />
      </g>
    </svg>
  );
}
