// The browser tab (Plan/README.md › engine/browser): a game can borrow the tab's title and icon for a
// while (Last Pixel's Pix hides in the favicon) and always gives them back: when it's done, when the
// player leaves the page, and if the page is closed. Only what the game set is put back, so a title the
// site changed in the meantime (a client-side navigation) is left alone. Plus the tab's visibility: a
// game can tell when the player looks away and comes back.

export interface TabLook {
  /** The tab's title while it's borrowed. */
  title?: string;
  /** The tab's icon while it's borrowed (a data: URL, e.g. from a canvas). */
  icon?: string;
}

export interface BorrowedTab {
  /** Change the look while it's borrowed. */
  set(look: TabLook): void;
  /** Give the tab back: the title and icons as they were. Safe to call more than once. */
  restore(): void;
}

const ICONS = 'link[rel~="icon"]';

/** Borrow the tab's title and icon. Everything comes back on restore(), or when the page goes away. */
export function borrowTab(look: TabLook, doc: Document = document): BorrowedTab {
  const title = doc.title;
  const links = Array.from(doc.querySelectorAll<HTMLLinkElement>(ICONS)).map((link) => ({ link, href: link.getAttribute("href") }));
  let added: HTMLLinkElement | null = null;
  let shownTitle: string | null = null;
  let shownIcon: string | null = null;
  let done = false;

  const set = ({ title: nextTitle, icon }: TabLook) => {
    if (done) return;
    if (nextTitle !== undefined) {
      doc.title = nextTitle;
      shownTitle = nextTitle;
    }
    if (icon !== undefined) {
      shownIcon = icon;
      if (links.length === 0 && !added) {
        added = doc.createElement("link");
        added.rel = "icon";
        doc.head.appendChild(added);
      }
      for (const { link } of links) link.setAttribute("href", icon);
      added?.setAttribute("href", icon);
    }
  };

  const restore = () => {
    if (done) return;
    done = true;
    doc.defaultView?.removeEventListener("pagehide", restore);
    if (shownTitle !== null && doc.title === shownTitle) doc.title = title;
    for (const { link, href } of links) {
      if (link.getAttribute("href") !== shownIcon) continue;
      if (href === null) link.removeAttribute("href");
      else link.setAttribute("href", href);
    }
    added?.remove();
    added = null;
  };

  doc.defaultView?.addEventListener("pagehide", restore);
  set(look);
  return { set, restore };
}

/** Called with true when the tab is hidden (the player looked away), false when it's back. */
export function onTabVisibility(listener: (hidden: boolean) => void, doc: Document = document): () => void {
  const changed = () => listener(doc.visibilityState === "hidden");
  doc.addEventListener("visibilitychange", changed);
  return () => doc.removeEventListener("visibilitychange", changed);
}
