"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";
import { playSound } from "@/engine/audio/ui-sound";
import { cn } from "@/lib/cn";

/** The tell is a spoiler: hidden until you choose to see it. */
export function TellReveal({ tell }: { tell: string }) {
  const [shown, setShown] = useState(false);
  const id = useId();
  return (
    <div className="mt-5 rounded-2xl bg-surface-2 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="pixel-label text-[0.7rem] text-muted-surface">The tell</p>
        <button
          type="button"
          aria-expanded={shown}
          aria-controls={id}
          onClick={() => {
            setShown((s) => !s);
            playSound(shown ? "close" : "coin");
          }}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-ink hover:bg-surface"
        >
          {shown ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          {shown ? "Hide" : "Reveal"}
        </button>
      </div>
      <p
        id={id}
        className={cn(
          "mt-2 font-medium text-ink transition-[filter,opacity] duration-300",
          shown ? "blur-0 opacity-100" : "select-none opacity-60 blur-[6px]",
        )}
        aria-hidden={!shown}
      >
        {tell}
      </p>
    </div>
  );
}
