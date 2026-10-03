import { ArrowLeft, ArrowRight, Check, Clock, HeartHandshake, Target } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ViewTransition } from "react";
import { GameCard } from "@/components/games/GameCard";
import { GameTitle } from "@/components/games/GameTitle";
import { GameViewTracker } from "@/components/games/GameTrackers";
import { LocalProgress } from "@/components/games/LocalProgress";
import { StatusBadge } from "@/components/games/StatusBadge";
import { TellReveal } from "@/components/games/TellReveal";
import { ButtonLink } from "@/components/ui/Button";
import { InputIcons } from "@/components/ui/InputIcons";
import { GameCover } from "@/games/covers";
import { CATEGORY_LABELS, getGame, getNeighbours, getRelated, GAMES } from "@/games/registry";
import type { GameSlug } from "@/games/slugs";

export async function generateMetadata({ params }: PageProps<"/games/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const game = getGame(slug as GameSlug);
  return {
    title: game.title,
    description: `${game.tagline} ${game.mindTrick}`,
    openGraph: { title: game.title, description: game.tagline },
  };
}

function SectionTitle({ eyebrow, title, id }: { eyebrow: string; title: string; id?: string }) {
  return (
    <div>
      <p className="pixel-label text-[0.7rem] text-accent-ink">{eyebrow}</p>
      <h2 id={id} className="mt-3 font-display text-4xl font-extrabold leading-[0.95] tracking-tight sm:text-5xl">
        {title}
      </h2>
    </div>
  );
}

