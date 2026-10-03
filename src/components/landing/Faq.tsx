"use client";

import { Plus } from "lucide-react";
import { Accordion } from "radix-ui";
import { playSound } from "@/engine/audio/ui-sound";

const QUESTIONS = [
  {
    q: "Do I need an account?",
    a: "No. There's nothing to sign up for. Open the site and play.",
  },
  {
    q: "Where is my progress saved?",
    a: "In your browser, on this device. Nothing is sent to a server, because there isn't one. You can see everything that's stored on the Your Data page.",
  },
  {
    q: "What happens if I clear my browser data?",
    a: "Your progress goes with it, so export a backup file from Your Data now and then. On iPhone and iPad, installing the arcade to your Home Screen also keeps your saves safer.",
  },
  {
    q: "Can I play offline?",
    a: "Yes. After your first visit the arcade is stored on your device. Install it for the best experience.",
  },
  {
    q: "Isn't a game that lies to you just unfair?",
    a: "It would be, without the tells. Every trick here leaves a clue a sharp player can notice: a shadow that's missing, an eye that glances sideways, a fuse that's green instead of red.",
  },
  {
    q: "Will anything scare me or flash?",
    a: "Some games are spooky, but jump scares are off by default and reduced flashing is one switch away. Every game follows your comfort settings.",
  },
  {
    q: "When can I play the games?",
    a: "They're being built one at a time. Each game's page shows its status, and its cabinet light turns on when it's ready.",
  },
];

export function Faq() {
  return (
    <Accordion.Root
      type="single"
      collapsible
      className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface"
      onValueChange={(value) => playSound(value ? "open" : "close")}
    >
      {QUESTIONS.map((item, i) => (
        <Accordion.Item key={item.q} value={`q${i}`} className="group">
          <Accordion.Header>
            <Accordion.Trigger className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left font-display text-lg font-bold text-ink transition-colors hover:bg-surface-2 sm:px-8">
              <span>{item.q}</span>
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-bg ring-1 ring-line transition-transform duration-300 group-data-[state=open]:rotate-45 group-data-[state=open]:bg-accent group-data-[state=open]:text-on-accent">
                <Plus className="size-5" aria-hidden />
              </span>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="overflow-hidden px-6 text-muted-surface data-[state=closed]:hidden sm:px-8">
            <p className="max-w-3xl pb-6 leading-relaxed">{item.a}</p>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
