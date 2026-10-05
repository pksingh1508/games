// Chapter 2's art: the Kitchen (Plan/03-99-seconds.md §5). Pale mint walls and cream tiles, a mint enamel cooker,
// a terracotta floor. The oven's timer is honest; the wall clock over the sink loses time (its hand stutters). The
// pot's bubbles freeze while you watch: they move for a moment as you look, then stop.
import { wallClockShows } from "../rooms/kitchen";
import { FLOOR, Glow, Hand, SevenSeg, segWidth, SERIF, Shadow, Wall, pad2, type ArtState, type WallStyle } from "./kit";

const STYLE: WallStyle = {
  wall: "#B9CDB8",
  tiles: { size: 60, line: "#CFC3AC", top: 400 },
  ceiling: "#6E8273",
  floor: "#9C5B3C",
  floorTiles: "#7E4630",
  skirting: "#6E4A33",
};

const ENAMEL = "#7FA89A";
const ENAMEL_DARK = "#5E8578";
const CHROME = "#C9C9C2";
const WOOD = "#8A6440";
const WOOD_DARK = "#4A3424";

/** The lower wall is cream tiles (drawn over the mint). */
function Tiles() {
  return <rect y={400} width={1600} height={FLOOR - 400} fill="#E8DDC8" opacity={0.92} />;
}

function OvenTimer({ a, x, y, w, h }: { a: ArtState; x: number; y: number; w: number; h: number }) {
  const digitH = h * 0.62;
  const text = pad2(a.display);
  return (
    <g data-oven-timer>
      <rect x={x} y={y} width={w} height={h} rx={h * 0.15} fill="#141814" stroke="#2E3A33" strokeWidth={3} />
      <SevenSeg x={x + (w - segWidth(2, digitH)) / 2} y={y + (h - digitH) / 2} h={digitH} value={text} on="#7CFF9C" off="#16261A" />
    </g>
  );
}

function OvenContents({ a, x, y, w }: { a: ArtState; x: number; y: number; w: number }) {
  const cx = x + w / 2;
  if (a.flags.has("ice.inOven")) {
    return (
      <g>
        <rect x={cx - w * 0.18} y={y - w * 0.2} width={w * 0.36} height={w * 0.2} rx={w * 0.03} fill="#BFE3F2" opacity={0.85} />
        <Key x={cx} y={y - w * 0.1} s={w / 600} opacity={0.55} />
      </g>
    );
  }
  if (a.flags.has("key.inOven")) {
    return (
      <g>
        <ellipse cx={cx} cy={y - 6} rx={w * 0.24} ry={w * 0.03} fill="#9CC8DA" opacity={0.7} />
        <Key x={cx} y={y - 14} s={w / 600} />
      </g>
    );
  }
  return null;
}

/** A small iron key, lying flat. */
export function Key({ x, y, s = 1, opacity = 1, color = "#B08A3E" }: { x: number; y: number; s?: number; opacity?: number; color?: string }) {
  return (
    <g opacity={opacity} transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx={-60} cy={0} r={26} fill="none" stroke={color} strokeWidth={12} />
      <rect x={-36} y={-6} width={100} height={12} fill={color} />
      <rect x={44} y={6} width={10} height={20} fill={color} />
      <rect x={58} y={6} width={8} height={14} fill={color} />
    </g>
  );
}

