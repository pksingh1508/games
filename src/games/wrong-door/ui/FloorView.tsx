"use client";

// A floor (Plan/13-wrong-door.md §2 "The core loop", §8.2–§8.5): read the plaque, gather clues (signs,
// knocks, light, the candle, footprints, Mr. Hinges), use what you carry, then choose. Doors only open after
// you confirm ("Open door 2?"), with a slow creak; a wrong one brings its consequence and the Truth Reveal.
// Keys: 1–5 look at a door, K knocks, Enter opens, Q asks Mr. Hinges, C opens the codex, Esc pauses.
import { Menu as MenuIcon } from "lucide-react";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { useCoarsePointer } from "@/games/shared/device";
import { cn } from "@/lib/cn";
import { panFor, playBehind, playSwell } from "../audio/behind";
import { knockKnock, loadSfx, playSfx } from "../audio/sfx";
import { answerLine, questionsFor, questionText } from "../logic/doorman";
import { switchTo } from "../logic/monty-hall";
import { scramble } from "../logic/statements";
import type { Consequence, DoorId, Floor, ItemKind, Question, Sound } from "../logic/types";
import { ask, can, canRead as readable, choose, decide, doorAt, flicker, flipCoin, floorOf, knock, peek, pickUp, suffer, toggleChalk, type Choice, type Outcome, type RunState } from "../run/state";
import styles from "../wrong-door.module.css";
import { KeySvg } from "./art";
import { Board } from "./Board";
import { Hall } from "./Hall";
import { TruthReveal } from "./TruthReveal";
import { WrongRoom } from "./WrongRoom";

export type FloorEvent =
  | { type: "enter"; floor: Floor }
  | { type: "knock" }
  | { type: "item"; kind: ItemKind }
  | { type: "double"; lying: boolean }
  | { type: "climb"; floor: Floor; spotted: boolean; switched: boolean; run: RunState }
  | { type: "wrong"; floor: Floor; consequence: Consequence; switched: boolean }
  | { type: "end"; run: RunState };

export interface FloorViewProps {
  run: RunState;
  bigSigns: boolean;
  relaxed: boolean;
  dailyNumber: number | null;
  toast: string | null;
  onRun(run: RunState): void;
  onEvent(event: FloorEvent): void;
  onCodex(): void;
  onOptions(): void;
  onHelp(): void;
  onLeave(): void;
  onGiveUp(): void;
}

const OPEN_MS = 1250;

/** Play time between actions (gaps capped: walking away from the screen doesn't count). */
const clock = { last: 0 };
function sinceLastAction(): number {
  const now = performance.now();
  const gap = clock.last ? Math.min(120_000, now - clock.last) : 0;
  clock.last = now;
  return Math.round(gap);
}

