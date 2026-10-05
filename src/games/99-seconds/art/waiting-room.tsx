// Chapter 1's art: the Waiting Room (Plan/03-99-seconds.md §5). Olive wallpaper and dark wood, two wall lamps, the
// big red clock over the door. In the mirrored room every wall is drawn flipped (the sign reads backwards), the
// keypad is a spring lever, and the note behind the photo is in mirror-writing, so it reads the right way there.
import type { ReactNode } from "react";
import { FLOOR, Glow, Hand, Scratched, SevenSeg, segWidth, SERIF, Shadow, Wall, pad2, type ArtState, type WallStyle } from "./kit";

const STYLE: WallStyle = {
  wall: "#6E6B47",
  stripe: "#66633F",
  wainscot: { top: 560, color: "#4B3A2A" },
  ceiling: "#3B3727",
  floor: "#5B4030",
  boards: "#4A3324",
  skirting: "#2E2117",
};

const WOOD = "#6B4A30";
const WOOD_DARK = "#3A2A1C";
const BRASS = "#C9A55A";

const mirror = (a: ArtState) => a.room === "mirror";
const flag = (a: ArtState, normal: string, mirrored: string) => a.flags.has(mirror(a) ? mirrored : normal);

/** Text that reads the right way even when the wall it's on is drawn flipped (mirror-writing, in the mirror room). */
function Readable({ a, cx, children }: { a: ArtState; cx: number; children: ReactNode }) {
  return a.mirrored ? <g transform={`translate(${2 * cx} 0) scale(-1 1)`}>{children}</g> : <>{children}</>;
}

function Sconce({ x, y, on = true }: { x: number; y: number; on?: boolean }) {
  return (
    <g>
      {on && <Glow cx={x} cy={y + 10} r={260} />}
      <rect x={x - 6} y={y + 10} width={12} height={40} fill={WOOD_DARK} />
      <path d={`M${x - 40} ${y + 10} L${x + 40} ${y + 10} L${x + 26} ${y - 34} L${x - 26} ${y - 34} Z`} fill={on ? "#F2D7A0" : "#8B7D63"} stroke={WOOD_DARK} strokeWidth={3} />
    </g>
  );
}

/** The dark wood door, with its hinges on the wrong side (next to the handle). */
function Door({ open }: { open: boolean }) {
  return (
    <g>
      <rect x={640} y={290} width={320} height={FLOOR - 290} fill={WOOD_DARK} rx={4} />
      {open ? (
        <g>
          <rect x={652} y={302} width={296} height={FLOOR - 302} fill="#120D0A" />
          {/* Beyond it: the same room, faintly, the other way round. */}
          <g opacity={0.25}>
            <rect x={690} y={520} width={90} height={180} fill="#6E6B47" />
            <rect x={705} y={560} width={60} height={70} fill={WOOD} />
            <circle cx={880} cy={400} r={34} fill="#FF5A36" opacity={0.5} />
          </g>
          <path d={`M948 302 L908 318 L908 ${FLOOR - 14} L948 ${FLOOR}`} fill={WOOD} stroke={WOOD_DARK} strokeWidth={3} />
        </g>
      ) : (
        <g>
          <rect x={652} y={302} width={296} height={FLOOR - 302} fill={WOOD} />
          {[0, 1].map((r) => [0, 1].map((c) => <rect key={`${r}${c}`} x={680 + c * 130} y={330 + r * 210} width={110} height={180} rx={6} fill="none" stroke={WOOD_DARK} strokeOpacity={0.6} strokeWidth={6} />))}
          <circle cx={915} cy={540} r={13} fill={BRASS} />
          <rect x={909} y={548} width={12} height={22} rx={3} fill={BRASS} />
          {/* Hinges, on the same side as the handle. */}
          {[340, 530, 700].map((y) => (
            <rect key={y} x={936} y={y} width={14} height={40} rx={3} fill="#8E7A4E" stroke={WOOD_DARK} strokeWidth={2} />
          ))}
        </g>
      )}
    </g>
  );
}

