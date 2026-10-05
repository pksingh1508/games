"use client";

// The frame around the fiction (Plan/04-dont-trust-the-game.md §2, §8.2, §10 rules 4 and 5): a monitor with the
// game's screen in it, and outside it the arcade's real controls (the exit, the real settings), which nothing in the
// game can touch. Inside the screen: the scene, HELPER, TRUTH.exe, captions. On a touch screen, the pad.
import { ChevronLeft, ChevronRight, Expand, Menu, Power, Settings2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { enterFullscreen, exitFullscreen, fullscreenSupported, onFullscreen } from "../browser/tricks";
import styles from "../dttg.module.css";
import type { DirectorView } from "../play/director";
import type { Action } from "../play/runtime";
import type { Prefs } from "../save";
import { useGame } from "./context";
import { Helper } from "./Helper";
import { TruthExe } from "./TruthExe";

const ASPECT = 480 / 272;

export function Shell({
  view,
  prefs,
  children,
  onSettings,
  onFullscreenChange,
}: {
  view: DirectorView;
  prefs: Prefs;
  children: ReactNode;
  onSettings: () => void;
  onFullscreenChange: (on: boolean) => void;
}) {
  const { director, layout, touch, screen } = useGame();
  const root = useRef<HTMLDivElement | null>(null);
  const stage = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const pads = touch && view.pad.move && layout === "wide";

  // Fit the monitor's screen to the room there is.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const fit = () => {
      const padW = pads ? 2 * 92 : 0;
      const w = el.clientWidth - 24 - padW;
      const h = el.clientHeight - 12 - 30;
      if (layout === "tall") setSize({ w: Math.max(200, w), h: Math.max(220, h) });
      else {
        const sw = Math.max(240, Math.min(w, h * ASPECT));
        setSize({ w: Math.round(sw), h: Math.round(sw / ASPECT) });
      }
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, [layout, pads]);

  useEffect(() => onFullscreen((on) => onFullscreenChange(on)), [onFullscreenChange]);

  return (
    <div ref={root} className={styles.root} data-game-area data-scene={director.scene} data-layout={layout}>
      <div className={styles.realBar} data-real-bar>
        <Link href="/games/dont-trust-the-game" className="btn btn-secondary !min-h-10 !px-3" aria-label="Exit the game (for real)" data-real-exit>
          <X className="size-4" aria-hidden /> <span className="max-sm:hidden">Exit</span>
        </Link>
        <p className={styles.realNote}>Outside the game. These buttons always tell the truth.</p>
        <button type="button" className="btn btn-secondary !min-h-10 !px-3" onClick={onSettings} data-real-settings-open>
          <Settings2 className="size-4" aria-hidden /> <span className="max-sm:hidden">Real settings</span>
        </button>
      </div>

      <div ref={stage} className={styles.stage}>
        <div>{pads && <PadSide side="left" pad={view.pad} />}</div>
        <div className={styles.monitor}>
          <div ref={screen} className={styles.screen} data-layout={layout} data-fill={view.pad.fill ? "" : undefined} style={size ? { width: size.w, height: layout === "tall" && !view.pad.fill ? undefined : size.h, maxHeight: size.h } : undefined} data-screen>
            <Helper said={view.helper} speed={prefs.speed} describeEyes={prefs.describeEyes} />
            {children}
            <TruthExe view={view} />
            {view.caption && (
              <p key={view.caption.key} className={cn(styles.caption, styles.fade)} data-caption>
                {view.caption.text}
              </p>
            )}
            {view.toast && (
              <p key={view.toast.key} className={styles.toast} data-toast role="status">
                {view.toast.text}
              </p>
            )}
          </div>
          <div className={styles.chin}>
            <span className={styles.led} aria-hidden />
            <span className="flex-1">HAPPYTRON 3000</span>
            <button type="button" className={styles.chinBtn} onClick={() => director.toast("The power button is decorative.")} aria-label="Power" data-power>
              <Power className="size-3.5" aria-hidden />
            </button>
            <button
              type="button"
              className={styles.chinBtn}
              onClick={() => {
                if (document.fullscreenElement) exitFullscreen();
                else if (!fullscreenSupported() || !root.current) director.toast("This browser can't go fullscreen. (Try a lever.)");
                else void enterFullscreen(root.current);
              }}
              aria-label="Fullscreen"
              data-fullscreen
            >
              <Expand className="size-3.5" aria-hidden />
            </button>
          </div>
        </div>
        <div>{pads && <PadSide side="right" pad={view.pad} />}</div>
      </div>

      {touch && view.pad.move && layout === "tall" ? (
        <div className={styles.pad} data-pad>
          <PadSide side="left" pad={view.pad} />
          <PadSide side="right" pad={view.pad} />
        </div>
      ) : (
        <div />
      )}
    </div>
  );
}

/** Half the touch pad: ◀ ▶ on the left, JUMP (and ☰) on the right. */
function PadSide({ side, pad }: { side: "left" | "right"; pad: DirectorView["pad"] }) {
  const { director, layout } = useGame();
  const [held, setHeld] = useState<Partial<Record<Action, boolean>>>({});

  const down = (action: Action) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    director.press(action);
    setHeld((h) => ({ ...h, [action]: true }));
  };
  const up = (action: Action) => () => {
    director.release(action);
    setHeld((h) => ({ ...h, [action]: false }));
  };
  const props = (action: Action) => ({
    onPointerDown: down(action),
    onPointerUp: up(action),
    onPointerCancel: up(action),
    onContextMenu: (e: { preventDefault(): void }) => e.preventDefault(),
    "data-held": held[action] ? "" : undefined,
  });

  if (side === "left") {
    return (
      <div className={cn(styles.padSide, layout === "tall" && "!flex-row")}>
        <button type="button" className={styles.padBtn} aria-label="Left" {...props("left")} data-pad-btn="left">
          <ChevronLeft className="size-8" aria-hidden />
        </button>
        <button type="button" className={styles.padBtn} aria-label="Right" {...props("right")} data-pad-btn="right">
          <ChevronRight className="size-8" aria-hidden />
        </button>
      </div>
    );
  }
  return (
    <div className={cn(styles.padSide, layout === "tall" && "!flex-row-reverse")}>
      <button type="button" className={styles.padBtn} aria-label={`Jump (${pad.jump})`} {...props("jump")} data-pad-btn="jump" data-dead={pad.jump !== "JUMP" ? "" : undefined}>
        {pad.jump}
      </button>
      {pad.menu && (
        <button type="button" className={cn(styles.padBtn, "!size-14")} aria-label="Menu" onClick={() => director.menu?.()} data-pad-btn="menu">
          <Menu className="size-6" aria-hidden />
        </button>
      )}
    </div>
  );
}
