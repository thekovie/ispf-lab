/**
 * Soft prerequisites: which lessons named in `requires` the learner has not completed yet. Advice only (ADR 0017);
 * nothing is locked. Pure TypeScript.
 */
import { lessonProgress, type Progress } from "@/persistence/progressStore";
import type { Lesson } from "./types";

export function missingPrerequisites(lesson: Lesson, lessons: Lesson[], progress: Progress): Lesson[] {
  const wanted = new Set(lesson.requires ?? []);
  return lessons.filter((l) => wanted.has(l.id) && lessonProgress(progress, l.id).status !== "completed").sort((a, b) => a.number - b.number);
}
