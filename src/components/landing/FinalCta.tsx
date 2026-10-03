import { RandomGameButton } from "@/components/games/RandomGameButton";
import { ButtonLink } from "@/components/ui/Button";

export function FinalCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-32 sm:px-6" aria-labelledby="cta-title">
      <div className="noise relative isolate overflow-clip rounded-[2.5rem] border border-line bg-surface px-6 py-20 text-center sm:px-12">
        <div aria-hidden className="absolute left-1/2 top-0 -z-10 size-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/30 blur-[120px]" />
        <div aria-hidden className="synth-floor absolute inset-x-[-30%] bottom-0 -z-10 h-40 opacity-40" />
        <p className="pixel-label text-lie">Player 1</p>
        <h2 id="cta-title" className="mx-auto mt-4 max-w-4xl text-balance font-display text-5xl font-extrabold leading-[0.92] tracking-tight sm:text-7xl">
          <span className="text-lie">Ready?</span>
          <br />
          The arcade is waiting.
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-surface">
          Pick a cabinet, or let the arcade pick for you. (It promises not to lie about this one.)
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <ButtonLink href="/games" size="lg" className="max-sm:w-full" sound="coin">
            ▶ Press Start
          </ButtonLink>
          <RandomGameButton className="max-sm:w-full" />
        </div>
        <p className="pixel-label mt-10 animate-blink text-[0.7rem] text-muted-surface">Insert coin</p>
      </div>
    </section>
  );
}
