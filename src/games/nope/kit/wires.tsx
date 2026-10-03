"use client";

// A bomb with coloured wires. Every wire also has a written label and its own pattern, so
// nothing depends on colour alone (Plan/gameStack.md §10.4).
import { Scissors } from "lucide-react";
import { cn } from "@/lib/cn";
import styles from "../nope.module.css";

export interface WireDef {
  id: string;
  label: string;
  color: string;
  pattern: "stripes" | "dots" | "zigzag" | "plain";
}

export const WIRES: Record<"red" | "blue" | "yellow" | "green", WireDef> = {
  red: { id: "red", label: "Red", color: "#D41F22", pattern: "stripes" },
  blue: { id: "blue", label: "Blue", color: "#2B59C3", pattern: "dots" },
  yellow: { id: "yellow", label: "Yellow", color: "#FFC93C", pattern: "zigzag" },
  green: { id: "green", label: "Green", color: "#4E9A2F", pattern: "plain" },
};

const PATTERNS: Record<WireDef["pattern"], string> = {
  stripes: "repeating-linear-gradient(-45deg, rgb(0 0 0 / 0.28) 0 4px, transparent 4px 10px)",
  dots: "radial-gradient(circle, rgb(255 255 255 / 0.55) 0 2px, transparent 2.5px) 0 50% / 10px 10px repeat-x",
  zigzag: "repeating-linear-gradient(60deg, rgb(0 0 0 / 0.25) 0 3px, transparent 3px 8px), repeating-linear-gradient(-60deg, rgb(0 0 0 / 0.25) 0 3px, transparent 3px 8px)",
  plain: "none",
};

export function Wires({ wires, onCut, cut }: { wires: WireDef[]; onCut: (id: string) => void; cut?: string | null }) {
  return (
    <div className="mx-auto mt-7 flex w-full max-w-lg items-stretch gap-0">
      {/* The bomb */}
      <div aria-hidden className="relative grid w-24 shrink-0 place-items-center rounded-l-2xl border-[3px] border-r-0 border-[#161414] bg-[#2A2A2A] sm:w-28">
        <span className={cn(styles.show, "rounded-md bg-[#0B0909] px-2 py-1 font-mono text-lg text-[#FF5A4E] tabular-nums")}>00:0?</span>
        <span className={cn(styles.comic, "absolute bottom-1.5 text-sm tracking-widest text-[#FFC93C]")}>TNT</span>
      </div>
      <ul className="flex flex-1 flex-col justify-center gap-3 rounded-r-2xl border-[3px] border-[#161414] bg-[#E9E1CC] py-4 pr-3">
        {wires.map((wire) => {
          const snipped = cut === wire.id;
          return (
            <li key={wire.id}>
              <button
                type="button"
                onClick={() => onCut(wire.id)}
                className="group relative flex h-11 w-full items-center gap-2"
                aria-label={`Cut the ${wire.label.toLowerCase()} wire`}
              >
                <span className="relative flex h-3.5 flex-1 items-center">
                  <span
                    className={cn("h-full rounded-r-full border-y-2 border-r-2 border-[#161414] transition-[width]", snipped ? "w-[45%]" : "w-full")}
                    style={{ background: `${PATTERNS[wire.pattern]}, ${wire.color}` }}
                  />
                  {snipped && (
                    <span
                      className="ml-auto h-full w-[45%] rounded-l-full border-y-2 border-l-2 border-[#161414]"
                      style={{ background: `${PATTERNS[wire.pattern]}, ${wire.color}` }}
                    />
                  )}
                  <Scissors
                    aria-hidden
                    className="absolute left-1/2 size-6 -translate-x-1/2 rounded-full bg-white p-1 text-[#161414] opacity-0 shadow transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                  />
                </span>
                <span className={cn(styles.show, "w-16 shrink-0 rounded-lg border-2 border-[#161414] bg-white px-1.5 py-0.5 text-center text-sm text-[#161414]")}>
                  {wire.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