function ClockPanel({ a, x, y, w, h }: { a: ArtState; x: number; y: number; w: number; h: number }) {
  const digitH = h * 0.66;
  const text = a.flags.has("glitch") ? "07" : pad2(a.display);
  const dw = segWidth(text.length, digitH);
  return (
    <g data-clock-panel>
      <rect x={x} y={y} width={w} height={h} rx={h * 0.09} fill="#141010" stroke="#2B2420" strokeWidth={6} />
      <g transform={a.flags.has("glitch") ? "translate(4 -2)" : undefined}>
        <SevenSeg x={x + (w - dw) / 2} y={y + (h - digitH) / 2} h={digitH} value={text} />
        {a.flags.has("glitch") && <SevenSeg x={x + (w - dw) / 2 - 10} y={y + (h - digitH) / 2 + 4} h={digitH} value={text} on="#36D6FF" off="transparent" glow={false} />}
      </g>
    </g>
  );
}

function Keypad({ a }: { a: ArtState }) {
  return (
    <g>
      <rect x={1010} y={450} width={100} height={160} rx={10} fill="#8A8B85" stroke="#3E3F3B" strokeWidth={3} />
      <rect x={1022} y={462} width={76} height={26} rx={3} fill="#1D2A1F" />
      {a.entry && <SevenSeg x={1028} y={467} h={16} value={a.entry.slice(-4)} on="#7CFF9C" off="transparent" glow={false} />}
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x={1024 + (i % 3) * 26} y={498 + Math.floor(i / 3) * 27} width={20} height={20} rx={3} fill="#D7D6CF" stroke="#55564F" strokeWidth={1.5} />
      ))}
    </g>
  );
}

function Lever({ a }: { a: ArtState }) {
  const down = a.flags.has("m.door");
  const charging = a.flags.has("m.charging");
  const handleY = down ? 600 : charging ? 540 : 470;
  return (
    <g>
      <rect x={1010} y={430} width={100} height={210} rx={10} fill="#5E5F5A" stroke="#2E2F2B" strokeWidth={3} />
      <rect x={1052} y={450} width={16} height={170} rx={8} fill="#1E1F1C" />
      <rect x={1048} y={handleY - 6} width={24} height={30} rx={6} fill="#9A9B95" />
      <circle cx={1060} cy={handleY} r={22} fill="#C2412D" stroke="#5A1B12" strokeWidth={3} />
      <circle cx={1030} cy={620} r={7} fill={charging ? "#FFD23F" : down ? "#7CFF9C" : "#3A3B37"} />
    </g>
  );
}

export function North({ a }: { a: ArtState }) {
  const open = flag(a, "n.door", "m.door");
  return (
    <Wall s={STYLE}>
      <Sconce x={380} y={240} />
      <Sconce x={1220} y={240} />
      <ClockPanel a={a} x={610} y={90} w={380} h={160} />
      <Door open={open} />
      {mirror(a) ? <Lever a={a} /> : <Keypad a={a} />}
      <g>
        <rect x={230} y={320} width={300} height={110} rx={8} fill="#E8DCC0" stroke={WOOD_DARK} strokeWidth={4} />
        <text x={380} y={372} textAnchor="middle" fontFamily={SERIF} fontWeight={800} fontSize={40} fill="#2B2421">
          PLEASE WAIT
        </text>
        <text x={380} y={406} textAnchor="middle" fontFamily={SERIF} fontSize={20} fill="#5B534D" letterSpacing={2}>
          YOUR TURN WILL COME
        </text>
      </g>
    </Wall>
  );
}

function Bird() {
  return (
    <g data-bird>
      <ellipse cx={950} cy={540} rx={34} ry={22} fill="#7A5634" />
      <circle cx={978} cy={520} r={15} fill="#7A5634" />
      <path d="M990 518 L1006 523 L990 528 Z" fill="#E0A23A" />
      <circle cx={982} cy={516} r={3} fill="#111" />
      <path d="M918 540 L894 530 L900 552 Z" fill="#5E4026" />
      <line x1={944} y1={560} x2={940} y2={572} stroke="#3A2A1C" strokeWidth={3} />
      <line x1={958} y1={560} x2={960} y2={572} stroke="#3A2A1C" strokeWidth={3} />
    </g>
  );
}