export default async function GamePage({ params }: PageProps<"/games/[slug]">) {
  const { slug } = await params;
  const game = getGame(slug as GameSlug);
  const { prev, next } = getNeighbours(game.slug);
  const related = getRelated(game.slug);
  const number = String(game.number).padStart(2, "0");

  return (
    <>
      <GameViewTracker slug={game.slug} />

      {/* Hero */}
      <section className="relative isolate overflow-clip" aria-labelledby="game-title">
        <div aria-hidden className="bg-grid absolute inset-0 -z-10 opacity-60 [mask-image:radial-gradient(ellipse_at_70%_30%,#000_10%,transparent_70%)]" />
        <div aria-hidden className="absolute -right-32 -top-32 -z-10 size-[36rem] rounded-full bg-accent/20 blur-[130px]" />
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:pt-10">
          <nav aria-label="Breadcrumb" className="font-mono text-sm text-muted">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="hover:text-ink-on-bg">Arcade</Link>
              </li>
              <li aria-hidden>/</li>
              <li>
                <Link href="/games" className="hover:text-ink-on-bg">Games</Link>
              </li>
              <li aria-hidden>/</li>
              <li aria-current="page" className="text-ink-on-bg">{game.title}</li>
            </ol>
          </nav>

          <div className="mt-10 grid items-center gap-12 lg:grid-cols-[1fr_1.05fr]">
            <div>
              <p className="pixel-label text-accent-ink">
                Game {number} / {GAMES.length} · {CATEGORY_LABELS[game.category]}
              </p>
              <GameTitle game={game} as="h1" size="clamp(3rem, 7.5vw, 6.2rem)" className="mt-5" />
              <p className="mt-6 font-display text-2xl font-bold leading-snug sm:text-3xl">“{game.tagline}”</p>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">{game.mindTrick}</p>

              <div className="mt-8 flex flex-wrap items-center gap-2.5">
                <StatusBadge status={game.status} />
                <span className="chip">
                  <Clock className="size-3" aria-hidden /> {game.session}
                </span>
                <span className="chip">{game.genre}</span>
                <div className="chip" title="Controls">
                  <InputIcons inputs={game.inputs} className="gap-1 [&_svg]:size-3.5" />
                </div>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <ButtonLink href={`/games/${game.slug}/play`} size="lg" className="max-sm:w-full" sound="coin">
                  ▶ Press Start
                </ButtonLink>
                <ButtonLink href="#how-to-play" variant="secondary" size="lg" className="max-sm:w-full">
                  How to play
                </ButtonLink>
              </div>
              {game.status === "workshop" && (
                <p className="mt-5 text-sm text-muted">This cabinet is still in the workshop. Press Start anyway, we dare you.</p>
              )}
            </div>

            <div data-live="true" className="relative">
              <div aria-hidden className="absolute -inset-6 -z-10 rounded-[3rem] bg-accent/25 blur-3xl" />
              <div className="rounded-[2.25rem] bg-[color-mix(in_oklab,var(--ink-on-bg)_10%,transparent)] p-3 ring-1 ring-line">
                <div className="overflow-hidden rounded-[1.6rem] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)]">
                  <ViewTransition name={`cover-${game.slug}`} share="morph" default="none">
                    <GameCover slug={game.slug} uid="hero" className="block aspect-[4/3] h-auto w-full" />
                  </ViewTransition>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The pitch + how it messes with your mind */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6" aria-labelledby="pitch-title">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <SectionTitle id="pitch-title" eyebrow="The pitch" title="What you're walking into" />
            <div className="mt-8 space-y-5 text-lg leading-relaxed sm:text-xl">
              {game.pitch.map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>{paragraph}</p>
              ))}
            </div>
            <p className="mt-8 text-sm text-muted">Inspired by {game.inspirations.join(", ")}.</p>
          </div>
          <div>
            <p className="pixel-label text-[0.7rem] text-accent-ink">How it messes with your mind</p>
            <ul className="mt-6 space-y-4">
              {game.hooks.map((hook, i) => (
                <li key={hook.title} className="rounded-[1.5rem] border border-line bg-surface p-6 text-ink">
                  <p className="font-mono text-xs text-muted-surface">0{i + 1}</p>
                  <p className="mt-2 font-display text-xl font-bold">{hook.title}</p>
                  <p className="mt-1.5 leading-relaxed text-muted-surface">{hook.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* How to play */}
      <section id="how-to-play" className="mx-auto max-w-7xl px-4 py-16 sm:px-6" aria-labelledby="play-title">
        <SectionTitle id="play-title" eyebrow="How to play" title="The controls" />
        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.6fr]">
          <div className="flex flex-col justify-between rounded-[var(--radius-card)] bg-accent p-7 text-on-accent">
            <Target className="size-8" aria-hidden />
            <div className="mt-10">
              <p className="pixel-label text-[0.7rem] opacity-80">Your goal</p>
              <p className="mt-2 font-display text-2xl font-extrabold leading-tight sm:text-3xl">{game.goal}</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface text-ink">
            {/* Phones get a stacked list; three table columns don't fit. */}
            <ul className="divide-y divide-[color-mix(in_oklab,var(--ink)_8%,transparent)] sm:hidden">
              {game.controls.map((row) => (
                <li key={row.action} className="px-5 py-4">
                  <p className="font-semibold">{row.action}</p>
                  <dl className="mt-2 grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-1.5 text-sm">
                    <dt className="font-mono text-xs uppercase tracking-wider text-muted-surface">Mobile</dt>
                    <dd>{row.mobile}</dd>
                    <dt className="font-mono text-xs uppercase tracking-wider text-muted-surface">Desktop</dt>
                    <dd>
                      <span className="box-decoration-clone rounded-lg bg-surface-2 px-2 py-0.5 font-mono leading-6">{row.desktop}</span>
                    </dd>
                  </dl>
                </li>
              ))}
            </ul>
            <table className="w-full text-left max-sm:hidden">
              <caption className="sr-only">Controls for {game.title}</caption>
              <thead>
                <tr className="border-b border-[color-mix(in_oklab,var(--ink)_12%,transparent)] font-mono text-xs uppercase tracking-wider text-muted-surface">
                  <th scope="col" className="px-6 py-4 font-semibold">Action</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Desktop</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Mobile</th>
                </tr>
              </thead>
              <tbody>
                {game.controls.map((row) => (
                  <tr key={row.action} className="border-b border-[color-mix(in_oklab,var(--ink)_8%,transparent)] last:border-0">
                    <th scope="row" className="px-6 py-4 font-semibold">{row.action}</th>
                    <td className="px-6 py-4">
                      <span className="box-decoration-clone rounded-lg bg-surface-2 px-2 py-1 font-mono text-sm leading-7">{row.desktop}</span>
                    </td>
                    <td className="px-6 py-4 text-muted-surface">{row.mobile}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Mind tricks */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6" aria-labelledby="tricks-title">
        <SectionTitle id="tricks-title" eyebrow="Mind tricks" title="Three lies it will tell you" />
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Every trick has a tell. Try to guess it before you reveal it.
        </p>
        <ul className="mt-10 grid gap-6 lg:grid-cols-3">
          {game.tricks.map((trick) => (
            <li key={trick.name} className="flex flex-col rounded-[var(--radius-card)] border border-line bg-surface p-7 text-ink">
              <p className="font-display text-2xl font-extrabold">{trick.name}</p>
              <dl className="mt-5 space-y-3">
                <div>
                  <dt className="pixel-label text-[0.7rem] text-muted-surface">You expect</dt>
                  <dd className="mt-1">{trick.expect}</dd>
                </div>
                <div>
                  <dt className="pixel-label text-[0.7rem] text-muted-surface">What actually happens</dt>
                  <dd className="mt-1 font-semibold">{trick.actually}</dd>
                </div>
              </dl>
              <div className="mt-auto">
                <TellReveal tell={trick.tell} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Features + comfort */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6" aria-labelledby="features-title">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <SectionTitle id="features-title" eyebrow="What's inside" title="Features" />
            <ul className="mt-10 grid gap-4 sm:grid-cols-2">
              {game.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 rounded-2xl border border-line p-4">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-accent text-on-accent">
                    <Check className="size-4" strokeWidth={3} aria-hidden />
                  </span>
                  <span className="pt-0.5 font-medium">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[var(--radius-card)] border border-line bg-surface p-7 text-ink">
            <HeartHandshake className="size-8" aria-hidden />
            <p className="mt-6 font-display text-2xl font-extrabold">Comfort & accessibility</p>
            <ul className="mt-5 space-y-3">
              {game.comfort.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-muted-surface">
                  <Check className="mt-0.5 size-4 shrink-0 text-ink" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/settings" className="mt-6 inline-block font-semibold underline underline-offset-4" data-sound="tick">
              Open comfort settings →
            </Link>
          </div>
        </div>
      </section>

      {/* Local progress */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6" aria-label="Your progress">
        <LocalProgress slug={game.slug} title={game.title} />
      </section>

      {/* More cabinets */}
      <section className="mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6" aria-labelledby="more-title">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionTitle id="more-title" eyebrow="Keep playing" title="More cabinets" />
          <div className="flex gap-3">
            <ButtonLink href={`/games/${prev.slug}`} variant="secondary" size="sm" aria-label={`Previous game: ${prev.title}`}>
              <ArrowLeft className="size-4" aria-hidden /> {prev.title}
            </ButtonLink>
            <ButtonLink href={`/games/${next.slug}`} variant="secondary" size="sm" aria-label={`Next game: ${next.title}`}>
              {next.title} <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          </div>
        </div>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((other) => (
            <li key={other.slug}>
              <GameCard game={other} uid={`related-${game.slug}-${other.slug}`} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
