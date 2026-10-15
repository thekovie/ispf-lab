/**
 * M3 foundational lessons: step-by-step behaviour, false-positive checks and accepted alternatives for each new lesson.
 * The generic gates (walk completes, nothing completes from the start, no stale completion, isolation) live in
 * challenge.test.ts and iterate over every lesson, including these.
 */
import { describe, expect, it } from "vitest";
import { getMember } from "@/catalog/catalog";
import { lessonById } from "@/tutorial/lessons";
import { answerB01, Attempt, type Script } from "./walks";

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

describe("a-01-panel-fields-scroll", () => {
  const ID = "a-01-panel-fields-scroll";
  const open = (a: Attempt) => {
    a.cmd("2");
    a.enter(entry(`${HLQ}.DATA(SCROLL)`));
  };

  it("is lesson 29 and declares lesson 1 as advice", () => {
    const l = lessonById(ID)!;
    expect(l.number).toBe(29);
    expect(l.requires).toEqual(["l01-meet-ispf"]);
  });

  it("creates a practice member longer than one screen", () => {
    const c = new Attempt(lessonById(ID)!);
    const m = getMember(c.sim.state.catalog, `${HLQ}.DATA`, "SCROLL")!;
    expect(m.records.length).toBe(60);
  });

  it("walks the Learn steps in order", () => {
    const c = new Attempt(lessonById(ID)!);
    open(c);
    expect(stepId(c)).toBe("page");
    c.pf(8);
    expect(stepId(c)).toBe("half");
    c.pf(8, { scroll: "HALF" });
    expect(stepId(c)).toBe("once");
    c.enter({ command: "DOWN 3" });
    expect(stepId(c)).toBe("max");
    c.enter({ command: "DOWN MAX" });
    expect(stepId(c)).toBe("leave");
    c.pf(3);
    expect(c.done).toBe(true);
    expect(c.runner.mistakes).toBe(0);
  });

  it("DOWN 3 before the field is HALF does not pass the 'half' step", () => {
    const c = learn(ID, (a) => {
      open(a);
      a.pf(8);
      a.enter({ command: "DOWN 3" });
    });
    expect(stepId(c)).toBe("half");
  });

  it("a different amount in the field is not HALF", () => {
    const c = learn(ID, (a) => {
      open(a);
      a.pf(8);
      a.pf(8, { scroll: "3" });
    });
    expect(stepId(c)).toBe("half");
  });

  it("a typed HALF on the command line is an error, not a scroll", () => {
    const c = learn(ID, (a) => {
      open(a);
      a.pf(8);
      a.enter({ command: "HALF" });
    });
    expect(stepId(c)).toBe("half");
    expect(c.runner.mistakes).toBe(1);
  });

  describe("Challenge", () => {
    it("HALF in the field then a one-time MAX completes it", () => {
      const c = challenge(ID, (a) => {
        open(a);
        a.pf(8, { scroll: "HALF" });
        a.enter({ command: "DOWN MAX" });
      });
      expect(c.done).toBe(true);
    });

    it("also completes through DOWN HALF with the field set to HALF, then DOWN MAX", () => {
      const c = challenge(ID, (a) => {
        open(a);
        a.enter({ command: "DOWN HALF", scroll: "HALF" });
        a.enter({ command: "DOWN MAX" });
      });
      expect(c.done).toBe(true);
    });

    it("HALF without the MAX does not complete", () => {
      const c = challenge(ID, (a) => {
        open(a);
        a.pf(8, { scroll: "HALF" });
      });
      expect(c.done).toBe(false);
    });

    it("MAX before HALF does not complete", () => {
      const c = challenge(ID, (a) => {
        open(a);
        a.enter({ command: "DOWN MAX" });
        a.pf(7, { scroll: "HALF" });
      });
      expect(c.done).toBe(false);
    });

    it("MAX put in the field is also one-time in real ISPF (UG1 p.60): the field returns to HALF, so this route completes", () => {
      const c = challenge(ID, (a) => {
        open(a);
        a.pf(8, { scroll: "HALF" });
        a.pf(8, { scroll: "MAX" });
      });
      expect(c.done).toBe(true);
    });

    it("scrolling pages without ever using HALF is not enough", () => {
      const c = challenge(ID, (a) => {
        open(a);
        a.pf(8);
        a.pf(8);
      });
      expect(c.done).toBe(false);
    });
  });

  it("replay: starting again restores the practice member the learner changed", () => {
    const first = new Attempt(lessonById(ID)!);
    open(first);
    first.enter({ [`line:${first.sim.state.editor!.lines[0].id}`]: "CHANGED" });
    first.enter({ command: "SAVE" });
    expect(getMember(first.sim.state.catalog, `${HLQ}.DATA`, "SCROLL")!.records[0].trimEnd()).toBe("CHANGED");
    const again = new Attempt(lessonById(ID)!, "learn", first.sim);
    expect(getMember(again.sim.state.catalog, `${HLQ}.DATA`, "SCROLL")!.records[0].trimEnd()).not.toBe("CHANGED");
  });
});

