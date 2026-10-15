/**
 * M2: optional lesson metadata (`requires`, `sources`) and the start-stack rule for lesson starting screens.
 * Decisions: docs/adr/0017-lesson-metadata-and-start-stack.md. `sources` is checked for format only (the M0 review rejected a
 * code-side registry that fails the build on broken ids).
 */
import { describe, expect, it } from "vitest";
import { lessonProgress, type Progress } from "@/persistence/progressStore";
import { missingPrerequisites } from "@/tutorial/prerequisites";
import { LESSONS, lessonById } from "@/tutorial/lessons";
import type { Lesson } from "@/tutorial/types";
import { Attempt } from "./walks";

const progress = (done: string[]): Progress => ({
  version: 1,
  lessons: Object.fromEntries(done.map((id) => [id, { status: "completed", attempts: 1, hintsUsed: 0, mistakes: 0 }])),
});

describe("requires", () => {
  it("names existing lessons that come earlier in the course, once each, never itself", () => {
    for (const l of LESSONS) {
      const seen = new Set<string>();
      for (const id of l.requires ?? []) {
        const req = lessonById(id);
        expect(req, `${l.id} requires unknown lesson ${id}`).toBeDefined();
        expect(id, `${l.id} requires itself`).not.toBe(l.id);
        expect(req!.number, `${l.id} requires a later lesson ${id}`).toBeLessThan(l.number);
        expect(seen.has(id), `${l.id} repeats ${id}`).toBe(false);
        seen.add(id);
      }
    }
  });

  it("lesson 13 declares the allocation lesson its text refers to", () => {
    expect(lessonById("l13-copy-across")!.requires).toEqual(["l06-allocating"]);
  });
});

describe("sources", () => {
  it("are SRC ids with an optional #anchor, listed once", () => {
    for (const l of LESSONS) {
      const list = l.sources ?? [];
      for (const s of list) expect(s, `${l.id}`).toMatch(/^SRC-\d{3}(#[A-Za-z0-9._-]+)?$/);
      expect(new Set(list).size, `${l.id} repeats a source`).toBe(list.length);
    }
  });
});

describe("missingPrerequisites", () => {
  const lessons = [
    { id: "a", number: 1 },
    { id: "b", number: 2 },
    { id: "c", number: 3, requires: ["a", "b"] },
    { id: "d", number: 4 },
  ] as unknown as Lesson[];

  it("is empty for a lesson without requires", () => {
    expect(missingPrerequisites(lessons[3], lessons, progress([]))).toEqual([]);
  });

  it("lists the required lessons that are not completed, in course order", () => {
    expect(missingPrerequisites(lessons[2], lessons, progress([])).map((l) => l.id)).toEqual(["a", "b"]);
    expect(missingPrerequisites(lessons[2], lessons, progress(["b"])).map((l) => l.id)).toEqual(["a"]);
  });

  it("is empty once everything required is completed", () => {
    expect(missingPrerequisites(lessons[2], lessons, progress(["a", "b"]))).toEqual([]);
  });

  it("ignores an unknown id instead of failing", () => {
    const odd = { id: "x", number: 9, requires: ["nope"] } as unknown as Lesson;
    expect(missingPrerequisites(odd, lessons, progress([]))).toEqual([]);
  });

  it("an in-progress lesson does not count as completed", () => {
    const p: Progress = { version: 1, lessons: { a: { status: "in-progress", attempts: 1, hintsUsed: 0, mistakes: 0 } } };
    expect(lessonProgress(p, "a").status).toBe("in-progress");
    expect(missingPrerequisites(lessons[2], lessons, p).map((l) => l.id)).toEqual(["a", "b"]);
  });
});

describe("start screens (GAP-73)", () => {
  const startsAway = LESSONS.filter((l) => l.startingState?.screen && !["PRIMARY_OPTION_MENU", "LOGIN"].includes(l.startingState.screen.id));

  it("a lesson that starts on a panel below the menu puts the menu under it", () => {
    expect(startsAway.length).toBeGreaterThan(0);
    const without = startsAway.filter((l) => !l.startingState?.underMenu).map((l) => l.id);
    expect(without).toEqual([]);
  });

  it.each(startsAway.map((l) => l.id))("%s: PF3 on the first panel returns to the Primary Option Menu", (id) => {
    const c = new Attempt(lessonById(id)!);
    c.pf(3);
    expect(c.sim.state.screen.id).toBe("PRIMARY_OPTION_MENU");
  });

  it("the menu under the start screen does not count as learner activity", () => {
    const c = new Attempt(lessonById("l05-data-sets-and-members")!);
    expect(c.runner.completedSteps).toEqual([]);
    expect(c.runner.mistakes).toBe(0);
  });
});
