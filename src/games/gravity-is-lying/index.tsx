"use client";

// Gravity Is Lying (Plan/15-gravity-is-lying.md). Loaded client-only by the play page's GameLoader.
// Screens: title → Isaac's tower (the map) → rooms one after another (a card shows how the last one
// went) → a world's end, and the ending at the top of Isaac's tree.
import { useEffect, useState } from "react";
import { getAudio } from "@/engine/audio/engine";
import { newSeed } from "@/engine/rng";
import { useSave } from "@/engine/save";
import { recordRun as saveRunHistory } from "@/engine/save/runs";
import { settingsSave } from "@/engine/settings";
import { useComfort } from "@/games/shared/device";
import { ElsewhereNotice, useTabGuard } from "@/games/shared/tab-guard";
import { cn } from "@/lib/cn";
import { unlockGravityAchievement } from "./achievements";
import { hum } from "./audio/hum";
import { music } from "./audio/music";
import { loadSfx } from "./audio/sfx";
import { ticksToMs } from "./core/constants";
import { isCleared, isUnlocked, recordCeiling, recordClear, recordDeath, type AchievementId } from "./core/progress";
import type { WorldId } from "./core/room";
import type { RoomSession } from "./core/session";
import styles from "./gravity-is-lying.module.css";
import { FINAL_ROOM, nextRoomId, ROOM_IDS, worldOf, WORLDS } from "./rooms";
import { gravitySave } from "./save";
import { HelpDialog, MotionWarning, OptionsDialog, TrophyCase } from "./ui/Menus";
import { PlayScreen, type RoomToast } from "./ui/Play";
import { Ending, WorldComplete } from "./ui/Results";
import { TitleScreen } from "./ui/Title";
import { WorldMap } from "./ui/WorldMap";

type Screen =
  | { name: "title" }
  | { name: "map"; world: WorldId }
  | { name: "play"; roomId: string; key: number; toast: RoomToast | null }
  | { name: "worldDone"; world: WorldId; last: RoomToast }
  | { name: "ending" };

const unlock = (ids: readonly AchievementId[]) => ids.forEach((id) => unlockGravityAchievement(id));

export default function GravityIsLying() {
  const save = useSave(gravitySave);
  const comfort = useComfort();
  const [screen, setScreenState] = useState<Screen>({ name: "title" });
  const [dialog, setDialog] = useState<"help" | "trophies" | "options" | null>(null);
  /** A Tilted Town room waiting for the motion warning to be read. */
  const [warning, setWarning] = useState<{ roomId: string; toast: RoomToast | null } | null>(null);

  const setScreen = (next: Screen) => {
    setScreenState(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const { elsewhere, playHere } = useTabGuard({
    channel: "mfg:gravity-is-lying",
    save: gravitySave,
    onElsewhere: () => setScreen({ name: "title" }),
  });

  // Leaving the game stops its music.
  useEffect(
    () => () => {
      music.stop();
      hum.stop();
    },
    [],
  );

  /** Menus have their own tune. Always from a tap or a key press (audio may start). */
  const menuMusic = () => {
    getAudio();
    void loadSfx();
    music.play("menu");
  };

  const enter = (roomId: string, toast: RoomToast | null = null) => {
    getAudio();
    void loadSfx();
    setScreen({ name: "play", roomId, key: newSeed(), toast });
  };

  /** Into a room (the motion warning first, the first time the camera is going to turn). */
  const play = (roomId: string, toast: RoomToast | null = null) => {
    if (worldOf(roomId).id === 4 && !gravitySave.get().seen.motion) {
      setWarning({ roomId, toast });
      return;
    }
    enter(roomId, toast);
  };

  const map = (world?: WorldId) => {
    menuMusic();
    const s = gravitySave.get();
    const next = ROOM_IDS.find((id) => isUnlocked(s, id) && !isCleared(s, id));
    setScreen({ name: "map", world: world ?? worldOf(next ?? s.last ?? ROOM_IDS[0]!).id });
  };

  const apply = (result: { save: typeof save; unlock: AchievementId[] }) => {
    gravitySave.set(result.save);
    unlock(result.unlock);
  };

  const onWin = (roomId: string, session: RoomSession, info: { assisted: boolean; rotated: boolean }) => {
    const ticks = session.time ?? 0;
    const result = recordClear(gravitySave.get(), { roomId, ticks, deaths: session.deaths, apples: session.apples, assisted: info.assisted, rotated: info.rotated });
    apply(result);
    gravitySave.flush();
    void saveRunHistory({ game: "gravity-is-lying", mode: "room", level: roomId, score: ticksToMs(ticks) });
    const toast: RoomToast = { roomId, ticks, apples: result.counted, freshApples: result.freshApples, eligible: !info.assisted, newBest: result.newBest };

    if (roomId === FINAL_ROOM) {
      menuMusic();
      setScreen({ name: "ending" });
      return;
    }
    const world = worldOf(roomId);
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
    if (elsewhere) return <ElsewhereNotice game="Gravity Is Lying" onPlayHere={playHere} />;
    switch (screen.name) {
      case "title":
        return (
          <TitleScreen
            save={save}
            reducedMotion={comfort.reducedMotion}
            onStart={() => {
              // A brand-new player goes straight into 1-1 ("Which Way Is Down?").
              if (!ROOM_IDS.some((id) => isCleared(gravitySave.get(), id))) play(ROOM_IDS[0]!);
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
            toast={current.toast}
            onDeath={(roomId) => apply(recordDeath(gravitySave.get(), roomId))}
            onOrbital={() => unlock(["orbital"])}
            onWin={(session, info) => onWin(current.roomId, session, info)}
            onLeave={(visit) => {
              apply(recordCeiling(gravitySave.get(), visit.ceilingTicks));
              gravitySave.update((s) => ({ ...s, stats: { playTicks: s.stats.playTicks + visit.elapsed } }));
            }}
            onMap={() => map(worldOf(current.roomId).id)}
          />
        );
      }
      case "worldDone": {
        const next = WORLDS.find((w) => w.id === screen.world + 1);
        return <WorldComplete save={save} world={screen.world} last={screen.last} onNext={() => (next ? play(next.rooms[0]!) : map())} onMap={() => map(screen.world)} />;
      }
      case "ending":
        return <Ending save={save} onMap={() => map(6)} />;
    }
  })();

  const seenWarning = (reduce: boolean) => {
    const waiting = warning;
    gravitySave.update((s) => ({ ...s, seen: { ...s.seen, motion: true } }));
    if (reduce) settingsSave.update((s) => ({ ...s, motion: "reduce" }));
    setWarning(null);
    if (waiting) enter(waiting.roomId, waiting.toast);
  };

  return (
    <div className={cn(styles.root, "relative")}>
      {body}
      <HelpDialog open={dialog === "help"} onOpenChange={(open) => setDialog(open ? "help" : null)} />
      <TrophyCase open={dialog === "trophies"} onOpenChange={(open) => setDialog(open ? "trophies" : null)} />
      <OptionsDialog open={dialog === "options"} onOpenChange={(open) => setDialog(open ? "options" : null)} />
      <MotionWarning open={warning !== null} onPlay={() => seenWarning(false)} onReduce={() => seenWarning(true)} />
    </div>
  );
}
