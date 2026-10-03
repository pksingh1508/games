import { COVER_VIEWBOX, type CoverProps } from "./types";

type Segment = "a" | "b" | "c" | "d" | "e" | "f" | "g";
const NINE: Segment[] = ["a", "b", "c", "d", "f", "g"];

/** A rounded 7-segment digit. */
function SevenSegment({ x, y, on }: { x: number; y: number; on: Segment[] }) {
  const w = 58;
  const h = 88;
  const t = 11;
  const half = h / 2;
  const segments: Record<Segment, { x: number; y: number; w: number; h: number }> = {
    a: { x: x + t, y, w: w - 2 * t, h: t },
    g: { x: x + t, y: y + half - t / 2, w: w - 2 * t, h: t },
    d: { x: x + t, y: y + h - t, w: w - 2 * t, h: t },
    f: { x, y: y + t, w: t, h: half - 1.5 * t },
    b: { x: x + w - t, y: y + t, w: t, h: half - 1.5 * t },
    e: { x, y: y + half + t / 2, w: t, h: half - 1.5 * t },
    c: { x: x + w - t, y: y + half + t / 2, w: t, h: half - 1.5 * t },
  };
  return (
    <g>
      {(Object.keys(segments) as Segment[]).map((key) => {
        const s = segments[key];
        const lit = on.includes(key);
        return (
          <rect
            key={key}
            x={s.x}
            y={s.y}
            width={s.w}
            height={s.h}
            rx={t / 2}
            fill={lit ? "#FFB45C" : "#3A2C22"}
          />
        );
      })}
    </g>
  );
}

export function NinetyNineSecondsCover({ className, uid = "99" }: CoverProps) {
  const glow = `${uid}-glow`;
  const lamp = `${uid}-lamp`;
  return (
    <svg
      viewBox={COVER_VIEWBOX}
      className={className}
      data-cover
      role="img"
      aria-label="A locked room with a glowing digital clock reading 99, a door with a keypad and a note on the wall."
    >
      <defs>
        <radialGradient id={glow}>
          <stop offset="0%" stopColor="#D98E3F" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#D98E3F" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={lamp}>
          <stop offset="0%" stopColor="#FFCF8A" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FFCF8A" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="480" height="360" fill="#2B2421" />
      {Array.from({ length: 15 }, (_, i) => (
        <rect key={i} x={i * 32} width="14" height="300" fill="#322A26" />
      ))}
      <rect y="296" width="480" height="64" fill="#1E1916" />
      <rect y="292" width="480" height="6" fill="#473F3B" />

      {/* Lamp light */}
      <circle cx="378" cy="188" r="120" fill={`url(#${lamp})`} />

      {/* The loop */}
      <ellipse cx="240" cy="104" rx="132" ry="82" fill="none" stroke="#D98E3F" strokeOpacity="0.5" strokeWidth="3" strokeDasharray="12 10" />
      <path d="M355 64 l16 -4 l-4 16" fill="none" stroke="#D98E3F" strokeOpacity="0.7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

      {/* The clock */}
      <circle cx="240" cy="104" r="120" fill={`url(#${glow})`} />
      <rect x="140" y="48" width="200" height="114" rx="18" fill="#120E0C" stroke="#473F3B" strokeWidth="3" />
      <g className="cover-anim cv-flicker flash-risk">
        <SevenSegment x={170} y={61} on={NINE} />
        <SevenSegment x={252} y={61} on={NINE} />
      </g>

      {/* Door + keypad */}
      <rect x="56" y="174" width="90" height="118" rx="6" fill="#5B4636" />
      <rect x="68" y="186" width="66" height="40" rx="4" fill="none" stroke="#4A382B" strokeWidth="3" />
      <rect x="68" y="236" width="66" height="44" rx="4" fill="none" stroke="#4A382B" strokeWidth="3" />
      <circle cx="132" cy="240" r="5" fill="#D98E3F" />
      <rect x="158" y="210" width="36" height="48" rx="6" fill="#120E0C" stroke="#473F3B" strokeWidth="2" />
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => (
          <rect key={`${r}${c}`} x={164 + c * 9} y={218 + r * 10} width="6" height="6" rx="1.5" fill="#D98E3F" opacity="0.75" />
        )),
      )}

      {/* Chair */}
      <g fill="#3B302B">
        <rect x="392" y="178" width="13" height="76" rx="5" />
        <rect x="330" y="240" width="76" height="13" rx="5" />
        <rect x="336" y="250" width="9" height="42" rx="3" />
        <rect x="392" y="250" width="9" height="42" rx="3" />
      </g>

      {/* A note in your own handwriting */}
      <g transform="rotate(6 400 92)">
        <rect x="362" y="66" width="80" height="54" rx="3" fill="#F2E6D8" />
        <text x="402" y="88" textAnchor="middle" fontSize="12" fontWeight="700" fill="#2B2421" fontFamily="var(--font-g-fraunces)">
          THE CLOCK
        </text>
        <text x="402" y="106" textAnchor="middle" fontSize="12" fontWeight="700" fill="#2B2421" fontFamily="var(--font-g-fraunces)">
          KNOWS
        </text>
        <circle cx="402" cy="70" r="4" fill="#D62839" />
      </g>
    </svg>
  );
}
