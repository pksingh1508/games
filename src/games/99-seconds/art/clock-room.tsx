// Chapter 3's art: inside the Clock Room (Plan/03-99-seconds.md §5). Dark wood and brass, lit amber through the back
// of the giant face (its numerals read backwards from in here). The dial runs 0 to 99, with a scratched-out 100 at the
// top between them. Gears, a pendulum as long as a tree, a clockmaker's bench, and the little clock that grows wings.
import { NOTES } from "../rooms/clock-room";
import { FLOOR, Glow, Hand, SERIF, Shadow, Wall, type ArtState, type WallStyle } from "./kit";

const STYLE: WallStyle = {
  wall: "#1F2030",
  wainscot: { top: 600, color: "#2B2236" },
  ceiling: "#14141F",
  floor: "#3B2A1E",
  boards: "#2C1F16",
  skirting: "#1A120C",
};

const BRASS = "#B08A3E";
const BRASS_DARK = "#6E5524";
const COPPER = "#A8673A";
const WOOD = "#5A3E28";
const WOOD_DARK = "#2C1F16";

/** Where a value sits on the dial (degrees clockwise from the top, seen from the front): 99 just left of the top, 0 just right, the scratched-out 100 dead centre. */
export const dialAngle = (value: number) => (value >= 100 ? 0 : 8 + (Math.max(0, Math.min(99, value)) / 99) * 344);

/** The little mantel clock, with wings (folded, or beating). */
export function WingedClock({ x, y, s = 1, wings = true, flapping = true }: { x: number; y: number; s?: number; wings?: boolean; flapping?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} data-winged-clock>
      {wings && (
        <g className={flapping ? "n9-flap" : undefined}>
          <path d="M-40 -30 Q-130 -110 -150 -20 Q-120 -40 -110 0 Q-80 -20 -40 0 Z" fill="#F4EEDF" stroke="#BFB49A" strokeWidth={3} />
          <path d="M40 -30 Q130 -110 150 -20 Q120 -40 110 0 Q80 -20 40 0 Z" fill="#F4EEDF" stroke="#BFB49A" strokeWidth={3} />
        </g>
      )}
      <path d="M-58 40 L-58 -20 Q-58 -70 0 -70 Q58 -70 58 -20 L58 40 Z" fill={WOOD} stroke={WOOD_DARK} strokeWidth={4} />
      <rect x={-66} y={36} width={132} height={16} rx={4} fill={WOOD_DARK} />
      <circle cx={0} cy={-14} r={36} fill="#F4EFE3" stroke={BRASS} strokeWidth={5} />
      <line x1={0} y1={-14} x2={0} y2={-38} stroke="#2B2421" strokeWidth={4} strokeLinecap="round" />
      <line x1={0} y1={-14} x2={18} y2={-6} stroke="#2B2421" strokeWidth={4} strokeLinecap="round" />
    </g>
  );
}

function Lamp({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <line x1={x} y1={0} x2={x} y2={y - 30} stroke="#111" strokeWidth={4} />
      <path d={`M${x - 50} ${y} L${x + 50} ${y} L${x + 24} ${y - 34} L${x - 24} ${y - 34} Z`} fill={BRASS} />
      <Glow cx={x} cy={y + 40} r={320} opacity={0.8} />
    </g>
  );
}

