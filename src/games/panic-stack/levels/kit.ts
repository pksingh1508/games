// Small helpers for writing levels.
import type { ItemId } from "../core/items";
import type { BeltKind, LevelDef } from "../core/level";

/** "plate loaf brick" → the belt's order. */
export const belt = (text: string): BeltKind[] => text.trim().split(/\s+/) as BeltKind[];
export const pool = (text: string): ItemId[] => text.trim().split(/\s+/) as ItemId[];

export const level = (def: LevelDef): LevelDef => def;
