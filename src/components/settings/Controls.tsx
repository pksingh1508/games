"use client";

import { RadioGroup, Slider, Switch } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** One labelled row in the options menu. */
export function SettingRow({
  label,
  description,
  control,
  htmlFor,
}: {
  label: string;
  description?: ReactNode;
  control: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
      <div className="max-w-md">
        <label htmlFor={htmlFor} className="font-display text-lg font-bold">
          {label}
        </label>
        {description && <p className="mt-1 text-sm leading-relaxed text-muted-surface">{description}</p>}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

export function ToggleSwitch({
  id,
  checked,
  onCheckedChange,
  label,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <Switch.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label={label}
      className="relative h-9 w-16 shrink-0 rounded-full bg-surface-2 ring-1 ring-[color-mix(in_oklab,var(--ink)_15%,transparent)] transition-colors data-[state=checked]:bg-accent"
    >
      <Switch.Thumb className="block size-7 translate-x-1 rounded-full bg-ink shadow-md transition-transform duration-200 data-[state=checked]:translate-x-8 data-[state=checked]:bg-on-accent" />
    </Switch.Root>
  );
}

export function VolumeSlider({
  label,
  value,
  onChange,
  onCommit,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  onCommit?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className={cn("flex w-full items-center gap-4 sm:w-72", disabled && "opacity-50")}>
      <Slider.Root
        value={[Math.round(value * 100)]}
        max={100}
        step={1}
        disabled={disabled}
        onValueChange={([v]) => onChange((v ?? 0) / 100)}
        onValueCommit={onCommit}
        className="relative flex h-7 grow touch-none select-none items-center"
      >
        <Slider.Track className="relative h-2.5 grow overflow-hidden rounded-full bg-surface-2 ring-1 ring-[color-mix(in_oklab,var(--ink)_12%,transparent)]">
          <Slider.Range className="absolute h-full rounded-full bg-accent" />
        </Slider.Track>
        <Slider.Thumb
          aria-label={label}
          className="block size-6 rounded-full border-4 border-accent bg-ink shadow-md transition-transform hover:scale-110"
        />
      </Slider.Root>
      <span className="w-11 text-right font-mono text-sm tabular-nums">{Math.round(value * 100)}%</span>
    </div>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <RadioGroup.Root
      value={value}
      onValueChange={(v) => onChange(v as T)}
      aria-label={label}
      className="flex flex-wrap gap-1 rounded-2xl bg-surface-2 p-1 ring-1 ring-[color-mix(in_oklab,var(--ink)_10%,transparent)]"
    >
      {options.map((option) => (
        <RadioGroup.Item
          key={option.value}
          value={option.value}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-muted-surface transition-colors hover:text-ink data-[state=checked]:bg-accent data-[state=checked]:text-on-accent data-[state=checked]:shadow-[0_3px_0_0_var(--accent-deep)]"
        >
          {option.label}
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