function Pot({ a, x, y, s = 1 }: { a: ArtState; x: number; y: number; s?: number }) {
  const boiling = a.flags.has("pot.boiling");
  const heating = a.flags.has("pot.water") && a.flags.has("hob.on") && !boiling;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {boiling && (
        <g className="n9-steam" opacity={0.75}>
          {[-40, 0, 40].map((d) => (
            <path key={d} d={`M${d} -70 q-20 -40 0 -80 q20 -40 0 -80`} fill="none" stroke="#FFFFFF" strokeWidth={14} strokeLinecap="round" />
          ))}
        </g>
      )}
      {/* Steam that hangs in the air while you watch it. */}
      {heating && (
        <g opacity={0.45} data-steam="frozen">
          <path d="M-20 -60 q-14 -26 0 -52" fill="none" stroke="#FFFFFF" strokeWidth={9} strokeLinecap="round" />
          <path d="M24 -64 q12 -22 0 -44" fill="none" stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" />
        </g>
      )}
      <rect x={-90} y={-50} width={180} height={100} rx={14} fill="#A9ADA8" stroke="#6E726D" strokeWidth={4} />
      <rect x={-104} y={-56} width={208} height={16} rx={8} fill="#BFC3BE" />
      <rect x={-130} y={-36} width={44} height={12} rx={6} fill="#3A3A38" />
      <rect x={86} y={-36} width={44} height={12} rx={6} fill="#3A3A38" />
      {boiling && <rect x={-104} y={-62} width={208} height={8} rx={4} fill="#BFC3BE" className="n9-rattle" />}
    </g>
  );
}

export function North({ a }: { a: ArtState }) {
  const open = a.flags.has("oven.open");
  return (
    <Wall s={STYLE}>
      <Tiles />
      {/* The shelf of spice jars, in your handwriting. */}
      <rect x={150} y={330} width={280} height={14} fill={WOOD_DARK} />
      {["SALT", "PEPPER", "THYME", "TIME"].map((label, i) => (
        <g key={label}>
          <rect x={168 + i * 66} y={272} width={50} height={58} rx={8} fill="#E8DCC0" stroke="#8A7A5A" strokeWidth={3} />
          <rect x={172 + i * 66} y={266} width={42} height={12} rx={3} fill="#5E412A" />
          <Hand x={193 + i * 66} y={308} size={14}>
            {label}
          </Hand>
        </g>
      ))}
      {/* The hood. */}
      <path d="M560 100 L1040 100 L1090 270 L510 270 Z" fill={ENAMEL} stroke={ENAMEL_DARK} strokeWidth={4} />
      <rect x={500} y={262} width={600} height={18} rx={6} fill={ENAMEL_DARK} />
      <Glow cx={800} cy={360} r={260} opacity={0.5} />
      {/* The cooker. */}
      <rect x={500} y={470} width={600} height={FLOOR - 470} rx={16} fill={ENAMEL} stroke={ENAMEL_DARK} strokeWidth={4} />
      <rect x={496} y={462} width={608} height={30} rx={8} fill="#1F1F1F" />
      {[600, 740, 880, 1010].map((x, i) => (
        <g key={x}>
          <ellipse cx={x} cy={466} rx={52} ry={9} fill="#3A3A38" />
          {i === 0 && a.flags.has("hob.on") && (
            <g fill="#5EA8FF" opacity={0.9}>
              {[-36, -18, 0, 18, 36].map((d) => (
                <path key={d} d={`M${x + d - 6} 464 Q${x + d} 438 ${x + d + 6} 464 Z`} />
              ))}
            </g>
          )}
        </g>
      ))}
      {a.flags.has("pot.onHob") && <Pot a={a} x={650} y={410} s={0.8} />}
      {/* Knobs and the honest timer. */}
      {[580, 660, 940, 1020].map((x, i) => (
        <g key={x}>
          <circle cx={x} cy={524} r={18} fill="#E8DCC0" stroke="#55564F" strokeWidth={3} />
          <line x1={x} y1={524} x2={x + (i === 0 && a.flags.has("hob.on") ? 12 : 0)} y2={524 - (i === 0 && a.flags.has("hob.on") ? 8 : 14)} stroke="#2B2421" strokeWidth={4} strokeLinecap="round" />
        </g>
      ))}
      <OvenTimer a={a} x={730} y={503} w={140} h={44} />
      {/* The oven. */}
      {open ? (
        <g>
          <rect x={580} y={560} width={440} height={140} fill="#1E1A18" />
          {a.flags.has("oven.on") && <Glow cx={800} cy={640} r={200} tone="amber" opacity={0.7} />}
          <rect x={600} y={660} width={400} height={8} fill={CHROME} />
          <OvenContents a={a} x={600} y={660} w={400} />
          <path d="M560 700 L1040 700 L1070 750 L530 750 Z" fill="#6E978A" stroke={ENAMEL_DARK} strokeWidth={3} />
        </g>
      ) : (
        <g>
          <rect x={560} y={560} width={480} height={180} rx={10} fill="#6E978A" stroke={ENAMEL_DARK} strokeWidth={4} />
          <rect x={600} y={572} width={400} height={10} rx={5} fill={CHROME} />
          <rect x={620} y={600} width={360} height={100} rx={8} fill="#1E1E1E" />
          {a.flags.has("oven.on") && <rect x={620} y={600} width={360} height={100} rx={8} fill="#E0893A" opacity={0.35} />}
          <OvenContents a={a} x={620} y={690} w={360} />
          <rect x={620} y={600} width={360} height={100} rx={8} fill="url(#n9-glass)" />
        </g>
      )}
      <Shadow cx={800} cy={FLOOR + 8} rx={320} />
    </Wall>
  );
}

