import { COVER_VIEWBOX, type CoverProps } from "./types";

const TILE_X = [18, 96, 174, 252, 330, 408];
const FAKE = 3;

export function FakeFloorCover({ className, uid = "ff" }: CoverProps) {
  const pit = `${uid}-pit`;
  return (
    <svg
      viewBox={COVER_VIEWBOX}
      className={className}
      data-cover
      role="img"
      aria-label="A row of floor tiles over a dark pit. One tile is fake: its grout lines don't match and the rain doesn't splash on it. A character throws a pebble to test it."
    >
      <defs>
        <linearGradient id={pit} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#26323B" />
          <stop offset="100%" stopColor="#11171C" />
        </linearGradient>
      </defs>

      <rect width="480" height="360" fill="#F4F1EA" />
      {/* Brick wall */}
      <rect width="480" height="246" fill="#EAE4D6" />
      {Array.from({ length: 8 }, (_, row) => (
        <g key={row} stroke="#DDD5C3" strokeWidth="2">
          <line x1="0" y1={row * 30 + 30} x2="480" y2={row * 30 + 30} />
          {Array.from({ length: 9 }, (_, col) => (
            <line
              key={col}
              x1={col * 60 + (row % 2 ? 30 : 0)}
              y1={row * 30}
              x2={col * 60 + (row % 2 ? 30 : 0)}
              y2={row * 30 + 30}
            />
          ))}
        </g>
      ))}

      {/* The pit */}
      <rect y="262" width="480" height="98" fill={`url(#${pit})`} />

      {/* Shadows on the wall: only real floors cast them */}
      {TILE_X.map((x, i) => (i === FAKE ? null : <rect key={x} x={x + 8} y="222" width="66" height="12" rx="4" fill="#26323B" opacity="0.13" />))}

      {/* Tiles */}
      {TILE_X.map((x, i) => {
        const fake = i === FAKE;
        return (
          <g key={x} opacity={fake ? 0.92 : 1}>
            <rect x={x} y="254" width="66" height="14" fill={fake ? "#B48B4A" : "#8A5D12"} />
            <rect
              x={x}
              y="236"
              width="66"
              height="20"
              fill={fake ? "#DDBE86" : "#C99A4A"}
              stroke={fake ? "#8A5D12" : "none"}
              strokeWidth={fake ? 2 : 0}
              strokeDasharray={fake ? "5 4" : undefined}
            />
            {/* Grout: misaligned on the fake tile (the tell) */}
            <line x1={x + (fake ? 15 : 22)} y1="236" x2={x + (fake ? 15 : 22)} y2="256" stroke="#8A5D12" strokeOpacity="0.55" strokeWidth="2" />
            <line x1={x + (fake ? 37 : 44)} y1="236" x2={x + (fake ? 37 : 44)} y2="256" stroke="#8A5D12" strokeOpacity="0.55" strokeWidth="2" />
          </g>
        );
      })}

      {/* Rain, with splashes only on real tiles */}
      <g className="cover-anim cv-rain" stroke="#4F7CAC" strokeWidth="2.4" strokeLinecap="round" opacity="0.55">
        {Array.from({ length: 22 }, (_, i) => {
          const x = (i * 47) % 480;
          const y = ((i * 71) % 190) + 10;
          return <line key={i} x1={x} y1={y} x2={x - 7} y2={y + 18} />;
        })}
      </g>
      <g stroke="#4F7CAC" strokeWidth="2" fill="none" strokeLinecap="round">
        {TILE_X.map((x, i) =>
          i === FAKE ? null : (
            <g key={x}>
              <path d={`M${x + 12} 232 q4 -7 8 0`} />
              <path d={`M${x + 44} 232 q4 -7 8 0`} />
            </g>
          ),
        )}
      </g>

      {/* The tester */}
      <g fill="#26323B">
        <circle cx="206" cy="182" r="13" />
        <rect x="193" y="196" width="26" height="34" rx="11" />
        <rect x="196" y="226" width="8" height="10" rx="3" />
        <rect x="208" y="226" width="8" height="10" rx="3" />
        <path d="M214 204 l18 -14" stroke="#26323B" strokeWidth="7" strokeLinecap="round" />
        <circle cx="211" cy="180" r="2.6" fill="#FFFFFF" />
      </g>

      {/* Pebble arc */}
      <path d="M232 188 q46 -70 92 46" fill="none" stroke="#8A5D12" strokeWidth="2.5" strokeDasharray="3 7" strokeLinecap="round" />
      <circle className="cover-anim cv-arc" cx="232" cy="188" r="6" fill="#6B6B6B" />
      <text x="290" y="132" textAnchor="middle" fontSize="20" fill="#8A5D12" fontFamily="var(--font-pixelify)" fontWeight="700">
        tok?
      </text>
    </svg>
  );
}