function Face({ a, cx, cy, r, from = "behind" }: { a: ArtState; cx: number; cy: number; r: number; from?: "behind" | "front" }) {
  const sign = from === "behind" ? -1 : 1;
  const at = (deg: number, k: number) => {
    const t = ((sign * deg) / 180) * Math.PI;
    return [cx + Math.sin(t) * r * k, cy - Math.cos(t) * r * k] as const;
  };
  const second = a.extra ? 100 : a.display;
  const short = a.flags.has("hand.at100") || a.extra ? 100 : 99;
  const hand = (value: number, k: number, width: number, color: string) => {
    const [hx, hy] = at(dialAngle(value), k);
    return <line x1={cx} y1={cy} x2={hx} y2={hy} stroke={color} strokeWidth={width} strokeLinecap="round" />;
  };
  return (
    <g data-face>
      <circle cx={cx} cy={cy} r={r * 1.06} fill={BRASS_DARK} />
      <circle cx={cx} cy={cy} r={r} fill="#E9C58A" />
      <circle cx={cx} cy={cy} r={r} fill="url(#n9-amber)" />
      {Array.from({ length: 100 }, (_, v) => {
        const big = v % 11 === 0;
        const [x1, y1] = at(dialAngle(v), big ? 0.84 : 0.9);
        const [x2, y2] = at(dialAngle(v), 0.96);
        return <line key={v} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#5A3A1E" strokeWidth={big ? r * 0.012 : r * 0.005} />;
      })}
      {[0, 11, 22, 33, 44, 55, 66, 77, 88, 99].map((v) => {
        const [tx, ty] = at(dialAngle(v), 0.72);
        return (
          <text key={v} x={tx} y={ty + r * 0.04} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={r * 0.11} fill="#5A3A1E" transform={from === "behind" ? `translate(${2 * tx} 0) scale(-1 1)` : undefined}>
            {v}
          </text>
        );
      })}
      {/* The scratched-out 100, between 99 and 0. */}
      {(() => {
        const [tx, ty] = at(0, 0.82);
        return (
          <g data-mark="100">
            <text x={tx} y={ty + r * 0.04} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={r * 0.09} fill="#7A2A1E" transform={from === "behind" ? `translate(${2 * tx} 0) scale(-1 1)` : undefined}>
              100
            </text>
            {[-1, 0, 1].map((k) => (
              <line key={k} x1={tx - r * 0.1} y1={ty - r * 0.04 + k * r * 0.02} x2={tx + r * 0.1} y2={ty + r * 0.01 + k * r * 0.02} stroke="#3A1A10" strokeWidth={r * 0.008} />
            ))}
          </g>
        );
      })()}
      {hand(short, 0.55, r * 0.035, "#2B1A10")}
      {hand(second, 0.86, r * 0.012, "#7A2A1E")}
      <circle cx={cx} cy={cy} r={r * 0.045} fill={BRASS_DARK} />
    </g>
  );
}

export function North({ a }: { a: ArtState }) {
  return (
    <Wall s={STYLE}>
      <Glow cx={800} cy={390} r={640} tone="amber" opacity={0.6} />
      <Face a={a} cx={800} cy={390} r={340} />
      {/* The crank. */}
      <g transform={a.flags.has("hand.at100") ? "rotate(130 1350 610)" : undefined}>
        <circle cx={1350} cy={610} r={92} fill="none" stroke={BRASS} strokeWidth={14} />
        {[0, 60, 120, 180, 240, 300].map((d) => (
          <line key={d} x1={1350} y1={610} x2={1350 + Math.cos((d * Math.PI) / 180) * 90} y2={610 + Math.sin((d * Math.PI) / 180) * 90} stroke={BRASS} strokeWidth={8} />
        ))}
        <circle cx={1350} cy={610} r={18} fill={BRASS_DARK} />
        <rect x={1430} y={596} width={40} height={28} rx={10} fill={WOOD} />
      </g>
      <line x1={1350} y1={610} x2={1180} y2={560} stroke={BRASS_DARK} strokeWidth={10} opacity={a.flags.has("gears.running") ? 1 : 0.5} />
      {a.flags.has("perch.north") && <WingedClock x={800} y={52} s={0.7} />}
    </Wall>
  );
}

function Gear({ cx, cy, r, teeth, color, spin }: { cx: number; cy: number; r: number; teeth: number; color: string; spin?: "cw" | "ccw" }) {
  const path = Array.from({ length: teeth * 2 }, (_, i) => {
    const t = (i / (teeth * 2)) * Math.PI * 2;
    const rr = i % 2 === 0 ? r : r * 0.88;
    return `${i === 0 ? "M" : "L"}${(cx + Math.cos(t) * rr).toFixed(1)} ${(cy + Math.sin(t) * rr).toFixed(1)}`;
  }).join(" ");
  return (
    <g className={spin ? `n9-spin-${spin}` : undefined} style={{ transformOrigin: `${cx}px ${cy}px` }}>
      <path d={`${path} Z`} fill={color} stroke="#3A2414" strokeWidth={4} />
      <circle cx={cx} cy={cy} r={r * 0.62} fill="#000" opacity={0.18} />
      {[0, 1, 2, 3, 4].map((k) => {
        const t = (k / 5) * Math.PI * 2;
        return <circle key={k} cx={cx + Math.cos(t) * r * 0.42} cy={cy + Math.sin(t) * r * 0.42} r={r * 0.12} fill="#1F2030" />;
      })}
      <circle cx={cx} cy={cy} r={r * 0.14} fill="#3A2414" />
    </g>
  );
}

