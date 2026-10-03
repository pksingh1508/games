import { GameBrowser, type BrowserItem } from "@/components/games/GameBrowser";
import { GameCard } from "@/components/games/GameCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GAMES } from "@/games/registry";

export function browserItems(uidPrefix: string): BrowserItem[] {
  return GAMES.map((game) => ({
    slug: game.slug,
    title: game.title,
    genre: game.genre,
    tagline: game.tagline,
    category: game.category,
    inputs: game.inputs,
    card: <GameCard game={game} uid={`${uidPrefix}-${game.slug}`} />,
  }));
}

export function GamesSection() {
  return (
    <section id="games" className="mx-auto max-w-7xl px-4 pt-24 sm:px-6" aria-labelledby="games-title">
      <SectionHeading
        id="games-title"
        level="Level 01"
        eyebrow="Choose your cabinet"
        title={
          <>
            Fifteen ways to be <span className="text-lie">fooled</span>.
          </>
        }
        description="Each cabinet has its own rules, its own look and its own favourite lie. They're being built one at a time; open any of them to see what's coming."
      />
      <div className="mt-12">
        <GameBrowser items={browserItems("home")} rail />
      </div>
    </section>
  );
}
