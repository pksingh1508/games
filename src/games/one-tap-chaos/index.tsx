"use client";

// One Tap Chaos (Plan/09-one-tap-chaos.md). Loaded client-only by the play page's GameLoader.
// Screens: title → (first time: calibration) → play → game over; plus the practice room and a demo.
import { useRef, useState, useSyncExternalStore } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { getAudio } from "@/engine/audio/engine";
import { newSeed } from "@/engine/rng";
import { useSave } from "@/engine/save";
import { recordRun as saveRunHistory } from "@/engine/save/runs";
import { settingsSave } from "@/engine/settings";
import { useComfort } from "@/games/shared/device";
import { ElsewhereNotice, useTabGuard } from "@/games/shared/tab-guard";
import { cn } from "@/lib/cn";
import { unlockOtcAchievement } from "./achievements";
import { dailyFor, dayKey, type Daily } from "./core/daily";
import { PracticePlanner, type Planner } from "./core/practice";
import { newTracker, recordRound, recordRun, type RunEnd, type RunTracker } from "./core/progress";
import { RunPlanner } from "./core/run";
import type { RoundReport, RunSummary, SessionSettings } from "./core/session";
import { MICROGAME_IDS, unlockedMicrogames } from "./microgames";
import type { BossId, MicrogameId } from "./microgames/types";
import { CARD_ORDER, type RuleId } from "./rules";
import { otcSave } from "./save";
import { measureMusic, measureSfx, playSfx, SFX_NAMES } from "./sfx";
import styles from "./otc.module.css";
import { Calibration } from "./ui/Calibration";
import { GameOver } from "./ui/GameOver";
import { HowToPlay, OptionsPanel, TrophyCase } from "./ui/Menus";
import { PlayScreen } from "./ui/Play";
import { PracticeRoom } from "./ui/Practice";
import { TitleScreen } from "./ui/Title";

type Launch =
  | { mode: "run" }
  | { mode: "daily"; daily: Daily }
  | { mode: "demo" }
  | { mode: "practice"; game: MicrogameId | BossId; tier: number; rule: RuleId | null };

type Screen =
  | { name: "title" }
  | { name: "calibrate"; firstTime: boolean; then: Launch | null }
  | { name: "play"; launch: Launch; planner: Planner; key: number }
  | { name: "over"; launch: Launch; summary: RunSummary; end: RunEnd; dailyBest: number | null }
  | { name: "practice" };

// Today's Daily Chaos, re-read when the date changes (so a tab left open past midnight moves on).
let today: Daily | null = null;
const todaysDaily = () => {
  const now = new Date();
  if (!today || today.key !== dayKey(now)) today = dailyFor(now);
  return today;
};
const subscribeToClock = (onChange: () => void) => {
  const timer = setInterval(onChange, 60_000);
  return () => clearInterval(timer);
};

// Development only: play any sound from the console, e.g. __otc.sfx("boing").
if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  (window as unknown as { __otc: object }).__otc = { sfx: playSfx, measureSfx, measureMusic, SFX_NAMES };
}

