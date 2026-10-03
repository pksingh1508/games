// Sharing a result card. The text leaves the device only here, when the player chooses to share
// it: the system share sheet on phones, the clipboard everywhere else (Plan/gameStack.md §14).
export type ShareOutcome = "shared" | "copied" | "failed";

export async function shareResult(text: string): Promise<ShareOutcome> {
  const canShare = typeof navigator.share === "function" && window.matchMedia("(pointer: coarse)").matches;
  if (canShare) {
    try {
      await navigator.share({ text });
      return "shared";
    } catch {
      // Cancelled, or not allowed: fall back to copying.
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}
