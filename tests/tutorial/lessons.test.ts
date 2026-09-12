import { describe, expect, it } from "vitest";
import { Sim } from "../engine/harness";
import { LESSONS, lessonById } from "@/tutorial/lessons";
import { feedEvents, scoreFor, startRunner, useHint } from "@/tutorial/engine";
import type { AppMode, Lesson, RunnerState } from "@/tutorial/types";

/** Drive a lesson: after every simulator step, feed the events to the runner. */
class Coached {
  sim: Sim;
  runner: RunnerState;
  constructor(readonly lesson: Lesson, readonly mode: AppMode = "learn") {
    this.sim = Sim.loggedOn();
    this.runner = startRunner(lesson);
    const start = lesson.startingState?.screen;
    if (start) this.sim.state = { ...this.sim.state, screen: start, stack: [] };
  }
  private feed() {
    const events = this.sim.events;
    this.sim.events = [];
    const r = feedEvents(this.lesson, this.runner, events, this.sim.state, this.mode);
    this.runner = r.runner;
    return r;
  }
  cmd(text: string) {
    this.sim.cmd(text);
    return this.feed();
  }
  enter(fields: Record<string, string>) {
    this.sim.enter(fields);
    return this.feed();
  }
  pf(key: number, fields: Record<string, string> = {}) {
    this.sim.pf(key, fields);
    return this.feed();
  }
  get step() {
    return this.runner.stepIndex;
  }
}

describe("lesson catalogue", () => {
  it("has 14 lessons with unique ids and at least one step each", () => {
    expect(LESSONS.length).toBe(14);
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(14);
    for (const l of LESSONS) expect(l.steps.length).toBeGreaterThan(0);
  });
  it("mentions no personal names", () => {
    expect(JSON.stringify(LESSONS.map((l) => [l.title, l.objective, l.steps.map((s) => [s.instruction, s.hint, s.explanation])]))).not.toMatch(/KOVIE/i);
  });
});

describe("lesson 2 - navigating", () => {
  it("accepts 3 then 4", () => {
    const c = new Coached(lessonById("l02-navigating")!);
    c.cmd("3");
    expect(c.step).toBe(1);
    c.cmd("4");
    expect(c.step).toBe(2);
    c.pf(3);
    expect(c.step).toBe(2);
    c.pf(3);
    expect(c.step).toBe(3);
    c.cmd("3.4");
    expect(c.step).toBe(4);
    c.pf(3);
    c.pf(3);
    expect(c.runner.status).toBe("completed");
  });
  it("accepts 3.4 directly (two steps advance at once)", () => {
    const c = new Coached(lessonById("l02-navigating")!);
    const r = c.cmd("3.4");
    expect(r.advancedSteps).toBe(2);
    expect(c.step).toBe(2);
  });
  it("records a detour without breaking the lesson", () => {
    const c = new Coached(lessonById("l02-navigating")!);
    c.cmd("0");
    expect(c.step).toBe(0);
    expect(c.runner.detour).toMatch(/settings/i);
    c.pf(3);
    c.cmd("3");
    expect(c.step).toBe(1);
  });
  it("counts mistakes from terminal error messages and hints", () => {
    const c = new Coached(lessonById("l02-navigating")!);
    c.cmd("zz");
    expect(c.runner.mistakes).toBe(1);
    c.runner = useHint(c.runner);
    c.runner = useHint(c.runner);
    expect(c.runner.hintsUsed).toBe(1);
    expect(scoreFor(c.runner)).toBe(75);
  });
});

describe("lesson 8 - first edit", () => {
  it("validates the saved catalog contents", () => {
    const c = new Coached(lessonById("l08-first-edit")!);
    c.enter({ level: "USER01.JCL" });
    c.enter({ "cmd:USER01.JCL": "E" });
    c.enter({ "cmd:HELLO": "E" });
    expect(c.step).toBe(1);
    c.enter({ "line:3": "//STEP1    EXEC PGM=IEBGENER" });
    expect(c.step).toBe(2);
    c.enter({ command: "SAVE" });
    expect(c.step).toBe(3);
    c.pf(3);
    expect(c.runner.status).toBe("completed");
  });
});

describe("lesson 9 - line commands", () => {
  it("tracks insert, fill, delete, repeat, save", () => {
    const c = new Coached(lessonById("l09-line-commands")!);
    c.enter({ level: "USER01.JCL" });
    c.enter({ "cmd:USER01.JCL": "E" });
    c.enter({ "cmd:HELLO": "E" });
    c.enter({ "prefix:1": "I00001" });
    expect(c.step).toBe(2);
    const blankId = c.sim.lineIds()[1];
    c.enter({ [`line:${blankId}`]: "//* MY FIRST COMMENT" });
    expect(c.step).toBe(3);
    const notify = c.sim.state.editor!.lines.find((l) => /NOTIFY/.test(l.text))!;
    c.enter({ [`prefix:${notify.id}`]: "D" });
    expect(c.step).toBe(4);
    c.enter({ [`prefix:${blankId}`]: "R" });
    expect(c.step).toBe(5);
    c.pf(3);
    expect(c.runner.status).toBe("completed");
  });
});

describe("lesson 14 - challenge mode", () => {
  it("passes only when the catalog contains the statement", () => {
    const c = new Coached(lessonById("l14-final-challenge")!, "challenge");
    c.cmd("2");
    c.enter({ other: "USER01.JCL(COPYJOB)" });
    expect(c.runner.status).toBe("running");
    c.enter({ "prefix:6": "I" });
    const newId = c.sim.lineIds()[6];
    c.enter({ [`line:${newId}`]: "//STEP2   EXEC PGM=IEFBR14" });
    expect(c.runner.status).toBe("running");
    const r = c.enter({ command: "SAVE" });
    expect(r.completed).toBe(true);
    expect(c.runner.status).toBe("completed");
  });
});

describe("lesson 6 - allocate", () => {
  it("allocates through 3.2 and completes", () => {
    const c = new Coached(lessonById("l06-allocating")!);
    c.cmd("3.2");
    expect(c.step).toBe(1);
    c.enter({ option: "A", other: "USER01.TEST.JCL" });
    expect(c.step).toBe(2);
    c.enter({ dirblocks: "10", recfm: "FB", lrecl: "80" });
    expect(c.step).toBe(3);
    c.pf(3);
    c.cmd("4");
    c.enter({ level: "USER01.TEST" });
    expect(c.runner.status).toBe("completed");
  });
});