describe("b-01-zos-big-picture", () => {
  const ID = "b-01-zos-big-picture";
  const tso = (a: Attempt) => {
    a.cmd("6");
    a.enter({ command: "LISTDS 'USER01.JCL'" });
    a.pf(3);
  };
  const editHello = (a: Attempt) => {
    a.cmd("2");
    a.enter(entry(`${HLQ}.JCL(HELLO)`));
  };
  const toSdsf = (a: Attempt) => {
    a.pf(3);
    a.cmd("=S");
    a.cmd("ST");
  };

  it("is lesson 30 with no prerequisite", () => {
    const l = lessonById(ID)!;
    expect(l.number).toBe(30);
    expect(l.requires ?? []).toEqual([]);
  });

  it("walks the Learn steps in order", () => {
    const c = new Attempt(lessonById(ID)!);
    c.cmd("6");
    expect(stepId(c)).toBe("tso");
    c.enter({ command: "LISTDS 'USER01.JCL'" });
    expect(stepId(c)).toBe("ispf");
    c.pf(3);
    editHello(c);
    expect(stepId(c)).toBe("jes");
    c.enter({ command: "SUBMIT" });
    expect(stepId(c)).toBe("sdsf");
    toSdsf(c);
    expect(stepId(c)).toBe("output");
    c.enter({ "cmd:JOB00001": "S" });
    expect(stepId(c)).toBe("leave");
    c.pf(3);
    expect(stepId(c)).toBe("check-session");
    c.answer("role-session", 1);
    expect(stepId(c)).toBe("check-jes");
    c.answer("role-jes", 2);
    expect(stepId(c)).toBe("check-sdsf");
    c.answer("role-sdsf", 0);
    expect(c.done).toBe(true);
    expect(c.runner.mistakes).toBe(0);
  });

  it("a wrong choice is a mistake and does not advance; the right one then does", () => {
    const c = learn(ID, (a) => {
      tso(a);
      editHello(a);
      a.enter({ command: "SUBMIT" });
      toSdsf(a);
      a.enter({ "cmd:JOB00001": "S" });
      a.pf(3);
    });
    expect(stepId(c)).toBe("check-session");
    c.answer("role-session", 3);
    expect(stepId(c)).toBe("check-session");
    expect(c.runner.mistakes).toBe(1);
    c.answer("role-session", 1);
    expect(stepId(c)).toBe("check-jes");
  });

  it("the questions can be answered before the trace but the lesson only completes when the trace is done too", () => {
    const c = learn(ID, answerB01);
    expect(c.done).toBe(false);
    expect(stepId(c)).toBe("tso");
  });

  it("opening a different member in Edit does not pass the ISPF step", () => {
    const c = learn(ID, (a) => {
      tso(a);
      a.cmd("2");
      a.enter(entry(`${HLQ}.JCL(COPYJOB)`));
    });
    expect(stepId(c)).toBe("ispf");
  });

  it("a command that is not LISTDS does not pass the TSO step", () => {
    const c = learn(ID, (a) => {
      a.cmd("6");
      a.enter({ command: "TIME" });
    });
    expect(stepId(c)).toBe("tso");
  });

  describe("Challenge", () => {
    const sdsfOutput = (a: Attempt, job = "JOB00001") => {
      a.cmd("=S");
      a.cmd("ST");
      a.enter({ [`cmd:${job}`]: "S" });
    };

    it("TSO command, submit from the editor, then that job's output completes it", () => {
      const c = challenge(ID, (a) => {
        tso(a);
        editHello(a);
        a.enter({ command: "SUBMIT" });
        a.pf(3);
        sdsfOutput(a);
        answerB01(a);
      });
      expect(c.done).toBe(true);
    });

    it("the full trace without the three answers does not complete it", () => {
      const c = challenge(ID, (a) => {
        tso(a);
        editHello(a);
        a.enter({ command: "SUBMIT" });
        a.pf(3);
        sdsfOutput(a);
      });
      expect(c.done).toBe(false);
    });

    it("the three answers without the trace do not complete it", () => {
      expect(challenge(ID, answerB01).done).toBe(false);
    });

    it("one wrong answer on the way costs 10 points and the Challenge still completes", () => {
      const c = challenge(ID, (a) => {
        tso(a);
        editHello(a);
        a.enter({ command: "SUBMIT" });
        a.pf(3);
        sdsfOutput(a);
        a.answer("role-session", 0);
        answerB01(a);
      });
      expect(c.done).toBe(true);
      expect(c.runner.mistakes).toBe(1);
    });

    it("also completes with J on the member list and any TSO command typed on the option line", () => {
      const c = challenge(ID, (a) => {
        a.cmd("TSO TIME");
        a.cmd("=2");
        a.enter(entry(`${HLQ}.JCL`));
        a.enter({ "cmd:HELLO": "J" });
        sdsfOutput(a);
        answerB01(a);
      });
      expect(c.done).toBe(true);
    });

    it("without any TSO command it does not complete", () => {
      const c = challenge(ID, (a) => {
        editHello(a);
        a.enter({ command: "SUBMIT" });
        a.pf(3);
        sdsfOutput(a);
      });
      expect(c.done).toBe(false);
    });

    it("the TSO command after the submit is the wrong order", () => {
      const c = challenge(ID, (a) => {
        editHello(a);
        a.enter({ command: "SUBMIT" });
        a.pf(3);
        a.cmd("6");
        a.enter({ command: "TIME" });
        a.pf(3);
        sdsfOutput(a);
      });
      expect(c.done).toBe(false);
    });

    it("the output of another job does not count", () => {
      const c = challenge(ID, (a) => {
        tso(a);
        editHello(a);
        a.enter({ command: "SUBMIT" });
        a.pf(3);
        a.cmd("TSO SUBMIT JCL(SORTJOB)");
        sdsfOutput(a, "JOB00002");
      });
      expect(c.done).toBe(false);
    });

    it("TSO SUBMIT instead of submitting from ISPF does not count", () => {
      const c = challenge(ID, (a) => {
        tso(a);
        a.cmd("TSO SUBMIT JCL(HELLO)");
        sdsfOutput(a);
      });
      expect(c.done).toBe(false);
    });

    it("submitting without reading the output is not enough", () => {
      const c = challenge(ID, (a) => {
        tso(a);
        editHello(a);
        a.enter({ command: "SUBMIT" });
        a.pf(3);
      });
      expect(c.done).toBe(false);
    });
  });
});

