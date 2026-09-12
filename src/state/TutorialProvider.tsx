"use client";
/**
 * Tutorial state for the shell: mode, active lesson, runner, progress, Explain drawer.
 * Talks to the simulator only through the store's event stream and semantic actions.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getMember } from "@/catalog/catalog";
import { buildSeed } from "@/catalog/seed";
import type { Catalog } from "@/catalog/types";
import type { SimEvent, SimulatorState } from "@/engine/types";
import { STORAGE_PREFIX } from "@/persistence/keys";
import { lessonProgress, loadProgress, resetProgress as clearProgress, saveProgress, updateLesson, type Progress } from "@/persistence/progressStore";
import { currentStep, feedEvents, fillHlq, scoreFor, startRunner, useHint as applyHint } from "@/tutorial/engine";
import { explainTerm, type GlossaryEntry } from "@/tutorial/explain";
import { LESSONS, lessonById } from "@/tutorial/lessons";
import type { AppMode, Lesson, LessonStep, RunnerState } from "@/tutorial/types";
import { useSimulatorStore } from "./SimulatorProvider";

const MODE_KEY = `${STORAGE_PREFIX}:mode:v1`;
const LESSON_KEY = `${STORAGE_PREFIX}:current-lesson:v1`;

export interface TutorialApi {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  lesson?: Lesson;
  runner?: RunnerState;
  step?: LessonStep;
  /** step text with {HLQ} resolved */
  text: (s: string | undefined) => string;
  highlightField?: string;
  startLesson: (id: string) => void;
  restartLesson: () => void;
  nextLesson: () => void;
  showHint: () => void;
  progress: Progress;
  resetProgress: () => void;
  score?: number;
  explain?: GlossaryEntry;
  explainQuery?: string;
  setExplainQuery: (q: string | undefined) => void;
  lastEvents: SimEvent[];
}

const TutorialContext = createContext<TutorialApi | null>(null);

/** Restore specific members from the seed so a lesson always starts from known data. */
function restoreMembers(catalog: Catalog, hlq: string, refs: { dsn: string; member: string }[]): Catalog {
  const seed = buildSeed(hlq);
  let next = catalog;
  for (const ref of refs) {
    const dsn = fillHlq(ref.dsn, hlq);
    const seeded = getMember(seed, dsn, ref.member);
    const ds = next.datasets[dsn] ?? seed.datasets[dsn];
    if (!seeded || !ds) continue;
    next = { ...next, datasets: { ...next.datasets, [dsn]: { ...ds, members: { ...(ds.members ?? {}), [ref.member]: seeded } } } };
  }
  return next;
}

