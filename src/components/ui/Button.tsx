import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";
import type { UISound } from "@/engine/audio/ui-sound";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

interface StyleProps {
  variant?: Variant;
  size?: Size;
  /** Sound played on click (handled by one global listener, see GlobalEffects). */
  sound?: UISound | "none";
}

export function buttonClass({ variant = "primary", size = "md" }: StyleProps, className?: string) {
  return cn("btn", variant !== "primary" && `btn-${variant}`, size !== "md" && `btn-${size}`, className);
}

/** An arcade button that navigates. Works in Server Components (no client JavaScript). */
export function ButtonLink({
  variant,
  size,
  sound = "click",
  className,
  ...props
}: ComponentProps<typeof Link> & StyleProps) {
  return (
    <Link
      {...props}
      className={buttonClass({ variant, size }, className)}
      data-sound={sound === "none" ? undefined : sound}
    />
  );
}

/** An arcade button. */
export function Button({
  variant,
  size,
  sound = "click",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & StyleProps) {
  return (
    <button
      {...props}
      type={type}
      className={buttonClass({ variant, size }, className)}
      data-sound={sound === "none" ? undefined : sound}
    />
  );
}
