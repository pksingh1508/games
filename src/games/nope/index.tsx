"use client";

// NOPE! — the troll quiz (Plan/02-nope.md). Loaded client-only by the play page's GameLoader.
// Screens: title → channel guide → episode → cleared / out of hearts → (after episode 4) credits.
import Link from "next/link";
import { Suspense, use, useState } from "react";
import { useSave } from "@/engine/save";
import { recordRun } from "@/engine/save/runs";
import { newSeed } from "@/engine/rng";
import { Dialog } from "@/components/ui/Dialog";
import { ElsewhereNotice, useTabGuard } from "@/games/shared/tab-guard";
import { cn } from "@/lib/cn";
import { unlockNopeAchievement } from "./achievements";
import { Backdrop } from "./components/Backdrop";
import { ChannelSelect } from "./components/Channels";
import { Credits } from "./components/Credits";
import { HowToPlay, SoundOptions, TrophyCase } from "./components/Menus";
import { PlayScreen } from "./components/PlayScreen";
import { ClearedScreen, FailedScreen, type FailInfo } from "./components/Results";
import { TitleScreen } from "./components/Title";
import { showFont } from "./fonts";
import { sfx } from "./sfx";
import styles from "./nope.module.css";
import { useComfort } from "./play/context";
import { EPISODES, loadEpisode } from "./questions/episodes";
import { nopeSave, type EpisodeId } from "./save";
import { clearEpisode, failEpisode, restartRun, startRun, type ClearSummary } from "./state/run";

// Development only: jump straight to a question from the console, e.g. __nope.jump(2, 6).
if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  (window as unknown as { __nope: object }).__nope = {
    sfx,
    jump(episode: EpisodeId, index: number) {
      const results = Array.from({ length: index }, () => "first" as const);
      nopeSave.update((s) => ({ ...s, unlocked: 4, run: { ...startRun(episode, newSeed()), index, results } }));
      nopeSave.flush();
      window.location.reload();
    },
  };
}

type Screen =
  | { name: "title" }
  | { name: "channels" }
  | { name: "play"; episode: EpisodeId }
  | { name: "cleared"; summary: ClearSummary }
  | { name: "failed"; info: FailInfo }
  | { name: "credits"; summary: ClearSummary };

/** Run history (IndexedDB, best-effort). */
const saveRun = (episode: EpisodeId, score: number, mode: "cleared" | "failed") =>
  void recordRun({ game: "nope", level: `e${episode}`, mode, score });

function Loading() {
  return (
    <div className={cn(styles.stage, "grid min-h-[calc(100dvh-4rem)] place-items-center")}>
      <Backdrop theme="day" />
      <p className={cn(styles.comic, styles.logoText, "relative text-6xl")}>Loading…</p>
    </div>
  );
}

function Episode({ episode, ...props }: { episode: EpisodeId } & Omit<Parameters<typeof PlayScreen>[0], "episode" | "questions" | "run">) {
  const questions = use(loadEpisode(episode));
  const save = useSave(nopeSave);
  if (!save.run || save.run.episode !== episode) return null;
  return (
    <PlayScreen
      key={`${save.run.episode}-${save.run.attempt}`}
      episode={EPISODES[episode]}
      questions={questions}
      run={save.run}
      {...props}
    />
  );
}

