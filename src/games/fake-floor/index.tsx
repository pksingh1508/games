"use client";

// Fake Floor (Plan/05-fake-floor.md). Loaded client-only by the play page's GameLoader.
// Screens: title → the building (map) → rooms one after another (a card shows how the last one
// went) → a world's end, time trials, and The Floor's ending.
import { useEffect, useState } from "react";
import { getAudio } from "@/engine/audio/engine";
import { newSeed } from "@/engine/rng";
import { useSave } from "@/engine/save";
import { recordRun as saveRunHistory } from "@/engine/save/runs";
import { useComfort } from "@/games/shared/device";
import { ElsewhereNotice, useTabGuard } from "@/games/shared/tab-guard";
import { cn } from "@/lib/cn";
import { unlockFakeFloorAchievement } from "./achievements";
import { ambience } from "./audio/ambience";
import { music } from "./audio/music";
import { loadSfx } from "./audio/sfx";
import { ticksToMs } from "./core/constants";
import { isCleared, recordClear, recordFall, recordHidden, recordThrow, recordTrial, type AchievementId } from "./core/progress";
import type { RoomSession } from "./core/session";
import type { FallCause } from "./core/world";
import styles from "./fake-floor.module.css";
import { FINAL_ROOM, isUnlocked, nextRoomId, ROOM_IDS, worldOfRoom, WORLDS, type WorldId } from "./rooms";
import { fakeFloorSave } from "./save";
import { HelpDialog, OptionsDialog, TrophyCase } from "./ui/Menus";
import { PlayScreen, type RoomToast } from "./ui/Play";
import { Ending, TrialResults, WorldComplete, type TrialResult } from "./ui/Results";
import { TitleScreen } from "./ui/Title";
import { WorldMap } from "./ui/WorldMap";

interface TrialState {
  world: WorldId;
  index: number;
  /** Ticks on the clock when this room started. */
  base: number;
  splits: number[];
  falls: number;
  thrown: number;
  assisted: boolean;
}

type Screen =
  | { name: "title" }
  | { name: "map"; world: WorldId }
  | { name: "play"; roomId: string; key: number; toast: RoomToast | null; trial: TrialState | null }
  | { name: "worldDone"; world: WorldId; last: RoomToast }
  | { name: "trialDone"; result: TrialResult }
  | { name: "ending" };

const unlock = (ids: readonly AchievementId[]) => ids.forEach((id) => unlockFakeFloorAchievement(id));