export function East() {
  return (
    <Wall s={STYLE}>
      <Tiles />
      {/* The fridge-freezer. */}
      <rect x={560} y={120} width={440} height={FLOOR - 120} rx={40} fill="#EDE4D0" stroke="#BDB39C" strokeWidth={5} />
      <line x1={566} x2={994} y1={334} y2={334} stroke="#BDB39C" strokeWidth={5} />
      <rect x={952} y={170} width={14} height={130} rx={7} fill={CHROME} stroke="#8A8A84" strokeWidth={2} />
      <rect x={952} y={370} width={14} height={200} rx={7} fill={CHROME} stroke="#8A8A84" strokeWidth={2} />
      {/* The note, in your handwriting. */}
      <g transform="rotate(-3 780 490)">
        <rect x={690} y={420} width={180} height={140} fill="#FFF8E6" stroke="#D8CCAE" strokeWidth={2} />
        <Hand x={780} y={470} size={32}>
          THE OVEN
        </Hand>
        <Hand x={780} y={505} size={32}>
          IS HONEST
        </Hand>
        <circle cx={780} cy={424} r={13} fill="#C2412D" />
      </g>
      <circle cx={640} cy={240} r={16} fill="#F2D24A" />
      <circle cx={900} cy={640} r={14} fill="#C2412D" />
      <circle cx={914} cy={628} r={6} fill="#5E7A3E" />
      {/* The calendar. */}
      <rect x={1100} y={220} width={200} height={220} fill="#F7F1E3" stroke="#BDB39C" strokeWidth={3} />
      <rect x={1100} y={220} width={200} height={40} fill="#C2412D" />
      <text x={1200} y={248} textAnchor="middle" fontFamily={SERIF} fontWeight={800} fontSize={20} fill="#FFF8E6">
        TODAY
      </text>
      {Array.from({ length: 28 }, (_, i) => {
        const cx = 1118 + (i % 7) * 27;
        const cy = 282 + Math.floor(i / 7) * 40;
        return i === 17 ? (
          <circle key={i} cx={cx + 6} cy={cy + 8} r={13} fill="none" stroke="#C2412D" strokeWidth={3} />
        ) : (
          <g key={i} stroke="#5B534D" strokeWidth={2}>
            <line x1={cx} y1={cy} x2={cx + 12} y2={cy + 14} />
            <line x1={cx + 12} y1={cy} x2={cx} y2={cy + 14} />
          </g>
        );
      })}
      <Shadow cx={780} cy={FLOOR + 6} rx={240} />
    </Wall>
  );
}

