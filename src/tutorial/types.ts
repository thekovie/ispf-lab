/**
 * Declarative lesson model. Lessons never touch the UI: they validate simulator
 * events and state. Reference: docs/05-course-design.md, docs/02-architecture.md §Tutorial engine.
 */
import type { ScreenFrame, SimEvent, SimulatorState } from "@/engine/types";

export type AppMode = "learn" | "practice" | "challenge" | "sandbox";

export interface LessonContext {
  /** the event being examined; undefined when validating state alone */
  event?: SimEvent;
  state: SimulatorState;
  /** the learner's high-level qualifier (userid) */
  hlq: string;
}

export type Validator = (ctx: LessonContext) => boolean;

export interface LessonStep {
  id: string;
  /** what to do now (Learn mode). {HLQ} is replaced with the userid. */
  instruction: string;
  /** why it matters (Learn mode) */
  explanation?: string;
  hint: string;
  validator: Validator;
  /** field id to hint visually in Learn mode */
  highlightField?: string;
}

export interface LessonStart {
  /** screen to open when the lesson starts (stack is cleared) */
  screen?: ScreenFrame;
  /** members to restore from the seed before starting */
  resetMembers?: { dsn: string; member: string }[];
  /** clear the virtual JES (jobs and log) before starting */
  resetJobs?: boolean;
}

export interface Lesson {
  id: string;
  number: number;
  module: string;
  title: string;
  description: string;
  objective: string;
  /** what the learner should know afterwards */
  teaches: string[];
  startingState?: LessonStart;
  steps: LessonStep[];
  /** Challenge mode: the final-state check (defaults to the last step's validator) */
  challenge?: { task: string; validator: Validator };
}

export interface RunnerState {
  lessonId: string;
  stepIndex: number;
  status: "running" | "completed";
  hintsUsed: number;
  mistakes: number;
  /** ids of steps completed, for the progress display */
  completedSteps: string[];
  hintShown: boolean;
  /** last valid-but-unexpected action, so the coach can gently redirect */
  detour?: string;
}
