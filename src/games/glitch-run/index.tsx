"use client";

// Glitch Run (Plan/07-glitch-run.md). Loaded client-only by the play page's GameLoader. Screens: the
// title → the file browser (stage select) → runs (a stage, endless, or today's Daily Corruption; each
// ends on a card) → and at the end of the story, the question in the Root folder.
import { useEffect, useState } from "react";
import { getAudio } from "@/engine/audio/engine";
import { newSeed } from "@/engine/rng";
import { useSave } from "@/engine/save";
import { recordRun as saveRunHistory } from "@/engine/save/runs";
import { useComfort } from "@/games/shared/device";
import { ElsewhereNotice, useTabGuard } from "@/games/shared/tab-guard";
import { cn } from "@/lib/cn";
import { unlockGlitchAchievement } from "./achievements";
import { music } from "./audio/music";
import { loadSfx } from "./audio/sfx";
import { isCleared, isOpen, recordEndless, recordEnding, recordStage, type Update } from "./core/progress";
import type { Daily } from "./gen/generator";
import styles from "./glitch-run.module.css";
import type { RunResult } from "./play/runtime";
import { glitchSave } from "./save";
import { FINAL_STAGE, STAGE_IDS } from "./stages";
import { Browser, type FileId } from "./ui/Browser";
import { FlashWarning, HelpDialog, OptionsDialog, TrophyCase } from "./ui/Menus";
import { PlayScreen, type PlayTarget, type Recorded } from "./ui/Play";
import { Ending } from "./ui/Results";
import { TitleScreen } from "./ui/Title";

type Screen =
  | { name: "title" }
  | { name: "files"; selected: FileId }
  | { name: "play"; target: PlayTarget; key: number }
  | { name: "ending" };

/** The file to point at: the next stage to clear (or the last one, once they're all done). */
function nextFile(): FileId {
  const save = glitchSave.get();
  return STAGE_IDS.find((id) => isOpen(save, id) && !isCleared(save, id)) ?? FINAL_STAGE;
}

export default function GlitchRun() {
  const save = useSave(glitchSave);
  const comfort = useComfort();
  const [screen, setScreenState] = useState<Screen>({ name: "title" });
  const [dialog, setDialog] = useState<"help" | "trophies" | "options" | null>(null);
  /** A run waiting for the photosensitivity warning to be read. */
  const [warning, setWarning] = useState<PlayTarget | null>(null);

  const setScreen = (next: Screen) => {
    setScreenState(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const { elsewhere, playHere } = useTabGuard({
    channel: "mfg:glitch-run",
    save: glitchSave,
    onElsewhere: () => setScreen({ name: "title" }),
  });

  // Leaving the game stops its music.
  useEffect(() => () => music.stop(), []);

  /** Into a run. Always from a tap or a key press (so audio may start). */
  const enter = (target: PlayTarget) => {
    getAudio();
    void loadSfx();
    setScreen({ name: "play", target, key: newSeed() });
  };

  /** A run (the photosensitivity warning comes first, the very first time). */
  const play = (target: PlayTarget) => {
    if (!glitchSave.get().warned) {
      getAudio();
      setWarning(target);
      return;
    }
    enter(target);
  };

  const files = (selected: FileId = nextFile()) => setScreen({ name: "files", selected });

  const apply = (update: Update) => {
    glitchSave.set(update.save);
    update.unlock.forEach((id) => unlockGlitchAchievement(id));
    glitchSave.flush();
  };

  const onEnd = (target: PlayTarget, result: RunResult, daily: Daily | null): Recorded | null => {
    if (target.kind === "stage") {
      const update = recordStage(glitchSave.get(), target.id, result);
      apply(update);
      if (result.won) void saveRunHistory({ game: "glitch-run", mode: "stage", level: target.id, score: result.score });
      if (result.won && target.id === FINAL_STAGE) {
        setScreen({ name: "ending" });
        return null;
      }
      return { newBest: update.newBest, best: glitchSave.get().stages[target.id]?.best ?? 0 };
    }
    const update = recordEndless(glitchSave.get(), result, daily?.key ?? null);
    apply(update);
    void saveRunHistory({ game: "glitch-run", mode: daily ? "daily" : "endless", level: daily?.key, score: result.score });
    const now = glitchSave.get();
    return { newBest: update.newBest, best: daily ? (now.daily[daily.key]?.best ?? 0) : now.endless.best };
  };

  const body = (() => {
    if (elsewhere) return <ElsewhereNotice game="Glitch Run" onPlayHere={playHere} />;
    switch (screen.name) {
      case "title":
        return (
          <TitleScreen
            save={save}
            reducedMotion={comfort.reducedMotion}
            onStart={() => {
              // A brand-new player crashes straight into stage_01.exe.
              if (!STAGE_IDS.some((id) => isCleared(glitchSave.get(), id))) play({ kind: "stage", id: STAGE_IDS[0]! });
              else files();
            }}
            onFiles={() => files()}
            onEndless={() => play({ kind: "endless" })}
            onDaily={() => play({ kind: "daily" })}
            onHelp={() => setDialog("help")}
            onTrophies={() => setDialog("trophies")}
            onOptions={() => setDialog("options")}
          />
        );
      case "files":
        return (
          <Browser
            save={save}
            selected={screen.selected}
            onSelect={(selected) => setScreenState({ name: "files", selected })}
            onRun={(target) => play(target)}
            onBack={() => setScreen({ name: "title" })}
          />
        );
      case "play": {
        const { target } = screen;
        const fileOf = target.kind === "stage" ? target.id : target.kind;
        return (
          <PlayScreen
            key={screen.key}
            target={target}
            onEnd={(result, daily) => onEnd(target, result, daily)}
            onNext={() => {
              if (target.kind !== "stage") return;
              const next = STAGE_IDS[STAGE_IDS.indexOf(target.id) + 1];
              if (next) enter({ kind: "stage", id: next });
              else setScreen({ name: "ending" });
            }}
            onFiles={() => files(fileOf)}
          />
        );
      }
      case "ending":
        return <Ending save={save} onChoose={(choice) => apply(recordEnding(glitchSave.get(), choice))} onFiles={() => files(FINAL_STAGE)} />;
    }
  })();

  const warned = () => {
    const waiting = warning;
    glitchSave.update((s) => ({ ...s, warned: true }));
    setWarning(null);
    if (waiting) enter(waiting);
  };

  return (
    <div className={cn(styles.root, "relative")}>
      {body}
      <HelpDialog open={dialog === "help"} onOpenChange={(open) => setDialog(open ? "help" : null)} />
      <TrophyCase open={dialog === "trophies"} onOpenChange={(open) => setDialog(open ? "trophies" : null)} />
      <OptionsDialog open={dialog === "options"} onOpenChange={(open) => setDialog(open ? "options" : null)} />
      <FlashWarning open={warning !== null} onPlay={warned} />
    </div>
  );
}