export function TutorialProvider({ children }: { children: ReactNode }) {
  const store = useSimulatorStore();
  // This provider only mounts on the client (DesktopGate renders nothing during SSR),
  // so persisted values can be read in the initializers without a hydration mismatch.
  const [mode, setModeState] = useState<AppMode>(() => {
    const q = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("mode") : null;
    if (q === "learn" || q === "practice" || q === "challenge" || q === "sandbox") {
      store.storage.set(MODE_KEY, q);
      return q;
    }
    return store.storage.get<AppMode>(MODE_KEY) ?? "learn";
  });
  const [lessonId, setLessonId] = useState<string | undefined>(() => {
    const cur = store.storage.get<string>(LESSON_KEY);
    return cur && lessonById(cur) ? cur : undefined;
  });
  const [runner, setRunner] = useState<RunnerState | undefined>(undefined);
  const [progress, setProgress] = useState<Progress>(() => loadProgress(store.storage));
  const [explainQuery, setExplainQuery] = useState<string | undefined>(() => {
    const q = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("explain") : null;
    return q ?? undefined;
  });
  const [lastEvents, setLastEvents] = useState<SimEvent[]>([]);

  const lesson = lessonId ? lessonById(lessonId) : undefined;

  const persistProgress = useCallback(
    (p: Progress) => {
      setProgress(p);
      saveProgress(store.storage, p);
    },
    [store.storage],
  );

  const startLesson = useCallback(
    (id: string) => {
      const l = lessonById(id);
      if (!l) return;
      const state: SimulatorState = store.getState();
      if (!state.loggedIn && l.startingState?.screen?.id !== "LOGIN") {
        store.dispatch({ type: "ENTER", fields: { userid: state.userid || "USER01" } });
      }
      const s2 = store.getState();
      if (l.startingState?.resetMembers?.length) {
        store.dispatch({ type: "LOAD_CATALOG", catalog: restoreMembers(s2.catalog, s2.userid, l.startingState.resetMembers) });
      }
      if (l.startingState?.screen) {
        if (l.startingState.screen.id === "LOGIN") store.dispatch({ type: "LOGOFF" });
        else store.dispatch({ type: "GOTO", screen: l.startingState.screen, clearStack: true });
      }
      setLessonId(id);
      setRunner(startRunner(l));
      store.storage.set(LESSON_KEY, id);
      const p = loadProgress(store.storage);
      const lp = lessonProgress(p, id);
      persistProgress({ ...updateLesson(p, id, { status: lp.status === "completed" ? "completed" : "in-progress", attempts: lp.attempts + 1 }), currentLessonId: id });
    },
    [store, persistProgress],
  );

  // feed simulator events to the runner
  useEffect(() => {
    return store.onEvents((events, state) => {
      setLastEvents(events);
      const explain = events.find((e) => e.type === "EXPLAIN_REQUESTED");
      if (explain && explain.type === "EXPLAIN_REQUESTED") setExplainQuery(explain.term);
      if (!lesson || !runner || mode === "sandbox") return;
      const r = feedEvents(lesson, runner, events, state, mode);
      if (r.runner !== runner) setRunner(r.runner);
      if (r.completed) {
        const p = loadProgress(store.storage);
        const lp = lessonProgress(p, lesson.id);
        const score = scoreFor(r.runner);
        persistProgress(
          updateLesson(p, lesson.id, {
            status: "completed",
            hintsUsed: lp.hintsUsed + r.runner.hintsUsed,
            mistakes: lp.mistakes + r.runner.mistakes,
            bestScore: Math.max(lp.bestScore ?? 0, score),
            completedAt: new Date().toISOString(),
          }),
        );
      }
    });
  }, [store, lesson, runner, mode, persistProgress]);

  const setMode = useCallback(
    (m: AppMode) => {
      setModeState(m);
      store.storage.set(MODE_KEY, m);
      if (m !== "sandbox" && lesson && runner) setRunner(startRunner(lesson));
    },
    [store.storage, lesson, runner],
  );

  const api = useMemo<TutorialApi>(() => {
    const hlq = store.getState().userid;
    const step = lesson && runner ? currentStep(lesson, runner) : undefined;
    const text = (s: string | undefined) => (s ? fillHlq(s, hlq) : "");
    return {
      mode,
      setMode,
      lesson,
      runner,
      step,
      text,
      highlightField: mode === "learn" && step?.highlightField ? fillHlq(step.highlightField, hlq) : undefined,
      startLesson,
      restartLesson: () => lesson && startLesson(lesson.id),
      nextLesson: () => {
        if (!lesson) return;
        const i = LESSONS.findIndex((l) => l.id === lesson.id);
        const n = LESSONS[i + 1];
        if (n) startLesson(n.id);
      },
      showHint: () => runner && setRunner(applyHint(runner)),
      progress,
      resetProgress: () => setProgress(clearProgress(store.storage)),
      score: runner ? scoreFor(runner) : undefined,
      explain: explainQuery ? explainTerm(explainQuery) : undefined,
      explainQuery,
      setExplainQuery,
      lastEvents,
    };
  }, [mode, setMode, lesson, runner, startLesson, progress, explainQuery, lastEvents, store]);

  return <TutorialContext.Provider value={api}>{children}</TutorialContext.Provider>;
}

export function useTutorial(): TutorialApi {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error("useTutorial must be used inside <TutorialProvider>");
  return ctx;
}
