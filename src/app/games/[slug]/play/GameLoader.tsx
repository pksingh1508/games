"use client";

// Games use window, canvas and audio, so they only render in the browser. `ssr: false` is only
// allowed in Client Components (Plan/README.md › Routes), hence this small loader. Each game is
// its own chunk, downloaded only when its cabinet is played.
import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { GameSlug } from "@/games/slugs";

function Loading() {
  return (
    <div className="grid min-h-[calc(100dvh-4rem)] place-items-center" role="status">
      <p className="pixel-label animate-blink text-accent-ink">Loading cabinet…</p>
    </div>
  );
}

const GAMES: Partial<Record<GameSlug, ComponentType>> = {
  nope: dynamic(() => import("@/games/nope"), { ssr: false, loading: Loading }),
  "one-tap-chaos": dynamic(() => import("@/games/one-tap-chaos"), { ssr: false, loading: Loading }),
  trapsprint: dynamic(() => import("@/games/trapsprint"), { ssr: false, loading: Loading }),
  "fake-floor": dynamic(() => import("@/games/fake-floor"), { ssr: false, loading: Loading }),
  "almost-there": dynamic(() => import("@/games/almost-there"), { ssr: false, loading: Loading }),
  "gravity-is-lying": dynamic(() => import("@/games/gravity-is-lying"), { ssr: false, loading: Loading }),
  "glitch-run": dynamic(() => import("@/games/glitch-run"), { ssr: false, loading: Loading }),
  "cursor-escape": dynamic(() => import("@/games/cursor-escape"), { ssr: false, loading: Loading }),
};

export function GameLoader({ slug }: { slug: GameSlug }) {
  const Game = GAMES[slug];
  return Game ? <Game /> : null;
}
