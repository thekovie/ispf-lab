/**
 * M1b-3: confirmed assessment defects (docs/curriculum/m1b-backlog.md T1-T5, A1-A3, A6-A8), each with a negative test.
 * These replace the five `it.todo` cases that M1a left in challenge-routes.test.ts.
 */
import { describe, expect, it } from "vitest";
import { lessonById } from "@/tutorial/lessons";
import { Attempt, backToMenu, type Script } from "./walks";

const HLQ = "USER01";
const entry = (dsn: string) => ({ project: "", group: "", type: "", member: "", other: dsn });

const learn = (id: string, script: Script) => run(id, "learn", script);
const challenge = (id: string, script: Script) => run(id, "challenge", script);
function run(id: string, mode: "learn" | "challenge", script: Script): Attempt {
  const c = new Attempt(lessonById(id)!, mode);
  script(c);
  return c;
}

const stepId = (c: Attempt) => c.lesson.steps[c.runner.stepIndex]?.id;

describe("T1 - L17 Learn: the re-run must happen", () => {
  const upToRetrieve: Script = (c) => {
    c.cmd("3.4");
    c.enter({ level: HLQ });
    c.enter({ [`cmd:${HLQ}.COBOL`]: "X", [`cmd:${HLQ}.DATA`]: "X" });
    c.cmd("RESET");
    c.pf(12);
  };

  it("leaving the list with PF3 after RETRIEVE does not finish the lesson", () => {
    const c = learn("l17-retrieve-multi", (a) => {
      upToRetrieve(a);
      backToMenu(a);
    });
    expect(stepId(c)).toBe("rerun");
    expect(c.done).toBe(false);
  });

  it("running the retrieved 3.4 again finishes it", () => {
    const c = learn("l17-retrieve-multi", (a) => {
      upToRetrieve(a);
      backToMenu(a);
      a.pf(12);
      a.pf(12);
      a.pf(12);
      a.enter({ option: "3.4" });
    });
    expect(c.done).toBe(true);
  });

  it("typing 3.4 by hand also counts (the objective is the re-run, not the key)", () => {
    const c = learn("l17-retrieve-multi", (a) => {
      upToRetrieve(a);
      backToMenu(a);
      a.cmd("3.4");
    });
    expect(c.done).toBe(true);
  });
});

describe("T2 - L21 Learn: FLIP is not EXCLUDE", () => {
  const open = (a: Attempt) => {
    a.cmd("2");
    a.enter(entry(`${HLQ}.COBOL(HELLO)`));
  };

  it("FLIP with nothing excluded does not pass the exclude step", () => {
    const c = learn("l21-exclude-flip", (a) => {
      open(a);
      a.enter({ command: "FLIP" });
    });
    expect(stepId(c)).toBe("exclude");
  });

  it("FLIP, RESET and PF3 without ever excluding do not complete the lesson", () => {
    const c = learn("l21-exclude-flip", (a) => {
      open(a);
      a.enter({ command: "FLIP" });
      a.enter({ command: "RESET" });
      a.pf(3);
    });
    expect(c.done).toBe(false);
  });

  it("the normal order still completes", () => {
    const c = learn("l21-exclude-flip", (a) => {
      open(a);
      a.enter({ command: "X DIVISION ALL" });
      a.enter({ command: "FLIP" });
      a.enter({ command: "RESET" });
      a.pf(3);
    });
    expect(c.done).toBe(true);
  });

  it("excluding with a line command also passes the exclude step", () => {
    const c = learn("l21-exclude-flip", (a) => {
      open(a);
      const id = a.lineId(/DIVISION/);
      a.enter({ [`prefix:${id}`]: "X" });
    });
    expect(stepId(c)).toBe("flip");
  });
});

/** Open PAYRPT from a failed job via SJ, as the lesson says. */
const failThenSj: Script = (c) => {
  c.cmd("TSO SUBMIT JCL(PAYRPT)");
  c.cmd("=S");
  c.cmd("ST");
  c.enter({ "cmd:JOB00001": "?" });
  c.enter({ "cmd:JESYSMSG": "S" });
  c.pf(3);
  c.pf(3);
  c.enter({ "cmd:JOB00001": "SJ" });
};

describe("T3 - L27 Learn: the fix step reads the SYSUT1 statement, not any line", () => {
  it("a comment that mentions DATA(EMPLOYEE) does not pass", () => {
    const c = learn("l27-jcl-error", (a) => {
      failThenSj(a);
      const id = a.lineId(/DAY-ONE CHALLENGE/);
      a.enter({ [`line:${id}`]: "//* TRY DSN=USER01.DATA(EMPLOYEE) HERE" });
    });
    expect(stepId(c)).toBe("fix");
  });

  it("a lower-case SYSUT1 statement passes", () => {
    const c = learn("l27-jcl-error", (a) => {
      failThenSj(a);
      const id = a.lineId(/SYSUT1/);
      a.enter({ [`line:${id}`]: "//SYSUT1   DD  dsn=user01.data(employee),disp=shr" });
    });
    expect(stepId(c)).toBe("resubmit");
  });

  it("the C PAYROLL.DATA DATA(EMPLOYEE) route still passes", () => {
    const c = learn("l27-jcl-error", (a) => {
      failThenSj(a);
      a.enter({ command: "C PAYROLL.DATA DATA(EMPLOYEE)" });
    });
    expect(stepId(c)).toBe("resubmit");
  });
});

