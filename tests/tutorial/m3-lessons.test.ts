/**
 * M3 foundational lessons: step-by-step behaviour, false-positive checks and accepted alternatives for each new lesson.
 * The generic gates (walk completes, nothing completes from the start, no stale completion, isolation) live in
 * challenge.test.ts and iterate over every lesson, including these.
 */
import { describe, expect, it } from "vitest";
import { getMember } from "@/catalog/catalog";
import { lessonById } from "@/tutorial/lessons";
import { Attempt, type Script } from "./walks";

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

    it("MAX put in the field (not one-time) leaves the field at MAX and does not complete", () => {
      const c = challenge(ID, (a) => {
        open(a);
        a.pf(8, { scroll: "HALF" });
        a.pf(8, { scroll: "MAX" });
      });
      expect(c.done).toBe(false);
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
    expect(c.done).toBe(true);
    expect(c.runner.mistakes).toBe(0);
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
      });
      expect(c.done).toBe(true);
    });

    it("also completes with J on the member list and any TSO command typed on the option line", () => {
      const c = challenge(ID, (a) => {
        a.cmd("TSO TIME");
        a.cmd("=2");
        a.enter(entry(`${HLQ}.JCL`));
        a.enter({ "cmd:HELLO": "J" });
        sdsfOutput(a);
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
