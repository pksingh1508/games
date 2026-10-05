"use client";

// A chapter, played (Plan/03-99-seconds.md §8.2–§8.5): the HUD (journal, loop counter, the loop clock, the hotspot
// highlight, pause), the room (a wall or a close-up, its hotspots as real buttons, arrows to turn: in a bar under it
// on a phone held upright), the message line, captions, the action ring, the flash between loops, and your pockets
// along the bottom (down the side on a phone on its side). Keys: ← → turn, ↓ or Esc backs out of a close-up, J the
// journal, H the hotspots, P pause, digits at a keypad. Swipe to turn; drag things from your pockets onto what you
// want to use them on.
import { BookOpen, ChevronLeft, ChevronRight, CornerDownLeft, Lightbulb, Pause, Play as PlayIcon, X } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent } from "react";
import { onTabVisibility } from "@/engine/browser/tab";
import { useSave } from "@/engine/save";
import { useComfort, usePortrait } from "@/games/shared/device";
import { Store } from "@/games/shared/store";
import { cn } from "@/lib/cn";
import { SevenSeg, pad2 } from "../art/kit";
import { SceneArt } from "../art/scene";
import type { LoopResult } from "../core/loop";
import type { ChapterProgress } from "../core/memory";
import { CHAPTERS, type ChapterId } from "../core/types";
import styles from "../ninety.module.css";
import { emptySnapshot, Runtime, type Mode, type Snapshot } from "../play/runtime";
import type { LoopReport } from "../progress";
import { CHAPTER_DEFS } from "../rooms";
import { ninetySave } from "../save";
import { itemIcon } from "./icons";
import { Journal } from "./Journal";
import { OptionsDialog } from "./Menus";

export interface PlayProps {
  chapter: ChapterId;
  mode: Mode;
  single: boolean;
  onClues(found: ReadonlyArray<{ id: string; at: number }>): void;
  onLoopEnd(report: LoopReport): void;
  /** The chapter's over: escaped, an ending, or (a Single Loop) caught by the reset. */
  onOver(result: LoopResult): void;
  onLeave(): void;
}

const VIEW_NAMES: Record<string, string> = { north: "the north wall", east: "the east wall", south: "the south wall", west: "the west wall" };

function HudClock({ value }: { value: number }) {
  const text = value >= 100 ? "100" : pad2(value);
  const w = text.length * 56 + (text.length - 1) * 20;
  return (
    <svg viewBox={`0 0 ${w + 20} 120`} aria-hidden>
      <SevenSeg x={10} y={10} h={100} value={text} />
    </svg>
  );
}

