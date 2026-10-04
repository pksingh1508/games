import { afterEach, describe, expect, it } from "vitest";
import { borrowTab, onTabVisibility } from "./tab";

const PIX = "data:image/png;base64,UElY";

function icons(...hrefs: string[]) {
  for (const href of hrefs) {
    const link = document.createElement("link");
    link.rel = "icon";
    link.href = href;
    document.head.appendChild(link);
  }
}

const hrefs = () => Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')).map((l) => l.getAttribute("href"));

afterEach(() => {
  document.head.innerHTML = "";
  document.title = "";
});

describe("borrowing the tab", () => {
  it("swaps the title and every icon, then puts them back exactly", () => {
    document.title = "Play Last Pixel";
    icons("/favicon.ico", "/icon.svg");
    const tab = borrowTab({ title: "👀 99.99%", icon: PIX });
    expect(document.title).toBe("👀 99.99%");
    expect(hrefs()).toEqual([PIX, PIX]);
    tab.set({ title: "Pix is here" });
    expect(document.title).toBe("Pix is here");
    tab.restore();
    expect(document.title).toBe("Play Last Pixel");
    expect(hrefs()).toEqual(["/favicon.ico", "/icon.svg"]);
    // Twice is fine, and changes after giving it back do nothing.
    tab.restore();
    tab.set({ title: "late" });
    expect(document.title).toBe("Play Last Pixel");
  });

  it("adds an icon when the page has none, and takes it away again", () => {
    const tab = borrowTab({ icon: PIX });
    expect(hrefs()).toEqual([PIX]);
    tab.restore();
    expect(hrefs()).toEqual([]);
  });

  it("leaves alone what the site changed in the meantime", () => {
    document.title = "Play Last Pixel";
    icons("/favicon.ico");
    const tab = borrowTab({ title: "Pix", icon: PIX });
    // A client-side navigation set its own title and icon.
    document.title = "Settings";
    document.querySelector("link")!.setAttribute("href", "/other.ico");
    tab.restore();
    expect(document.title).toBe("Settings");
    expect(hrefs()).toEqual(["/other.ico"]);
  });

  it("gives everything back when the page goes away", () => {
    document.title = "Play Last Pixel";
    icons("/favicon.ico");
    borrowTab({ title: "Pix", icon: PIX });
    window.dispatchEvent(new Event("pagehide"));
    expect(document.title).toBe("Play Last Pixel");
    expect(hrefs()).toEqual(["/favicon.ico"]);
  });
});

describe("tab visibility", () => {
  it("says when the player looks away and comes back", () => {
    const seen: boolean[] = [];
    let state: DocumentVisibilityState = "visible";
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
    const stop = onTabVisibility((hidden) => seen.push(hidden));
    state = "hidden";
    document.dispatchEvent(new Event("visibilitychange"));
    state = "visible";
    document.dispatchEvent(new Event("visibilitychange"));
    stop();
    document.dispatchEvent(new Event("visibilitychange"));
    expect(seen).toEqual([true, false]);
  });
});
