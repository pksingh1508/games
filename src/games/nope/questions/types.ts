// What a NOPE! question is (Plan/02-nope.md §12). Every question is a React component plus
// metadata: which secret rules it uses, its tell, the honest hint and how it's solved on touch.
import type { ComponentType } from "react";
import type { EpisodeId, QuestionResult } from "../save";

export type Rule = 1 | 2 | 3 | 4 | 5;

/** Players are never told these. Figuring them out is the real game. */
export const SECRET_RULES: Record<Rule, string> = {
  1: "Read it literally.",
  2: "Everything is clickable.",
  3: "Doing nothing is an answer.",
  4: "Remember everything.",
  5: "Mr. Nope lies when he winks.",
};

export type AnswerKind =
  | "choice"
  | "hotspot"
  | "drag"
  | "type"
  | "wait"
  | "key"
  | "hover"
  | "sequence"
  | "memory"
  | "dynamic";

export type Mood =
  | "neutral"
  | "smug"
  | "offended"
  | "shocked"
  | "asleep"
  | "laughing"
  | "sulking"
  | "blush"
  | "stamped";

export interface HostLine {
  text: string;
  /** Winking means lying (secret rule 5). */
  wink?: boolean;
  mood?: Mood;
  /** He isn't finished talking (animated dots after the text). */
  typing?: boolean;
}

export interface QuestionMeta {
  /** "e1-q01" */
  id: string;
  /** A short name for the review screen. */
  title: string;
  /** The question as plain text. */
  prompt: string;
  /** The secret rules it follows (at least one; enforced by a test). */
  rules: Rule[];
  kinds: AnswerKind[];
  /** How it's solved. */
  solution: string;
  /** The clue that gives the trick away. */
  tell: string;
  /** Mr. Nope's honest nudge after two NOPEs on this question (said with a straight face). */
  hint: string;
  /** How it's solved on a touch screen, when that's different. */
  touch?: string;
  /** What Mr. Nope says when the question appears. */
  host?: HostLine;
  /**
   * A fuse burns across the card. Red: answer in time. Green (kind): let it run out.
   * `expire` overrides what happens when it runs out (default: green passes, red fails;
   * "none" leaves it to the question).
   */
  bomb?: { seconds: number; kind: "red" | "green"; expire?: "pass" | "fail" | "none" };
  boss?: boolean;
  /** No skip fly on this question. */
  calm?: boolean;
  /** About the stamp wall: the card gets out of the way and the stamps wobble. */
  wall?: boolean;
  /** The question draws its own Mr. Nope. */
  hostless?: boolean;
}

export interface WrongOptions {
  /** Mr. Nope's comeback. */
  line?: string;
  /** The player believed a winking Mr. Nope. */
  winked?: boolean;
  /** Silent confetti that lands as N-O-P-E before the stamp. */
  fakeConfetti?: boolean;
  /** A bomb went off. */
  boom?: boolean;
}

export interface QuestionApi {
  /** Correct! Optionally with Mr. Nope's (offended) reaction. */
  correct(line?: string): void;
  /** NOPE! */
  wrong(options?: WrongOptions | string): void;
  /** Mr. Nope comments without judging. */
  say(text: string, options?: { wink?: boolean; mood?: Mood; typing?: boolean }): void;
  /** Keep something for later questions ("what did you type for the sky?"). */
  remember(key: string, value: string): void;
  recall(key: string): string | undefined;
  readonly meta: QuestionMeta;
  readonly episode: EpisodeId;
  /** 1–15 */
  readonly number: number;
  /** NOPEs on this question in this attempt. */
  readonly fails: number;
  /** Which try at this episode (0 = first). */
  readonly attempt: number;
  readonly hearts: number;
  /** Stamps on screen right now. */
  readonly stamps: number;
  readonly results: readonly QuestionResult[];
  /** A touch-first device: questions swap in their touch versions. */
  readonly coarse: boolean;
  /** Colour-vision setting is on: colour questions swap to shapes or styles. */
  readonly colorblind: boolean;
  readonly reducedMotion: boolean;
  readonly seed: number;
}

export interface QuestionProps {
  api: QuestionApi;
}

export interface QuestionEntry {
  meta: QuestionMeta;
  Component: ComponentType<QuestionProps>;
}

export const defineQuestion = (meta: QuestionMeta, Component: ComponentType<QuestionProps>): QuestionEntry => ({
  meta,
  Component,
});