export function East({ a }: { a: ArtState }) {
  const running = a.flags.has("gears.running");
  return (
    <Wall s={STYLE}>
      <Glow cx={800} cy={420} r={600} tone="amber" opacity={0.25} />
      <Gear cx={560} cy={420} r={220} teeth={24} color={COPPER} spin={running ? "cw" : undefined} />
      <Gear cx={930} cy={300} r={150} teeth={18} color={BRASS} spin={running ? "ccw" : undefined} />
      <Gear cx={1080} cy={560} r={100} teeth={14} color={COPPER} spin={running ? "cw" : undefined} />
      {/* The empty axle (or the little clock, turning the works). */}
      <rect x={760} y={600} width={120} height={22} rx={6} fill={WOOD_DARK} />
      <rect x={810} y={540} width={20} height={70} fill="#3A2414" />
      {running ? <WingedClock x={820} y={560} s={0.75} wings={false} /> : <circle cx={820} cy={556} r={18} fill="#1F2030" stroke="#3A2414" strokeWidth={6} />}
      {/* The winding key on its nail. */}
      <circle cx={1350} cy={290} r={8} fill="#777" />
      {!a.flags.has("key.taken") && (
        <g>
          <rect x={1342} y={300} width={16} height={110} rx={6} fill={BRASS} />
          <path d="M1350 400 Q1290 420 1300 450 Q1350 440 1350 420 Q1350 440 1400 450 Q1410 420 1350 400 Z" fill={BRASS} stroke={BRASS_DARK} strokeWidth={3} />
        </g>
      )}
      {a.flags.has("perch.east") && <WingedClock x={560} y={196} s={0.7} />}
    </Wall>
  );
}

export function South({ a }: { a: ArtState }) {
  const frozen = a.extra;
  return (
    <Wall s={STYLE}>
      {frozen && (
        <g data-door100>
          <rect x={650} y={300} width={300} height={FLOOR - 300} fill="#FFE2A8" opacity={0.9} />
          <rect x={650} y={300} width={300} height={FLOOR - 300} fill="none" stroke="#FFB45C" strokeWidth={18} style={{ filter: "drop-shadow(0 0 40px #FFB45C)" }} />
          <Glow cx={800} cy={520} r={500} tone="amber" opacity={0.9} />
        </g>
      )}
      {!frozen && <rect x={650} y={300} width={300} height={FLOOR - 300} fill="none" stroke="#2A2B3B" strokeWidth={6} strokeDasharray="14 18" />}
      {/* The pendulum (frozen mid-swing in the hundredth second). */}
      <g className={frozen ? undefined : "n9-swing"} style={{ transformOrigin: "800px 30px" }} transform={frozen ? "rotate(14 800 30)" : undefined}>
        <rect x={792} y={30} width={16} height={560} fill={BRASS_DARK} />
        <circle cx={800} cy={620} r={92} fill={BRASS} stroke={BRASS_DARK} strokeWidth={8} />
        <circle cx={770} cy={590} r={24} fill="#FFFFFF" opacity={0.25} />
      </g>
      <rect x={740} y={14} width={120} height={40} rx={8} fill={WOOD_DARK} />
      {/* The chair you keep waking up in. */}
      <Shadow cx={1280} cy={FLOOR + 6} rx={130} />
      <rect x={1190} y={430} width={180} height={150} rx={12} fill={WOOD} />
      <rect x={1174} y={570} width={212} height={36} rx={8} fill="#6C6A43" />
      <rect x={1186} y={606} width={16} height={FLOOR - 606} fill={WOOD_DARK} />
      <rect x={1358} y={606} width={16} height={FLOOR - 606} fill={WOOD_DARK} />
      {a.flags.has("perch.south") && <WingedClock x={800} y={56} s={0.7} />}
    </Wall>
  );
}

