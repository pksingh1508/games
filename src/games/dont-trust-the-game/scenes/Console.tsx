"use client";

// Chapter 5: The Console (Plan/04-dont-trust-the-game.md §5): "There's nothing in the developer console" (glance).
// Desktop players who open DevTools find styled messages (and helper.truth()). Everyone else: the poster that looks
// blank is white on white (select it, or long-press it), and the version number in the corner becomes a developer
// console after seven taps. help, ls, cat, jump --height 999… sudo open door is a nice try; please open door opens.
import { Menu } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { unlockDttgAchievement } from "../achievements";
import { playSfx } from "../audio/sound";
import { onSelection, talkToTheConsole } from "../browser/tricks";
import { BOOT, HELP, runCommand, VERSION } from "../core/console";
import type { WorldEvent } from "../core/world";
import styles from "../dttg.module.css";
import { getLevel } from "../levels";
import type { Runtime } from "../play/runtime";
import { useGame } from "../ui/context";
import { FakePause } from "../ui/FakePause";
import { PlatformerView } from "../ui/PlatformerView";
import { useScene } from "../ui/useScene";

export const TAPS_TO_DEVELOP = 7;
const POSTER = "psst. tap the version number seven times.";

export function ConsoleScene({ onExit }: { onExit: () => void }) {
  const { director, touch } = useGame();
  const level = getLevel("console");
  const runtime = useRef<Runtime | null>(null);
  const [taps, setTaps] = useState(0);
  const [developer, setDeveloper] = useState(false);
  const [open, setOpen] = useState(false);
  const [doorOpen, setDoorOpen] = useState(false);
  const [read, setRead] = useState(false);
  const [menu, setMenu] = useState(false);
  const [lines, setLines] = useState<string[]>([...BOOT, 'Type "help".']);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const knocks = useRef(0);
  const field = useRef<HTMLInputElement | null>(null);

  const openMenu = () => {
    if (menu) {
      setMenu(false);
      runtime.current?.resume();
      return;
    }
    runtime.current?.pause();
    setMenu(true);
  };
  useScene({ move: true, menu: !open, fill: open, onMenu: openMenu });

  useEffect(() => director.setStep(developer ? "console:open" : "console:find"), [director, developer]);

  useEffect(() => {
    director.say("k.nothing");
    // For desktop players with DevTools open: the same messages, styled, and helper.truth().
    const quiet = talkToTheConsole(() => director.secret("truth"));
    // Selecting the poster's white-on-white text reads it.
    const off = onSelection((text) => {
      if (text.toLowerCase().includes("version number")) setRead(true);
    });
    return () => {
      quiet();
      off();
    };
  }, [director]);

  // The backquote opens the console too, once you're a developer.
  useEffect(() => {
    if (!developer) return;
    const key = (e: KeyboardEvent) => {
      if (e.code === "Backquote" && !(document.activeElement instanceof HTMLInputElement)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [developer]);

  useEffect(() => {
    if (open) field.current?.focus({ preventScroll: true });
  }, [open]);

  const tap = () => {
    playSfx("click");
    if (developer) {
      setOpen(true);
      return;
    }
    const n = taps + 1;
    setTaps(n);
    if (n >= TAPS_TO_DEVELOP) {
      setDeveloper(true);
      setOpen(true);
      playSfx("secret");
      director.toast("You are now a developer!");
      director.say("k.developer", { now: true });
      director.say("k.sudo");
    } else if (n >= 3) director.toast(`You are ${TAPS_TO_DEVELOP - n} ${TAPS_TO_DEVELOP - n === 1 ? "step" : "steps"} away from being a developer.`);
  };

  const run = (raw: string) => {
    const reply = runCommand(raw);
    playSfx("beep", 0.6);
    if (raw.trim()) setHistory((h) => [raw.trim(), ...h.filter((x) => x !== raw.trim())].slice(0, 6));
    switch (reply.effect) {
      case "clear":
        setLines([]);
        return;
      case "close":
        setOpen(false);
        return;
      case "moon":
        runtime.current?.moonJump();
        director.secret("moon-jump");
        break;
      case "open":
        setDoorOpen(true);
        runtime.current?.setFlags({ open: true });
        playSfx("door");
        unlockDttgAchievement("magic-word");
        director.say("k.please", { now: true });
        break;
      case "truth":
        director.secret("truth");
        break;
      case "cfg":
        director.secret("helper-cfg");
        break;
      case "sudo":
        director.act("sudo");
        break;
    }
    setLines((l) => [...l, `$ ${raw}`, ...reply.lines].slice(-60));
  };

  const onKey = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      run(input);
      setInput("");
    } else if (e.key === "Escape") setOpen(false);
    else if (e.key === "ArrowUp" && history[0]) setInput(history[0]);
  };

  const onEvents = (events: readonly WorldEvent[]) => {
    for (const e of events) {
      if (e.type === "zone" && e.id === "poster" && !director.hasSaid("k.poster")) director.say("k.poster", { soon: true });
      if (e.type === "zone" && e.id === "door" && !doorOpen && !director.hasSaid("k.locked")) director.say("k.locked", { soon: true });
      if (e.type === "door" && e.kind === "locked") {
        if (doorOpen) onExit();
        else if (director.hasSaid("k.locked") && ++knocks.current >= 3) director.act("locked-door");
      }
    }
  };

  return (
    <>
      <div className={styles.view} data-scene-view="console" data-door-open={doorOpen ? "" : undefined}>
        <PlatformerView level={level} onEvents={onEvents} onReady={(r) => (runtime.current = r)} label="A plain white room with a locked door marked console access only, and a poster that looks blank." />
        <p className={styles.poster} style={{ left: "24%", top: "18%", width: "26%" }} data-poster data-read={read ? "" : undefined}>
          {POSTER}
        </p>
        <button type="button" className={styles.version} onClick={tap} aria-label={`Version ${VERSION}`} data-version data-taps={taps}>
          {VERSION}
        </button>
        {touch && !open && (
          <div className={styles.hud}>
            <button type="button" className={styles.hudBtn} onClick={openMenu} aria-label="Menu">
              <Menu className="size-4" aria-hidden />
            </button>
          </div>
        )}
      </div>
      {open && (
        <div className={styles.panel} data-place="dock" data-console>
          <div className={cn(styles.terminal, "h-full w-full rounded-md")} role="dialog" aria-label="Developer console">
            <div className={styles.termOut} aria-live="polite" data-console-out>
              {lines.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 py-1.5" aria-label="Commands">
              {[...new Set([...HELP.slice(0, 2), "cat secrets.txt", ...history.slice(0, 3)])].map((c) => (
                <button key={c} type="button" className={styles.chip} onClick={() => setInput(c)} data-chip={c}>
                  {c}
                </button>
              ))}
            </div>
            <label className={styles.termIn}>
              <span aria-hidden>$</span>
              <input ref={field} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey} autoCapitalize="off" autoCorrect="off" spellCheck={false} aria-label="Command" data-console-in />
              <button
                type="button"
                className={styles.chip}
                onClick={() => {
                  run(input);
                  setInput("");
                }}
                data-console-run
              >
                Run
              </button>
              <button type="button" className={styles.chip} onClick={() => setOpen(false)} data-console-close>
                Close
              </button>
            </label>
          </div>
        </div>
      )}
      {menu && <FakePause onResume={openMenu} onOptions={() => director.toast("Options: see Chapter 2.")} onQuit={() => director.say("p.quit", { now: true })} />}
    </>
  );
}
