"use client";

// Panic Stack (Plan/11-panic-stack.md). Loaded client-only by the play page's GameLoader. Screens: the title (a
// wobbly tower of blocks spelling the name) → the location map → a level; or the Endless Tower, or today's
// Daily Stack.
import { useEffect, useState } from "react";
import { getAudio } from "@/engine/audio/engine";
import { newSeed } from "@/engine/rng";
import { useSave } from "@/engine/save";
import { recordRun } from "@/engine/save/runs";
import { useComfort } from "@/games/shared/device";
import { ElsewhereNotice, useTabGuard } from "@/games/shared/tab-guard";
import { cn } from "@/lib/cn";
import { unlockPanicAchievement } from "./achievements";
import { music } from "./audio/music";
import { loadSfx } from "./audio/sfx";
import type { LevelDef, LocationId } from "./core/level";
import { FINAL_LEVEL, getLevel, LEVEL_IDS, locationOf, nextLevelId } from "./levels";
import { DAILY_AFTER, dailyLevel, endlessFor } from "./levels/modes";
import styles from "./panic-stack.module.css";
import { dailyFor, isCleared, isOpen, recordClear, recordDaily, recordEndless, recordStats, remember, type AchievementId } from "./progress";
import type { RunResult } from "./play/runtime";
import { panicStackSave } from "./save";
import { MapScreen } from "./ui/Map";
import { GuideDialog, HelpDialog, OptionsDialog, TrophyCase } from "./ui/Menus";
import { PlayScreen, type Recorded } from "./ui/Play";
import { TitleScreen } from "./ui/Title";

type Screen =
  | { name: "title" }
  | { name: "map"; location: LocationId }
  | { name: "level"; id: string; zen: boolean; key: number }
  | { name: "endless"; level: LevelDef; seed: number }
  | { name: "daily"; level: LevelDef; seed: number };

const unlock = (ids: readonly AchievementId[]) => ids.forEach((id) => unlockPanicAchievement(id));

/** The level to play next: the first that's open and not done (or the last). */
function nextUp(): string {
  const save = panicStackSave.get();
  return LEVEL_IDS.find((id) => isOpen(save, id) && !isCleared(save, id)) ?? FINAL_LEVEL;
}

