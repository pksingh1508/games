// What happens to the save as you play (Plan/04-dont-trust-the-game.md §7): chapters finished (and whether you
// believed any lies on the way), secrets, the Trust Issues tally, the endings and coming back. Pure functions.
import { CHAPTER_OF, type SceneId } from "./core/story";
import type { ChapterNo, DttgSave } from "./save";
import { SECRET_COUNT, type SecretId } from "./story/secrets";

export type AchievementId = "trusting-soul" | "never-trusted" | "hacker" | "magic-word" | "reloaded" | "you-came-back" | "collector";

/** Obeying this many of HELPER's lies, in all. */
export const TRUSTING_SOUL = 10;

export function enterScene(save: DttgSave, scene: SceneId, truth: boolean): DttgSave {
  if (truth) return save.truthScene === scene ? save : { ...save, truthScene: scene };
  if (save.scene === scene) return save;
  const chapter = CHAPTER_OF[scene];
  const before = save.scene ? CHAPTER_OF[save.scene] : 0;
  // A new chapter starts with a clean slate for "Never Trusted".
  const chapters = chapter !== before ? { ...save.chapters, [chapter]: { ...save.chapters[chapter], believed: 0 } } : save.chapters;
  return { ...save, scene, chapters };
}

export function believed(save: DttgSave, scene: SceneId): { save: DttgSave; unlock: AchievementId[] } {
  const chapter = CHAPTER_OF[scene];
  const next: DttgSave = {
    ...save,
    trust: { ...save.trust, believed: save.trust.believed + 1 },
    chapters: { ...save.chapters, [chapter]: { ...save.chapters[chapter], believed: save.chapters[chapter].believed + 1 } },
  };
  return { save: next, unlock: next.trust.believed >= TRUSTING_SOUL ? ["trusting-soul"] : [] };
}

export const doubted = (save: DttgSave): DttgSave => ({ ...save, trust: { ...save.trust, doubted: save.trust.doubted + 1 } });

export function foundSecret(save: DttgSave, id: SecretId): { save: DttgSave; fresh: boolean; unlock: AchievementId[] } {
  if (save.secrets[id]) return { save, fresh: false, unlock: [] };
  const next = { ...save, secrets: { ...save.secrets, [id]: Date.now() } };
  return { save: next, fresh: true, unlock: Object.keys(next.secrets).length >= SECRET_COUNT ? ["collector"] : [] };
}

/** A chapter is done (`ms`: how long it took). Chapters 1–5 have lies you can fall for. */
export function chapterDone(save: DttgSave, chapter: ChapterNo, ms: number, truth: boolean): { save: DttgSave; unlock: AchievementId[] } {
  if (truth) return { save, unlock: [] };
  const record = save.chapters[chapter];
  const next = { ...save, chapters: { ...save.chapters, [chapter]: { ...record, done: record.done + 1, bestMs: record.bestMs ? Math.min(record.bestMs, ms) : ms } } };
  return { save: next, unlock: chapter <= 5 && record.believed === 0 ? ["never-trusted"] : [] };
}

export function ended(save: DttgSave, kind: "quit" | "stay"): DttgSave {
  return { ...save, ending: kind, endings: { ...save.endings, [kind]: save.endings[kind] + 1 }, scene: kind === "quit" ? null : save.scene, cameBack: kind === "quit" ? false : save.cameBack };
}

/** A visit after the Quit ending, the first time: "You came back." */
export const comesBack = (save: DttgSave) => save.ending === "quit" && !save.cameBack;

export const finishedOnce = (save: DttgSave) => save.endings.quit > 0 || save.endings.stay > 0;

export interface TrustReport {
  believed: number;
  doubted: number;
  secrets: number;
  deaths: number;
  minutes: number;
}

export const trustReport = (save: DttgSave): TrustReport => ({
  believed: save.trust.believed,
  doubted: save.trust.doubted,
  secrets: Object.keys(save.secrets).length,
  deaths: save.deaths,
  minutes: Math.max(1, Math.round(save.playMs / 60_000)),
});

export function shareText(r: TrustReport, url: string): string {
  return `Don't Trust The Game\nLies I believed: ${r.believed}. Truths I doubted: ${r.doubted}.\nSecrets: ${r.secrets}/${SECRET_COUNT}. HELPER says thanks.\n${url}`;
}