/** Allocate USER01.PAYROLL.DATA through 3.2 (a sequential data set, FB 80). */
function createPayrollData(a: Attempt) {
  a.cmd("=3.2");
  a.enter({ option: "A", other: `${HLQ}.PAYROLL.DATA` });
  a.enter({ recfm: "FB", lrecl: "80", dirblocks: "0" });
}

const submitPayrpt: Script = (a) => {
  for (let i = 0; i < 4 && a.sim.state.screen.id !== "PRIMARY_OPTION_MENU" && a.sim.state.screen.id !== "TSO_COMMAND"; i++) a.pf(3);
  a.cmd("TSO SUBMIT JCL(PAYRPT)");
};
const readSysut2 = (a: Attempt, job: string) => {
  a.cmd("=S");
  a.cmd("ST");
  a.enter({ [`cmd:${job}`]: "?" });
  a.enter({ "cmd:SYSUT2": "S" });
};

describe("T4 - L28 Challenge: any repair that makes PAYRPT run, plus the report", () => {
  it("creating PAYROLL.DATA and resubmitting completes when the SYSUT2 report is opened", () => {
    const c = challenge("l28-day-one", (a) => {
      submitPayrpt(a);
      createPayrollData(a);
      submitPayrpt(a);
      readSysut2(a, "JOB00002");
    });
    expect(c.done).toBe(true);
  });

  it("editing the JCL (the lesson's route) still completes", () => {
    const c = challenge("l28-day-one", (a) => {
      submitPayrpt(a);
      a.cmd("=2");
      a.enter(entry(`${HLQ}.JCL(PAYRPT)`));
      a.enter({ command: "C PAYROLL.DATA DATA(EMPLOYEE)" });
      a.enter({ command: "SAVE" });
      a.pf(3);
      submitPayrpt(a);
      readSysut2(a, "JOB00002");
    });
    expect(c.done).toBe(true);
  });

  it("A6: a CC 0000 job whose report was never opened does not complete", () => {
    const c = challenge("l28-day-one", (a) => {
      submitPayrpt(a);
      createPayrollData(a);
      submitPayrpt(a);
    });
    expect(c.done).toBe(false);
  });

  it("A7: opening SYSUT2 of the failed first job does not count", () => {
    const c = challenge("l28-day-one", (a) => {
      submitPayrpt(a);
      createPayrollData(a);
      submitPayrpt(a);
      readSysut2(a, "JOB00001");
    });
    expect(c.done).toBe(false);
  });

  it("nothing submitted at all does not complete", () => {
    const c = challenge("l28-day-one", (a) => {
      createPayrollData(a);
    });
    expect(c.done).toBe(false);
  });
});

describe("T5 - L27 Challenge: a resubmission that ends CC 0000 is required", () => {
  it("fixing and saving the member without resubmitting does not complete", () => {
    const c = challenge("l27-jcl-error", (a) => {
      failThenSj(a);
      a.enter({ command: "C PAYROLL.DATA DATA(EMPLOYEE)" });
      a.enter({ command: "SAVE" });
      a.pf(3);
    });
    expect(c.done).toBe(false);
  });

  it("zero jobs submitted does not complete", () => {
    const c = challenge("l27-jcl-error", (a) => {
      a.cmd("2");
      a.enter(entry(`${HLQ}.JCL(PAYRPT)`));
      a.enter({ command: "C PAYROLL.DATA DATA(EMPLOYEE)" });
      a.enter({ command: "SAVE" });
      a.pf(3);
    });
    expect(c.done).toBe(false);
  });

  it("failing, reading JESYSMSG, fixing and resubmitting completes", () => {
    const c = challenge("l27-jcl-error", (a) => {
      failThenSj(a);
      a.enter({ command: "C PAYROLL.DATA DATA(EMPLOYEE)" });
      a.enter({ command: "SUBMIT" });
      a.pf(3);
    });
    expect(c.done).toBe(true);
  });

  it("creating the missing data set and resubmitting also completes (outcome, not route)", () => {
    const c = challenge("l27-jcl-error", (a) => {
      failThenSj(a);
      a.pf(3);
      a.pf(3);
      createPayrollData(a);
      submitPayrpt(a);
    });
    expect(c.done).toBe(true);
  });
});