function Hatch({ a, x, y, w, h }: { a: ArtState; x: number; y: number; w: number; h: number }) {
  const melted = a.flags.has("wax.melted");
  const unlocked = a.flags.has("hatch.unlocked");
  const cx = x + w * 0.48;
  const cy = y + h * 0.5;
  const s = h / 600;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#6E4A33" stroke="#3E281A" strokeWidth={Math.max(3, 10 * s)} />
      {Array.from({ length: 6 }, (_, i) => (
        <line key={i} x1={x + (w / 6) * i} x2={x + (w / 6) * i} y1={y} y2={y + h} stroke="#3E281A" strokeWidth={Math.max(2, 6 * s)} />
      ))}
      {!melted ? (
        <path
          d={`M${cx - 110 * s} ${cy} q${20 * s} ${-90 * s} ${110 * s} ${-80 * s} q${100 * s} ${-10 * s} ${110 * s} ${80 * s} q${-10 * s} ${90 * s} ${-110 * s} ${90 * s} q${-110 * s} ${-10 * s} ${-110 * s} ${-90 * s} Z`}
          fill="#B3261E"
          stroke="#7A1610"
          strokeWidth={Math.max(2, 6 * s)}
        />
      ) : (
        <g>
          <ellipse cx={cx} cy={cy + 60 * s} rx={160 * s} ry={30 * s} fill="#B3261E" opacity={0.5} />
          <circle cx={cx} cy={cy - 20 * s} r={26 * s} fill="#111" />
          <rect x={cx - 10 * s} y={cy - 20 * s} width={20 * s} height={60 * s} fill="#111" />
          {unlocked && <Key x={cx + 60 * s} y={cy} s={s * 1.2} />}
        </g>
      )}
      <circle cx={x + w * 0.85} cy={cy} r={60 * s} fill="none" stroke="#3A3A38" strokeWidth={Math.max(3, 16 * s)} />
    </g>
  );
}

export function South({ a }: { a: ArtState }) {
  return (
    <Wall s={STYLE}>
      <Tiles />
      {/* The back door, painted shut. */}
      <rect x={1260} y={280} width={200} height={FLOOR - 280} fill={ENAMEL} stroke={ENAMEL_DARK} strokeWidth={5} />
      <rect x={1300} y={320} width={120} height={100} rx={6} fill="#2A3330" />
      {[1290, 1340, 1395, 1440].map((x, i) => (
        <path key={x} d={`M${x} 280 q4 ${30 + i * 12} 0 ${50 + i * 14}`} stroke={ENAMEL_DARK} strokeWidth={10} strokeLinecap="round" fill="none" />
      ))}
      {/* The table. */}
      <rect x={420} y={520} width={760} height={30} rx={6} fill={WOOD} />
      <path d="M430 548 L1170 548 L1180 612 L420 612 Z" fill="#E8DCC0" />
      {Array.from({ length: 19 }, (_, i) => (
        <rect key={i} x={426 + i * 40} y={548} width={20} height={64} fill="#C2412D" opacity={0.75} />
      ))}
      <rect x={450} y={612} width={22} height={FLOOR - 612} fill={WOOD_DARK} />
      <rect x={1128} y={612} width={22} height={FLOOR - 612} fill={WOOD_DARK} />
      {[620, 980].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={520} rx={70} ry={12} fill="#FBF8F1" stroke="#CFC3AC" strokeWidth={3} />
          <rect x={x + 82} y={506} width={6} height={22} fill={CHROME} />
        </g>
      ))}
      {/* Your chair, pulled out. */}
      <rect x={740} y={430} width={160} height={110} rx={10} fill={WOOD} />
      <rect x={730} y={600} width={180} height={26} rx={8} fill={WOOD} />
      <rect x={744} y={626} width={14} height={FLOOR - 626} fill={WOOD_DARK} />
      <rect x={882} y={626} width={14} height={FLOOR - 626} fill={WOOD_DARK} />
      {/* The hatch in the floor. */}
      <Hatch a={a} x={600} y={782} w={400} h={104} />
    </Wall>
  );
}

