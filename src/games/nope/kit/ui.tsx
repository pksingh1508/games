"use client";

// The building blocks every question is made of: the prompt, chunky answer buttons, inline
// clickable words. All hit areas are at least 44×44 px, even when they look tiny
// (Plan/02-nope.md §10: no pixel hunting).
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "../nope.module.css";

export const TONES = {
  red: { bg: "#D41F22", base: "#8A1416", ink: "#FFFFFF" },
  blue: { bg: "#2B59C3", base: "#1C3A7F", ink: "#FFFFFF" },
  green: { bg: "#7ED957", base: "#4E9A2F", ink: "#161414" },
  yellow: { bg: "#FFC93C", base: "#C99316", ink: "#161414" },
  purple: { bg: "#7B4FD6", base: "#4C2C93", ink: "#FFFFFF" },
  orange: { bg: "#FF8A3D", base: "#B5561A", ink: "#161414" },
  cream: { bg: "#FFFFFF", base: "#D8CDB0", ink: "#161414" },
  ink: { bg: "#161414", base: "#000000", ink: "#FFF4D6" },
} as const;

export type Tone = keyof typeof TONES;

const BUTTON_SIZES = {
  sm: "min-h-12 px-4 text-xl",
  md: "min-h-16 px-5 text-2xl sm:text-3xl",
  lg: "min-h-20 px-6 text-3xl sm:text-4xl",
} as const;

/** A chunky game-show answer button with a 3D base. */
export function AnswerButton({
  tone = "cream",
  size = "md",
  className,
  style,
  children,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone; size?: keyof typeof BUTTON_SIZES }) {
  const colors = TONES[tone];
  return (
    <button
      type={type}
      {...props}
      className={cn(
        styles.show,
        "relative inline-flex min-w-12 select-none items-center justify-center rounded-2xl text-center leading-none",
        "shadow-[0_6px_0_0_var(--base)] transition-[transform,box-shadow] duration-100 ease-out",
        "hover:-translate-y-0.5 active:translate-y-[5px] active:shadow-[0_1px_0_0_var(--base)]",
        "disabled:pointer-events-none disabled:opacity-50",
        tone === "cream" && "border-[3px] border-[#161414]",
        BUTTON_SIZES[size],
        className,
      )}
      style={{ background: colors.bg, color: colors.ink, ["--base" as string]: colors.base, ...style }}
    >
      {children}
    </button>
  );
}

/** Answers in a tidy grid: two columns on phones, a row of four on bigger screens. */
export function Choices({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mt-7 grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-4 sm:gap-4", className)}>{children}</div>;
}

const PROMPT_SIZES = {
  md: "text-[clamp(1.45rem,4.6vw,2.05rem)]",
  lg: "text-[clamp(1.7rem,5.4vw,2.55rem)]",
  xl: "text-[clamp(2.1rem,6.6vw,3.2rem)]",
} as const;

/** The question itself. Focused when the question appears, so screen readers read it first. */
export function Prompt({
  children,
  size = "lg",
  className,
  style,
}: {
  children: ReactNode;
  size?: keyof typeof PROMPT_SIZES;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <h2
      data-prompt
      tabIndex={-1}
      className={cn(styles.show, "text-balance text-center leading-[1.08] text-[#161414] outline-none", PROMPT_SIZES[size], className)}
      style={style}
    >
      {children}
    </h2>
  );
}

/** Small print under a prompt. */
export function Note({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("mt-3 text-center text-sm font-medium text-[#615C52]", className)}>{children}</p>;
}

/**
 * A word inside a prompt that is secretly clickable. Looks like text; the hit area still
 * reaches 44 px.
 */
export function Token({
  children,
  onClick,
  label,
  className,
}: {
  children: ReactNode;
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "relative inline cursor-pointer rounded-md px-0.5 text-inherit [font:inherit] hover:bg-[#161414]/8",
        "before:absolute before:-inset-x-2 before:-inset-y-2.5 before:content-['']",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** A little speech bubble, for quoting Mr. Nope inside a card. */
export function Quote({ children, wink, className }: { children: ReactNode; wink?: boolean; className?: string }) {
  return (
    <p className={cn("mx-auto mt-4 w-fit max-w-full rounded-2xl bg-[#161414] px-4 py-2 text-center text-[#FFF4D6]", styles.show, className)}>
      <span className="sr-only">{wink ? "Mr. Nope says, with a wink: " : "Mr. Nope says, looking straight at you: "}</span>
      {children}
    </p>
  );
}
