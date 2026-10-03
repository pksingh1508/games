// Every NOPE stays on the stage as a stamp, for the whole episode (Plan/02-nope.md §3).
import { cn } from "@/lib/cn";
import styles from "../nope.module.css";
import { wallLayout } from "../state/wall";
import { StampMark } from "./Stamp";

export function StampWall({
  seed,
  count,
  portrait,
  wobble,
  front,
}: {
  seed: number;
  count: number;
  portrait: boolean;
  /** The stamps matter for this question: they wobble (the tell). */
  wobble?: boolean;
  /** Draw over everything, so none hide behind the card or the host. */
  front?: boolean;
}) {
  const stamps = wallLayout(seed, count, portrait);
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0", front ? "z-20" : "z-0")}>
      {stamps.map((stamp) => (
        <div
          key={stamp.n}
          className="absolute w-[clamp(64px,17vw,150px)]"
          style={{
            left: `${stamp.x}%`,
            top: `${stamp.y}%`,
            transform: `translate(-50%, -50%) rotate(${stamp.rotate}deg) scale(${stamp.scale})`,
          }}
        >
          <div className={cn(stamp.n === count - 1 && styles.splat)}>
            <StampMark className={cn("w-full", front ? "opacity-95" : "opacity-75", wobble && styles.wobble)} />
          </div>
        </div>
      ))}
    </div>
  );
}
