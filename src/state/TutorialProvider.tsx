"use client";
/**
 * Tutorial state for the shell: mode, active lesson, runner, progress, Explain drawer.
 * Talks to the simulator only through the store's event stream and semantic actions.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { SimEvent, SimulatorState } from "@/engine/types";
import { STORAGE_PREFIX } from "@/persistence/keys";
import { lessonProgress, loadProgress, resetProgress as clearProgress, saveProgress, updateLesson, type Progress } from "@/persistence/progressStore";
import { answerQuestion, currentStep, feedEvents, fillHlq, scoreFor, startRunner, useHint as applyHint, type RunnerUpdate } from "@/tutorial/engine";
import { explainTerm, type GlossaryEntry } from "@/tutorial/explain";
import { LESSONS, lessonById } from "@/tutorial/lessons";
import { startActions, workAtRisk } from "@/tutorial/scenario";
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
  /** answer a check question (ADR 0018); true when the choice was right */
  answer: (questionId: string, choice: number) => boolean;
  progress: Progress;
  resetProgress: () => void;
  score?: number;
  explain?: GlossaryEntry;
  explainQuery?: string;
  setExplainQuery: (q: string | undefined) => void;
  lastEvents: SimEvent[];
}

const TutorialContext = createContext<TutorialApi | null>(null);

export interface TutorialProviderProps {
  children: ReactNode;
  /**
   * Asked before a lesson start, restart or mode switch that would throw away unsaved or learner-made work. Return
   * false to cancel. Defaults to window.confirm; tests inject a stub. Never called when nothing would be lost.
   */
  confirmDiscard?: (message: string) => boolean;
}

export function TutorialProvider({ children, confirmDiscard }: TutorialProviderProps) {
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

  /**
   * True while startLesson applies a lesson's starting state. Those dispatches are setup, not learner actions:
   * the listener below still holds the previous lesson and runner, so without this guard they could complete it
   * (M0 review F-03, tests/tutorial/provider.test.tsx).
   */
  const applyingStart = useRef(false);

  const persistProgress = useCallback(
    (p: Progress) => {
      setProgress(p);
      saveProgress(store.storage, p);
    },
    [store.storage],
  );

  /**
   * Put the simulator into a lesson's starting state: logged on, session closed (split screens, open editor),
   * scenario data and profiles reset, jobs cleared if asked, starting screen opened. Used for start, restart and
   * mode switch so a lesson always begins from the same known state (ADR 0016).
   */
  const applyLessonStart = useCallback(
    (l: Lesson) => {
      applyingStart.current = true;
      try {
        const start = l.startingState;
        const state: SimulatorState = store.getState();
        if (!state.loggedIn && start?.screen?.id !== "LOGIN") {
          store.dispatch({ type: "ENTER", fields: { userid: state.userid || "USER01" } });
        }
        for (const action of startActions(store.getState(), start)) store.dispatch(action);
      } finally {
        applyingStart.current = false;
      }
    },
    [store],
  );

  /** Ask before discarding work (unsaved edits, learner changes the lesson would restore). True means go ahead. */
  const confirmLoss = useCallback(
    (l: Lesson, what: string): boolean => {
      const unsent = store.unsentWork();
      const items = [...(unsent ? [unsent] : []), ...workAtRisk(store.getState(), l.startingState)];
      if (items.length === 0) return true;
      const message = `${what} will discard:\n- ${items.join("\n- ")}\n\nContinue?`;
      const ask = confirmDiscard ?? ((m: string) => typeof window === "undefined" || window.confirm(m));
      return ask(message);
    },
    [store, confirmDiscard],
  );

  const startLesson = useCallback(
    (id: string) => {
      const l = lessonById(id);
      if (!l) return;
      if (!confirmLoss(l, `Starting lesson ${l.number}`)) return;
      applyLessonStart(l);
      setLessonId(id);
      setRunner(startRunner(l, store.getState()));
      store.storage.set(LESSON_KEY, id);
      const p = loadProgress(store.storage);
      const lp = lessonProgress(p, id);
      persistProgress({ ...updateLesson(p, id, { status: lp.status === "completed" ? "completed" : "in-progress", attempts: lp.attempts + 1 }), currentLessonId: id });
    },
    [store, persistProgress, applyLessonStart, confirmLoss],
  );

  /** Take a runner update: keep the new runner and, when it finished the lesson, record the result. */
  const settle = useCallback(
    (l: Lesson, r: RunnerUpdate) => {
      setRunner(r.runner);
      if (!r.completed) return;
      const p = loadProgress(store.storage);
      const lp = lessonProgress(p, l.id);
      const score = scoreFor(r.runner);
      persistProgress(
        updateLesson(p, l.id, {
          status: "completed",
          hintsUsed: lp.hintsUsed + r.runner.hintsUsed,
          mistakes: lp.mistakes + r.runner.mistakes,
          bestScore: Math.max(lp.bestScore ?? 0, score),
          completedAt: new Date().toISOString(),
        }),
      );
    },
    [store, persistProgress],
  );

  // feed simulator events to the runner
  useEffect(() => {
    return store.onEvents((events, state) => {
      if (applyingStart.current) return;
      setLastEvents(events);
      const explain = events.find((e) => e.type === "EXPLAIN_REQUESTED");
      if (explain && explain.type === "EXPLAIN_REQUESTED") setExplainQuery(explain.term);
      if (!lesson || !runner || mode === "sandbox") return;
      settle(lesson, feedEvents(lesson, runner, events, state, mode));
    });
  }, [store, lesson, runner, mode, settle]);

  const setMode = useCallback(
    (m: AppMode) => {
      const restarts = m !== "sandbox" && !!lesson && !!runner;
      if (restarts && !confirmLoss(lesson, "Switching mode restarts this lesson and")) return;
      setModeState(m);
      store.storage.set(MODE_KEY, m);
      if (restarts && lesson) {
        // A new mode is a fresh attempt: same starting state as a restart, so leftovers cannot complete it.
        applyLessonStart(lesson);
        setRunner(startRunner(lesson, store.getState()));
      }
    },
    [store, lesson, runner, applyLessonStart, confirmLoss],
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
      answer: (questionId: string, choice: number) => {
        const q = lesson?.questions?.find((x) => x.id === questionId);
        if (!lesson || !runner || !q || mode === "sandbox") return false;
        settle(lesson, answerQuestion(lesson, runner, questionId, choice, store.getState(), mode));
        return choice === q.correct;
      },
      progress,
      resetProgress: () => setProgress(clearProgress(store.storage)),
      score: runner ? scoreFor(runner) : undefined,
      explain: explainQuery ? explainTerm(explainQuery) : undefined,
      explainQuery,
      setExplainQuery,
      lastEvents,
    };
  }, [mode, setMode, lesson, runner, startLesson, progress, explainQuery, lastEvents, store, settle]);

  return <TutorialContext.Provider value={api}>{children}</TutorialContext.Provider>;
}

export function useTutorial(): TutorialApi {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error("useTutorial must be used inside <TutorialProvider>");
  return ctx;
}
