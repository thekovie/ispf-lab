/**
 * Challenge-mode regression suite (M1a). Converts the Phase 0 / M0 exploratory probes into assertions.
 *
 * For all 28 lessons:
 *  - the legitimate route completes the lesson in Learn mode and in Challenge mode;
 *  - nothing completes it from the start state, and none of the cheap shortcuts found by the probes does;
 *  - it can be run twice in a row and after any other lesson's route (scenario isolation).
 *
 * Findings covered: M0 review F-01 (Challenge shortcuts, zero-action completion), F-02 and F-16 (replay and
 * leftover state), docs/curriculum/evidence/probes/. See ADR 0016.
 */
import { describe, expect, it } from "vitest";
import { LESSONS } from "@/tutorial/lessons";
import { Attempt, SHORTCUTS, WALKS } from "./walks";

describe("route scripts", () => {
  it("exist for every lesson and for no other id", () => {
    expect(Object.keys(WALKS).sort()).toEqual(LESSONS.map((l) => l.id).sort());
  });
});

describe.each(LESSONS)("lesson $number $id", (lesson) => {
  it("the legitimate route completes it in Learn mode", () => {
    const c = new Attempt(lesson, "learn");
    WALKS[lesson.id](c);
    expect(c.runner.status).toBe("completed");
  });

  it("the legitimate route completes it in Challenge mode", () => {
    const c = new Attempt(lesson, "challenge");
    WALKS[lesson.id](c);
    expect(c.runner.status).toBe("completed");
  });

  it("is not completed by doing nothing (the zero-action vulnerability)", () => {
    const c = new Attempt(lesson, "challenge");
    c.enter({});
    expect(c.runner.status).toBe("running");
  });

  it.each(Object.entries(SHORTCUTS))("is not completed by the shortcut: %s", (_name, shortcut) => {
    const c = new Attempt(lesson, "challenge");
    shortcut(c);
    expect(c.runner.status).toBe("running");
  });

  it("can be run twice in a row (replay)", () => {
    const first = new Attempt(lesson, "challenge");
    WALKS[lesson.id](first);
    expect(first.done).toBe(true);
    const second = new Attempt(lesson, "challenge", first.sim);
    WALKS[lesson.id](second);
    expect(second.done).toBe(true);
  });
});

describe("Learn then Challenge on the same data (stale state)", () => {
  it.each(LESSONS)("lesson $number $id: the Learn result cannot complete the Challenge", (lesson) => {
    const learn = new Attempt(lesson, "learn");
    WALKS[lesson.id](learn);
    expect(learn.done).toBe(true);
    // the learner switches mode: same simulator, starting state re-applied, fresh runner
    const challenge = new Attempt(lesson, "challenge", learn.sim);
    challenge.enter({});
    challenge.pf(7);
    expect(challenge.runner.status).toBe("running");
  });
});

describe("scenario isolation", () => {
  // Every lesson must still work when the learner has just finished any other lesson.
  const cases = LESSONS.flatMap((before) => LESSONS.map((after) => [before.id, after.id] as const));
  it.each(cases)("after %s, lesson %s still completes", (beforeId, afterId) => {
    const before = LESSONS.find((l) => l.id === beforeId)!;
    const after = LESSONS.find((l) => l.id === afterId)!;
    const first = new Attempt(before, "challenge");
    WALKS[before.id](first);
    const next = new Attempt(after, "challenge", first.sim);
    WALKS[after.id](next);
    expect(next.done).toBe(true);
  });
});
