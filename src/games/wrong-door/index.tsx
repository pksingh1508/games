"use client";

// Wrong Door (Plan/13-wrong-door.md). Loaded client-only by the play page's GameLoader. Screens: the lobby
// → a run, floor by floor (Story, Endless or the Daily Door) → the summary. The run is saved after every
// action and rebuilt from its seed, so a reload carries on exactly where you were.
import { useEffect, useRef, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { getAudio } from "@/engine/audio/engine";
import { newSeed } from "@/engine/rng";
import { useSave } from "@/engine/save";
import { recordRun } from "@/engine/save/runs";
import { ElsewhereNotice, useTabGuard } from "@/games/shared/tab-guard";
import { cn } from "@/lib/cn";
import { unlockWrongDoorAchievement } from "./achievements";
import { Muzak } from "./audio/muzak";
import { loadSfx } from "./audio/sfx";
import { CODEX_BY_ID, pagesFor, type CodexId } from "./content/codex";
import { dailyFor } from "./floors/schedule";
import { addPages, recordClimb, recordRunEnd, recordWrong, type AchievementId } from "./progress";
import { nextMove } from "./run/reasoner";
import { floorOf, scoreOf, startRun, type Mode, type RunState } from "./run/state";
import { wrongDoorSave, type WrongDoorSave } from "./save";
import { FloorView, type FloorEvent } from "./ui/FloorView";
import { Lobby } from "./ui/Lobby";
import { CodexDialog, HelpDialog, OptionsDialog, TrophyCase } from "./ui/Menus";
import { Summary } from "./ui/Summary";
import styles from "./wrong-door.module.css";

type Screen = "lobby" | "floor" | "summary";

const savedRun = (save: WrongDoorSave) => save.run as unknown as RunState | null;

const ITEM_TOAST: Record<string, string> = {
  stethoscope: "A stethoscope: one more knock on every floor.",
  lantern: "A lantern: dark floors aren't dark for you now.",
  truthCoin: "A Truth Coin: flip it on a sign to see if it's true.",
  crowbar: "A crowbar: peek through one door's crack.",
  chalk: "Chalk: mark doors, and your way up is noted from now on.",
  luckyKey: "A spare key! One more mistake you can afford.",
};

export default function WrongDoor() {
  const save = useSave(wrongDoorSave);
  const [screen, setScreen] = useState<Screen>("lobby");
  const [finished, setFinished] = useState<RunState | null>(null);
  const [dialog, setDialog] = useState<"help" | "codex" | "trophies" | "options" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [transition, setTransition] = useState<{ text: string; key: number } | null>(null);
  const [abandon, setAbandon] = useState<Mode | null>(null);
  const [daily] = useState(() => dailyFor(new Date()));
  const [muzak] = useState(() => new Muzak());
  const toastTimer = useRef(0);
  const run = savedRun(save);

  const { elsewhere, playHere } = useTabGuard({ channel: "mfg:wrong-door", save: wrongDoorSave, onElsewhere: () => setScreen("lobby") });

  const say = (text: string) => {
    setToast(text);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2800);
  };

  // The lobby's muzak (after the first tap or key: browsers keep sound off until then).
  useEffect(() => {
    if (screen !== "lobby" || elsewhere) {
      muzak.stop();
      return;
    }
    const go = () => {
      getAudio();
      muzak.start();
    };
    go();
    window.addEventListener("pointerdown", go, { once: true });
    window.addEventListener("keydown", go, { once: true });
    return () => {
      window.removeEventListener("pointerdown", go);
      window.removeEventListener("keydown", go);
      muzak.stop();
    };
  }, [screen, elsewhere, muzak]);

  useEffect(() => () => wrongDoorSave.flush(), []);

  // Development only: the careful player's next move, from the console (QA).
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    (window as unknown as { __wd?: object }).__wd = {
      run: () => savedRun(wrongDoorSave.get()),
      floor: () => {
        const r = savedRun(wrongDoorSave.get());
        return r ? floorOf(r) : null;
      },
      next: () => {
        const r = savedRun(wrongDoorSave.get());
        return r ? nextMove(r, floorOf(r)) : null;
      },
    };
  }, []);

  const unlock = (ids: readonly AchievementId[]) => ids.forEach((id) => unlockWrongDoorAchievement(id));
  const pages = (ids: readonly CodexId[]) => {
    if (!ids.length) return;
    const names = ids.map((id) => CODEX_BY_ID.get(id)?.title).filter(Boolean);
    say(`New in the codex: ${names.join(", ")}`);
  };

  const begin = (mode: Mode) => {
    getAudio();
    void loadSfx();
    const seed = mode === "daily" ? daily.seed : newSeed();
    const fresh = mode === "daily" ? startRun("daily", seed, daily.key) : startRun(mode, seed);
    wrongDoorSave.update((s) => ({ ...s, run: fresh as WrongDoorSave["run"] }));
    wrongDoorSave.flush();
    setFinished(null);
    setScreen("floor");
    setTransition({ text: "Floor 1", key: Date.now() });
  };

  /** Starting a new run abandons the one in your pocket (after asking). */
  const start = (mode: Mode) => {
    const current = savedRun(wrongDoorSave.get());
    if (current && current.status === "play" && (current.floor > 1 || current.path.length > 0)) setAbandon(mode);
    else begin(mode);
  };

  const end = (r: RunState) => {
    const update = recordRunEnd(wrongDoorSave.get(), r);
    wrongDoorSave.set(update.save);
    wrongDoorSave.flush();
    unlock(update.unlock);
    void recordRun({ game: "wrong-door", mode: r.mode, level: r.daily ?? r.mode, score: scoreOf(r) });
    setFinished(r);
    setScreen("summary");
  };

  const onRun = (next: RunState) => {
    const prev = savedRun(wrongDoorSave.get());
    wrongDoorSave.update((s) => ({ ...s, run: next as WrongDoorSave["run"] }));
    if (prev && next.status === "play") {
      if (next.floor > prev.floor) setTransition({ text: `Floor ${next.floor}`, key: Date.now() });
      else if (next.floor < prev.floor) setTransition({ text: `Down to floor ${next.floor}`, key: Date.now() });
      else if (next.play.visit !== prev.play.visit) setTransition({ text: `Floor ${next.floor}, again`, key: Date.now() });
    }
  };

  const onEvent = (e: FloorEvent) => {
    const current = wrongDoorSave.get();
    switch (e.type) {
      case "enter": {
        const r = addPages(current, pagesFor(e.floor));
        wrongDoorSave.set(r.save);
        pages(r.pages);
        break;
      }
      case "knock": {
        const r = addPages(current, ["knock"]);
        wrongDoorSave.set(r.save);
        pages(r.pages);
        break;
      }
      case "item": {
        const r = addPages(current, [e.kind]);
        wrongDoorSave.set(r.save);
        say(ITEM_TOAST[e.kind] ?? "Picked up.");
        break;
      }
      case "double": {
        const r = addPages(current, ["double"]);
        wrongDoorSave.set(r.save);
        pages(r.pages);
        if (e.lying) unlock(["double-negative"]);
        break;
      }
      case "climb": {
        const r = recordClimb(current, e.floor, { spotted: e.spotted, switched: e.switched });
        wrongDoorSave.set(r.save);
        unlock(r.unlock);
        pages(r.pages);
        break;
      }
      case "wrong": {
        const r = recordWrong(current, e.floor, e.consequence, { switched: e.switched });
        wrongDoorSave.set(r.save);
        pages(r.pages);
        break;
      }
      case "end":
        end(e.run);
        break;
    }
  };

  const body = (() => {
    if (elsewhere) return <ElsewhereNotice game="Wrong Door" onPlayHere={playHere} />;
    if (screen === "summary" && finished) {
      return <Summary run={finished} dailyNumber={finished.mode === "daily" ? daily.number : null} onLobby={() => setScreen("lobby")} onAgain={() => start(finished.mode)} />;
    }
    if (screen === "floor" && run && run.status === "play") {
      return (
        <FloorView
          key={`${run.mode}:${run.seed}:${run.floor}:${run.play.visit}`}
          run={run}
          bigSigns={save.prefs.bigSigns}
          relaxed={save.prefs.relaxed}
          dailyNumber={run.mode === "daily" ? daily.number : null}
          toast={toast}
          onRun={onRun}
          onEvent={onEvent}
          onCodex={() => setDialog("codex")}
          onOptions={() => setDialog("options")}
          onHelp={() => setDialog("help")}
          onLeave={() => setScreen("lobby")}
          onGiveUp={() => end(run)}
        />
      );
    }
    return (
      <Lobby
        save={save}
        daily={daily}
        onStory={() => start("story")}
        onEndless={() => start("endless")}
        onDaily={() => start("daily")}
        onContinue={() => {
          getAudio();
          void loadSfx();
          setScreen("floor");
        }}
        onHelp={() => setDialog("help")}
        onCodex={() => setDialog("codex")}
        onTrophies={() => setDialog("trophies")}
        onOptions={() => setDialog("options")}
      />
    );
  })();

  return (
    <div className={cn(styles.root, "relative")} data-game="wrong-door">
      {body}
      {transition && screen === "floor" && (
        <div key={transition.key} className={styles.transition} aria-hidden onAnimationEnd={() => setTransition(null)}>
          <p className={cn(styles.display, "text-5xl")}>{transition.text}</p>
        </div>
      )}
      <HelpDialog open={dialog === "help"} onOpenChange={(o) => setDialog(o ? "help" : null)} />
      <CodexDialog open={dialog === "codex"} onOpenChange={(o) => setDialog(o ? "codex" : null)} />
      <TrophyCase open={dialog === "trophies"} onOpenChange={(o) => setDialog(o ? "trophies" : null)} />
      <OptionsDialog open={dialog === "options"} onOpenChange={(o) => setDialog(o ? "options" : null)} />
      <Dialog open={abandon !== null} onOpenChange={(o) => !o && setAbandon(null)} title="Start a new run?" description={run ? `You're on floor ${run.floor} of a run. Starting again ends it.` : undefined} game="wrong-door">
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className={styles.btn} onClick={() => setAbandon(null)}>
            Keep it
          </button>
          <button
            type="button"
            className={cn(styles.btn, styles.gold)}
            onClick={() => {
              const mode = abandon!;
              setAbandon(null);
              const current = savedRun(wrongDoorSave.get());
              if (current) {
                const update = recordRunEnd(wrongDoorSave.get(), current);
                wrongDoorSave.set(update.save);
              }
              begin(mode);
            }}
            data-abandon
          >
            Start again
          </button>
        </div>
      </Dialog>
    </div>
  );
}
