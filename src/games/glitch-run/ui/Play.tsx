"use client";

// The play screen (Plan/07-glitch-run.md §8): the screen fills the window and the HUD sits over it.
// Distance and score are top left, corruption and the multiplier top right, a glitch's warning top
// centre. Charges and the controls (as they really are right now) sit at the bottom, over the beat
// bar. Not Responding hangs a fake dialog over the screen while the game runs on underneath. A crash
// stamps PATCHED, and retry is instant. On touch screens the right half jumps, the left half slides,
// and ⚡ sits in the middle.
import { Check, FolderOpen, Pause, Play as PlayIcon, RotateCcw, RotateCw, Settings2, Share2, SkipForward, X } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { toast } from "@/components/ui/toast-store";
import { keyLabel } from "@/engine/input";
import { newSeed } from "@/engine/rng";
import { useSave } from "@/engine/save";
import { useCoarsePointer, useComfort, usePortrait } from "@/games/shared/device";
import { useFitCanvas } from "@/games/shared/fit";
import { useGamepadButtons } from "@/games/shared/gamepad";
import { shareResult } from "@/games/shared/share";
import { Store } from "@/games/shared/store";
import { cn } from "@/lib/cn";
import { SITE } from "@/lib/site";
import { BITS_PER_CHARGE, MAX_CHARGES, VIEW_H, VIEW_W } from "../core/constants";
import { dailyFor, type Daily } from "../gen/generator";
import styles from "../glitch-run.module.css";
import { GLITCHES } from "../glitches/kinds";
import { DEFAULT_KEYS, initialHud, Runtime, type Action, type Hud, type Mode, type RunResult } from "../play/runtime";
import { glitchSave } from "../save";
import { fileName, FINAL_STAGE, getStage, stageSource } from "../stages";
import { Bolt, GlitchIcon, PanicIcon } from "./icons";
import { OptionsPanel } from "./Menus";

export type PlayTarget = { kind: "stage"; id: string } | { kind: "endless" } | { kind: "daily" };

/** How a run went, once the save has it. */
export interface Recorded {
  newBest: boolean;
  best: number;
}

export interface PlayProps {
  target: PlayTarget;
  /** The run's over: save it. Null: the game's moving on (the end of the story). */
  onEnd(result: RunResult, daily: Daily | null): Recorded | null;
  /** Cleared a stage: the next one. */
  onNext(): void;
  onFiles(): void;
}

function modeFor(target: PlayTarget): Mode {
  if (target.kind === "stage") return { kind: "stage", stage: getStage(target.id) };
  if (target.kind === "daily") {
    const daily = dailyFor(new Date());
    return { kind: "endless", seed: daily.seed, daily };
  }
  return { kind: "endless", seed: newSeed(), daily: null };
}

/** One-time help for the stages that bring in something new (until they're cleared). */
const HINTS: Record<string, { keys: string; touch: string }> = {
  "01": { keys: "Space jumps (hold it to go higher) · ↓ slides · grab the bits", touch: "Tap the right half to jump (hold it to go higher) · the left half to slide" },
  "06": {
    keys: "Ten bits make a ⚡. Shift spends one: you Clip through anything for a moment, even a full scan line",
    touch: "Ten bits make a ⚡. Tap ⚡ to Clip through anything for a moment, even a full scan line",
  },
  "16": { keys: "When the screen hangs, keep running: the sounds and the beat bar never stop", touch: "When the screen hangs, keep running: the sounds and the beat bar never stop" },
};

const CAUSES: Record<NonNullable<RunResult["cause"]>, string> = {
  scan: "Caught by The Debugger's scan line.",
  spikes: "Corrupted spikes. Fatal.",
  wall: "Ran into solid data.",
  void: "Fell out of memory.",
};

export const shareText = (result: RunResult, daily: Daily | null) =>
  [
    `GLITCH RUN · ${daily ? `Daily Corruption #${daily.number}` : "Endless"}`,
    `${result.metres.toLocaleString("en-US")} m · ${result.score.toLocaleString("en-US")} pts · ×${result.peak.toFixed(1)}${result.panicsSurvived ? ` · survived ${result.panicsSurvived} Kernel Panic${result.panicsSurvived === 1 ? "" : "s"}` : ""}`,
    "▓▒░ YOU ARE THE BUG ░▒▓",
    `${SITE.url}/games/glitch-run`,
  ].join("\n");