/** The slow wall clock: a dial of 0–99 with one hand, counting down by its own (wrong) reckoning. */
function SlowClock({ a, cx, cy, r }: { a: ArtState; cx: number; cy: number; r: number }) {
  const shows = wallClockShows(a.loopSeconds, a.elapsedMs);
  // It sticks, stutters and jumps.
  const stuck = Math.floor(shows);
  const angle = (stuck / 100) * 360;
  return (
    <g data-wall-clock={stuck}>
      <circle cx={cx} cy={cy} r={r + 12} fill={WOOD_DARK} />
      <circle cx={cx} cy={cy} r={r} fill="#F4EFE3" />
      {Array.from({ length: 20 }, (_, i) => {
        const t = (i / 20) * Math.PI * 2;
        const long = i % 2 === 0;
        return <line key={i} x1={cx + Math.sin(t) * r * (long ? 0.8 : 0.88)} y1={cy - Math.cos(t) * r * (long ? 0.8 : 0.88)} x2={cx + Math.sin(t) * r * 0.95} y2={cy - Math.cos(t) * r * 0.95} stroke="#2B2421" strokeWidth={long ? 4 : 2} />;
      })}
      {[0, 25, 50, 75].map((n) => {
        const t = (n / 100) * Math.PI * 2;
        return (
          <text key={n} x={cx + Math.sin(t) * r * 0.62} y={cy - Math.cos(t) * r * 0.62 + r * 0.08} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={r * 0.22} fill="#2B2421">
            {n}
          </text>
        );
      })}
      <g className="n9-stutter" style={{ transformOrigin: `${cx}px ${cy}px` }}>
        <line x1={cx} y1={cy} x2={cx + Math.sin((angle * Math.PI) / 180) * r * 0.82} y2={cy - Math.cos((angle * Math.PI) / 180) * r * 0.82} stroke="#B3261E" strokeWidth={Math.max(3, r * 0.04)} strokeLinecap="round" />
      </g>
      <circle cx={cx} cy={cy} r={r * 0.06} fill="#2B2421" />
    </g>
  );
}

export function West({ a }: { a: ArtState }) {
  const open = a.flags.has("cupboard.open");
  return (
    <Wall s={STYLE}>
      <Tiles />
      {/* The cupboard (and the mitt). */}
      <rect x={380} y={140} width={500} height={240} rx={10} fill={open ? "#4E5E55" : ENAMEL} stroke={ENAMEL_DARK} strokeWidth={4} />
      {open ? (
        <g>
          <rect x={396} y={250} width={468} height={10} fill="#3A4640" />
          {[0, 1, 2, 3].map((i) => (
            <ellipse key={i} cx={760} cy={240 - i * 8} rx={70} ry={10} fill="#FBF8F1" stroke="#CFC3AC" strokeWidth={2} />
          ))}
          {!a.flags.has("mitt.taken") && <path d="M520 330 L520 240 Q520 210 552 210 L600 210 Q630 210 630 240 L640 260 Q660 250 660 280 L640 330 Z" fill="#C2412D" stroke="#7A1610" strokeWidth={4} />}
          <path d="M380 140 L340 160 L340 400 L380 380 Z" fill={ENAMEL} stroke={ENAMEL_DARK} strokeWidth={3} />
          <path d="M880 140 L920 160 L920 400 L880 380 Z" fill={ENAMEL} stroke={ENAMEL_DARK} strokeWidth={3} />
        </g>
      ) : (
        <g>
          <line x1={630} x2={630} y1={150} y2={370} stroke={ENAMEL_DARK} strokeWidth={4} />
          <circle cx={610} cy={260} r={8} fill={CHROME} />
          <circle cx={650} cy={260} r={8} fill={CHROME} />
        </g>
      )}
      {/* The sink. */}
      <rect x={380} y={480} width={500} height={FLOOR - 480} rx={8} fill={ENAMEL} stroke={ENAMEL_DARK} strokeWidth={4} />
      <rect x={370} y={466} width={520} height={22} rx={6} fill="#D9CCAF" />
      <ellipse cx={630} cy={478} rx={150} ry={12} fill="#F2F0EA" stroke="#BDB39C" strokeWidth={3} />
      <path d="M612 470 L612 400 Q612 372 640 372 L676 372 Q690 372 690 390 L690 404" fill="none" stroke={CHROME} strokeWidth={16} strokeLinecap="round" />
      <circle cx={600} cy={452} r={10} fill={CHROME} />
      {/* The wall clock that loses time. */}
      <SlowClock a={a} cx={1150} cy={280} r={110} />
      {/* The radio, on a little shelf. */}
      <rect x={900} y={474} width={200} height={12} fill={WOOD_DARK} />
      <rect x={920} y={396} width={160} height={78} rx={14} fill="#8A5A3A" stroke="#4A2E1C" strokeWidth={3} />
      <rect x={936} y={410} width={70} height={46} rx={6} fill="#E8DCC0" />
      {Array.from({ length: 4 }, (_, i) => (
        <line key={i} x1={1020} x2={1066} y1={414 + i * 12} y2={414 + i * 12} stroke="#4A2E1C" strokeWidth={4} />
      ))}
      <line x1={952} x2={990} y1={433} y2={433} stroke="#C2412D" strokeWidth={3} />
    </Wall>
  );
}