describe("b-02-dataset-types", () => {
  const ID = "b-02-dataset-types";
  const SEQ = `${HLQ}.TYPES.SEQ`;
  const LIB = `${HLQ}.TYPES.LIB`;
  const allocate = (a: Attempt, dsn: string, f: Record<string, string>) => {
    a.cmd("=3.2");
    a.enter({ option: "A", other: dsn });
    a.enter({ recfm: "FB", lrecl: "80", dirblocks: "0", ...f });
  };
  const both = (a: Attempt) => {
    allocate(a, SEQ, { dirblocks: "0" });
    allocate(a, LIB, { dirblocks: "5" });
  };
  const infoOf = (a: Attempt, dsn: string, option = "I") => {
    a.cmd("=3.4");
    a.enter({ level: `${HLQ}.TYPES` });
    a.enter({ [`cmd:${dsn}`]: option });
  };

  it("is lesson 31 and declares the allocation lesson as advice", () => {
    const l = lessonById(ID)!;
    expect(l.number).toBe(31);
    expect(l.requires).toEqual(["l06-allocating"]);
  });

  it("walks the Learn steps in order", () => {
    const c = new Attempt(lessonById(ID)!);
    c.cmd("3.2");
    expect(stepId(c)).toBe("seq");
    c.enter({ option: "A", other: SEQ });
    c.enter({ recfm: "FB", lrecl: "80", dirblocks: "0" });
    expect(stepId(c)).toBe("lib");
    allocate(c, LIB, { dirblocks: "5" });
    expect(stepId(c)).toBe("compare");
    c.cmd("=3.4");
    c.enter({ level: `${HLQ}.TYPES` });
    expect(stepId(c)).toBe("info-lib");
    c.enter({ [`cmd:${LIB}`]: "I" });
    expect(stepId(c)).toBe("info-seq");
    c.pf(3);
    c.enter({ [`cmd:${SEQ}`]: "I" });
    expect(stepId(c)).toBe("listds");
    c.cmd("=6");
    c.enter({ command: `LISTDS '${LIB}'` });
    expect(stepId(c)).toBe("member");
    c.cmd("=2");
    c.enter(entry(`${SEQ}(ONE)`));
    expect(c.done).toBe(true);
    expect(c.runner.mistakes).toBe(0);
  });

  it("a sequential data set allocated with directory blocks does not pass the first step", () => {
    const c = learn(ID, (a) => allocate(a, SEQ, { dirblocks: "5" }));
    expect(stepId(c)).toBe("seq");
  });

  it("a library allocated with no directory blocks does not pass the second step", () => {
    const c = learn(ID, (a) => {
      allocate(a, SEQ, { dirblocks: "0" });
      allocate(a, LIB, { dirblocks: "0" });
    });
    expect(stepId(c)).toBe("lib");
  });

  it("the wrong record length does not pass", () => {
    const c = learn(ID, (a) => allocate(a, SEQ, { lrecl: "133" }));
    expect(stepId(c)).toBe("seq");
  });

  it("short information for the library does not pass the library information step", () => {
    const c = learn(ID, (a) => {
      both(a);
      infoOf(a, LIB, "S");
    });
    expect(stepId(c)).toBe("info-lib");
  });

  describe("Challenge", () => {
    it("allocating both and showing the information for each completes it", () => {
      const c = challenge(ID, (a) => {
        both(a);
        infoOf(a, LIB);
        a.pf(3);
        a.enter({ [`cmd:${SEQ}`]: "I" });
      });
      expect(c.done).toBe(true);
    });

    it("LISTDS with the full name is an accepted way to show the information", () => {
      const c = challenge(ID, (a) => {
        both(a);
        a.cmd("=6");
        a.enter({ command: `LISTDS '${SEQ}'` });
        a.enter({ command: `LISTDS ${LIB}` });
      });
      expect(c.done).toBe(true);
    });

    it("showing the information before anything is false when the data sets are wrong", () => {
      const c = challenge(ID, (a) => {
        allocate(a, SEQ, { dirblocks: "5" }); // not sequential
        allocate(a, LIB, { dirblocks: "5" });
        infoOf(a, LIB);
        a.pf(3);
        a.enter({ [`cmd:${SEQ}`]: "I" });
      });
      expect(c.done).toBe(false);
    });

    it("allocating without showing the information is not enough", () => {
      const c = challenge(ID, (a) => both(a));
      expect(c.done).toBe(false);
    });

    it("information for the sequential data set only is not enough", () => {
      const c = challenge(ID, (a) => {
        both(a);
        infoOf(a, SEQ);
      });
      expect(c.done).toBe(false);
    });

    it("short information on the library does not count", () => {
      const c = challenge(ID, (a) => {
        both(a);
        infoOf(a, LIB, "S");
        a.pf(3);
        a.enter({ [`cmd:${SEQ}`]: "I" });
      });
      expect(c.done).toBe(false);
    });
  });
});

