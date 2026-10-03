"use client";

// The play screen (Plan/09-one-tap-chaos.md §8.3): the canvas, and over it the HUD: lives and
// score up top, the instruction, the beat dots at the bottom, and the overlays between rounds.
// The whole screen is the tap area, except the pause button.
import { Pause, Play as PlayIcon, RotateCcw, Timer, X } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { cn } from "@/lib/cn";
import type { Planner } from "../core/practice";
import { initialHud, Session, type HudState, type RoundReport, type RunSummary, type SessionMode, type SessionSettings } from "../core/session";
import { Store } from "../core/store";
import { BOSSES } from "../microgames";
import { RULES, type RuleId } from "../rules";
import styles from "../otc.module.css";
import { Bulb, CrownMark, MicrogameIcon, RuleIcon } from "./icons";
import { Metro, MetroBubble } from "./Metro";

const WIN_QUIPS = ["Nice.", "Lucky.", "Smooth.", "Not bad.", "Ooh, fancy.", "Again!", "Hm. Fine."];
const LOSE_QUIPS = ["Hah!", "Read it!", "Tsk tsk.", "Thumbs, huh?", "Called it.", "Whoops!", "So close. Not really."];

export interface PlayProps {
  mode: SessionMode;
  planner: Planner;
  settings: SessionSettings;
  captions: boolean;
  onRoundResult?(report: RoundReport): void;
  onCard?(rule: RuleId, isNew: boolean): void;
  onGameOver(summary: RunSummary): void;
  onQuit(): void;
  onRestart(): void;
}

