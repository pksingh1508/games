// The developer console (Plan/04-dont-trust-the-game.md §5 Chapter 5).
import { describe, expect, it } from "vitest";
import { BOOT, runCommand } from "./console";

describe("the developer console", () => {
  it("sudo is a nice try; please opens the door", () => {
    expect(runCommand("open door").lines).toEqual(["Permission denied."]);
    expect(runCommand("sudo open door")).toEqual({ lines: ["Nice try."], effect: "sudo" });
    expect(runCommand("  Please   OPEN door ").effect).toBe("open");
    expect(runCommand("please").effect).toBeUndefined();
  });

  it("help, ls and cat tell the truth (and helper.cfg is a secret)", () => {
    expect(runCommand("help").lines.join("\n")).toContain("jump --height");
    expect(runCommand("ls").lines[0]).toContain("secrets.txt");
    expect(runCommand("cat secrets.txt").lines.join(" ")).toMatch(/polite/);
    expect(runCommand("cat helper.cfg").effect).toBe("cfg");
    expect(runCommand("cat nope.txt").lines[0]).toMatch(/no such file/);
  });

  it("jump --height 999 works (briefly); small heights are just jumps", () => {
    expect(runCommand("jump --height 999").effect).toBe("moon");
    expect(runCommand("jump --height 3").effect).toBeUndefined();
  });

  it("the boot messages point at the answer without saying it", () => {
    expect(BOOT.join(" ")).toMatch(/manners/);
    expect(BOOT.join(" ")).not.toMatch(/please open door/);
    expect(runCommand("helper.truth()").effect).toBe("truth");
    expect(runCommand("dance").lines[0]).toMatch(/command not found: dance/);
  });
});
