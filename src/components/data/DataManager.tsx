"use client";

import {
  ArchiveRestore,
  Download,
  HardDrive,
  ShieldAlert,
  ShieldCheck,
  Trash,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { HoldButton } from "@/components/ui/HoldButton";
import { toast } from "@/components/ui/toast-store";
import { unlockAchievement } from "@/engine/achievements";
import { markBackupDone, metaSave } from "@/engine/meta";
import { formatBytes, useSave } from "@/engine/save";
import {
  applySaveFile,
  countIndexedDBRecords,
  createSaveFile,
  deleteAllData,
  listLocalEntries,
  listSnapshots,
  readSaveFile,
  restoreSnapshot,
  SAVE_FILE_EXTENSION,
  SaveFileError,
  summarizeSaveFile,
  type SaveFile,
  type SnapshotInfo,
} from "@/engine/save/backup";
import { getStorageStatus, requestPersistentStorage, type StorageStatus } from "@/engine/save/storage-status";
import { GAMES } from "@/games/registry";
import { cn } from "@/lib/cn";
import { SITE } from "@/lib/site";

const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

const STORE_LABELS: Record<string, string> = {
  runs: "Run history",
  replays: "Replays & ghosts",
  levels: "Custom levels",
  media: "Images",
};

function friendlyKey(key: string): string {
  if (key === "mfg:settings") return "Settings";
  if (key === "mfg:meta") return "Achievements & visits";
  if (key === "mfg:errors") return "Error log";
  if (key.startsWith("mfg:game:")) {
    const slug = key.slice("mfg:game:".length);
    return GAMES.find((g) => g.slug === slug)?.title ?? slug;
  }
  return key;
}

function Card({ title, icon, children, className }: { title: string; icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-[var(--radius-card)] border border-line bg-surface p-6 text-ink sm:p-8", className)} aria-label={title}>
      <h2 className="flex items-center gap-3 font-display text-2xl font-extrabold">
        <span className="grid size-10 place-items-center rounded-xl bg-surface-2">{icon}</span>
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function DataManager() {
  const meta = useSave(metaSave);
  const [status, setStatus] = useState<StorageStatus | null>(null);
  const [entries, setEntries] = useState<Array<{ key: string; bytes: number }>>([]);
  const [records, setRecords] = useState<Record<string, number>>({});
  const [snapshots, setSnapshots] = useState<SnapshotInfo[]>([]);
  const [pending, setPending] = useState<SaveFile | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<SnapshotInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    setEntries(listLocalEntries());
    const [nextStatus, nextRecords, nextSnapshots] = await Promise.all([
      getStorageStatus(),
      countIndexedDBRecords().catch(() => ({})),
      listSnapshots().catch(() => []),
    ]);
    setStatus(nextStatus);
    setRecords(nextRecords);
    setSnapshots(nextSnapshots);
  }, []);

  useEffect(() => {
    // Reading browser storage has to happen after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const exportSave = async () => {
    setBusy(true);
    try {
      // Make sure the newest values are written before reading them.
      metaSave.flush();
      const { blob, fileName } = await createSaveFile(SITE.version);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      markBackupDone();
      unlockAchievement("safe-keeper");
      toast({ kind: "success", title: "Save file downloaded", description: `${fileName} (${formatBytes(blob.size)})` });
    } catch {
      toast({ kind: "warning", title: "Export failed", description: "Your data is untouched. Please try again." });
    } finally {
      setBusy(false);
      void refresh();
    }
  };

  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setPending(await readSaveFile(file));
    } catch (error) {
      toast({
        kind: "warning",
        title: "Can't import that file",
        description: error instanceof SaveFileError ? error.message : "Something went wrong reading it.",
      });
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const confirmImport = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await applySaveFile(pending);
      window.location.reload();
    } catch {
      setBusy(false);
      toast({ kind: "warning", title: "Import failed", description: "Nothing was changed." });
    }
  };

  const confirmRestore = async () => {
    if (!restoreTarget) return;
    setBusy(true);
    try {
      await restoreSnapshot(restoreTarget.id);
      window.location.reload();
    } catch {
      setBusy(false);
      toast({ kind: "warning", title: "Restore failed", description: "Nothing was changed." });
    }
  };

  const persist = async () => {
    const granted = await requestPersistentStorage();
    toast(
      granted
        ? { kind: "success", title: "Storage protected", description: "The browser promised to keep your data." }
        : {
            kind: "info",
            title: "Not granted (yet)",
            description: "Browsers decide on their own. Installing the arcade, or exporting backups, keeps you safe either way.",
          },
    );
    void refresh();
  };

  const totalLocal = entries.reduce((sum, e) => sum + e.bytes, 0);
  const summary = pending ? summarizeSaveFile(pending) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Storage */}
      <Card title="Storage" icon={<HardDrive className="size-5" aria-hidden />}>
        {status === null ? (
          <p className="text-muted-surface">Checking…</p>
        ) : (
          <>
            <div className="flex items-end justify-between">
              <div>
                <p className="font-mono text-3xl font-bold">{status.usage !== undefined ? formatBytes(status.usage) : "—"}</p>
                <p className="text-sm text-muted-surface">used by the arcade on this device</p>
              </div>
              <span
                className={cn(
                  "chip border-transparent",
                  status.persisted ? "bg-[#C6FF3D] text-[#0E0B16]" : "bg-[#FFB020] text-[#0E0B16]",
                )}
              >
                {status.persisted ? <ShieldCheck className="size-3.5" aria-hidden /> : <ShieldAlert className="size-3.5" aria-hidden />}
                {status.persisted ? "Protected" : "Best effort"}
              </span>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-muted-surface">
              {status.persisted
                ? "Your browser has promised not to clear this data on its own."
                : "Browsers may clear data for sites you haven't visited in a while (Safari does after 7 days). Ask for protection, install the arcade, or keep a backup."}
            </p>
            {!status.localStorageWorks && (
              <p className="mt-4 rounded-xl bg-[#FFB020]/15 p-3 text-sm font-semibold">
                This browser mode is blocking storage, so nothing can be saved right now.
              </p>
            )}
            {!status.persisted && status.canPersist && (
              <button type="button" className="btn btn-secondary btn-sm mt-5" data-sound="click" onClick={persist}>
                <ShieldCheck className="size-4" aria-hidden /> Keep my data safe
              </button>
            )}
          </>
        )}
      </Card>

      {/* Backup */}
      <Card title="Save file" icon={<Download className="size-5" aria-hidden />}>
        <p className="leading-relaxed text-muted-surface">
          Download everything into one file. Keep it somewhere safe, or import it on another device.
        </p>
        <p className="mt-4 font-mono text-sm">
          Last backup:{" "}
          <span className="font-semibold">{meta.lastBackupAt ? dateTime.format(meta.lastBackupAt) : "never"}</span>
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="btn btn-sm" data-sound="coin" onClick={exportSave} disabled={busy}>
            <Download className="size-4" aria-hidden /> Export save file
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            data-sound="click"
            onClick={() => fileInput.current?.click()}
            disabled={busy}
          >
            <Upload className="size-4" aria-hidden /> Import…
          </button>
          <input
            ref={fileInput}
            type="file"
            accept={`${SAVE_FILE_EXTENSION},application/octet-stream,application/json`}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => void pickFile(e.target.files?.[0])}
          />
        </div>
      </Card>

      {/* What's stored */}
      <Card title="What's stored" icon={<HardDrive className="size-5" aria-hidden />} className="lg:col-span-2">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="pixel-label text-[0.7rem] text-muted-surface">Small saves (localStorage)</p>
            {entries.length === 0 ? (
              <p className="mt-3 text-muted-surface">Nothing yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-[color-mix(in_oklab,var(--ink)_10%,transparent)]">
                {entries.map((entry) => (
                  <li key={entry.key} className="flex items-center justify-between gap-4 py-2.5">
                    <span>
                      <span className="font-semibold">{friendlyKey(entry.key)}</span>{" "}
                      <span className="font-mono text-xs text-muted-surface">{entry.key}</span>
                    </span>
                    <span className="font-mono text-sm tabular-nums text-muted-surface">{formatBytes(entry.bytes)}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 font-mono text-xs text-muted-surface">Total: {formatBytes(totalLocal)}</p>
          </div>
          <div>
            <p className="pixel-label text-[0.7rem] text-muted-surface">Big saves (IndexedDB)</p>
            <ul className="mt-3 divide-y divide-[color-mix(in_oklab,var(--ink)_10%,transparent)]">
              {Object.entries(STORE_LABELS).map(([store, label]) => (
                <li key={store} className="flex items-center justify-between gap-4 py-2.5">
                  <span className="font-semibold">{label}</span>
                  <span className="font-mono text-sm tabular-nums text-muted-surface">{records[store] ?? 0} items</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-muted-surface">Games fill these in as you play: ghosts, replays, run history.</p>
          </div>
        </div>
      </Card>

      {/* Snapshots */}
      <Card title="Snapshots" icon={<ArchiveRestore className="size-5" aria-hidden />}>
        <p className="leading-relaxed text-muted-surface">
          Before risky changes (like an import), the arcade quietly saves a copy of your data here. The last three are kept.
        </p>
        {snapshots.length === 0 ? (
          <p className="mt-5 font-mono text-sm text-muted-surface">No snapshots yet.</p>
        ) : (
          <ul className="mt-5 space-y-2.5">
            {snapshots.map((snapshot) => (
              <li key={snapshot.id} className="flex items-center justify-between gap-3 rounded-2xl bg-surface-2 p-3.5">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{snapshot.reason}</p>
                  <p className="font-mono text-xs text-muted-surface">
                    {dateTime.format(snapshot.at)} · {formatBytes(snapshot.bytes)}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm shrink-0"
                  data-sound="click"
                  onClick={() => setRestoreTarget(snapshot)}
                >
                  Restore
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Danger zone */}
      <Card title="Delete everything" icon={<Trash className="size-5" aria-hidden />} className="border-[#D62839]/40">
        <p className="leading-relaxed text-muted-surface">
          Removes every save, setting, achievement and record from this device. There&apos;s no undo, so export a save file
          first if you might want it back.
        </p>
        <div className="mt-6">
          <HoldButton
            disabled={busy}
            onConfirm={async () => {
              setBusy(true);
              await deleteAllData();
              window.location.reload();
            }}
          >
            <Trash className="size-4" aria-hidden /> Hold to delete everything
          </HoldButton>
        </div>
      </Card>

      {/* Import preview */}
      <Dialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        eyebrow="Import save file"
        title="Replace your data with this save?"
        description="Your current data is snapshotted first, so you can undo this from Snapshots."
      >
        {summary && (
          <dl className="grid grid-cols-2 gap-4 rounded-2xl bg-surface-2 p-5 text-sm">
            <div>
              <dt className="text-muted-surface">Exported</dt>
              <dd className="font-semibold">{dateTime.format(summary.exportedAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-surface">Version</dt>
              <dd className="font-mono font-semibold">{summary.appVersion}</dd>
            </div>
            <div>
              <dt className="text-muted-surface">Saves</dt>
              <dd className="font-semibold">{summary.localKeys.length}</dd>
            </div>
            <div>
              <dt className="text-muted-surface">Records</dt>
              <dd className="font-semibold">{summary.records}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-muted-surface">Games</dt>
              <dd className="font-semibold">
                {summary.games.length ? summary.games.map((slug) => friendlyKey(`mfg:game:${slug}`)).join(", ") : "No game saves"}
              </dd>
            </div>
          </dl>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" className="btn btn-secondary btn-sm" data-sound="click" onClick={() => setPending(null)}>
            Cancel
          </button>
          <button type="button" className="btn btn-sm" data-sound="coin" onClick={confirmImport} disabled={busy}>
            <Upload className="size-4" aria-hidden /> Replace my data
          </button>
        </div>
      </Dialog>

      {/* Restore confirm */}
      <Dialog
        open={restoreTarget !== null}
        onOpenChange={(open) => !open && setRestoreTarget(null)}
        eyebrow="Restore snapshot"
        title="Go back to this snapshot?"
        description={restoreTarget ? `${restoreTarget.reason}, ${dateTime.format(restoreTarget.at)}.` : undefined}
      >
        <p className="text-muted-surface">Your current data is snapshotted first, so this can be undone too.</p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" className="btn btn-secondary btn-sm" data-sound="click" onClick={() => setRestoreTarget(null)}>
            Cancel
          </button>
          <button type="button" className="btn btn-sm" data-sound="coin" onClick={confirmRestore} disabled={busy}>
            <ArchiveRestore className="size-4" aria-hidden /> Restore
          </button>
        </div>
      </Dialog>
    </div>
  );
}
