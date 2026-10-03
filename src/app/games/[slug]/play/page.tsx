import { ArrowLeft, Wrench } from "lucide-react";
import type { Metadata } from "next";
import { EagerTracker } from "@/components/games/GameTrackers";
import { GameTitle } from "@/components/games/GameTitle";
import { RandomGameButton } from "@/components/games/RandomGameButton";
import { ButtonLink } from "@/components/ui/Button";
import { GameCover } from "@/games/covers";
import { getGame } from "@/games/registry";
import type { GameSlug } from "@/games/slugs";
import { GameLoader } from "./GameLoader";

export async function generateMetadata({ params }: PageProps<"/games/[slug]/play">): Promise<Metadata> {
  const { slug } = await params;
  const game = getGame(slug as GameSlug);
  return { title: `Play ${game.title}`, robots: { index: false } };
}

/**
 * Where each game runs: playable games mount their client-only component (GameLoader). Until a
 * game is built, its cabinet is "out of order".
 */
export default async function PlayPage({ params }: PageProps<"/games/[slug]/play">) {
  const { slug } = await params;
  const game = getGame(slug as GameSlug);

  if (game.status === "playable") {
    return (
      <section aria-label={game.title}>
        <GameLoader slug={game.slug} />
      </section>
    );
  }

  return (
    <section className="relative isolate flex min-h-[calc(100dvh-4rem)] items-center overflow-clip py-16" aria-labelledby="ooo-title">
      <EagerTracker />
      <div aria-hidden className="absolute inset-0 -z-10 overflow-clip opacity-25 blur-sm grayscale">
        <GameCover
          slug={game.slug}
          uid="play-bg"
          className="absolute left-1/2 top-1/2 h-auto w-[220%] max-w-none -translate-x-1/2 -translate-y-1/2 sm:w-[140%]"
        />
      </div>
      <div aria-hidden className="absolute inset-0 -z-10 bg-bg/80" />

      <div className="mx-auto w-full max-w-3xl px-4 text-center sm:px-6">
        <div className="relative mx-auto max-w-xl">
          <div className="overflow-clip rounded-[1.75rem] opacity-70 ring-1 ring-line grayscale">
            <GameCover slug={game.slug} uid="play" className="block aspect-[4/3] h-auto w-full" />
          </div>
          {/* Out-of-order tape across the cabinet */}
          <div aria-hidden className="hazard-tape absolute left-1/2 top-1/2 h-14 w-[118%] -translate-x-1/2 -translate-y-1/2 -rotate-6 shadow-2xl" />
          <p
            aria-hidden
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-6 whitespace-nowrap rounded-lg bg-[#1B1B1B] px-5 py-2 font-pixel text-xl uppercase tracking-[0.2em] text-[#FFD23F] sm:text-2xl"
          >
            Out of order
          </p>
        </div>

        <p className="pixel-label mt-12 flex items-center justify-center gap-2 text-accent-ink">
          <Wrench className="size-4" aria-hidden /> Still in the workshop
        </p>
        <h1 id="ooo-title" className="mt-4 font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          This cabinet isn&apos;t plugged in yet.
        </h1>
        <div className="mt-3 flex justify-center text-muted">
          <GameTitle game={game} size={1.6} as="p" />
        </div>
        <p className="mx-auto mt-5 max-w-lg text-lg text-muted">
          It&apos;s fully designed and being built right now. When it&apos;s ready, pressing Start will drop you straight
          into the game.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <ButtonLink href={`/games/${game.slug}`} variant="secondary" size="lg" className="max-sm:w-full">
            <ArrowLeft className="size-5" aria-hidden /> Back to the cabinet
          </ButtonLink>
          <RandomGameButton variant="primary" className="max-sm:w-full" />
        </div>
      </div>
    </section>
  );
}
