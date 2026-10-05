// A small picture for each thing you can carry (the pockets bar, and the item you're dragging).
import type { ReactNode } from "react";

const svg = (children: ReactNode) => (
  <svg viewBox="0 0 64 64" aria-hidden>
    {children}
  </svg>
);

const Pot = ({ water, steam }: { water?: string; steam?: boolean }) =>
  svg(
    <>
      {steam && <path d="M24 16 q-4 -6 0 -12 M36 16 q4 -6 0 -12" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />}
      <rect x="10" y="22" width="44" height="30" rx="5" fill="#A9ADA8" stroke="#6E726D" strokeWidth="2" />
      <rect x="2" y="26" width="10" height="5" rx="2" fill="#3A3A38" />
      <rect x="52" y="26" width="10" height="5" rx="2" fill="#3A3A38" />
      {water && <rect x="13" y="24" width="38" height="6" rx="2" fill={water} />}
    </>,
  );

const Key = ({ color = "#C9A55A" }: { color?: string }) =>
  svg(
    <g fill="none" stroke={color} strokeWidth="5" strokeLinecap="round">
      <circle cx="18" cy="32" r="9" />
      <path d="M27 32 H56 M48 32 v8 M54 32 v6" />
    </g>,
  );

const LittleClock = ({ wings }: { wings: boolean }) =>
  svg(
    <>
      {wings && <path d="M16 28 Q2 10 4 30 Q10 24 14 34 Z M48 28 Q62 10 60 30 Q54 24 50 34 Z" fill="#F4EEDF" stroke="#BFB49A" strokeWidth="1.5" />}
      <path d="M16 54 V30 Q16 14 32 14 Q48 14 48 30 V54 Z" fill="#5A3E28" />
      <circle cx="32" cy="34" r="11" fill="#F4EFE3" stroke="#B08A3E" strokeWidth="2" />
      <path d="M32 34 V26 M32 34 L38 37" stroke="#2B2421" strokeWidth="2" strokeLinecap="round" />
    </>,
  );

export const ITEM_ICONS: Record<string, () => ReactNode> = {
  coin: () =>
    svg(
      <>
        <circle cx="32" cy="32" r="20" fill="#C9A55A" stroke="#8E7A4E" strokeWidth="3" />
        <circle cx="32" cy="32" r="13" fill="none" stroke="#8E7A4E" strokeWidth="2" />
        <path d="M27 36 L37 28" stroke="#8E7A4E" strokeWidth="3" strokeLinecap="round" />
      </>,
    ),
  pot: () => <Pot />,
  water: () => <Pot water="#7FB2C7" />,
  boiling: () => <Pot water="#DDF0F7" steam />,
  ice: () =>
    svg(
      <>
        <rect x="10" y="14" width="44" height="36" rx="6" fill="#BFE3F2" stroke="#9CC8DA" strokeWidth="2" />
        <g opacity="0.55" fill="none" stroke="#B08A3E" strokeWidth="3">
          <circle cx="24" cy="32" r="5" />
          <path d="M29 32 H46" />
        </g>
      </>,
    ),
  key: () => <Key />,
  mitt: () => svg(<path d="M18 56 V26 Q18 12 30 12 H38 Q46 12 46 22 L48 28 Q56 24 56 34 L48 56 Z" fill="#C2412D" stroke="#7A1610" strokeWidth="2.5" />),
  flyer: () => <LittleClock wings />,
  wound: () => <LittleClock wings={false} />,
};

/** The winding key in Chapter 3 is a different key from the kitchen's. */
export function itemIcon(chapter: string, id: string): ReactNode {
  if (chapter === "clock-room" && id === "key") return <Key color="#B08A3E" />;
  return ITEM_ICONS[id]?.() ?? null;
}