export function East({ a }: { a: ArtState }) {
  return (
    <Wall s={STYLE}>
      <Sconce x={260} y={260} />
      {/* The window: painted sky on bricks. */}
      <rect x={520} y={170} width={560} height={390} rx={6} fill="#E3D7BD" />
      <rect x={538} y={188} width={524} height={354} fill="#8A4B36" />
      {Array.from({ length: 12 }, (_, r) => (
        <g key={r}>
          <line x1={538} x2={1062} y1={188 + r * 30} y2={188 + r * 30} stroke="#C9B9A2" strokeOpacity={0.5} strokeWidth={3} />
          {Array.from({ length: 9 }, (_, c) => (
            <line key={c} x1={538 + c * 62 + (r % 2) * 31} x2={538 + c * 62 + (r % 2) * 31} y1={188 + r * 30} y2={218 + r * 30} stroke="#C9B9A2" strokeOpacity={0.5} strokeWidth={3} />
          ))}
        </g>
      ))}
      <rect x={538} y={188} width={524} height={300} fill="#9CC3D9" opacity={0.82} />
      <g fill="#FFFFFF" opacity={0.85}>
        <ellipse cx={660} cy={270} rx={70} ry={26} />
        <ellipse cx={710} cy={256} rx={46} ry={24} />
        <ellipse cx={930} cy={330} rx={80} ry={24} />
      </g>
      <rect x={538} y={188} width={524} height={354} fill="url(#n9-glass)" />
      <rect x={792} y={188} width={16} height={354} fill="#E3D7BD" />
      <rect x={538} y={358} width={524} height={14} fill="#E3D7BD" />
      <rect x={500} y={556} width={600} height={34} rx={4} fill="#D9CCAF" />
      {a.flags.has("bird") && <Bird />}
      {/* The radiator. */}
      <rect x={560} y={620} width={480} height={120} rx={10} fill="#8B8D88" />
      {Array.from({ length: 13 }, (_, i) => (
        <rect key={i} x={572 + i * 36} y={628} width={22} height={104} rx={8} fill="#A2A49F" />
      ))}
      {/* The plant. */}
      <rect x={1210} y={600} width={160} height={16} fill={WOOD_DARK} />
      <rect x={1222} y={616} width={12} height={FLOOR - 616} fill={WOOD_DARK} />
      <rect x={1346} y={616} width={12} height={FLOOR - 616} fill={WOOD_DARK} />
      <path d="M1215 520 L1365 520 L1350 600 L1230 600 Z" fill="#B5603F" />
      {[-60, -35, -10, 15, 40, 65].map((d, i) => (
        <path key={i} d={`M1290 525 Q${1290 + d * 1.2} ${470 - (i % 2) * 30} ${1290 + d * 2.2} ${430 + Math.abs(d) * 0.6}`} fill="none" stroke="#5E7A3E" strokeWidth={14} strokeLinecap="round" />
      ))}
      <Shadow cx={1290} cy={FLOOR + 6} rx={90} />
    </Wall>
  );
}

function Chair({ x, mine = false }: { x: number; mine?: boolean }) {
  return (
    <g>
      <Shadow cx={x + 140} cy={FLOOR + 6} rx={150} />
      <rect x={x + 20} y={400} width={240} height={170} rx={14} fill={WOOD} />
      <rect x={x + 38} y={418} width={204} height={134} rx={10} fill={mine ? "#7D7B4C" : "#6C6A43"} />
      <rect x={x} y={560} width={280} height={44} rx={10} fill={mine ? "#87844F" : "#74724A"} />
      <rect x={x + 18} y={604} width={18} height={FLOOR - 604} fill={WOOD_DARK} />
      <rect x={x + 244} y={604} width={18} height={FLOOR - 604} fill={WOOD_DARK} />
    </g>
  );
}