describe("b-03-jcl-anatomy", () => {
  const ID = "b-03-jcl-anatomy";
  const submitBroken = (a: Attempt) => a.cmd("TSO SUBMIT JCL(BROKEN)");
  const readSysmsg = (a: Attempt) => {
    a.cmd("=S");
    a.cmd("ST");
    a.enter({ "cmd:JOB00001": "?" });
    a.enter({ "cmd:JESYSMSG": "S" });
  };
  const openBroken = (a: Attempt) => {
    a.cmd("=2");
    a.enter(entry(`${HLQ}.JCL(BROKEN)`));
  };
  const removeComma = (a: Attempt) => a.enter({ [`line:${a.lineId(/JOB/)}`]: "//USER01B  JOB (ACCT),'FIX ME',CLASS=A" });
  const addContinuation = (a: Attempt) => {
    a.enter({ [`line:${a.lineId(/JOB/)}`]: "//USER01B  JOB (ACCT),'FIX ME',CLASS=A," });
    a.enter({ [`prefix:${a.lineId(/JOB/)}`]: "I" });
    a.enter({ [`line:${a.sim.state.editor!.lines[1].id}`]: "//             MSGCLASS=X" });
  };

  it("is lesson 32, advises lesson 31, and creates BROKEN for this userid", () => {
    const c = new Attempt(lessonById(ID)!);
    expect(c.lesson.number).toBe(32);
    expect(c.lesson.requires).toEqual(["b-02-dataset-types"]);
    expect(getMember(c.sim.state.catalog, `${HLQ}.JCL`, "BROKEN")!.records[0].trimEnd()).toBe("//USER01B  JOB (ACCT),'FIX ME',CLASS=A,MSGCLASS=X,");
  });

  it("walks the Learn steps in order", () => {
    const c = new Attempt(lessonById(ID)!);
    c.cmd("2");
    c.enter(entry(`${HLQ}.JCL(HELLO)`));
    expect(stepId(c)).toBe("cols");
    c.enter({ command: "COLS" });
    expect(stepId(c)).toBe("leave");
    c.pf(3);
    expect(stepId(c)).toBe("submit");
    c.pf(3);
    submitBroken(c);
    expect(stepId(c)).toBe("read");
    readSysmsg(c);
    expect(stepId(c)).toBe("fix");
    c.pf(3);
    c.pf(3);
    c.pf(3);
    openBroken(c);
    removeComma(c);
    expect(stepId(c)).toBe("rerun");
    c.enter({ command: "SUBMIT" });
    expect(stepId(c)).toBe("save");
    c.pf(3);
    expect(c.done).toBe(true);
    expect(c.runner.mistakes).toBe(0);
  });

  it("editing another member does not pass the fix step", () => {
    const c = learn(ID, (a) => {
      a.cmd("2");
      a.enter(entry(`${HLQ}.JCL(HELLO)`));
      a.enter({ command: "COLS" });
      a.pf(3);
      a.pf(3);
      submitBroken(a);
      readSysmsg(a);
      a.pf(3);
      a.pf(3);
      a.pf(3);
      a.cmd("=2");
      a.enter(entry(`${HLQ}.JCL(COPYJOB)`));
    });
    expect(stepId(c)).toBe("fix");
  });

  describe("Challenge", () => {
    it("failing first, then fixing by removing the comma, completes it", () => {
      const c = challenge(ID, (a) => {
        submitBroken(a);
        openBroken(a);
        removeComma(a);
        a.enter({ command: "SUBMIT" });
        a.pf(3);
      });
      expect(c.done).toBe(true);
    });

    it("fixing with a proper continuation record is also accepted", () => {
      const c = challenge(ID, (a) => {
        submitBroken(a);
        openBroken(a);
        addContinuation(a);
        a.enter({ command: "SUBMIT" });
        a.pf(3);
      });
      expect(c.done).toBe(true);
    });

    it("fixing and submitting without ever having run the broken job does not complete", () => {
      const c = challenge(ID, (a) => {
        openBroken(a);
        removeComma(a);
        a.enter({ command: "SUBMIT" });
        a.pf(3);
      });
      expect(c.done).toBe(false);
    });

    it("a successful run of a different job does not complete", () => {
      const c = challenge(ID, (a) => {
        submitBroken(a);
        a.cmd("TSO SUBMIT JCL(HELLO)");
      });
      expect(c.done).toBe(false);
    });

    it("submitting it again without fixing it does not complete", () => {
      const c = challenge(ID, (a) => {
        submitBroken(a);
        a.cmd("TSO SUBMIT JCL(BROKEN)");
      });
      expect(c.done).toBe(false);
    });
  });
});

