"use client";

// One tab per game (Plan/gameStack.md §5.4): if a game opens in another tab, this one steps
// aside instead of fighting over the same save.
import { MonitorX } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { newSeed } from "@/engine/rng";

interface GuardedSave {
  flush(): void;
  reload(): void;
}

export function useTabGuard({ channel: name, save, onElsewhere }: { channel: string; save: GuardedSave; onElsewhere: () => void }) {
  const [elsewhere, setElsewhere] = useState(false);
  const channel = useRef<BroadcastChannel | null>(null);
  const id = useRef(0);
  const away = useEffectEvent(() => {
    save.flush();
    setElsewhere(true);
    onElsewhere();
  });

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    id.current = newSeed();
    const bc = new BroadcastChannel(name);
    channel.current = bc;
    bc.onmessage = (event: MessageEvent<{ type: string; id: number }>) => {
      if (event.data?.type === "hello" && event.data.id !== id.current) away();
    };
    bc.postMessage({ type: "hello", id: id.current });
    return () => {
      bc.close();
      channel.current = null;
    };
  }, [name]);

  const playHere = () => {
    save.reload();
    channel.current?.postMessage({ type: "hello", id: id.current });
    setElsewhere(false);
  };

  return { elsewhere, playHere };
}

/** Shown by the tab that stepped aside. Wears the game's palette (data-game). */
export function ElsewhereNotice({ game, onPlayHere }: { game: string; onPlayHere: () => void }) {
  return (
    <div className="grid min-h-[calc(100dvh-4rem)] place-items-center px-4" role="alert">
      <div className="max-w-md rounded-[2rem] border-[3px] border-ink bg-surface p-8 text-center text-ink shadow-[0_14px_0_0_rgba(0,0,0,0.45)]">
        <MonitorX className="mx-auto size-10" aria-hidden />
        <h1 className="mt-4 font-display text-3xl font-extrabold">{game} is open in another tab</h1>
        <p className="mt-2 text-muted-surface">
          Only one tab can play at a time, so your save stays in one piece. Your progress is safe.
        </p>
        <button type="button" onClick={onPlayHere} className="btn btn-lg mt-6" data-sound="click">
          Play here instead
        </button>
      </div>
    </div>
  );
}
