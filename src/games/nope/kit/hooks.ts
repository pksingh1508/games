"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { usePlay } from "../play/context";
import { sfx } from "../sfx";

/** "  Lime-Green! " → "lime green". Answers are compared in this form. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Keys that never count as "pressing a key" (they move focus, pause, or are modifiers). */
const IGNORED_KEYS = new Set([
  "Tab",
  "Escape",
  "Shift",
  "Control",
  "Alt",
  "AltGraph",
  "Meta",
  "CapsLock",
  "Fn",
  "FnLock",
  "OS",
  "Hyper",
  "Super",
  "Unidentified",
  "Dead",
]);

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
}

/** Any real key press while the question is on screen (not while paused or typing). */
export function useAnyKey(onKey: (event: KeyboardEvent) => void, enabled = true) {
  const { paused } = usePlay();
  const handle = useEffectEvent(onKey);
  useEffect(() => {
    if (!enabled || paused) return;
    const listener = (event: KeyboardEvent) => {
      if (event.repeat || IGNORED_KEYS.has(event.key) || isTypingTarget(event.target)) return;
      handle(event);
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [enabled, paused]);
}

/** Things that must be clicked in a set order. */
export function useSequence<T extends string>(order: readonly T[], { onDone, onWrong }: { onDone: () => void; onWrong: (pressed: T) => void }) {
  const [step, setStep] = useState(0);
  const press = (id: T) => {
    if (order[step] === id) {
      const next = step + 1;
      setStep(next);
      if (next === order.length) onDone();
      else sfx.pop();
      return;
    }
    // Pressing something you already got right again is harmless.
    if (order.slice(0, step).includes(id)) return;
    onWrong(id);
  };
  return { step, press, done: (id: T) => order.indexOf(id) > -1 && order.indexOf(id) < step };
}
