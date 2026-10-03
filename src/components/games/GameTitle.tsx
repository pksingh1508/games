import type { CSSProperties, ElementType } from "react";
import { DIGITAL_FONT, TITLE_FONTS } from "@/games/fonts";
import type { GameInfo } from "@/games/registry";
import { cn } from "@/lib/cn";

/** A game's title in its own display font. `size` is the base size in rem. */
export function GameTitle({
  game,
  size,
  as: Tag = "h3",
  className,
}: {
  game: Pick<GameInfo, "slug" | "title">;
  size: number | string;
  as?: ElementType;
  className?: string;
}) {
  const font = TITLE_FONTS[game.slug];
  const base = typeof size === "number" ? `${size}rem` : size;
  const style: CSSProperties = {
    fontFamily: font.family,
    fontWeight: font.weight,
    fontSize: `calc(${base} * ${font.scale})`,
    letterSpacing: font.tracking,
    textTransform: font.uppercase ? "uppercase" : undefined,
  };

  // 99 Seconds: the "99" sits on a 7-segment display.
  if (game.slug === "99-seconds") {
    return (
      <Tag className={cn("leading-[0.95]", className)} style={style} aria-label={game.title}>
        <span aria-hidden className="mr-[0.18em] align-baseline text-accent" style={{ fontFamily: DIGITAL_FONT, fontWeight: 700, fontSize: "0.92em" }}>
          99
        </span>
        <span aria-hidden>Seconds</span>
      </Tag>
    );
  }

  return (
    <Tag className={cn("leading-[0.95]", className)} style={style}>
      {game.title}
    </Tag>
  );
}
