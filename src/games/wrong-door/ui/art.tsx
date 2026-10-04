// The hotel's art (Plan/13-wrong-door.md §9 "Visuals"): five door styles you can tell apart at a glance,
// Mr. Hinges (his hat easy to read: red with a feather, or black without), the candle, and the lobby's
// furniture (the anomaly floors' reference). Plain SVG, no image files.
import type { DoorStyle, ItemKind } from "../logic/types";
import styles from "../wrong-door.module.css";

const FRAMES: Record<DoorStyle | "back", string> = { wood: "#5A3A28", iron: "#2D3238", velvet: "#C9A227", glass: "#3F4A4E", round: "#5A3A28", back: "#1c1420" };

/** The door frame and the dark doorway (the leaf covers it). */
export function DoorFrameSvg({ style }: { style: DoorStyle | "back" }) {
  const frame = FRAMES[style];
  if (style === "round") {
    return (
      <svg viewBox="0 0 100 200" className="absolute inset-0 size-full" preserveAspectRatio="none" aria-hidden>
        <path d="M0 200 V50 A50 50 0 0 1 100 50 V200 Z" fill={frame} />
        <path d="M8 200 V52 A42 42 0 0 1 92 52 V200 Z" fill="#07050a" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 200" className="absolute inset-0 size-full" preserveAspectRatio="none" aria-hidden>
      <rect width="100" height="200" rx="3" fill={frame} />
      <rect x="8" y="8" width="84" height="192" fill="#07050a" />
    </svg>
  );
}

/** The part that swings open. */
export function DoorLeafSvg({ style }: { style: DoorStyle | "back" }) {
  switch (style) {
    case "wood":
      return (
        <svg viewBox="0 0 100 200" className="size-full" preserveAspectRatio="none" aria-hidden>
          <rect x="8" y="8" width="84" height="192" fill="#8A5A3C" />
          {[
            [16, 20, 30, 70],
            [54, 20, 30, 70],
            [16, 104, 30, 82],
            [54, 104, 30, 82],
          ].map(([x, y, w, h]) => (
            <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} rx="2" fill="#74492F" stroke="#5f3a24" strokeWidth="1.5" />
          ))}
          <circle cx="83" cy="112" r="4.5" fill="#C9A227" />
        </svg>
      );
    case "iron":
      return (
        <svg viewBox="0 0 100 200" className="size-full" preserveAspectRatio="none" aria-hidden>
          <rect x="8" y="8" width="84" height="192" fill="#6B737C" />
          <rect x="8" y="58" width="84" height="9" fill="#4F565E" />
          <rect x="8" y="142" width="84" height="9" fill="#4F565E" />
          {Array.from({ length: 9 }, (_, k) => (
            <g key={k} fill="#3d434a">
              <circle cx="15" cy={20 + k * 20} r="2.2" />
              <circle cx="85" cy={20 + k * 20} r="2.2" />
            </g>
          ))}
          <circle cx="78" cy="108" r="7" fill="none" stroke="#C9A227" strokeWidth="2.5" />
        </svg>
      );
    case "velvet":
      return (
        <svg viewBox="0 0 100 200" className="size-full" preserveAspectRatio="none" aria-hidden>
          <rect x="8" y="8" width="84" height="192" fill="#7A2E4A" />
          <g stroke="#5f2238" strokeWidth="1.6">
            {Array.from({ length: 7 }, (_, k) => (
              <g key={k}>
                <line x1="8" y1={10 + k * 30} x2="92" y2={52 + k * 30} />
                <line x1="92" y1={10 + k * 30} x2="8" y2={52 + k * 30} />
              </g>
            ))}
          </g>
          {Array.from({ length: 6 }, (_, r) =>
            [29, 71].map((x) => <circle key={`${r}-${x}`} cx={x} cy={31 + r * 30} r="2.4" fill="#C9A227" />),
          )}
          <circle cx="83" cy="112" r="4.5" fill="#C9A227" />
        </svg>
      );
    case "glass":
      return (
        <svg viewBox="0 0 100 200" className="size-full" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="wd-frost" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#dcebee" />
              <stop offset="1" stopColor="#93b4bd" />
            </linearGradient>
          </defs>
          <rect x="8" y="8" width="84" height="192" fill="url(#wd-frost)" />
          <g stroke="#3F4A4E" strokeWidth="3">
            <line x1="50" y1="8" x2="50" y2="200" />
            <line x1="8" y1="72" x2="92" y2="72" />
            <line x1="8" y1="136" x2="92" y2="136" />
          </g>
          <path d="M18 20 l20 -6 M22 34 l26 -8" stroke="#fff" strokeOpacity="0.6" strokeWidth="2" />
          <rect x="78" y="95" width="5" height="30" rx="2" fill="#C9A227" />
        </svg>
      );
    case "round":
      return (
        <svg viewBox="0 0 100 200" className="size-full" preserveAspectRatio="none" aria-hidden>
          <path d="M8 200 V52 A42 42 0 0 1 92 52 V200 Z" fill="#3F6F6A" />
          <g stroke="#2f5551" strokeWidth="2">
            <line x1="29" y1="16" x2="29" y2="200" />
            <line x1="50" y1="10" x2="50" y2="200" />
            <line x1="71" y1="16" x2="71" y2="200" />
          </g>
          <rect x="8" y="72" width="84" height="7" fill="#1f2a29" />
          <rect x="8" y="152" width="84" height="7" fill="#1f2a29" />
          <circle cx="80" cy="120" r="5" fill="#C9A227" />
        </svg>
      );
    case "back":
      return (
        <svg viewBox="0 0 100 200" className="size-full" preserveAspectRatio="none" aria-hidden>
          <rect x="8" y="8" width="84" height="192" fill="#3b2c42" />
          <rect x="18" y="20" width="64" height="70" rx="2" fill="#33263a" stroke="#241a28" strokeWidth="2" />
          <rect x="18" y="104" width="64" height="82" rx="2" fill="#33263a" stroke="#241a28" strokeWidth="2" />
          <circle cx="82" cy="112" r="4" fill="#836919" />
        </svg>
      );
  }
}