export function PlayScreen({ target, onEnd, onNext, onFiles }: PlayProps) {
  const save = useSave(glitchSave);
  const comfort = useComfort();
  const coarse = useCoarsePointer();
  const portrait = usePortrait();
  const { area, frame } = useFitCanvas(VIEW_W, VIEW_H, "--gr-scale");
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const beatBar = useRef<HTMLCanvasElement | null>(null);
  const runtime = useRef<Runtime | null>(null);
  const [hudStore] = useState(() => new Store<Hud>(initialHud()));
  const hud = useSyncExternalStore(hudStore.subscribe, hudStore.get, hudStore.get);
  const [mode, setMode] = useState<Mode | null>(null);
  const [end, setEnd] = useState<(Recorded & { result: RunResult }) | null>(null);
  const [menu, setMenu] = useState<"pause" | "options" | null>(null);
  const [hideRotate, setHideRotate] = useState(false);
  const [glitchHeld, setGlitchHeld] = useState(false);
  const prefs = save.prefs;
  const stageId = target.kind === "stage" ? target.id : null;
  const source = stageId ? stageSource(stageId) : null;
  const daily = mode?.kind === "endless" ? mode.daily : null;

  // Build the run after the first paint: a stage proves itself clearable as it's built (a moment).
  useEffect(() => {
    const timer = setTimeout(() => setMode(modeFor(target)), 40);
    return () => clearTimeout(timer);
  }, [target]);

  const openMenu = () => {
    if (!runtime.current || end) return;
    runtime.current.pause();
    setMenu("pause");
  };
  const closeMenu = () => {
    setMenu(null);
    runtime.current?.resume();
    area.current?.focus({ preventScroll: true });
  };
  const retry = () => {
    setEnd(null);
    setMenu(null);
    runtime.current?.retry();
    area.current?.focus({ preventScroll: true });
  };

  const ended = useEffectEvent((result: RunResult) => {
    const recorded = onEnd(result, daily);
    if (recorded) setEnd({ ...recorded, result });
  });
  const togglePause = useEffectEvent(() => {
    if (menu) closeMenu();
    else openMenu();
  });
  const retryNow = useEffectEvent(() => retry());
  const flashing = useEffectEvent(() => comfort.reduceFlashing);
  const motion = useEffectEvent(() => comfort.reducedMotion);

  // One runtime per visit (it starts over in place for each attempt).
  useEffect(() => {
    if (!mode || !canvas.current) return;
    const p = glitchSave.get().prefs;
    const created = new Runtime(
      canvas.current,
      { mode, gentle: p.gentle, keys: p.keys, reduceFlashing: () => flashing(), reduceMotion: () => motion() },
      hudStore,
      { onEnd: (result) => ended(result), onPauseToggle: () => togglePause() },
    );
    runtime.current = created;
    // Dev builds only: a handle for the QA scripts.
    if (process.env.NODE_ENV !== "production") (window as unknown as { __gr?: unknown }).__gr = { runtime: created };
    created.bindBeatBar(p.beatBar ? beatBar.current : null);
    created.start();
    area.current?.focus({ preventScroll: true });
    return () => {
      created.destroy();
      runtime.current = null;
    };
  }, [mode, hudStore, area]);

  // Options changed (from the pause menu): apply them now.
  useEffect(() => {
    runtime.current?.setPrefs({ gentle: prefs.gentle, keys: prefs.keys });
    runtime.current?.bindBeatBar(prefs.beatBar ? beatBar.current : null);
  }, [prefs]);

  // The end card's keys (its main button has the focus, for Space and Enter): R retries, Esc goes to the files.
  const files = useEffectEvent(() => onFiles());
  const showing = end !== null;
  useEffect(() => {
    if (!showing) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || document.querySelector("[role=dialog]")) return;
      if (event.code === "Escape") {
        event.preventDefault();
        files();
      } else if (event.code === "KeyR") {
        event.preventDefault();
        retryNow();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showing]);

  const keys = (action: Action) => prefs.keys?.[action] ?? DEFAULT_KEYS[action];
  const hint = stageId ? HINTS[stageId] : undefined;
  const showHint = hint && !save.stages[stageId!]?.clears && hud.metres < 40 && hud.status === "run" && mode !== null;
  const warning = hud.warnings[0];
  const ready = hud.ready && mode !== null;
  // Touch: the right half sends jump (unless the halves are swapped in the options). Input Swap trades
  // jump and slide after that, like any button, and the labels say what each half really does now.
  const zonesJumpRight = !prefs.touchSwap;
  const rightJumps = zonesJumpRight !== hud.swap;

  return (
    <div
      ref={area}
      tabIndex={-1}
      className={cn(styles.root, styles.area)}
      aria-label={source ? `${fileName(source.id)}: ${source.name}` : target.kind === "daily" ? "Daily Corruption" : "Endless"}
      data-game-area
      data-target={stageId ?? target.kind}
      data-ready={ready ? "" : undefined}
      data-status={hud.status}
      data-attempt={hud.attempt}
    >
      {coarse && <TouchZones runtime={runtime} jumpRight={zonesJumpRight} disabled={end !== null || menu !== null} />}

      <div ref={frame} className={styles.stage} style={{ width: VIEW_W * 2, height: VIEW_H * 2, pointerEvents: "none" }}>
        <canvas ref={canvas} className={styles.canvas} aria-hidden />
        <div className={styles.scanlines} aria-hidden />

        {/* Not Responding: the window "hangs". The game doesn't. */}
        {hud.notResponding && (
          <div className={styles.hung} aria-hidden data-hung>
            <div className={styles.hungDialog}>
              <p className={styles.hungTitle}>Glitch Run (Not Responding)</p>
              <div className="flex items-start gap-3 px-4 py-3">
                <span className={styles.wait} />
                <p>
                  Glitch Run isn&apos;t responding.
                  <br />
                  <span className="opacity-70">(It is. Keep running.)</span>
                </p>
              </div>
              <div className={cn(styles.hungButtons, "flex justify-end gap-2 px-4 pb-3")}>
                <span>Close the program</span>
                <span>Wait</span>
              </div>
            </div>
          </div>
        )}

        <div className={styles.hud}>
          {/* Top left: how far, and the score. */}
          <div className={cn(styles.plate, "absolute left-[2%] top-[3%]")}>
            <p className={cn(styles.big, "tabular-nums")} data-metres={hud.metres}>
              {hud.metres.toLocaleString("en-US")} m
            </p>
            <p className={cn(styles.label, "mt-0.5")}>
              score <span className={cn(styles.value, "tabular-nums")}>{hud.score.toLocaleString("en-US")}</span>
            </p>
          </div>

          {/* Top right: corruption, the multiplier, pause. */}
          <div className="absolute right-[2%] top-[3%] flex items-start gap-[0.6em]">
            <div className={cn(styles.plate, "flex items-center gap-[0.7em]")}>
            <div className="flex flex-col items-end gap-[0.35em]">
              <p className={styles.label} data-corruption={hud.corruption}>
                {hud.panic ? (
                  <span className={cn(styles.panicText, "inline-flex items-center gap-1")}>
                    <PanicIcon /> Kernel panic
                  </span>
                ) : (
                  <>corruption {hud.corruption}%</>
                )}
              </p>
              <div className={styles.meter} role="meter" aria-label="Corruption" aria-valuemin={0} aria-valuemax={100} aria-valuenow={hud.corruption}>
                <div className={styles.meterFill} style={{ width: `${hud.corruption}%` }} />
              </div>
            </div>
            <p className={cn(styles.big, "tabular-nums", hud.multiplier >= 4 ? "text-[#FF2E88]" : hud.multiplier >= 2.5 ? "text-[#FFC857]" : "text-[#00F5D4]")} aria-label={`Score multiplier ${hud.multiplier}`}>
              ×{hud.multiplier.toFixed(1)}
            </p>
            </div>
            <button type="button" className={styles.hudButton} onClick={openMenu} aria-label="Pause (Esc)" title="Pause (Esc)">
              <Pause className="size-[45%]" fill="currentColor" aria-hidden />
            </button>
          </div>

          {/* Top centre: the glitch that's coming (and its tell), and the ones that are on. */}
          <div className="absolute inset-x-[25%] top-[3.5%] flex flex-col items-center text-center">
            {warning ? (
              <div className="flex flex-col items-center" data-warning={warning} key={warning}>
                <p className={styles.warning}>
                  <GlitchIcon kind={warning} size="1.25em" />
                  {GLITCHES[warning].name}
                </p>
                <p className={styles.tell}>{GLITCHES[warning].tell}</p>
              </div>
            ) : null}
            {hud.active.length > 0 && (
              <p className="mt-[0.4em] flex flex-wrap justify-center gap-[0.4em]" data-active={hud.active.join(" ")}>
                {hud.active.map((kind) => (
                  <span key={kind} className={styles.chip}>
                    <GlitchIcon kind={kind} size="1.1em" />
                    {GLITCHES[kind].name}
                  </span>
                ))}
              </p>
            )}
          </div>

          {showHint && (
            <p className="absolute inset-x-[8%] top-[38%] flex justify-center" data-hint>
              <span className={styles.hint}>{coarse ? hint.touch : hint.keys}</span>
            </p>
          )}

          {/* Bottom left: glitch charges, and the bits toward the next. */}
          <div className={cn(styles.plate, "absolute bottom-[calc(var(--gr-scale,2)*21px)] left-[2%] flex items-center gap-[0.5em]")} aria-label={`${hud.charges} of ${MAX_CHARGES} glitch charges, ${Math.min(hud.bits, BITS_PER_CHARGE)} of ${BITS_PER_CHARGE} bits to the next`} data-charges={hud.charges}>
            <span className="flex text-[1.5em]">
              {Array.from({ length: MAX_CHARGES }, (_, i) => (
                <Bolt key={i} on={i < hud.charges} className={styles.bolt} />
              ))}
            </span>
            <span className={styles.bits} aria-hidden>
              {Array.from({ length: BITS_PER_CHARGE }, (_, i) => (
                <span key={i} data-on={i < hud.bits ? "" : undefined} />
              ))}
            </span>
          </div>

          {/* Bottom right: the controls, as they are right now (Input Swap flips them). */}
          {!coarse && (
            <p key={hud.swap ? "swapped" : "normal"} className={cn(styles.controls, styles.plate, "absolute bottom-[calc(var(--gr-scale,2)*21px)] right-[2%] flex items-center gap-[0.7em] font-bold")} data-swap={hud.swap ? "" : undefined} data-controls>
              <span className="inline-flex items-center gap-[0.35em]">
                <span className={styles.keycap}>{keyLabel(keys("jump")[0]!)}</span>
                {hud.swap ? "slide" : "jump"}
              </span>
              <span className="inline-flex items-center gap-[0.35em]">
                <span className={styles.keycap}>{keyLabel(keys("slide")[0]!)}</span>
                {hud.swap ? "jump" : "slide"}
              </span>
              <span className="inline-flex items-center gap-[0.35em]">
                <span className={styles.keycap}>{keyLabel(keys("glitch")[0]!)}</span>
                clip
              </span>
            </p>
          )}
          {coarse && (
            <>
              <p className={styles.touchLabel} style={{ left: "2%", bottom: "calc(var(--gr-scale,2) * 21px + max(30px, var(--gr-scale,2) * 14px))" }} data-swap={hud.swap ? "" : undefined}>
                {rightJumps ? "◀ slide" : "◀ jump"}
              </p>
              <p className={styles.touchLabel} style={{ right: "2%", bottom: "calc(var(--gr-scale,2) * 21px)" }} data-swap={hud.swap ? "" : undefined}>
                {rightJumps ? "jump ▶" : "slide ▶"}
              </p>
            </>
          )}

          {save.prefs.beatBar && <canvas ref={beatBar} className={styles.beatbar} aria-hidden data-beatbar />}
        </div>

        {coarse && (
          <div
            className={styles.glitchButton}
            style={{ pointerEvents: end || menu ? "none" : "auto" }}
            role="button"
            aria-label="Glitch (Clip)"
            data-off={hud.charges === 0 ? "" : undefined}
            data-held={glitchHeld ? "" : undefined}
            onPointerDown={(event) => {
              event.stopPropagation();
              event.currentTarget.setPointerCapture(event.pointerId);
              setGlitchHeld(true);
              runtime.current?.press("glitch");
            }}
            onPointerUp={() => {
              setGlitchHeld(false);
              runtime.current?.release("glitch");
            }}
            onPointerCancel={() => {
              setGlitchHeld(false);
              runtime.current?.release("glitch");
            }}
          >
            <Bolt size={30} />
          </div>
        )}

        {!mode && (
          <p className="absolute inset-0 grid place-items-center text-[max(12px,calc(var(--gr-scale,2)*7px))] text-[#9AA1B5]" role="status">
            {source ? `loading ${fileName(source.id)}…` : "allocating memory…"}
          </p>
        )}

        <p className="sr-only" aria-live="polite" data-message>
          {hud.message}
        </p>

        {end && source && end.result.won && <ClearedCard stageId={source.id} end={end} onNext={onNext} onReplay={retry} onFiles={onFiles} />}
        {end && !end.result.won && <PatchedCard target={target} stageId={stageId} end={end} daily={daily} onRetry={retry} onFiles={onFiles} />}
      </div>

      {coarse && portrait && !hideRotate && (
        <div className="absolute inset-x-3 top-16 z-[5] flex items-center gap-3 rounded-xl border border-[#2A2C48] bg-[#10102A]/95 p-3 text-sm font-semibold" role="status">
          <RotateCw className="size-5 shrink-0 text-[#00F5D4]" aria-hidden />
          <span className="flex-1">Turn your phone sideways for a bigger screen.</span>
          <button type="button" className="grid size-9 place-items-center" onClick={() => setHideRotate(true)} aria-label="Dismiss">
            <X className="size-5" aria-hidden />
          </button>
        </div>
      )}

      <Dialog
        open={menu === "pause"}
        onOpenChange={(open) => {
          if (!open) closeMenu();
        }}
        game="glitch-run"
        eyebrow={source ? `${fileName(source.id)} · ${source.name}` : target.kind === "daily" ? "Daily Corruption" : "Endless"}
        title="Paused"
        description="The Debugger is waiting too. (It's very patient.)"
      >
        <div className="grid gap-3">
          <button type="button" className="btn btn-lg" onClick={closeMenu} data-sound="click">
            <PlayIcon className="size-5" aria-hidden /> Resume
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setMenu(null);
              runtime.current?.resume();
              retry();
            }}
            data-sound="click"
          >
            <RotateCcw className="size-4" aria-hidden /> {target.kind === "stage" ? "Restart the stage" : "Start a new run"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setMenu("options")} data-sound="click">
            <Settings2 className="size-4" aria-hidden /> Options
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setMenu(null);
              onFiles();
            }}
            data-sound="click"
          >
            <FolderOpen className="size-4" aria-hidden /> Back to the files
          </button>
        </div>
      </Dialog>
      <Dialog
        open={menu === "options"}
        onOpenChange={(open) => {
          if (!open) setMenu("pause");
        }}
        game="glitch-run"
        eyebrow="Glitch Run"
        title="Options"
        description="Saved on this device. Changes apply straight away."
      >
        <OptionsPanel />
      </Dialog>
    </div>
  );
}

