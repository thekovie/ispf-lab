import type { Lesson } from "../types";
import { lesson01, lesson02, lesson03 } from "./module1";
import { lesson04, lesson05, lesson06 } from "./module2";
import { lesson07, lesson08, lesson09, lesson10, lesson11 } from "./module3";
import { lesson12, lesson13 } from "./module4";
import { lesson14 } from "./module5";
import { lesson15 } from "./module6";
import { lesson16, lesson17, lesson18, lesson19, lesson20, lesson21 } from "./module7-8";
import { lesson22, lesson23, lesson24, lesson25, lesson26, lesson27, lesson28 } from "./module9-10";

export const LESSONS: Lesson[] = [lesson01, lesson02, lesson03, lesson04, lesson05, lesson06, lesson07, lesson08, lesson09, lesson10, lesson11, lesson12, lesson13, lesson14, lesson15, lesson16, lesson17, lesson18, lesson19, lesson20, lesson21, lesson22, lesson23, lesson24, lesson25, lesson26, lesson27, lesson28];

export const MODULES = [...new Set(LESSONS.map((l) => l.module))];

export function lessonById(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

export function nextLesson(id: string): Lesson | undefined {
  const i = LESSONS.findIndex((l) => l.id === id);
  return i >= 0 ? LESSONS[i + 1] : undefined;
}