export default function OneTapChaos() {
  const save = useSave(otcSave);
  const settings = useSave(settingsSave);
  const comfort = useComfort();
  const daily = useSyncExternalStore(subscribeToClock, todaysDaily, todaysDaily);
  const [screen, setScreenState] = useState<Screen>({ name: "title" });
  const [dialog, setDialog] = useState<"help" | "trophies" | "options" | null>(null);
  const tracker = useRef<RunTracker>(newTracker());

  const setScreen = (next: Screen) => {
    setScreenState(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const { elsewhere, playHere } = useTabGuard({
    channel: "mfg:one-tap-chaos",
    save: otcSave,
    onElsewhere: () => setScreen({ name: "title" }),
  });

  const plannerFor = (launch: Launch): Planner => {
    const current = otcSave.get();
    const reducedSpeed = current.prefs.reducedSpeed;
    switch (launch.mode) {
      case "run":
        return new RunPlanner({ seed: newSeed(), pool: unlockedMicrogames(current.best), cardsUnlocked: current.cardsUnlocked, daily: false, reducedSpeed });
      case "daily":
        return new RunPlanner({ seed: launch.daily.seed, pool: MICROGAME_IDS, cardsUnlocked: CARD_ORDER.length, daily: true, reducedSpeed });
      case "demo":
        return new RunPlanner({ seed: newSeed(), pool: MICROGAME_IDS, cardsUnlocked: CARD_ORDER.length, daily: true, reducedSpeed: false });
      case "practice":
        return new PracticePlanner(launch.game, launch.tier, launch.rule, reducedSpeed, newSeed());
    }
  };

  /** Start something. Always called from a tap or key press, so audio may start. */
  const launch = (next: Launch) => {
    getAudio();
    tracker.current = newTracker();
    if (next.mode === "run" && !otcSave.get().calibrationOffered && settingsSave.get().tapOffsetMs === null) {
      otcSave.update((s) => ({ ...s, calibrationOffered: true }));
      setScreen({ name: "calibrate", firstTime: true, then: next });
      return;
    }
    setScreen({ name: "play", launch: next, planner: plannerFor(next), key: newSeed() });
  };

  const onRoundResult = (mode: Launch["mode"], report: RoundReport) => {
    const result = recordRound(otcSave.get(), tracker.current, report, mode);
    tracker.current = result.tracker;
    if (result.save !== otcSave.get()) otcSave.set(result.save);
    result.unlock.forEach((id) => unlockOtcAchievement(id));
  };

  const onCard = (mode: Launch["mode"], rule: RuleId, isNew: boolean) => {
    if (mode !== "run" || !isNew) return;
    const met = CARD_ORDER.indexOf(rule) + 1;
    otcSave.update((s) => ({ ...s, cardsUnlocked: Math.max(s.cardsUnlocked, met) }));
  };

  const onGameOver = (current: Launch, summary: RunSummary) => {
    if (current.mode === "demo") {
      setScreen({ name: "title" });
      return;
    }
    const dailyRun = current.mode === "daily" ? current.daily : null;
    const before = otcSave.get();
    const dailyBest = dailyRun && before.daily?.key === dailyRun.key ? before.daily.best : null;
    const end = recordRun(before, summary, dailyRun);
    otcSave.set(end.save);
    otcSave.flush();
    void saveRunHistory({ game: "one-tap-chaos", mode: current.mode, level: dailyRun?.key, score: summary.state.score });
    setScreen({ name: "over", launch: current, summary, end, dailyBest });
  };

  const sessionSettings: SessionSettings = {
    offset: (settings.tapOffsetMs ?? 0) / 1000,
    reducedMotion: comfort.reducedMotion,
    reduceFlashing: comfort.reduceFlashing,
    holdMode: save.prefs.holdMode,
    visualBeat: save.prefs.visualBeat,
  };

  const body = (() => {
    if (elsewhere) return <ElsewhereNotice game="One Tap Chaos" onPlayHere={playHere} />;
    switch (screen.name) {
      case "title":
        return (
          <TitleScreen
            save={save}
            daily={daily}
            onTap={() => launch({ mode: "run" })}
            onDaily={() => launch({ mode: "daily", daily: todaysDaily() })}
            onPractice={() => setScreen({ name: "practice" })}
            onDemo={() => launch({ mode: "demo" })}
            onHelp={() => setDialog("help")}
            onTrophies={() => setDialog("trophies")}
            onOptions={() => setDialog("options")}
          />
        );
      case "calibrate": {
        const then = screen.then;
        const leave = () => (then ? launch(then) : setScreen({ name: "title" }));
        return <Calibration firstTime={screen.firstTime} onDone={leave} onSkip={leave} />;
      }
      case "play": {
        const current = screen.launch;
        return (
          <PlayScreen
            key={screen.key}
            mode={current.mode}
            planner={screen.planner}
            settings={sessionSettings}
            captions={save.prefs.captions || !settings.sound}
            onRoundResult={(report) => onRoundResult(current.mode, report)}
            onCard={(rule, isNew) => onCard(current.mode, rule, isNew)}
            onGameOver={(summary) => onGameOver(current, summary)}
            onQuit={() => setScreen(current.mode === "practice" ? { name: "practice" } : { name: "title" })}
            onRestart={() => launch(current)}
          />
        );
      }
      case "over": {
        const current = screen.launch;
        return (
          <GameOver
            summary={screen.summary}
            end={screen.end}
            daily={current.mode === "daily" ? current.daily : null}
            dailyBest={screen.dailyBest}
            onRetry={() => launch(current.mode === "daily" ? { mode: "daily", daily: todaysDaily() } : current)}
            onMenu={() => setScreen({ name: "title" })}
          />
        );
      }
      case "practice":
        return (
          <PracticeRoom
            save={save}
            onPlay={(game, tier, rule) => launch({ mode: "practice", game, tier, rule })}
            onBack={() => setScreen({ name: "title" })}
          />
        );
    }
  })();

  return (
    <div className={cn(styles.root, "relative")}>
      {body}

      <Dialog open={dialog === "help"} onOpenChange={(open) => setDialog(open ? "help" : null)} game="one-tap-chaos" eyebrow="One Tap Chaos" title="How to play">
        <HowToPlay cardsUnlocked={save.cardsUnlocked} />
      </Dialog>
      <TrophyCase open={dialog === "trophies"} onOpenChange={(open) => setDialog(open ? "trophies" : null)} />
      <Dialog
        open={dialog === "options"}
        onOpenChange={(open) => setDialog(open ? "options" : null)}
        game="one-tap-chaos"
        eyebrow="One Tap Chaos"
        title="Options"
        description="Tap timing, speed and comfort. Saved on this device."
      >
        <OptionsPanel
          onCalibrate={() => {
            setDialog(null);
            setScreen({ name: "calibrate", firstTime: false, then: null });
          }}
        />
      </Dialog>
    </div>
  );
}