export function West({ a }: { a: ArtState }) {
  const home = !a.flags.has("flown");
  return (
    <Wall s={STYLE}>
      <Lamp x={800} y={300} />
      {/* The pegboard of tools. */}
      <rect x={300} y={150} width={500} height={220} rx={8} fill="#3B2F25" />
      {Array.from({ length: 40 }, (_, i) => (
        <circle key={i} cx={320 + (i % 10) * 50} cy={172 + Math.floor(i / 10) * 50} r={4} fill="#1F1812" />
      ))}
      <g fill="#9A9A92">
        <rect x={340} y={190} width={10} height={120} rx={4} />
        <rect x={334} y={180} width={22} height={40} rx={6} fill="#C2412D" />
        <rect x={420} y={200} width={8} height={110} rx={3} />
        <circle cx={520} cy={250} r={40} fill="none" stroke="#9A9A92" strokeWidth={10} />
        <rect x={540} y={280} width={60} height={14} rx={6} transform="rotate(40 540 280)" />
        <rect x={660} y={190} width={6} height={130} />
        <rect x={680} y={190} width={6} height={130} />
      </g>
      {/* The bench. */}
      <rect x={260} y={520} width={1080} height={28} rx={4} fill={WOOD} />
      <rect x={280} y={548} width={1040} height={70} fill={WOOD_DARK} />
      <rect x={300} y={618} width={24} height={FLOOR - 618} fill={WOOD_DARK} />
      <rect x={1276} y={618} width={24} height={FLOOR - 618} fill={WOOD_DARK} />
      {/* The notepad. */}
      <g transform="rotate(-5 510 480)">
        <rect x={390} y={430} width={250} height={100} fill="#F4EEDF" stroke="#BFB49A" strokeWidth={3} />
        {[0, 1, 2, 3].map((i) => (
          <line key={i} x1={400} x2={630} y1={456 + i * 20} y2={456 + i * 20} stroke="#9CB4C8" strokeWidth={2} />
        ))}
        {NOTES.filter((n) => a.flags.has(`note.${n.id}`))
          .slice(0, 4)
          .map((n, i) => (
            <Hand key={n.id} x={404} y={452 + i * 20} size={16} anchor="start">
              {n.text}
            </Hand>
          ))}
        <rect x={600} y={500} width={70} height={8} rx={3} fill="#E0A23A" transform="rotate(-20 630 504)" />
      </g>
      {/* The little clock at home (until 77), or landed back here. */}
      {home && <WingedClock x={985} y={470} s={0.9} wings={false} />}
      {home && a.flags.has("feather") && (
        <g className="n9-feather">
          <path d="M1010 430 q20 10 10 30 q-14 -6 -10 -30 Z" fill="#F4EEDF" />
        </g>
      )}
      {!home && a.flags.has("perch.west") && <WingedClock x={985} y={470} s={0.9} />}
    </Wall>
  );
}

// -- Close-ups -------------------------------------------------------------------------------------

export function FaceCloseup({ a }: { a: ArtState }) {
  return (
    <g>
      <rect width={1600} height={900} fill="#1F2030" />
      <Glow cx={800} cy={470} r={760} tone="amber" opacity={0.7} />
      <Face a={a} cx={800} cy={520} r={480} />
    </g>
  );
}

export function NotepadCloseup({ a }: { a: ArtState }) {
  const written = NOTES.filter((n) => a.flags.has(`note.${n.id}`));
  return (
    <g>
      <rect width={1600} height={900} fill={WOOD} />
      {/* The pad: what you've written, over the faint impressions of what someone wrote on the sheet above. */}
      <rect x={120} y={90} width={780} height={740} fill="#F4EEDF" stroke="#BFB49A" strokeWidth={6} transform="rotate(-2 510 460)" />
      <g transform="rotate(-2 510 460)">
        {Array.from({ length: 13 }, (_, i) => (
          <line key={i} x1={150} x2={870} y1={250 + i * 44} y2={250 + i * 44} stroke="#9CB4C8" strokeWidth={2} />
        ))}
        <line x1={220} x2={220} y1={100} y2={820} stroke="#E0A0A0" strokeWidth={3} />
        <Hand x={510} y={190} size={58}>
          Write what you read.
        </Hand>
        <g opacity={0.13}>
          <Hand x={240} y={420} size={44} anchor="start" weight={500}>
            THE CL·· KNOWS ··· ····
          </Hand>
          <Hand x={240} y={552} size={44} anchor="start" weight={500}>
            LEAVE AT Z···
          </Hand>
          <Hand x={240} y={684} size={44} anchor="start" weight={500}>
            THE OV·· IS HON···
          </Hand>
        </g>
        {written.map((n, i) => (
          <Hand key={n.id} x={240} y={290 + i * 88} size={46} anchor="start">
            {n.text}
          </Hand>
        ))}
      </g>
      {/* What you could write. */}
      {NOTES.map((n, i) => (
        <g key={n.id} opacity={a.flags.has(`note.${n.id}`) ? 0.45 : 1}>
          <rect x={1000} y={150 + i * 100} width={500} height={84} rx={12} fill="#F4EEDF" stroke="#BFB49A" strokeWidth={3} />
          <Hand x={1250} y={204 + i * 100} size={34}>
            {n.text}
          </Hand>
        </g>
      ))}
      <rect x={1000} y={770} width={500} height={70} rx={12} fill="#3B2F25" stroke="#BFB49A" strokeWidth={3} />
      <text x={1250} y={815} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={28} fill="#F4EEDF">
        Tear off the page
      </text>
    </g>
  );
}

export const CLOCK_ROOM_ART = {
  walls: { north: North, east: East, south: South, west: West },
  closeups: { "closeup:face": FaceCloseup, "closeup:notepad": NotepadCloseup },
  /** The room's memory: low on the wall under the face, either side of the dial. */
  scratches: { wall: "north", x: 40, y: 440, width: 400, height: 300 },
} as const;
