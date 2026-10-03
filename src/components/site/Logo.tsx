import { cn } from "@/lib/cn";
import { SITE } from "@/lib/site";

/**
 * The mark: an eye whose pupil glances sideways on hover, the same "tell" HELPER uses
 * when it lies in Don't Trust The Game.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("logo-mark", className)} aria-hidden>
      <rect width="64" height="64" rx="16" fill="#FF3D7F" />
      <rect x="5" y="5" width="54" height="54" rx="12" fill="none" stroke="#0E0B16" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M8 33 Q32 8 56 33 Q32 56 8 33 z" fill="#F5F1E8" />
      <g className="logo-pupil">
        <circle cx="32" cy="33" r="10.5" fill="#0E0B16" />
        <circle cx="36" cy="29" r="3.2" fill="#F5F1E8" />
      </g>
      <rect x="46" y="9" width="7" height="7" fill="#C6FF3D" />
    </svg>
  );
}

/** The wordmark: the dot on the "i" is a pixel (Last Pixel's missing dot). */
export function Wordmark({ className }: { className?: string }) {
  const [first, ...rest] = SITE.name.split(" ");
  return (
    <span className={cn("font-display font-extrabold tracking-tight", className)}>
      {first?.includes("i") ? (
        <>
          {first.slice(0, first.indexOf("i"))}
          <span className="relative inline-block">
            ı
            <span aria-hidden className="absolute left-1/2 top-[0.06em] size-[0.2em] -translate-x-1/2 bg-accent" />
          </span>
          {first.slice(first.indexOf("i") + 1)}
        </>
      ) : (
        first
      )}{" "}
      {rest.join(" ")}
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("group/logo inline-flex items-center gap-2.5", className)}>
      <LogoMark className="size-9 shrink-0 transition-transform duration-300 group-hover/logo:-rotate-6" />
      <span className="flex flex-col leading-none">
        <Wordmark className="text-xl text-ink-on-bg" />
        <span className="pixel-label mt-1 text-[0.6rem] text-lie">Arcade</span>
      </span>
    </span>
  );
}
