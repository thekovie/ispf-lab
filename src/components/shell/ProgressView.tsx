"use client";
/**
 * Learning Progress page: per-lesson status, attempts, hints, mistakes, best score;
 * reset progress; reset the training environment; Export Lab / Import Lab (catalog + profiles + progress + settings).
 */
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { resetCatalog } from "@/persistence/catalogStore";
import { KEYS } from "@/persistence/keys";
import { applyBundle, buildBundle, parseBundle, serializeBundle } from "@/persistence/labBundle";
import { resetProfiles } from "@/persistence/profileStore";
import { loadProgress, resetProgress, type Progress } from "@/persistence/progressStore";
import { createDefaultStorage } from "@/persistence/storage";
import { LESSONS } from "@/tutorial/lessons";
import "./shell.css";

const noop = () => () => {};

/** Trigger a browser download; returns false when the environment refuses (the textarea fallback stays visible). */
function downloadJson(json: string, filename: string): boolean {
  try {
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}

/** Renders nothing during SSR so browser storage can be read safely on the client. */
export function ProgressView() {
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  return mounted ? <ProgressBody /> : <div className="page" aria-busy="true" />;
}

function ProgressBody() {
  const storage = useMemo(() => createDefaultStorage(), []);
  const [progress, setProgress] = useState<Progress>(() => loadProgress(storage));
  const [note, setNote] = useState<string>("");
  const [exported, setExported] = useState<string>("");
  const userid = storage.get<string>(KEYS.lastUserid) ?? "USER01";

  const completed = LESSONS.filter((l) => progress.lessons[l.id]?.status === "completed").length;
  const attempts = Object.values(progress.lessons).reduce((n, l) => n + l.attempts, 0);
  const hints = Object.values(progress.lessons).reduce((n, l) => n + l.hintsUsed, 0);

  return (
    <div className="page">
      <h1 className="page__title">LEARNING PROGRESS</h1>
      <div className="page__rule">{"-".repeat(120)}</div>
      <div>
        <span className="page__stat">
          <b>
            {completed}/{LESSONS.length}
          </b>
          lessons completed
        </span>
        <span className="page__stat">
          <b>{attempts}</b>attempts
        </span>
        <span className="page__stat">
          <b>{hints}</b>hints used
        </span>
        <span className="page__stat">
          <b>{userid}</b>userid
        </span>
      </div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Lesson</th>
            <th>Module</th>
            <th>Status</th>
            <th>Attempts</th>
            <th>Hints</th>
            <th>Mistakes</th>
            <th>Best score</th>
          </tr>
        </thead>
        <tbody>
          {LESSONS.map((l) => {
            const p = progress.lessons[l.id];
            const status = p?.status ?? "not-started";
            return (
              <tr key={l.id}>
                <td>{String(l.number).padStart(2, "0")}</td>
                <td>{l.title}</td>
                <td>{l.module}</td>
                <td className={status === "completed" ? "is-done" : status === "in-progress" ? "is-progress" : "is-none"}>{status.toUpperCase()}</td>
                <td>{p?.attempts ?? 0}</td>
                <td>{p?.hintsUsed ?? 0}</td>
                <td>{p?.mistakes ?? 0}</td>
                <td>{p?.bestScore ?? "-"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="page__actions">
        <Link href="/lab" className="crt-button crt-button--primary">
          Back to the lab
        </Link>
        <button
          type="button"
          className="crt-button"
          onClick={() => {
            if (window.confirm("Reset all lesson progress?")) {
              setProgress(resetProgress(storage));
              setNote("Progress reset.");
            }
          }}
        >
          Reset progress
        </button>
        <button
          type="button"
          className="crt-button"
          onClick={() => {
            if (window.confirm(`Reset the training environment for ${userid}? All data sets return to the seed and edit profiles are cleared.`)) {
              resetCatalog(storage, userid);
              resetProfiles(storage, userid);
              setNote("Training environment reset to the original seed catalog.");
            }
          }}
        >
          Reset training environment
        </button>
        <button
          type="button"
          className="crt-button crt-button--ghost"
          onClick={() => {
            const json = serializeBundle(buildBundle(storage, userid));
            setExported(json);
            const saved = downloadJson(json, `ispf-lab-${userid.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`);
            setNote(saved ? "Lab exported: catalog, edit profiles, lesson progress and settings. The file is also shown below." : "Lab exported below. Copy the text into a file to keep it.");
          }}
        >
          Export Lab (JSON)
        </button>
        <label className="crt-button crt-button--ghost">
          Import Lab (JSON)
          <input
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const input = e.target;
              const file = input.files?.[0];
              if (!file) return;
              try {
                const { bundle, migratedFrom } = parseBundle(await file.text());
                const ok = window.confirm(
                  `Import the lab for ${bundle.userid}? This replaces the catalog and edit profiles of ${bundle.userid} and all lesson progress and settings in this browser.`,
                );
                if (!ok) {
                  setNote("Import cancelled.");
                  return;
                }
                const s = applyBundle(storage, bundle, migratedFrom);
                setProgress(bundle.progress);
                setNote(
                  `Imported lab for ${s.userid}: ${s.datasets} data sets, ${s.members} members, ${s.profiles} edit profiles, ${s.lessons} lesson records${s.migratedFrom ? ` (migrated from the catalog-only format v${s.migratedFrom})` : ""}. Log on as ${s.userid} to use it.`,
                );
              } catch (err) {
                setNote(`Import failed: ${err instanceof Error ? err.message : "unknown error"}`);
              } finally {
                input.value = "";
              }
            }}
          />
        </label>
      </div>
      {note && <p className="mono text-crt-amber">{note}</p>}
      {exported && (
        <textarea className="w-full h-64 mono text-xs bg-crt-bg border border-crt-border p-2" readOnly value={exported} aria-label="Exported lab JSON" />
      )}
      <p className="mono text-xs text-crt-dim">Everything is stored in this browser only (localStorage). No account, no server.</p>
    </div>
  );
}
