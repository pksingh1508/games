"use client";

// Don't Blink (Plan/14-dont-blink.md). Loaded client-only by the play page's GameLoader. Screens: the title
// (which changes while you blink) → the week of nights → the manager's note → the night shift → 6 AM (or not);
// Endless Night and Custom Night; and, after the last night, the ending.
import { useEffect, useRef, useState } from "react";
import { getAudio } from "@/engine/audio/engine";
import { newSeed } from "@/engine/rng";
import { useSave } from "@/engine/save";
import { recordRun } from "@/engine/save/runs";
import { settingsSave } from "@/engine/settings";
import { useComfort } from "@/games/shared/device";
import { ElsewhereNotice, useTabGuard } from "@/games/shared/tab-guard";
import { cn } from "@/lib/cn";
import { unlockDontBlinkAchievement } from "./achievements";
import type { GameSetup, Mode, NightResult } from "./core/game";
import { customNight, endlessHour, nightConfig } from "./core/nights";
import styles from "./dont-blink.module.css";
import { nextNight, recordEnding, recordNight, type AchievementId } from "./progress";
import { dontBlinkSave } from "./save";
import { Ending } from "./ui/Ending";
import { HelpDialog, NoticeDialog, OptionsDialog, TrophyCase } from "./ui/Menus";
import { CustomPanel, Intro, NIGHT_INFO, NightSelect } from "./ui/Nights";
import { PlayScreen } from "./ui/Play";
import { Results } from "./ui/Results";
import { TitleScreen } from "./ui/Title";

type Screen =
  | { name: "title" }
  | { name: "nights" }
  | { name: "custom" }
  | { name: "intro"; mode: Mode; night: number }
  | { name: "play"; mode: Mode; night: number; setup: GameSetup }
  | { name: "results"; result: NightResult; newBest: boolean }
  | { name: "ending" };

const unlock = (ids: readonly AchievementId[]) => ids.forEach((id) => unlockDontBlinkAchievement(id));

/** Tests can fix a night's seed (sessionStorage only: it never leaves the tab, and players never see it). */
function seedFor(): number {
  try {
    const fixed = Number(window.sessionStorage.getItem("mfg:dont-blink:seed"));
    if (Number.isInteger(fixed) && fixed > 0) return fixed;
  } catch {
    // No storage: a fresh seed.
  }
  return newSeed();
}

function setupFor(mode: Mode, night: number): GameSetup {
  const save = dontBlinkSave.get();
  const custom = { ...save.custom };
  return {
    mode,
    night: mode === "night" ? night : 0,
    config: mode === "night" ? () => nightConfig(night) : mode === "endless" ? endlessHour : () => customNight(custom),
    seed: seedFor(),
    colour: save.prefs.colourChanges && settingsSave.get().colorblind === "off",
    assist: save.prefs.assist,
  };
}

const titleOf = (mode: Mode, night: number) => (mode === "night" ? `Night ${night}` : mode === "endless" ? "Endless Night" : "Custom Night");

