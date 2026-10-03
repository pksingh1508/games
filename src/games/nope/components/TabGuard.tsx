"use client";

// One NOPE! per browser (Plan/gameStack.md §5.4): if the game opens in another tab, this one
// steps aside instead of fighting over the same save.
import { MonitorX } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { newSeed } from "@/engine/rng";
import { nopeSave } from "../save";

const CHANNEL = "mfg:nope";

export function useTabGuard(onElsewhere: () => void) {
  const [elsewhere, setElsewhere] = useState(false);
  const channel = useRef<BroadcastChannel | null>(null);
  const id = useRef(0);
  const away = useEffectEvent(onElsewhere);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    id.current = newSeed();
    const bc = new BroadcastChannel(CHANNEL);
    channel.current = bc;
    bc.onmessage = (event: MessageEvent<{ type: string; id: number }>) => {
      if (event.data?.type === "hello" && event.data.id !== id.current) {
        nopeSave.flush();
        setElsewhere(true);
        away();
      }
    };
    bc.postMessage({ type: "hello", id: id.current });
    return () => {
      bc.close();
      channel.current = null;
    };
  }, []);

  const playHere = () => {
    nopeSave.reload();
    channel.current?.postMessage({ type: "hello", id: id.current });
    setElsewhere(false);
  };

  return { elsewhere, playHere };
}

export function ElsewhereNotice({ onPlayHere }: { onPlayHere: () => void }) {
  return (
    <div className="grid min-h-[calc(100dvh-4rem)] place-items-center px-4" role="alert">
      <div className="max-w-md rounded-[2rem] border-[3px] border-[#161414] bg-[#FFF4D6] p-8 text-center text-[#161414] shadow-[0_14px_0_0_rgba(0,0,0,0.45)]">
        <MonitorX className="mx-auto size-10" aria-hidden />
        <h1 className="mt-4 font-display text-3xl font-extrabold">NOPE! is open in another tab</h1>
        <p className="mt-2 text-[#615C52]">
          Only one tab can run the show at a time, so your save stays in one piece. Your progress is safe.
        </p>
        <button type="button" onClick={onPlayHere} className="btn btn-lg mt-6" data-sound="click">
          Play here instead
        </button>
      </div>
    </div>
  );
}
