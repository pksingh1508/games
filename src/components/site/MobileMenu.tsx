"use client";

import { AnimatePresence, m } from "motion/react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog as RadixDialog } from "radix-ui";
import { useState } from "react";
import { playSound } from "@/engine/audio/ui-sound";
import { cn } from "@/lib/cn";
import { isActive, NAV_ITEMS } from "./nav-items";

const ITEMS = [{ href: "/", label: "Home" }, ...NAV_ITEMS];

/** On small screens the menu is a full-screen "PAUSED" menu. */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <RadixDialog.Root
      open={open}
      onOpenChange={(next) => {
        playSound(next ? "open" : "close");
        setOpen(next);
      }}
    >
      <RadixDialog.Trigger
        className="grid size-10 place-items-center rounded-xl text-ink-on-bg hover:bg-white/8 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-6" />
      </RadixDialog.Trigger>
      <AnimatePresence>
        {open && (
          <RadixDialog.Portal forceMount>
            <RadixDialog.Content asChild forceMount>
              <m.div
                className="fixed inset-0 z-[80] flex flex-col bg-bg/97 px-6 pb-10 pt-6 backdrop-blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-center justify-between">
                  <RadixDialog.Title className="pixel-label text-lie">Paused</RadixDialog.Title>
                  <RadixDialog.Description className="sr-only">Site navigation</RadixDialog.Description>
                  <RadixDialog.Close
                    className="grid size-11 place-items-center rounded-xl text-ink-on-bg hover:bg-white/8"
                    aria-label="Close menu"
                  >
                    <X className="size-6" />
                  </RadixDialog.Close>
                </div>
                <nav className="mt-10 flex-1" aria-label="Main">
                  <ul className="space-y-2">
                    {ITEMS.map((item, i) => {
                      const active = item.href === "/" ? pathname === "/" : isActive(pathname, item.href);
                      return (
                        <m.li
                          key={item.href}
                          initial={{ opacity: 0, x: -16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.04 * i, type: "spring", stiffness: 400, damping: 30 }}
                        >
                          <Link
                            href={item.href}
                            onClick={() => setOpen(false)}
                            data-sound="tick"
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "group/item flex items-center gap-3 rounded-2xl px-4 py-3 font-display text-4xl font-extrabold tracking-tight",
                              active ? "text-ink-on-bg" : "text-muted hover:text-ink-on-bg focus-visible:text-ink-on-bg",
                            )}
                          >
                            <span
                              aria-hidden
                              className={cn(
                                "font-pixel text-xl text-accent",
                                active ? "opacity-100" : "opacity-0 group-hover/item:opacity-100 group-focus-visible/item:opacity-100",
                              )}
                            >
                              ▶
                            </span>
                            {item.label}
                          </Link>
                        </m.li>
                      );
                    })}
                  </ul>
                </nav>
                <p className="pixel-label text-center text-[0.7rem] text-muted">Press start to continue</p>
              </m.div>
            </RadixDialog.Content>
          </RadixDialog.Portal>
        )}
      </AnimatePresence>
    </RadixDialog.Root>
  );
}
