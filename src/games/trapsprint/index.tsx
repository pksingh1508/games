"use client";

// TrapSprint (Plan/06-trapsprint.md). Loaded client-only by the play page's GameLoader.
// Screens: title → level select → play (→ level complete → All-Deaths Replay), and zone speedruns.
import { useEffect, useState } from "react";
import { getAudio } from "@/engine/audio/engine";
import { newSeed } from "@/engine/rng";
import { useSave } from "@/engine/save";
import { recordRun as saveRunHistory } from "@/engine/save/runs";
import { ElsewhereNotice, useTabGuard } from "@/games/shared/tab-guard";
import { cn } from "@/lib/cn";
import { unlockTrapSprintAchievement } from "./achievements";
import { music } from "./audio/music";
import { loadSfx } from "./audio/sfx";
import { ticksToMs } from "./core/constants";
import { saveBestRun } from "./core/ghosts";
import { isCleared, recordClear, recordDeath, recordFakeHop, recordZoneRun, type AchievementId } from "./core/progress";
import type { LevelSession } from "./core/session";
import type { DeathCause } from "./core/world";
import { isUnlocked, MAIN_LEVELS, nextInZone, nextLevelId, ZONES, zoneOf, type ZoneId } from "./levels";
import { trapSprintSave } from "./save";
import styles from "./trapsprint.module.css";
import type { CompleteInfo } from "./ui/Complete";
import { LevelSelect } from "./ui/LevelSelect";
import { HelpDialog, OptionsDialog, TrophyCase } from "./ui/Menus";
import { PlayScreen } from "./ui/Play";
import { ReplayScreen } from "./ui/Replay";
import { TitleScreen } from "./ui/Title";
import { ZoneResults, type ZoneResult } from "./ui/ZoneResults";

interface ZoneRunState {
  zone: ZoneId;
  index: number;
  /** Ticks on the clock when this level started. */
  base: number;
  splits: number[];
  deaths: number;
  assisted: boolean;
}

type Screen =
  | { name: "title" }
  | { name: "select"; zone: ZoneId }
  | { name: "play"; levelId: string; key: number; result: CompleteInfo | null; zoneRun: ZoneRunState | null }
  | { name: "replay"; info: CompleteInfo }
  | { name: "zoneDone"; result: ZoneResult };

const unlock = (ids: readonly AchievementId[]) => ids.forEach((id) => unlockTrapSprintAchievement(id));