describe("b-04-build-a-job", () => {
  const ID = "b-04-build-a-job";
  const DSN = `${HLQ}.BUILD.DATA`;
  const JOB = "//USER01N  JOB (ACCT),'NEW DATA SET',CLASS=A";
  const EXEC = "//STEP1    EXEC PGM=IEFBR14";
  const DD = [`//NEWDD    DD  DSN=${DSN},DISP=(NEW,CATLG,DELETE),`, "//             SPACE=(TRK,(1,1)),UNIT=SYSDA,", "//             DCB=(RECFM=FB,LRECL=80)"];
  /** Type the given records into the new member, one per Enter, using insert-after on the last line. */
  const typeJcl = (a: Attempt, records: string[]) => {
    for (const r of records) {
      const ed = a.sim.state.editor!;
      const last = ed.lines[ed.lines.length - 1].id;
      a.enter({ [`prefix:${last}`]: "I" });
      const blank = a.sim.state.editor!.lines[a.sim.state.editor!.lines.length - 1].id;
      a.enter({ [`line:${blank}`]: r });
    }
  };
  const openNew = (a: Attempt) => {
    a.cmd("2");
    a.enter(entry(`${HLQ}.JCL(NEWDS)`));
  };

  it("is lesson 33 and advises lesson 32", () => {
    const l = lessonById(ID)!;
    expect(l.number).toBe(33);
    expect(l.requires).toEqual(["b-03-jcl-anatomy"]);
  });

  it("walks the Learn steps in order", () => {
    const c = new Attempt(lessonById(ID)!);
    openNew(c);
    expect(stepId(c)).toBe("job");
    typeJcl(c, [JOB]);
    expect(stepId(c)).toBe("exec");
    typeJcl(c, [EXEC]);
    expect(stepId(c)).toBe("dd");
    typeJcl(c, DD);
    expect(stepId(c)).toBe("null");
    typeJcl(c, ["//"]);
    expect(stepId(c)).toBe("submit");
    c.enter({ command: "SUBMIT" });
    expect(stepId(c)).toBe("verify");
    c.pf(3);
    c.cmd("=3.4");
    c.enter({ level: `${HLQ}.BUILD` });
    expect(c.done).toBe(true);
    expect(c.runner.mistakes).toBe(0);
  });

  it("a different job name does not pass the job step", () => {
    const c = learn(ID, (a) => {
      openNew(a);
      typeJcl(a, ["//OTHERJOB  JOB (ACCT),'X',CLASS=A"]);
    });
    expect(stepId(c)).toBe("job");
  });

  it("a DD with the wrong data set name or the wrong record length does not pass the DD step", () => {
    const wrongDsn = learn(ID, (a) => {
      openNew(a);
      typeJcl(a, [JOB, EXEC, `//NEWDD    DD  DSN=${HLQ}.OTHER.DATA,DISP=(NEW,CATLG),SPACE=(TRK,(1,1)),DCB=(RECFM=FB,LRECL=80)`]);
    });
    expect(stepId(wrongDsn)).toBe("dd");
    const wrongLrecl = learn(ID, (a) => {
      openNew(a);
      typeJcl(a, [JOB, EXEC, `//NEWDD    DD  DSN=${DSN},DISP=(NEW,CATLG),SPACE=(TRK,(1,1)),DCB=(RECFM=FB,LRECL=133)`]);
    });
    expect(stepId(wrongLrecl)).toBe("dd");
  });

  it("a DD that never creates the data set (DISP=SHR) does not pass the DD step", () => {
    const c = learn(ID, (a) => {
      openNew(a);
      typeJcl(a, [JOB, EXEC, `//NEWDD    DD  DSN=${DSN},DISP=SHR`]);
    });
    expect(stepId(c)).toBe("dd");
  });

  describe("Challenge", () => {
    const runJob = (a: Attempt, dd: string[]) => {
      openNew(a);
      typeJcl(a, [JOB, EXEC, ...dd, "//"]);
      a.enter({ command: "SUBMIT" });
      a.pf(3);
    };

    it("a job that creates the FB 80 data set completes it", () => {
      expect(challenge(ID, (a) => runJob(a, DD)).done).toBe(true);
    });

    it("RECFM and LRECL as separate keywords and DISP KEEP are also accepted", () => {
      const dd = [`//NEWDD    DD  DSN=${DSN},DISP=(NEW,KEEP),SPACE=(TRK,(1,1)),`, "//             RECFM=FB,LRECL=80"];
      expect(challenge(ID, (a) => runJob(a, dd)).done).toBe(true);
    });

    it("creating the data set with 3.2 instead of a job does not count", () => {
      const c = challenge(ID, (a) => {
        a.cmd("=3.2");
        a.enter({ option: "A", other: DSN });
        a.enter({ recfm: "FB", lrecl: "80", dirblocks: "0" });
      });
      expect(c.done).toBe(false);
    });

    it("a job that creates the data set with the wrong record length does not count", () => {
      const c = challenge(ID, (a) => runJob(a, [`//NEWDD    DD  DSN=${DSN},DISP=(NEW,CATLG),SPACE=(TRK,(1,1)),DCB=(RECFM=FB,LRECL=133)`]));
      expect(c.done).toBe(false);
    });

    it("a job whose data set is deleted at the end (default disposition) does not count", () => {
      const c = challenge(ID, (a) => runJob(a, [`//NEWDD    DD  DSN=${DSN},SPACE=(TRK,(1,1)),DCB=(RECFM=FB,LRECL=80)`]));
      expect(c.done).toBe(false);
    });
  });
});

