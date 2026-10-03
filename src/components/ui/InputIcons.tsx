import { CircleDot, Gamepad2, Keyboard, Mouse, Smartphone } from "lucide-react";
import type { InputKind } from "@/games/registry";
import { INPUT_LABELS } from "@/games/registry";
import { cn } from "@/lib/cn";

const ICONS = {
  keyboard: Keyboard,
  mouse: Mouse,
  touch: Smartphone,
  "one-button": CircleDot,
  gamepad: Gamepad2,
} satisfies Record<InputKind, unknown>;

export function InputIcons({ inputs, className }: { inputs: InputKind[]; className?: string }) {
  return (
    <ul className={cn("flex items-center gap-1.5", className)} aria-label="Controls">
      {inputs.map((input) => {
        const Icon = ICONS[input];
        return (
          <li key={input} title={INPUT_LABELS[input]}>
            <Icon aria-hidden className="size-4" strokeWidth={2.2} />
            <span className="sr-only">{INPUT_LABELS[input]}</span>
          </li>
        );
      })}
    </ul>
  );
}
