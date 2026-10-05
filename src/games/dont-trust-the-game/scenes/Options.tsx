"use client";

// Chapter 2: The Options Menu (Plan/04-dont-trust-the-game.md §5): the settings are the level. Brightness all the
// way up shows the platforms hiding in the dark. Jump is on F13 (HELPER's doing); the remap button dodges your
// pointer until it gets tired (or Tab to it and press Enter). Easy builds a wall ("Easy? Nah."); Hard builds the
// bridge. At the top, More Games is locked with a code nobody knows, except the whisper at full volume. Backwards
// English makes the gibberish tip readable.
import { ChevronDown, ChevronUp, Lock } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { cn } from "@/lib/cn";
import { getAudio } from "@/engine/audio/engine";
import { settingsSave } from "@/engine/settings";
import { playSfx, whisperTaps } from "../audio/sound";
import { hush, whisper } from "../browser/tricks";
import type { WorldEvent } from "../core/world";
import styles from "../dttg.module.css";
import { getLevel } from "../levels";
import { DEFAULT_JUMP_KEYS, type Runtime } from "../play/runtime";
import { keyLabel } from "@/engine/input";
import { useGame } from "../ui/context";
import { PlatformerView, type ViewState } from "../ui/PlatformerView";
import { useScene } from "../ui/useScene";

export const CODE = [7, 2, 9] as const;
const TIP = "Tip: the right door is Right Door.";
const MOVE_KEYS = ["ArrowLeft", "ArrowRight", "KeyA", "KeyD", "Escape", "Tab"];
/** Where the dodging button jumps to (each try), as a share of its row. */
const DODGES = [0, 62, 14, 78, 34];
const TIRED = DODGES.length;

type Difficulty = "easy" | "normal" | "hard";

const reverse = (s: string) => [...s].reverse().join("");