describe("b-05-disp", () => {
  const ID = "b-05-disp";
  const OUT = `${HLQ}.DISP.OUT`;
  const KEEP = `${HLQ}.DISP.KEEP`;
  const submit = (a: Attempt, member: string) => {
    for (let i = 0; i < 6 && !["PRIMARY_OPTION_MENU", "TSO_COMMAND"].includes(a.sim.state.screen.id); i++) a.pf(3);
    a.cmd(`TSO SUBMIT JCL(${member})`);
  };
  const exists = (a: Attempt, dsn: string) => !!a.sim.state.catalog.datasets[dsn];
  const records = (a: Attempt) => (a.sim.state.catalog.datasets[OUT]?.records ?? []).map((r) => r.trimEnd());
  const jesysmsg = (a: Attempt, job = "JOB00001") => {
    a.cmd("=S");
    a.cmd("ST");
    a.enter({ [`cmd:${job}`]: "?" });
    a.enter({ "cmd:JESYSMSG": "S" });
  };
  const fixKeepit = (a: Attempt) => {
    a.cmd("=2");
    a.enter(entry(`${HLQ}.JCL(KEEPIT)`));
    a.enter({ [`line:${a.lineId(/ DD /)}`]: `//OUT      DD  DSN=${KEEP},DISP=(NEW,CATLG),` });
  };

  it("is lesson 34 and advises lesson 33", () => {
    const l = lessonById(ID)!;
    expect(l.number).toBe(34);
    expect(l.requires).toEqual(["b-04-build-a-job"]);
  });

  it("creates the four job members for this userid and no leftover data sets", () => {
    const c = new Attempt(lessonById(ID)!);
    for (const m of ["DISPNEW", "DISPMOD", "DISPDEL", "KEEPIT"]) expect(getMember(c.sim.state.catalog, `${HLQ}.JCL`, m), m).toBeDefined();
    expect(getMember(c.sim.state.catalog, `${HLQ}.JCL`, "KEEPIT")!.records[0].trimEnd()).toMatch(/^\/\/USER01K\s+JOB/);
    expect(exists(c, OUT) || exists(c, KEEP)).toBe(false);
  });

  it("walks the Learn steps in order", () => {
    const c = new Attempt(lessonById(ID)!);
    submit(c, "DISPNEW");
    expect(stepId(c)).toBe("read");
    expect(records(c)).toEqual(["FIRST RECORD"]);
    jesysmsg(c);
    expect(stepId(c)).toBe("mod");
    submit(c, "DISPMOD");
    expect(stepId(c)).toBe("browse");
    expect(records(c)).toEqual(["FIRST RECORD", "SECOND RECORD"]);
    c.cmd("=3.4");
    c.enter({ level: `${HLQ}.DISP` });
    c.enter({ [`cmd:${OUT}`]: "B" });
    expect(stepId(c)).toBe("del");
    submit(c, "DISPDEL");
    expect(stepId(c)).toBe("gone");
    expect(exists(c, OUT)).toBe(false);
    submit(c, "KEEPIT");
    expect(stepId(c)).toBe("gone");
    expect(exists(c, KEEP)).toBe(false);
    c.cmd("=3.4");
    c.enter({ level: `${HLQ}.DISP` });
    expect(stepId(c)).toBe("fix");
    fixKeepit(c);
    expect(stepId(c)).toBe("rerun");
    c.enter({ command: "SUBMIT" });
    expect(stepId(c)).toBe("save");
    expect(exists(c, KEEP)).toBe(true);
    c.pf(3);
    expect(c.done).toBe(true);
    expect(c.runner.mistakes).toBe(0);
  });

  it("running DISPMOD before DISPNEW does not skip ahead (the job name is checked, in order)", () => {
    const c = learn(ID, (a) => submit(a, "DISPMOD"));
    expect(stepId(c)).toBe("new");
  });

  it("editing KEEPIT without a disposition that keeps the data set does not pass the fix step", () => {
    const c = learn(ID, (a) => {
      submit(a, "DISPNEW");
      jesysmsg(a);
      submit(a, "DISPMOD");
      a.cmd("=3.4");
      a.enter({ level: `${HLQ}.DISP` });
      a.enter({ [`cmd:${OUT}`]: "B" });
      submit(a, "DISPDEL");
      submit(a, "KEEPIT");
      a.cmd("=3.4");
      a.enter({ level: `${HLQ}.DISP` });
      a.cmd("=2");
      a.enter(entry(`${HLQ}.JCL(KEEPIT)`));
      a.enter({ [`line:${a.lineId(/ DD /)}`]: `//OUT      DD  DSN=${KEEP},DISP=(NEW,DELETE),` });
    });
    expect(stepId(c)).toBe("fix");
  });

  describe("Challenge", () => {
    it("fixing KEEPIT and running it completes it", () => {
      const c = challenge(ID, (a) => {
        fixKeepit(a);
        a.enter({ command: "SUBMIT" });
        a.pf(3);
      });
      expect(c.done).toBe(true);
    });

    it("DISP=(NEW,KEEP) is also accepted", () => {
      const c = challenge(ID, (a) => {
        a.cmd("=2");
        a.enter(entry(`${HLQ}.JCL(KEEPIT)`));
        a.enter({ [`line:${a.lineId(/ DD /)}`]: `//OUT      DD  DSN=${KEEP},DISP=(NEW,KEEP),` });
        a.enter({ command: "SUBMIT" });
        a.pf(3);
      });
      expect(c.done).toBe(true);
    });

    it("running KEEPIT unchanged does not complete it (the data set is deleted)", () => {
      expect(challenge(ID, (a) => submit(a, "KEEPIT")).done).toBe(false);
    });

    it("creating the data set with the Data Set Utility does not count", () => {
      const c = challenge(ID, (a) => {
        a.cmd("=3.2");
        a.enter({ option: "A", other: KEEP });
        a.enter({ recfm: "FB", lrecl: "80", dirblocks: "0" });
        submit(a, "KEEPIT");
      });
      expect(c.done).toBe(false);
    });

    it("running a different job does not complete it", () => {
      expect(challenge(ID, (a) => submit(a, "DISPNEW")).done).toBe(false);
    });
  });
});

