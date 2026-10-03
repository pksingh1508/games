"use client";

import { Dices } from "lucide-react";
import { useRouter } from "next/navigation";
import { buttonClass } from "@/components/ui/Button";
import { GAME_SLUGS } from "@/games/slugs";

/** Opens a random game page. */
export function RandomGameButton({
  variant = "secondary",
  size = "lg",
  className,
}: {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={buttonClass({ variant, size }, className)}
      data-sound="coin"
      onClick={() => {
        const slug = GAME_SLUGS[Math.floor(Math.random() * GAME_SLUGS.length)];
        router.push(`/games/${slug}`);
      }}
    >
      <Dices className="size-5" aria-hidden /> Random game
    </button>
  );
}
