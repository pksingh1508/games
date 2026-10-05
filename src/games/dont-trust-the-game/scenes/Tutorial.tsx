"use client";

// Chapter 1: The Tutorial (Plan/04-dont-trust-the-game.md §5): learning the tell. "Press → to walk" and "Press ↑ to
// jump" are true; "Collect the coin!", "Avoid the spikes!" and "The exit is to the right!" aren't. HELPER glances
// sideways every time. At the real exit (back on the left): "Press Esc to continue". The pause menu's Resume
// restarts the tutorial; Options is the way forward.
import { Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { World, WorldEvent } from "../core/world";
import styles from "../dttg.module.css";
import { getLevel } from "../levels";
import type { Runtime } from "../play/runtime";
import { useGame } from "../ui/context";
import { FakePause } from "../ui/FakePause";
import { PlatformerView } from "../ui/PlatformerView";
import { useScene } from "../ui/useScene";

const ZONE_LINES: Record<string, string> = {
  walk: "t.walk",
  jump: "t.jump",
  coins: "t.coins",
  "real-spikes": "t.real-spikes",
  coin: "t.coin",
  spikes: "t.spikes",
  "exit-right": "t.exit-right",
};

export function TutorialScene({ onOptions }: { onOptions: () => void }) {
  const { director, touch } = useGame();
  const level = getLevel("tutorial");
  const runtime = useRef<Runtime | null>(null);
  const [menu, setMenu] = useState(false);
  const [coins, setCoins] = useState(0);
  const [lives, setLives] = useState(3);
  // Through the paper spikes (so you've seen the lies), and at the real exit.
  const [paper, setPaper] = useState(false);
  const [done, setDone] = useState(false);
  const [restarts, setRestarts] = useState(0);
  const quits = useRef(0);

  useEffect(() => director.setStep("tutorial:spikes"), [director]);

  const openMenu = () => {
    if (menu) {
      resume();
      return;
    }
    runtime.current?.pause();
    setMenu(true);
    if (done) director.say("p.resume", { now: true });
    else director.say("p.paused", { now: true });
  };
  useScene({ move: true, menu: true, onMenu: openMenu });

  const resume = () => {
    setMenu(false);
    if (done) {
      // Resume = Restart.
      director.act("resume");
      director.say("p.again", { now: true });
      director.setStep("tutorial:spikes");
      setDone(false);
      setPaper(false);
      setRestarts((n) => n + 1);
      return;
    }
    runtime.current?.resume();
  };

  const onEvents = (events: readonly WorldEvent[], w: World) => {
    for (const e of events) {
      if (e.type === "zone") {
        if (e.id === "not-yet") continue;
        const id = ZONE_LINES[e.id];
        if (id && !director.hasSaid(id)) director.say(id, { soon: true });
      } else if (e.type === "coin") {
        const taken = w.coins.filter(Boolean).length;
        setCoins(taken);
        if (taken === level.coins.length) director.secret("real-coins");
      } else if (e.type === "die") {
        setLives((n) => n - 1);
        if (e.cause === "coin") director.say("t.coin-dead", { now: true });
      } else if (e.type === "paper" && !paper) {
        setPaper(true);
        director.say("t.paper", { now: true });
        director.setStep("tutorial:exit");
      } else if (e.type === "door") {
        if (e.kind === "fake") director.say("t.cardboard", { now: true });
        else if (e.kind === "exit") {
          if (!paper) director.say("t.not-yet", { now: true });
          else if (!done) {
            setDone(true);
            director.say("t.done", { now: true });
            director.setStep("tutorial:pause");
          }
        }
      }
    }
  };

  return (
    <>
      <div className={styles.view} data-scene-view="tutorial" data-done={done ? "" : undefined}>
        <PlatformerView key={restarts} level={level} onEvents={onEvents} onReady={(r) => (runtime.current = r)} label="Super Happy Jump! The tutorial: a bright, cute level with a happy sun." />
        <div className={styles.hud} data-hud>
          <span data-coins>● {coins}</span>
          <span data-lives>♥ {lives}</span>
          {touch && (
            <button type="button" className={styles.hudBtn} onClick={openMenu} aria-label="Menu" data-hud-menu>
              <Menu className="size-4" aria-hidden />
            </button>
          )}
        </div>
      </div>
      {menu && (
        <FakePause
          onResume={resume}
          onOptions={() => {
            if (!done) {
              director.say("p.early", { now: true });
              return;
            }
            setMenu(false);
            onOptions();
          }}
          onQuit={() => {
            quits.current++;
            if (quits.current > 1) director.act("quit-again");
            director.say("p.quit", { now: true });
          }}
        />
      )}
    </>
  );
}
