import type { Metadata } from "next";
import { DataManager } from "@/components/data/DataManager";

export const metadata: Metadata = {
  title: "Your data",
  description: "Everything the arcade stores lives on this device. See it, back it up, move it or delete it.",
};

export default function DataPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-14 sm:px-6 lg:pt-20">
      <header className="max-w-3xl">
        <p className="pixel-label text-accent-ink">Memory card</p>
        <h1 className="mt-4 font-display text-5xl font-extrabold leading-[0.92] tracking-tight sm:text-7xl">Your data</h1>
        <p className="mt-5 text-lg text-muted">
          No accounts. No database. No cookies. No analytics. Your progress is stored only in this browser, on this
          device. Nothing is sent anywhere unless you share it.
        </p>
      </header>
      <div className="mt-12">
        <DataManager />
      </div>
    </div>
  );
}