describe("b-06-multistep-rc", () => {
  const ID = "b-06-multistep-rc";
  const toMenu = (a: Attempt) => {
    for (let i = 0; i < 6 && !["PRIMARY_OPTION_MENU", "TSO_COMMAND"].includes(a.sim.state.screen.id); i++) a.pf(3);
  };
  const submit = (a: Attempt, member: string) => {
    toMenu(a);
    a.cmd(`TSO SUBMIT JCL(${member})`);
  };
  const readSysmsg = (a: Attempt, job: string) => {
    a.cmd("=S");
    a.cmd("ST");
    a.enter({ [`cmd:${job}`]: "?" });
    a.enter({ "cmd:JESYSMSG": "S" });
  };
  const fixSort = (a: Attempt, control = "  SORT FIELDS=(1,3,CH,A)") => {
    a.cmd("=2");
    a.enter(entry(`${HLQ}.JCL(RCJOB)`));
    a.enter({ [`line:${a.lineId(/CH A/)}`]: control });
  };

  it("is lesson 35 and advises lesson 34", () => {
    const l = lessonById(ID)!;
    expect(l.number).toBe(35);
    expect(l.requires).toEqual(["b-05-disp"]);
  });

  it("walks the Learn steps in order", () => {
    const c = new Attempt(lessonById(ID)!);
    submit(c, "RCJOB");
    expect(stepId(c)).toBe("read");
    readSysmsg(c, "JOB00001");
    expect(stepId(c)).toBe("fix");
    toMenu(c);
    fixSort(c);
    expect(stepId(c)).toBe("rerun");
    c.enter({ command: "SUBMIT" });
    expect(stepId(c)).toBe("save");
    c.pf(3);
    expect(stepId(c)).toBe("abend");
    submit(c, "ABENDJOB");
    expect(stepId(c)).toBe("compare");
    readSysmsg(c, "JOB00003");
    expect(c.done).toBe(true);
    expect(c.runner.mistakes).toBe(0);
  });

  it("opening the JESYSMSG of the abend job early does not pass the return-code read step", () => {
    const c = learn(ID, (a) => {
      submit(a, "ABENDJOB");
      readSysmsg(a, "JOB00001");
    });
    expect(stepId(c)).toBe("run");
  });

  it("another syntax error in the control statement does not pass the fix step", () => {
    const c = learn(ID, (a) => {
      submit(a, "RCJOB");
      readSysmsg(a, "JOB00001");
      toMenu(a);
      fixSort(a, "  SORT FIELDS=1,3,CH,A");
    });
    expect(stepId(c)).toBe("fix");
  });

  describe("Challenge", () => {
    it("CC 0016, read the log, fix, CC 0000 completes it", () => {
      const c = challenge(ID, (a) => {
        submit(a, "RCJOB");
        readSysmsg(a, "JOB00001");
        toMenu(a);
        fixSort(a);
        a.enter({ command: "SUBMIT" });
        a.pf(3);
      });
      expect(c.done).toBe(true);
    });

    it("fixing without ever reading the job's JESYSMSG does not complete it", () => {
      const c = challenge(ID, (a) => {
        submit(a, "RCJOB");
        fixSort(a);
        a.enter({ command: "SUBMIT" });
        a.pf(3);
      });
      expect(c.done).toBe(false);
    });

    it("reading the log of the abend job instead of RCJOB does not count", () => {
      const c = challenge(ID, (a) => {
        submit(a, "RCJOB");
        submit(a, "ABENDJOB");
        readSysmsg(a, "JOB00002");
        toMenu(a);
        fixSort(a);
        a.enter({ command: "SUBMIT" });
        a.pf(3);
      });
      expect(c.done).toBe(false);
    });

    it("running RCJOB again unchanged does not complete it", () => {
      const c = challenge(ID, (a) => {
        submit(a, "RCJOB");
        readSysmsg(a, "JOB00001");
        submit(a, "RCJOB");
      });
      expect(c.done).toBe(false);
    });
  });
});

