"use client";

// One More Step (Plan/01-one-more-step.md). Loaded client-only by the play page's GameLoader. Screens: the
// title (its Start button hops away, once) → the map → a level → and after the finale, the end.
import { useEffect, useState } from "react";
import { getAudio } from "@/engine/audio/engine";
import { useSave } from "@/engine/save";
import { recordRun } from "@/engine/save/runs";
import { ElsewhereNotice, useTabGuard } from "@/games/shared/tab-guard";
import { cn } from "@/lib/cn";
import { unlockOmsAchievement } from "./achievements";
import { loadSfx } from "./audio/sfx";
import { FINAL_LEVEL, LEVEL_IDS, nextLevelId } from "./levels";
import styles from "./one-more-step.module.css";
import { isCleared, isOpen, recordClear, recordStats, type AchievementId, type Clear } from "./progress";
import type { StatsAdd } from "./play/runtime";
import { omsSave } from "./save";
import { WorldMap } from "./ui/Map";
import { HelpDialog, OptionsDialog, TrophyCase } from "./ui/Menus";
import { PlayScreen, type Recorded } from "./ui/Play";
import { TitleScreen } from "./ui/Title";

type Screen = { name: "title" } | { name: "map" } | { name: "play"; levelId: string };

const unlock = (ids: readonly AchievementId[]) => ids.forEach((id) => unlockOmsAchievement(id));

/** The level to play next: the first that's open and not done (or the finale). */
function nextUp(): string {
  const save = omsSave.get();
  return LEVEL_IDS.find((id) => isOpen(save, id) && !isCleared(save, id)) ?? FINAL_LEVEL;
}

export default function OneMoreStep() {
  const save = useSave(omsSave);
  const [screen, setScreenState] = useState<Screen>({ name: "title" });
  const [dialog, setDialog] = useState<"help" | "trophies" | "options" | null>(null);

  const setScreen = (next: Screen) => {
    setScreenState(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const { elsewhere, playHere } = useTabGuard({ channel: "mfg:one-more-step", save: omsSave, onElsewhere: () => setScreen({ name: "title" }) });

  // Stats arrive with every step: save them in a batch now and then (the save's own debounce does the rest).
  useEffect(() => () => omsSave.flush(), []);

  const play = (levelId: string) => {
    getAudio();
    void loadSfx();
    setScreen({ name: "play", levelId });
  };

  const onWin = (levelId: string, clear: Clear): Recorded => {
    const update = recordClear(omsSave.get(), levelId, clear);
    omsSave.set(update.save);
    unlock(update.unlock);
    omsSave.flush();
    void recordRun({ game: "one-more-step", mode: "level", level: levelId, score: clear.steps });
    return { stars: update.stars, best: update.save.levels[levelId]!.best ?? clear.steps, newBest: update.newBest };
  };

  const onStats = (add: StatsAdd) => {
    const update = recordStats(omsSave.get(), add);
    omsSave.set(update.save);
    unlock(update.unlock);
  };

  const body = (() => {
    if (elsewhere) return <ElsewhereNotice game="One More Step" onPlayHere={playHere} />;
    switch (screen.name) {
      case "title":
        return (
          <TitleScreen
            save={save}
            resume={LEVEL_IDS.some((id) => isCleared(save, id))}
            onPlay={() => play(nextUp())}
            onMap={() => setScreen({ name: "map" })}
            onHelp={() => setDialog("help")}
            onTrophies={() => setDialog("trophies")}
            onOptions={() => setDialog("options")}
          />
        );
      case "map":
        return <WorldMap save={save} current={nextUp()} onPlay={play} onBack={() => setScreen({ name: "title" })} />;
      case "play":
        return (
          <PlayScreen
            levelId={screen.levelId}
            onWin={onWin}
            onStats={onStats}
            onNext={(levelId) => {
              const next = nextLevelId(levelId);
              if (next && levelId !== FINAL_LEVEL) setScreenState({ name: "play", levelId: next });
              else setScreen({ name: "map" });
            }}
            onMap={() => setScreen({ name: "map" })}
          />
        );
    }
  })();

  return (
    <div className={cn(styles.root, "relative")}>
      {body}
      <HelpDialog open={dialog === "help"} onOpenChange={(open) => setDialog(open ? "help" : null)} />
      <TrophyCase open={dialog === "trophies"} onOpenChange={(open) => setDialog(open ? "trophies" : null)} />
      <OptionsDialog open={dialog === "options"} onOpenChange={(open) => setDialog(open ? "options" : null)} />
    </div>
  );
}
