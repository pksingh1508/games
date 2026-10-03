import { COVER_VIEWBOX, type CoverProps } from "./types";

const COLS = 6;
const ROWS = 3;
const SIZE = 58;
const GAP = 8;
const X0 = 46;
const Y0 = 132;

const tile = (c: number, r: number) => ({ x: X0 + c * (SIZE + GAP), y: Y0 + r * (SIZE + GAP) });

export function OneMoreStepCover({ className }: CoverProps) {
  const player = tile(2, 1);
  const door = tile(4, 1);
  const px = player.x + SIZE / 2;
  const py = player.y + SIZE / 2;
  const dx = door.x + SIZE / 2;
  const dy = door.y + SIZE / 2;

  return (
    <svg
      viewBox={COVER_VIEWBOX}
      className={className}
      data-cover
      role="img"
      aria-label="A blob on a grid of tiles; the exit door has feet and is hopping away."
    >
      <rect width="480" height="360" fill="#E8F6EF" />
      <circle cx="420" cy="54" r="70" fill="#D3EFE2" />
      <circle cx="58" cy="330" r="90" fill="#DDF2E8" />

      {/* Tiles */}
      {Array.from({ length: ROWS }, (_, r) =>
        Array.from({ length: COLS }, (_, c) => {
          const { x, y } = tile(c, r);
          if (c === 5 && r === 2) {
            return <ellipse key={`${c}-${r}`} cx={x + SIZE / 2} cy={y + SIZE / 2 + 4} rx="26" ry="20" fill="#1F3A33" opacity="0.85" />;
          }
          return (
            <g key={`${c}-${r}`}>
              <rect x={x} y={y + 6} width={SIZE} height={SIZE} rx="12" fill="#BFDCCF" />
              <rect x={x} y={y} width={SIZE} height={SIZE} rx="12" fill={(c + r) % 2 ? "#FFFFFF" : "#F4FBF8"} />
            </g>
          );
        }),
      )}

      {/* Spikes tile */}
      {(() => {
        const { x, y } = tile(3, 0);
        return (
          <g fill="#1F3A33">
            {[0, 1, 2].map((i) => (
              <path key={i} d={`M${x + 10 + i * 14} ${y + 44} l7 -24 l7 24 z`} />
            ))}
          </g>
        );
      })()}

      {/* Crumbling tile */}
      {(() => {
        const { x, y } = tile(2, 2);
        return (
          <path
            d={`M${x + 12} ${y + 10} l10 14 l-6 10 l12 12 M${x + 34} ${y + 8} l-4 16 l12 8 M${x + 20} ${y + 40} l16 6`}
            stroke="#8FB3A4"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        );
      })()}

      {/* Footprints */}
      <g fill="#1E7D5E" opacity="0.4">
        {[0, 1].map((c) => {
          const { x, y } = tile(c, 1);
          return (
            <g key={c}>
              <ellipse cx={x + 22} cy={y + 24} rx="5" ry="8" transform={`rotate(70 ${x + 22} ${y + 24})`} />
              <ellipse cx={x + 36} cy={y + 36} rx="5" ry="8" transform={`rotate(70 ${x + 36} ${y + 36})`} />
            </g>
          );
        })}
      </g>

      {/* The player blob */}
      <g>
        <ellipse cx={px - 7} cy={py + 19} rx="7" ry="4" fill="#1F3A33" />
        <ellipse cx={px + 9} cy={py + 19} rx="7" ry="4" fill="#1F3A33" />
        <circle cx={px} cy={py - 2} r="21" fill="#1F3A33" />
        <ellipse cx={px + 5} cy={py - 8} rx="5" ry="6.5" fill="#FFFFFF" />
        <ellipse cx={px + 15} cy={py - 8} rx="4.5" ry="6" fill="#FFFFFF" />
        <circle cx={px + 8} cy={py - 7} r="2.4" fill="#1F3A33" />
        <circle cx={px + 17} cy={py - 7} r="2.2" fill="#1F3A33" />
      </g>

      {/* The runaway exit door */}
      <g className="cover-anim cv-hop">
        <rect x={dx - 22} y={dy - 92} width="44" height="20" rx="5" fill="#1E7D5E" />
        <text x={dx} y={dy - 77.5} textAnchor="middle" fontSize="12" fontWeight="800" fill="#FFFFFF" fontFamily="var(--font-geist-sans)">
          EXIT
        </text>
        <rect x={dx - 21} y={dy - 66} width="42" height="62" rx="9" fill="#F2A65A" stroke="#C77B32" strokeWidth="3" />
        <rect x={dx - 13} y={dy - 30} width="26" height="18" rx="3" fill="none" stroke="#C77B32" strokeWidth="2" />
        <circle cx={dx} cy={dy - 47} r="8" fill="#FFE7C2" stroke="#C77B32" strokeWidth="2" />
        <circle cx={dx - 3} cy={dy - 47} r="3" fill="#1F3A33" />
        <circle cx={dx + 13} cy={dy - 36} r="2.6" fill="#C77B32" />
        <ellipse className="cover-anim cv-tap" cx={dx - 10} cy={dy} rx="6" ry="3.5" fill="#1F3A33" />
        <ellipse className="cover-anim cv-tap" cx={dx + 10} cy={dy} rx="6" ry="3.5" fill="#1F3A33" style={{ animationDelay: "0.2s" }} />
        <path d={`M${dx + 32} ${dy - 50} h14 M${dx + 30} ${dy - 38} h20 M${dx + 32} ${dy - 26} h12`} stroke="#1E7D5E" strokeWidth="3" strokeLinecap="round" />
        <path d={`M${dx - 30} ${dy - 66} q-4 6 0 10 q4 -4 0 -10`} fill="#7FD1E8" />
      </g>

      {/* Speech bubble */}
      <g>
        <rect x="40" y="30" width="222" height="58" rx="20" fill="#FFFFFF" stroke="#1F3A33" strokeWidth="3" />
        <path d="M150 87 l18 26 l4 -26 z" fill="#FFFFFF" stroke="#1F3A33" strokeWidth="3" strokeLinejoin="round" />
        <path d="M151 85 h20" stroke="#FFFFFF" strokeWidth="5" />
        <text x="151" y="68" textAnchor="middle" fontSize="25" fontWeight="700" fill="#1F3A33" fontFamily="var(--font-g-fredoka)">
          One more step!
        </text>
      </g>

      {/* Sparkles */}
      <g fill="#1E7D5E">
        <path d="M330 52 l3 9 l9 3 l-9 3 l-3 9 l-3 -9 l-9 -3 l9 -3 z" />
        <path d="M290 100 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 l6 -2 z" opacity="0.6" />
      </g>
    </svg>
  );
}
