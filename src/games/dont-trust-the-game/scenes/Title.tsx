"use client";

// The title (Plan/04-dont-trust-the-game.md §8.1): "Super Happy Jump!", bright and bubbly. Options and Quit don't
// work (HELPER says so, truthfully). Once Chapter 1 has cracked the logo, the real name shows through. After the
// ending, the next visit says "You came back.", HELPER is honest, and Truth Mode opens.
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { CHAPTER_START, CHAPTER_TITLES, type SceneId } from "../core/story";
import styles from "../dttg.module.css";
import { finishedOnce } from "../progress";
import type { DttgSave } from "../save";
import { SECRETS } from "../story/secrets";
import { useGame } from "../ui/context";

const LOGO = "Super Happy Jump!";
const COLOURS = ["#ff6fa8", "#ffd23f", "#7cf2b5", "#7af0ff", "#b48cff", "#ff8fc0"];

export function TitleScene({
  save,
  cameBack,
  onPlay,
  onTruth,
}: {
  save: DttgSave;
  /** This visit is the first since the ending. */
  cameBack: boolean;
  onPlay: (scene: SceneId, fresh: boolean) => void;
  onTruth: (scene: SceneId) => void;
}) {
  const { director, reducedMotion } = useGame();
  const [chapters, setChapters] = useState(false);
  const finished = finishedOnce(save);

  useEffect(() => {
    director.enter("tutorial", null);
    director.setStep("title");
    if (cameBack) {
      director.say("title.back");
      director.say("title.honest");
    } else if (save.scene) director.say("any.welcome-back");
    else {
      director.say("title.hi");
      director.say("title.start");
    }
  }, [director, cameBack, save.scene]);

  return (
    <div className={cn(styles.full, styles.title)} data-title-screen data-came-back={cameBack ? "" : undefined}>
      {cameBack ? (
        <p className={styles.realTitle} data-you-came-back>
          You came back.
        </p>
      ) : (
        <div className={cn(styles.logo, save.cracked && styles.crack)} aria-label={save.cracked ? "Super Happy Jump! (cracked)" : LOGO}>
          {[...LOGO].map((ch, i) => (
            <span key={i} style={{ color: COLOURS[i % COLOURS.length], animationDelay: reducedMotion ? undefined : `${i * 0.07}s` }}>
              {ch === " " ? "\u00a0" : ch}
            </span>
          ))}
        </div>
      )}
      {save.cracked && !cameBack && <p className={styles.realTitle}>Don&apos;t Trust The Game</p>}

      {!chapters ? (
        <div className={styles.titleBtns}>
          {save.scene ? (
            <button type="button" className={styles.cuteBtn} data-primary onClick={() => onPlay(save.scene!, false)} data-start>
              Continue
            </button>
          ) : (
            <button type="button" className={styles.cuteBtn} data-primary onClick={() => onPlay("tutorial", true)} data-start>
              Press Start
            </button>
          )}
          {save.scene && (
            <button type="button" className={styles.cuteBtn} onClick={() => onPlay("tutorial", true)} data-new-game>
              New game
            </button>
          )}
          {finished && (
            <>
              <button type="button" className={styles.cuteBtn} onClick={() => onTruth(save.truthScene ?? "tutorial")} data-truth-mode>
                Truth Mode
              </button>
              <button type="button" className={styles.cuteBtn} onClick={() => setChapters(true)} data-chapter-select>
                Chapters
              </button>
            </>
          )}
          <button type="button" className={styles.cuteBtn} onClick={() => director.say("title.options", { now: true })} data-title-options>
            Options
          </button>
          <button type="button" className={styles.cuteBtn} onClick={() => director.say("title.quit", { now: true })} data-title-quit>
            Quit
          </button>
        </div>
      ) : (
        <div className="grid w-full max-w-md gap-2">
          {([1, 2, 3, 4, 5, 6] as const).map((n) => (
            <button key={n} type="button" className={styles.cuteBtn} onClick={() => onPlay(CHAPTER_START[n], false)} data-chapter={n}>
              {n}. {CHAPTER_TITLES[n]}
            </button>
          ))}
          <button type="button" className={styles.cuteBtn} onClick={() => setChapters(false)}>
            Back
          </button>
        </div>
      )}
      {finished && (
        <p className="text-sm font-bold opacity-70" data-secret-count>
          Secrets: {Object.keys(save.secrets).length}/{SECRETS.length}
        </p>
      )}
    </div>
  );
}
