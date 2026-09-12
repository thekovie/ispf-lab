"use client";
/**
 * Top bar: mode switcher, lesson picker, Explain, Progress, Reset environment.
 */
import Link from "next/link";
import { useSimulator } from "@/state/SimulatorProvider";
import { useTutorial } from "@/state/TutorialProvider";
import { LESSONS, MODULES } from "@/tutorial/lessons";
import type { AppMode } from "@/tutorial/types";

const MODES: { id: AppMode; label: string; title: string }[] = [
  { id: "learn", label: "1 Learn", title: "Step-by-step instructions" },
  { id: "practice", label: "2 Practice", title: "Objective and hints only" },
  { id: "challenge", label: "3 Challenge", title: "Final result is checked; score recorded" },
  { id: "sandbox", label: "4 Sandbox", title: "Free use, no lesson" },
];

export function TopBar() {
  const { store, state } = useSimulator();
  const t = useTutorial();
  return (
    <header className="topbar">
      <Link href="/" className="panel-title topbar__brand">
        ISPF LAB
      </Link>
      <nav className="topbar__modes" aria-label="Mode">
        {MODES.map((m) => (
          <button key={m.id} type="button" className="crt-button" aria-pressed={t.mode === m.id} title={m.title} onClick={() => t.setMode(m.id)}>
            {m.label}
          </button>
        ))}
      </nav>
      {t.mode !== "sandbox" && (
        <select
          className="crt-select topbar__lesson"
          aria-label="Lesson"
          value={t.lesson?.id ?? ""}
          onChange={(e) => e.target.value && t.startLesson(e.target.value)}
        >
          <option value="">Choose a lesson…</option>
          {MODULES.map((mod) => (
            <optgroup key={mod} label={mod}>
              {LESSONS.filter((l) => l.module === mod).map((l) => (
                <option key={l.id} value={l.id}>
                  {String(l.number).padStart(2, "0")} {l.title}
                  {t.progress.lessons[l.id]?.status === "completed" ? " ✓" : ""}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      )}
      <span className="topbar__spacer" />
      <span className="mono text-xs text-crt-dim topbar__user">{state.loggedIn ? state.userid : "not logged on"}</span>
      <button type="button" className="crt-button" onClick={() => t.setExplainQuery(t.explainQuery === undefined ? "" : undefined)}>
        Explain
      </button>
      <Link href="/lab/progress" className="crt-button">
        Progress
      </Link>
      <Link href="/resources" className="crt-button crt-button--ghost">
        Resources
      </Link>
      <button
        type="button"
        className="crt-button crt-button--ghost"
        onClick={() => {
          if (window.confirm("Reset the training environment? All data sets return to the original seed. Lesson progress is kept.")) store.resetEnvironment();
        }}
      >
        Reset env
      </button>
    </header>
  );
}
