import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GAMES, playableCount } from "@/games/registry";
import { cn } from "@/lib/cn";

/** Build progress: each cabinet's light turns on when its game ships. */
export function Workshop() {
  const online = playableCount();
  const percent = Math.round((online / GAMES.length) * 100);

  return (
    <section className="mx-auto max-w-7xl px-4 pt-32 sm:px-6" aria-labelledby="workshop-title">
      <div className="relative overflow-clip rounded-[2.25rem] border border-line bg-surface p-7 sm:p-12">
        <div aria-hidden className="hazard-tape absolute inset-x-0 top-0 h-2 opacity-90" />
        <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:items-center">
          <div>
            <SectionHeading
              id="workshop-title"
              level="Level 04"
              eyebrow="The workshop"
              title="Cabinets come online one at a time."
              description="Every game is fully designed and is now being built, one by one. When a cabinet's light turns on, it's ready to play."
            />
            <div className="mt-8">
              <div className="flex items-end justify-between font-mono text-sm">
                <span className="text-muted-surface">Cabinets online</span>
                <span className="text-2xl font-bold text-ink">
                  {online}
                  <span className="text-muted-surface">/{GAMES.length}</span>
                </span>
              </div>
              <div
                className="mt-3 h-4 overflow-clip rounded-full bg-bg ring-1 ring-line"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={GAMES.length}
                aria-valuenow={online}
                aria-label="Cabinets online"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent via-lie to-truth"
                  style={{ width: `${Math.max(percent, 2)}%` }}
                />
              </div>
            </div>
          </div>

          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {GAMES.map((game) => {
              const live = game.status === "playable";
              return (
                <li key={game.slug}>
                  <Link
                    href={`/games/${game.slug}`}
                    data-game={game.slug}
                    data-sound="tick"
                    className="group flex h-full flex-col items-center gap-2 rounded-2xl border border-line bg-bg p-3 text-center transition-transform hover:-translate-y-1"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "size-3.5 rounded-full",
                        live
                          ? "bg-[#C6FF3D] shadow-[0_0_14px_2px_#C6FF3D]"
                          : "bg-[color-mix(in_oklab,var(--ink-on-bg)_25%,transparent)]",
                      )}
                    />
                    <span className="text-xs font-semibold leading-tight text-ink-on-bg">{game.title}</span>
                    <span className="sr-only">{live ? "Playable" : "In the workshop"}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