export function PlayScreen({ chapter, mode, single, onClues, onLoopEnd, onOver, onLeave }: PlayProps) {
  const save = useSave(ninetySave);
  const comfort = useComfort();
  // A phone held upright: the room's too small to have arrows over it, so they go in a bar underneath.
  const upright = usePortrait();
  const runtime = useRef<Runtime | null>(null);
  const [store] = useState(() => new Store<Snapshot>(emptySnapshot(chapter)));
  const snap = useSyncExternalStore(store.subscribe, store.get, store.get);
  const [highlight, setHighlight] = useState(false);
  const [options, setOptions] = useState(false);
  const [drag, setDrag] = useState<{ item: string; x: number; y: number } | null>(null);
  const dragging = useRef<{ item: string; startX: number; startY: number; moved: boolean } | null>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const highlightTimer = useRef(0);

  const clues = useEffectEvent((found: ReadonlyArray<{ id: string; at: number }>) => onClues(found));
  const ended = useEffectEvent((report: LoopReport) => onLoopEnd(report));
  const subtitles = useEffectEvent(() => ninetySave.get().prefs.subtitles);

  useEffect(() => {
    const created = new Runtime({ chapter, mode, single, subtitles: () => subtitles(), progress: () => ninetySave.get().chapters[chapter].progress }, store, {
      onClues: (found) => clues(found),
      onLoopEnd: (report) => ended(report),
    });
    runtime.current = created;
    if (process.env.NODE_ENV !== "production") (window as unknown as { __n9?: unknown }).__n9 = { runtime: created };
    created.start();
    return () => {
      created.destroy();
      runtime.current = null;
    };
  }, [chapter, mode, single, store]);

  // When the chapter's over, a breath, then on.
  const finish = useEffectEvent((result: LoopResult) => onOver(result));
  useEffect(() => {
    if (!snap.over) return;
    const result = snap.over;
    const timer = window.setTimeout(() => finish(result), comfort.reducedMotion ? 300 : 1400);
    return () => window.clearTimeout(timer);
  }, [snap.over, comfort.reducedMotion]);

  // Looking away pauses.
  const hide = useEffectEvent((hidden: boolean) => {
    if (hidden) runtime.current?.setPaused(true);
  });
  useEffect(() => onTabVisibility((hidden) => hide(hidden)), []);

  const highlightNow = () => {
    setHighlight(true);
    window.clearTimeout(highlightTimer.current);
    highlightTimer.current = window.setTimeout(() => setHighlight(false), 2200);
  };
  const setJournal = (open: boolean) => runtime.current?.setJournal(open);

  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
    if (document.querySelector("[role=dialog][data-state=open]")) return;
    const rt = runtime.current;
    if (!rt) return;
    const s = store.get();
    if (s.journal) {
      if (event.code === "Escape" || event.code === "KeyJ") {
        event.preventDefault();
        setJournal(false);
      }
      return;
    }
    if (s.paused) {
      if (event.code === "Escape" || event.code === "KeyP") {
        event.preventDefault();
        rt.setPaused(false);
      }
      return;
    }
    const digit = /^(?:Digit|Numpad)(\d)$/.exec(event.code)?.[1];
    if (digit !== undefined && s.art.place === "closeup:keypad") {
      event.preventDefault();
      rt.typeDigit(digit);
      return;
    }
    switch (event.code) {
      case "ArrowLeft":
        if (s.wall) {
          event.preventDefault();
          rt.turn(-1);
        }
        break;
      case "ArrowRight":
        if (s.wall) {
          event.preventDefault();
          rt.turn(1);
        }
        break;
      case "ArrowDown":
        if (!s.wall) {
          event.preventDefault();
          rt.back();
        }
        break;
      case "Escape":
        event.preventDefault();
        if (s.selected) rt.select(null);
        else if (!s.wall) rt.back();
        else rt.setPaused(true);
        break;
      case "KeyJ":
        if (mode !== "hardcore") {
          event.preventDefault();
          setJournal(true);
        }
        break;
      case "KeyH":
        event.preventDefault();
        highlightNow();
        break;
      case "KeyP":
        event.preventDefault();
        rt.setPaused(true);
        break;
    }
  });
  useEffect(() => {
    const handler = (event: KeyboardEvent) => onKey(event);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Swipe to turn.
  const swipeStart = (e: ReactPointerEvent<HTMLDivElement>) => {
    swipe.current = { x: e.clientX, y: e.clientY };
  };
  const swipeEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s || !snap.wall) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) runtime.current?.turn(dx < 0 ? 1 : -1);
  };

  // Pockets: click to hold, or drag onto something.
  const itemDown = (id: string) => (e: ReactPointerEvent<HTMLButtonElement>) => {
    dragging.current = { item: id, startX: e.clientX, startY: e.clientY, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const itemMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = dragging.current;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > 10) d.moved = true;
    if (d.moved) setDrag({ item: d.item, x: e.clientX, y: e.clientY });
  };
  const itemUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = dragging.current;
    dragging.current = null;
    setDrag(null);
    if (!d) return;
    if (!d.moved) {
      runtime.current?.select(d.item);
      return;
    }
    const target = document.elementsFromPoint(e.clientX, e.clientY).find((el) => el instanceof HTMLElement && (el.dataset.hotspot || el.dataset.item)) as HTMLElement | undefined;
    if (target?.dataset.hotspot) runtime.current?.useOn(d.item, target.dataset.hotspot);
    else if (target?.dataset.item && target.dataset.item !== d.item) runtime.current?.useOn(d.item, `item:${target.dataset.item}`);
  };

  const def = CHAPTER_DEFS[chapter];
  const art = snap.art;
  const held = snap.paused || snap.journal || !!snap.transition || !!snap.over;
  const phase = snap.over ? "over" : snap.transition ? "transition" : snap.journal ? "journal" : snap.paused ? "paused" : "play";
  const viewName = VIEW_NAMES[art.place] ?? art.place.replace("closeup:", "the ");
  const progress = Object.fromEntries(CHAPTERS.map((c) => [c, save.chapters[c].progress])) as Record<ChapterId, ChapterProgress>;

  return (
    <div
      className={cn(styles.root, styles.area)}
      aria-label={`${def.title}, 99 Seconds`}
      data-game-area
      data-chapter={chapter}
      data-mode={mode}
      data-single={single ? "" : undefined}
      data-view={art.place}
      data-room={art.room}
      data-loop={snap.loop}
      data-display={snap.display}
      data-phase={phase}
      data-ready={snap.ready ? "" : undefined}
      data-items={snap.items.map((i) => i.id).join(" ")}
      data-selected={snap.selected ?? undefined}
    >
      <div className={styles.hud} data-hud>
        {mode !== "hardcore" ? (
          <button type="button" className={cn(styles.btn, styles.hudBtn, styles.hudLabelled)} onClick={() => setJournal(true)} aria-label="Journal (J)" data-open-journal>
            <BookOpen className="size-5" aria-hidden />
            <span className="max-sm:hidden">Journal</span>
          </button>
        ) : (
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--n9-dim)]">Hardcore</span>
        )}
        <span className={cn(styles.display, "text-lg max-sm:text-base")} data-loop-counter>
          {single ? "Single loop" : `Loop ${snap.loop}`}
        </span>
        {snap.hideClock ? (
          <span className={cn(styles.hand, styles.noClock)} data-clock-hidden>
            no clock here
          </span>
        ) : (
          <span key={snap.stretch} className={cn(styles.clock, snap.stretch > 0 && styles.stretched)} role="timer" aria-label={`${snap.display} seconds left`} data-clock>
            <HudClock value={snap.display} />
          </span>
        )}
        <button type="button" className={cn(styles.btn, styles.hudBtn)} onClick={highlightNow} aria-label="Show everything you can use (H)" data-highlight>
          <Lightbulb className="size-5" aria-hidden />
        </button>
        <button type="button" className={cn(styles.btn, styles.hudBtn)} onClick={() => runtime.current?.setPaused(true)} aria-label="Pause (P)" disabled={held} data-pause>
          <Pause className="size-5" aria-hidden />
        </button>
      </div>

      <div className={styles.stagePane}>
        <div className={cn(styles.stage, highlight && styles.highlight, snap.selected && styles.holding, !snap.wall && styles.closeup)} data-held={held ? "" : undefined} data-highlighting={highlight ? "" : undefined} onPointerDown={swipeStart} onPointerUp={swipeEnd} data-stage>
          <div className={styles.scene} style={{ filter: snap.saturation < 1 ? `saturate(${snap.saturation})` : undefined }}>
            <SceneArt a={art} label={`${def.title}: ${viewName}`} />
          </div>
          {snap.hotspots.map((h) => (
            <button
              key={h.id}
              type="button"
              className={styles.hotspot}
              style={{ left: `${(h.box[0] / 1600) * 100}%`, top: `${(h.box[1] / 900) * 100}%`, width: `${(h.box[2] / 1600) * 100}%`, height: `${(h.box[3] / 900) * 100}%` }}
              aria-label={snap.selected ? `Use the ${snap.items.find((i) => i.id === snap.selected)?.name.toLowerCase() ?? "item"} on ${h.label}` : h.label}
              onClick={() => runtime.current?.tap(h.id)}
              data-hotspot={h.id}
              disabled={held}
            />
          ))}
          {!upright &&
            (snap.wall ? (
              <>
                <button type="button" className={cn(styles.arrow, styles.arrowLeft)} onClick={() => runtime.current?.turn(-1)} aria-label="Turn left (←)" disabled={held} data-turn="left">
                  <ChevronLeft className="size-7" aria-hidden />
                </button>
                <button type="button" className={cn(styles.arrow, styles.arrowRight)} onClick={() => runtime.current?.turn(1)} aria-label="Turn right (→)" disabled={held} data-turn="right">
                  <ChevronRight className="size-7" aria-hidden />
                </button>
              </>
            ) : (
              <button type="button" className={cn(styles.btn, styles.backBtn)} onClick={() => runtime.current?.back()} aria-label="Back (Esc)" disabled={held} data-back>
                <CornerDownLeft className="size-4" aria-hidden /> <span className={styles.backLabel}>Back</span>
              </button>
            ))}
          {snap.caption && (
            <div key={`caption-${snap.caption.key}`} className={styles.caption} data-caption>
              {snap.caption.text}
            </div>
          )}
          {snap.noted && (
            <div key={`noted-${snap.noted.key}`} className={styles.noted} data-noted>
              noted in your journal
            </div>
          )}
          {snap.message && (
            <div key={`message-${snap.message.key}`} className={styles.message} data-message>
              {snap.message.text}
            </div>
          )}
          {snap.action && (
            <div className={styles.ring} data-action>
              <svg viewBox="0 0 40 40" aria-hidden>
                <circle cx={20} cy={20} r={16} fill="none" stroke="#5b4d45" strokeWidth={5} />
                <circle cx={20} cy={20} r={16} fill="none" stroke="#ffb45c" strokeWidth={5} strokeDasharray={`${snap.action.progress * 100.5} 200`} transform="rotate(-90 20 20)" strokeLinecap="round" />
              </svg>
              <span className="text-sm">{snap.action.doing}</span>
              <button type="button" className={cn(styles.btn, "!min-h-7 !px-2 text-xs")} onClick={() => runtime.current?.cancelAction()} data-cancel-action>
                <X className="size-3.5" aria-hidden /> Stop
              </button>
            </div>
          )}
          {art.extra && <div className={styles.extra} aria-hidden />}
          {snap.transition && (
            <div key={`t-${snap.transition.key}`} className={styles.transition} data-soft={comfort.reduceFlashing ? "" : undefined} data-transition>
              <span className={styles.display}>Loop {snap.transition.loop}</span>
            </div>
          )}
          {snap.over && (
            <div className={styles.overlay} data-over={snap.over}>
              <p className={cn(styles.display, "text-4xl")}>{snap.over === "reset" ? "The loop caught you." : snap.over === "paradox" ? "…" : "You're out."}</p>
            </div>
          )}
        </div>
      </div>

      {upright && (
        <div className={styles.navBar} data-nav-bar>
          {snap.wall ? (
            <button type="button" className={cn(styles.btn, styles.navLeft)} onClick={() => runtime.current?.turn(-1)} aria-label="Turn left" disabled={held} data-turn="left">
              <ChevronLeft className="size-6" aria-hidden />
            </button>
          ) : (
            <button type="button" className={cn(styles.btn, styles.navLeft)} onClick={() => runtime.current?.back()} disabled={held} data-back>
              <CornerDownLeft className="size-4" aria-hidden /> Back
            </button>
          )}
          <span className={cn(styles.hand, styles.place)} data-place-name>
            {viewName}
          </span>
          {snap.wall && (
            <button type="button" className={cn(styles.btn, styles.navRight)} onClick={() => runtime.current?.turn(1)} aria-label="Turn right" disabled={held} data-turn="right">
              <ChevronRight className="size-6" aria-hidden />
            </button>
          )}
        </div>
      )}

      <div className={styles.narration} aria-hidden data-narration>
        {snap.caption && <div className={styles.caption}>{snap.caption.text}</div>}
        {snap.message && <div className={styles.message}>{snap.message.text}</div>}
      </div>

      <div className={styles.pockets} role="group" aria-label="Your pockets" data-pockets>
        {snap.items.length === 0 ? (
          <span className="px-2 text-sm text-[var(--n9-dim)]">Empty pockets. (They empty every loop.)</span>
        ) : (
          snap.items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={styles.item}
              aria-pressed={snap.selected === item.id}
              title={item.about}
              onPointerDown={itemDown(item.id)}
              onPointerMove={itemMove}
              onPointerUp={itemUp}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  runtime.current?.select(item.id);
                }
              }}
              data-item={item.id}
            >
              {itemIcon(chapter, item.id)}
              {item.name}
            </button>
          ))
        )}
        {snap.selected && <span className="ml-auto pr-2 text-sm text-[var(--n9-dim)] max-sm:hidden">Now click what to use it on.</span>}
      </div>

      {snap.journal && (
        <div className={styles.overlay}>
          <Journal progress={progress} chapter={chapter} onClose={() => setJournal(false)} />
        </div>
      )}
      {snap.paused && !snap.over && (
        <div className={styles.overlay} data-card="paused">
          <div className={cn(styles.card, "w-[min(24rem,100%)] p-6 text-center")}>
            <p className={cn(styles.display, "text-4xl")}>Paused</p>
            <p className="mt-2 text-sm text-[var(--n9-dim)]">The clock&apos;s holding its breath at {snap.display}.</p>
            <div className="mt-5 grid gap-2">
              <button type="button" className={cn(styles.btn, styles.primary)} onClick={() => runtime.current?.setPaused(false)} data-resume>
                <PlayIcon className="size-4" aria-hidden /> Back to the room
              </button>
              <button type="button" className={styles.btn} onClick={() => setOptions(true)} data-options>
                Options
              </button>
              <button type="button" className={styles.btn} onClick={onLeave} data-leave>
                Leave (your journal stays)
              </button>
            </div>
          </div>
        </div>
      )}
      {drag && (
        <div className={styles.ghost} style={{ left: drag.x, top: drag.y }} aria-hidden>
          {itemIcon(chapter, drag.item)}
        </div>
      )}
      <p className="sr-only" aria-live="polite" data-live>
        {snap.message?.text ?? ""} {snap.caption?.text ?? ""}
      </p>
      <OptionsDialog open={options} onOpenChange={setOptions} />
    </div>
  );
}
