"use client";

// One episode in play: the stage, the scoreboard, Mr. Nope, the stamp wall and the current
// question. This is where answers are judged: correct → ding, confetti, next question;
// wrong → NOPE!, a stamp on the wall, a heart lost, same question again (Plan/02-nope.md §2).
import { AnimatePresence } from "motion/react";
import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { useSave } from "@/engine/save";
import { cn } from "@/lib/cn";
import { unlockNopeAchievement } from "../achievements";
import { HOTSPOT_LINES, OFFENDED_LINES, pickLine, POKE_LINES, SMUG_LINES } from "../lines";
import styles from "../nope.module.css";
import {
  PlayProvider,
  useComfort,
  useCoarsePointer,
  useDocumentHidden,
  useGameTimeout,
  usePortrait,
  type HotspotHandler,
  type HotspotName,
  type PlayContextValue,
} from "../play/context";
import type { EpisodeInfo } from "../questions/episodes";
import type { QuestionApi, QuestionEntry, WrongOptions } from "../questions/types";
import { nopeSave, type Run } from "../save";
import { sfx } from "../sfx";
import { addTime, failQuestion, grantSkip, isEpisodeComplete, isOutOfHearts, passQuestion } from "../state/run";
import { visibleStamps } from "../state/wall";
import { Backdrop, EPISODE_THEME } from "./Backdrop";
import { FakeConfetti, planFly, SkipFly, Slam, useConfetti } from "./Effects";
import { EpisodeIntro, type IntroMode } from "./EpisodeIntro";
import { HostPanel, type HostState } from "./HostPanel";
import { Hud } from "./Hud";
import { PauseMenu } from "./Menus";
import { QuestionCard } from "./QuestionCard";
import { StampDefs } from "./Stamp";
import { StampWall } from "./StampWall";

type Phase = "intro" | "question" | "correct" | "wrong";

const CORRECT_MS = 950;
const SLAM_MS = 1050;
const SKIP_MS = 800;
const FAKE_CONFETTI_MS = 1350;

const QUIET: HostState = { text: null, mood: "neutral", wink: false };

/** Starts the skip fly after a delay (paused time doesn't count). */
function FlyLauncher({ delayMs, onLaunch }: { delayMs: number; onLaunch: () => void }) {
  useGameTimeout(delayMs, onLaunch);
  return null;
}

