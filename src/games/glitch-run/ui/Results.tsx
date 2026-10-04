"use client";

// The ending (Plan/07-glitch-run.md §5): you reach the Root folder, and The Debugger asks one last
// question. "Fix the bug?" Yes, and the game runs perfectly, without you, very politely. No, and it
// decides to keep you: the credits are glitched in your honour.
import { Check, FolderOpen, Share2, Undo2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "@/components/ui/toast-store";
import { useGamepadButtons } from "@/games/shared/gamepad";
import { shareResult } from "@/games/shared/share";
import { cn } from "@/lib/cn";
import { SITE } from "@/lib/site";
import styles from "../glitch-run.module.css";
import type { GlitchSave } from "../save";
import { DebuggerEye, RunnerFigure } from "./icons";

const CREDITS: Array<[string, string]> = [
  ["The bug", "you"],
  ["The Debugger", "still looking"],
  ["Code", "mostly working"],
  ["Art", "missing_texture.png"],
  ["Music", "one sound chip, overclocked"],
  ["Glitches", "eleven, all on purpose"],
  ["Physics", "never lied once"],
  ["Shadow", "always told the truth"],
  ["Quality assurance", "patched (pending)"],
  ["Special thanks", "everyone who wouldn't be fixed"],
];

export const wontfixShareText = (save: Pick<GlitchSave, "totals">) =>
  `I reached /root in Glitch Run, and when The Debugger asked "Fix the bug?", I said no. Patched ${save.totals.deaths} times on the way.\nWONTFIX ▓▒░ YOU ARE THE BUG ░▒▓\n${SITE.url}/games/glitch-run`;

type Step = "ask" | "patching" | "fixed" | "wontfix";

export function Ending({ save, onChoose, onFiles }: { save: GlitchSave; onChoose: (choice: "fixed" | "wontfix") => void; onFiles: () => void }) {
  const [step, setStep] = useState<Step>("ask");
  const [shared, setShared] = useState(false);
  /** Each step's main button: focused without scrolling the page (each step starts at the top). */
  const main = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    main.current?.focus({ preventScroll: true });
  }, [step]);

  useEffect(() => {
    if (step !== "patching") return;
    const timer = setTimeout(() => setStep("fixed"), 2600);
    return () => clearTimeout(timer);
  }, [step]);

  const choose = (choice: "fixed" | "wontfix") => {
    onChoose(choice);
    setStep(choice === "fixed" ? "patching" : "wontfix");
  };
  useGamepadButtons(step === "ask" ? { 0: () => choose("fixed"), 1: () => choose("wontfix") } : { 0: onFiles, 9: onFiles });

  const share = async () => {
    const outcome = await shareResult(wontfixShareText(save));
    if (outcome === "copied") {
      setShared(true);
      toast({ kind: "success", title: "Copied", description: "Paste it anywhere you like." });
    } else if (outcome === "failed") toast({ kind: "info", title: "Couldn't copy", description: "Your browser wouldn't let the game copy it." });
    else setShared(true);
  };

  if (step === "patching" || step === "fixed") {
    // A clean, bright, perfectly working screen. Nothing glitches. Nothing runs.
    return (
      <section className={cn(styles.root, "grid min-h-[calc(100dvh-4rem)] place-items-center bg-[#F4F6FA] px-4 py-12")} aria-label="The bug is fixed" data-ending="fixed">
        <div className={cn(styles.clean, "w-[min(94vw,34rem)] text-center")}>
          {step === "patching" ? (
            <div role="status">
              <p className="text-xl">Applying patch…</p>
              <div className="mx-auto mt-4 h-3 w-64 overflow-hidden rounded-full bg-[#DDE2EA]">
                <div className={styles.patchBar} />
              </div>
              <p className="mt-3 text-sm text-[#5A6275]">Removing 1 bug.</p>
            </div>
          ) : (
            <>
              <p className="text-sm uppercase tracking-[0.3em] text-[#5A6275]">Glitch Run</p>
              <h1 className="mt-3 text-4xl">1 bug fixed.</h1>
              <p className="mt-4 text-lg leading-relaxed">The game now runs perfectly. Every frame on time, every texture where it should be. There is nobody in it.</p>
              <p className="mt-2 text-[#5A6275]">Thank you for your patience.</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <button ref={main} type="button" className={styles.osButton} onClick={() => setStep("ask")} data-undo>
                  <span className="inline-flex items-center gap-2">
                    <Undo2 className="size-4" aria-hidden /> Wait. Undo that.
                  </span>
                </button>
                <button type="button" className={styles.osButton} onClick={onFiles}>
                  <span className="inline-flex items-center gap-2">
                    <FolderOpen className="size-4" aria-hidden /> Files
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    );
  }

  if (step === "wontfix") {
    return (
      <section className={cn(styles.root, styles.screen, "flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center px-4 py-10 text-center")} aria-label="Wontfix" data-ending="wontfix">
        <div className="relative z-[1] flex w-[min(94vw,36rem)] flex-col items-center">
          <p className={styles.stamp} data-tone="win">
            Wontfix
          </p>
          <p className="mt-5 text-lg font-bold">Closed as: won&apos;t fix. Reason: it&apos;s a feature.</p>
          <p className="mt-2 text-[#9AA1B5]">The game has decided to keep you.</p>
          <div className={cn(styles.creditsWindow, "mt-6 w-full")} aria-label="Credits">
            <div className={styles.credits}>
              <p className={cn(styles.word, styles.jitter, "!text-5xl")} data-text="GLITCH RUN">
                GLITCH RUN
              </p>
              <p className={cn(styles.jitter, "mt-2 text-sm text-[#9AA1B5]")}>a game that&apos;s broken on purpose</p>
              <dl className="mt-8 grid gap-4">
                {CREDITS.map(([role, who]) => (
                  <div key={role} className={styles.jitter}>
                    <dt className="text-xs font-bold uppercase tracking-[0.25em] text-[#FF2E88]">{role}</dt>
                    <dd className={cn(styles.split, "mt-1 text-lg font-bold")}>{who}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-10 flex justify-center">
                <RunnerFigure size={56} />
              </div>
              <p className={cn(styles.jitter, "mt-4 text-sm")}>▓▒░ YOU ARE THE BUG ░▒▓</p>
              <p className="mt-2 text-xs text-[#9AA1B5]">Mind Games Arcade</p>
            </div>
          </div>
          <div className="mt-7 grid w-full gap-3 sm:grid-cols-2">
            <button ref={main} type="button" className={styles.go} onClick={onFiles}>
              <FolderOpen className="size-5" aria-hidden /> Files
            </button>
            <button type="button" className={styles.quiet} onClick={share}>
              {shared ? <Check className="size-4" aria-hidden /> : <Share2 className="size-4" aria-hidden />} Share
            </button>
          </div>
          <p className="mt-4 text-sm text-[#9AA1B5]">
            Patched {save.totals.deaths.toLocaleString("en-US")} times · {save.totals.metres.toLocaleString("en-US")} m run · {save.totals.clips.toLocaleString("en-US")} clips
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={cn(styles.root, styles.screen, "grid min-h-[calc(100dvh-4rem)] place-items-center px-4 py-12")} aria-label="The Root folder" data-ending="ask">
      <div className="relative z-[1] flex flex-col items-center">
        <DebuggerEye size={96} />
        <p className="mt-4 text-sm font-bold uppercase tracking-[0.3em] text-[#FFC857]">/root</p>
        <div className={cn(styles.osDialog, "mt-6")} role="alertdialog" aria-labelledby="gr-ask-title" aria-describedby="gr-ask-text">
          <p className="rounded-t-lg border-b border-[#C8CCD6] bg-[#F7F8FB] px-4 py-2 text-sm font-semibold">The Debugger</p>
          <div className="flex items-start gap-4 px-5 py-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#FFE7A8] text-xl font-bold text-[#7A5600]" aria-hidden>
              !
            </span>
            <div>
              <h1 id="gr-ask-title" className="text-lg font-bold">
                Bug found in /root.
              </h1>
              <p id="gr-ask-text" className="mt-1 text-[#3A3F4F]">
                One unhandled exception, running. It looks like it has been here the whole time.
                <br />
                <strong>Fix the bug?</strong>
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 px-5 pb-4">
            <button ref={main} type="button" className={styles.osButton} onClick={() => choose("fixed")} data-choice="fixed">
              Yes
            </button>
            <button type="button" className={styles.osButton} onClick={() => choose("wontfix")} data-choice="wontfix">
              No
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
