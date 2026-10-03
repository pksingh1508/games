import type { Metadata } from "next";
import { GameBrowser } from "@/components/games/GameBrowser";
import { RandomGameButton } from "@/components/games/RandomGameButton";
import { browserItems } from "@/components/landing/GamesSection";
import { GAMES, playableCount } from "@/games/registry";

export const metadata: Metadata = {
  title: "All games",
  description: "Browse all fifteen cabinets: puzzles, platformers and arcade games that lie to you, fairly.",
};

export default function GamesPage() {
  return (
    <div className="relative">
      <div aria-hidden className="bg-grid absolute inset-x-0 top-0 -z-10 h-96 opacity-50 [mask-image:linear-gradient(to_bottom,#000,transparent)]" />
      <section className="mx-auto max-w-7xl px-4 pb-8 pt-14 sm:px-6 lg:pt-20" aria-labelledby="library-title">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="pixel-label text-accent-ink">Select a game</p>
            <h1 id="library-title" className="mt-4 font-display text-5xl font-extrabold leading-[0.92] tracking-tight sm:text-7xl">
              The arcade floor.
            </h1>
            <p className="mt-5 text-lg text-muted">
              {GAMES.length} cabinets, {playableCount()} online. Filter by type or by how you like to play, then step
              inside any of them.
            </p>
          </div>
          <RandomGameButton size="md" />
        </div>
        <div className="mt-12">
          <GameBrowser items={browserItems("library")} advanced />
        </div>
      </section>
    </div>
  );
}