export default function NopeGame() {
  const comfort = useComfort();
  const [screen, setScreenState] = useState<Screen>({ name: "title" });
  // Every new screen starts at the top of the stage.
  const setScreen = (next: Screen) => {
    setScreenState(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const [jokeDone, setJokeDone] = useState(false);
  const [dialog, setDialog] = useState<"help" | "trophies" | "options" | null>(null);
  const { elsewhere, playHere } = useTabGuard({
    channel: "mfg:nope",
    save: nopeSave,
    onElsewhere: () => setScreen({ name: "title" }),
  });

  const play = (episode: EpisodeId, fresh = false) => {
    const current = nopeSave.get().run;
    if (fresh || !current || current.episode !== episode) {
      nopeSave.update((s) => ({ ...s, run: startRun(episode, newSeed()) }));
    }
    setScreen({ name: "play", episode });
  };

  const cleared = () => {
    const save = nopeSave.get();
    if (!save.run) return;
    const { save: next, summary } = clearEpisode(save, save.run);
    nopeSave.set(next);
    nopeSave.flush();
    saveRun(summary.episode, summary.score.total, "cleared");
    if (summary.perfect) unlockNopeAchievement("nightmare");
    if (summary.episode === 4) {
      nopeSave.update((s) => ({ ...s, finished: true }));
      unlockNopeAchievement("nope-the-nope");
      setScreen({ name: "credits", summary });
    } else {
      setScreen({ name: "cleared", summary });
    }
  };

  const failed = () => {
    const save = nopeSave.get();
    if (!save.run) return;
    const run = save.run;
    nopeSave.set(failEpisode(save, run));
    nopeSave.flush();
    saveRun(run.episode, 0, "failed");
    setScreen({
      name: "failed",
      info: { episode: run.episode, reached: run.index + 1, nopes: run.nopes, wall: run.wall, attempt: run.attempt },
    });
  };

  const body = (() => {
    if (elsewhere) return <ElsewhereNotice game="NOPE!" onPlayHere={playHere} />;
    switch (screen.name) {
      case "title":
        return (
          <TitleScreen
            jokeDone={jokeDone}
            onJoke={() => setJokeDone(true)}
            onStart={() => setScreen({ name: "channels" })}
            onContinue={() => {
              const run = nopeSave.get().run;
              if (run) play(run.episode);
            }}
            onHelp={() => setDialog("help")}
            onTrophies={() => setDialog("trophies")}
            onOptions={() => setDialog("options")}
            reducedMotion={comfort.reducedMotion}
          />
        );
      case "channels":
        return (
          <ChannelSelect
            onPlay={(episode) => play(episode)}
            onRestart={(episode) => play(episode, true)}
            onBack={() => setScreen({ name: "title" })}
            reducedMotion={comfort.reducedMotion}
          />
        );
      case "play":
        return (
          <Suspense fallback={<Loading />}>
            <Episode
              episode={screen.episode}
              onCleared={cleared}
              onFailed={failed}
              onQuit={() => setScreen({ name: "channels" })}
              onRestart={() => nopeSave.update((s) => (s.run ? { ...s, run: restartRun(s.run) } : s))}
            />
          </Suspense>
        );
      case "cleared": {
        const { summary } = screen;
        const next = summary.episode < 4 ? ((summary.episode + 1) as EpisodeId) : null;
        return (
          <ClearedScreen
            summary={summary}
            onNext={next ? () => play(next, true) : undefined}
            onReplay={() => play(summary.episode, true)}
            onChannels={() => setScreen({ name: "channels" })}
            reducedMotion={comfort.reducedMotion}
          />
        );
      }
      case "failed":
        return (
          <FailedScreen
            info={screen.info}
            onRetry={() => play(screen.info.episode)}
            onChannels={() => setScreen({ name: "channels" })}
            reducedMotion={comfort.reducedMotion}
          />
        );
      case "credits":
        return (
          <Credits
            onDone={() => setScreen({ name: "cleared", summary: screen.summary })}
            reducedMotion={comfort.reducedMotion}
          />
        );
    }
  })();

  return (
    <div className={cn(styles.root, showFont.variable, "relative")}>
      {body}

      <Dialog open={dialog === "help"} onOpenChange={(open) => setDialog(open ? "help" : null)} game="nope" eyebrow="NOPE!" title="How to play">
        <HowToPlay />
      </Dialog>
      <TrophyCase open={dialog === "trophies"} onOpenChange={(open) => setDialog(open ? "trophies" : null)} />
      <Dialog
        open={dialog === "options"}
        onOpenChange={(open) => setDialog(open ? "options" : null)}
        game="nope"
        eyebrow="NOPE!"
        title="Options"
        description="Text size, motion, flashing and colour vision are in the arcade's comfort settings, and NOPE! follows them."
      >
        <SoundOptions />
        <Link href="/settings" className="btn btn-secondary btn-sm mt-5" data-sound="click">
          Open comfort settings
        </Link>
      </Dialog>
    </div>
  );
}
