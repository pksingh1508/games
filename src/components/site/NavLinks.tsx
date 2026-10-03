"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { isActive, NAV_ITEMS } from "./nav-items";

/** Desktop navigation. The ▶ cursor marks the selected item, like a game menu. */
export function NavLinks() {
  const pathname = usePathname();
  return (
    <ul className="hidden items-center gap-1 lg:flex">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              data-sound="tick"
              className={cn(
                "group/nav relative flex items-center rounded-xl px-3.5 py-2 text-[0.95rem] font-semibold transition-colors",
                active ? "text-ink-on-bg" : "text-muted hover:text-ink-on-bg",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "mr-1.5 font-pixel text-[0.7rem] text-accent transition-all duration-200",
                  active ? "opacity-100" : "-translate-x-1 opacity-0 group-hover/nav:translate-x-0 group-hover/nav:opacity-100",
                )}
              >
                ▶
              </span>
              {item.label}
              {active && <span aria-hidden className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-accent" />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
