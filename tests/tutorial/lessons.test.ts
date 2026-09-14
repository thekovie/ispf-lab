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
  it("has 28 lessons, numbered in order, with unique ids and at least one step each", () => {
    expect(LESSONS.length).toBe(28);
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(28);
    expect(LESSONS.map((l) => l.number)).toEqual(LESSONS.map((_, i) => i + 1));
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

describe("lesson 15 - split screen", () => {
  it("walks split, browse in screen 2, swap, end screen", () => {
    const c = new Coached(lessonById("l15-split-screen")!);
    c.cmd("2");
    c.enter({ other: "USER01.JCL(HELLO)" });
    expect(c.step).toBe(1);
    c.pf(2);
    expect(c.step).toBe(2);
    c.cmd("1");
    c.enter({ other: "USER01.JCL(COPYJOB)" });
    expect(c.step).toBe(3);
    c.pf(9);
    expect(c.step).toBe(3);
    c.pf(9);
    expect(c.step).toBe(4);
    c.pf(3);
    c.pf(3);
    c.pf(3);
    expect(c.step).toBe(5);
    c.pf(3);
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

describe("lessons 16-21 - navigation mastery and editor power tools", () => {
  it("16 jump and RETURN", () => {
    const c = new Coached(lessonById("l16-jump-return")!);
    c.cmd("3.4");
    c.enter({ level: "USER01" });
    expect(c.step).toBe(1);
    c.cmd("=2");
    expect(c.step).toBe(2);
    c.enter({ other: "USER01.JCL(HELLO)" });
    expect(c.step).toBe(3);
    c.cmd("=3.4");
    expect(c.step).toBe(4);
    c.pf(4);
    expect(c.runner.status).toBe("completed");
  });
  it("17 retrieve and multiple line commands", () => {
    const c = new Coached(lessonById("l17-retrieve-multi")!);
    c.cmd("3.4");
    c.enter({ level: "USER01" });
    c.enter({ "cmd:USER01.COBOL": "X", "cmd:USER01.DATA": "X" });
    expect(c.step).toBe(2);
    c.cmd("RESET");
    expect(c.step).toBe(3);
    c.pf(12);
    expect(c.step).toBe(4);
    c.pf(3);
    c.pf(3);
    c.pf(12);
    c.pf(12);
    c.pf(12);
    expect(c.sim.state.fieldValues.option).toBe("3.4");
    c.enter({ option: "3.4" });
    expect(c.runner.status).toBe("completed");
  });
  it("18 COLS and BOUNDS", () => {
    const c = new Coached(lessonById("l18-cols-bounds")!);
    c.cmd("2");
    c.enter({ other: "USER01.COBOL(HELLO)" });
    c.enter({ command: "COLS" });
    expect(c.step).toBe(2);
    c.enter({ command: "BOUNDS 8 72" });
    expect(c.step).toBe(3);
    c.enter({ command: "FIND DIVISION" });
    expect(c.step).toBe(4);
    c.enter({ command: "RESET" });
    expect(c.step).toBe(5);
    c.pf(3);
    expect(c.runner.status).toBe("completed");
  });
  it("19 profiles persist across members", () => {
    const c = new Coached(lessonById("l19-profiles")!);
    c.cmd("2");
    c.enter({ other: "USER01.JCL(HELLO)" });
    c.enter({ command: "PROFILE" });
    expect(c.step).toBe(2);
    c.enter({ command: "CAPS ON" });
    expect(c.step).toBe(3);
    c.pf(3);
    c.enter({ other: "USER01.JCL(COPYJOB)" });
    expect(c.step).toBe(4);
    c.enter({ command: "CAPS OFF" });
    c.pf(3);
    expect(c.runner.status).toBe("completed");
  });
  it("20 UNDO and recovery", () => {
    const c = new Coached(lessonById("l20-undo-recovery")!);
    c.cmd("2");
    c.enter({ other: "USER01.JCL(HELLO)" });
    c.enter({ "prefix:3": "D" });
    expect(c.step).toBe(2);
    c.enter({ command: "UNDO" });
    expect(c.step).toBe(3);
    c.enter({ command: "RECOVERY ON" });
    expect(c.step).toBe(4);
    c.enter({ command: "CANCEL" });
    expect(c.runner.status).toBe("completed");
  });
  it("21 exclude, FLIP, RESET", () => {
    const c = new Coached(lessonById("l21-exclude-flip")!);
    c.cmd("2");
    c.enter({ other: "USER01.COBOL(HELLO)" });
    c.enter({ command: "X DIVISION ALL" });
    expect(c.step).toBe(2);
    c.enter({ command: "FLIP" });
    expect(c.step).toBe(3);
    c.enter({ command: "RESET" });
    expect(c.step).toBe(4);
    c.pf(3);
    expect(c.runner.status).toBe("completed");
  });
});

describe("lessons 22-28 - lists in depth, batch jobs and SDSF", () => {
  it("22 advanced DSLIST", () => {
    const c = new Coached(lessonById("l22-dslist-advanced")!);
    c.cmd("3.4");
    c.enter({ level: "USER01" });
    c.cmd("SORT LRECL D");
    c.cmd("FIND COBOL");
    c.cmd("EXCLUDE LOADLIB");
    expect(c.step).toBe(4);
    c.enter({ "cmd:USER01.JCL": "S" });
    expect(c.step).toBe(5);
    c.pf(3);
    c.cmd("RESET");
    expect(c.runner.status).toBe("completed");
  });
  it("23 member statistics", () => {
    const c = new Coached(lessonById("l23-member-info")!);
    c.cmd("2");
    c.enter({ other: "USER01.JCL" });
    c.enter({ "cmd:HELLO": "I" });
    expect(c.step).toBe(2);
    c.pf(3);
    c.enter({ "cmd:HELLO": "G" });
    expect(c.step).toBe(3);
    c.enter({ "cmd:HELLO": "I" });
    expect(c.step).toBe(4);
    c.pf(3);
    expect(c.runner.status).toBe("completed");
  });
  it("24 submit from Edit", () => {
    const c = new Coached(lessonById("l24-submit")!);
    c.cmd("2");
    c.enter({ other: "USER01.JCL(HELLO)" });
    c.enter({ command: "SUBMIT" });
    expect(c.step).toBe(2);
    c.pf(3);
    expect(c.runner.status).toBe("completed");
  });
  it("25 SDSF status", () => {
    const c = new Coached(lessonById("l25-sdsf-status")!);
    c.cmd("2");
    c.enter({ other: "USER01.JCL" });
    c.enter({ "cmd:HELLO": "J" });
    expect(c.step).toBe(2);
    c.cmd("=S");
    c.cmd("ST");
    expect(c.step).toBe(3);
    c.enter({ "cmd:JOB00001": "S" });
    expect(c.step).toBe(4);
    c.pf(3);
    c.pf(3);
    expect(c.runner.status).toBe("completed");
  });
  it("26 job output data sets", () => {
    const c = new Coached(lessonById("l26-job-output")!);
    c.cmd("TSO SUBMIT JCL(SORTJOB)");
    expect(c.step).toBe(1);
    c.cmd("=S");
    c.cmd("ST");
    c.enter({ "cmd:JOB00001": "?" });
    expect(c.step).toBe(3);
    c.enter({ "cmd:SORTOUT": "S" });
    expect(c.step).toBe(4);
    c.pf(3);
    c.enter({ "cmd:JESMSGLG": "S" });
    expect(c.step).toBe(5);
    c.pf(3);
    expect(c.runner.status).toBe("completed");
  });
  it("27 debug a JCL ERROR end to end", () => {
    const c = new Coached(lessonById("l27-jcl-error")!);
    c.cmd("TSO SUBMIT JCL(PAYRPT)");
    expect(c.step).toBe(1);
    c.cmd("=S");
    c.cmd("ST");
    expect(c.step).toBe(2);
    c.enter({ "cmd:JOB00001": "?" });
    c.enter({ "cmd:JESYSMSG": "S" });
    expect(c.step).toBe(3);
    c.pf(3);
    c.pf(3);
    c.enter({ "cmd:JOB00001": "SJ" });
    expect(c.step).toBe(4);
    c.enter({ command: "C PAYROLL.DATA DATA(EMPLOYEE)" });
    expect(c.step).toBe(5);
    c.enter({ command: "SUBMIT" });
    expect(c.step).toBe(6);
    c.pf(3);
    expect(c.runner.status).toBe("completed");
  });
  it("28 Day-One challenge validates from state alone in Challenge mode", () => {
    const c = new Coached(lessonById("l28-day-one")!, "challenge");
    c.cmd("2");
    c.enter({ other: "USER01.JCL(PAYRPT)" });
    c.enter({ command: "C PAYROLL.DATA DATA(EMPLOYEE)" });
    c.enter({ command: "SUBMIT" });
    expect(c.runner.status).toBe("running"); // editor still open
    c.pf(3);
    expect(c.runner.status).toBe("completed");
  });
  it("28 Day-One learn path", () => {
    const c = new Coached(lessonById("l28-day-one")!);
    c.cmd("TSO SUBMIT JCL(PAYRPT)");
    expect(c.step).toBe(1);
    c.cmd("=S");
    c.cmd("ST");
    c.enter({ "cmd:JOB00001": "?" });
    c.enter({ "cmd:JESYSMSG": "S" });
    expect(c.step).toBe(2);
    c.pf(3);
    c.pf(3);
    c.enter({ "cmd:JOB00001": "SJ" });
    c.enter({ command: "C PAYROLL.DATA DATA(EMPLOYEE)" });
    c.enter({ command: "SUBMIT" });
    c.pf(3);
    expect(c.step).toBe(3);
    c.enter({ "cmd:JOB00002": "?" });
    c.enter({ "cmd:SYSUT2": "S" });
    expect(c.runner.status).toBe("completed");
  });
});
