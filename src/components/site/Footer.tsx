import Link from "next/link";
import { GAMES } from "@/games/registry";
import { SITE } from "@/lib/site";
import { Logo } from "./Logo";

const COLUMNS = [
  {
    title: "Arcade",
    links: [
      { href: "/", label: "Home" },
      { href: "/games", label: "All games" },
      { href: "/#spot-the-tell", label: "Spot the tell" },
    ],
  },
  {
    title: "You",
    links: [
      { href: "/settings", label: "Settings" },
      { href: "/data", label: "Your data" },
    ],
  },
  {
    title: "About",
    links: [
      { href: "/about", label: "How it works" },
      { href: "/about#privacy", label: "Privacy" },
      { href: "/about#credits", label: "Credits & licences" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative mt-32 overflow-clip border-t border-line bg-[#0B0912]" data-theme="hub">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-12 pt-16 sm:px-6 lg:grid-cols-[1.2fr_2fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-sm text-muted">{SITE.tagline} Every lie has a tell.</p>
          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 font-mono text-xs text-muted">
            <span className="size-2 rounded-full bg-lie" aria-hidden />
            No cookies · No tracking · Saves stay on this device
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h2 className="pixel-label text-[0.7rem] text-lie">{column.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-muted transition-colors hover:text-ink-on-bg">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="col-span-2 sm:col-span-1">
            <h2 className="pixel-label text-[0.7rem] text-lie">Cabinets</h2>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm sm:grid-cols-1">
              {GAMES.slice(0, 6).map((game) => (
                <li key={game.slug}>
                  <Link href={`/games/${game.slug}`} className="text-muted transition-colors hover:text-ink-on-bg">
                    {game.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/games" className="font-semibold text-accent hover:underline">
                  + {GAMES.length - 6} more
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted sm:flex-row sm:px-6">
          <p>
            © {new Date().getFullYear()} {SITE.fullName}. Made with care, and a few lies.
          </p>
          <p className="font-mono text-xs">
            v{SITE.version} · <span className="animate-blink text-lie">INSERT COIN</span>
          </p>
        </div>
      </div>

      {/* Giant faded wordmark (16vw fits "Mind Games"; retune if the name changes length) */}
      <p
        aria-hidden
        className="pointer-events-none select-none whitespace-nowrap text-center font-display text-[16vw] font-extrabold leading-[0.75] tracking-tighter text-white/[0.03]"
      >
        {SITE.name}
      </p>
    </footer>
  );
}
