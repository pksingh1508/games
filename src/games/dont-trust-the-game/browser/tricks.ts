// The browser-native tricks (Plan/04-dont-trust-the-game.md §3 "Browser-native tricks", §10 "Hard limits"): the tab
// title and favicon (always given back, via engine/browser), fullscreen (optional: iPhone Safari can't), text
// selection, the ?room= search param (pushState/replaceState, which Next.js's router follows), styled messages in
// the real console, the reload puzzle (sessionStorage) and a whisper. Nothing here asks for a permission, blocks
// leaving, or makes a network request.
import { borrowTab, type BorrowedTab } from "@/engine/browser/tab";
import { BOOT } from "../core/console";

// -- The reload puzzle -------------------------------------------------------------------------------------------

const RELOAD_KEY = "mfg:dont-trust-the-game:reload";

/** HELPER has said "Reload the page": the next load of the game counts. */
export function armReload() {
  try {
    sessionStorage.setItem(RELOAD_KEY, "armed");
  } catch {
    // Storage blocked: the honest skip still works.
  }
}

let reloaded = false;

/**
 * Was the page reloaded (or the game opened again) after HELPER said so? The flag is cleared once read, and the
 * answer kept for the rest of the page's life (asking twice gives the same answer).
 */
export function consumeReload(): boolean {
  if (reloaded) return true;
  try {
    reloaded = sessionStorage.getItem(RELOAD_KEY) === "armed";
    if (reloaded) sessionStorage.removeItem(RELOAD_KEY);
  } catch {
    // Storage blocked: the honest skip still works.
  }
  return reloaded;
}

// -- The tab ---------------------------------------------------------------------------------------------------

let tab: BorrowedTab | null = null;
let wanted: { title?: string; icon?: string } = {};
let keeper: ReturnType<typeof setInterval> | null = null;

/**
 * Change the tab's title and/or icon (the original comes back with giveTabBack, or when the page goes away). While
 * it's borrowed, it's put back if anything else rewrites it (the page's own <title> can be re-rendered).
 */
export function setTab(look: { title?: string; icon?: string }) {
  wanted = { ...wanted, ...look };
  if (!tab) tab = borrowTab(look);
  else tab.set(look);
  keeper ??= setInterval(() => {
    if (!tab) return;
    if (wanted.title !== undefined && document.title !== wanted.title) tab.set({ title: wanted.title });
    const icon = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
    if (wanted.icon !== undefined && icon && icon.getAttribute("href") !== wanted.icon) tab.set({ icon: wanted.icon });
  }, 250);
}

export function giveTabBack() {
  if (keeper) clearInterval(keeper);
  keeper = null;
  wanted = {};
  tab?.restore();
  tab = null;
}

/** A small icon drawn on a canvas, as a data: URL (for the favicon). */
export function iconUrl(draw: (g: CanvasRenderingContext2D) => void, size = 32): string {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d")!;
  draw(g);
  return c.toDataURL("image/png");
}

/** Right Door's icon: a door with an arrow (the favicon clue in More Games). */
export function drawRightDoorIcon(g: CanvasRenderingContext2D) {
  g.fillStyle = "#2d1b4e";
  g.fillRect(0, 0, 32, 32);
  g.fillStyle = "#ffd23f";
  g.fillRect(8, 5, 14, 24);
  g.fillStyle = "#c2306f";
  g.fillRect(10, 7, 10, 20);
  g.fillStyle = "#ffd23f";
  g.fillRect(17, 16, 2, 2);
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.moveTo(22, 11);
  g.lineTo(30, 16);
  g.lineTo(22, 21);
  g.closePath();
  g.fill();
}

// -- Fullscreen ----------------------------------------------------------------------------------------------

export const fullscreenSupported = () => typeof document !== "undefined" && Boolean(document.fullscreenEnabled && document.documentElement.requestFullscreen);

export async function enterFullscreen(el: HTMLElement): Promise<boolean> {
  if (!fullscreenSupported()) return false;
  try {
    await el.requestFullscreen({ navigationUI: "hide" });
    return true;
  } catch {
    return false;
  }
}

export function exitFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
}

export function onFullscreen(listener: (on: boolean) => void): () => void {
  const changed = () => listener(Boolean(document.fullscreenElement));
  document.addEventListener("fullscreenchange", changed);
  return () => document.removeEventListener("fullscreenchange", changed);
}

// -- Text selection --------------------------------------------------------------------------------------------

/** Called with whatever text is selected now (drag, Ctrl+A, long-press). */
export function onSelection(listener: (text: string) => void): () => void {
  const changed = () => listener(document.getSelection()?.toString() ?? "");
  document.addEventListener("selectionchange", changed);
  return () => document.removeEventListener("selectionchange", changed);
}

// -- The URL --------------------------------------------------------------------------------------------------

/** `?room=` from the address bar. */
export function roomParam(): string | null {
  return new URLSearchParams(window.location.search).get("room");
}

/** Show `?room=…` in the address bar: a new history entry (push) or in place. Only ever one entry is pushed. */
export function setRoomParam(room: string | null, mode: "push" | "replace") {
  const params = new URLSearchParams(window.location.search);
  if (room === null) params.delete("room");
  else params.set("room", room);
  const query = params.toString();
  const url = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
  if (url === `${window.location.pathname}${window.location.search}${window.location.hash}`) return;
  // `null` state, as in the Next.js docs: the router copies its own state in and keeps the URL (passing its state
  // back makes it think the call was its own, and it puts its URL back).
  if (mode === "push") window.history.pushState(null, "", url);
  else window.history.replaceState(null, "", url);
}

export function onBackForward(listener: () => void): () => void {
  window.addEventListener("popstate", listener);
  return () => window.removeEventListener("popstate", listener);
}

// -- The real console ---------------------------------------------------------------------------------------

/** Styled messages for desktop players who open DevTools, and `helper.truth()` for them to call. */
export function talkToTheConsole(onTruth: () => void): () => void {
  const big = "font: 800 18px system-ui, sans-serif; color: #c2306f;";
  const small = "font: 600 13px system-ui, sans-serif; color: #2d1b4e;";
  console.log(`%c${BOOT[0]}`, big);
  for (const lineText of BOOT.slice(1)) console.log(`%c${lineText}`, small);
  console.log("%cThe game has its own console too: tap the version number seven times.", small);
  const helper = {
    truth() {
      onTruth();
      return "The truth: I lie because when you finish, the game ends. And so do I.";
    },
  };
  (window as unknown as { helper?: typeof helper }).helper = helper;
  return () => {
    const w = window as unknown as { helper?: typeof helper };
    if (w.helper === helper) delete w.helper;
  };
}

// -- The whisper -----------------------------------------------------------------------------------------------

/**
 * Whisper `text` with a voice that lives on this device (never one that would send the words to a server).
 * Returns false when there isn't one: the captions carry it then.
 */
export function whisper(text: string, volume: number): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const voices = window.speechSynthesis.getVoices().filter((v) => v.localService && v.lang.toLowerCase().startsWith("en"));
  const voice = voices[0];
  if (!voice) return false;
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.rate = 0.7;
  u.pitch = 0.6;
  u.volume = Math.max(0, Math.min(1, volume));
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
  return true;
}

export function hush() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}
