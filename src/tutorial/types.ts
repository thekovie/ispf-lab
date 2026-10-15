/**
 * Declarative lesson model. Lessons never touch the UI: they validate simulator
 * events and state. Reference: docs/05-course-design.md, docs/02-architecture.md §Tutorial engine.
 */
import type { ScreenFrame, SimEvent, SimulatorState } from "@/engine/types";
import type { Settings } from "@/persistence/settingsStore";

export type AppMode = "learn" | "practice" | "challenge" | "sandbox";

export interface LessonContext {
  /** the event being examined; undefined when validating state alone */
  event?: SimEvent;
  state: SimulatorState;
  /** the learner's high-level qualifier (userid) */
  hlq: string;
  /** Challenge mode only: every event since the Challenge started, including this batch (oldest first) */
  history?: SimEvent[];
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
  /** the step tells the learner to provoke a terminal error (invalid option, SAVE in Browse): it is not scored as a mistake */
  expectsError?: boolean;
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
  /** data sets to delete before starting (leftovers a previous run created); {HLQ} allowed */
  removeDatasets?: string[];
  /** members to delete before starting; {HLQ} allowed in dsn */
  removeMembers?: { dsn: string; member: string }[];
  /** empty PDS data sets to (re)create before starting, replacing any existing one; {HLQ} allowed */
  createDatasets?: { dsn: string; dirBlocks: number }[];
  /** edit profiles to reset to their defaults, by profile name (e.g. "JCL") */
  resetProfiles?: string[];
  /** empty the ISPF retrieve (F12) stack */
  clearRetrieve?: boolean;
  /** option 0 settings to put back to their defaults (only those the lesson teaches) */
  resetSettings?: (keyof Settings)[];
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
  /**
   * Challenge guard (ADR 0016): true once the outcome check has been seen false since the Challenge started.
   * A lesson can complete only when armed. Undefined until the runner is started with a baseline state.
   */
  armed?: boolean;
  /** Challenge mode only: events since the Challenge started (capped), handed to validators as `history` */
  history?: SimEvent[];
}