/** The halves of the screen are the buttons (jump on the right, unless they're swapped). */
function TouchZones({ runtime, jumpRight, disabled }: { runtime: { current: Runtime | null }; jumpRight: boolean; disabled: boolean }) {
  const held = useRef(new Map<number, Action>());
  const down = (event: ReactPointerEvent<HTMLDivElement>, action: Action) => {
    if (disabled) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    held.current.set(event.pointerId, action);
    runtime.current?.press(action);
  };
  const up = (event: ReactPointerEvent<HTMLDivElement>) => {
    const action = held.current.get(event.pointerId);
    if (!action) return;
    held.current.delete(event.pointerId);
    runtime.current?.release(action);
  };
  const left: Action = jumpRight ? "slide" : "jump";
  const right: Action = jumpRight ? "jump" : "slide";
  return (
    <>
      <div className={styles.touchZone} style={{ left: 0, width: "50%" }} onPointerDown={(event) => down(event, left)} onPointerUp={up} onPointerCancel={up} role="button" aria-label={left === "jump" ? "Jump" : "Slide"} />
      <div className={styles.touchZone} style={{ right: 0, width: "50%" }} onPointerDown={(event) => down(event, right)} onPointerUp={up} onPointerCancel={up} role="button" aria-label={right === "jump" ? "Jump" : "Slide"} />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.stat}>
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#9AA1B5]">{label}</p>
      <p className="mt-0.5 text-lg font-extrabold tabular-nums">{value}</p>
    </div>
  );
}