describe("b-10-job-troubleshooting", () => {
  const ID = "b-10-job-troubleshooting";
  const FIXES: Record<string, { match: RegExp; text: string }> = {
    FIXJCL: { match: /DIPS/, text: `//OUT      DD  DSN=${HLQ}.TRB.DATA,DISP=(NEW,CATLG),` },
    FIXDSN: { match: /OUT /, text: `//OUT      DD  DSN=${HLQ}.NOTES.TXT,DISP=SHR` },
    FIXPGM: { match: /IEFBR41/, text: "//STEP1    EXEC PGM=IEFBR14" },
    FIXRC: { match: /CH A/, text: "  SORT FIELDS=(1,3,CH,A)" },
  };
  const toMenu = (a: Attempt) => {
    for (let i = 0; i < 6 && !["PRIMARY_OPTION_MENU", "TSO_COMMAND"].includes(a.sim.state.screen.id); i++) a.pf(3);
  };
  const lastJobId = (a: Attempt) => a.sim.state.jes.jobs[a.sim.state.jes.jobs.length - 1].id;
  const submit = (a: Attempt, member: string) => {
    toMenu(a);
    a.cmd(`TSO SUBMIT JCL(${member})`);
  };
  const read = (a: Attempt, job = lastJobId(a)) => {
    a.cmd("=S");
    a.cmd("ST");
    a.enter({ [`cmd:${job}`]: "?" });
    a.enter({ "cmd:JESYSMSG": "S" });
  };
  const fix = (a: Attempt, member: string) => {
    toMenu(a);
    a.cmd("=2");
    a.enter(entry(`${HLQ}.JCL(${member})`));
    a.enter({ [`line:${a.lineId(FIXES[member].match)}`]: FIXES[member].text });
    a.enter({ command: "SUBMIT" });
    a.pf(3);
  };
  const all = (a: Attempt) => {
    for (const m of ["FIXJCL", "FIXDSN", "FIXPGM", "FIXRC"]) {
      submit(a, m);
      read(a);
      fix(a, m);
    }
  };

  it("is lesson 36 and advises lesson 35", () => {
    const l = lessonById(ID)!;
    expect(l.number).toBe(36);
    expect(l.requires).toEqual(["b-06-multistep-rc"]);
  });

  it("creates four faulty jobs for this userid", () => {
    const c = new Attempt(lessonById(ID)!);
    for (const m of Object.keys(FIXES)) expect(getMember(c.sim.state.catalog, `${HLQ}.JCL`, m), m).toBeDefined();
    expect(getMember(c.sim.state.catalog, `${HLQ}.JCL`, "FIXJCL")!.records[0].trimEnd()).toMatch(/^\/\/USER01J\s+JOB/);
  });

  it("each job fails in its own way", () => {
    const c = new Attempt(lessonById(ID)!);
    const seen: Record<string, string> = {};
    for (const m of Object.keys(FIXES)) {
      submit(c, m);
      const j = c.sim.state.jes.jobs[c.sim.state.jes.jobs.length - 1];
      seen[m] = `${j.status}/${j.abend ?? j.maxRc ?? "-"}`;
      c.pf(3); // back to the menu: a second TSO SUBMIT typed into the shell screen is not the menu path
    }
    expect(seen).toEqual({ FIXJCL: "JCL_ERROR/-", FIXDSN: "JCL_ERROR/-", FIXPGM: "OUTPUT/S806", FIXRC: "OUTPUT/16" });
  });

  it("walks the Learn steps in order and finishes with no mistakes", () => {
    const c = new Attempt(lessonById(ID)!);
    const order = ["jcl-read", "jcl-fix", "dsn-read", "dsn-fix", "pgm-read", "pgm-fix", "rc-read", "rc-fix"];
    expect(stepId(c)).toBe(order[0]);
    let n = 0;
    for (const m of ["FIXJCL", "FIXDSN", "FIXPGM", "FIXRC"]) {
      submit(c, m);
      read(c);
      expect(stepId(c)).toBe(order[++n] ?? undefined);
      fix(c, m);
      n++;
      if (n < order.length) expect(stepId(c)).toBe(order[n]);
    }
    expect(c.done).toBe(true);
    expect(c.runner.mistakes).toBe(0);
  });

  it("reading the log of a different job does not pass a read step", () => {
    const c = learn(ID, (a) => {
      submit(a, "FIXDSN");
      read(a);
    });
    expect(stepId(c)).toBe("jcl-read");
  });

  describe("Challenge", () => {
    it("failing, reading and fixing all four completes it (in the given order)", () => {
      expect(challenge(ID, all).done).toBe(true);
    });

    it("any order works", () => {
      const c = challenge(ID, (a) => {
        for (const m of ["FIXRC", "FIXPGM", "FIXDSN", "FIXJCL"]) {
          submit(a, m);
          read(a);
          fix(a, m);
        }
      });
      expect(c.done).toBe(true);
    });

    it("fixing one job less than four does not complete it", () => {
      const c = challenge(ID, (a) => {
        for (const m of ["FIXJCL", "FIXDSN", "FIXPGM"]) {
          submit(a, m);
          read(a);
          fix(a, m);
        }
      });
      expect(c.done).toBe(false);
    });

    it("a job fixed without first running and reading it does not count", () => {
      const c = challenge(ID, (a) => {
        for (const m of ["FIXJCL", "FIXDSN", "FIXPGM"]) {
          submit(a, m);
          read(a);
          fix(a, m);
        }
        fix(a, "FIXRC"); // never run as is, never read
      });
      expect(c.done).toBe(false);
    });

    it("a job that failed and was fixed but whose log was never opened does not count", () => {
      const c = challenge(ID, (a) => {
        for (const m of ["FIXJCL", "FIXDSN", "FIXPGM"]) {
          submit(a, m);
          read(a);
          fix(a, m);
        }
        submit(a, "FIXRC");
        fix(a, "FIXRC");
      });
      expect(c.done).toBe(false);
    });
  });
});