export function South() {
  return (
    <Wall s={STYLE}>
      <Sconce x={800} y={230} />
      {/* The side table and its magazines. */}
      <rect x={290} y={590} width={200} height={18} fill={WOOD_DARK} />
      <rect x={300} y={608} width={14} height={FLOOR - 608} fill={WOOD_DARK} />
      <rect x={466} y={608} width={14} height={FLOOR - 608} fill={WOOD_DARK} />
      <rect x={310} y={562} width={150} height={14} fill="#B5503F" transform="rotate(-4 385 569)" />
      <rect x={318} y={574} width={140} height={16} fill="#E8DCC0" />
      <text x={388} y={587} textAnchor="middle" fontSize={11} fontWeight={800} fill="#2B2421" fontFamily={SERIF}>
        TIME FLIES
      </text>
      <Chair x={600} mine />
      <Chair x={930} />
      {/* The coat rack, the coat and the hat. */}
      <rect x={1222} y={160} width={16} height={FLOOR - 160} fill={WOOD_DARK} />
      <path d="M1170 760 L1230 720 L1290 760" fill="none" stroke={WOOD_DARK} strokeWidth={14} />
      <path d="M1150 200 L1310 200" stroke={WOOD_DARK} strokeWidth={10} strokeLinecap="round" />
      <path d="M1180 205 Q1235 150 1290 205 Z" fill="#2B2421" />
      <rect x={1172} y={196} width={126} height={14} rx={6} fill="#2B2421" />
      <path d="M1144 286 L1114 304 L1108 566 L1140 572 Z" fill="#8C6A47" stroke="#6B5136" strokeWidth={3} />
      <path d="M1316 286 L1346 304 L1352 566 L1320 572 Z" fill="#8C6A47" stroke="#6B5136" strokeWidth={3} />
      <path d="M1180 228 Q1230 208 1280 228 L1316 286 L1330 628 L1130 628 L1144 286 Z" fill="#9A7650" stroke="#6B5136" strokeWidth={4} />
      <path d="M1198 226 L1230 312 L1262 226 L1250 216 L1230 266 L1210 216 Z" fill="#7E5F3F" />
      <line x1={1230} y1={312} x2={1230} y2={626} stroke="#6B5136" strokeWidth={3} />
      {[340, 400, 460, 520].map((y) => (
        <circle key={y} cx={1242} cy={y} r={6} fill="#4A3424" />
      ))}
      <rect x={1262} y={452} width={52} height={42} rx={5} fill="#8A6A47" stroke="#6B5136" strokeWidth={3} />
    </Wall>
  );
}

export function West({ a }: { a: ArtState }) {
  const lampOn = !a.flags.has("lamp.off");
  const off = flag(a, "n.photo", "m.photo");
  const s1 = flag(a, "n.s1", "m.s1");
  const s2 = flag(a, "n.s2", "m.s2");
  const ringing = a.flags.has("phone");
  return (
    <Wall s={STYLE}>
      {/* The photo (or what's behind it). */}
      {off ? (
        <g>
          <rect x={700} y={210} width={200} height={200} fill="#5F5C3E" />
          {mirror(a) ? (
            <Readable a={a} cx={800}>
              <Scratched x={800} y={325} size={46}>
                LEAVE AT ZERO
              </Scratched>
            </Readable>
          ) : (
            <>
              <Scratched x={800} y={310} size={110}>
                42
              </Scratched>
              <Scratched x={800} y={380} size={22}>
                THE CLOCK KNOWS THE REST
              </Scratched>
            </>
          )}
        </g>
      ) : (
        <g>
          <rect x={700} y={210} width={200} height={200} fill="#B08A3E" stroke={WOOD_DARK} strokeWidth={4} />
          <rect x={716} y={226} width={168} height={168} fill="#C9B48F" />
          <rect x={716} y={226} width={168} height={110} fill="#A89A73" />
          <rect x={770} y={300} width={60} height={70} fill="#6B5A40" />
          <circle cx={800} cy={290} r={16} fill="#6B5A40" />
          <rect x={760} y={240} width={80} height={28} fill="#5A4733" />
          {!s1 && <Screw x={718} y={228} />}
          {!s2 && <Screw x={882} y={392} />}
        </g>
      )}
      {/* The desk, the drawer, the lamp, the phone. */}
      {lampOn && <Glow cx={560} cy={460} r={300} />}
      <rect x={480} y={560} width={640} height={22} fill={WOOD_DARK} />
      <rect x={500} y={582} width={600} height={110} fill={WOOD} />
      <rect x={700} y={598} width={200} height={72} rx={6} fill="#5E412A" stroke={WOOD_DARK} strokeWidth={3} />
      <circle cx={800} cy={634} r={9} fill={BRASS} />
      <rect x={510} y={692} width={20} height={FLOOR - 692} fill={WOOD_DARK} />
      <rect x={1070} y={692} width={20} height={FLOOR - 692} fill={WOOD_DARK} />
      <rect x={540} y={544} width={70} height={16} rx={4} fill={BRASS} />
      <rect x={570} y={430} width={10} height={116} fill={BRASS} />
      <path d="M490 440 Q560 380 630 440 Z" fill={lampOn ? "#2E7A4E" : "#1D4A30"} stroke="#163A25" strokeWidth={3} />
      {lampOn && <ellipse cx={560} cy={442} rx={60} ry={8} fill="#FFE8B0" opacity={0.8} />}
      <g className={ringing ? "n9-ring" : undefined} data-phone={ringing ? "ringing" : "quiet"}>
        <path d="M940 560 L1090 560 L1070 508 L960 508 Z" fill="#1F1B19" />
        <circle cx={1015} cy={532} r={20} fill="#E8DCC0" />
        <circle cx={1015} cy={532} r={6} fill="#1F1B19" />
        <path d="M945 506 Q1015 470 1085 506 L1075 514 Q1015 486 955 514 Z" fill="#1F1B19" />
      </g>
      {ringing && (
        <g stroke="#FFE8B0" strokeWidth={4} strokeLinecap="round">
          <line x1={930} y1={490} x2={910} y2={474} />
          <line x1={1100} y1={490} x2={1120} y2={474} />
        </g>
      )}
    </Wall>
  );
}

