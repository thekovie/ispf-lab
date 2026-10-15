/**
 * D3 validation (ADR 0016): each Challenge outcome check must accept legitimate alternative workflows and must
 * reject plausible wrong answers, not just the single Learn route.
 */
import { describe, expect, it } from "vitest";
import { lessonById } from "@/tutorial/lessons";
import { Attempt, type Script } from "./walks";

const HLQ = "USER01";
const entry = (dsn: string) => ({ project: "", group: "", type: "", member: "", other: dsn });

function challenge(id: string, script: Script): Attempt {
  const c = new Attempt(lessonById(id)!, "challenge");
  script(c);
  return c;
}

describe("alternative legitimate routes are accepted", () => {
  it("L2: menu route plus a jump counts as two different ways", () => {
    const c = challenge("l02-navigating", (a) => {
      a.cmd("3");
      a.cmd("4");
      a.pf(3);
      a.pf(3);
      a.cmd("=3.4");
      a.cmd("RETURN");
    });
    expect(c.done).toBe(true);
  });

  it("L2: typed 3.4 plus a jump counts as two different ways", () => {
    const c = challenge("l02-navigating", (a) => {
      a.cmd("3.4");
      a.pf(4);
      a.cmd("=3.4");
      a.pf(4);
    });
    expect(c.done).toBe(true);
  });

  it("L3: LISTCAT typed on the Option line instead of the option 6 shell", () => {
    const c = challenge("l03-settings-tso", (a) => {
      a.cmd("0");
      a.pf(3, { scroll: "HALF" });
      a.cmd(`TSO LISTCAT LEVEL(${HLQ})`);
    });
    expect(c.done).toBe(true);
  });

  it("L5: member list through option 2 and short information with S", () => {
    const c = challenge("l05-data-sets-and-members", (a) => {
      a.cmd("=2");
      a.enter(entry(`${HLQ}.JCL`));
      a.pf(3);
      a.cmd("=3.4");
      a.enter({ level: HLQ });
      a.enter({ [`cmd:${HLQ}.JCL`]: "S" });
    });
    expect(c.done).toBe(true);
  });

  it("L6: finds the new library with a wider level than the one in the lesson", () => {
    const c = challenge("l06-allocating", (a) => {
      a.cmd("3.2");
      a.enter({ option: "A", other: `${HLQ}.TEST.JCL` });
      a.enter({ dirblocks: "12", recfm: "FB", lrecl: "80" });
      a.cmd("=3.4");
      a.enter({ level: HLQ });
    });
    expect(c.done).toBe(true);
  });

  it("L9: deletes and repeats different records and saves with SAVE instead of PF3", () => {
    const c = challenge("l09-line-commands", (a) => {
      a.cmd("=2");
      a.enter(entry(`'${HLQ}.JCL(HELLO)'`));
      a.enter({ "prefix:1": "I00001" });
      a.enter({ [`line:${a.sim.lineIds()[1]}`]: "//* A COMMENT" });
      a.enter({ [`prefix:${a.lineId(/EXEC/)}`]: "D" });
      a.enter({ [`prefix:${a.lineId(/JOB/)}`]: "R" });
      a.enter({ command: "SAVE" });
    });
    expect(c.done).toBe(true);
  });

  it("L16: RETURN typed instead of PF4, and the first jump made from the Primary Option Menu", () => {
    const c = challenge("l16-jump-return", (a) => {
      a.cmd("=2");
      a.enter(entry(`'${HLQ}.JCL(HELLO)'`));
      a.cmd("=3.4");
      a.cmd("RETURN");
    });
    expect(c.done).toBe(true);
  });

  it("L18: BNDS spelling of the bounds command", () => {
    const c = challenge("l18-cols-bounds", (a) => {
      a.cmd("=2");
      a.enter(entry(`'${HLQ}.COBOL(HELLO)'`));
      a.enter({ command: "BNDS 8 72" });
      a.enter({ command: "COLS" });
      a.enter({ command: "FIND DIVISION" });
      a.enter({ command: "RESET" });
    });
    expect(c.done).toBe(true);
  });

  it("L20: RECOVERY ON before the delete", () => {
    const c = challenge("l20-undo-recovery", (a) => {
      a.cmd("=2");
      a.enter(entry(`'${HLQ}.JCL(HELLO)'`));
      a.enter({ command: "RECOVERY ON" });
      a.enter({ "prefix:3": "D" });
      a.enter({ command: "UNDO" });
      a.enter({ command: "CANCEL" });
    });
    expect(c.done).toBe(true);
  });

  it("L21: the long EXCLUDE spelling", () => {
    const c = challenge("l21-exclude-flip", (a) => {
      a.cmd("=2");
      a.enter(entry(`'${HLQ}.COBOL(HELLO)'`));
      a.enter({ command: "EXCLUDE DIVISION ALL" });
      a.enter({ command: "FLIP" });
      a.enter({ command: "RESET" });
    });
    expect(c.done).toBe(true);
  });

  it("L22: excludes with the X line command instead of EXCLUDE", () => {
    const c = challenge("l22-dslist-advanced", (a) => {
      a.cmd("=3.4");
      a.enter({ level: HLQ });
      a.cmd("SORT LRECL D");
      a.cmd("FIND COBOL");
      a.enter({ [`cmd:${HLQ}.LOADLIB`]: "X" });
      a.enter({ [`cmd:${HLQ}.JCL`]: "S" });
      a.pf(3);
      a.cmd("RESET");
    });
    expect(c.done).toBe(true);
  });

  it("L23: member list reached through 3.4 and M", () => {
    const c = challenge("l23-member-info", (a) => {
      a.cmd("=3.4");
      a.enter({ level: HLQ });
      a.enter({ [`cmd:${HLQ}.JCL`]: "M" });
      a.enter({ "cmd:HELLO": "I" });
      a.pf(3);
      a.enter({ "cmd:HELLO": "G" });
      a.enter({ "cmd:HELLO": "I" });
    });
    expect(c.done).toBe(true);
  });

  it("L25: the job is submitted with SUBMIT in the editor instead of J", () => {
    const c = challenge("l25-sdsf-status", (a) => {
      a.cmd("=2");
      a.enter(entry(`'${HLQ}.JCL(HELLO)'`));
      a.enter({ command: "SUBMIT" });
      a.cmd("=S");
      a.cmd("ST");
      a.enter({ "cmd:JOB00001": "S" });
    });
    expect(c.done).toBe(true);
  });
});

