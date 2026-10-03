import { COVER_VIEWBOX, type CoverProps } from "./types";

/** Pixel-art rectangles on an 8 px grid. */
function Px({ x, y, w = 1, h = 1, fill }: { x: number; y: number; w?: number; h?: number; fill: string }) {
  return <rect x={x * 8} y={y * 8} width={w * 8} height={h * 8} fill={fill} />;
}

export function TrapSprintCover({ className }: CoverProps) {
  return (
    <svg
      viewBox={COVER_VIEWBOX}
      className={className}
      data-cover
      shapeRendering="crispEdges"
      role="img"
      aria-label="A pixel-art runner leaps over spikes popping out of the grass. The exit door rolls away on tiny wheels and a saw blade flies in."
    >
      <rect width="480" height="360" fill="#9AD8FF" />
      {/* Pixel clouds */}
      <g fill="#FFFFFF">
        <Px x={6} y={6} w={6} h={2} fill="#FFFFFF" />
        <Px x={8} y={5} w={3} h={1} fill="#FFFFFF" />
        <Px x={30} y={9} w={7} h={2} fill="#FFFFFF" />
        <Px x={32} y={8} w={3} h={1} fill="#FFFFFF" />
      </g>

      {/* Ground */}
      <rect y="272" width="480" height="14" fill="#7BE07B" />
      <rect y="270" width="480" height="4" fill="#A6F0A6" />
      <rect y="286" width="480" height="74" fill="#8B5A2B" />
      {Array.from({ length: 18 }, (_, i) => (
        <rect key={i} x={(i * 67) % 472} y={300 + ((i * 29) % 52)} width="8" height="8" fill="#6B3F1A" />
      ))}

      {/* Pop spikes */}
      <rect x="204" y="270" width="64" height="6" fill="#23153C" />
      <g className="cover-anim cv-pop" shapeRendering="geometricPrecision">
        {[0, 1, 2, 3].map((i) => (
          <path key={i} d={`M${206 + i * 15} 270 l7.5 -26 l7.5 26 z`} fill="#E8E8F0" stroke="#23153C" strokeWidth="2.5" strokeLinejoin="round" />
        ))}
      </g>

      {/* The runner, mid-jump */}
      <g className="cover-anim cv-bob">
        <Px x={18} y={21} w={3} h={3} fill="#FFD7B5" />
        <Px x={20} y={22} w={1} h={1} fill="#23153C" />
        <Px x={17} y={20} w={5} h={1} fill="#C8224B" />
        <Px x={17} y={24} w={4} h={4} fill="#C8224B" />
        <Px x={21} y={24} w={2} h={1} fill="#FFD7B5" />
        <Px x={16} y={25} w={1} h={2} fill="#FFD7B5" />
        <Px x={16} y={28} w={2} h={1} fill="#23153C" />
        <Px x={20} y={28} w={2} h={1} fill="#23153C" />
      </g>

      {/* The runaway door on wheels */}
      <g className="cover-anim cv-roll">
        <rect x="372" y="196" width="56" height="70" fill="#4A2A10" />
        <rect x="378" y="202" width="44" height="64" fill="#8B5A2B" />
        <rect x="384" y="210" width="32" height="22" fill="#6B3F1A" />
        <rect x="384" y="238" width="32" height="20" fill="#6B3F1A" />
        <rect x="410" y="232" width="6" height="6" fill="#FFD23F" />
        <circle cx="384" cy="270" r="7" fill="#23153C" shapeRendering="geometricPrecision" />
        <circle cx="416" cy="270" r="7" fill="#23153C" shapeRendering="geometricPrecision" />
        <rect x="438" y="212" width="16" height="4" fill="#FFFFFF" />
        <rect x="442" y="228" width="22" height="4" fill="#FFFFFF" />
        <rect x="438" y="244" width="14" height="4" fill="#FFFFFF" />
      </g>

      {/* Saw */}
      <rect x="452" y="60" width="28" height="64" fill="#5A6672" />
      <g className="cover-anim cv-spin" shapeRendering="geometricPrecision">
        <circle cx="430" cy="92" r="28" fill="#B8C2CC" />
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i / 10) * Math.PI * 2;
          const p = (angle: number, r: number) =>
            `${(430 + Math.cos(angle) * r).toFixed(1)} ${(92 + Math.sin(angle) * r).toFixed(1)}`;
          return <path key={i} d={`M${p(a, 28)} L${p(a + 0.3, 38)} L${p(a + 0.55, 27)} z`} fill="#B8C2CC" />;
        })}
        <circle cx="430" cy="92" r="9" fill="#5A6672" />
      </g>

      {/* HUD: deaths and timer */}
      <g>
        <Px x={3} y={3} w={3} h={2} fill="#23153C" />
        <Px x={2} y={4} w={1} h={2} fill="#23153C" />
        <Px x={6} y={4} w={1} h={2} fill="#23153C" />
        <Px x={3} y={6} w={3} h={1} fill="#23153C" />
        <Px x={3} y={4} w={1} h={1} fill="#9AD8FF" />
        <Px x={5} y={4} w={1} h={1} fill="#9AD8FF" />
        <text x="66" y="54" fontSize="22" fill="#23153C" fontFamily="var(--font-g-press-start)">
          41
        </text>
        <text x="458" y="40" textAnchor="end" fontSize="16" fill="#23153C" fontFamily="var(--font-g-press-start)">
          06.12
        </text>
      </g>
    </svg>
  );
}
