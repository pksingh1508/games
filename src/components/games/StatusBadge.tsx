import { Play, Wrench } from "lucide-react";
import type { GameStatus } from "@/games/registry";
import { cn } from "@/lib/cn";

export function StatusBadge({ status, className }: { status: GameStatus; className?: string }) {
  if (status === "playable") {
    return (
      <span className={cn("chip whitespace-nowrap border-transparent bg-[#C6FF3D] text-[#0E0B16]", className)}>
        <Play className="size-3" fill="currentColor" aria-hidden /> Playable
      </span>
    );
  }
  return (
    <span className={cn("chip whitespace-nowrap border-transparent bg-[#0E0B16]/85 text-[#FFB020] backdrop-blur", className)}>
      <Wrench className="size-3" aria-hidden />
      {/* Inside a narrow @container (a phone-sized card), this reads just "Workshop". */}
      <span className="@max-[18.5rem]:sr-only">In the</span> workshop
    </span>
  );
}