export type HatShown = "black" | "red" | "off" | "dark";

/** Mr. Hinges: tall, thin, polite, unsettling. */
export function HingesSvg({ hat }: { hat: HatShown }) {
  const dark = hat === "dark";
  const coat = dark ? "#0b080d" : "#1A1220";
  const skin = dark ? "#0b080d" : "#E9DCCD";
  return (
    <svg viewBox="0 0 60 200" className="size-full" aria-hidden>
      <rect x="20" y="150" width="8" height="48" fill={dark ? "#060408" : "#120c15"} />
      <rect x="32" y="150" width="8" height="48" fill={dark ? "#060408" : "#120c15"} />
      <path d="M13 62 H47 L53 156 H7 Z" fill={coat} />
      {!dark && <path d="M24 62 L30 84 L36 62 Z" fill="#E9DCCD" />}
      {!dark && [92, 106, 120].map((y) => <circle key={y} cx="30" cy={y} r="1.6" fill="#C9A227" />)}
      {hat !== "off" && !dark && (
        <g fill="#F7F1E8">
          <circle cx="9" cy="128" r="4.2" />
          <circle cx="51" cy="128" r="4.2" />
        </g>
      )}
      <circle cx="30" cy="46" r="12" fill={skin} />
      {dark ? (
        <g fill="#ffd48a">
          <circle cx="26" cy="46" r="1.3" />
          <circle cx="34" cy="46" r="1.3" />
        </g>
      ) : (
        <>
          <circle cx="26" cy="45" r="1.5" fill="#2A1E2F" />
          <circle cx="34" cy="45" r="1.5" fill="#2A1E2F" />
          <path d="M25 52 q5 2.5 10 0" stroke="#2A1E2F" strokeWidth="1.3" fill="none" />
        </>
      )}
      {hat === "off" ? (
        <path d="M18 42 q12 -14 24 0" fill={dark ? "#0b080d" : "#2a2027"} />
      ) : (
        <g>
          <rect x="19" y="14" width="22" height="20" fill={hat === "red" ? "#B23A48" : dark ? "#060408" : "#121014"} />
          <rect x="14" y="32" width="32" height="4.5" rx="1.5" fill={hat === "red" ? "#B23A48" : dark ? "#060408" : "#121014"} />
          <rect x="19" y="27" width="22" height="3.5" fill={hat === "red" ? "#7a1f2c" : dark ? "#060408" : "#3a3540"} />
          {hat === "red" && <path d="M40 22 q14 -10 9 -22 q-4 11 -12 16" fill="#F3E3D3" stroke="#d8c7b5" strokeWidth="0.8" />}
        </g>
      )}
    </svg>
  );
}

