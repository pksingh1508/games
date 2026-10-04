"use client";

// Last Pixel (Plan/10-last-pixel.md). Loaded client-only by the play page's GameLoader. Screens: the title
// ("Last Pıxel", its dot missing) → the levels → a level (clean up, then catch Pix) → after the finale, the
// ending, where Pix becomes the dot on the "i".
import { useEffect, useState } from "react";
import { getAudio } from "@/engine/audio/engine";
import { useSave } from "@/engine/save";
import { recordRun } from "@/engine/save/runs";
import { ElsewhereNotice, useTabGuard } from "@/games/shared/tab-guard";
import { cn } from "@/lib/cn";
import { unlockPixelAchievement } from "./achievements";
import { music } from "./audio/music";
import { loadSfx } from "./audio/sfx";
import { isCleared, isOpen, recordWin, type AchievementId } from "./core/progress";
import type { LevelResult } from "./core/world";
import styles from "./last-pixel.module.css";
import { FINAL_LEVEL, LEVEL_IDS, nextLevelId, worldOf, type WorldInfo } from "./levels";
import { lastPixelSave } from "./save";
import { Ending } from "./ui/Ending";
import { LevelSelect } from "./ui/Levels";
import { HelpDialog, OptionsDialog, TrophyCase } from "./ui/Menus";
import { PlayScreen, type Recorded } from "./ui/Play";
import { TitleScreen } from "./ui/Title";

type Screen = { name: "title" } | { name: "levels"; world: WorldInfo["id"] } | { name: "play"; levelId: string } | { name: "ending" };

const unlock = (ids: readonly AchievementId[]) => ids.forEach((id) => unlockPixelAchievement(id));

/** The level to play next: the first that's open and not done (or the last one). */
function nextUp(): string {
  const save = lastPixelSave.get();
  return LEVEL_IDS.find((id) => isOpen(save, id) && !isCleared(save, id)) ?? FINAL_LEVEL;
}

export default function LastPixel() {
  const save = useSave(lastPixelSave);
  const [screen, setScreenState] = useState<Screen>({ name: "title" });
  const [dialog, setDialog] = useState<"help" | "trophies" | "options" | null>(null);

  const setScreen = (next: Screen) => {
    setScreenState(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const { elsewhere, playHere } = useTabGuard({ channel: "mfg:last-pixel", save: lastPixelSave, onElsewhere: () => setScreen({ name: "title" }) });

  useEffect(() => () => music.stop(), []);

  const wake = () => {
    getAudio();
    void loadSfx();
  };

  const play = (levelId: string) => {
    wake();
    music.stop();
    setScreen({ name: "play", levelId });
  };

  const levels = (world: WorldInfo["id"] = worldOf(nextUp()).id) => {
    wake();
    music.play("menu");
    setScreen({ name: "levels", world });
  };

  const onDone = (levelId: string, result: LevelResult, stars: [boolean, boolean, boolean]): Recorded => {
    const update = recordWin(lastPixelSave.get(), levelId, result, stars);
    lastPixelSave.set({
      ...update.save,
      finished: update.save.finished || levelId === FINAL_LEVEL,
      stats: { ...update.save.stats, playTicks: update.save.stats.playTicks + result.ticks },
    });
    unlock(update.unlock);
    lastPixelSave.flush();
    void recordRun({ game: "last-pixel", mode: "level", level: levelId, score: result.ticks });
    return { stars: update.stars, best: update.save.levels[levelId]!.stars, newBestClean: update.newBestClean, newBestHunt: update.newBestHunt, assisted: result.assisted };
  };

  const body = (() => {
    if (elsewhere) return <ElsewhereNotice game="Last Pixel" onPlayHere={playHere} />;
    switch (screen.name) {
      case "title":
        return (
          <TitleScreen
            save={save}
            resume={LEVEL_IDS.some((id) => isCleared(save, id))}
            onPlay={() => play(nextUp())}
            onLevels={() => levels()}
            onHelp={() => setDialog("help")}
            onTrophies={() => setDialog("trophies")}
            onOptions={() => setDialog("options")}
          />
        );
      case "levels":
        return <LevelSelect save={save} world={screen.world} current={nextUp()} onPlay={play} onBack={() => setScreen({ name: "title" })} />;
      case "play":
        return (
          <PlayScreen
            levelId={screen.levelId}
            onDone={onDone}
            onNext={(levelId) => {
              if (levelId === FINAL_LEVEL) {
                setScreen({ name: "ending" });
                return;
              }
              const next = nextLevelId(levelId);
              if (next) setScreenState({ name: "play", levelId: next });
              else levels();
            }}
            onLevels={() => levels(worldOf(screen.levelId).id)}
          />
        );
      case "ending":
        return <Ending save={save} onLevels={() => levels(5)} />;
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