export default function DontBlink() {
  const save = useSave(dontBlinkSave);
  const comfort = useComfort();
  const [screen, setScreenState] = useState<Screen>({ name: "title" });
  const [dialog, setDialog] = useState<"help" | "trophies" | "options" | null>(null);
  const [notice, setNotice] = useState<{ mode: Mode; night: number } | null>(null);
  /** The night that just ended, recorded and waiting for its fade to finish. */
  const finished = useRef<{ result: NightResult; newBest: boolean } | null>(null);

  const setScreen = (next: Screen) => {
    setScreenState(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const { elsewhere, playHere } = useTabGuard({ channel: "mfg:dont-blink", save: dontBlinkSave, onElsewhere: () => setScreen({ name: "title" }) });

  useEffect(() => () => dontBlinkSave.flush(), []);

  /** The manager's note first (and, before the very first night, the flicker notice). */
  const toIntro = (mode: Mode, night: number) => {
    getAudio();
    if (!dontBlinkSave.get().prefs.noticeSeen) {
      setNotice({ mode, night });
      return;
    }
    setScreen({ name: "intro", mode, night });
  };

  const onEnd = (result: NightResult) => {
    const update = recordNight(dontBlinkSave.get(), result);
    dontBlinkSave.set(update.save);
    dontBlinkSave.flush();
    unlock(update.unlock);
    const level = result.mode === "night" ? String(result.night) : result.mode;
    const score = result.mode === "endless" ? Math.round(result.hours * 100) : result.reported;
    void recordRun({ game: "dont-blink", mode: result.mode, level, score });
    return update.newBest;
  };

  const body = (() => {
    if (elsewhere) return <ElsewhereNotice game="Don't Blink" onPlayHere={playHere} />;
    switch (screen.name) {
      case "title":
        return (
          <TitleScreen
            save={save}
            reduceFlashing={comfort.reduceFlashing}
            reducedMotion={comfort.reducedMotion}
            onStart={() => {
              const all = [1, 2, 3, 4, 5].every((n) => (save.nights[n]?.clears ?? 0) > 0);
              if (all) setScreen({ name: "nights" });
              else toIntro("night", nextNight(save));
            }}
            onNights={() => setScreen({ name: "nights" })}
            onHelp={() => setDialog("help")}
            onTrophies={() => setDialog("trophies")}
            onOptions={() => setDialog("options")}
          />
        );
      case "nights":
        return (
          <NightSelect
            save={save}
            onNight={(n) => toIntro("night", n)}
            onEndless={() => toIntro("endless", 0)}
            onCustom={() => setScreen({ name: "custom" })}
            onBack={() => setScreen({ name: "title" })}
          />
        );
      case "custom":
        return <CustomPanel custom={save.custom} onStart={() => toIntro("custom", 0)} onBack={() => setScreen({ name: "nights" })} />;
      case "intro": {
        const { mode, night } = screen;
        const note =
          mode === "night"
            ? NIGHT_INFO[night]!.note
            : mode === "endless"
              ? ["There's no morning tonight. Keep watch for as long as you can.", "Every hour it gets worse. We'll count the hours you last."]
              : ["Your night, your rules. Six hours, the way you set them up."];
        return (
          <Intro
            heading={mode === "night" ? `Night ${night}` : titleOf(mode, night)}
            note={note}
            assist={save.prefs.assist}
            onBack={() => setScreen({ name: mode === "custom" ? "custom" : "nights" })}
            onStart={() => {
              getAudio();
              setScreen({ name: "play", mode, night, setup: setupFor(mode, night) });
            }}
          />
        );
      }
      case "play": {
        const { mode, night, setup } = screen;
        return (
          <PlayScreen
            key={setup.seed}
            setup={setup}
            title={titleOf(mode, night)}
            onEnd={(result) => {
              finished.current = { result, newBest: onEnd(result) };
            }}
            onFinish={() => {
              const done = finished.current;
              finished.current = null;
              if (done) setScreen({ name: "results", ...done });
            }}
            onLeave={() => setScreen({ name: "nights" })}
          />
        );
      }
      case "results": {
        const r = screen.result;
        const won = r.status === "won";
        const next = r.mode === "night" && won && r.night < 5 ? r.night + 1 : null;
        return (
          <Results
            result={r}
            title={titleOf(r.mode, r.night)}
            newBest={screen.newBest}
            bestHours={save.endless.best}
            onNext={next ? () => toIntro("night", next) : null}
            onEnding={r.mode === "night" && r.night === 5 && won ? () => setScreen({ name: "ending" }) : null}
            onRetry={() => toIntro(r.mode, r.night)}
            onNights={() => setScreen({ name: "nights" })}
          />
        );
      }
      case "ending":
        return (
          <Ending
            reducedMotion={comfort.reducedMotion}
            onSeen={() => {
              const update = recordEnding(dontBlinkSave.get());
              dontBlinkSave.set(update.save);
              dontBlinkSave.flush();
              unlock(update.unlock);
            }}
            onDone={() => setScreen({ name: "title" })}
          />
        );
    }
  })();

  return (
    <div className={cn(styles.root, "relative")} data-game="dont-blink">
      {body}
      <HelpDialog open={dialog === "help"} onOpenChange={(open) => setDialog(open ? "help" : null)} />
      <TrophyCase open={dialog === "trophies"} onOpenChange={(open) => setDialog(open ? "trophies" : null)} />
      <OptionsDialog open={dialog === "options"} onOpenChange={(open) => setDialog(open ? "options" : null)} />
      <NoticeDialog
        open={notice !== null}
        onOpenChange={(open) => !open && setNotice(null)}
        onContinue={() => {
          const next = notice;
          dontBlinkSave.update((s) => ({ ...s, prefs: { ...s.prefs, noticeSeen: true } }));
          setNotice(null);
          if (next) setScreen({ name: "intro", mode: next.mode, night: next.night });
        }}
      />
    </div>
  );
}
