"use client";

// Cursor Escape (Plan/12-cursor-escape.md). Loaded client-only by the play page's GameLoader. Screens:
// DeskOS 98 booting (the title) → the desktop (drives, and their windows as files) → the windows, one
// after another (each closes with a card saying how it went) → The Uninstaller → shutting down.
import { useEffect, useState } from "react";
import { getAudio } from "@/engine/audio/engine";
import { unlockPointer } from "@/engine/browser/pointer-lock";
import { useSave } from "@/engine/save";
import { recordRun as saveRunHistory } from "@/engine/save/runs";
import { useComfort } from "@/games/shared/device";
import { ElsewhereNotice, useTabGuard } from "@/games/shared/tab-guard";
import { cn } from "@/lib/cn";
import { unlockCursorAchievement } from "./achievements";
import { music, startupJingle, type Song } from "./audio/music";
import { loadSfx } from "./audio/sfx";
import { isCleared, isOpen, recordCrash, recordTurned, recordWin, type AchievementId } from "./core/progress";
import styles from "./cursor-escape.module.css";
import { DRIVES, driveOf, FINAL_LEVEL, getLevel, LEVEL_IDS, nextLevelId, type DriveInfo } from "./levels";
import type { LevelResult } from "./play/runtime";
import { cursorSave } from "./save";
import { BootScreen } from "./ui/Boot";
import { Desktop } from "./ui/Desktop";
import { Ending } from "./ui/Ending";
import { Calibration, HelpDialog, OptionsDialog, TrophyCase } from "./ui/Menus";
import { PlayScreen, type Recorded } from "./ui/Play";

type Screen = { name: "boot" } | { name: "desktop"; drive: DriveInfo["id"] | null; selected: string } | { name: "play"; levelId: string } | { name: "ending" };

const unlock = (ids: readonly AchievementId[]) => ids.forEach((id) => unlockCursorAchievement(id));

const SONGS: Record<string, Song> = { C: "desktop", D: "control", E: "internet", F: "system", X: "boss" };

/** The next window to open: the first one not closed yet (or the last). */
function nextUp(): string {
  const save = cursorSave.get();
  return LEVEL_IDS.find((id) => isOpen(save, id) && !isCleared(save, id)) ?? LEVEL_IDS[LEVEL_IDS.length - 1]!;
}

