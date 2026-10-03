import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "How it works",
  description: "The idea behind the arcade, the rules every game follows, how your privacy works, and credits.",
};

const STORED = [
  ["Settings", "Sound, motion, flashing, text size and colour vision."],
  ["Achievements & visits", "Which achievements you've unlocked, and how many times you've visited."],
  ["Game saves", "Progress, stars, medals and stats for each game you play."],
  ["Replays & history", "Ghosts, replays and run history, stored in the browser's database (IndexedDB)."],
];

const FONTS = [
  "Bricolage Grotesque",
  "Geist",
  "Geist Mono",
  "Pixelify Sans",
  "Fredoka",
  "Bangers",
  "Fraunces",
  "Baloo 2",
  "Press Start 2P",
  "Rubik Glitch",
  "Silkscreen",
  "Bungee",
  "Rubik",
  "VT323",
  "Limelight",
  "Cormorant SC",
  "Lexend",
];

const LIBRARIES = [
  ["Next.js", "MIT"],
  ["React", "MIT"],
  ["Tailwind CSS", "MIT"],
  ["Motion", "MIT"],
  ["Radix UI", "MIT"],
  ["Lucide icons", "ISC"],
  ["Valibot", "MIT"],
  ["idb", "ISC"],
  ["ZzFX (sound effects)", "MIT"],
  ["canvas-confetti", "ISC"],
  ["Serwist (offline support)", "MIT"],
];

function Block({ id, eyebrow, title, children }: { id?: string; eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-line py-14" aria-labelledby={id ? `${id}-title` : undefined}>
      <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
        <div>
          <p className="pixel-label text-[0.7rem] text-accent-ink">{eyebrow}</p>
          <h2 id={id ? `${id}-title` : undefined} className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            {title}
          </h2>
        </div>
        <div className="space-y-5 text-lg leading-relaxed text-muted [&_strong]:text-ink-on-bg">{children}</div>
      </div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-14 sm:px-6 lg:pt-20">
      <header className="max-w-3xl pb-14">
        <p className="pixel-label text-accent-ink">Manual</p>
        <h1 className="mt-4 font-display text-5xl font-extrabold leading-[0.92] tracking-tight sm:text-7xl">How the arcade works</h1>
        <p className="mt-6 text-xl leading-relaxed text-muted">
          {SITE.fullName} is a collection of fifteen short browser games that lie to you, trap you and turn your own habits
          against you. Every one of them plays fair.
        </p>
      </header>

      <Block eyebrow="The idea" title="Games that fool you, fairly">
        <p>
          Each game is built around one mind trick: an exit door that runs away, a floor that isn&apos;t there, a clock
          that lies, a narrator who shouldn&apos;t be trusted. The fun is in noticing.
        </p>
        <p>
          So every trick comes with a <strong>tell</strong>: a missing shadow, a sideways glance, a fuse that&apos;s green
          instead of red. Fair trolling makes people laugh. Unfair trolling makes them quit.
        </p>
      </Block>

      <Block eyebrow="House rules" title="What every game promises">
        <ul className="space-y-3">
          <li><strong>Every lie has a tell.</strong> There&apos;s always a clue a sharp player could have noticed.</li>
          <li><strong>Fail fast, retry faster.</strong> Restarts take less than half a second.</li>
          <li><strong>Teach, then betray.</strong> Rules twist only after a hint that they might.</li>
          <li><strong>Short sessions.</strong> A level or run takes between 30 seconds and 5 minutes.</li>
          <li><strong>Desktop and mobile.</strong> Every trick has a touch version that&apos;s just as fair.</li>
          <li><strong>Comfort settings always win.</strong> Motion, flashing, jump scares and volume are yours to control.</li>
        </ul>
      </Block>

      <Block id="privacy" eyebrow="Privacy" title="Your data stays on your device">
        <p>
          The arcade has <strong>no accounts, no database, no cookies and no analytics</strong>. The website is just
          files. Your browser downloads them, and from then on everything happens on your device.
        </p>
        <p>What gets stored, in this browser only:</p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {STORED.map(([title, text]) => (
            <li key={title} className="rounded-2xl border border-line bg-surface p-4 text-base text-muted-surface">
              <span className="block font-display font-bold text-ink">{title}</span>
              {text}
            </li>
          ))}
        </ul>
        <p>
          Nothing leaves your device unless you choose to share it, for example by downloading a save file or sharing a
          challenge link. Fonts are bundled with the site, so even they don&apos;t phone home.
        </p>
        <p>
          Browsers can clear site data on their own (Safari does after 7 days without a visit, unless the site is installed),
          so the <Link href="/data" className="font-semibold text-ink-on-bg underline underline-offset-4">Your Data</Link> page
          lets you export a backup, import it elsewhere, or delete everything.
        </p>
      </Block>

      <Block eyebrow="Accessibility" title="Built to be comfortable">
        <p>
          Reduce motion, reduce flashing, jump scares, text size and colour vision live in{" "}
          <Link href="/settings" className="font-semibold text-ink-on-bg underline underline-offset-4">Settings</Link>, and
          they apply before the page even appears. Nothing in the arcade relies on colour alone, every game can be played by
          touch, and menus work with a keyboard and screen readers.
        </p>
      </Block>

      <Block id="credits" eyebrow="Credits" title="Fonts, libraries & licences">
        <div>
          <p>
            <strong>Fonts</strong> (SIL Open Font License 1.1). Bundled with the site at build time:
          </p>
          <p className="mt-3 text-base">{FONTS.join(" · ")} · DSEG7 (by keshikan)</p>
          <p className="mt-3 text-base">
            Licence texts:{" "}
            <a href="https://openfontlicense.org" className="font-semibold text-ink-on-bg underline underline-offset-4" rel="noreferrer" target="_blank">
              openfontlicense.org
            </a>{" "}
            ·{" "}
            <a href="/licenses/DSEG-LICENSE.txt" className="font-semibold text-ink-on-bg underline underline-offset-4">
              DSEG licence
            </a>
          </p>
        </div>
        <div>
          <p>
            <strong>Open-source libraries</strong>
          </p>
          <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-base sm:grid-cols-3">
            {LIBRARIES.map(([name, licence]) => (
              <li key={name}>
                {name} <span className="font-mono text-xs">({licence})</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-base">
          All cover art and sound effects on the site are original, drawn as code and generated in the browser.
        </p>
      </Block>

      <div className="flex flex-wrap gap-4 border-t border-line py-14">
        <ButtonLink href="/games" size="lg" className="max-sm:w-full">
          ▶ Press Start
        </ButtonLink>
        <ButtonLink href="/data" variant="secondary" size="lg" className="max-sm:w-full">
          See your data
        </ButtonLink>
      </div>
    </div>
  );
}