export default function FakeFloor() {
  const save = useSave(fakeFloorSave);
  const comfort = useComfort();
  const [screen, setScreenState] = useState<Screen>({ name: "title" });
  const [dialog, setDialog] = useState<"help" | "trophies" | "options" | null>(null);

  const setScreen = (next: Screen) => {
    setScreenState(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const { elsewhere, playHere } = useTabGuard({
    channel: "mfg:fake-floor",
    save: fakeFloorSave,
    onElsewhere: () => setScreen({ name: "title" }),
  });

  // Leaving the game stops its music and ambience.
  useEffect(
    () => () => {
      music.stop();
      ambience.stop();
    },
    [],
  );

  const cleared = (id: string) => isCleared(fakeFloorSave.get(), id);

  /** Menus have their own tune. Always from a tap or a key press (audio may start). */
  const menuMusic = () => {
    getAudio();
    void loadSfx();
    music.play("menu");
  };

  const play = (roomId: string, toast: RoomToast | null = null, trial: TrialState | null = null) => {
    getAudio();
    void loadSfx();
    setScreen({ name: "play", roomId, key: newSeed(), toast, trial });
  };

  const map = (world?: WorldId) => {
    menuMusic();
    const last = fakeFloorSave.get().last;
    const next = ROOM_IDS.find((id) => isUnlocked(id, cleared) && !cleared(id));
    setScreen({ name: "map", world: world ?? worldOfRoom(next ?? last ?? ROOM_IDS[0]!).id });
  };

  const startTrial = (world: WorldId) => {
    const first = WORLDS.find((w) => w.id === world)!.rooms[0]!;
    play(first, null, { world, index: 0, base: 0, splits: [], falls: 0, thrown: 0, assisted: false });
  };

  const apply = (result: { save: typeof save; unlock: AchievementId[] }) => {
    fakeFloorSave.set(result.save);
    unlock(result.unlock);
  };

  const onWin = (current: Extract<Screen, { name: "play" }>, session: RoomSession, assisted: boolean) => {
    const roomId = current.roomId;
    const ticks = session.time ?? 0;
    const result = recordClear(fakeFloorSave.get(), { roomId, ticks, falls: session.falls, thrown: session.thrown, assisted });
    apply(result);
    fakeFloorSave.flush();
    void saveRunHistory({ game: "fake-floor", mode: current.trial ? "trial" : "room", level: roomId, score: ticksToMs(ticks) });
    const toast: RoomToast = { roomId, ticks, earned: result.earned, fresh: result.fresh, eligible: result.eligible, newBest: result.newBest };

    const tr = current.trial;
    if (tr) {
      const total = tr.base + session.elapsed;
      const run: TrialState = {
        ...tr,
        index: tr.index + 1,
        base: total,
        splits: [...tr.splits, total],
        falls: tr.falls + session.falls,
        thrown: tr.thrown + session.thrown,
        assisted: tr.assisted || assisted,
      };
      const rooms = WORLDS.find((w) => w.id === tr.world)!.rooms;
      const next = rooms[run.index];
      if (next) {
        play(next, toast, run);
        return;
      }
      const before = fakeFloorSave.get().trials[String(tr.world)];
      const finished = recordTrial(fakeFloorSave.get(), { world: tr.world, total, splits: run.splits, falls: run.falls, thrown: run.thrown, assisted: run.assisted });
      apply(finished);
      fakeFloorSave.flush();
      void saveRunHistory({ game: "fake-floor", mode: "trial", level: `world-${tr.world}`, score: ticksToMs(total) });
      menuMusic();
      setScreen({
        name: "trialDone",
        result: {
          world: tr.world,
          total,
          splits: run.splits,
          falls: run.falls,
          thrown: run.thrown,
          assisted: run.assisted,
          newBest: finished.newBest,
          previous: finished.previous,
          bestSplits: before?.splits ?? [],
        },
      });
      return;
    }

    if (roomId === FINAL_ROOM) {
      menuMusic();
      setScreen({ name: "ending" });
      return;
    }
    const world = worldOfRoom(roomId);
    if (world.rooms.at(-1) === roomId) {
      menuMusic();
      setScreen({ name: "worldDone", world: world.id, last: toast });
      return;
    }
    const next = nextRoomId(roomId);
    if (next) play(next, toast);
    else map();
  };

  const body = (() => {
    if (elsewhere) return <ElsewhereNotice game="Fake Floor" onPlayHere={playHere} />;
    switch (screen.name) {
      case "title":
        return (
          <TitleScreen
            save={save}
            reducedMotion={comfort.reducedMotion}
            onStart={() => {
              // A brand-new player goes straight into 1-01 ("Welcome Mat").
              if (!ROOM_IDS.some(cleared)) play(ROOM_IDS[0]!);
              else map();
            }}
            onMap={() => map()}
            onHelp={() => setDialog("help")}
            onTrophies={() => setDialog("trophies")}
            onOptions={() => setDialog("options")}
          />
        );
      case "map":
        return (
          <WorldMap
            save={save}
            world={screen.world}
            onWorld={(world) => setScreenState({ name: "map", world })}
            onPlay={(id) => play(id)}
            onTrial={startTrial}
            onBack={() => setScreen({ name: "title" })}
            onHelp={() => setDialog("help")}
            onTrophies={() => setDialog("trophies")}
            onOptions={() => setDialog("options")}
          />
        );
      case "play": {
        const current = screen;
        return (
          <PlayScreen
            key={current.key}
            roomId={current.roomId}
            trial={current.trial ? { world: current.trial.world, index: current.trial.index, base: current.trial.base } : null}
            toast={current.toast}
            onFall={(roomId, cause: FallCause) => apply(recordFall(fakeFloorSave.get(), roomId, cause))}
            onThrow={(roomId) => apply(recordThrow(fakeFloorSave.get(), roomId))}
            onHidden={(roomId) => {
              apply(recordHidden(fakeFloorSave.get(), roomId));
              fakeFloorSave.flush();
            }}
            onLeap={() => unlock(["leap-of-faith"])}
            onWin={(session, assisted) => onWin(current, session, assisted)}
            onRestart={() => (current.trial ? startTrial(current.trial.world) : play(current.roomId))}
            onMap={() => map(worldOfRoom(current.roomId).id)}
          />
        );
      }
      case "worldDone": {
        const next = WORLDS.find((w) => w.id === screen.world + 1);
        return (
          <WorldComplete
            save={save}
            world={screen.world}
            last={screen.last}
            onNext={() => (next ? play(next.rooms[0]!) : map())}
            onMap={() => map(screen.world)}
            onTrial={() => startTrial(screen.world)}
          />
        );
      }
      case "trialDone":
        return <TrialResults result={screen.result} onAgain={() => startTrial(screen.result.world)} onMap={() => map(screen.result.world)} />;
      case "ending":
        return <Ending save={save} onMap={() => map(6)} />;
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
