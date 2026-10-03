import { Accessibility, HardDrive, UserX, WifiOff } from "lucide-react";
import { GameTitle } from "@/components/games/GameTitle";
import { ButtonLink } from "@/components/ui/Button";
import { GameCover } from "@/games/covers";
import { getGame } from "@/games/registry";
import type { GameSlug } from "@/games/slugs";

const COLUMN_A: GameSlug[] = ["nope", "glitch-run", "last-pixel", "wrong-door"];
const COLUMN_B: GameSlug[] = ["one-more-step", "dont-blink", "trapsprint", "one-tap-chaos"];

function WallTile({ slug, uid }: { slug: GameSlug; uid: string }) {
  const game = getGame(slug);
  return (
    <div data-game={slug} className="group overflow-clip rounded-2xl border border-white/10 bg-bg shadow-[0_24px_50px_-20px_rgba(0,0,0,0.8)]">
      <GameCover slug={slug} uid={uid} className="block aspect-[4/3] h-auto w-full" />
      <div className="px-3.5 py-2.5 text-ink-on-bg">
        <GameTitle game={game} size={1.05} as="p" />
      </div>
    </div>
  );
}

/** Two endless columns of game cabinets, tilted in 3D. Decorative. */
function HeroWall() {
  return (
    <div aria-hidden className="relative h-[26rem] [perspective:1400px] sm:h-[32rem] lg:h-[38rem]">
      <div className="fade-y absolute inset-0 grid grid-cols-2 gap-4 [transform:rotateX(16deg)_rotateY(-18deg)_rotateZ(5deg)] sm:gap-5">
        <div className="flex animate-wall-up flex-col gap-4 sm:gap-5">
          {[...COLUMN_A, ...COLUMN_A].map((slug, i) => (
            <WallTile key={`${slug}-${i}`} slug={slug} uid={`wall-a-${i}`} />
          ))}
        </div>
        <div className="mt-24 flex animate-wall-down flex-col gap-4 sm:gap-5">
          {[...COLUMN_B, ...COLUMN_B].map((slug, i) => (
            <WallTile key={`${slug}-${i}`} slug={slug} uid={`wall-b-${i}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

const PROMISES = [
  { icon: UserX, label: "No accounts" },
  { icon: HardDrive, label: "Saves stay on your device" },
  { icon: WifiOff, label: "Plays offline" },
  { icon: Accessibility, label: "Comfort settings" },
];

export function Hero() {
  return (
    <section className="noise relative isolate overflow-clip" aria-labelledby="hero-title">
      <div aria-hidden className="absolute -left-48 -top-48 -z-10 size-[40rem] rounded-full bg-accent/25 blur-[140px]" />
      <div aria-hidden className="absolute -right-40 top-24 -z-10 size-[34rem] rounded-full bg-truth/15 blur-[140px]" />
      <div
        aria-hidden
        className="bg-grid absolute inset-0 -z-10 opacity-70 [mask-image:radial-gradient(ellipse_at_30%_20%,#000_15%,transparent_70%)]"
      />

      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-24 pt-12 sm:px-6 lg:grid-cols-[1.25fr_1fr] lg:gap-6 lg:pb-28 lg:pt-16">
        {/* A size container: the headline scales to its column, so its lines never re-wrap. */}
        <div className="@container">
          <p className="chip animate-rise border-white/15 bg-white/5">
            <span className="size-2 animate-blink rounded-full bg-lie" aria-hidden />
            15 games <span className="max-sm:hidden">· 0 accounts </span>· every lie has a tell
          </p>

          <h1
            id="hero-title"
            className="mt-7 animate-rise font-display text-[clamp(2.6rem,14cqi,7.4rem)] font-extrabold leading-[0.88] tracking-[-0.035em] [animation-delay:80ms]"
          >
            <span className="block whitespace-nowrap">Fifteen games</span>
            <span className="block whitespace-nowrap">
              that <span className="relative inline-block text-lie [text-shadow:-3px_0_0_#FF3D7F,3px_0_0_#3DE0FF]">lie</span>
            </span>
            <span className="block whitespace-nowrap">
              to you.{" "}
              <span className="ml-[0.1em] inline-block -translate-y-[0.12em] -rotate-3 rounded-[0.35em] bg-accent px-[0.35em] pb-[0.08em] pt-[0.02em] align-middle text-[0.42em] tracking-tight text-on-accent shadow-[0_0.14em_0_0_var(--accent-deep)]">
                Fairly.
              </span>
            </span>
          </h1>

          <p className="mt-8 max-w-xl animate-rise text-lg leading-relaxed text-muted [animation-delay:160ms] sm:text-xl">
            Puzzles, platformers and party tricks where the floor is fake, the exit runs away and gravity
            points the wrong way. Every trick has a tell. Spot it, and you win.
          </p>

          <div className="mt-10 flex animate-rise flex-wrap items-center gap-4 [animation-delay:240ms]">
            <ButtonLink href="#games" size="lg" sound="coin" className="max-sm:w-full">
              ▶ Press Start
            </ButtonLink>
            <ButtonLink href="#spot-the-tell" variant="secondary" size="lg" className="max-sm:w-full">
              Spot the tell
            </ButtonLink>
          </div>

          <ul className="mt-10 flex animate-rise flex-wrap gap-x-6 gap-y-3 text-sm text-muted [animation-delay:320ms]">
            {PROMISES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2">
                <Icon className="size-4 text-truth" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <HeroWall />
      </div>

      <div aria-hidden className="synth-floor absolute inset-x-[-25%] bottom-0 -z-10 h-56 opacity-50" />
    </section>
  );
}
