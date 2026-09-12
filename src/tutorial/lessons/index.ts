import type { Lesson } from "../types";
import { lesson01, lesson02, lesson03 } from "./module1";
import { lesson04, lesson05, lesson06 } from "./module2";
import { lesson07, lesson08, lesson09, lesson10, lesson11 } from "./module3";
import { lesson12, lesson13 } from "./module4";
import { lesson14 } from "./module5";

export const LESSONS: Lesson[] = [lesson01, lesson02, lesson03, lesson04, lesson05, lesson06, lesson07, lesson08, lesson09, lesson10, lesson11, lesson12, lesson13, lesson14];

export const MODULES = [...new Set(LESSONS.map((l) => l.module))];

export function lessonById(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

export function nextLesson(id: string): Lesson | undefined {
  const i = LESSONS.findIndex((l) => l.id === id);
  return i >= 0 ? LESSONS[i + 1] : undefined;
}
