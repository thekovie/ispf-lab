import { KEYS } from "./keys";
import type { StorageAdapter } from "./storage";

export interface LessonProgress {
  status: "not-started" | "in-progress" | "completed";
  attempts: number;
  hintsUsed: number;
  mistakes: number;
  bestScore?: number;
  completedAt?: string;
}

export interface Progress {
  version: 1;
  currentLessonId?: string;
  lessons: Record<string, LessonProgress>;
}

export const EMPTY_PROGRESS: Progress = { version: 1, lessons: {} };

export function loadProgress(storage: StorageAdapter): Progress {
  const p = storage.get<Progress>(KEYS.progress);
  return p && p.version === 1 ? p : EMPTY_PROGRESS;
}

export function saveProgress(storage: StorageAdapter, progress: Progress): void {
  storage.set(KEYS.progress, progress);
}

export function resetProgress(storage: StorageAdapter): Progress {
  storage.remove(KEYS.progress);
  return EMPTY_PROGRESS;
}

export function lessonProgress(progress: Progress, lessonId: string): LessonProgress {
  return progress.lessons[lessonId] ?? { status: "not-started", attempts: 0, hintsUsed: 0, mistakes: 0 };
}

export function updateLesson(progress: Progress, lessonId: string, patch: Partial<LessonProgress>): Progress {
  return {
    ...progress,
    lessons: { ...progress.lessons, [lessonId]: { ...lessonProgress(progress, lessonId), ...patch } },
  };
}
