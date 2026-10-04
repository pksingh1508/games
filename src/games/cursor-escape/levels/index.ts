// Every window in DeskOS 98 (Plan/12-cursor-escape.md §5): four drives of ten, then The Uninstaller.
import type { Drive, LevelSource } from "../core/level";
import { C_DRIVE } from "./c-drive";
import { D_DRIVE } from "./d-drive";
import { E_DRIVE } from "./e-drive";
import { F_DRIVE } from "./f-drive";
import { BOSS } from "./boss";

export interface DriveInfo {
  id: Exclude<Drive, "X">;
  name: string;
  /** What the drive's about (the desktop's description). */
  about: string;
  levels: LevelSource[];
}

export const DRIVES: DriveInfo[] = [
  { id: "C", name: "Desktop", about: "The basics: walls, pop-ups, icons, the I-beam and the hand.", levels: C_DRIVE },
  { id: "D", name: "Control Panel", about: "Mouse settings, changed behind your back: inverted, rotated, fast, slow, laggy, huge, trailing.", levels: D_DRIVE },
  { id: "E", name: "Internet", about: "Pop-up ads, links that pull, downloads that chase, dialogs that lie, a CAPTCHA.", levels: E_DRIVE },
  { id: "F", name: "System32", about: "Where the OS stops pretending: fake cursors, decoys, the antivirus, and at the very end, The Uninstaller.", levels: [...F_DRIVE, BOSS] },
];

export const LEVELS: LevelSource[] = DRIVES.flatMap((d) => d.levels);
export const LEVEL_IDS = LEVELS.map((l) => l.id);
export const FINAL_LEVEL = LEVEL_IDS[LEVEL_IDS.length - 1]!;

const BY_ID = new Map(LEVELS.map((l) => [l.id, l]));

export function getLevel(id: string): LevelSource {
  const level = BY_ID.get(id);
  if (!level) throw new Error(`No level ${id}`);
  return level;
}

/** "C:\-01" (the boss: "uninstall.exe"). */
export const levelLabel = (id: string) => (id.startsWith("X") ? "F:\\uninstall.exe" : `${id[0]}:\\-${id.slice(2)}`);

export function nextLevelId(id: string): string | null {
  const i = LEVEL_IDS.indexOf(id);
  return i >= 0 && i < LEVEL_IDS.length - 1 ? LEVEL_IDS[i + 1]! : null;
}

export const driveOf = (id: string): DriveInfo => DRIVES.find((d) => d.levels.some((l) => l.id === id)) ?? DRIVES[DRIVES.length - 1]!;
