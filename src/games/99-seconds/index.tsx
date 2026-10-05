"use client";

// 99 Seconds (Plan/03-99-seconds.md). Loaded client-only by the play page's GameLoader. Screens: the title (its
// clock counts down) → the chapters → a chapter's title card → the loop, again and again → out (a rank, or one of
// the two endings) → the credits (exactly 99 seconds of them). Escaped chapters can be replayed as a Single Loop.
import { useEffect, useState } from "react";
import { getAudio } from "@/engine/audio/engine";
import { useSave } from "@/engine/save";
import { recordRun } from "@/engine/save/runs";
import { ElsewhereNotice, useTabGuard } from "@/games/shared/tab-guard";
import { cn } from "@/lib/cn";
import { unlockNinetyAchievement } from "./achievements";
import { chime } from "./audio/sounds";
import type { LoopResult } from "./core/loop";
import { CHAPTERS, type ChapterId } from "./core/types";
import styles from "./ninety.module.css";
import { creditsSeen, loopEnded, noteClues, storyChapter, type AchievementId, type LoopReport } from "./progress";
import { ninetySave } from "./save";
import { ChapterDone, ChapterIntro, ChapterSelect } from "./ui/Chapters";
import { ParadoxEnding, TrueEnding } from "./ui/Ending";
import { HelpDialog, OptionsDialog, TrophyCase } from "./ui/Menus";
import { PlayScreen } from "./ui/Play";
import { TitleScreen } from "./ui/Title";

type Screen =
  | { name: "title" }
  | { name: "chapters" }
  | { name: "intro"; chapter: ChapterId; single: boolean }
  | { name: "play"; chapter: ChapterId; single: boolean; key: number }
  | { name: "done"; chapter: ChapterId; single: boolean; result: LoopResult }
  | { name: "true" }
  | { name: "paradox" };

const unlock = (ids: readonly AchievementId[]) => ids.forEach((id) => unlockNinetyAchievement(id));

export default function NinetySeconds() {
  const save = useSave(ninetySave);
  const [screen, setScreenState] = useState<Screen>({ name: "title" });
  const [dialog, setDialog] = useState<"help" | "trophies" | "options" | null>(null);

  const setScreen = (next: Screen) => {
    setScreenState(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const { elsewhere, playHere } = useTabGuard({ channel: "mfg:99-seconds", save: ninetySave, onElsewhere: () => setScreen({ name: "title" }) });

  useEffect(() => () => ninetySave.flush(), []);

  const intro = (chapter: ChapterId, single = false) => {
    getAudio();
    setScreen({ name: "intro", chapter, single });
  };

  const onClues = (chapter: ChapterId) => (found: ReadonlyArray<{ id: string; at: number }>) => {
    ninetySave.set(noteClues(ninetySave.get(), chapter, found));
  };

  const onLoopEnd = (report: LoopReport) => {
    const update = loopEnded(ninetySave.get(), report);
    ninetySave.set(update.save);
    ninetySave.flush();
    unlock(update.unlock);
    if (update.escaped && report.result !== "paradox") {
      chime();
      const rec = update.save.chapters[report.chapter];
      void recordRun({ game: "99-seconds", mode: report.single ? "single" : "story", level: report.chapter, score: report.single ? Math.round(report.realMs) : (rec.escapedIn ?? rec.progress.loops) });
    }
  };

  const onOver = (chapter: ChapterId, single: boolean) => (result: LoopResult) => {
    if (!single && result === "true") setScreen({ name: "true" });
    else if (!single && result === "paradox") setScreen({ name: "paradox" });
    else setScreen({ name: "done", chapter, single, result });
  };

  const body = (() => {
    if (elsewhere) return <ElsewhereNotice game="99 Seconds" onPlayHere={playHere} />;
    switch (screen.name) {
      case "title":
        return (
          <TitleScreen
            save={save}
            onStart={() => {
              const next = storyChapter(save);
              if (next) intro(next);
              else setScreen({ name: "chapters" });
            }}
            onChapters={() => setScreen({ name: "chapters" })}
            onHelp={() => setDialog("help")}
            onTrophies={() => setDialog("trophies")}
            onOptions={() => setDialog("options")}
          />
        );
      case "chapters":
        return <ChapterSelect save={save} onPlay={(id) => intro(id)} onSingle={(id) => intro(id, true)} onBack={() => setScreen({ name: "title" })} />;
      case "intro":
        return (
          <ChapterIntro
            id={screen.chapter}
            single={screen.single}
            onBack={() => setScreen({ name: "chapters" })}
            onStart={() => {
              getAudio();
              setScreen({ name: "play", chapter: screen.chapter, single: screen.single, key: Date.now() });
            }}
          />
        );
      case "play":
        return (
          <PlayScreen
            key={screen.key}
            chapter={screen.chapter}
            mode={save.prefs.mode}
            single={screen.single}
            onClues={onClues(screen.chapter)}
            onLoopEnd={onLoopEnd}
            onOver={onOver(screen.chapter, screen.single)}
            onLeave={() => setScreen({ name: "chapters" })}
          />
        );
      case "done": {
        const i = CHAPTERS.indexOf(screen.chapter);
        const next = !screen.single && i < CHAPTERS.length - 1 ? CHAPTERS[i + 1]! : null;
        return (
          <ChapterDone
            id={screen.chapter}
            save={save}
            single={screen.single}
            result={screen.result}
            onNext={next ? () => intro(next) : null}
            onChapters={() => setScreen({ name: "chapters" })}
            onRetry={() => intro(screen.chapter, screen.single)}
          />
        );
      }
      case "true":
        return (
          <TrueEnding
            onDone={() => {
              ninetySave.set(creditsSeen(ninetySave.get()));
              ninetySave.flush();
              setScreen({ name: "title" });
            }}
          />
        );
      case "paradox":
        return (
          <ParadoxEnding
            room={{ chapter: "clock-room", place: "south", room: "clock", mirrored: false, flags: new Set(["second100"]), items: [], entry: "", left: 0, display: 100, loopSeconds: 99, elapsedMs: 99_000, extra: true, loops: 0, scratches: [] }}
            onAgain={() => intro("clock-room")}
            onTitle={() => setScreen({ name: "title" })}
          />
        );
    }
  })();

  return (
    <div className={cn(styles.root, "relative")} data-game="99-seconds">
      {body}
      <HelpDialog open={dialog === "help"} onOpenChange={(open) => setDialog(open ? "help" : null)} />
      <TrophyCase open={dialog === "trophies"} onOpenChange={(open) => setDialog(open ? "trophies" : null)} />
      <OptionsDialog open={dialog === "options"} onOpenChange={(open) => setDialog(open ? "options" : null)} />
    </div>
  );
}
