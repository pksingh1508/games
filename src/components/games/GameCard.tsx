import Link from "next/link";
import { ViewTransition } from "react";
import { InputIcons } from "@/components/ui/InputIcons";
import { TiltCard } from "@/components/ui/TiltCard";
import { GameCover } from "@/games/covers";
import { CATEGORY_LABELS, type GameInfo } from "@/games/registry";
import { cn } from "@/lib/cn";
import { GameTitle } from "./GameTitle";
import { StatusBadge } from "./StatusBadge";

/**
 * A game "cabinet": the game's own palette, cover art and title font.
 * The cover morphs into the game page's hero when you open it (React <ViewTransition>).
 */
export function GameCard({
  game,
  uid,
  morph = true,
  className,
}: {
  game: GameInfo;
  /** Unique per instance (SVG ids). */
  uid: string;
  /** Only one card per page may own a game's morph name. */
  morph?: boolean;
  className?: string;
}) {
  const cover = <GameCover slug={game.slug} uid={uid} className="block aspect-[4/3] h-auto w-full" />;

  return (
    <TiltCard data-game={game.slug} className={cn("group h-full rounded-[var(--radius-card)]", className)}>
      <Link
        href={`/games/${game.slug}`}
        data-sound="tick"
        className="flex h-full flex-col overflow-clip rounded-[var(--radius-card)] border border-line bg-bg text-ink-on-bg outline-offset-4"
      >
        <div className="relative m-2.5 mb-0 overflow-clip rounded-[1.3rem] ring-1 ring-black/10">
          {morph ? (
            <ViewTransition name={`cover-${game.slug}`} share="morph" default="none">
              {cover}
            </ViewTransition>
          ) : (
            cover
          )}
        </div>

        <div className="@container flex flex-1 flex-col px-5 pb-5 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <p className="whitespace-nowrap font-mono text-xs font-semibold uppercase tracking-wider text-muted">
              <span className="text-ink-on-bg">#{String(game.number).padStart(2, "0")}</span> ·{" "}
              {CATEGORY_LABELS[game.category]}
            </p>
            <StatusBadge status={game.status} className="text-[0.62rem]" />
          </div>
          <GameTitle game={game} size={1.9} className="mt-3" />
          <p className="mt-1.5 text-xs font-semibold uppercase tracking-wider text-muted">{game.genre}</p>
          <p className="mt-3 text-[0.95rem] leading-snug text-muted">{game.tagline}</p>
          <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-muted">
            <span className="font-mono text-xs">{game.session}</span>
            <InputIcons inputs={game.inputs} />
          </div>
        </div>
      </Link>
    </TiltCard>
  );
}