export default function PanicStack() {
  const save = useSave(panicStackSave);
  const comfort = useComfort();
  const [screen, setScreenState] = useState<Screen>({ name: "title" });
  const [dialog, setDialog] = useState<"help" | "guide" | "trophies" | "options" | null>(null);
  const [collapse, setCollapse] = useState(false);
  const [daily] = useState(() => dailyFor(new Date()));

  const setScreen = (next: Screen) => {
    setScreenState(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const { elsewhere, playHere } = useTabGuard({ channel: "mfg:panic-stack", save: panicStackSave, onElsewhere: () => setScreen({ name: "title" }) });

  // Calm music on the title and map (after the first tap or key: browsers keep sound off until then).
  const menus = screen.name === "title" || screen.name === "map";
  useEffect(() => {
    if (!menus || elsewhere) return;
    const go = () => {
      getAudio();
      music.start(true);
    };
    go();
    window.addEventListener("pointerdown", go, { once: true });
    window.addEventListener("keydown", go, { once: true });
    return () => {
      window.removeEventListener("pointerdown", go);
      window.removeEventListener("keydown", go);
      music.stop();
    };
  }, [menus, elsewhere]);

  useEffect(() => () => panicStackSave.flush(), []);

  const wake = () => {
    getAudio();
    void loadSfx();
  };

  const map = (location: LocationId = locationOf(nextUp()).id) => setScreen({ name: "map", location });

  const play = (id: string) => {
    wake();
    setScreen({ name: "level", id, zen: panicStackSave.get().prefs.zen, key: Date.now() });
  };

  const fromTitle = () => {
    wake();
    if (comfort.reducedMotion) {
      map();
      return;
    }
    setCollapse(true);
    window.setTimeout(() => {
      setCollapse(false);
      map();
    }, 850);
  };

  const meet = (what: string, known: boolean) => {
    const before = panicStackSave.get();
    const next = remember(before, what, known);
    if (next !== before) panicStackSave.set(next);
  };

  const stat = (s: "placed" | "fallen" | "broken" | "fakePanics" | "taps" | "oopses") => {
    const r = recordStats(panicStackSave.get(), { [s]: 1 });
    panicStackSave.set(r.save);
    unlock(r.unlock);
  };

  const onDone = (kind: Screen["name"], id: string) => (result: RunResult): Recorded => {
    const current = panicStackSave.get();
    const ticks = { ...current.stats, playTicks: current.stats.playTicks + result.ticks };
    if (kind === "level") {
      if (result.status !== "won") {
        panicStackSave.set({ ...current, stats: ticks });
        return { stars: 0, best: current.levels[id]?.stars ?? 0, newBest: false };
      }
      const update = recordClear({ ...current, stats: ticks }, id, {
        ticks: result.ticks,
        limit: result.limit,
        falls: result.falls,
        oopsUsed: result.oopsUsed,
        breaks: result.breaks,
        zen: result.zen,
        catOnTop: result.catOnTop,
        safeBase: result.safeBase,
      });
      panicStackSave.set(update.save);
      panicStackSave.flush();
      unlock(update.unlock);
      void recordRun({ game: "panic-stack", mode: result.zen ? "zen" : "level", level: id, score: result.ticks });
      return { stars: update.stars, best: update.save.levels[id]!.stars, newBest: update.newBest };
    }
    if (kind === "endless") {
      const update = recordEndless({ ...current, stats: ticks }, result.best);
      panicStackSave.set(update.save);
      panicStackSave.flush();
      unlock(update.unlock);
      void recordRun({ game: "panic-stack", mode: "endless", level: "endless", score: Math.round(result.best * 100) });
      return { stars: 0, best: 0, newBest: update.newBest, height: result.best, bestHeight: update.save.endless.best };
    }
    const update = recordDaily({ ...current, stats: ticks }, daily.key, result.best);
    panicStackSave.set(update.save);
    panicStackSave.flush();
    void recordRun({ game: "panic-stack", mode: "daily", level: daily.key, score: Math.round(result.best * 100) });
    return { stars: 0, best: 0, newBest: update.newBest, height: result.best, bestHeight: update.save.daily[daily.key]!.height };
  };

  const dailyOpen = isCleared(save, DAILY_AFTER);

  const body = (() => {
    if (elsewhere) return <ElsewhereNotice game="Panic Stack" onPlayHere={playHere} />;
    switch (screen.name) {
      case "title":
        return (
          <TitleScreen
            save={save}
            daily={daily}
            dailyOpen={dailyOpen}
            collapse={collapse}
            onPlay={fromTitle}
            onEndless={() => {
              wake();
              setScreen({ name: "endless", level: endlessFor(panicStackSave.get()), seed: newSeed() });
            }}
            onDaily={() => {
              wake();
              setScreen({ name: "daily", level: dailyLevel(daily.seed), seed: daily.seed });
            }}
            onHelp={() => setDialog("help")}
            onGuide={() => setDialog("guide")}
            onTrophies={() => setDialog("trophies")}
            onOptions={() => setDialog("options")}
          />
        );
      case "map":
        return <MapScreen save={save} location={screen.location} current={nextUp()} onPlay={play} onBack={() => setScreen({ name: "title" })} />;
      case "level": {
        const level = getLevel(screen.id);
        const next = nextLevelId(screen.id);
        return (
          <PlayScreen
            key={screen.key}
            mode="level"
            level={level}
            seed={1}
            zen={screen.zen}
            onDone={onDone("level", screen.id)}
            onNext={next ? () => play(next) : null}
            onMap={() => map(locationOf(screen.id).id)}
            onMeet={meet}
            onStat={stat}
          />
        );
      }
      case "endless":
      case "daily":
        return (
          <PlayScreen
            key={`${screen.name}:${screen.seed}`}
            mode={screen.name}
            level={screen.level}
            seed={screen.seed}
            daily={screen.name === "daily" ? daily.number : undefined}
            zen={false}
            onDone={onDone(screen.name, screen.name)}
            onNext={null}
            onMap={() => setScreen({ name: "title" })}
            onMeet={meet}
            onStat={stat}
          />
        );
    }
  })();

  return (
    <div className={cn(styles.root, "relative")} data-game="panic-stack">
      {body}
      <HelpDialog open={dialog === "help"} onOpenChange={(open) => setDialog(open ? "help" : null)} />
      <GuideDialog open={dialog === "guide"} onOpenChange={(open) => setDialog(open ? "guide" : null)} />
      <TrophyCase open={dialog === "trophies"} onOpenChange={(open) => setDialog(open ? "trophies" : null)} />
      <OptionsDialog open={dialog === "options"} onOpenChange={(open) => setDialog(open ? "options" : null)} />
    </div>
  );
}
