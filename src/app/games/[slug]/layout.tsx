import { notFound } from "next/navigation";
import { GAME_SLUGS, isGameSlug } from "@/games/slugs";

// Every game page is prerendered at build time (static export). Unknown slugs are a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return GAME_SLUGS.map((slug) => ({ slug }));
}

/** Everything under /games/<slug> wears that game's palette. */
export default async function GameLayout({ children, params }: LayoutProps<"/games/[slug]">) {
  const { slug } = await params;
  if (!isGameSlug(slug)) notFound();
  // -mb-32/pb-32 runs the palette under the footer's mt-32, so no hub-coloured gap shows.
  return (
    <div data-game={slug} className="relative -mb-32 bg-bg pb-32 text-ink-on-bg">
      {children}
    </div>
  );
}