function Screw({ x, y, r = 10 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="#C9C9C2" stroke="#55564F" strokeWidth={r * 0.2} />
      <line x1={x - r * 0.7} y1={y - r * 0.3} x2={x + r * 0.7} y2={y + r * 0.3} stroke="#55564F" strokeWidth={r * 0.25} strokeLinecap="round" />
    </g>
  );
}

// -- Close-ups -------------------------------------------------------------------------------------

export function ClockCloseup({ a }: { a: ArtState }) {
  return (
    <g>
      <rect width={1600} height={900} fill="#5F5C3E" />
      <Glow cx={800} cy={450} r={700} tone="amber" opacity={0.35} />
      <ClockPanel a={a} x={300} y={200} w={1000} h={500} />
    </g>
  );
}

export function KeypadCloseup({ a }: { a: ArtState }) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "✓"];
  return (
    <g>
      <rect width={1600} height={900} fill="#5F5C3E" />
      <rect x={520} y={90} width={540} height={720} rx={30} fill="#8A8B85" stroke="#3E3F3B" strokeWidth={6} />
      <rect x={560} y={120} width={460} height={120} rx={10} fill="#1D2A1F" />
      {a.entry && <SevenSeg x={590} y={145} h={70} value={a.entry.slice(-4)} on="#7CFF9C" off="transparent" />}
      {keys.map((k, i) => (
        <g key={k}>
          <rect x={560 + (i % 3) * 160} y={270 + Math.floor(i / 3) * 130} width={140} height={120} rx={14} fill={k === "✓" ? "#6FAF7A" : k === "C" ? "#C9776A" : "#E4E3DC"} stroke="#55564F" strokeWidth={4} />
          <text x={630 + (i % 3) * 160} y={348 + Math.floor(i / 3) * 130} textAnchor="middle" fontFamily={SERIF} fontWeight={800} fontSize={56} fill="#2B2421">
            {k}
          </text>
        </g>
      ))}
    </g>
  );
}

export function PhotoCloseup({ a }: { a: ArtState }) {
  const off = flag(a, "n.photo", "m.photo");
  const s1 = flag(a, "n.s1", "m.s1");
  const s2 = flag(a, "n.s2", "m.s2");
  return (
    <g>
      <rect width={1600} height={900} fill="#6E6B47" />
      {Array.from({ length: 27 }, (_, i) => (
        <rect key={i} x={i * 60 + 18} width={24} height={900} fill="#66633F" />
      ))}
      {off ? (
        <g>
          <rect x={450} y={120} width={700} height={660} fill="#5F5C3E" />
          {mirror(a) ? (
            <Scratched x={800} y={480} size={120}>
              LEAVE AT ZERO
            </Scratched>
          ) : (
            <>
              <Scratched x={800} y={470} size={300} rotate={-3}>
                42
              </Scratched>
              <Hand x={800} y={640} size={64} color="#EDE3CF" rotate={-2}>
                THE CLOCK KNOWS THE REST
              </Hand>
            </>
          )}
        </g>
      ) : (
        <g>
          <rect x={450} y={120} width={700} height={660} fill="#B08A3E" stroke={WOOD_DARK} strokeWidth={8} />
          <rect x={500} y={170} width={600} height={560} fill="#C9B48F" />
          {/* The photo: this room, with someone asleep in the chair. */}
          <rect x={500} y={170} width={600} height={380} fill="#A89A73" />
          <rect x={720} y={190} width={160} height={70} rx={8} fill="#3A2A1C" />
          <SevenSeg x={750} y={200} h={50} value="99" on="#5A3A2A" off="transparent" glow={false} />
          <rect x={700} y={430} width={200} height={140} rx={8} fill="#6B5A40" />
          <rect x={690} y={560} width={220} height={40} rx={8} fill="#7A684B" />
          <circle cx={800} cy={470} r={34} fill="#4A3B2C" />
          <path d="M760 500 Q800 560 840 500 L850 570 L750 570 Z" fill="#4A3B2C" />
          {!s1 && <Screw x={520} y={190} r={34} />}
          {!s2 && <Screw x={1080} y={710} r={34} />}
          {s1 && <circle cx={520} cy={190} r={14} fill="#2A1E14" />}
          {s2 && <circle cx={1080} cy={710} r={14} fill="#2A1E14" />}
        </g>
      )}
    </g>
  );
}

