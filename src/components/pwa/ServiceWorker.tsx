"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "@/components/ui/toast-store";

/**
 * Registers the offline service worker (built by scripts/build-sw.mjs) in production.
 * A new version waits until the player chooses to update, and never interrupts a game.
 */
export function ServiceWorker() {
  const pathname = usePathname();
  const inGame = pathname.endsWith("/play");
  const inGameRef = useRef(inGame);

  useEffect(() => {
    inGameRef.current = inGame;
  }, [inGame]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;

    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    const offerUpdate = (worker: ServiceWorker) => {
      const show = () =>
        toast({
          kind: "info",
          title: "A new version is ready",
          description: "Update now? Your progress is saved.",
          duration: 0,
          action: { label: "Update", onClick: () => worker.postMessage({ type: "SKIP_WAITING" }) },
        });
      if (!inGameRef.current) {
        show();
        return;
      }
      // Wait until the player leaves the game.
      const timer = setInterval(() => {
        if (!inGameRef.current) {
          clearInterval(timer);
          show();
        }
      }, 2000);
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        if (registration.waiting && navigator.serviceWorker.controller) offerUpdate(registration.waiting);
        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          installing?.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) offerUpdate(installing);
          });
        });
      })
      .catch(() => {
        // Offline support is a bonus: the site works without it.
      });

    return () => navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
  }, []);

  return null;
}
