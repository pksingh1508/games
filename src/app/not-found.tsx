import type { Metadata } from "next";
import Link from "next/link";
import { WrongDoorTracker } from "@/components/games/GameTrackers";

export const metadata: Metadata = {
  title: "Wrong door",
};

const DOORS = [
  { href: "/", label: "The lobby", sign: "HOME", body: "#8A5A3C", frame: "#5A3A28" },
  { href: "/games", label: "The arcade floor", sign: "GAMES", body: "#7A2E4A", frame: "#C9A227" },
  { href: "/about", label: "The help desk", sign: "HELP", body: "#3F6F6A", frame: "#5A3A28" },
];

/** A 404 in the style of Wrong Door. */
export default function NotFound() {
  return (
    <section data-game="wrong-door" className="relative isolate -mb-32 overflow-clip bg-bg pb-52 pt-20 text-ink-on-bg" aria-labelledby="nf-title">
      <WrongDoorTracker />
      <div aria-hidden className="absolute left-1/2 top-0 -z-10 size-[34rem] -translate-x-1/2 rounded-full bg-[#C9A227]/10 blur-[120px]" />
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
        <p className="pixel-label text-accent-ink">Error 404 · Floor ???</p>
        <h1 id="nf-title" className="mt-5 text-6xl leading-none sm:text-8xl" style={{ fontFamily: "var(--font-g-limelight)" }}>
          Wrong door.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
          This page doesn&apos;t exist. Or it&apos;s lying about existing. Either way, choose another door. (These ones are
          honest. Probably.)
        </p>

        <ul className="mx-auto mt-14 grid max-w-3xl gap-6 sm:grid-cols-3">
          {DOORS.map((door) => (
            <li key={door.href}>
              <Link
                href={door.href}
                data-sound="click"
                className="group block [perspective:900px]"
                aria-label={`Open the door to ${door.label}`}
              >
                <span className="relative block aspect-[3/5] rounded-t-[1.25rem] p-3" style={{ background: door.frame }}>
                  <span className="absolute inset-3 rounded-t-xl bg-[#FFD48A] shadow-[inset_0_0_40px_rgba(0,0,0,0.35)]" aria-hidden />
                  <span
                    className="absolute inset-3 origin-left rounded-t-xl transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(-58deg)] group-focus-visible:[transform:rotateY(-58deg)]"
                    style={{ background: door.body }}
                    aria-hidden
                  >
                    <span className="absolute inset-x-4 top-8 rounded bg-surface px-1 py-2 text-sm text-ink" style={{ fontFamily: "var(--font-g-limelight)" }}>
                      {door.sign}
                    </span>
                    <span className="absolute right-4 top-1/2 size-3 rounded-full bg-[#C9A227]" />
                  </span>
                </span>
                <span className="mt-4 block font-display text-lg font-bold">{door.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