/** The candle: the flame leans towards the open stairs. */
export function CandleSvg({ lean }: { lean: "left" | "right" | "up" }) {
  const angle = lean === "left" ? -26 : lean === "right" ? 26 : 0;
  return (
    <svg viewBox="0 0 40 90" className="size-full overflow-visible" aria-hidden>
      <circle cx="20" cy="36" r="18" fill="#ffd48a" opacity="0.22" />
      <ellipse cx="20" cy="86" rx="15" ry="3.5" fill="#836919" />
      <rect x="9" y="80" width="22" height="6" rx="2" fill="#C9A227" />
      <rect x="14" y="44" width="12" height="38" rx="2" fill="#F3E3D3" />
      <line x1="20" y1="44" x2="20" y2="39" stroke="#2A1E2F" strokeWidth="1.2" />
      <g transform={`rotate(${angle} 20 41)`}>
        <g className={styles.flame}>
          <path d="M20 41 q-9 -9 0 -27 q9 18 0 27 z" fill="#FFB347" />
          <path d="M20 40 q-4 -6 0 -15 q4 9 0 15 z" fill="#FFF4D6" />
        </g>
      </g>
    </svg>
  );
}

export type PaintingState = "normal" | "upsideDown" | "missing" | "left";

/** A ship at sea, sailing right (in the lobby). */
export function PaintingSvg({ state }: { state: PaintingState }) {
  if (state === "missing") {
    return (
      <svg viewBox="0 0 160 110" className="size-full" aria-hidden>
        <rect x="6" y="6" width="148" height="98" fill="#000" opacity="0.08" />
        <circle cx="80" cy="4" r="2.5" fill="#836919" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 160 110" className="size-full" aria-hidden>
      <g transform={state === "upsideDown" ? "rotate(180 80 55)" : undefined}>
        <rect width="160" height="110" rx="3" fill="#C9A227" />
        <rect x="8" y="8" width="144" height="94" fill="#8a6d17" />
        <rect x="11" y="11" width="138" height="88" fill="#a9c6d3" />
        <rect x="11" y="62" width="138" height="37" fill="#3d6b87" />
        <path d="M11 66 q15 -5 30 0 t30 0 t30 0 t30 0 t18 0" stroke="#d7e8ef" strokeWidth="2" fill="none" />
        <circle cx="130" cy="28" r="8" fill="#f5e3a0" />
        <g transform={state === "left" ? "translate(160 0) scale(-1 1)" : undefined}>
          <path d="M48 62 h52 l12 -10 h-10 l-2 4 h-48 z" fill="#5a3a28" />
          <line x1="74" y1="56" x2="74" y2="20" stroke="#3b2c22" strokeWidth="2.2" />
          <path d="M76 22 q20 14 0 30 z" fill="#f3e3d3" />
          <path d="M72 26 q-14 10 0 24 z" fill="#e6d3bf" />
          <path d="M74 20 l10 4 l-10 3 z" fill="#B23A48" />
        </g>
      </g>
    </svg>
  );
}

/** The wall clock: three o'clock in the lobby. */
export function ClockSvg({ hour, backwards }: { hour: 3 | 9; backwards: boolean }) {
  const numerals: Array<[string, number, number]> = backwards
    ? [
        ["12", 50, 22],
        ["9", 79, 54],
        ["6", 50, 85],
        ["3", 21, 54],
      ]
    : [
        ["12", 50, 22],
        ["3", 79, 54],
        ["6", 50, 85],
        ["9", 21, 54],
      ];
  const hx = hour === 3 ? 70 : 30;
  return (
    <svg viewBox="0 0 100 100" className="size-full" aria-hidden>
      <circle cx="50" cy="50" r="48" fill="#5a3a28" />
      <circle cx="50" cy="50" r="41" fill="#F3E3D3" />
      {numerals.map(([t, x, y]) => (
        <text key={t} x={x} y={y} textAnchor="middle" fontSize="12" fontWeight="700" fill="#2A1E2F" fontFamily="Georgia, serif">
          {t}
        </text>
      ))}
      <line x1="50" y1="50" x2={hx} y2="50" stroke="#2A1E2F" strokeWidth="4" strokeLinecap="round" />
      <line x1="50" y1="50" x2="50" y2="18" stroke="#2A1E2F" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="50" cy="50" r="3" fill="#C9A227" />
    </svg>
  );
}

export function LampSvg({ lit }: { lit: boolean }) {
  return (
    <svg viewBox="0 0 40 60" className="size-full overflow-visible" aria-hidden>
      {lit && <circle cx="20" cy="30" r="22" fill="#ffd48a" opacity="0.25" />}
      <rect x="18" y="38" width="4" height="18" fill="#836919" />
      <rect x="10" y="54" width="20" height="4" rx="1" fill="#836919" />
      <circle cx="20" cy="32" r="6" fill={lit ? "#fff1c4" : "#6b6470"} />
      <path d="M8 30 L14 10 H26 L32 30 Z" fill="#C9A227" opacity="0.92" />
    </svg>
  );
}

export function PlantSvg() {
  return (
    <svg viewBox="0 0 60 90" className="size-full overflow-visible" aria-hidden>
      <g fill="#3f7a4a">
        <path d="M30 56 q-26 -10 -28 -36 q14 12 28 36" />
        <path d="M30 56 q24 -12 26 -40 q-14 14 -26 40" />
        <path d="M30 56 q-4 -30 2 -52 q8 22 -2 52" />
        <path d="M30 58 q-18 -2 -26 -16 q14 4 26 16" fill="#356a40" />
        <path d="M30 58 q18 -4 26 -18 q-14 6 -26 18" fill="#356a40" />
      </g>
      <path d="M14 56 h32 l-4 32 h-24 z" fill="#a0522d" />
      <rect x="12" y="54" width="36" height="6" rx="2" fill="#b8653a" />
    </svg>
  );
}

/** The little brass sign: "↑ 13" (your room is on floor 13). */
export function FloorSignSvg({ text }: { text: string }) {
  return (
    <svg viewBox="0 0 70 30" className="size-full" aria-hidden>
      <rect width="70" height="30" rx="4" fill="#C9A227" />
      <rect x="2.5" y="2.5" width="65" height="25" rx="3" fill="none" stroke="#836919" strokeWidth="1.5" />
      <text x="35" y="21" textAnchor="middle" fontSize="15" fill="#2A1E2F" fontFamily="var(--font-g-limelight), Georgia, serif">
        ↑ {text}
      </text>
    </svg>
  );
}

/** A shoeprint, toes up. */
export function PrintSvg() {
  return (
    <svg viewBox="0 0 20 40" className="size-full" aria-hidden>
      <ellipse cx="10" cy="13" rx="7" ry="10" fill="#120c15" opacity="0.62" />
      <ellipse cx="10" cy="32" rx="5" ry="6" fill="#120c15" opacity="0.62" />
    </svg>
  );
}

export function KeySvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="7" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="M11.5 12 H21 M17 12 v3.5 M20 12 v2.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** The things you can find. */
export function ItemSvg({ kind, className }: { kind: ItemKind; className?: string }) {
  switch (kind) {
    case "luckyKey":
      return <KeySvg className={className} />;
    case "truthCoin":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <circle cx="12" cy="12" r="9" fill="#C9A227" stroke="#836919" strokeWidth="1.5" />
          <path d="M8 12.5 l2.5 2.5 l5.5 -6" stroke="#2A1E2F" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      );
    case "crowbar":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path d="M5 20 L17 5 q2 -2 3.5 0" stroke="#B23A48" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d="M5 20 l-2 -1" stroke="#B23A48" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      );
    case "chalk":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <rect x="4" y="9" width="16" height="6" rx="1.5" transform="rotate(-35 12 12)" fill="#f7f1e8" stroke="#2A1E2F" strokeWidth="1.2" />
        </svg>
      );
    case "stethoscope":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path d="M6 3 v6 a5 5 0 0 0 10 0 V3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M11 14 v2 a4 4 0 0 0 8 0 v-2" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="19" cy="12" r="2.3" fill="#C9A227" />
        </svg>
      );
    case "lantern":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path d="M9 4 h6 M12 2 v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <rect x="7" y="6" width="10" height="13" rx="2" fill="#ffd48a" stroke="#836919" strokeWidth="1.6" />
          <rect x="6" y="19" width="12" height="3" rx="1" fill="#836919" />
        </svg>
      );
  }
}

export const ITEM_NAMES: Record<ItemKind, string> = {
  stethoscope: "stethoscope",
  lantern: "lantern",
  truthCoin: "Truth Coin",
  crowbar: "crowbar",
  chalk: "piece of chalk",
  luckyKey: "spare key",
};

export const STYLE_NAMES: Record<DoorStyle, string> = { wood: "wooden", iron: "iron", velvet: "velvet", glass: "glass", round: "round" };