describe("A1-A3 - L27 Learn steps assess what they name", () => {
  it("A1: opening PAYRPT in Edit by another route does not pass the SJ step", () => {
    const c = learn("l27-jcl-error", (a) => {
      a.cmd("TSO SUBMIT JCL(PAYRPT)");
      a.cmd("=S");
      a.cmd("ST");
      a.enter({ "cmd:JOB00001": "?" });
      a.enter({ "cmd:JESYSMSG": "S" });
      a.pf(3);
      a.pf(3);
      a.pf(3);
      a.cmd("=2");
      a.enter(entry(`${HLQ}.JCL(PAYRPT)`));
    });
    expect(stepId(c)).toBe("sj");
  });

  it("A2: a JCL-error job that is not PAYRPT does not pass the submit step", () => {
    const c = learn("l27-jcl-error", (a) => {
      a.cmd("2");
      a.enter(entry(`${HLQ}.JCL(HELLO)`));
      a.enter({ [`line:${a.lineId(/EXEC PGM/)}`]: "THIS IS NOT JCL" });
      a.enter({ command: "SUBMIT" });
    });
    expect(c.runner.completedSteps).not.toContain("submit");
    expect(stepId(c)).toBe("submit");
  });

  it("A3: SUBMIT of an unsaved fix passes the resubmit step, and the final step still needs the member saved", () => {
    const c = learn("l27-jcl-error", (a) => {
      failThenSj(a);
      a.enter({ command: "C PAYROLL.DATA DATA(EMPLOYEE)" });
      a.enter({ command: "SUBMIT" });
    });
    expect(stepId(c)).toBe("save");
    expect(c.done).toBe(false);
  });
});

describe("M1b-3 - Learn steps that checked less than they said (L5, L6, L9, L11)", () => {
  it("L5: Data Set Information for another data set does not pass the info step", () => {
    const c = learn("l05-data-sets-and-members", (a) => {
      a.enter({ level: HLQ });
      a.enter({ [`cmd:${HLQ}.COBOL`]: "I" });
    });
    expect(stepId(c)).toBe("info");
  });

  it("L5: Data Set Information for the named data set passes it", () => {
    const c = learn("l05-data-sets-and-members", (a) => {
      a.enter({ level: HLQ });
      a.enter({ [`cmd:${HLQ}.JCL`]: "I" });
    });
    expect(stepId(c)).toBe("back");
  });

  const allocate = (a: Attempt, extra: Record<string, string>) => {
    a.cmd("3.2");
    a.enter({ option: "A", other: `${HLQ}.TEST.JCL` });
    a.enter({ recfm: "FB", lrecl: "80", dirblocks: "10", ...extra });
  };

  it("L6: a sequential data set (no directory blocks) does not pass the attributes step", () => {
    const c = learn("l06-allocating", (a) => allocate(a, { dirblocks: "0" }));
    expect(stepId(c)).toBe("fill-attributes");
  });

  it("L6: the wrong record length does not pass it", () => {
    const c = learn("l06-allocating", (a) => allocate(a, { lrecl: "133" }));
    expect(stepId(c)).toBe("fill-attributes");
  });

  it("L6: a PDS with FB, 80 and 10 directory blocks passes it", () => {
    const c = learn("l06-allocating", (a) => allocate(a, {}));
    expect(stepId(c)).toBe("verify");
  });

  it("L6: displaying a different level does not prove the new data set exists", () => {
    const c = learn("l06-allocating", (a) => {
      allocate(a, {});
      a.cmd("=3.4");
      a.enter({ level: `${HLQ}.COBOL` });
    });
    expect(stepId(c)).toBe("verify");
  });

  it("L6: listing the level that holds it completes the lesson", () => {
    const c = learn("l06-allocating", (a) => {
      allocate(a, {});
      a.cmd("=3.4");
      a.enter({ level: `${HLQ}.TEST` });
    });
    expect(c.done).toBe(true);
  });

  const editHello = (a: Attempt) => {
    a.cmd("=2");
    a.enter(entry(`${HLQ}.JCL(HELLO)`));
  };

  it("L9: saving after deleting the comment itself does not pass the save step (the member must hold the comment)", () => {
    const c = learn("l09-line-commands", (a) => {
      editHello(a);
      const first = a.sim.state.editor!.lines[0].id;
      a.enter({ [`prefix:${first}`]: "I" });
      const blank = a.sim.state.editor!.lines[1].id;
      a.enter({ [`line:${blank}`]: "//* A COMMENT" });
      a.enter({ [`prefix:${blank}`]: "D" });
      a.enter({ [`prefix:${first}`]: "R" });
      a.pf(3);
    });
    expect(stepId(c)).toBe("save");
    expect(c.done).toBe(false);
  });

  const c1 = (a: Attempt) => a.runner.completedSteps.includes("rfind");

  it("L11: the exclude step needs an exclude, not just an open editor", () => {
    const c = learn("l11-find-change", (a) => {
      a.cmd("2");
      a.enter(entry(`${HLQ}.COBOL(CUSTOMER)`));
      a.enter({ command: "FIND CUST" });
      for (let i = 0; i < 12 && !c1(a); i++) a.pf(5);
      a.enter({ command: "CHANGE WS-CUST WS-CLIENT ALL" });
    });
    expect(stepId(c)).toBe("exclude");
  });
});
