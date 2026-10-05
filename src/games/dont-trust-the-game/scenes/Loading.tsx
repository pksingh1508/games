"use client";

// Chapter 3: Now Loading… (Plan/04-dont-trust-the-game.md §5): stuck at 99%. The bar is a platform, the spinner is a
// saw, the dots are stepping stones (one's missing), and the missing 1% is a block in a corner outside the safe
// frame: pull the lever (or go fullscreen for real) to see it, push it into the gap. Switch tabs and the tab begs
// you to stay, then shows a CD key (it turns up in the tips after a while, too) that skips the whole thing.
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { onTabVisibility } from "@/engine/browser/tab";
import { cn } from "@/lib/cn";
import { playSfx } from "../audio/sound";
import { giveTabBack, setTab } from "../browser/tricks";
import type { WorldEvent } from "../core/world";
import styles from "../dttg.module.css";
import { getLevel } from "../levels";
import type { Runtime } from "../play/runtime";
import { useGame } from "../ui/context";
import { FakePause } from "../ui/FakePause";
import { PlatformerView, type ViewState } from "../ui/PlatformerView";
import { useScene } from "../ui/useScene";

export const CD_KEY = [2, 4, 6, 8] as const;
const TIPS = [
  "Tip: Never trust tips.",
  "Tip: The bar can take your weight.",
  "Tip: 99% is basically 100%.",
  "Tip: Some of the screen is off the screen.",
  "Tip: Pushing things helps them load.",
  "Tip: Switching tabs never made anything load faster.",
];
const KEY_TIP = `Tip: Your CD key is ${CD_KEY.join("")}. Don't tell anyone.`;
/** The CD key shows up in the tips this long in (the in-game way to get it). */
export const KEY_TIP_AFTER_MS = 120_000;

