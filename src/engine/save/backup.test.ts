import { beforeEach, describe, expect, it } from "vitest";
import {
  applySaveFile,
  countIndexedDBRecords,
  createSaveFile,
  deleteAllData,
  listLocalEntries,
  listSnapshots,
  readSaveFile,
  restoreSnapshot,
  SaveFileError,
  summarizeSaveFile,
} from "./backup";
import { encodeText } from "./codec";
import { getDb } from "./db";

async function seed() {
  localStorage.setItem("mfg:settings", JSON.stringify({ v: 1, sound: false }));
  localStorage.setItem("mfg:game:trapsprint", JSON.stringify({ v: 1, totalDeaths: 41 }));
  localStorage.setItem("someone-else", "not ours");
  const db = await getDb();
  await db.put(
    "replays",
    {
      game: "trapsprint",
      level: "1-01",
      kind: "best",
      engineVersion: 1,
      inputs: new Uint8Array([1, 2, 3, 250]),
      timeMs: 6120,
      at: 1700000000000,
    },
    "trapsprint:1-01:best",
  );
  await db.add("runs", { game: "glitch-run", mode: "daily", score: 2481, at: 1700000000001 });
}

describe("backup", () => {
  beforeEach(async () => {
    await deleteAllData();
    localStorage.clear();
  });

  it("only lists the arcade's own keys", async () => {
    await seed();
    expect(listLocalEntries().map((e) => e.key)).toEqual(["mfg:game:trapsprint", "mfg:settings"]);
  });

  it("exports and re-imports everything, binary data included", async () => {
    await seed();
    const { blob, fileName } = await createSaveFile("test");
    expect(fileName).toMatch(/^mind-games-\d{4}-\d{2}-\d{2}\.mfgsave$/);

    const file = await readSaveFile(blob);
    const summary = summarizeSaveFile(file);
    expect(summary.games).toEqual(["trapsprint"]);
    expect(summary.records).toBe(2);

    // Wipe, then import.
    await deleteAllData();
    expect(listLocalEntries()).toEqual([]);
    await applySaveFile(file);

    expect(JSON.parse(localStorage.getItem("mfg:game:trapsprint")!).totalDeaths).toBe(41);
    const db = await getDb();
    const replay = await db.get("replays", "trapsprint:1-01:best");
    expect(replay?.inputs).toEqual(new Uint8Array([1, 2, 3, 250]));
    expect(await countIndexedDBRecords()).toMatchObject({ runs: 1, replays: 1 });
  });

  it("detects a tampered file through its checksum", async () => {
    await seed();
    const { blob } = await createSaveFile("test");
    const file = await readSaveFile(blob);
    const tampered = { ...file, localStorage: { ...file.localStorage, "mfg:game:trapsprint": '{"v":1,"totalDeaths":0}' } };
    const bytes = encodeText(JSON.stringify(tampered));
    await expect(readSaveFile(new Blob([bytes]))).rejects.toBeInstanceOf(SaveFileError);
  });

  it("rejects files that aren't save files", async () => {
    await expect(readSaveFile(new Blob(["hello"]))).rejects.toBeInstanceOf(SaveFileError);
    await expect(readSaveFile(new Blob([JSON.stringify({ format: "nope" })]))).rejects.toBeInstanceOf(SaveFileError);
  });

  it("takes a snapshot before importing, and can restore it", async () => {
    await seed();
    const { blob } = await createSaveFile("test");
    const file = await readSaveFile(blob);

    localStorage.setItem("mfg:game:trapsprint", JSON.stringify({ v: 1, totalDeaths: 999 }));
    await applySaveFile(file);
    expect(JSON.parse(localStorage.getItem("mfg:game:trapsprint")!).totalDeaths).toBe(41);

    const [latest] = await listSnapshots();
    expect(latest?.reason).toBe("Before importing a save file");
    await restoreSnapshot(latest!.id);
    expect(JSON.parse(localStorage.getItem("mfg:game:trapsprint")!).totalDeaths).toBe(999);
  });

  it("keeps someone else's keys when deleting everything", async () => {
    await seed();
    await deleteAllData();
    expect(listLocalEntries()).toEqual([]);
    expect(localStorage.getItem("someone-else")).toBe("not ours");
  });
});
