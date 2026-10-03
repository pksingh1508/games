import { Marquee } from "@/components/ui/Marquee";

const TOP = [
  "Every lie has a tell",
  "The exit runs away",
  "The floor is fake",
  "Gravity is lying",
  "Don't blink",
  "NOPE!",
  "99 seconds. Again.",
];

const BOTTOM = [
  "No accounts",
  "No database",
  "No cookies",
  "Plays offline",
  "Fail fast",
  "Retry faster",
  "Comfort always wins",
];

/** Two crossing marquee bands, like a game trailer. */
export function MarqueeBands() {
  return (
    <div aria-hidden className="relative z-10 -my-4 select-none overflow-clip py-10">
      <div className="-mx-8 rotate-[-2.5deg] border-y-2 border-[#0E0B16] bg-lie py-3 font-display text-xl font-extrabold uppercase tracking-tight text-[#0E0B16] shadow-xl sm:text-2xl">
        <Marquee items={TOP} duration={42} />
      </div>
      <div className="-mx-8 -mt-3 rotate-[2deg] border-y-2 border-[#0E0B16] bg-accent py-3 font-display text-xl font-extrabold uppercase tracking-tight text-on-accent shadow-xl sm:text-2xl">
        <Marquee items={BOTTOM} duration={48} reverse />
      </div>
    </div>
  );
}
