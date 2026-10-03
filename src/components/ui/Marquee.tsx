import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** An endless scrolling band, like an arcade marquee. Pauses on hover; static with reduced motion. */
export function Marquee({
  items,
  reverse = false,
  duration = 38,
  className,
  separator = "✦",
}: {
  items: ReactNode[];
  reverse?: boolean;
  duration?: number;
  className?: string;
  separator?: ReactNode;
}) {
  const row = (hidden: boolean) => (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((item, i) => (
        <Fragment key={i}>
          <span className="px-6">{item}</span>
          <span className="opacity-70">{separator}</span>
        </Fragment>
      ))}
    </div>
  );

  return (
    <div className={cn("group/marquee overflow-clip", className)}>
      <div
        className={cn(
          "flex w-max group-hover/marquee:[animation-play-state:paused]",
          reverse ? "animate-marquee-reverse" : "animate-marquee",
        )}
        style={{ ["--marquee-duration" as string]: `${duration}s` }}
      >
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