/** The gamepad on an end card: A goes on, Y (or Start) retries. */
function useCardPad(primary: () => void, retry: () => void) {
  useGamepadButtons({ 0: primary, 3: retry, 9: retry });
}

function PatchedCard({
  target,
  stageId,
  end,
  daily,
  onRetry,
  onFiles,
}: {
  target: PlayTarget;
  stageId: string | null;
  end: Recorded & { result: RunResult };
  daily: Daily | null;
  onRetry: () => void;
  onFiles: () => void;
}) {
  const [shared, setShared] = useState(false);
  const r = end.result;
  useCardPad(onRetry, onRetry);
  const stage = stageId ? getStage(stageId) : null;
  // Metres are tiles: how much of the way to the exit.
  const through = stage ? Math.min(99, Math.floor((r.metres * 100) / (stage.config.finishCol ?? 1))) : null;
  const share = async () => {
    const outcome = await shareResult(shareText(r, daily));
    if (outcome === "copied") {
      setShared(true);
      toast({ kind: "success", title: "Copied", description: "Paste it anywhere you like." });
    } else if (outcome === "failed") toast({ kind: "info", title: "Couldn't copy", description: "Your browser wouldn't let the game copy it." });
    else setShared(true);
  };
  return (
    <div className={styles.endCard} style={{ pointerEvents: "auto" }} role="group" aria-labelledby="gr-patched" data-end="patched">
      <div className={cn(styles.panel, "w-[min(94%,27rem)] p-5 text-center sm:p-6")}>
        <p id="gr-patched" className={styles.stamp}>
          Patched
        </p>
        <p className="mt-4 text-sm text-[#9AA1B5]">{r.cause ? CAUSES[r.cause] : ""}</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat label="Distance" value={`${r.metres.toLocaleString("en-US")} m`} />
          <Stat label="Score" value={r.score.toLocaleString("en-US")} />
          <Stat label={target.kind === "daily" ? "Today's best" : "Best"} value={end.best ? end.best.toLocaleString("en-US") : "—"} />
        </div>
        {through !== null && <p className="mt-3 text-sm font-semibold">{through}% of the way through.</p>}
        {end.newBest && <p className="mt-3 text-sm font-extrabold uppercase tracking-[0.14em] text-[#FFC857]">New best!</p>}
        <div className="mt-5 grid gap-2">
          <button type="button" className={styles.go} onClick={onRetry} autoFocus data-retry>
            <RotateCcw className="size-5" aria-hidden /> Retry
          </button>
          <div className={cn("grid gap-2", target.kind !== "stage" && "grid-cols-2")}>
            {target.kind !== "stage" && (
              <button type="button" className={styles.quiet} onClick={share}>
                {shared ? <Check className="size-4" aria-hidden /> : <Share2 className="size-4" aria-hidden />} Share
              </button>
            )}
            <button type="button" className={styles.quiet} onClick={onFiles}>
              <FolderOpen className="size-4" aria-hidden /> Files
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs text-[#9AA1B5]">Space or R to retry · Esc for the files</p>
      </div>
    </div>
  );
}

function ClearedCard({ stageId, end, onNext, onReplay, onFiles }: { stageId: string; end: Recorded & { result: RunResult }; onNext: () => void; onReplay: () => void; onFiles: () => void }) {
  const r = end.result;
  const source = stageSource(stageId);
  const last = stageId === FINAL_STAGE;
  useCardPad(onNext, onReplay);
  return (
    <div className={styles.endCard} style={{ pointerEvents: "auto" }} role="group" aria-labelledby="gr-cleared" data-end="cleared">
      <div className={cn(styles.panel, "w-[min(94%,27rem)] p-5 text-center sm:p-6")}>
        <p id="gr-cleared" className={styles.stamp} data-tone="win">
          Cleared
        </p>
        <p className="mt-4 font-bold">
          {fileName(stageId)} <span className="text-[#9AA1B5]">· {source.name}</span>
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat label="Score" value={r.score.toLocaleString("en-US")} />
          <Stat label="Best" value={end.best.toLocaleString("en-US")} />
          <Stat label="Clips" value={String(r.clips)} />
        </div>
        {end.newBest && <p className="mt-3 text-sm font-extrabold uppercase tracking-[0.14em] text-[#FFC857]">New best!</p>}
        {!r.glitched && <p className="mt-3 text-sm font-bold text-[#7CFF6B]">Clean Code: no glitch power used.</p>}
        <div className="mt-5 grid gap-2">
          <button type="button" className={styles.go} onClick={onNext} autoFocus data-next>
            {last ? "Onward" : <>Next: {fileName(String(Number(stageId) + 1).padStart(2, "0"))}</>} <SkipForward className="size-5" aria-hidden />
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className={styles.quiet} onClick={onReplay}>
              <RotateCcw className="size-4" aria-hidden /> Replay
            </button>
            <button type="button" className={styles.quiet} onClick={onFiles}>
              <FolderOpen className="size-4" aria-hidden /> Files
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
