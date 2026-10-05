"use client";

// Chapter 4: "Error 404: Level not found" (Plan/04-dont-trust-the-game.md §5): the giant digits are platforms and the
// 0 is a portal. The address bar says ?room=404 (a clue in a blind spot): change it to 405, or bonk the second 4
// from below, and you're in room 405, which isn't in the game. The Back button rewinds out of it (one room only).
import { Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { setRoomParam } from "../browser/tricks";
import type { WorldEvent } from "../core/world";
import styles from "../dttg.module.css";
import { getLevel } from "../levels";
import type { Runtime } from "../play/runtime";
import { useGame } from "../ui/context";
import { FakePause } from "../ui/FakePause";
import { PlatformerView, type ViewState } from "../ui/PlatformerView";
import { useScene } from "../ui/useScene";

export function NotFoundScene({ onPortal, onRoom405 }: { onPortal: () => void; onRoom405: () => void }) {
  const { director, touch } = useGame();
  const runtime = useRef<Runtime | null>(null);
  const [menu, setMenu] = useState(false);
  const level = getLevel("404");
  // The game is coming apart: the picture tears now and then (never with Reduce flashing).
  const view = useRef<ViewState>({ brightness: 1, zoom: false, glitch: 0.3 });

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

  useEffect(() => {
    director.setStep("404");
    director.say("n.intro");
    setRoomParam("404", "replace");
  }, [director]);

  const onEvents = (events: readonly WorldEvent[]) => {
    for (const e of events) {
      if (e.type === "zone" && e.id === "zero" && !director.hasSaid("n.zero")) director.say("n.zero", { soon: true });
      if (e.type === "portal") onPortal();
      if (e.type === "bonk") onRoom405();
    }
  };

  return (
    <>
      <div className={styles.view} data-scene-view="404">
        <PlatformerView level={level} view={view} onEvents={onEvents} onReady={(r) => (runtime.current = r)} label="Error 404: level not found. The giant digits 4 0 4 stand like platforms; the 0 shimmers." />
        {touch && (
          <div className={styles.hud}>
            <button type="button" className={styles.hudBtn} onClick={openMenu} aria-label="Menu">
              <Menu className="size-4" aria-hidden />
            </button>
          </div>
        )}
      </div>
      {menu && <FakePause onResume={openMenu} onOptions={() => director.toast("Options not found.")} onQuit={() => director.say("p.quit", { now: true })} />}
    </>
  );
}

export function Room405Scene({ onBack }: { onBack: () => void }) {
  const { director } = useGame();
  const level = getLevel("405");
  useScene({ move: true, menu: false });

  useEffect(() => {
    director.setStep("404");
    director.say("n.405");
    director.secret("room-405");
  }, [director]);

  const onEvents = (events: readonly WorldEvent[]) => {
    for (const e of events) {
      if (e.type === "door" && e.kind === "back") onBack();
      if (e.type === "sticker") director.toast("A note on the desk: “Room 405 was cut from the game. You weren't supposed to see this.”");
    }
  };

  return (
    <div className={styles.view} data-scene-view="405">
      <PlatformerView level={level} onEvents={onEvents} label="Room 405: a cosy secret room with a sofa, a lamp and a computer showing room equals 405." />
    </div>
  );
}
