// Mr. Nope: the host. A big red rubber stamp with eyebrows (Plan/02-nope.md §1).
// When he winks, he's lying (secret rule 5), so the wink is drawn big and clear.
import { cn } from "@/lib/cn";
import styles from "../nope.module.css";
import type { Mood } from "../questions/types";

const LINE = "#161414";
const RED = "#D41F22";
const CREAM = "#FFF4D6";

function Eye({ x, y, look = 0, big }: { x: number; y: number; look?: number; big?: boolean }) {
  return (
    <g>
      <ellipse cx={x} cy={y} rx={big ? 14 : 12} ry={big ? 16 : 13} fill={CREAM} stroke={LINE} strokeWidth="3" />
      <circle cx={x + look * 4} cy={y + 1} r={big ? 3.6 : 5.5} fill={LINE} />
      <circle cx={x + look * 4 + 1.8} cy={y - 1.5} r="1.7" fill="#fff" />
    </g>
  );
}

/** Half-closed lids for the smug look. */
function Lid({ x, y }: { x: number; y: number }) {
  return <path d={`M${x - 13} ${y - 1} q13 -16 26 0 z`} fill={RED} stroke={LINE} strokeWidth="3" strokeLinejoin="round" />;
}

const closed = (x: number, y: number, happy?: boolean) =>
  happy ? `M${x - 10} ${y + 3} q10 -12 20 0` : `M${x - 10} ${y} q10 7 20 0`;