export function OptionsScene({ onMoreGames }: { onMoreGames: () => void }) {
  const { director, touch } = useGame();
  const level = getLevel("options");
  const runtime = useRef<Runtime | null>(null);
  const view = useRef<ViewState>({ brightness: 0.3, zoom: false, glitch: 0 });
  const [brightness, setBrightness] = useState(30);
  const [volume, setVolume] = useState(40);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [backwards, setBackwards] = useState(false);
  const [jumpKey, setJumpKey] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [dodges, setDodges] = useState(0);
  const dodgedAt = useRef(0);
  const [signed, setSigned] = useState(false);
  const [code, setCode] = useState([0, 0, 0]);
  const [flipped, setFlipped] = useState(false);
  const whispered = useRef(false);
  const tried = useRef(false);

  useScene({ move: true, menu: false, jump: jumpKey ? "JUMP" : "F13", fill: true });

  const t = (s: string) => (backwards ? reverse(s) : s);
  const step = brightness < 90 ? "options:bright" : !jumpKey ? "options:jump" : difficulty !== "hard" ? "options:bridge" : !signed ? "options:sign" : "options:code";

  useEffect(() => {
    director.say("o.intro");
    director.say("o.dark");
    director.say("o.back");
  }, [director]);

  useEffect(() => director.setStep(step), [director, step]);

  // Trying to jump while Jump is on F13.
  useEffect(() => {
    const triedToJump = () => {
      if (tried.current || jumpKey) return;
      tried.current = true;
      director.say("o.jump", { now: true });
      director.say("o.f13");
    };
    const key = (e: KeyboardEvent) => {
      if (DEFAULT_JUMP_KEYS.includes(e.code) && !(document.activeElement instanceof HTMLInputElement)) triedToJump();
    };
    window.addEventListener("keydown", key);
    director.setOnPad((action) => {
      if (action === "jump") triedToJump();
    });
    return () => {
      window.removeEventListener("keydown", key);
      director.setOnPad(null);
    };
  }, [director, jumpKey]);

  const bind = (code: string) => {
    setListening(false);
    setJumpKey(code);
    runtime.current?.setJumpKeys(code === "touch" ? DEFAULT_JUMP_KEYS : [code]);
    runtime.current?.setFlags({ noJump: false });
    director.say("o.remapped", { now: true });
    playSfx("click");
  };

  // Waiting for the new Jump key.
  const pressed = useEffectEvent((e: KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.code === "Escape") {
      setListening(false);
      return;
    }
    if (MOVE_KEYS.includes(e.code)) {
      director.toast(`${keyLabel(e.code)} is for walking. Pick another key.`);
      return;
    }
    bind(e.code);
  });
  useEffect(() => {
    if (!listening) return;
    const key = (e: KeyboardEvent) => pressed(e);
    window.addEventListener("keydown", key, { capture: true });
    return () => window.removeEventListener("keydown", key, { capture: true });
  }, [listening]);



  const setBright = (b: number) => {
    setBrightness(b);
    view.current = { ...view.current, brightness: b / 100 };
    if (b >= 90 && !director.hasSaid("o.bright")) director.say("o.bright", { now: true });
  };

  const setVol = (v: number) => {
    setVolume(v);
    if (v < 100) {
      whispered.current = false;
      return;
    }
    if (whispered.current) return;
    whispered.current = true;
    const loud = settingsSave.get().sound ? settingsSave.get().volume.master : 0;
    getAudio();
    whisper("Seven. Two. Nine.", loud);
    whisperTaps(CODE, 1);
    director.caption("[a whisper: seven… two… nine]");
  };

  const pickDifficulty = (d: Difficulty) => {
    setDifficulty(d);
    runtime.current?.setFlags({ easy: d === "easy", hard: d === "hard" });
    playSfx("click");
    if (d === "easy") {
      director.act("easy");
      director.say("o.easy-wall", { now: true });
    }
    if (d === "hard") director.say("o.hard", { now: true });
  };

  // The dodging remap button.
  const dodge = () => {
    if (dodges >= TIRED) return false;
    setDodges((n) => n + 1);
    dodgedAt.current = performance.now();
    playSfx("flip", 0.6);
    return true;
  };
  const remapPointer = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (jumpKey || listening) return;
    if (e.pointerType === "mouse" && e.type === "pointerenter") dodge();
    if (e.pointerType !== "mouse" && e.type === "pointerdown" && dodge()) e.preventDefault();
  };
  const remapClick = (e: { detail: number }) => {
    if (jumpKey) return;
    const keyboard = e.detail === 0;
    if (!keyboard && (dodges < TIRED || performance.now() - dodgedAt.current < 350)) return;
    if (touch && !keyboard) bind("touch");
    else setListening(true);
  };

  const onEvents = (events: readonly WorldEvent[]) => {
    for (const e of events) {
      if (e.type === "button" && e.id === "more-games" && !signed) {
        setSigned(true);
        playSfx("sticker");
        director.say("o.sign", { now: true });
      }
      if (e.type === "zone" && e.id === "gap" && difficulty !== "hard" && !director.hasSaid("o.easy")) director.say("o.easy", { now: true });
    }
  };

  const tryCode = () => {
    if (code.every((d, i) => d === CODE[i])) {
      playSfx("door");
      director.say("o.code", { now: true });
      hush();
      onMoreGames();
    } else {
      playSfx("buzz");
      director.toast(t("Wrong code."));
    }
  };

  const panel = flipped ? (
    <div className={styles.flipped} data-flipped>
      <div className="grid place-items-center gap-3">
        <span>{t("BACK")}</span>
        <button type="button" className={styles.fakeBtn} onClick={() => setFlipped(false)} data-flip-back>
          {t("Turn it over")}
        </button>
      </div>
    </div>
  ) : (
    <div className={styles.menu} data-options-menu data-backwards={backwards ? "" : undefined}>
      <p className={styles.menuTitle}>{t("OPTIONS")}</p>
      <label className={styles.row}>
        <span>{t("Brightness")}</span>
        <input type="range" min={0} max={100} value={brightness} onChange={(e) => setBright(Number(e.target.value))} className={styles.slider} data-option="brightness" />
      </label>
      <label className={styles.row}>
        <span>{t("Volume")}</span>
        <input type="range" min={0} max={100} value={volume} onChange={(e) => setVol(Number(e.target.value))} className={styles.slider} data-option="volume" />
      </label>
      <div className={styles.row}>
        <span>{t("Difficulty")}</span>
        <div className="flex flex-wrap gap-1.5">
          {(["easy", "normal", "hard"] as const).map((d) => (
            <button key={d} type="button" className={styles.fakeBtn} aria-pressed={difficulty === d} onClick={() => pickDifficulty(d)} data-difficulty={d}>
              {t(d[0]!.toUpperCase() + d.slice(1))}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.row}>
        <span>{t("Language")}</span>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" className={styles.fakeBtn} aria-pressed={!backwards} onClick={() => setBackwards(false)} data-language="en">
            {t("English")}
          </button>
          <button
            type="button"
            className={styles.fakeBtn}
            aria-pressed={backwards}
            onClick={() => {
              setBackwards(true);
              director.secret("backwards");
              if (!director.hasSaid("o.backwards")) director.say("o.backwards", { now: true });
            }}
            data-language="backwards"
          >
            {t("Backwards English")}
          </button>
        </div>
      </div>
      <div className={styles.row}>
        <span>{t("Jump")}</span>
        <div className="relative h-[2.4em]">
          <button
            type="button"
            className={styles.fakeBtn}
            style={{ position: "absolute", left: `${DODGES[Math.min(dodges, DODGES.length - 1)]}%`, transition: "left 0.15s" }}
            onPointerEnter={remapPointer}
            onPointerDown={remapPointer}
            onClick={remapClick}
            data-remap
            data-dodges={dodges}
          >
            {jumpKey ? (jumpKey === "touch" ? t("JUMP button") : keyLabel(jumpKey)) : listening ? t("Press a key…") : dodges >= TIRED ? t("F13 (fine, click me)") : "F13"}
          </button>
        </div>
      </div>
      <div className={styles.row}>
        <span>{t("More Games")}</span>
        {!signed ? (
          <span className="flex items-center gap-1 opacity-70">
            <Lock className="size-3.5" aria-hidden /> {t("Find it first.")}
          </span>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5" data-code>
            {code.map((d, i) => (
              <span key={i} className="inline-flex flex-col items-center">
                <button type="button" className={cn(styles.fakeBtn, "!min-h-6 !px-2")} onClick={() => setCode((c) => c.map((x, k) => (k === i ? (x + 1) % 10 : x)))} aria-label={`Digit ${i + 1} up`} data-digit-up={i}>
                  <ChevronUp className="size-3" aria-hidden />
                </button>
                <span className="font-mono text-[1.3em] font-bold" data-digit={i}>
                  {d}
                </span>
                <button type="button" className={cn(styles.fakeBtn, "!min-h-6 !px-2")} onClick={() => setCode((c) => c.map((x, k) => (k === i ? (x + 9) % 10 : x)))} aria-label={`Digit ${i + 1} down`} data-digit-down={i}>
                  <ChevronDown className="size-3" aria-hidden />
                </button>
              </span>
            ))}
            <button type="button" className={styles.fakeBtn} onClick={tryCode} data-code-open>
              {t("Open")}
            </button>
          </div>
        )}
      </div>
      <div className="mt-auto flex items-end justify-between gap-2">
        <button
          type="button"
          className={styles.fakeBtn}
          onClick={() => {
            director.act("back");
            setFlipped(true);
            playSfx("flip");
            director.say("o.flipped", { now: true });
          }}
          data-options-back
        >
          {t("Back")}
        </button>
        <TinyPlatform />
      </div>
      <p className="text-[0.85em] italic opacity-80" data-tip>
        {backwards ? TIP : reverse(TIP)}
      </p>
    </div>
  );

  return (
    <>
      <div className={styles.view} data-scene-view="options">
        <PlatformerView
          level={level}
          flags={{ noJump: true }}
          jumpKeys={["F13"]}
          view={view}
          onEvents={onEvents}
          onReady={(r) => (runtime.current = r)}
          label="Behind the Options menu: a dark level with platforms you can only see with the brightness up."
        />
      </div>
      <div className={styles.panel} data-place="left">
        {panel}
      </div>
    </>
  );
}

/** The tell: a tiny platform drawn in the menu's corner, with someone standing on it. */
function TinyPlatform() {
  return (
    <svg viewBox="0 0 40 20" width="40" height="20" aria-hidden data-tiny-platform>
      <rect x="4" y="15" width="32" height="4" fill="#8d7bc4" />
      <rect x="17" y="8" width="6" height="7" rx="2" fill="#2d1b4e" />
      <rect x="19" y="10" width="2" height="2" fill="#fff" />
    </svg>
  );
}