export function PlayScreen({
  episode,
  questions,
  run,
  onCleared,
  onFailed,
  onQuit,
  onRestart,
}: {
  episode: EpisodeInfo;
  questions: QuestionEntry[];
  run: Run;
  onCleared: () => void;
  onFailed: () => void;
  onQuit: () => void;
  onRestart: () => void;
}) {
  const save = useSave(nopeSave);
  const comfort = useComfort();
  const coarse = useCoarsePointer();
  const portrait = usePortrait();
  const hidden = useDocumentHidden();

  const [introMode] = useState<IntroMode>(() =>
    run.results.length === 0 ? (run.attempt > 0 ? "retry" : "start") : "continue",
  );
  const [phase, setPhase] = useState<Phase>("intro");
  const [questionKey, setQuestionKey] = useState(0);
  // The question on screen. The run moves on as soon as an answer is judged (so it's saved),
  // but the card stays until its celebration or stamp is over.
  const [shown, setShown] = useState(run.index);
  const [reaction, setReaction] = useState<HostState | null>(null);
  const [said, setSaid] = useState<HostState | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [slamId, setSlamId] = useState<number | null>(null);
  const [fakeId, setFakeId] = useState<number | null>(null);
  const [shaking, setShaking] = useState(false);
  const [lostHeart, setLostHeart] = useState<number | null>(null);
  const [fly, setFly] = useState<{ path: { x: number; y: number }[]; id: number } | null>(null);
  const [skipAsk, setSkipAsk] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [stage, setStage] = useState<HTMLDivElement | null>(null);

  const phaseRef = useRef<Phase>("intro");
  const hotspots = useRef(new Map<HotspotName, HotspotHandler>());
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const counter = useRef(0);
  const cardBox = useRef<HTMLDivElement | null>(null);
  const clock = useRef({ total: 0, since: null as number | null, committed: 0, questionStart: 0 });

  const entry = questions[shown] ?? questions[0]!;
  const { meta } = entry;
  const fails = run.fails[meta.id] ?? 0;
  const paused = menuOpen || hidden || phase !== "question";
  const theme = EPISODE_THEME[episode.id];
  const { canvas, burst } = useConfetti(!comfort.reducedMotion && !comfort.reduceFlashing);

  // --- Time: only unpaused time counts (for the score and "Didn't Even Read"). ---------------
  useEffect(() => {
    const c = clock.current;
    if (paused) return;
    c.since = performance.now();
    return () => {
      if (c.since !== null) c.total += performance.now() - c.since;
      c.since = null;
    };
  }, [paused]);

  const activeMs = useCallback(() => {
    const c = clock.current;
    return c.total + (c.since !== null ? performance.now() - c.since : 0);
  }, []);

  /** Time played since the last call (added to the run). */
  const takeElapsed = useCallback(() => {
    const now = activeMs();
    const spent = now - clock.current.committed;
    clock.current.committed = now;
    return spent;
  }, [activeMs]);

  useEffect(() => {
    clock.current.questionStart = activeMs();
  }, [questionKey, shown, activeMs]);

  // Closing or hiding the tab mid-run keeps the time played.
  useEffect(() => {
    const keepTime = () => {
      const spent = takeElapsed();
      if (spent > 0) nopeSave.update((s) => (s.run ? { ...s, run: addTime(s.run, spent) } : s));
      nopeSave.flush();
    };
    const onVisibility = () => {
      if (document.visibilityState !== "hidden") return;
      keepTime();
      // Coming back to a frozen game is less of a shock than coming back to a ticking fuse.
      if (phaseRef.current !== "intro") setMenuOpen(true);
    };
    window.addEventListener("pagehide", keepTime);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", keepTime);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [takeElapsed]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const later = (ms: number, fn: () => void) => {
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      fn();
    }, ms);
    timers.current.add(timer);
  };

  const go = (next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  };

  const shake = () => {
    if (comfort.reducedMotion) return;
    setShaking(false);
    requestAnimationFrame(() => setShaking(true));
  };

  const nextQuestion = () => {
    setReaction(null);
    setSaid(null);
    setFly(null);
    setSkipAsk(false);
    setLostHeart(null);
    setShown(nopeSave.get().run?.index ?? shown);
    setQuestionKey((k) => k + 1);
    go("question");
  };

  const cardOrigin = () => {
    const box = cardBox.current?.getBoundingClientRect();
    const area = stage?.getBoundingClientRect();
    if (!box || !area || area.width === 0) return undefined;
    return {
      x: (box.left + box.width / 2 - area.left) / area.width,
      y: (box.top + box.height * 0.35 - area.top) / area.height,
    };
  };

  // --- Judging --------------------------------------------------------------------------------
  const correct = (line?: string) => {
    if (phaseRef.current !== "question") return;
    go("correct");
    const spent = takeElapsed();
    const id = meta.id;
    const first = !run.fails[id];
    sfx.ding();
    sfx.applause(1);
    void burst(cardOrigin());
    setSaid(null);
    setReaction({ text: line ?? pickLine(OFFENDED_LINES, counter.current++), mood: "offended", wink: false });
    setAnnouncement(`Correct! ${line ?? ""}`);

    nopeSave.update((s) => {
      if (!s.run) return s;
      const patience =
        first && meta.kinds.includes("wait") && !s.stats.patience.includes(id) ? [...s.stats.patience, id] : s.stats.patience;
      return {
        ...s,
        run: passQuestion(addTime(s.run, spent), id),
        stats: {
          ...s.stats,
          correct: s.stats.correct + 1,
          firstTry: s.stats.firstTry + (first ? 1 : 0),
          patience,
          playMs: s.stats.playMs + Math.round(spent),
        },
      };
    });
    if (first && meta.kinds.includes("wait")) void checkPatience();

    later(CORRECT_MS, () => {
      const current = nopeSave.get().run;
      if (current && isEpisodeComplete(current)) onCleared();
      else nextQuestion();
    });
  };

  const wrong = (input?: WrongOptions | string) => {
    if (phaseRef.current !== "question") return;
    go("wrong");
    const options: WrongOptions = typeof input === "string" ? { line: input } : (input ?? {});
    const spent = takeElapsed();
    const thinking = activeMs() - clock.current.questionStart;
    const id = meta.id;

    const stampIt = () => {
      setFakeId(null);
      sfx.thunk();
      sfx.laugh();
      setSlamId(++counter.current);
      shake();
      setLostHeart(run.hearts - 1);
      setSaid(null);
      setReaction({ text: options.line ?? pickLine(SMUG_LINES, counter.current), mood: "laughing", wink: false });
      const left = run.hearts - 1;
      setAnnouncement(`NOPE! ${left === 1 ? "1 heart" : `${left} hearts`} left.`);

      nopeSave.update((s) => {
        if (!s.run) return s;
        return {
          ...s,
          run: failQuestion(addTime(s.run, spent), id),
          stats: {
            ...s.stats,
            nopes: s.stats.nopes + 1,
            winkedAt: s.stats.winkedAt + (options.winked ? 1 : 0),
            playMs: s.stats.playMs + Math.round(spent),
          },
        };
      });
      const stats = nopeSave.get().stats;
      if (stats.nopes >= 100) unlockNopeAchievement("stamp-collector");
      if (stats.winkedAt >= 3) unlockNopeAchievement("winked-at");
      if (episode.id === 1 && shown === 0 && thinking < 2000) unlockNopeAchievement("didnt-even-read");

      later(SLAM_MS, () => {
        setSlamId(null);
        const current = nopeSave.get().run;
        if (current && isOutOfHearts(current)) onFailed();
        else nextQuestion();
      });
    };

    if (options.boom) sfx.boom();
    if (options.fakeConfetti && !comfort.reducedMotion) {
      // Silent: real confetti always dings first.
      setFakeId(++counter.current);
      later(FAKE_CONFETTI_MS, stampIt);
    } else {
      stampIt();
    }
  };

  const skip = () => {
    if (phaseRef.current !== "question" || !run.skip || meta.boss) return;
    go("correct");
    setSkipAsk(false);
    const spent = takeElapsed();
    sfx.whoosh();
    setReaction({ text: "Skipped?! Coward. …Fine.", mood: "sulking", wink: false });
    setAnnouncement("Skipped.");
    nopeSave.update((s) => (s.run ? { ...s, run: passQuestion(addTime(s.run, spent), meta.id, true) } : s));
    later(SKIP_MS, () => {
      const current = nopeSave.get().run;
      if (current && isEpisodeComplete(current)) onCleared();
      else nextQuestion();
    });
  };

  const checkPatience = async () => {
    const { EPISODE_1 } = await import("../questions/episode-1");
    const { EPISODE_2 } = await import("../questions/episode-2");
    const { EPISODE_3 } = await import("../questions/episode-3");
    const { EPISODE_4 } = await import("../questions/episode-4");
    const waits = [...EPISODE_1, ...EPISODE_2, ...EPISODE_3, ...EPISODE_4]
      .filter((q) => q.meta.kinds.includes("wait"))
      .map((q) => q.meta.id);
    const done = nopeSave.get().stats.patience;
    if (waits.every((id) => done.includes(id))) unlockNopeAchievement("patience");
  };

  // --- The skip fly ------------------------------------------------------------------------------
  const flyPlan = useMemo(
    () => (meta.calm || meta.boss ? null : planFly(`${run.seed}:${run.episode}:${shown}:${run.attempt}:${fails}`)),
    [meta.calm, meta.boss, run.seed, run.episode, shown, run.attempt, fails],
  );

  const catchFly = () => {
    if (phaseRef.current !== "question") return;
    setFly(null);
    sfx.coin();
    const had = run.skip;
    nopeSave.update((s) => ({
      ...s,
      run: s.run ? grantSkip(s.run) : s.run,
      stats: { ...s.stats, flies: s.stats.flies + 1 },
    }));
    if (nopeSave.get().stats.flies >= 10) unlockNopeAchievement("fly-swatter");
    setSaid({
      text: had ? "Your skip slot is already full. Greedy." : "You caught a skip. Hmph. It's in the top corner.",
      mood: "offended",
      wink: false,
    });
  };

  // --- Hotspots: everything is clickable (secret rule 2) ---------------------------------------
  const registerHotspot = useCallback((name: HotspotName, handler: HotspotHandler) => {
    hotspots.current.set(name, handler);
    return () => {
      if (hotspots.current.get(name) === handler) hotspots.current.delete(name);
    };
  }, []);

  const fire = (name: HotspotName, detail: { index?: number } = {}) => {
    if (phaseRef.current !== "question") return;
    const handler = hotspots.current.get(name);
    if (handler && handler(detail) !== false) return;

    if (name === "skip" && run.skip) {
      if (meta.boss) setSaid({ text: "Skips don't work on boss questions. Nice try.", mood: "smug", wink: false });
      else setSkipAsk(true);
      return;
    }
    const n = counter.current++;
    if (name === "host") {
      sfx.squeak();
      setSaid({ text: pickLine(POKE_LINES, n), mood: "offended", wink: false });
      return;
    }
    if (name === "stage") return;
    setSaid({ text: pickLine(HOTSPOT_LINES[name], n), mood: "neutral", wink: false });
  };

  const playContext = useMemo<PlayContextValue>(() => ({ paused, stage, registerHotspot }), [paused, stage, registerHotspot]);

  // --- Esc pauses --------------------------------------------------------------------------------
  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (event.key !== "Escape" || menuOpen || phaseRef.current === "intro") return;
    event.preventDefault();
    setMenuOpen(true);
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKey(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  // --- What Mr. Nope is saying -----------------------------------------------------------------
  const baseHost: HostState =
    fails >= 2
      ? { text: meta.hint, mood: "neutral", wink: false }
      : meta.host
        ? {
            text: meta.host.text,
            mood: meta.host.mood ?? (meta.host.wink ? "smug" : "neutral"),
            wink: !!meta.host.wink,
            typing: meta.host.typing,
          }
        : QUIET;
  const host = phase === "intro" ? QUIET : (reaction ?? said ?? baseHost);

  const api: QuestionApi = {
    correct,
    wrong,
    say: (text, options) => setSaid({ text, mood: options?.mood ?? "neutral", wink: !!options?.wink, typing: options?.typing }),
    remember: (key, value) => nopeSave.update((s) => ({ ...s, memory: { ...s.memory, [key]: value } })),
    recall: (key) => save.memory[key],
    meta,
    episode: run.episode,
    number: shown + 1,
    fails,
    attempt: run.attempt,
    hearts: run.hearts,
    stamps: visibleStamps(run.wall),
    results: run.results,
    coarse,
    colorblind: comfort.colorblind,
    reducedMotion: comfort.reducedMotion,
    seed: run.seed,
  };

  const locked = phase !== "question" || menuOpen;

  return (
    <PlayProvider value={playContext}>
      <div
        className={cn(styles.stage, "flex min-h-[calc(100dvh-4rem)] flex-col pb-6")}
        data-phase={phase}
      >
        <StampDefs />
        <Backdrop theme={theme} />

        {/* The sky and the bare stage are clickable too. */}
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          className="absolute inset-0 z-0 cursor-default"
          onClick={() => fire("stage")}
        />
        <button
          type="button"
          aria-label="The sky"
          className={cn(styles.skyArea, "z-0 cursor-default outline-offset-[-6px]")}
          onClick={() => fire("sky")}
        />

        <StampWall seed={run.seed} count={run.wall} portrait={portrait} wobble={meta.wall} front={meta.wall} />

        {/* Containers ignore the pointer, so clicks between things reach the sky and the stage. */}
        <div
          className={cn("pointer-events-none relative z-10 flex flex-1 flex-col", shaking && styles.shake)}
          onAnimationEnd={(event) => {
            if (event.target === event.currentTarget) setShaking(false);
          }}
        >
          <Hud
            episode={episode.id}
            episodeName={episode.name}
            number={shown + 1}
            hearts={run.hearts}
            lostHeart={lostHeart}
            hasSkip={run.skip}
            results={run.results}
            onHotspot={fire}
            onPause={() => {
              if (phaseRef.current !== "intro") setMenuOpen(true);
            }}
          />

          <div
            className={cn(
              "mx-auto grid w-full max-w-6xl flex-1 gap-4 px-3 pt-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-8 lg:pt-8",
              (meta.wall || meta.hostless) && "lg:grid-cols-1",
            )}
          >
            <div
              className={cn(
                "lg:order-2 lg:self-center [&_button]:pointer-events-auto",
                // Red stamps on a red host would be hard to count: he steps off for wall questions.
                meta.wall && "hidden",
                // The question draws its own Mr. Nope: his bubble sits above the card instead.
                meta.hostless && "lg:order-1 lg:mx-auto lg:min-h-12 lg:w-full lg:max-w-[46rem]",
              )}
            >
              <HostPanel
                host={host}
                hideHost={meta.hostless}
                reducedMotion={comfort.reducedMotion}
                onPoke={() => fire("host")}
              />
            </div>

            <div
              ref={cardBox}
              className={cn(
                "flex justify-center lg:order-1",
                meta.wall ? "items-end self-end" : "items-start lg:items-center",
              )}
            >
              <AnimatePresence mode="wait" initial={false}>
                {phase !== "intro" && (
                  <QuestionCard
                    key={`${shown}-${questionKey}`}
                    entry={entry}
                    api={api}
                    locked={locked}
                    compact={meta.wall}
                    reducedMotion={comfort.reducedMotion}
                    onFuseExpire={() => {
                      const bomb = meta.bomb;
                      if (!bomb) return;
                      const expire = bomb.expire ?? (bomb.kind === "green" ? "pass" : "fail");
                      if (expire === "pass") correct("…It went out. Green fuses are kind fuses.");
                      else if (expire === "fail")
                        wrong({
                          boom: bomb.kind === "red",
                          line: bomb.kind === "red" ? "BOOM. Too slow." : "It went out. But the question told you what to do.",
                        });
                    }}
                    onSpark={() => fire("fuse")}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Things questions put on the stage, outside their card. */}
        <div ref={setStage} className="pointer-events-none absolute inset-0 z-30 [&>*]:pointer-events-auto" />

        {fly && (
          <SkipFly
            key={fly.id}
            path={fly.path}
            reducedMotion={comfort.reducedMotion}
            onCatch={catchFly}
            onGone={() => setFly(null)}
          />
        )}
        {flyPlan && phase === "question" && !fly && (
          <FlyLauncher
            key={`${shown}-${questionKey}`}
            delayMs={flyPlan.delayMs}
            onLaunch={() => setFly({ path: flyPlan.path, id: ++counter.current })}
          />
        )}

        <canvas ref={canvas} aria-hidden className="pointer-events-none absolute inset-0 z-40 size-full" />
        <FakeConfetti id={fakeId} />
        <Slam id={slamId} reducedMotion={comfort.reducedMotion} />

        {skipAsk && run.skip && phase === "question" && (
          <div className="absolute inset-x-0 top-20 z-50 flex justify-center px-4">
            <div role="alertdialog" aria-label="Use your skip?" className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border-[3px] border-[#161414] bg-white px-5 py-3 text-[#161414] shadow-[0_8px_0_0_#00000055]">
              <p className={cn(styles.show, "text-lg")}>Use your skip on this question?</p>
              <button type="button" className="btn btn-sm" onClick={skip} autoFocus>
                Skip it
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSkipAsk(false)}>
                Keep it
              </button>
            </div>
          </div>
        )}

        <AnimatePresence>
          {phase === "intro" && (
            <EpisodeIntro
              episode={episode}
              mode={introMode}
              attempt={run.attempt}
              number={shown + 1}
              onDone={() => {
                if (phaseRef.current === "intro") go("question");
              }}
            />
          )}
        </AnimatePresence>

        <p className="sr-only" aria-live="assertive">
          {announcement}
        </p>

        <PauseMenu
          open={menuOpen}
          onResume={() => setMenuOpen(false)}
          onRestart={() => {
            setMenuOpen(false);
            onRestart();
          }}
          onQuit={() => {
            const spent = takeElapsed();
            if (spent > 0) nopeSave.update((s) => (s.run ? { ...s, run: addTime(s.run, spent) } : s));
            setMenuOpen(false);
            onQuit();
          }}
        />
      </div>
    </PlayProvider>
  );
}
