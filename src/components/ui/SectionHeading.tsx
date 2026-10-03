import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Sections are "levels": a pixel eyebrow, a big display title and a short description. */
export function SectionHeading({
  level,
  eyebrow,
  title,
  description,
  align = "left",
  className,
  id,
}: {
  level?: string;
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
  id?: string;
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      <p className={cn("pixel-label flex items-center gap-3 text-accent-ink", align === "center" && "justify-center")}>
        {level && <span className="rounded-md bg-accent px-2 py-1 text-on-accent">{level}</span>}
        <span>{eyebrow}</span>
      </p>
      <h2 id={id} className="mt-4 font-display text-4xl font-extrabold leading-[0.95] tracking-tight sm:text-5xl md:text-6xl">
        {title}
      </h2>
      {description && <p className="mt-5 text-lg leading-relaxed text-muted">{description}</p>}
    </div>
  );
}
