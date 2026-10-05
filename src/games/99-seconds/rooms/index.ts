// The three chapters, in order.
import type { ChapterDef, ChapterId } from "../core/types";
import { CLOCK_ROOM } from "./clock-room";
import { KITCHEN } from "./kitchen";
import { WAITING_ROOM } from "./waiting-room";

export const CHAPTER_DEFS: Record<ChapterId, ChapterDef> = {
  "waiting-room": WAITING_ROOM,
  kitchen: KITCHEN,
  "clock-room": CLOCK_ROOM,
};

export const chapterDef = (id: ChapterId) => CHAPTER_DEFS[id];