export default function CursorEscape() {
  const save = useSave(cursorSave);
  const comfort = useComfort();
  const [screen, setScreenState] = useState<Screen>({ name: "boot" });
  const [dialog, setDialog] = useState<"help" | "trophies" | "options" | null>(null);
  /** A level waiting for the pointer-speed check. */
  const [calibrating, setCalibrating] = useState<string | null>(null);

  const setScreen = (next: Screen) => {
    setScreenState(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const { elsewhere, playHere } = useTabGuard({
    channel: "mfg:cursor-escape",
    save: cursorSave,
    onElsewhere: () => setScreen({ name: "boot" }),
  });

  // Leaving the game stops its music and lets go of the mouse.
  useEffect(
    () => () => {
      music.stop();
      unlockPointer();
    },
    [],
  );

  const menuMusic = () => {
    getAudio();
    void loadSfx();
    music.play("menu");
  };

  const enter = (levelId: string) => {
    getAudio();
    void loadSfx();
    music.play(SONGS[levelId[0]!] ?? "desktop");
    setScreen({ name: "play", levelId });
  };

  /** Into a window (the pointer-speed check first, the very first time). */
  const play = (levelId: string) => {
    if (!cursorSave.get().calibrated) {
      getAudio();
      setCalibrating(levelId);
      return;
    }
    enter(levelId);
  };

  const desktop = (selected = nextUp()) => {
    menuMusic();
    setScreen({ name: "desktop", drive: driveOf(selected).id, selected });
  };

  const onWin = (levelId: string, result: LevelResult): Recorded => {
    const level = getLevel(levelId);
    const assisted = cursorSave.get().prefs.assist;
    const update = recordWin(cursorSave.get(), levelId, level.medals, result, assisted);
    cursorSave.set({ ...update.save, stats: { ...update.save.stats, playTicks: update.save.stats.playTicks + result.ticks } });
    unlock(update.unlock);
    cursorSave.flush();
    if (!assisted) void saveRunHistory({ game: "cursor-escape", mode: "level", level: levelId, score: result.ticks });
    // The last [X] isn't a window's: it's DeskOS 98's own. Straight to the shutdown.
    if (levelId === FINAL_LEVEL) finish();
    return { medal: update.medal, best: update.best, newBest: update.newBest, assisted };
  };

  /** The end of everything: DeskOS 98 shuts down, and lets go of the mouse. */
  const finish = () => {
    unlockPointer();
    music.stop();
    cursorSave.update((s) => ({ ...s, finished: true }));
    unlock(["free-at-last"]);
    setScreen({ name: "ending" });
  };

  const body = (() => {
    if (elsewhere) return <ElsewhereNotice game="Cursor Escape" onPlayHere={playHere} />;
    switch (screen.name) {
      case "boot":
        return (
          <BootScreen
            save={save}
            reducedMotion={comfort.reducedMotion}
            onStart={() => {
              getAudio();
              startupJingle();
              // A new player goes straight into C:\-01.
              if (!LEVEL_IDS.some((id) => isCleared(cursorSave.get(), id))) play(LEVEL_IDS[0]!);
              else desktop();
            }}
            onDesktop={() => desktop()}
            onHelp={() => setDialog("help")}
            onTrophies={() => setDialog("trophies")}
            onOptions={() => setDialog("options")}
          />
        );
      case "desktop":
        return (
          <Desktop
            save={save}
            drive={screen.drive}
            selected={screen.selected}
            onDrive={(drive) => setScreenState({ name: "desktop", drive, selected: drive ? (DRIVES.find((d) => d.id === drive)!.levels.find((l) => isOpen(cursorSave.get(), l.id) && !isCleared(cursorSave.get(), l.id))?.id ?? DRIVES.find((d) => d.id === drive)!.levels[0]!.id) : screen.selected })}
            onSelect={(selected) => setScreenState({ ...screen, selected })}
            onPlay={(id) => play(id)}
            onBoot={() => setScreen({ name: "boot" })}
            onHelp={() => setDialog("help")}
            onTrophies={() => setDialog("trophies")}
            onOptions={() => setDialog("options")}
          />
        );
      case "play":
        return (
          <PlayScreen
            levelId={screen.levelId}
            onWin={onWin}
            onCrash={(levelId) => cursorSave.set(recordCrash(cursorSave.get(), levelId))}
            onStat={(kind) => {
              if (kind === "found") unlock(["identity-crisis"]);
              else {
                const turned = recordTurned(cursorSave.get());
                cursorSave.set(turned.save);
                unlock(turned.unlock);
              }
            }}
            onNext={(levelId) => {
              const next = nextLevelId(levelId);
              if (!next) {
                finish();
                return;
              }
              if (next[0] !== levelId[0]) music.play(SONGS[next[0]!] ?? "desktop");
              setScreenState({ name: "play", levelId: next });
            }}
            onDesktop={() => {
              unlockPointer();
              desktop(screen.levelId);
            }}
          />
        );
      case "ending":
        return <Ending save={save} onDesktop={() => desktop(LEVEL_IDS[LEVEL_IDS.length - 1]!)} />;
    }
  })();

  return (
    <div className={cn(styles.root, "relative")}>
      {body}
      <HelpDialog open={dialog === "help"} onOpenChange={(open) => setDialog(open ? "help" : null)} />
      <TrophyCase open={dialog === "trophies"} onOpenChange={(open) => setDialog(open ? "trophies" : null)} />
      <OptionsDialog open={dialog === "options"} onOpenChange={(open) => setDialog(open ? "options" : null)} />
      <Calibration
        open={calibrating !== null}
        onDone={() => {
          const waiting = calibrating;
          cursorSave.update((s) => ({ ...s, calibrated: true }));
          setCalibrating(null);
          if (waiting) enter(waiting);
        }}
      />
    </div>
  );
}
