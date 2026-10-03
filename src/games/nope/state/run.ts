// The rules of a NOPE! run as pure functions: hearts, skips, stamps, results and the score.
// No React and no storage here, so it's easy to test (run.test.ts).
import {
  episodeKey,
  MAX_HEARTS,
  QUESTIONS_PER_EPISODE,
  type EpisodeId,
  type EpisodeRecord,
  type NopeSave,
  type QuestionResult,
  type Run,
} from "../save";

/** A fresh attempt. `wall` carries the episode's stamps over from earlier attempts. */
export function startRun(episode: EpisodeId, seed: number, wall = 0, attempt = 0): Run {
  return {
    episode,
    seed,
    attempt,
    index: 0,
    hearts: MAX_HEARTS,
    skip: false,
    results: [],
    fails: {},
    nopes: 0,
    wall,
    elapsedMs: 0,
  };
}

/** Out of hearts: same episode, next attempt. The stamps stay on the wall. */
export function restartRun(run: Run): Run {
  return startRun(run.episode, run.seed, run.wall, run.attempt + 1);
}

/** NOPE! One heart and one more stamp. */
export function failQuestion(run: Run, questionId: string): Run {
  return {
    ...run,
    hearts: Math.max(0, run.hearts - 1),
    nopes: run.nopes + 1,
    wall: run.wall + 1,
    fails: { ...run.fails, [questionId]: (run.fails[questionId] ?? 0) + 1 },
  };
}

export const isOutOfHearts = (run: Run) => run.hearts <= 0;

/** Answered (or skipped): record how it went and move on. */
export function passQuestion(run: Run, questionId: string, skipped = false): Run {
  const result: QuestionResult = skipped ? "skip" : run.fails[questionId] ? "retry" : "first";
  const results = [...run.results, result];
  return {
    ...run,
    skip: skipped ? false : run.skip,
    results,
    index: Math.min(results.length, QUESTIONS_PER_EPISODE - 1),
  };
}

export const isEpisodeComplete = (run: Run) => run.results.length >= QUESTIONS_PER_EPISODE;

/** Caught a skip fly. You can only hold one. */
export const grantSkip = (run: Run): Run => ({ ...run, skip: true });

export const addTime = (run: Run, ms: number): Run => ({ ...run, elapsedMs: run.elapsedMs + Math.max(0, Math.round(ms)) });

// ---------------------------------------------------------------------------------------------
// Scoring (Plan/02-nope.md §7): 1000 + hearts × 250 + unused skip × 100 − time penalty.
// ---------------------------------------------------------------------------------------------

/** Take longer than this and the clock starts nibbling your score. */
export const PAR_MS = 5 * 60_000;
/** Points lost per second over par… */
const PENALTY_PER_SECOND = 2;
/** …but never more than this. */
const MAX_PENALTY = 500;

export interface Score {
  base: number;
  hearts: number;
  skip: number;
  time: number;
  total: number;
}

export function scoreRun(run: Pick<Run, "hearts" | "skip" | "elapsedMs">): Score {
  const base = 1000;
  const hearts = run.hearts * 250;
  const skip = run.skip ? 100 : 0;
  const overSeconds = Math.max(0, (run.elapsedMs - PAR_MS) / 1000);
  const penalty = Math.min(MAX_PENALTY, Math.round(overSeconds * PENALTY_PER_SECOND));
  const time = penalty > 0 ? -penalty : 0;
  return { base, hearts, skip, time, total: Math.max(0, base + hearts + skip + time) };
}

// ---------------------------------------------------------------------------------------------
// Sharing (Wordle-style; the text only leaves the device if the player shares it).
// ---------------------------------------------------------------------------------------------

const RESULT_EMOJI: Record<QuestionResult, string> = { first: "✅", retry: "❌", skip: "⏭️" };

export const shareGrid = (results: readonly QuestionResult[]) => results.map((r) => RESULT_EMOJI[r]).join("");

/** 402_000 → "06:42". */
export function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function shareText({
  episode,
  name,
  grid,
  nopes,
  elapsedMs,
  score,
  url,
}: {
  episode: EpisodeId;
  name: string;
  grid: string;
  nopes: number;
  elapsedMs: number;
  score: number;
  url?: string;
}): string {
  const times = nopes === 1 ? "once" : `${nopes} times`;
  return [
    `NOPE! Episode ${episode}: ${name} — cleared`,
    grid,
    `NOPE'd ${times} · ${formatTime(elapsedMs)} · ${score.toLocaleString("en-US")} pts`,
    url,
  ]
    .filter(Boolean)
    .join("\n");
}

// ---------------------------------------------------------------------------------------------
// Updating the save at the end of an attempt.
// ---------------------------------------------------------------------------------------------

export interface ClearSummary {
  episode: EpisodeId;
  score: Score;
  grid: string;
  results: QuestionResult[];
  /** NOPEs across the whole episode (every attempt): the stamp wall. */
  episodeNopes: number;
  elapsedMs: number;
  hearts: number;
  perfect: boolean;
  newBest: boolean;
  firstClear: boolean;
}

function updateRecord(record: EpisodeRecord, run: Run, score: Score, grid: string): EpisodeRecord {
  const newBest = record.bestScore === null || score.total > record.bestScore;
  return {
    attempts: record.attempts + 1,
    clears: record.clears + 1,
    bestScore: newBest ? score.total : record.bestScore,
    bestTimeMs: record.bestTimeMs === null ? run.elapsedMs : Math.min(record.bestTimeMs, run.elapsedMs),
    bestGrid: newBest ? grid : record.bestGrid,
    perfect: record.perfect || run.hearts === MAX_HEARTS,
  };
}

/** The episode is cleared: record it, unlock the next one and end the run. */
export function clearEpisode(save: NopeSave, run: Run): { save: NopeSave; summary: ClearSummary } {
  const key = episodeKey(run.episode);
  const record = save.episodes[key];
  const score = scoreRun(run);
  const grid = shareGrid(run.results);
  const summary: ClearSummary = {
    episode: run.episode,
    score,
    grid,
    results: run.results,
    episodeNopes: run.wall,
    elapsedMs: run.elapsedMs,
    hearts: run.hearts,
    perfect: run.hearts === MAX_HEARTS,
    newBest: record.bestScore === null || score.total > record.bestScore,
    firstClear: record.clears === 0,
  };
  return {
    save: {
      ...save,
      unlocked: Math.max(save.unlocked, Math.min(4, run.episode + 1)),
      episodes: { ...save.episodes, [key]: updateRecord(record, run, score, grid) },
      run: null,
    },
    summary,
  };
}

/** Out of hearts: count the attempt and line up the next one. */
export function failEpisode(save: NopeSave, run: Run): NopeSave {
  const key = episodeKey(run.episode);
  const record = save.episodes[key];
  return {
    ...save,
    episodes: { ...save.episodes, [key]: { ...record, attempts: record.attempts + 1 } },
    run: restartRun(run),
  };
}
