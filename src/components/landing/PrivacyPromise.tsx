import { Cookie, Download, ServerOff, ShieldCheck, UserX, WifiOff } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";

const POINTS = [
  { icon: UserX, title: "No accounts", text: "Nothing to sign up for, nothing to log into." },
  { icon: ServerOff, title: "No database", text: "The site is just files. It never receives your data." },
  { icon: Cookie, title: "No cookies, no analytics", text: "Nobody is counting your clicks." },
  { icon: WifiOff, title: "Plays offline", text: "Install it, and the arcade works on a plane." },
  { icon: Download, title: "Your save file", text: "Export everything to a file, import it anywhere." },
  { icon: ShieldCheck, title: "You're in control", text: "See what's stored, and delete it any time." },
];

/** A retro memory card. */
function MemoryCard() {
  return (
    <svg viewBox="0 0 320 400" className="h-auto w-full max-w-xs drop-shadow-[0_40px_60px_rgba(0,0,0,0.6)]" aria-hidden>
      <defs>
        <linearGradient id="mc-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2E2742" />
          <stop offset="100%" stopColor="#1B1628" />
        </linearGradient>
      </defs>
      <path d="M40 0 H260 L320 60 V380 a20 20 0 0 1 -20 20 H40 a20 20 0 0 1 -20 -20 V20 a20 20 0 0 1 20 -20 z" fill="url(#mc-body)" />
      <path d="M40 0 H260 L320 60 V380 a20 20 0 0 1 -20 20 H40 a20 20 0 0 1 -20 -20 V20 a20 20 0 0 1 20 -20 z" fill="none" stroke="#FF3D7F" strokeOpacity="0.5" strokeWidth="3" />
      <rect x="54" y="40" width="210" height="150" rx="14" fill="#F5F1E8" />
      <rect x="54" y="40" width="210" height="36" rx="14" fill="#FF3D7F" />
      <rect x="54" y="62" width="210" height="14" fill="#FF3D7F" />
      <text x="159" y="64" textAnchor="middle" fontFamily="var(--font-pixelify)" fontSize="16" fontWeight="700" fill="#0E0B16">
        MEMORY CARD
      </text>
      <text x="159" y="116" textAnchor="middle" fontFamily="var(--font-bricolage)" fontSize="30" fontWeight="800" fill="#0E0B16">
        Mind Games
      </text>
      <text x="159" y="146" textAnchor="middle" fontFamily="var(--font-geist-mono)" fontSize="13" fill="#4A4458">
        SAVE DATA · THIS DEVICE
      </text>
      <rect x="84" y="160" width="150" height="10" rx="5" fill="#E2DCEB" />
      <rect x="84" y="160" width="96" height="10" rx="5" fill="#C6FF3D" />
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x={62 + i * 22} y="330" width="14" height="48" rx="3" fill="#FFB020" />
      ))}
      <circle cx="270" cy="240" r="8" fill="#C6FF3D" />
      <text x="96" y="262" fontFamily="var(--font-pixelify)" fontSize="15" fill="#A9A3BC">
        15 BLOCKS FREE
      </text>
    </svg>
  );
}

export function PrivacyPromise() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-32 sm:px-6" aria-labelledby="privacy-title">
      <div className="grid items-center gap-14 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <SectionHeading
            id="privacy-title"
            level="Level 05"
            eyebrow="Your save file"
            title={
              <>
                Your progress never leaves <span className="text-truth">this device</span>.
              </>
            }
            description="Like a memory card in an old console: everything is saved right here, in your browser. Nothing is sent anywhere unless you choose to share it."
          />
          <ul className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {POINTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface text-truth ring-1 ring-line">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="font-display text-lg font-bold">{title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-wrap gap-4">
            <ButtonLink href="/data" variant="secondary">
              See your data
            </ButtonLink>
            <ButtonLink href="/about#privacy" variant="ghost">
              How privacy works →
            </ButtonLink>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="animate-float">
            <MemoryCard />
          </div>
        </div>
      </div>
    </section>
  );
}
