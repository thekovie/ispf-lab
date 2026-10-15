import { CHALLENGES } from "../challenges";
import type { Lesson } from "../types";
import { lesson01, lesson02, lesson03 } from "./module1";
import { lesson04, lesson05, lesson06 } from "./module2";
import { lesson07, lesson08, lesson09, lesson10, lesson11 } from "./module3";
import { lesson12, lesson13 } from "./module4";
import { lesson14 } from "./module5";
import { lesson15 } from "./module6";
import { lesson16, lesson17, lesson18, lesson19, lesson20, lesson21 } from "./module7-8";
import { lesson22, lesson23, lesson24, lesson25, lesson26, lesson27, lesson28 } from "./module9-10";
import { lessonA01, lessonB01, lessonB02, lessonB03, lessonB04, lessonB05, lessonB06, lessonB10 } from "./module11";

/** A lesson's own `challenge` wins; otherwise its outcome check from src/tutorial/challenges.ts (ADR 0016). */
const withChallenge = (lesson: Lesson): Lesson => (lesson.challenge || !CHALLENGES[lesson.id] ? lesson : { ...lesson, challenge: CHALLENGES[lesson.id] });

/**
 * Display order (ADR 0018). `id` and `number` are stable identifiers (stored progress keys on id); this array is only the
 * order learners see, so the new lessons sit where they teach best and the original 28 keep their relative order.
 * Keep each module's lessons adjacent and every lesson after the ones it `requires`.
 */
const ALL: Lesson[] = [
  ...[lesson01, lesson02, lesson03, lesson04, lesson05, lesson06],
  lessonB02,
  ...[lesson07, lesson08],
  lessonA01,
  ...[lesson09, lesson10, lesson11, lesson12, lesson13, lesson14, lesson15, lesson16, lesson17, lesson18, lesson19, lesson20, lesson21, lesson22, lesson23],
  lessonB01,
  ...[lesson24, lesson25, lesson26],
  ...[lessonB03, lessonB04, lessonB05],
  lesson27,
  ...[lessonB06, lessonB10],
  lesson28,
].map(withChallenge);

/** Draft lessons are for reviewers: shown only when NEXT_PUBLIC_SHOW_DRAFT_LESSONS=1 (set by `next dev`, see next.config.ts). */
const SHOW_DRAFTS = process.env.NEXT_PUBLIC_SHOW_DRAFT_LESSONS === "1";

export const LESSONS: Lesson[] = ALL.filter((l) => SHOW_DRAFTS || !l.draft);

export const MODULES = [...new Set(LESSONS.map((l) => l.module))];

export function lessonById(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

export function nextLesson(id: string): Lesson | undefined {
  const i = LESSONS.findIndex((l) => l.id === id);
  return i >= 0 ? LESSONS[i + 1] : undefined;
}