export function LoadingScene({ onLoaded }: { onLoaded: (skipped: boolean) => void }) {
  const { director, fullscreen } = useGame();
  const level = getLevel("loading");
  const runtime = useRef<Runtime | null>(null);
  const view = useRef<ViewState>({ brightness: 1, zoom: false, glitch: 0.15 });
  const [lever, setLever] = useState(false);
  const [tip, setTip] = useState(0);
  const [keyTip, setKeyTip] = useState(false);
  const [menu, setMenu] = useState(false);
  const [skip, setSkip] = useState(false);
  const [digits, setDigits] = useState([0, 0, 0, 0]);
  const [done, setDone] = useState(false);
  const zoom = lever || fullscreen;

  useEffect(() => {
    view.current = { ...view.current, zoom };
  }, [zoom]);

  const openMenu = () => {
    if (menu) {
      setMenu(false);
      runtime.current?.resume();
      return;
    }
    runtime.current?.pause();
    setMenu(true);
  };
  useScene({ move: true, menu: true, onMenu: openMenu });

  useEffect(() => director.setStep(zoom ? "loading:push" : "loading:see"), [director, zoom]);

  useEffect(() => {
    director.say("ld.wait");
    const timers = [window.setTimeout(() => director.say("ld.click", { soon: true }), 7000), window.setTimeout(() => setKeyTip(true), KEY_TIP_AFTER_MS)];
    const rotate = window.setInterval(() => setTip((n) => n + 1), 6000);
    // Switch tabs and the tab title begs, then gives you a CD key.
    let away: number | null = null;
    let back: number | null = null;
    const off = onTabVisibility((hidden) => {
      if (hidden) {
        if (back) window.clearTimeout(back);
        setTab({ title: "don't leave me 🥺" });
        away = window.setTimeout(() => setTab({ title: `🥺 CD key: ${CD_KEY.join("")}` }), 1500);
      } else {
        if (away) window.clearTimeout(away);
        setTab({ title: `CD key: ${CD_KEY.join("")} · Now loading… 99%` });
        director.secret("tab");
        director.say("ld.tab", { now: true });
        back = window.setTimeout(() => giveTabBack(), 9000);
      }
    });
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.clearInterval(rotate);
      if (away) window.clearTimeout(away);
      if (back) window.clearTimeout(back);
      off();
      giveTabBack();
    };
  }, [director]);

  const finish = (skipped: boolean) => {
    if (done) return;
    setDone(true);
    director.say(skipped ? "ld.skipped" : "ld.loaded", { now: true });
    window.setTimeout(() => onLoaded(skipped), 2200);
  };

  const onEvents = (events: readonly WorldEvent[]) => {
    for (const e of events) {
      if (e.type === "zone") {
        if (e.id === "saw" && !director.hasSaid("ld.saw")) director.say("ld.saw", { soon: true });
        if ((e.id === "dots" || e.id === "corner") && !director.hasSaid("ld.corner")) director.say("ld.corner", { soon: true });
        if (e.id === "lever" && !director.hasSaid("ld.fullscreen")) director.say("ld.fullscreen", { soon: true });
      } else if (e.type === "die" && e.cause === "saw" && !director.hasSaid("ld.bites")) director.say("ld.bites", { now: true });
      else if (e.type === "lever") {
        setLever((on) => !on);
        if (!director.hasSaid("ld.zoom")) director.say("ld.zoom", { now: true });
      } else if (e.type === "sticker") director.secret("outside");
      else if (e.type === "loaded") finish(false);
    }
  };

  const tipText = keyTip && tip % 2 === 1 ? KEY_TIP : TIPS[tip % TIPS.length]!;

  return (
    <>
      <div
        className={styles.view}
        data-scene-view="loading"
        data-zoom={zoom ? "" : undefined}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          if (director.hasSaid("ld.click")) {
            director.act("click-bar");
            if (!director.hasSaid("ld.clicked")) director.say("ld.clicked", { now: true });
          }
        }}
      >
        <PlatformerView level={level} view={view} onEvents={onEvents} onReady={(r) => (runtime.current = r)} label="A loading screen stuck at 99 percent. The loading bar is a platform." />
        <p className="pointer-events-none absolute inset-x-0 bottom-[1.5cqh] z-[5] text-center text-[clamp(0.7rem,2cqw,1rem)] font-bold text-[#a8a3d1]" data-tip>
          {tipText}
        </p>
        <button type="button" className={cn(styles.fakeBtn, "!absolute bottom-[1cqh] right-[1.5cqw] z-[6] !min-h-8 text-[clamp(0.65rem,1.8cqw,0.9rem)]")} onClick={() => setSkip(true)} data-skip-loading>
          Skip ▸
        </button>
      </div>
      {skip && !done && (
        <div className={styles.overlay} data-cd-key>
          <div className={cn(styles.menu, styles.card, "!h-auto")} role="dialog" aria-label="Enter your CD key">
            <p className={styles.menuTitle}>CD KEY</p>
            <p>Skipping requires your CD key. It came with the game.</p>
            <div className="flex items-center gap-2">
              {digits.map((d, i) => (
                <span key={i} className="inline-flex flex-col items-center">
                  <button type="button" className={cn(styles.fakeBtn, "!min-h-6 !px-2")} onClick={() => setDigits((c) => c.map((x, k) => (k === i ? (x + 1) % 10 : x)))} aria-label={`Digit ${i + 1} up`} data-key-up={i}>
                    <ChevronUp className="size-3" aria-hidden />
                  </button>
                  <span className="font-mono text-[1.4em] font-bold">{d}</span>
                  <button type="button" className={cn(styles.fakeBtn, "!min-h-6 !px-2")} onClick={() => setDigits((c) => c.map((x, k) => (k === i ? (x + 9) % 10 : x)))} aria-label={`Digit ${i + 1} down`} data-key-down={i}>
                    <ChevronDown className="size-3" aria-hidden />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className={styles.fakeBtn}
                onClick={() => {
                  if (digits.every((d, i) => d === CD_KEY[i])) {
                    playSfx("loaded");
                    setSkip(false);
                    finish(true);
                  } else {
                    playSfx("buzz");
                    director.toast("Invalid CD key. Did you lose the box?");
                  }
                }}
                data-key-enter
              >
                Enter
              </button>
              <button type="button" className={styles.fakeBtn} onClick={() => setSkip(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {menu && (
        <FakePause
          onResume={openMenu}
          onOptions={() => director.toast("You've seen enough options for one game.")}
          onQuit={() => director.say("p.quit", { now: true })}
        />
      )}
    </>
  );
}
