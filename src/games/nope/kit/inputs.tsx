"use client";

// Typed answers. On phones these bring up the on-screen keyboard (Plan/02-nope.md §2).
import { Minus, Plus } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import styles from "../nope.module.css";
import { AnswerButton } from "./ui";

const FIELD =
  "h-14 min-w-0 rounded-2xl border-[3px] border-[#161414] bg-white px-4 text-2xl text-[#161414] shadow-[inset_0_3px_0_0_#00000014] placeholder:text-[#9B9483] focus-visible:outline-[3px] focus-visible:outline-offset-2";

/** A text box and an Answer button. Empty answers don't count. */
export function TypeAnswer({
  check,
  onCorrect,
  onWrong,
  label = "Your answer",
  placeholder = "Type your answer",
  inputMode = "text",
  maxLength = 40,
  className,
}: {
  check: (text: string) => boolean;
  onCorrect: (text: string) => void;
  onWrong: (text: string) => void;
  label?: string;
  placeholder?: string;
  inputMode?: "text" | "numeric";
  maxLength?: number;
  className?: string;
}) {
  const id = useId();
  const [value, setValue] = useState("");
  const [shaking, setShaking] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = value.trim();
    if (!text) {
      // Restart the shake without re-mounting the field (keeps the keyboard up on phones).
      setShaking(false);
      requestAnimationFrame(() => setShaking(true));
      return;
    }
    if (check(text)) onCorrect(text);
    else onWrong(text);
  };

  return (
    <form onSubmit={submit} className={cn("mx-auto mt-6 flex w-full max-w-md flex-col gap-3 sm:flex-row", className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        enterKeyHint="done"
        onAnimationEnd={() => setShaking(false)}
        className={cn(FIELD, styles.show, "w-full sm:w-auto sm:flex-1", shaking && "animate-shake")}
      />
      <AnswerButton type="submit" tone="red" size="sm" className="h-14 px-7">
        Answer
      </AnswerButton>
    </form>
  );
}

/** A number with − and + buttons (easier than typing on a phone). */
export function NumberAnswer({
  onSubmit,
  min = 0,
  max = 99,
  label = "Your answer",
  className,
}: {
  onSubmit: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  className?: string;
}) {
  const id = useId();
  const [text, setText] = useState("0");
  const value = Math.min(max, Math.max(min, Number.parseInt(text, 10) || 0));
  const set = (next: number) => setText(String(Math.min(max, Math.max(min, next))));

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(value);
      }}
      className={cn("mx-auto mt-6 flex w-full max-w-md flex-wrap items-center justify-center gap-3", className)}
    >
      <div className="flex items-center gap-2">
        <AnswerButton tone="ink" size="sm" className="size-14 px-0" onClick={() => set(value - 1)} aria-label="One less">
          <Minus className="size-6" strokeWidth={3} aria-hidden />
        </AnswerButton>
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <input
          id={id}
          value={text}
          onChange={(event) => setText(event.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
          onFocus={(event) => event.target.select()}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          enterKeyHint="done"
          className={cn(FIELD, styles.show, "w-24 text-center text-3xl tabular-nums")}
        />
        <AnswerButton tone="ink" size="sm" className="size-14 px-0" onClick={() => set(value + 1)} aria-label="One more">
          <Plus className="size-6" strokeWidth={3} aria-hidden />
        </AnswerButton>
      </div>
      <AnswerButton type="submit" tone="red" size="sm" className="h-14 px-7">
        Answer
      </AnswerButton>
    </form>
  );
}