export function DrawerCloseup({ a }: { a: ArtState }) {
  const marks = Math.min(240, a.loops + 1);
  return (
    <g>
      <rect width={1600} height={900} fill={WOOD_DARK} />
      <rect x={260} y={160} width={1080} height={600} rx={10} fill="#5E412A" />
      <rect x={320} y={220} width={960} height={460} fill="#EFE6D2" transform="rotate(-1.5 800 450)" />
      <g transform="rotate(-1.5 800 450)" stroke="#3A3330" strokeWidth={6} strokeLinecap="round">
        {Array.from({ length: marks }, (_, i) => {
          const group = Math.floor(i / 5);
          const inGroup = i % 5;
          const col = group % 12;
          const row = Math.floor(group / 12);
          const gx = 360 + col * 76;
          const gy = 260 + row * 96;
          if (inGroup === 4) return <line key={i} x1={gx - 8} y1={gy + 64} x2={gx + 52} y2={gy + 6} />;
          return <line key={i} x1={gx + inGroup * 12} y1={gy} x2={gx + inGroup * 12 + 2} y2={gy + 70} />;
        })}
      </g>
    </g>
  );
}

export function DoorwayCloseup({ a }: { a: ArtState }) {
  const glowing = a.left <= 3;
  return (
    <g>
      <rect width={1600} height={900} fill="#120D0A" />
      {/* Beyond the door: the room again, the right way round. */}
      <g transform="translate(520 160) scale(0.35)" opacity={0.9}>
        <rect width={1600} height={900} fill="#6E6B47" />
        <rect y={560} width={1600} height={200} fill="#4B3A2A" />
        <rect y={760} width={1600} height={140} fill="#5B4030" />
        <Chair x={600} mine />
        <path d="M1180 228 Q1230 208 1280 228 L1316 286 L1330 628 L1130 628 L1144 286 Z" fill="#9A7650" />
      </g>
      <rect x={520} y={160} width={560} height={315} fill="#000" opacity={0.25} />
      {/* The frame around you, and the door leaning on your shoulder. */}
      <rect x={380} y={60} width={140} height={840} fill={WOOD_DARK} />
      <rect x={1080} y={60} width={140} height={840} fill={WOOD_DARK} />
      <rect x={380} y={40} width={840} height={120} fill={WOOD_DARK} />
      <path d="M0 0 L380 60 L380 900 L0 900 Z" fill={WOOD} />
      {glowing && (
        <g className="n9-frame-glow">
          <rect x={380} y={40} width={840} height={860} fill="none" stroke="#FFB45C" strokeWidth={28} opacity={0.9} style={{ filter: "drop-shadow(0 0 30px #FFB45C)" }} />
        </g>
      )}
    </g>
  );
}

export const WAITING_ROOM_ART = {
  walls: { north: North, east: East, south: South, west: West },
  closeups: {
    "closeup:clock": ClockCloseup,
    "closeup:keypad": KeypadCloseup,
    "closeup:photo": PhotoCloseup,
    "closeup:drawer": DrawerCloseup,
    "closeup:doorway": DoorwayCloseup,
  },
  /** Where the room's memory scratches go: the wall you wake up facing, left of the door. */
  scratches: { wall: "north", x: 110, y: 470, width: 470, height: 270 },
} as const;