// -- Close-ups -------------------------------------------------------------------------------------

function Burner({ on }: { on: boolean }) {
  return (
    <g>
      <ellipse cx={710} cy={560} rx={260} ry={90} fill="#2A2A28" />
      <ellipse cx={710} cy={548} rx={200} ry={66} fill="#3A3A38" stroke="#151515" strokeWidth={6} />
      {on && (
        <g fill="#5EA8FF" opacity={0.9}>
          {Array.from({ length: 16 }, (_, i) => {
            const t = (i / 16) * Math.PI * 2;
            const fx = 710 + Math.cos(t) * 196;
            const fy = 548 + Math.sin(t) * 64;
            return <path key={i} d={`M${fx - 10} ${fy} Q${fx} ${fy - 40} ${fx + 10} ${fy} Z`} />;
          })}
        </g>
      )}
    </g>
  );
}

export function StoveCloseup({ a }: { a: ArtState }) {
  const on = a.flags.has("hob.on");
  const boiling = a.flags.has("pot.boiling");
  const water = a.flags.has("pot.water");
  return (
    <g>
      <rect width={1600} height={900} fill="#E8DDC8" />
      <rect y={380} width={1600} height={520} fill="#1F1F1F" />
      <Burner on={on} />
      {a.flags.has("pot.onHob") && (
        <g>
          <path d="M450 290 L970 290 L940 600 Q710 650 480 600 Z" fill="#A9ADA8" stroke="#6E726D" strokeWidth={6} />
          <ellipse cx={710} cy={290} rx={260} ry={64} fill="#8A8E89" stroke="#6E726D" strokeWidth={6} />
          {water && <ellipse cx={710} cy={300} rx={232} ry={52} fill="#7FB2C7" />}
          {water && (on || boiling) && (
            // The bubbles: they move as you look, then freeze. Boiling, they don't stop.
            <g className={boiling ? "n9-boil" : "n9-freeze"} data-bubbles={boiling ? "boiling" : "frozen"}>
              {Array.from({ length: 14 }, (_, i) => (
                <circle key={i} cx={530 + ((i * 97) % 360)} cy={278 + ((i * 41) % 44)} r={6 + (i % 4) * 3} fill="#DDF0F7" opacity={0.9} />
              ))}
            </g>
          )}
          {boiling && (
            <g className="n9-steam" opacity={0.7}>
              {[600, 710, 820].map((x) => (
                <path key={x} d={`M${x} 230 q-30 -50 0 -100 q30 -50 0 -100`} fill="none" stroke="#FFFFFF" strokeWidth={22} strokeLinecap="round" />
              ))}
            </g>
          )}
          <rect x={360} y={350} width={100} height={24} rx={12} fill="#3A3A38" />
          <rect x={960} y={350} width={100} height={24} rx={12} fill="#3A3A38" />
        </g>
      )}
      {/* The knob. */}
      <circle cx={1200} cy={600} r={110} fill="#E8DCC0" stroke="#55564F" strokeWidth={8} />
      <rect x={1188} y={500} width={24} height={110} rx={12} fill="#2B2421" transform={on ? "rotate(60 1200 600)" : undefined} />
      <text x={1200} y={760} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={40} fill="#E8DCC0">
        {on ? "ON" : "OFF"}
      </text>
    </g>
  );
}

