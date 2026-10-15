/**
 * M1 closure: an error the lesson tells the learner to provoke is not a mistake (docs/curriculum/simulator-gap-matrix.md
 * GAP-65). L1 step "type-something" asks for an invalid option; L7 step "try-typing" asks for SAVE in Browse.
 * Any other terminal error still costs a point, and Challenge mode still counts every error.
 */
import { describe, expect, it } from "vitest";
import { lessonById, LESSONS } from "@/tutorial/lessons";
import { Attempt, WALKS } from "./walks";

describe("errors the lesson asks for are free", () => {
  it("L1: the invalid option typed on purpose is not a mistake", () => {
    const c = new Attempt(lessonById("l01-meet-ispf")!);
    c.enter({ userid: "USER01" });
    c.pf(1);
    c.pf(3);
    c.cmd("99");
    expect(c.runner.completedSteps).toContain("type-something");
    expect(c.runner.mistakes).toBe(0);
  });

  it("L1: a second error on the next step is a real slip and still costs a mistake", () => {
    const c = new Attempt(lessonById("l01-meet-ispf")!);
    c.enter({ userid: "USER01" });
    c.pf(1);
    c.pf(3);
    c.cmd("97"); // the step that asks for an error
    c.cmd("98"); // the next step does not
    expect(c.runner.mistakes).toBe(1);
  });

  it("L7: SAVE in Browse, as instructed, is not a mistake", () => {
    const c = new Attempt(lessonById("l07-browse-vs-edit")!);
    c.enter({ level: "USER01.JCL" });
    c.enter({ "cmd:USER01.JCL": "B" });
    c.enter({ "cmd:HELLO": "B" });
    c.cmd("SAVE");
    expect(c.runner.stepIndex).toBe(c.lesson.steps.findIndex((s) => s.id === "try-typing"));
    expect(c.runner.mistakes).toBe(0);
  });

  it("L7: an unrelated error on the step before still costs a mistake", () => {
    const c = new Attempt(lessonById("l07-browse-vs-edit")!);
    c.enter({ level: "USER01.JCL" });
    c.cmd("NOSUCHCMD");
    expect(c.runner.mistakes).toBe(1);
  });

  it("Challenge mode still counts every error", () => {
    const c = new Attempt(lessonById("l07-browse-vs-edit")!, "challenge");
    c.enter({ level: "USER01.JCL" });
    c.enter({ "cmd:USER01.JCL": "B" });
    c.enter({ "cmd:HELLO": "B" });
    c.cmd("SAVE");
    expect(c.runner.mistakes).toBe(1);
  });
});

describe("the legitimate route of every lesson scores 100 in Learn mode", () => {
  it.each(LESSONS.map((l) => l.id))("%s", (id) => {
    const c = new Attempt(lessonById(id)!);
    WALKS[id](c);
    expect(c.done).toBe(true);
    expect({ mistakes: c.runner.mistakes, hints: c.runner.hintsUsed }).toEqual({ mistakes: 0, hints: 0 });
  });
});

describe("new lessons must define their own Challenge (lesson-authoring-standards.md section 5)", () => {
  // Legacy lessons that still fall back to their last step behind the completion guard (ADR 0016). They are covered by the
  // shortcut battery in challenge.test.ts. Do not add to this list: write an outcome check in src/tutorial/challenges.ts.
  const LEGACY_FALLBACK = ["l01-meet-ispf", "l04-finding-data-sets", "l08-first-edit", "l11-find-change", "l12-managing-members", "l26-job-output"];

  it("every other lesson has a challenge", () => {
    const missing = LESSONS.filter((l) => !l.challenge && !LEGACY_FALLBACK.includes(l.id)).map((l) => l.id);
    expect(missing).toEqual([]);
  });

  it("the legacy list only names lessons that still lack one (shrink it when one is added)", () => {
    const stale = LEGACY_FALLBACK.filter((id) => lessonById(id)?.challenge);
    expect(stale).toEqual([]);
  });
});
