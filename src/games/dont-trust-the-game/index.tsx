"use client";

// Don't Trust The Game (Plan/04-dont-trust-the-game.md). Loaded client-only by the play page's GameLoader. It starts
// as a cheerful platformer called "Super Happy Jump!", with HELPER, who lies about half the time (its eyes glance
// away when it does). Six chapters: the tutorial, the Options menu that's a level, a loading screen stuck at 99%, a
// fake crash and a 404, the developer console, and the credits as a climb, then Quit (it finally works) or Stay.
// The next visit: "You came back." and Truth Mode.
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { onTabVisibility } from "@/engine/browser/tab";
import { getAudio } from "@/engine/audio/engine";
import { useSave } from "@/engine/save";
import { useCoarsePointer, useComfort, usePortrait } from "@/games/shared/device";
import { ElsewhereNotice, useTabGuard } from "@/games/shared/tab-guard";
import { unlockDttgAchievement } from "./achievements";
import { music, type Mood } from "./audio/sound";
import { giveTabBack, hush, onBackForward, roomParam, setRoomParam } from "./browser/tricks";
import { CHAPTER_OF, nextChapter, type SceneId } from "./core/story";
import { Director } from "./play/director";
import { chapterDone, comesBack, ended, enterScene, finishedOnce } from "./progress";
import { dttgSave, type ChapterNo } from "./save";
import { ConsoleScene } from "./scenes/Console";
import { CrackScene } from "./scenes/Crack";
import { CrashScene } from "./scenes/Crash";
import { CreditsScene, StayScene } from "./scenes/Credits";
import { QuitEnding } from "./scenes/Ending";
import { LauncherScene } from "./scenes/Launcher";
import { LoadingScene } from "./scenes/Loading";
import { NotFoundScene, Room405Scene } from "./scenes/NotFound";
import { OptionsScene } from "./scenes/Options";
import { TitleScene } from "./scenes/Title";
import { TutorialScene } from "./scenes/Tutorial";
import { VoidScene } from "./scenes/Void";
import { Game, useDirectorView, type GameContext } from "./ui/context";
import { RealSettings } from "./ui/RealSettings";
import { Shell } from "./ui/Shell";

type Screen = { kind: "title" } | { kind: "crack" } | { kind: "scene"; scene: SceneId; key: number; again?: boolean } | { kind: "quit" } | { kind: "stay" };

/** (Module-level, so the component's handlers stay pure in the React Compiler's eyes.) */
const clock = () => performance.now();
let screens = 0;
const nextKey = () => ++screens;

/** Did someone type ?room=405 into the address bar, and have they got that far? */
function typed405(): boolean {
  if (roomParam() !== "405") return false;
  const s = dttgSave.get();
  return finishedOnce(s) || (s.scene !== null && CHAPTER_OF[s.scene] >= 4);
}

const MOODS: Record<SceneId, Mood> = {
  tutorial: "happy",
  options: "uneasy",
  launcher: "uneasy",
  loading: "uneasy",
  crash: "off",
  "404": "broken",
  "405": "happy",
  void: "void",
  console: "broken",
  credits: "credits",
};