export function MrNope({
  mood = "neutral",
  wink = false,
  look = 0,
  className,
  title,
}: {
  mood?: Mood;
  /** One eye shut and a sparkle: he's lying. */
  wink?: boolean;
  /** Where the pupils point, -1 (left) to 1 (right). */
  look?: number;
  className?: string;
  title?: string;
}) {
  const L = { x: 58, y: 112 };
  const R = { x: 102, y: 112 };

  const brows: Record<Mood, string> = {
    neutral: "M44 94 q14 -8 28 -2 M88 92 q14 -6 28 2",
    smug: "M44 98 q14 -4 28 0 M88 86 q14 -10 28 0",
    offended: "M44 90 l26 10 M116 90 l-26 10",
    shocked: "M44 86 q14 -10 28 -4 M88 82 q14 -6 28 4",
    asleep: "M46 100 q12 -3 24 0 M90 100 q12 -3 24 0",
    laughing: "M44 92 q14 -8 28 -2 M88 90 q14 -6 28 2",
    sulking: "M44 98 l26 -8 M116 98 l-26 -8",
    blush: "M46 94 q12 -6 24 -2 M90 92 q12 -4 24 2",
    stamped: "M46 96 l24 -2 M90 94 l24 2",
  };

  return (
    <svg viewBox="0 0 160 200" className={cn("overflow-visible", className)} role="img" aria-label={title ?? "Mr. Nope, the host"}>
      <ellipse cx="80" cy="193" rx="58" ry="6" fill="#000" opacity="0.35" />
      {/* The rubber stamp plate */}
      <rect x="14" y="156" width="132" height="30" rx="8" fill="#2A0C0D" stroke={LINE} strokeWidth="3" />
      <rect x="20" y="178" width="120" height="5" rx="2.5" fill={RED} opacity="0.85" />
      {/* Body */}
      <rect x="20" y="78" width="120" height="86" rx="22" fill={RED} stroke={LINE} strokeWidth="3.5" />
      <path d="M24 146 h112 v4 q0 12 -14 12 h-84 q-14 0 -14 -12 z" fill="#B01A1D" />
      <path d="M34 92 q12 -8 32 -8" stroke="#FF6B6E" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.75" />
      {/* Neck and handle */}
      <rect x="64" y="50" width="32" height="32" rx="6" fill="#8A1416" stroke={LINE} strokeWidth="3.5" />
      <circle cx="80" cy="34" r="28" fill={RED} stroke={LINE} strokeWidth="3.5" />
      <circle cx="70" cy="23" r="8" fill="#FF8A8C" opacity="0.85" />

      {/* Eyebrows */}
      <path d={brows[mood]} stroke={LINE} strokeWidth="6.5" fill="none" strokeLinecap="round" />

      {/* Eyes */}
      {mood === "asleep" ? (
        <path d={`${closed(L.x, L.y)} ${closed(R.x, R.y)}`} stroke={LINE} strokeWidth="4" fill="none" strokeLinecap="round" />
      ) : mood === "laughing" ? (
        <path d={`${closed(L.x, L.y, true)} ${closed(R.x, R.y, true)}`} stroke={LINE} strokeWidth="4.5" fill="none" strokeLinecap="round" />
      ) : mood === "stamped" ? (
        <path d="M50 104 l16 16 M66 104 l-16 16 M94 104 l16 16 M110 104 l-16 16" stroke={LINE} strokeWidth="4.5" strokeLinecap="round" />
      ) : (
        <g>
          {wink ? (
            <path d={closed(L.x, L.y, true)} stroke={LINE} strokeWidth="5" fill="none" strokeLinecap="round" />
          ) : (
            <Eye x={L.x} y={L.y} look={mood === "sulking" ? -0.5 : look} big={mood === "shocked"} />
          )}
          <Eye x={R.x} y={R.y} look={mood === "sulking" ? -0.5 : look} big={mood === "shocked"} />
          {mood === "smug" && (
            <>
              {!wink && <Lid x={L.x} y={L.y} />}
              <Lid x={R.x} y={R.y} />
            </>
          )}
        </g>
      )}

      {/* Mouth */}
      {mood === "laughing" ? (
        <g>
          <path d="M60 130 h40 q0 24 -20 24 q-20 0 -20 -24 z" fill={LINE} />
          <path d="M68 146 q12 -6 24 0 q-4 8 -12 8 q-8 0 -12 -8 z" fill="#FF7A93" />
        </g>
      ) : mood === "shocked" ? (
        <ellipse cx="80" cy="142" rx="8" ry="10" fill={LINE} />
      ) : mood === "asleep" ? (
        <ellipse cx="80" cy="141" rx="5" ry="4" fill={LINE} />
      ) : (
        <path
          d={
            wink || mood === "smug"
              ? "M62 136 q20 14 36 -6"
              : mood === "offended"
                ? "M64 144 q8 -8 16 0 q8 8 16 0"
                : mood === "sulking"
                  ? "M66 146 q14 -9 28 0"
                  : mood === "stamped"
                    ? "M64 142 q16 -6 32 0"
                    : "M64 136 q16 12 32 0"
          }
          stroke={LINE}
          strokeWidth="4.5"
          fill="none"
          strokeLinecap="round"
        />
      )}

      {(mood === "blush" || mood === "laughing") && (
        <g fill="#FF8A8C" opacity="0.75">
          <ellipse cx="42" cy="132" rx="9" ry="5" />
          <ellipse cx="118" cy="132" rx="9" ry="5" />
        </g>
      )}

      {/* The wink's sparkle */}
      {wink && (
        <path
          className={styles.sparkle}
          d="M32 92 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 z"
          fill="#FFE7A0"
          stroke={LINE}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      )}

      {mood === "asleep" && (
        <g fill={CREAM} fontFamily="var(--font-g-bangers)">
          <text x="128" y="70" fontSize="20" className={styles.zzz}>
            Z
          </text>
          <text x="142" y="52" fontSize="14" className={styles.zzz} style={{ animationDelay: "0.8s" }}>
            z
          </text>
        </g>
      )}

      {mood === "stamped" && (
        <g transform="rotate(-14 80 122)">
          <rect x="22" y="100" width="116" height="46" rx="8" fill="none" stroke={CREAM} strokeWidth="5" strokeDasharray="22 4 9 3" />
          <text x="80" y="137" textAnchor="middle" fontSize="38" fill={CREAM} fontFamily="var(--font-g-bangers)" letterSpacing="2">
            NOPE!
          </text>
        </g>
      )}
    </svg>
  );
}
