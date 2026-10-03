import type { Metadata } from "next";
import { SettingsPanel } from "@/components/settings/SettingsPanel";

export const metadata: Metadata = {
  title: "Settings",
  description: "Sound, motion, flashing, jump scares, text size and colour vision. Every game in the arcade follows these.",
};

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 pb-8 pt-14 sm:px-6 lg:pt-20">
      <header>
        <p className="pixel-label text-accent-ink">Options</p>
        <h1 className="mt-4 font-display text-5xl font-extrabold leading-[0.92] tracking-tight sm:text-7xl">Settings</h1>
        <p className="mt-5 max-w-2xl text-lg text-muted">
          Set it once, and every cabinet in the arcade listens. Comfort settings always win, even over the games&apos;
          tricks.
        </p>
      </header>
      <div className="mt-12">
        <SettingsPanel />
      </div>
    </div>
  );
}