export default function TrapSprint() {
  const save = useSave(trapSprintSave);
  const [screen, setScreenState] = useState<Screen>({ name: "title" });
  const [dialog, setDialog] = useState<"help" | "trophies" | "options" | null>(null);

  const setScreen = (next: Screen) => {
    setScreenState(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const { elsewhere, playHere } = useTabGuard({
    channel: "mfg:trapsprint",
    save: trapSprintSave,
    onElsewhere: () => setScreen({ name: "title" }),
  });

  // Leaving the game stops its music.
  useEffect(() => () => music.stop(), []);

  const cleared = (id: string) => isCleared(trapSprintSave.get(), id);

  /** Menus have their own tune. Always called from a tap or a key press (audio may start). */
  const menuMusic = () => {
    getAudio();
    void loadSfx();
    music.play("menu");
  };

  const play = (levelId: string, zoneRun: ZoneRunState | null = null) => {
    getAudio();
    setScreen({ name: "play", levelId, key: newSeed(), result: null, zoneRun });
  };

  const levels = (zone?: ZoneId) => {
    menuMusic();
    const last = trapSprintSave.get().last;
    const next = MAIN_LEVELS.find((id) => isUnlocked(id, cleared) && !cleared(id));
    setScreen({ name: "select", zone: zone ?? zoneOf(last ?? next ?? MAIN_LEVELS[0]!).id });
  };

  const startZoneRun = (zone: ZoneId) => {
    const first = ZONES.find((z) => z.id === zone)!.levels[0]!;
    play(first, { zone, index: 0, base: 0, splits: [], deaths: 0, assisted: false });
  };

  const onDeath = (levelId: string, cause: DeathCause, x: number, y: number) => {
    const result = recordDeath(trapSprintSave.get(), levelId, cause, x, y);
    trapSprintSave.set(result.save);
    unlock(result.unlock);
  };

  const onFakeHop = () => {
    const result = recordFakeHop(trapSprintSave.get());
    trapSprintSave.set(result.save);
    unlock(result.unlock);
  };

  const onWin = (current: Extract<Screen, { name: "play" }>, session: LevelSession, assisted: boolean) => {
    const levelId = current.levelId;
    const ticks = session.time ?? 0;
    const last = session.attempts.at(-1);
    const result = recordClear(trapSprintSave.get(), {
      levelId,
      ticks,
      coins: session.world.coins,
      deaths: session.deaths,
      assisted,
      fromCheckpoint: session.fromCheckpoint,
    });
    trapSprintSave.set(result.save);
    trapSprintSave.flush();
    unlock(result.unlock);
    if (result.newBest && last) void saveBestRun(levelId, { log: last.log, ticks, attempt: last.attempt });
    void saveRunHistory({ game: "trapsprint", mode: current.zoneRun ? "zone" : "level", level: levelId, score: ticksToMs(ticks) });

    const zr = current.zoneRun;
    if (zr) {
      const total = zr.base + session.elapsed;
      const run: ZoneRunState = {
        ...zr,
        index: zr.index + 1,
        base: total,
        splits: [...zr.splits, total],
        deaths: zr.deaths + session.deaths,
        assisted: zr.assisted || assisted,
      };
      const next = nextInZone(levelId);
      if (next) {
        play(next, run);
        return;
      }
      const before = trapSprintSave.get().zoneRuns[String(zr.zone)];
      const finished = recordZoneRun(trapSprintSave.get(), { zone: String(zr.zone), total, splits: run.splits, deaths: run.deaths, assisted: run.assisted });
      trapSprintSave.set(finished.save);
      trapSprintSave.flush();
      unlock(finished.unlock);
      void saveRunHistory({ game: "trapsprint", mode: "zone", level: `zone-${zr.zone}`, score: ticksToMs(total) });
      setScreen({
        name: "zoneDone",
        result: {
          zone: zr.zone,
          total,
          splits: run.splits,
          deaths: run.deaths,
          assisted: run.assisted,
          newBest: finished.newBest,
          previous: finished.previous,
          bestSplits: before?.splits ?? [],
        },
      });
      return;
    }

    setScreenState({
      ...current,
      result: {
        levelId,
        ticks,
        medal: result.medal,
        eligible: result.eligible,
        assisted,
        fromCheckpoint: session.fromCheckpoint,
        newBest: result.newBest,
        previousBest: result.previousBest,
        deaths: session.deaths,
        firstClear: result.firstClear,
        attempts: session.attempts,
      },
    });
  };

  const nextAfter = (levelId: string) => {
    const next = nextLevelId(levelId);
    return next && isUnlocked(next, cleared) ? next : null;
  };

  const body = (() => {
    if (elsewhere) return <ElsewhereNotice game="TrapSprint" onPlayHere={playHere} />;
    switch (screen.name) {
      case "title":
        return (
          <TitleScreen
            save={save}
            onStart={() => {
              // A brand-new player goes straight into 1-01 ("Welcome").
              if (!MAIN_LEVELS.some(cleared)) play(MAIN_LEVELS[0]!);
              else levels();
            }}
            onLevels={() => levels()}
            onHelp={() => setDialog("help")}
            onTrophies={() => setDialog("trophies")}
            onOptions={() => setDialog("options")}
          />
        );
      case "select":
        return (
          <LevelSelect
            save={save}
            zone={screen.zone}
            onZone={(zone) => setScreenState({ name: "select", zone })}
            onPlay={(id) => play(id)}
            onZoneRun={startZoneRun}
            onBack={() => setScreen({ name: "title" })}
            onHelp={() => setDialog("help")}
            onTrophies={() => setDialog("trophies")}
            onOptions={() => setDialog("options")}
          />
        );
      case "play": {
        const current = screen;
        const next = current.result ? nextAfter(current.levelId) : null;
        return (
          <PlayScreen
            key={current.key}
            levelId={current.levelId}
            zoneRun={
              current.zoneRun
                ? { zone: current.zoneRun.zone, index: current.zoneRun.index, count: ZONES.find((z) => z.id === current.zoneRun!.zone)!.levels.length, base: current.zoneRun.base }
                : null
            }
            result={current.result}
            hasNext={next !== null}
            onDeath={onDeath}
            onFakeHop={onFakeHop}
            onWin={(session, assisted) => onWin(current, session, assisted)}
            onRetry={() => (current.zoneRun ? startZoneRun(current.zoneRun.zone) : play(current.levelId))}
            onNext={() => next && play(next)}
            onLevels={() => levels(zoneOf(current.levelId).id)}
            onWatch={() => current.result && setScreen({ name: "replay", info: current.result })}
          />
        );
      }
      case "replay": {
        const info = screen.info;
        const next = nextAfter(info.levelId);
        return (
          <ReplayScreen
            info={info}
            hasNext={next !== null}
            onNext={() => next && play(next)}
            onRetry={() => play(info.levelId)}
            onLevels={() => levels(zoneOf(info.levelId).id)}
          />
        );
      }
      case "zoneDone":
        return <ZoneResults result={screen.result} onAgain={() => startZoneRun(screen.result.zone)} onLevels={() => levels(screen.result.zone)} />;
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
