/**
 * Lesson runner: pure functions over RunnerState. The React TutorialProvider
 * feeds it simulator events; it never touches the UI or the simulator directly.
 * Reference: docs/02-architecture.md §Tutorial engine.
 */
import type { SimEvent, SimulatorState } from "@/engine/types";
import type { AppMode, Lesson, LessonContext, RunnerState } from "./types";

export const SCORE = { base: 100, perMistake: 10, perHint: 15 } as const;

export function startRunner(lesson: Lesson): RunnerState {
  return { lessonId: lesson.id, stepIndex: 0, status: lesson.steps.length ? "running" : "completed", hintsUsed: 0, mistakes: 0, completedSteps: [], hintShown: false };
}

export function currentStep(lesson: Lesson, runner: RunnerState) {
  return runner.status === "completed" ? undefined : lesson.steps[runner.stepIndex];
}

export function fillHlq(text: string, hlq: string): string {
  return text.replace(/\{HLQ\}/g, hlq);
}

export interface RunnerUpdate {
  runner: RunnerState;
  advancedSteps: number;
  completed: boolean;
}

/**
 * Feed a batch of events (one Enter/PF press) plus the resulting state.
 * A step passes if its validator accepts any event in the batch, or the state alone.
 * Consecutive steps may pass in one go (e.g. "3.4" satisfies "open Utilities" and "open DSLIST").
 */
export function feedEvents(lesson: Lesson, runner: RunnerState, events: SimEvent[], state: SimulatorState, mode: AppMode): RunnerUpdate {
  if (runner.status === "completed") return { runner, advancedSteps: 0, completed: false };
  const hlq = state.userid;
  let next: RunnerState = runner;
  const errors = events.filter((e) => e.type === "MESSAGE_SHOWN" && e.severity === "error").length;
  if (errors > 0) next = { ...next, mistakes: next.mistakes + errors };

  if (mode === "challenge") {
    const validator = lesson.challenge?.validator ?? lesson.steps[lesson.steps.length - 1]?.validator;
    const ok = validator ? passes(validator, events, state, hlq) : false;
    if (!ok) return { runner: next, advancedSteps: 0, completed: false };
    return { runner: { ...next, status: "completed", stepIndex: lesson.steps.length, completedSteps: lesson.steps.map((s) => s.id) }, advancedSteps: 1, completed: true };
  }

  let advanced = 0;
  while (next.status === "running") {
    const step = lesson.steps[next.stepIndex];
    if (!step || !passes(step.validator, events, state, hlq)) break;
    advanced++;
    const stepIndex = next.stepIndex + 1;
    next = {
      ...next,
      stepIndex,
      completedSteps: [...next.completedSteps, step.id],
      hintShown: false,
      detour: undefined,
      status: stepIndex >= lesson.steps.length ? "completed" : "running",
    };
  }
  if (advanced === 0 && next.status === "running") {
    const detour = describeDetour(events);
    if (detour) next = { ...next, detour };
  }
  return { runner: next, advancedSteps: advanced, completed: next.status === "completed" };
}

function passes(validator: (ctx: LessonContext) => boolean, events: SimEvent[], state: SimulatorState, hlq: string): boolean {
  for (const event of events) if (validator({ event, state, hlq })) return true;
  return validator({ state, hlq });
}

/** A valid ISPF action that did not advance the lesson — used for a gentle nudge, never an error. */
function describeDetour(events: SimEvent[]): string | undefined {
  const opened = events.find((e) => e.type === "SCREEN_OPENED");
  if (opened && opened.type === "SCREEN_OPENED") return `You opened ${opened.screen.replace(/_/g, " ").toLowerCase()}. That is a valid ISPF action; press PF3 to go back if you want to return to the lesson path.`;
  return undefined;
}

export function useHint(runner: RunnerState): RunnerState {
  return runner.hintShown ? runner : { ...runner, hintShown: true, hintsUsed: runner.hintsUsed + 1 };
}

export function scoreFor(runner: RunnerState): number {
  return Math.max(0, SCORE.base - SCORE.perMistake * runner.mistakes - SCORE.perHint * runner.hintsUsed);
}