export function PlayScreen({ mode, planner, settings, captions, onRoundResult, onCard, onGameOver, onQuit, onRestart }: PlayProps) {
  const area = useRef<HTMLDivElement | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const stage = useRef<HTMLDivElement | null>(null);
  const session = useRef<Session | null>(null);
  const [store] = useState(() => new Store<HudState>(initialHud(mode)));
  const hud = useSyncExternalStore(store.subscribe, store.get, store.get);
  const [paused, setPaused] = useState(false);

  const roundResult = useEffectEvent((report: RoundReport) => onRoundResult?.(report));
  const card = useEffectEvent((rule: RuleId, isNew: boolean) => onCard?.(rule, isNew));
  const gameOver = useEffectEvent((summary: RunSummary) => onGameOver(summary));
  const initialSettings = useEffectEvent(() => settings);

  useEffect(() => {
    if (!area.current || !canvas.current || !stage.current) return;
    const created = new Session(canvas.current, stage.current, area.current, planner, mode, initialSettings(), store, {
      onRoundResult: (report) => roundResult(report),
      onCard: (rule, isNew) => card(rule, isNew),
      onGameOver: (summary) => gameOver(summary),
      onPauseChange: (value) => setPaused(value),
    });
    session.current = created;
    created.start();
    area.current.focus({ preventScroll: true });
    return () => {
      created.destroy();
      session.current = null;
    };
  }, [planner, mode, store]);

  useEffect(() => {
    session.current?.setSettings(settings);
  }, [settings]);

  // The demo ends on any tap or key.
  const quitDemo = useEffectEvent(() => onQuit());
  useEffect(() => {
    if (mode !== "demo") return;
    const stop = (event: KeyboardEvent) => {
      if (event.code === "Escape" || event.code === "Space" || event.code === "Enter") quitDemo();
    };
    window.addEventListener("keydown", stop);
    return () => window.removeEventListener("keydown", stop);
  }, [mode]);

  const resume = () => session.current?.resume();

  return (
    <div
      ref={area}
      tabIndex={-1}
      className={styles.area}
      aria-label="One Tap Chaos. Tap anywhere, or press Space."
      onPointerDown={mode === "demo" ? () => onQuit() : undefined}
    >
      <canvas ref={canvas} className={styles.canvas} aria-hidden />
      <div className="pointer-events-none absolute inset-0 flex flex-col">
        <TopBar hud={hud} onPause={() => session.current?.pause()} demo={mode === "demo"} />
        <div className="relative flex h-[clamp(5.5rem,15vh,8.5rem)] shrink-0 items-center justify-center px-3">
          <InstructionPill hud={hud} captions={captions} />
        </div>
        <div ref={stage} className="relative min-h-0 flex-1" />
        <BeatDots hud={hud} />
      </div>
      <Overlays hud={hud} />
      {/* Screen readers hear each new instruction. */}
      <p className="sr-only" aria-live="assertive" data-instruction>
        {hud.phase === "game" && hud.instruction && !hud.instruction.silent ? hud.instruction.text : ""}
      </p>

      <Dialog
        open={paused}
        onOpenChange={(open) => {
          if (!open) resume();
        }}
        game="one-tap-chaos"
        eyebrow="One Tap Chaos"
        title="Paused"
        description="The music clock stops while you're away. Resuming counts you back in."
      >
        <div className="grid gap-3">
          <button type="button" className="btn btn-lg" onClick={resume} data-sound="click">
            <PlayIcon className="size-5" aria-hidden /> Resume
          </button>
          {mode !== "demo" && (
            <button type="button" className="btn btn-secondary" onClick={onRestart} data-sound="click">
              <RotateCcw className="size-4" aria-hidden /> Start over
            </button>
          )}
          <button type="button" className="btn btn-secondary" onClick={onQuit} data-sound="click">
            <X className="size-4" aria-hidden /> Quit to the menu
          </button>
        </div>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Top bar: lives, score, the active Chaos Cards, pause.
// ---------------------------------------------------------------------------------------------

function TopBar({ hud, onPause, demo }: { hud: HudState; onPause: () => void; demo: boolean }) {
  return (
    <div className="flex h-14 shrink-0 items-center gap-2 px-3 sm:h-16 sm:gap-4 sm:px-5">
      {hud.practice ? (
        <p role="img" className={cn(styles.show, "flex items-center gap-3 text-lg text-[#1B1B1B]")} aria-label={`Practice: ${hud.practice.wins} won, ${hud.practice.losses} lost`}>
          <span className="rounded-full bg-[#2FBF71] px-3 py-0.5 text-white">✓ {hud.practice.wins}</span>
          <span className="rounded-full bg-[#1B1B1B] px-3 py-0.5 text-white">✖ {hud.practice.losses}</span>
        </p>
      ) : (
        <div className="flex items-center" role="img" aria-label={`Lives: ${hud.lives} of 4`}>
          {Array.from({ length: 4 }, (_, i) => (
            <Bulb key={i} lit={i < hud.lives} className={cn("h-9 w-7 sm:h-11 sm:w-8", i === hud.lives && styles.bulbSmash)} />
          ))}
        </div>
      )}

      <div className="mx-auto flex flex-col items-center leading-none" aria-live="off">
        {demo ? (
          <span className={cn(styles.show, "rounded-full bg-[#1B1B1B] px-3 py-1 text-sm text-[#FFD23F] sm:text-base")}>DEMO · tap to stop</span>
        ) : (
          <>
            <span className="flex flex-col items-center rounded-2xl border-[3px] border-[#1B1B1B] bg-white/90 px-3 pb-1 pt-0.5 shadow-[0_3px_0_#1B1B1B]">
              <span className={cn(styles.show, "text-2xl leading-none text-[#1B1B1B] tabular-nums sm:text-3xl")} aria-label={`Score ${hud.score}`}>
                {hud.score}
              </span>
              <span className="font-mono text-[0.6rem] font-bold uppercase tracking-widest text-[#544924]">
                Round {hud.index} · {hud.bpm} bpm
              </span>
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {hud.rules.map((rule) => (
          <RuleBadge key={rule} rule={rule} />
        ))}
        <button
          type="button"
          data-no-tap
          onClick={onPause}
          className="pointer-events-auto ml-1 grid size-11 shrink-0 place-items-center rounded-xl border-[3px] border-[#1B1B1B] bg-white text-[#1B1B1B] shadow-[0_3px_0_#1B1B1B] hover:bg-[#FFF3B0]"
          aria-label="Pause"
          title="Pause (Esc)"
        >
          <Pause className="size-5" fill="currentColor" strokeWidth={2.6} />
        </button>
      </div>
    </div>
  );
}

export function RuleBadge({ rule, large = false }: { rule: RuleId; large?: boolean }) {
  const red = rule === "redMeansNo";
  return (
    <span
      title={RULES[rule].name}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border-[3px] border-[#1B1B1B] font-mono font-bold uppercase leading-none tracking-wide shadow-[0_2px_0_#1B1B1B]",
        large ? "px-3 py-1.5 text-sm" : "px-1.5 py-1 text-[0.6rem] sm:px-2 sm:text-[0.65rem]",
        red ? `${styles.pillRed} text-white` : "bg-white text-[#1B1B1B]",
      )}
    >
      <RuleIcon rule={rule} className={large ? "size-5" : "size-3.5 sm:size-4"} />
      <span className={large ? "" : "hidden md:inline"}>{RULES[rule].short}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------------------------
// The instruction.
// ---------------------------------------------------------------------------------------------

function InstructionPill({ hud, captions }: { hud: HudState; captions: boolean }) {
  const ins = hud.instruction;
  if (!ins || (hud.phase !== "game" && hud.phase !== "countin")) return null;
  const silent = ins.silent && !ins.boss;
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        key={`${hud.index}-${ins.text}`}
        className={cn(
          styles.pill,
          ins.red && styles.pillRed,
          ins.boss && !ins.red && styles.pillBoss,
          hud.mirror && styles.mirrored,
          hud.dark && styles.dim,
        )}
      >
        {ins.red && <X className="size-[0.8em] shrink-0" strokeWidth={4} aria-label="Red" />}
        {ins.crown !== null && (
          <span className={cn(styles.crownSlot, !ins.crown && styles.crownEmpty)} aria-label={ins.crown ? "With the crown" : "No crown"}>
            {ins.crown && <CrownMark className="size-full drop-shadow-[0_2px_0_#1B1B1B]" />}
          </span>
        )}
        {silent ? <MicrogameIcon id={ins.game} className="size-[1.25em]" /> : <span>{ins.text}</span>}
      </div>
      {silent && captions && (
        <p className="rounded-full bg-[#1B1B1B] px-3 py-0.5 font-mono text-xs font-bold uppercase tracking-wider text-white">
          🔊 {ins.caption}
        </p>
      )}
      {ins.rule && (
        <p className={cn(styles.show, styles.slideIn, "rounded-full border-[3px] border-[#1B1B1B] bg-[#FFB703] px-3 text-base text-[#1B1B1B] sm:text-lg")}>
          {ins.rule}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Beat dots: one per beat, filling up (Plan §8.3).
// ---------------------------------------------------------------------------------------------

function BeatDots({ hud }: { hud: HudState }) {
  const count = Math.min(hud.beats, 16);
  return (
    <div className="relative flex h-14 shrink-0 items-center justify-center sm:h-16" aria-hidden>
      <div className="flex items-center gap-1.5 rounded-full border-[3px] border-[#1B1B1B] bg-white/85 px-3 py-1.5 sm:gap-2.5">
      {Array.from({ length: count }, (_, i) => {
        const done = i < hud.beat || (i === hud.beat && hud.phase !== "countin");
        return (
          <span
            key={`${hud.phase}-${hud.index}-${i}-${i === hud.beat ? hud.beat : ""}`}
            className={cn(
              "rounded-full border-[3px] border-[#1B1B1B]",
              count > 8 ? "size-3 sm:size-3.5" : "size-3.5 sm:size-4",
              done ? "bg-[#1B1B1B]" : "bg-white",
              i === hud.beat && styles.dotNow,
            )}
          />
        );
      })}
      </div>
      {hud.inFlight > 0 && (
        <span className="absolute right-3 flex items-center gap-1 rounded-full border-[3px] border-[#1B1B1B] bg-white px-2 py-0.5 font-mono text-xs font-bold">
          <Timer className="size-3.5" aria-hidden /> +½
        </span>
      )}
      {hud.half && (
        <span className="absolute left-3 rounded-full border-[3px] border-[#1B1B1B] bg-white px-2 py-0.5 font-mono text-xs font-bold">1 / 2</span>
      )}
      {hud.presses > 0 && <span key={hud.presses} className={cn("absolute left-1/2 top-1/2 -ml-8 -mt-8 size-16 rounded-full border-4 border-white opacity-0", styles.ripple)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Between rounds: the count-in, results, Chaos Cards, bosses.
// ---------------------------------------------------------------------------------------------

function Overlays({ hud }: { hud: HudState }) {
  if (hud.paused) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-14 top-[calc(3.5rem+clamp(5.5rem,15vh,8.5rem))] grid place-items-center px-4 sm:bottom-16">
      {hud.phase === "countin" && hud.count !== null && (
        <p key={`${hud.index}-${hud.count}`} className={styles.bigCount}>
          {hud.count === 0 ? "GO!" : hud.count}
        </p>
      )}
      {hud.phase === "break" && <BreakCard hud={hud} />}
      {hud.phase === "card" && hud.card && <ChaosCardReveal rule={hud.card.rule} isNew={hud.card.isNew} also={hud.rules.filter((r) => r !== hud.card!.rule)} />}
      {hud.phase === "boss" && hud.boss && <BossIntro boss={hud.boss} />}
    </div>
  );
}

function BreakCard({ hud }: { hud: HudState }) {
  const result = hud.result;
  const quip = (() => {
    if (!result) return "…";
    if (result.trap) return result.won ? "You resisted!" : result.red ? "It was RED!" : "No crown, no tap!";
    const list = result.won ? WIN_QUIPS : LOSE_QUIPS;
    return list[hud.index % list.length]!;
  })();
  return (
    <div className="flex flex-col items-center gap-3">
      {hud.speedUp && <p className={cn(styles.show, styles.slideIn, "rounded-xl bg-[#1B1B1B] px-4 py-1 text-2xl text-[#FFD23F] sm:text-3xl")}>SPEED UP!</p>}
      <div className="flex items-end gap-3 sm:gap-5">
        <Metro mood={!result ? "smug" : result.won ? "shock" : "happy"} bpm={hud.bpm} className="h-32 w-24 sm:h-44 sm:w-32" />
        {result && (
          <div key={hud.index} className={cn(styles.slideIn, "flex flex-col items-center gap-2")}>
            <span
              className={cn(
                styles.show,
                "grid size-20 place-items-center rounded-full border-4 border-white text-5xl text-white shadow-[0_6px_0_#1B1B1B] sm:size-24 sm:text-6xl",
                result.won ? "bg-[#2FBF71]" : "bg-[#1B1B1B]",
              )}
              aria-label={result.won ? "Cleared" : "Failed"}
            >
              {result.won ? "✓" : "✖"}
            </span>
            <span className={cn(styles.show, "text-2xl text-[#1B1B1B]")}>{result.won ? `+${result.points}` : result.lifeLost ? "−1 bulb" : "miss"}</span>
          </div>
        )}
      </div>
      <MetroBubble>{quip}</MetroBubble>
    </div>
  );
}

function ChaosCardReveal({ rule, isNew, also }: { rule: RuleId; isNew: boolean; also: RuleId[] }) {
  const info = RULES[rule];
  return (
    <div className={cn(styles.card, "relative w-[min(88vw,24rem)] rounded-[1.75rem] border-4 border-[#1B1B1B] bg-white p-6 text-center text-[#1B1B1B] shadow-[0_10px_0_#1B1B1B]")}>
      {isNew && (
        <span className={cn(styles.show, "absolute -right-3 -top-4 rotate-6 rounded-full bg-[#2B59C3] px-3 py-1 text-sm text-white shadow-[0_3px_0_#1B1B1B]")}>NEW CARD!</span>
      )}
      <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-[#626262]">Chaos card</p>
      <div className={cn("mx-auto mt-3 grid size-20 place-items-center rounded-2xl border-4 border-[#1B1B1B]", rule === "redMeansNo" ? `${styles.pillRed}` : "bg-[#FFD23F]")}>
        <RuleIcon rule={rule} className={cn("size-11", rule === "redMeansNo" ? "text-white" : "text-[#1B1B1B]")} />
      </div>
      <h2 className={cn(styles.show, "mt-3 text-3xl leading-tight")}>{info.name}</h2>
      <p className="mt-2 text-base leading-snug">{info.description}</p>
      {also.length > 0 && (
        <p className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm font-semibold">
          Still on: {also.map((r) => <RuleBadge key={r} rule={r} large />)}
        </p>
      )}
    </div>
  );
}

function BossIntro({ boss }: { boss: keyof typeof BOSSES }) {
  const info = BOSSES[boss];
  return (
    <div className={cn(styles.slideIn, "flex flex-col items-center text-center")}>
      <p className={cn(styles.show, styles.wobble, "rounded-xl bg-[#1B1B1B] px-5 py-1 text-4xl text-[#FFD23F] sm:text-6xl")}>BOSS!</p>
      <div className="mt-4 grid size-24 place-items-center rounded-3xl border-4 border-[#1B1B1B] bg-white shadow-[0_6px_0_#1B1B1B]">
        <MicrogameIcon id={boss} className="size-16" />
      </div>
      <h2 className={cn(styles.show, "mt-3 text-3xl text-[#1B1B1B] sm:text-4xl")}>{info.name}</h2>
      <p className="mt-2 max-w-sm rounded-2xl bg-white/85 px-4 py-2 text-base font-semibold text-[#1B1B1B]">{info.hint}</p>
    </div>
  );
}
