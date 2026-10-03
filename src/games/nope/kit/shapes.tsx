"use client";

// Shape buttons: the colour-vision versions of colour questions use shapes instead of colours
// (Plan/02-nope.md §11: "Click the STAR", where the words don't match the shapes).
import type { ReactElement } from "react";
import { cn } from "@/lib/cn";
import styles from "../nope.module.css";

export type Shape = "circle" | "square" | "star" | "triangle" | "diamond";

const SHAPE_PATHS: Record<Shape, ReactElement> = {
  circle: <circle cx="50" cy="50" r="45" />,
  square: <rect x="7" y="7" width="86" height="86" rx="8" />,
  star: <path d="M50 3 L62 36 L97 37 L69 58 L79 93 L50 72 L21 93 L31 58 L3 37 L38 36 Z" />,
  triangle: <path d="M50 5 L96 92 H4 Z" />,
  diamond: <path d="M50 3 L97 50 L50 97 L3 50 Z" />,
};

export function ShapeButton({
  word,
  shape,
  onClick,
  fill = "#FFC93C",
  className,
}: {
  word: string;
  shape: Shape;
  onClick: () => void;
  fill?: string;
  className?: string;
}) {
  return (
    <button type="button" onClick={onClick} className={cn("group relative mx-auto grid size-28 place-items-center sm:size-32", className)}>
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 size-full drop-shadow-[0_5px_0_rgba(0,0,0,0.25)] transition-transform group-hover:-translate-y-0.5 group-active:translate-y-1"
        aria-hidden
      >
        <g fill={fill} stroke="#161414" strokeWidth="5" strokeLinejoin="round">
          {SHAPE_PATHS[shape]}
        </g>
      </svg>
      <span className={cn(styles.show, "relative text-base text-[#161414] sm:text-lg")}>
        {word}
        <span className="sr-only"> (shaped like a {shape})</span>
      </span>
    </button>
  );
}