describe("plausible wrong answers are rejected", () => {
  it("L2: the same route twice is not two different ways", () => {
    const c = challenge("l02-navigating", (a) => {
      a.cmd("3");
      a.cmd("4");
      a.pf(3);
      a.pf(3);
      a.cmd("3");
      a.cmd("4");
      a.pf(3);
      a.pf(3);
    });
    expect(c.done).toBe(false);
  });

  it("L3: a setting change alone, without LISTCAT", () => {
    const c = challenge("l03-settings-tso", (a) => {
      a.cmd("0");
      a.pf(3, { scroll: "HALF" });
    });
    expect(c.done).toBe(false);
  });

  it("L6: a sequential data set (no directory blocks) is not the requested PDS", () => {
    const c = challenge("l06-allocating", (a) => {
      a.cmd("3.2");
      a.enter({ option: "A", other: `${HLQ}.TEST.JCL` });
      a.enter({ dirblocks: "0", recfm: "FB", lrecl: "80" });
      a.cmd("=3.4");
      a.enter({ level: `${HLQ}.TEST` });
    });
    expect(c.done).toBe(false);
  });

  it("L9: edits made but never saved", () => {
    const c = challenge("l09-line-commands", (a) => {
      a.cmd("=2");
      a.enter(entry(`'${HLQ}.JCL(HELLO)'`));
      a.enter({ "prefix:1": "I00001" });
      a.enter({ [`line:${a.sim.lineIds()[1]}`]: "//* A COMMENT" });
      a.enter({ [`prefix:${a.lineId(/EXEC/)}`]: "D" });
      a.enter({ [`prefix:${a.lineId(/JOB/)}`]: "R" });
    });
    expect(c.done).toBe(false);
  });

  it("L10: the same member is saved instead of cancelled", () => {
    const c = challenge("l10-copy-move", (a) => {
      a.cmd("=2");
      a.enter(entry(`'${HLQ}.JCL(SORTJOB)'`));
      a.enter({ [`prefix:${a.lineId(/^\/\/SYSOUT/)}`]: "C", [`prefix:${a.lineId(/^\/\/SORTOUT/)}`]: "A" });
      a.enter({ [`prefix:${a.lineId(/^\/\/SORTIN/)}`]: "C", [`prefix:${a.lineId(/^\/\/SORT +EXEC/)}`]: "B" });
      a.enter({ [`prefix:${a.lineId(/^\/\/SYSIN/)}`]: "MM", [`prefix:${a.lineId(/SORT FIELDS/)}`]: "MM", [`prefix:${a.lineId(/^\/\*/)}`]: "A" });
      a.enter({ command: "SAVE" });
    });
    expect(c.done).toBe(false);
  });

  it("L13: copying twice without deleting the library", () => {
    const c = challenge("l13-copy-across", (a) => {
      a.cmd("3.3");
      a.enter({ option: "C", from: `${HLQ}.JCL(HELLO)`, to: `${HLQ}.TEST.JCL` });
      a.cmd("3.3");
      a.enter({ option: "C", from: `${HLQ}.JCL(COPYJOB)`, to: `${HLQ}.TEST.JCL` });
    });
    expect(c.done).toBe(false);
  });

  it("L16: jumping to 3.4 from outside the editor does not satisfy the editor jump", () => {
    const c = challenge("l16-jump-return", (a) => {
      a.cmd("=2");
      a.enter(entry(`'${HLQ}.JCL(HELLO)'`));
      a.pf(3);
      a.cmd("=3.4");
      a.pf(4);
    });
    expect(c.done).toBe(false);
  });

  it("L18: BOUNDS 1 72 is not the requested bounds", () => {
    const c = challenge("l18-cols-bounds", (a) => {
      a.cmd("=2");
      a.enter(entry(`'${HLQ}.COBOL(HELLO)'`));
      a.enter({ command: "COLS" });
      a.enter({ command: "BOUNDS 1 72" });
      a.enter({ command: "FIND DIVISION" });
      a.enter({ command: "RESET" });
    });
    expect(c.done).toBe(false);
  });

  it("L19: CAPS turned ON but never turned OFF again", () => {
    const c = challenge("l19-profiles", (a) => {
      a.cmd("=2");
      a.enter(entry(`'${HLQ}.JCL(HELLO)'`));
      a.enter({ command: "PROFILE" });
      a.enter({ command: "CAPS ON" });
      a.pf(3);
      a.enter(entry(`'${HLQ}.JCL(COPYJOB)'`));
    });
    expect(c.done).toBe(false);
  });

  it("L21: FLIP and RESET without excluding anything first", () => {
    const c = challenge("l21-exclude-flip", (a) => {
      a.cmd("=2");
      a.enter(entry(`'${HLQ}.COBOL(HELLO)'`));
      a.enter({ command: "FLIP" });
      a.enter({ command: "RESET" });
    });
    expect(c.done).toBe(false);
  });

  it("L24: opening HELLO without submitting it", () => {
    const c = challenge("l24-submit", (a) => {
      a.cmd("=2");
      a.enter(entry(`'${HLQ}.JCL(HELLO)'`));
      a.pf(3);
    });
    expect(c.done).toBe(false);
  });

  it("L25: job submitted and status opened but its output never browsed", () => {
    const c = challenge("l25-sdsf-status", (a) => {
      a.cmd("=2");
      a.enter(entry(`'${HLQ}.JCL'`));
      a.enter({ "cmd:HELLO": "J" });
      a.cmd("=S");
      a.cmd("ST");
    });
    expect(c.done).toBe(false);
  });
});

describe("known gaps deferred to M1b (not Challenge-completion defects)", () => {
  it.todo("L17 Learn step 5 completes after the first PF3, before the re-run (audit probe a)");
  it.todo("L21 Learn: FLIP alone skips the EXCLUDE step (audit probe f Q1)");
  it.todo("L27 Learn: a comment line containing DATA(EMPLOYEE) passes the fix step (audit probe m)");
  it.todo("L28 Challenge: creating PAYROLL.DATA is a valid repair that is rejected (audit probe o)");
  it.todo("L27 Challenge: completes with zero jobs submitted (audit probe n)");
});
