"use client";

// Almost There (Plan/08-almost-there.md). Loaded client-only by the play page's GameLoader.
// Screens: the title → the climb (one long one, saved all the time) → the real summit's stats.
// Mirror Mountain opens after the first real summit.
import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { getAudio } from "@/engine/audio/engine";
import { newSeed } from "@/engine/rng";
import { useSave } from "@/engine/save";
import { recordRun } from "@/engine/save/runs";
import { useComfort } from "@/games/shared/device";
import { ElsewhereNotice, useTabGuard } from "@/games/shared/tab-guard";
import { cn } from "@/lib/cn";
import { unlockAlmostThereAchievement } from "./achievements";
import styles from "./almost-there.module.css";
import { ambience } from "./audio/live";
import { music } from "./audio/music";
import { loadSfx } from "./audio/sfx";
import { newClimb, resumeClimb, type Climb } from "./core/climb";
import { ticksToMs } from "./core/constants";
import type { Mountain } from "./core/mountain";
import { altitude, formatMetres } from "./core/progress";
import { recordAbandon, recordFakeSummit, recordFall, recordFeather, recordJump, recordStart, recordSummit, type AchievementId, type SummitResult, type Update } from "./core/records";
import { almostThereSave, clearClimb, climbBackup, climbSave, loadClimb, writeClimb } from "./save";
import { Ending } from "./ui/Ending";
import { HelpDialog, OptionsDialog, TrophyCase, WardrobeDialog } from "./ui/Menus";
import { PlayScreen } from "./ui/Play";
import { TitleScreen } from "./ui/Title";
import { getMountain } from "./world";

type Screen =
  | { name: "title" }
  | { name: "play"; mountain: Mountain; climb: Climb; resumed: boolean; key: number }
  | { name: "ending"; climb: Climb; result: SummitResult | null };

/** Both slots (the record and the climb) step aside together when another tab opens the game. */
const guarded = {
  flush() {
    almostThereSave.flush();
    climbSave.flush();
  },
  reload() {
    almostThereSave.reload();
    climbSave.reload();
    climbBackup.reload();
  },
};

const unlock = (ids: readonly AchievementId[]) => ids.forEach((id) => unlockAlmostThereAchievement(id));

const apply = (change: (save: ReturnType<typeof almostThereSave.get>) => Update) => {
  const result = change(almostThereSave.get());
  almostThereSave.set(result.save);
  unlock(result.unlock);
};

export default function AlmostThere() {
  const save = useSave(almostThereSave);
  const comfort = useComfort();
  const [screen, setScreenState] = useState<Screen>({ name: "title" });
  const [dialog, setDialog] = useState<"help" | "trophies" | "options" | "hats" | null>(null);
  const [confirm, setConfirm] = useState<{ mirrored: boolean } | null>(null);
  // The climb in progress, for the title (read again whenever the title shows).
  const [saved, setSaved] = useState<Climb | null>(() => loadClimb());

  const setScreen = (next: Screen) => {
    if (next.name === "title") setSaved(loadClimb());
    setScreenState(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const { elsewhere, playHere } = useTabGuard({
    channel: "mfg:almost-there",
    save: guarded,
    onElsewhere: () => setScreen({ name: "title" }),
  });

  // Leaving the game stops its music and its air.
  useEffect(
    () => () => {
      music.stop();
      ambience.stop();
    },
    [],
  );

  /** Always from a tap or a key press (audio may start). */
  const wake = () => {
    getAudio();
    void loadSfx();
  };

  const play = (climb: Climb, resumed: boolean) => {
    wake();
    setScreen({ name: "play", mountain: getMountain(climb.mirrored), climb, resumed, key: newSeed() });
  };

  const startNew = (mirrored: boolean) => {
    const old = loadClimb();
    if (old) almostThereSave.set(recordAbandon(almostThereSave.get(), old));
    clearClimb();
    const climb = newClimb(getMountain(mirrored));
    almostThereSave.set(recordStart(almostThereSave.get(), mirrored));
    writeClimb(climb);
    play(climb, false);
  };

  const continueClimb = () => {
    const stored = loadClimb();
    if (!stored) {
      startNew(false);
      return;
    }
    play(resumeClimb(getMountain(stored.mirrored), stored), true);
  };

  /** A new climb replaces the one in progress: ask first. */
  const askNew = (mirrored: boolean) => {
    if (loadClimb()) setConfirm({ mirrored });
    else startNew(mirrored);
  };

  const onSummit = (climb: Climb) => {
    const result = recordSummit(almostThereSave.get(), climb);
    almostThereSave.set(result.save);
    unlock(result.unlock);
    almostThereSave.flush();
    clearClimb();
    void recordRun({ game: "almost-there", mode: climb.mirrored ? "mirror" : "climb", level: climb.assisted ? "assisted" : "summit", score: ticksToMs(climb.stats.ticks) });
    music.play("summit");
    setScreen({ name: "ending", climb, result });
  };

  const body = (() => {
    if (elsewhere) return <ElsewhereNotice game="Almost There" onPlayHere={playHere} />;
    switch (screen.name) {
      case "title":
        return (
          <TitleScreen
            save={save}
            saved={saved}
            reducedMotion={comfort.reducedMotion}
            onStart={() => (saved ? continueClimb() : startNew(false))}
            onNew={() => askNew(false)}
            onMirror={() => askNew(true)}
            onHelp={() => setDialog("help")}
            onTrophies={() => setDialog("trophies")}
            onHats={() => setDialog("hats")}
            onOptions={() => setDialog("options")}
          />
        );
      case "play":
        return (
          <PlayScreen
            key={screen.key}
            mountain={screen.mountain}
            climb={screen.climb}
            resumed={screen.resumed}
            onJump={() => apply(recordJump)}
            onFall={(drop) => apply((s) => recordFall(s, drop))}
            onFeather={(index) => {
              apply((s) => recordFeather(s, index));
              almostThereSave.flush();
            }}
            onFakeSummit={() => {
              apply(recordFakeSummit);
              almostThereSave.flush();
            }}
            onSummit={onSummit}
            onQuit={() => {
              wake();
              music.play("title");
              setScreen({ name: "title" });
            }}
          />
        );
      case "ending":
        return (
          <Ending
            climb={screen.climb}
            result={screen.result}
            hat={save.hat}
            onMirror={() => startNew(true)}
            onTitle={() => {
              wake();
              music.play("title");
              setScreen({ name: "title" });
            }}
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
      <WardrobeDialog open={dialog === "hats"} onOpenChange={(open) => setDialog(open ? "hats" : null)} />
      <Dialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
        game="almost-there"
        eyebrow="Almost There"
        title={confirm?.mirrored ? "Climb Mirror Mountain?" : "Start a new climb?"}
        description={saved ? `Your climb so far (${formatMetres(altitude(saved))} up) will be gone. There's only ever one climb.` : undefined}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="btn btn-lg"
            onClick={() => {
              const mirrored = confirm?.mirrored ?? false;
              setConfirm(null);
              startNew(mirrored);
            }}
            data-sound="click"
            data-confirm-new
          >
            Start over
          </button>
          <button type="button" className="btn btn-secondary btn-lg" onClick={() => setConfirm(null)} data-sound="click">
            Keep climbing
          </button>
        </div>
      </Dialog>
    </div>
  );
}
