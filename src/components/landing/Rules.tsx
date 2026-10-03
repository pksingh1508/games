import { Eye, HardDrive, HeartHandshake, RotateCcw, Sparkles } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";

const RULES = [
  {
    icon: Eye,
    title: "Every lie has a tell",
    text: "The game may trick you, but there's always a clue a sharp player could have noticed.",
    example: "Fake floors never cast a shadow. Until World 4.",
    className: "md:col-span-2 lg:col-span-3",
    tint: "from-accent/25",
  },
  {
    icon: RotateCcw,
    title: "Fail fast, retry faster",
    text: "Restarts take less than half a second. A death should feel like a joke, not a punishment.",
    example: "TrapSprint respawns you in under 0.3 s.",
    className: "lg:col-span-3",
    tint: "from-lie/20",
  },
  {
    icon: Sparkles,
    title: "Teach, then betray",
    text: "Learn a rule safely. Master it. Then watch it twist, but only after a hint that it might.",
    example: "One More Step teaches spikes… then makes them lazy.",
    className: "lg:col-span-2",
    tint: "from-truth/20",
  },
  {
    icon: HeartHandshake,
    title: "Comfort always wins",
    text: "Reduce motion, no flashing, no jump scares and volume controls are respected by every game.",
    example: "Set it once in Settings. Every cabinet listens.",
    className: "lg:col-span-2",
    tint: "from-warn/20",
  },
  {
    icon: HardDrive,
    title: "Your saves stay here",
    text: "No accounts, no database, no analytics. Progress lives in this browser, on this device.",
    example: "Export a backup file any time.",
    className: "md:col-span-2 lg:col-span-2",
    tint: "from-accent/20",
  },
];

export function Rules() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-32 sm:px-6" aria-labelledby="rules-title">
      <SectionHeading
        id="rules-title"
        level="Level 03"
        eyebrow="House rules"
        title="The arcade plays dirty. And fair."
        description="Five rules every game in the collection follows. They're the difference between laughing at a trick and rage-quitting."
      />
      <ul className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-6">
        {RULES.map((rule, i) => (
          <li
            key={rule.title}
            className={cn(
              "group relative overflow-clip rounded-[var(--radius-card)] border border-line bg-surface p-7 transition-colors hover:border-[color-mix(in_oklab,var(--accent)_55%,transparent)]",
              rule.className,
            )}
          >
            <div aria-hidden className={cn("absolute inset-0 -z-0 bg-gradient-to-br to-transparent to-60% opacity-80", rule.tint)} />
            <div className="relative">
              <div className="flex items-start justify-between">
                <span className="grid size-12 place-items-center rounded-2xl bg-bg text-ink ring-1 ring-line">
                  <rule.icon className="size-6" aria-hidden />
                </span>
                <span aria-hidden className="text-outline font-display text-6xl font-extrabold leading-none text-white/10">
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-6 font-display text-2xl font-extrabold tracking-tight">{rule.title}</h3>
              <p className="mt-3 leading-relaxed text-muted-surface">{rule.text}</p>
              <p className="mt-6 font-mono text-[0.8rem] font-semibold leading-relaxed text-lie">▶ {rule.example}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
