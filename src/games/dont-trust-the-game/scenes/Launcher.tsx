"use client";

// Chapter 2, More Games (Plan/04-dont-trust-the-game.md §5): a fake launcher of parodies of this arcade's own games.
// Most lead to silly broken screens. Right Door is the way forward (HELPER, glancing away, says it's broken). While
// it's open, the tab's icon becomes Right Door's (and after 30 seconds the same icon turns up in the launcher).
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { playSfx } from "../audio/sound";
import { drawRightDoorIcon, giveTabBack, iconUrl, setTab } from "../browser/tricks";
import styles from "../dttg.module.css";
import { useGame } from "../ui/context";

interface Parody {
  id: string;
  name: string;
  blurb: string;
  broken: string;
}

export const PARODIES: readonly Parody[] = [
  { id: "one-less-step", name: "One Less Step", blurb: "The door doesn't move. Neither do you.", broken: "You took one less step. You are already at the end. Congratulations?" },
  { id: "yep", name: "YEP!", blurb: "A quiz where every answer is yes.", broken: "Question 1: Is this a game? [YEP] … That was the only question. YEP!" },
  { id: "101-seconds", name: "101 Seconds", blurb: "Like 99 Seconds, but two seconds better.", broken: "Please wait 101 seconds. 101. 101. 101. (It's stuck.)" },
  { id: "real-floor", name: "Real Floor", blurb: "Every floor is real. Nothing happens.", broken: "You walk on the floor. It holds. You walk on the floor. It holds." },
  { id: "right-door", name: "Right Door", blurb: "There's only one door. It's the right one.", broken: "" },
  { id: "gravity-is-honest", name: "Gravity Is Honest", blurb: "Down is down. That's the whole game.", broken: "You fall. Down. As expected. The end." },
  { id: "panic-sit", name: "Panic Sit", blurb: "Sit down. Relax. Don't stack anything.", broken: "You sit. Nothing falls over. You win, very calmly." },
];

export function LauncherScene({ onRightDoor }: { onRightDoor: () => void }) {
  const { director } = useGame();
  const [open, setOpen] = useState<Parody | null>(null);
  const [tried, setTried] = useState<string[]>([]);
  const [icon, setIcon] = useState<string | null>(null);

  useEffect(() => {
    director.setStep("launcher");
    director.say("l.intro");
    const url = iconUrl(drawRightDoorIcon);
    setTab({ icon: url });
    const timer = window.setTimeout(() => {
      setIcon(url);
      director.say("l.icon");
    }, 30_000);
    return () => {
      window.clearTimeout(timer);
      giveTabBack();
    };
  }, [director]);

  const play = (p: Parody) => {
    playSfx("click");
    if (p.id === "right-door") {
      playSfx("door");
      onRightDoor();
      return;
    }
    director.act("other-game");
    setOpen(p);
    const next = tried.includes(p.id) ? tried : [...tried, p.id];
    setTried(next);
    if (next.length === PARODIES.length - 1) director.secret("all-games");
    director.say("l.broken", { now: true });
  };

  if (open) {
    return (
      <div className={cn(styles.full, styles.crash, styles.underHelper)} data-parody={open.id}>
        <p className={styles.crashHead}>{open.name}</p>
        <p className="text-[1.2em]">{open.broken}</p>
        <button type="button" className={cn(styles.fakeBtn, "self-start")} onClick={() => setOpen(null)} data-parody-back>
          Back to More Games
        </button>
      </div>
    );
  }

  return (
    <div className={cn(styles.full, styles.menu, styles.underHelper, "!rounded-none")} data-launcher>
      <div className="flex items-center gap-3">
        <p className={styles.menuTitle}>MORE GAMES</p>
        {icon && (
          <span className="ml-auto flex items-center gap-2 text-[0.85em] opacity-90" data-recent-icon>
            Recently played:
            {/* eslint-disable-next-line @next/next/no-img-element -- a data: URL drawn on a canvas a moment ago */}
            <img src={icon} alt="Right Door's icon" width={24} height={24} style={{ imageRendering: "pixelated" }} />
          </span>
        )}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 overflow-auto sm:grid-cols-3">
        {PARODIES.map((p) => (
          <button key={p.id} type="button" className={cn(styles.fakeBtn, "!flex-col !items-start !justify-start !gap-0.5 !p-2 text-left")} onClick={() => play(p)} data-game-card={p.id}>
            <span className="text-[1.1em]">{p.name}</span>
            <span className="text-[0.8em] font-normal opacity-85">{p.blurb}</span>
            {tried.includes(p.id) && <span className="text-[0.75em] text-[#ff6fa8]">broken</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
