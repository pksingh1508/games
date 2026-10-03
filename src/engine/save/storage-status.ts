// What the browser lets us store, and whether it promises to keep it.

export interface StorageStatus {
  /** Bytes used by this site (all storage types), if the browser reports it. */
  usage?: number;
  /** Bytes this site may use, if the browser reports it. */
  quota?: number;
  /** True when the browser has promised not to evict our data. */
  persisted?: boolean;
  /** True when navigator.storage.persist() exists. */
  canPersist: boolean;
  /** False in modes where writing to localStorage fails (some private modes). */
  localStorageWorks: boolean;
}

function localStorageWorks(): boolean {
  try {
    const key = "mfg:probe";
    localStorage.setItem(key, "1");
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export async function getStorageStatus(): Promise<StorageStatus> {
  const storage = typeof navigator !== "undefined" ? navigator.storage : undefined;
  const status: StorageStatus = {
    canPersist: typeof storage?.persist === "function",
    localStorageWorks: localStorageWorks(),
  };
  try {
    const estimate = await storage?.estimate?.();
    status.usage = estimate?.usage;
    status.quota = estimate?.quota;
  } catch {
    // Not supported: leave usage unknown.
  }
  try {
    status.persisted = await storage?.persisted?.();
  } catch {
    // Not supported.
  }
  return status;
}

/** Ask the browser to keep our data. Firefox shows a prompt; others decide on their own. */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}

/** True when running as an installed app (Home Screen / dock). */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iosStandalone || window.matchMedia?.("(display-mode: standalone)").matches === true;
}