export default function DontTrustTheGame() {
  const save = useSave(dttgSave);
  const comfort = useComfort();
  const touch = useCoarsePointer();
  const portrait = usePortrait();
  const [director] = useState(() => new Director());
  const view = useDirectorView(director);
  const screenEl = useRef<HTMLDivElement | null>(null);
  // Arriving: straight into room 405 if that's what the address bar says (and you've got that far).
  const [arrival] = useState(() => ({ room405: typed405(), cameBack: comesBack(dttgSave.get()) }));
  const [screen, setScreen] = useState<Screen>(() => (arrival.room405 ? { kind: "scene", scene: "405", key: nextKey() } : { kind: "title" }));
  const [truth, setTruth] = useState(false);
  const [settings, setSettings] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [cameBack, setCameBack] = useState(arrival.cameBack);
  const chapterStart = useRef(0);
  /** Room 405 was reached by a history entry we pushed (so the door goes back through history). */
  const pushed405 = useRef(false);
  /** The scene on screen and Truth Mode, as of now (handlers and the skip run between renders). */
  const current = useRef<SceneId | null>(null);
  const truthNow = useRef(false);

  const setTruthMode = (on: boolean) => {
    truthNow.current = on;
    director.setTruth(on);
    setTruth(on);
  };

  const { elsewhere, playHere } = useTabGuard({ channel: "mfg:dont-trust-the-game", save: dttgSave, onElsewhere: () => setScreen({ kind: "title" }) });

  useEffect(() => {
    director.start();
    // QA scripts drive the game through this (dev builds only): director.runtime is the platformer on screen.
    if (process.env.NODE_ENV !== "production") (window as unknown as { __dttg?: unknown }).__dttg = { director, save: dttgSave };
    return () => director.destroy();
  }, [director]);

  useEffect(() => director.setTouch(touch), [director, touch]);

  // The real world pauses the fiction: a hidden tab, or the real settings.
  useEffect(() => onTabVisibility((hidden) => director.hold("tab", hidden)), [director]);
  useEffect(() => director.hold("settings", settings), [director, settings]);

  // Leaving: the tab's title and icon go back, the save is written, the music stops.
  useEffect(
    () => () => {
      giveTabBack();
      hush();
      music.stop();
      dttgSave.flush();
    },
    [],
  );

  const goTo = (scene: SceneId, { again = false }: { again?: boolean } = {}) => {
    const s = dttgSave.get();
    const before = current.current ? CHAPTER_OF[current.current] : 0;
    if (CHAPTER_OF[scene] !== before) chapterStart.current = clock();
    current.current = scene;
    director.enter(scene, () => {
      const next = nextChapter(scene);
      if (next) goTo(next);
    });
    if (scene !== "405") dttgSave.set(enterScene(s, scene, truthNow.current));
    music.play(MOODS[scene]);
    setScreen({ kind: "scene", scene, key: nextKey(), again });
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const finish = (chapter: ChapterNo) => {
    const out = chapterDone(dttgSave.get(), chapter, Math.round(clock() - chapterStart.current), truthNow.current);
    dttgSave.set(out.save);
    director.unlock(out.unlock);
    director.flushPlayTime();
  };

  // On the way in: the visit after the ending says so (once); ?room=405 is either a secret or too early.
  const arrive = useEffectEvent(() => {
    if (arrival.cameBack) {
      dttgSave.update((s) => ({ ...s, cameBack: true }));
      unlockDttgAchievement("you-came-back");
    }
    if (arrival.room405) {
      current.current = "405";
      director.enter("405", null);
      unlockDttgAchievement("hacker");
      music.play(MOODS["405"]);
    } else if (roomParam() !== null) {
      setRoomParam(null, "replace");
      director.toast("Room 405? Nice try. Come back in Chapter 4.");
    }
  });
  useEffect(() => arrive(), []);

  // Back and Forward step between room 404 and room 405 (one history entry, never more).
  const travelled = useEffectEvent(() => {
    if (screen.kind !== "scene") return;
    const room = roomParam();
    if (screen.scene === "405" && room !== "405") {
      pushed405.current = false;
      goTo("404");
    } else if (screen.scene === "404" && room === "405") {
      pushed405.current = true;
      goTo("405");
    }
  });
  useEffect(() => onBackForward(() => travelled()), []);

  const play = (scene: SceneId, fresh: boolean) => {
    getAudio();
    setTruthMode(false);
    if (fresh) dttgSave.set({ ...dttgSave.get(), scene: null });
    goTo(scene);
  };

  const body = (() => {
    switch (screen.kind) {
      case "title":
        return (
          <TitleScene
            save={save}
            cameBack={cameBack}
            onPlay={play}
            onTruth={(scene) => {
              getAudio();
              setTruthMode(true);
              goTo(scene);
            }}
          />
        );
      case "crack":
        return (
          <CrackScene
            onDone={() => {
              dttgSave.update((s) => ({ ...s, cracked: true }));
              finish(1);
              goTo("options");
            }}
          />
        );
      case "quit":
        return (
          <QuitEnding
            save={save}
            truth={truth}
            onTitle={() => {
              setTruthMode(false);
              current.current = null;
              setScreen({ kind: "title" });
              music.play("happy");
            }}
          />
        );
      case "stay":
        return <StayScene onAgain={() => goTo("credits", { again: true })} />;
      case "scene":
        break;
    }
    const k = screen.key;
    switch (screen.scene) {
      case "tutorial":
        return <TutorialScene key={k} onOptions={() => setScreen({ kind: "crack" })} />;
      case "options":
        return <OptionsScene key={k} onMoreGames={() => goTo("launcher")} />;
      case "launcher":
        return (
          <LauncherScene
            key={k}
            onRightDoor={() => {
              finish(2);
              goTo("loading");
            }}
          />
        );
      case "loading":
        return (
          <LoadingScene
            key={k}
            onLoaded={() => {
              finish(3);
              goTo("crash");
            }}
          />
        );
      case "crash":
        return <CrashScene key={k} onSecretDoor={() => goTo("404")} />;
      case "404":
        return (
          <NotFoundScene
            key={k}
            onPortal={() => goTo("void")}
            onRoom405={() => {
              pushed405.current = true;
              setRoomParam("405", "push");
              goTo("405");
            }}
          />
        );
      case "405":
        return (
          <Room405Scene
            key={k}
            onBack={() => {
              if (pushed405.current) window.history.back();
              else {
                setRoomParam("404", "replace");
                goTo("404");
              }
            }}
          />
        );
      case "void":
        return (
          <VoidScene
            key={k}
            onExit={() => {
              finish(4);
              goTo("console");
            }}
            onReloaded={() => unlockDttgAchievement("reloaded")}
          />
        );
      case "console":
        return (
          <ConsoleScene
            key={k}
            onExit={() => {
              finish(5);
              goTo("credits");
            }}
          />
        );
      case "credits":
        return (
          <CreditsScene
            key={k}
            again={screen.again ?? false}
            onQuit={() => {
              finish(6);
              if (!truthNow.current) dttgSave.set(ended(dttgSave.get(), "quit"));
              director.flushPlayTime();
              music.stop();
              setScreen({ kind: "quit" });
            }}
            onStay={() => {
              if (!truthNow.current) dttgSave.set(ended(dttgSave.get(), "stay"));
              setScreen({ kind: "stay" });
            }}
          />
        );
    }
  })();

  const ctx = useMemo<GameContext>(
    () => ({ director, layout: portrait ? "tall" : "wide", touch, reducedMotion: comfort.reducedMotion, reduceFlashing: comfort.reduceFlashing, screen: screenEl, fullscreen }),
    [director, portrait, touch, comfort.reducedMotion, comfort.reduceFlashing, fullscreen],
  );

  if (elsewhere) return <ElsewhereNotice game="Don't Trust The Game" onPlayHere={playHere} />;

  return (
    <Game.Provider value={ctx}>
      <Shell view={view} prefs={save.prefs} onSettings={() => setSettings(true)} onFullscreenChange={setFullscreen}>
        {body}
      </Shell>
      <RealSettings
        open={settings}
        onOpenChange={setSettings}
        onReset={() => {
          setTruthMode(false);
          current.current = null;
          setCameBack(false);
          setScreen({ kind: "title" });
          director.hush();
        }}
      />
    </Game.Provider>
  );
}