export function FloorView(props: FloorViewProps) {
  const { run, onRun, onEvent } = props;
  const coarse = useCoarsePointer();
  // Rebuilt from the seed (a fraction of a millisecond): the same floor every time for the same run.
  const floor = useMemo(() => floorOf(run), [run]);
  const canRead = readable(run, floor);
  const [selected, setSelected] = useState<DoorId | null>(null);
  const [confirm, setConfirm] = useState<Choice | null>(null);
  const [opening, setOpening] = useState<{ door: DoorId; up: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [heard, setHeard] = useState<{ door: DoorId; sound: Sound } | null>(null);
  const [speech, setSpeech] = useState<string | null>(run.play.answer ? answerLine(run.play.answer.yes, floor.seed) : null);
  const [asking, setAsking] = useState(false);
  const [reveal, setReveal] = useState<{ choice: Choice; consequence: Consequence } | null>(run.pending ? { choice: run.pending.door, consequence: run.pending.consequence } : null);
  const [room, setRoom] = useState(false);
  const [flickering, setFlickering] = useState(false);
  const [menu, setMenu] = useState(false);
  const timers = useRef<number[]>([]);
  const later = (ms: number, f: () => void) => timers.current.push(window.setTimeout(f, ms));
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  /** Save the run, counting the time since the last action (gaps capped: walking away doesn't count). */
  const save = (next: RunState): RunState => {
    const timed = { ...next, elapsedMs: next.elapsedMs + sinceLastAction() };
    onRun(timed);
    return timed;
  };

  const entered = useEffectEvent(() => onEvent({ type: "enter", floor }));
  useEffect(() => {
    sinceLastAction();
    entered();
    void loadSfx();
  }, []);

  const placeOf = (id: DoorId) => (floor.shuffle && run.play.shuffled ? floor.shuffle.indexOf(id) + 1 : id);
  const scrambled = (text: string, door: DoorId) => (run.play.curse === "scrambled" ? scramble(text, floor.seed + door) : text);
  const pan = (id: DoorId) => panFor(placeOf(id), floor.doors.length, floor.mirror);

  // -- Clues ----------------------------------------------------------------------------------------

  const select = (door: DoorId) => {
    setSelected(door);
    playSfx("click");
  };

  const knockOn = (door: DoorId) => {
    if (busy) return;
    const r = knock(run, floor, door);
    if (!r) return;
    save(r.run);
    setSelected(door);
    knockKnock(pan(door));
    playBehind(r.sound, pan(door));
    setHeard({ door, sound: r.sound });
    later(2600, () => setHeard((h) => (h?.door === door ? null : h)));
    onEvent({ type: "knock" });
  };

  const askHim = (q: Question) => {
    setAsking(false);
    const r = ask(run, floor, q);
    if (!r) return;
    save(r.run);
    playSfx("hmm");
    setSpeech(answerLine(r.yes, floor.seed + run.play.visit));
    if (q.type === "wouldSay") onEvent({ type: "double", lying: !!floor.doorman?.lies });
  };

  const coin = (door: DoorId) => {
    const r = flipCoin(run, floor, door);
    if (!r) return;
    save(r.run);
    playSfx("coin");
  };

  const crowbar = (door: DoorId) => {
    const r = peek(run, floor, door);
    if (!r) return;
    save(r.run);
    playSfx("creak", { rate: 1.6, volume: 0.6 });
  };

  const take = () => {
    if (!floor.item || !can(run, floor).pickUp) return;
    save(pickUp(run, floor));
    playSfx("pickup");
    onEvent({ type: "item", kind: floor.item });
  };

  // -- Choosing ------------------------------------------------------------------------------------

  const open = (choice: Choice) => {
    if (busy || run.status !== "play") return;
    if (typeof choice === "number" && floor.shuffle && !run.play.shuffled) {
      // The lights flicker, and the doors move.
      setBusy(true);
      setFlickering(true);
      playSfx("flicker");
      later(450, () => save(flicker(run)));
      later(1250, () => {
        setFlickering(false);
        setBusy(false);
        setSelected(null);
      });
      return;
    }
    setConfirm(choice);
  };

  const settle = (outcome: Outcome, choice: Choice, switched: boolean) => {
    setOpening(null);
    setBusy(false);
    if (outcome.type === "lucky") {
      save(outcome.run);
      setSpeech(`Door ${outcome.opened}? Nothing behind it, I'm afraid.`);
      return;
    }
    if (outcome.type === "up") {
      playSfx("up");
      const next = save(outcome.run);
      onEvent({ type: "climb", floor, spotted: !!floor.anomaly?.changed && choice === "back", switched, run: next });
      if (outcome.escaped) onEvent({ type: "end", run: next });
      return;
    }
    playSfx(outcome.consequence === "downstairs" ? "slam" : outcome.consequence === "wrongRoom" ? "slam" : outcome.consequence === "cursed" ? "curse" : "keyLost");
    save(outcome.run);
    onEvent({ type: "wrong", floor, consequence: outcome.consequence, switched });
    setReveal({ choice: outcome.door, consequence: outcome.consequence });
  };

  const confirmOpen = () => {
    const choice = confirm;
    setConfirm(null);
    if (choice === null) return;
    setBusy(true);
    playSfx("creak");
    playSwell();
    const luckyFirst = floor.lucky && !run.play.lucky;
    if (typeof choice === "number" && !luckyFirst) setOpening({ door: choice, up: choice === floor.exit });
    later(luckyFirst ? 700 : OPEN_MS, () => settle(choose(run, floor, choice), choice, false));
  };

  const decideLucky = (switching: boolean) => {
    const lucky = run.play.lucky;
    if (!lucky || busy) return;
    const final = switching ? switchTo(lucky.picked, lucky.opened) : lucky.picked;
    setBusy(true);
    setSpeech(null);
    playSfx("creak");
    playSwell();
    setOpening({ door: final, up: final === floor.exit });
    later(OPEN_MS, () => settle(decide(run, floor, switching), final, switching));
  };

  const carryOn = () => {
    const r = reveal;
    setReveal(null);
    if (!r) return;
    if (r.consequence === "wrongRoom") {
      setRoom(true);
      return;
    }
    playSfx(r.consequence === "downstairs" ? "tumble" : r.consequence === "cursed" ? "curse" : "keyLost");
    const next = save(suffer(run, r.consequence));
    if (next.status === "out") onEvent({ type: "end", run: next });
  };

  const roomDone = (escaped: boolean) => {
    setRoom(false);
    const next = save(suffer(run, "wrongRoom", { escapedRoom: escaped }));
    if (next.status === "out") onEvent({ type: "end", run: next });
  };

  // -- Keys ----------------------------------------------------------------------------------------

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (document.querySelector("[role=dialog]:not([data-floor-dialog])") || reveal || room) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (confirm !== null) {
      if (e.key === "Escape") setConfirm(null);
      else return;
      e.preventDefault();
      return;
    }
    if (asking) {
      if (e.key === "Escape") setAsking(false);
      return;
    }
    if (e.key === "Escape") {
      setMenu((m) => !m);
      e.preventDefault();
      return;
    }
    if (menu || busy) return;
    const n = Number(e.key);
    if (Number.isInteger(n) && n >= 1 && n <= floor.doors.length) select(doorAt(floor, run, n));
    else if ((e.key === "k" || e.key === "K") && selected) knockOn(selected);
    else if (e.key === "Enter" && selected && !floor.anomaly) open(selected);
    else if ((e.key === "q" || e.key === "Q") && can(run, floor).ask) setAsking(true);
    else if (e.key === "c" || e.key === "C") props.onCodex();
    else return;
    e.preventDefault();
  });
  useEffect(() => {
    const h = (e: KeyboardEvent) => onKey(e);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const lucky = run.play.lucky;
  const modeLabel = run.mode === "story" ? "Story Run" : run.mode === "endless" ? "Endless Hotel" : `Daily Door${props.dailyNumber ? ` #${props.dailyNumber}` : ""}`;
  const confirmText = confirm === "painting" ? "Open the painting?" : confirm === "back" ? "Go back the way you came?" : confirm !== null ? (floor.anomaly ? "Open the door ahead?" : `Open door ${placeOf(confirm)}?`) : "";

  return (
    <div className={cn(styles.root, styles.area)} data-game-area data-floor={run.floor} data-archetype={floor.archetype} data-keys={run.keys} data-status={run.status}>
      <div className={styles.bar}>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold uppercase tracking-widest text-[#c9a227]">{modeLabel} · The Ambiguous Hotel</p>
          <h1 className={cn(styles.display, "text-2xl leading-tight")} data-floor-title>
            Floor {run.floor}
            {floor.lucky && " 🎲"}
          </h1>
        </div>
        <div className="flex items-center gap-1 text-[#c9a227]" aria-label={`${run.keys} ${run.keys === 1 ? "key" : "keys"}`} data-key-count={run.keys}>
          {Array.from({ length: Math.min(run.keys, 6) }, (_, k) => (
            <KeySvg key={k} className="size-6" />
          ))}
          {run.keys > 6 && <span className="font-bold">+{run.keys - 6}</span>}
        </div>
        <button type="button" className={cn(styles.btn, styles.ghost, "!min-h-10 !px-2.5")} onClick={() => setMenu(true)} aria-label="Pause (Esc)" data-menu-button>
          <MenuIcon className="size-5" aria-hidden />
        </button>
      </div>

      <div className={cn(styles.plaque, styles.serif)} data-plaque>
        <p className={cn(styles.display, "text-xs uppercase tracking-[0.2em] opacity-80")}>Floor {run.floor}</p>
        {floor.notes.map((line) => (
          <p key={line} className="text-[1.02rem] font-semibold leading-snug">
            {line}
          </p>
        ))}
      </div>

      <Hall
        floor={floor}
        run={run}
        selected={selected}
        opening={opening}
        heard={heard}
        speech={speech}
        canRead={canRead}
        luckyOpened={lucky?.opened ?? null}
        flickering={flickering}
        scrambled={scrambled}
        onSelect={select}
        onKnock={knockOn}
        onHinges={() => {
          if (can(run, floor).ask) setAsking(true);
          else if (run.play.curse === "silentDoorman") setSpeech("…");
        }}
        onBack={() => open("back")}
        onPainting={() => open("painting")}
        onPickUp={take}
      />

      <Board
        floor={floor}
        run={run}
        canRead={canRead}
        selected={selected}
        busy={busy}
        bigSigns={props.bigSigns}
        coarse={coarse}
        place={placeOf}
        scrambled={scrambled}
        onSelect={select}
        onKnock={knockOn}
        onOpen={open}
        onCoin={coin}
        onCrowbar={crowbar}
        onChalk={(d) => save(toggleChalk(run, floor, d))}
        onAsk={() => setAsking(true)}
        onPickUp={take}
        onCodex={props.onCodex}
        note={props.toast}
      />

      {confirm !== null && (
        <div className={styles.overlay}>
          <section className={cn(styles.card, "text-center")} role="dialog" aria-modal="true" aria-labelledby="wd-confirm" data-floor-dialog data-confirm>
            <h2 id="wd-confirm" className={cn(styles.display, "text-3xl")}>
              {confirmText}
            </h2>
            <p className="mt-1 opacity-75">There&apos;s no taking it back.</p>
            <div className="mt-4 flex justify-center gap-2">
              <button type="button" className={styles.btn} onClick={() => setConfirm(null)} data-cancel>
                Not yet
              </button>
              <button type="button" className={cn(styles.btn, styles.gold)} onClick={confirmOpen} autoFocus data-confirm-open>
                {confirm === "back" ? "Go back" : "Open it"}
              </button>
            </div>
          </section>
        </div>
      )}

      {asking && floor.doorman && (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && setAsking(false)}>
          <section className={styles.card} role="dialog" aria-modal="true" aria-labelledby="wd-ask" data-floor-dialog data-ask-dialog>
            <h2 id="wd-ask" className={cn(styles.display, "text-2xl")}>
              Ask Mr. Hinges
            </h2>
            <p className="mt-1 opacity-75">One question. He answers yes or no.</p>
            <ul className="mt-3 grid gap-1.5">
              {questionsFor(floor.doors.length).map((q) => (
                <li key={questionText(q)}>
                  <button type="button" className={cn(styles.btn, "w-full !justify-start text-left font-semibold")} onClick={() => askHim(q)} data-question={q.type === "hatRed" ? "hat" : `${q.type}:${q.door}`}>
                    {questionText(q)}
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-end">
              <button type="button" className={styles.btn} onClick={() => setAsking(false)}>
                Not now
              </button>
            </div>
          </section>
        </div>
      )}

      {lucky && !busy && !reveal && (
        <div className={cn(styles.overlay, "!items-end !justify-items-center !bg-transparent !backdrop-blur-none pointer-events-none")}>
          <section className={cn(styles.card, "pointer-events-auto mb-2 text-center")} role="dialog" aria-modal="true" aria-labelledby="wd-lucky" data-floor-dialog data-lucky>
            <h2 id="wd-lucky" className={cn(styles.display, "text-2xl")}>
              “Would you like to switch?”
            </h2>
            <p className="mt-1">
              You picked door {lucky.picked}. Mr. Hinges opened door {lucky.opened}: nothing there. He offers you door {switchTo(lucky.picked, lucky.opened)} instead.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button type="button" className={styles.btn} onClick={() => decideLucky(false)} data-stay>
                Stay with door {lucky.picked}
              </button>
              <button type="button" className={cn(styles.btn, styles.gold)} onClick={() => decideLucky(true)} data-switch>
                Switch to door {switchTo(lucky.picked, lucky.opened)}
              </button>
            </div>
          </section>
        </div>
      )}

      {reveal && <TruthReveal floor={floor} play={run.play} choice={reveal.choice} consequence={reveal.consequence} onContinue={carryOn} />}
      {room && <WrongRoom seed={floor.seed + run.play.wrong} relaxed={props.relaxed} onDone={roomDone} />}

      {menu && (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && setMenu(false)}>
          <section className={styles.card} role="dialog" aria-modal="true" aria-labelledby="wd-menu" data-floor-dialog data-menu>
            <h2 id="wd-menu" className={cn(styles.display, "text-3xl")}>
              Paused
            </h2>
            <p className="mt-1 opacity-75">No hurry: nothing here moves until you do. Your run is saved as you go.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button type="button" className={cn(styles.btn, styles.gold)} onClick={() => setMenu(false)} autoFocus data-resume>
                Carry on
              </button>
              <button type="button" className={styles.btn} onClick={props.onCodex}>
                Codex
              </button>
              <button type="button" className={styles.btn} onClick={props.onHelp}>
                How to play
              </button>
              <button type="button" className={styles.btn} onClick={props.onOptions}>
                Options
              </button>
              <button type="button" className={styles.btn} onClick={props.onLeave} data-leave>
                Back to the lobby
              </button>
              <button type="button" className={cn(styles.btn, "!border-[#a3283a] !text-[#a3283a]")} onClick={props.onGiveUp} data-give-up>
                Give up this run
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

