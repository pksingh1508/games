// An icon for each kind of change (the report picker, the help). The icons never lie, even when the labels do.
import { CopyPlus, DoorOpen, FlipHorizontal2, Hash, Lightbulb, Move, PersonStanding, Replace, SquareDashed, type LucideIcon } from "lucide-react";
import type { AnomalyType } from "../core/types";

export const TYPE_ICONS: Record<AnomalyType, LucideIcon> = {
  moved: Move,
  missing: SquareDashed,
  extra: CopyPlus,
  changed: Replace,
  intruder: PersonStanding,
  light: Lightbulb,
  door: DoorOpen,
  count: Hash,
  mirror: FlipHorizontal2,
};