export function OvenCloseup({ a }: { a: ArtState }) {
  const open = a.flags.has("oven.open");
  const on = a.flags.has("oven.on");
  return (
    <g>
      <rect width={1600} height={900} fill={ENAMEL} />
      <OvenTimer a={a} x={1270} y={160} w={220} h={110} />
      {/* The dial. */}
      <circle cx={1375} cy={435} r={78} fill="#E8DCC0" stroke="#55564F" strokeWidth={6} />
      <rect x={1366} y={366} width={18} height={76} rx={9} fill="#2B2421" transform={on ? "rotate(90 1375 435)" : undefined} />
      <circle cx={1375} cy={545} r={12} fill={on ? "#FF8A3D" : "#3A3A38"} />
      {open ? (
        <g>
          <rect x={360} y={260} width={880} height={460} fill="#1E1A18" />
          {on && <Glow cx={800} cy={480} r={420} tone="amber" opacity={0.6} />}
          <rect x={430} y={580} width={740} height={16} fill={CHROME} />
          <OvenContents a={a} x={430} y={580} w={740} />
          <path d="M350 700 L1250 700 L1300 860 L300 860 Z" fill="#6E978A" stroke={ENAMEL_DARK} strokeWidth={6} />
        </g>
      ) : (
        <g>
          <rect x={350} y={300} width={900} height={520} rx={20} fill="#6E978A" stroke={ENAMEL_DARK} strokeWidth={8} />
          <rect x={420} y={320} width={760} height={24} rx={12} fill={CHROME} />
          <rect x={450} y={380} width={700} height={300} rx={14} fill="#1E1E1E" />
          {on && <rect x={450} y={380} width={700} height={300} rx={14} fill="#E0893A" opacity={0.35} />}
          <rect x={480} y={620} width={640} height={12} fill={CHROME} opacity={0.6} />
          <OvenContents a={a} x={480} y={620} w={640} />
          <rect x={450} y={380} width={700} height={300} rx={14} fill="url(#n9-glass)" />
        </g>
      )}
    </g>
  );
}

export function FreezerCloseup({ a }: { a: ArtState }) {
  return (
    <g>
      <rect width={1600} height={900} fill="#EDE4D0" />
      <rect x={300} y={140} width={1000} height={640} rx={30} fill="#DDE9EF" stroke="#BDB39C" strokeWidth={8} />
      {Array.from({ length: 12 }, (_, i) => (
        <path key={i} d={`M${320 + i * 82} 160 l20 30 l-14 18`} fill="none" stroke="#FFFFFF" strokeWidth={6} opacity={0.8} />
      ))}
      <rect x={320} y={700} width={960} height={14} fill="#C6D4DB" />
      {!a.flags.has("ice.taken") && (
        <g>
          <rect x={600} y={350} width={400} height={300} rx={26} fill="#BFE3F2" opacity={0.9} stroke="#9CC8DA" strokeWidth={6} />
          <Key x={800} y={500} s={1.4} opacity={0.6} />
          <path d="M630 380 L700 380" stroke="#FFFFFF" strokeWidth={12} strokeLinecap="round" opacity={0.8} />
        </g>
      )}
    </g>
  );
}

export function HatchCloseup({ a }: { a: ArtState }) {
  return (
    <g>
      <rect width={1600} height={900} fill="#9C5B3C" />
      {Array.from({ length: 9 }, (_, i) => (
        <line key={i} x1={i * 200} x2={i * 200} y1={0} y2={900} stroke="#7E4630" strokeWidth={5} />
      ))}
      <Hatch a={a} x={300} y={200} w={1000} h={600} />
    </g>
  );
}

export function WallClockCloseup({ a }: { a: ArtState }) {
  return (
    <g>
      <rect width={1600} height={900} fill="#B9CDB8" />
      <SlowClock a={a} cx={800} cy={450} r={330} />
    </g>
  );
}

export const KITCHEN_ART = {
  walls: { north: North, east: East, south: South, west: West },
  closeups: {
    "closeup:stove": StoveCloseup,
    "closeup:oven": OvenCloseup,
    "closeup:freezer": FreezerCloseup,
    "closeup:hatch": HatchCloseup,
    "closeup:wallclock": WallClockCloseup,
  },
  /** The room's memory: on the tiles behind the table, where you wake up. */
  scratches: { wall: "north", x: 1130, y: 300, width: 440, height: 300 },
} as const;
